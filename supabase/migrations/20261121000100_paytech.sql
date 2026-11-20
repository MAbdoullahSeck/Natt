-- Point 2 : paiement des abonnements avec PayTech (remplace l'activation manuelle de B5).
-- Aucun paiement dans l'app (règles Play Store) : la gérante reçoit un lien signé hors de l'app
-- (push), qui ouvre l'Edge Function paytech-checkout puis la page PayTech. PayTech confirme
-- par l'IPN (Edge Function paytech-ipn), qui active ou prolonge l'abonnement.

-- ---------------------------------------------------------------------------
-- Journal : événements liés à un compte (abonnement) et non à une tontine.
-- ---------------------------------------------------------------------------
alter table public.evenements alter column tontine_id drop not null;
alter table public.evenements drop constraint evenements_type_check;
alter table public.evenements add constraint evenements_type_check check (
  type in (
    'declaration', 'confirmation', 'relance', 'penalite', 'penalite_annulee',
    'tirage', 'echange', 'reglement_accepte', 'membre_rejoint', 'cycle_termine',
    'versement', 'reglement_modifie', 'membre_retire',
    'abonnement_paye', 'abonnement_paiement_annule'
  )
);
-- Un événement sans tontine doit concerner un compte.
alter table public.evenements add constraint evenements_tontine_ou_auteur
  check (tontine_id is not null or auteur_id is not null);

-- ---------------------------------------------------------------------------
-- Tarifs (B1) : annuel = 10 mois (« 2 mois offerts »).
-- ---------------------------------------------------------------------------
create function public.prix_abonnement(p_palier public.palier, p_periodicite text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_palier when 'starter' then 1000 when 'pro' then 2500 else 5000 end
         * case p_periodicite when 'annuel' then 10 else 1 end
$$;

-- ---------------------------------------------------------------------------
-- Paiements
-- ---------------------------------------------------------------------------
create table public.paiements_abonnement (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references public.profils (id),
  palier public.palier not null,
  periodicite text not null check (periodicite in ('mensuel', 'annuel')),
  montant integer not null check (montant > 0),
  ref_command text not null unique,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'reussi', 'annule')),
  moyen text,
  token_paytech text,
  abonnement_id uuid references public.abonnements (id),
  donnees_ipn jsonb,
  created_at timestamptz not null default now(),
  paye_at timestamptz,
  annule_at timestamptz
);
create index paiements_abonnement_profil on public.paiements_abonnement (profil_id, created_at desc);
alter table public.paiements_abonnement enable row level security;
revoke all on public.paiements_abonnement from anon;
revoke insert, update, delete, truncate on public.paiements_abonnement from authenticated;
create policy "paiements_abonnement : lecture des siens" on public.paiements_abonnement
  for select to authenticated
  using (profil_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Liens de paiement signés : HMAC-SHA256(gérante|palier|périodicité|expiration) avec un secret
-- tiré au hasard à l'installation et gardé dans Vault (jamais dans le dépôt).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'lien_paiement_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'lien_paiement_secret',
      'Signature des liens de paiement des abonnements (PayTech)');
  end if;
end;
$$;

create function public.signature_lien_paiement(p_profil_id uuid, p_palier text, p_periodicite text, p_expire bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(extensions.hmac(
    p_profil_id::text || '|' || p_palier || '|' || p_periodicite || '|' || p_expire::text,
    (select decrypted_secret from vault.decrypted_secrets where name = 'lien_paiement_secret'),
    'sha256'), 'hex')
$$;
revoke execute on function public.signature_lien_paiement(uuid, text, text, bigint) from public, anon, authenticated;

create function public.url_projet()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'project_url'), 'http://127.0.0.1:54321')
$$;
revoke execute on function public.url_projet() from public, anon, authenticated;

