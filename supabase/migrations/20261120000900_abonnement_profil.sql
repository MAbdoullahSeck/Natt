-- Étape 10 : abonnement de la gérante (B1–B5) et profil (écrans 20, 21, 23), retrait du consentement (D2).

-- B5 (décision en attente) : la gérante choisit un palier → abonnement « en_attente ».
-- Après réception de son paiement (Wave), l'équipe Natt l'active à la main :
--   select public.activer_abonnement('<id>');   (tableau de bord Supabase, rôle service)
create function public.demander_abonnement(p_palier public.palier, p_periodicite text)
returns public.abonnements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_a public.abonnements;
begin
  if auth.uid() is null or not exists (select 1 from public.profils where id = auth.uid()) then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  if p_periodicite not in ('mensuel', 'annuel') then
    raise exception 'periodicite_invalide' using errcode = '22023';
  end if;
  -- Une seule demande en attente à la fois : on la remplace.
  update public.abonnements set palier = p_palier, periodicite = p_periodicite, created_at = now()
  where profil_id = auth.uid() and statut = 'en_attente'
  returning * into v_a;
  if v_a.id is null then
    insert into public.abonnements (profil_id, palier, periodicite, statut)
    values (auth.uid(), p_palier, p_periodicite, 'en_attente')
    returning * into v_a;
  end if;
  return v_a;
end;
$$;
revoke execute on function public.demander_abonnement(public.palier, text) from public, anon;
grant execute on function public.demander_abonnement(public.palier, text) to authenticated;

-- Activation manuelle (équipe Natt). Prolonge à partir de la fin de l'abonnement actif s'il y en a un.
create function public.activer_abonnement(p_abonnement_id uuid)
returns public.abonnements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_a public.abonnements;
  v_depart timestamptz;
begin
  select * into v_a from public.abonnements where id = p_abonnement_id for update;
  if v_a.id is null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  select greatest(now(), coalesce(max(expire_at), now())) into v_depart
  from public.abonnements
  where profil_id = v_a.profil_id and statut = 'actif' and id <> v_a.id;
  -- Les anciens abonnements actifs sont remplacés par le nouveau.
  update public.abonnements set statut = 'expire'
  where profil_id = v_a.profil_id and statut = 'actif' and id <> v_a.id;
  update public.abonnements
  set statut = 'actif',
      expire_at = v_depart + case v_a.periodicite when 'annuel' then interval '1 year' else interval '1 month' end
  where id = v_a.id
  returning * into v_a;
  perform public.notifier(v_a.profil_id, null, 'abonnement', 'Abonnement activé',
    'Ton abonnement ' || initcap(v_a.palier::text) || ' est actif jusqu’au ' || to_char(v_a.expire_at, 'DD/MM/YYYY') || '.');
  return v_a;
end;
$$;
revoke execute on function public.activer_abonnement(uuid) from public, anon, authenticated;
grant execute on function public.activer_abonnement(uuid) to service_role;

-- Expiration quotidienne.
create function public.expirer_abonnements()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nb integer;
begin
  update public.abonnements set statut = 'expire'
  where statut = 'actif' and expire_at is not null and expire_at < now();
  get diagnostics v_nb = row_count;
  return v_nb;
end;
$$;
revoke execute on function public.expirer_abonnements() from public, anon, authenticated;
select cron.schedule('natt-expiration-abonnements', '5 0 * * *', $$select public.expirer_abonnements()$$);

-- ---------------------------------------------------------------------------
-- D2 : retrait du consentement. Le compte est désactivé, le prénom et le numéro sont effacés ;
-- l'historique financier des tontines est conservé (anonymisé : « Ancien membre »).
-- ---------------------------------------------------------------------------
alter table public.profils add column consentement_retire_at timestamptz;

create function public.retirer_consentement()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  update public.profils
  set prenom = 'Ancien membre',
      telephone = 'supprime-' || v_uid::text,
      expo_push_token = null,
      consentement_retire_at = now()
  where id = v_uid;
  delete from public.notifications where profil_id = v_uid;
  -- Compte Auth : numéro effacé, connexion bloquée.
  update auth.users
  set phone = null, phone_confirmed_at = null, banned_until = 'infinity', raw_user_meta_data = '{}'
  where id = v_uid;
  delete from auth.identities where user_id = v_uid;
  delete from auth.sessions where user_id = v_uid;
end;
$$;
revoke execute on function public.retirer_consentement() from public, anon;
grant execute on function public.retirer_consentement() to authenticated;