-- Lien vers paytech-checkout, valable 7 jours par défaut.
create function public.lien_paiement(
  p_profil_id uuid, p_palier public.palier, p_periodicite text, p_validite interval default interval '7 days'
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  with e as (select extract(epoch from now() + p_validite)::bigint as expire)
  select public.url_projet() || '/functions/v1/paytech-checkout'
    || '?g=' || p_profil_id || '&p=' || p_palier || '&d=' || p_periodicite || '&e=' || e.expire
    || '&s=' || public.signature_lien_paiement(p_profil_id, p_palier::text, p_periodicite, e.expire)
  from e
$$;
revoke execute on function public.lien_paiement(uuid, public.palier, text, interval) from public, anon, authenticated;

-- Vérifie un lien reçu par paytech-checkout et crée la commande (service_role uniquement).
create function public.creer_paiement_abonnement(
  p_profil_id uuid, p_palier text, p_periodicite text, p_expire bigint, p_signature text
)
returns public.paiements_abonnement
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p public.paiements_abonnement;
begin
  if p_palier not in ('starter', 'pro', 'illimite') or p_periodicite not in ('mensuel', 'annuel') then
    raise exception 'lien_invalide' using errcode = '22023';
  end if;
  if p_signature is distinct from public.signature_lien_paiement(p_profil_id, p_palier, p_periodicite, p_expire) then
    raise exception 'lien_invalide' using errcode = '42501';
  end if;
  if p_expire < extract(epoch from now()) then
    raise exception 'lien_expire' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profils where id = p_profil_id and consentement_retire_at is null) then
    raise exception 'lien_invalide' using errcode = '42501';
  end if;

  insert into public.paiements_abonnement (profil_id, palier, periodicite, montant, ref_command)
  values (p_profil_id, p_palier::public.palier, p_periodicite,
          public.prix_abonnement(p_palier::public.palier, p_periodicite),
          'NATT-' || to_char(now() at time zone 'Africa/Dakar', 'YYYYMMDD') || '-'
            || upper(encode(extensions.gen_random_bytes(5), 'hex')))
  returning * into v_p;
  return v_p;
end;
$$;
revoke execute on function public.creer_paiement_abonnement(uuid, text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.creer_paiement_abonnement(uuid, text, text, bigint, text) to service_role;

create function public.enregistrer_token_paytech(p_paiement_id uuid, p_token text)
returns void
language sql
security definer
set search_path = ''
as $$ update public.paiements_abonnement set token_paytech = p_token where id = p_paiement_id $$;
revoke execute on function public.enregistrer_token_paytech(uuid, text) from public, anon, authenticated;
grant execute on function public.enregistrer_token_paytech(uuid, text) to service_role;

-- Nouvelle date d'expiration : à partir de la fin de l'abonnement actif (prolongation) ou de maintenant.
create function public.nouvelle_expiration(p_fin_actuelle timestamptz, p_periodicite text, p_maintenant timestamptz default now())
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select greatest(p_maintenant, coalesce(p_fin_actuelle, p_maintenant))
       + case p_periodicite when 'annuel' then interval '12 months' else interval '1 month' end
$$;

-- IPN PayTech (après vérification de l'authenticité dans l'Edge Function) : idempotent.
-- Renvoie 'active', 'doublon', 'annule' ou lève 'commande_inconnue'.
create function public.traiter_ipn_paytech(
  p_ref_command text, p_evenement text, p_moyen text, p_donnees jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p public.paiements_abonnement;
  v_fin timestamptz;
  v_abonnement public.abonnements;
begin
  select * into v_p from public.paiements_abonnement where ref_command = p_ref_command for update;
  if v_p.id is null then
    raise exception 'commande_inconnue' using errcode = 'P0001';
  end if;
  if v_p.statut <> 'en_attente' then
    return 'doublon';
  end if;

  if p_evenement = 'sale_canceled' then
    update public.paiements_abonnement
    set statut = 'annule', annule_at = now(), moyen = p_moyen, donnees_ipn = p_donnees
    where id = v_p.id;
    insert into public.evenements (auteur_id, type, donnees)
    values (v_p.profil_id, 'abonnement_paiement_annule',
            jsonb_build_object('ref_command', v_p.ref_command, 'palier', v_p.palier, 'montant', v_p.montant));
    return 'annule';
  end if;
  if p_evenement is distinct from 'sale_complete' then
    raise exception 'evenement_inconnu' using errcode = '22023';
  end if;

  select max(expire_at) into v_fin from public.abonnements
  where profil_id = v_p.profil_id and statut = 'actif' and (expire_at is null or expire_at > now());
  update public.abonnements set statut = 'expire'
  where profil_id = v_p.profil_id and statut in ('actif', 'en_attente');
  insert into public.abonnements (profil_id, palier, periodicite, statut, expire_at)
  values (v_p.profil_id, v_p.palier, v_p.periodicite, 'actif', public.nouvelle_expiration(v_fin, v_p.periodicite))
  returning * into v_abonnement;

  update public.paiements_abonnement
  set statut = 'reussi', paye_at = now(), moyen = p_moyen, donnees_ipn = p_donnees, abonnement_id = v_abonnement.id
  where id = v_p.id;

  insert into public.evenements (auteur_id, type, donnees)
  values (v_p.profil_id, 'abonnement_paye',
          jsonb_build_object('ref_command', v_p.ref_command, 'palier', v_p.palier, 'periodicite', v_p.periodicite,
                             'montant', v_p.montant, 'moyen', p_moyen, 'expire_at', v_abonnement.expire_at));

  perform public.notifier(v_p.profil_id, null, 'abonnement', 'Abonnement activé',
    'Merci ! Ton abonnement ' || initcap(v_p.palier::text) || ' est actif jusqu’au '
    || to_char(v_abonnement.expire_at at time zone 'Africa/Dakar', 'DD/MM/YYYY') || '.');
  return 'active';
end;
$$;
revoke execute on function public.traiter_ipn_paytech(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.traiter_ipn_paytech(text, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Envoi du lien hors de l'app : notification (et push) avec le lien dans `donnees.url`.
-- ---------------------------------------------------------------------------
create function public.envoyer_lien_paiement(p_profil_id uuid, p_palier public.palier, p_periodicite text, p_raison text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_prix text := public.format_montant(public.prix_abonnement(p_palier, p_periodicite))
                 || case p_periodicite when 'annuel' then ' par an' else ' par mois' end;
  v_nom text := initcap(p_palier::text);
begin
  insert into public.notifications (profil_id, type, titre, corps, donnees)
  values (
    p_profil_id, 'abonnement_lien',
    case p_raison
      when 'inscription' then 'Bienvenue sur Natt'
      when 'expiration' then 'Ton abonnement se termine bientôt'
      else 'Passer à ' || v_nom end,
    case p_raison
      when 'inscription' then 'Rejoindre une tontine est gratuit. Pour gérer ta tontine, active l’abonnement '
                               || v_nom || ' (' || v_prix || ') : touche cette notification pour payer.'
      when 'expiration' then 'Ton abonnement ' || v_nom || ' se termine dans 5 jours. Touche cette notification pour le prolonger ('
                               || v_prix || ').'
      else 'Pour gérer plus de tontines, passe à ' || v_nom || ' (' || v_prix || ') : touche cette notification pour payer.' end,
    jsonb_build_object('url', public.lien_paiement(p_profil_id, p_palier, p_periodicite),
                       'palier', p_palier, 'periodicite', p_periodicite, 'raison', p_raison)
  )
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.envoyer_lien_paiement(uuid, public.palier, text, text) from public, anon, authenticated;

-- B3 : limite atteinte → lien vers le palier supérieur (au plus un envoi par jour).
create function public.demander_lien_palier_superieur()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actuel public.palier;
  v_suivant public.palier;
begin
  if auth.uid() is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  select palier into v_actuel from public.abonnements
  where profil_id = auth.uid() and statut = 'actif' and (expire_at is null or expire_at > now())
  order by case palier when 'illimite' then 3 when 'pro' then 2 else 1 end desc limit 1;
  v_suivant := case v_actuel when 'starter' then 'pro' when 'pro' then 'illimite' when 'illimite' then null else 'starter' end;
  if v_suivant is null then
    return false;
  end if;
  if exists (
    select 1 from public.notifications
    where profil_id = auth.uid() and type = 'abonnement_lien' and donnees ->> 'palier' = v_suivant::text
      and public.jour_dakar(created_at) = public.aujourdhui_dakar()
  ) then
    return false;
  end if;
  perform public.envoyer_lien_paiement(auth.uid(), v_suivant, 'mensuel', 'limite');
  return true;
end;
$$;
revoke execute on function public.demander_lien_palier_superieur() from public, anon;
grant execute on function public.demander_lien_palier_superieur() to authenticated;

-- J-5 avant expiration (appelée par preparer_relances chaque matin) : un envoi par abonnement.
create function public.envoyer_liens_expiration(p_jour date default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jour date := coalesce(p_jour, public.aujourdhui_dakar());
  v_nb integer := 0;
  a record;
begin
  for a in
    select distinct on (ab.profil_id) ab.profil_id, ab.palier, ab.periodicite
    from public.abonnements ab
    join public.profils p on p.id = ab.profil_id and p.consentement_retire_at is null
    where ab.statut = 'actif' and ab.expire_at is not null
      and public.jour_dakar(ab.expire_at) = v_jour + 5
      and not exists (
        select 1 from public.notifications n
        where n.profil_id = ab.profil_id and n.type = 'abonnement_lien' and n.donnees ->> 'raison' = 'expiration'
          and n.created_at > now() - interval '7 days'
      )
    order by ab.profil_id, ab.expire_at desc
  loop
    perform public.envoyer_lien_paiement(a.profil_id, a.palier, a.periodicite, 'expiration');
    v_nb := v_nb + 1;
  end loop;
  return v_nb;
end;
$$;
revoke execute on function public.envoyer_liens_expiration(date) from public, anon, authenticated;

-- preparer_relances : ajoute les liens J-5 (le reste est inchangé, appelé tel quel).
create function public.preparer_relances_et_abonnements(p_jour date default null)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.preparer_relances(p_jour) || jsonb_build_object('liens_abonnement', public.envoyer_liens_expiration(p_jour))
$$;
revoke execute on function public.preparer_relances_et_abonnements(date) from public, anon, authenticated;
grant execute on function public.preparer_relances_et_abonnements(date) to service_role;

-- À l'inscription : lien Starter mensuel.
create or replace function public.creer_profil(p_prenom text, p_consentement_version text)
returns public.profils
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tel text;
  v_prenom text := btrim(p_prenom);
  v_profil public.profils;
  v_nouveau boolean;
begin
  if v_uid is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  if char_length(v_prenom) not between 2 and 30 then
    raise exception 'prenom_invalide' using errcode = '22023';
  end if;
  if coalesce(btrim(p_consentement_version), '') = '' then
    raise exception 'consentement_requis' using errcode = '22023';
  end if;
  select u.phone into v_tel from auth.users u where u.id = v_uid;
  if v_tel is null then
    raise exception 'telephone_inconnu' using errcode = '22023';
  end if;
  v_nouveau := not exists (select 1 from public.profils where id = v_uid);

  insert into public.profils (id, prenom, telephone, consentement_at, consentement_version)
  values (v_uid, v_prenom, v_tel, now(), p_consentement_version)
  on conflict (id) do update
    set prenom = excluded.prenom,
        consentement_at = excluded.consentement_at,
        consentement_version = excluded.consentement_version
  returning * into v_profil;

  if v_nouveau then
    perform public.envoyer_lien_paiement(v_uid, 'starter', 'mensuel', 'inscription');
  end if;
  return v_profil;
end;
$$;

-- La demande manuelle « en attente » (B5 provisoire) est remplacée par PayTech.
drop function public.demander_abonnement(public.palier, text);

-- Push : les notifications sans jeton ne sont abandonnées qu'après 10 minutes
-- (le jeton est enregistré juste après l'inscription).
drop function public.notifications_a_pousser(integer);
create function public.notifications_a_pousser(p_limite integer default 500)
returns table (id uuid, jeton text, titre text, corps text, tontine_id uuid, type text, donnees jsonb, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, p.expo_push_token, n.titre, n.corps, n.tontine_id, n.type, n.donnees, n.created_at
  from public.notifications n
  join public.profils p on p.id = n.profil_id
  where n.push_envoye_at is null and n.created_at > now() - interval '2 days'
  order by n.created_at
  limit p_limite
$$;
revoke execute on function public.notifications_a_pousser(integer) from public, anon, authenticated;
grant execute on function public.notifications_a_pousser(integer) to service_role;
