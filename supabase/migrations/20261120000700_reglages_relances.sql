-- Étape 8 : réglages (13b), règlement versionné (R2), relances (A1–A4), pénalités (P5),
-- notifications push (écran 22).

alter table public.notifications add column push_envoye_at timestamptz;
create index notifications_push_en_attente on public.notifications (created_at) where push_envoye_at is null;

-- Ancienneté d'une date/heure en jour calendaire de Dakar.
create function public.jour_dakar(p timestamptz)
returns date
language sql
immutable
set search_path = ''
as $$ select (p at time zone 'Africa/Dakar')::date $$;

-- ---------------------------------------------------------------------------
-- Règlement (R1, R2)
-- ---------------------------------------------------------------------------

-- Crée une nouvelle version du règlement (lignes générées + lignes libres) ; la gérante l'accepte d'office.
create function public.nouvelle_version_reglement(p_tontine_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version integer;
  v_t public.tontines;
begin
  select * into v_t from public.tontines where id = p_tontine_id;
  select coalesce(max(version), 0) + 1 into v_version from public.reglements where tontine_id = p_tontine_id;
  insert into public.reglements (tontine_id, version, lignes)
  values (p_tontine_id, v_version, public.generer_lignes_reglement(p_tontine_id) || v_t.reglement_libres);

  update public.membres set reglement_version_acceptee = v_version, reglement_accepte_at = now()
  where tontine_id = p_tontine_id and profil_id = v_t.gerante_id;

  insert into public.evenements (tontine_id, auteur_id, type, donnees)
  values (p_tontine_id, v_t.gerante_id, 'reglement_modifie', jsonb_build_object('version', v_version));

  perform public.notifier(m.profil_id, p_tontine_id, 'reglement', 'Nouveau règlement',
    '« ' || v_t.nom || ' » : le règlement a changé. Ouvre la tontine pour le lire et l’accepter.')
  from public.membres m where m.tontine_id = p_tontine_id and m.profil_id <> v_t.gerante_id;
  return v_version;
end;
$$;
revoke execute on function public.nouvelle_version_reglement(uuid) from public, anon, authenticated;

-- Réglages de la tontine (13b). Changer la pénalité change le règlement : nouvelle version.
create function public.modifier_reglages(
  p_tontine_id uuid, p_j_moins_3 boolean, p_jour_j boolean, p_j_plus_1 boolean, p_penalite integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ancienne integer;
begin
  perform public.exiger_gerante(p_tontine_id);
  if p_penalite is null or p_penalite < 0 or p_penalite > 1000000 then
    raise exception 'penalite_invalide' using errcode = '22023';
  end if;
  select penalite_retard into v_ancienne from public.tontines where id = p_tontine_id for update;
  update public.tontines
  set relance_j_moins_3 = p_j_moins_3, relance_jour_j = p_jour_j, relance_j_plus_1 = p_j_plus_1,
      penalite_retard = p_penalite
  where id = p_tontine_id;
  if v_ancienne is distinct from p_penalite then
    perform public.nouvelle_version_reglement(p_tontine_id);
  end if;
end;
$$;
revoke execute on function public.modifier_reglages(uuid, boolean, boolean, boolean, integer) from public, anon;
grant execute on function public.modifier_reglages(uuid, boolean, boolean, boolean, integer) to authenticated;

-- Lignes libres ajoutées par la gérante (R1) → nouvelle version à accepter (R2).
create function public.modifier_reglement(p_tontine_id uuid, p_lignes_libres text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lignes text[];
begin
  perform public.exiger_gerante(p_tontine_id);
  select coalesce(array_agg(btrim(l)) filter (where btrim(l) <> ''), '{}') into v_lignes
  from unnest(coalesce(p_lignes_libres, '{}')) l;
  if exists (select 1 from unnest(v_lignes) l where char_length(l) > 200) or coalesce(array_length(v_lignes, 1), 0) > 10 then
    raise exception 'reglement_invalide' using errcode = '22023';
  end if;
  update public.tontines set reglement_libres = v_lignes where id = p_tontine_id;
  return public.nouvelle_version_reglement(p_tontine_id);
end;
$$;
revoke execute on function public.modifier_reglement(uuid, text[]) from public, anon;
grant execute on function public.modifier_reglement(uuid, text[]) to authenticated;

-- R2 : un membre accepte la dernière version du règlement.
create function public.accepter_reglement(p_tontine_id uuid, p_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membre uuid;
begin
  select id into v_membre from public.membres where tontine_id = p_tontine_id and profil_id = auth.uid();
  if v_membre is null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  if p_version is distinct from (select max(version) from public.reglements where tontine_id = p_tontine_id) then
    raise exception 'reglement_change' using errcode = 'P0001';
  end if;
  update public.membres set reglement_version_acceptee = p_version, reglement_accepte_at = now()
  where id = v_membre;
  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees)
  values (p_tontine_id, v_membre, auth.uid(), 'reglement_accepte', jsonb_build_object('version', p_version));
end;
$$;
revoke execute on function public.accepter_reglement(uuid, integer) from public, anon;
grant execute on function public.accepter_reglement(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Relances et pénalités
-- ---------------------------------------------------------------------------

-- Première cotisation non payée de chaque membre, avec son échéance.
create function public.cotisations_dues(p_tontine_id uuid)
returns table (membre_id uuid, profil_id uuid, cotisation_id uuid, tour_id uuid, echeance date, statut public.statut_cotisation)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (m.id) m.id, m.profil_id, c.id, tr.id, tr.echeance, c.statut
  from public.membres m
  join public.cotisations c on c.membre_id = m.id
  join public.tours tr on tr.id = c.tour_id
  where m.tontine_id = p_tontine_id and c.statut <> 'paye'
  order by m.id, tr.numero
$$;
revoke execute on function public.cotisations_dues(uuid) from public, anon, authenticated;

-- A4 : relance immédiate par la gérante ; au plus une relance manuelle par membre et par jour.
-- Sans membre précisé : tous les retardataires (rien déclaré et échéance passée).
create function public.relancer(p_tontine_id uuid, p_membre_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_t public.tontines;
  v_aujourdhui date := public.aujourdhui_dakar();
  v_nb integer := 0;
  d record;
begin
  perform public.exiger_gerante(p_tontine_id);
  select * into v_t from public.tontines where id = p_tontine_id;

  if p_membre_id is not null and exists (
    select 1 from public.evenements e
    where e.tontine_id = p_tontine_id and e.membre_id = p_membre_id and e.type = 'relance'
      and (e.donnees ->> 'manuelle')::boolean and public.jour_dakar(e.created_at) = v_aujourdhui
  ) then
    raise exception 'deja_relance_aujourdhui' using errcode = 'P0001';
  end if;

  for d in
    select * from public.cotisations_dues(p_tontine_id) x
    where x.profil_id <> v_t.gerante_id
      and x.statut = 'a_payer'
      and (case when p_membre_id is null then x.echeance < v_aujourdhui else x.membre_id = p_membre_id end)
      and not exists (
        select 1 from public.evenements e
        where e.tontine_id = p_tontine_id and e.membre_id = x.membre_id and e.type = 'relance'
          and (e.donnees ->> 'manuelle')::boolean and public.jour_dakar(e.created_at) = v_aujourdhui
      )
  loop
    insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees)
    values (p_tontine_id, d.membre_id, auth.uid(), 'relance',
            jsonb_build_object('manuelle', true, 'cotisation_id', d.cotisation_id));
    perform public.notifier(d.profil_id, p_tontine_id, 'relance',
      case when d.echeance < v_aujourdhui then 'Paiement en retard' else 'Rappel de paiement' end,
      '« ' || v_t.nom || ' » : ' || public.format_montant(v_t.montant) || ' à payer à ta gérante'
      || case when d.echeance < v_aujourdhui then '.' else ' avant le ' || to_char(d.echeance, 'DD/MM') || '.' end);
    v_nb := v_nb + 1;
  end loop;

  if p_membre_id is not null and v_nb = 0 then
    raise exception 'rien_a_relancer' using errcode = 'P0001';
  end if;
  return v_nb;
end;
$$;
revoke execute on function public.relancer(uuid, uuid) from public, anon;
grant execute on function public.relancer(uuid, uuid) to authenticated;

-- P5 : la gérante annule une pénalité (événement enregistré).
create function public.annuler_penalite(p_evenement_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_e public.evenements;
begin
  select * into v_e from public.evenements where id = p_evenement_id and type = 'penalite';
  if v_e.id is null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  perform public.exiger_gerante(v_e.tontine_id);
  if exists (select 1 from public.evenements where type = 'penalite_annulee' and donnees ->> 'penalite_id' = v_e.id::text) then
    raise exception 'deja_annulee' using errcode = 'P0001';
  end if;
  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees)
  values (v_e.tontine_id, v_e.membre_id, auth.uid(), 'penalite_annulee',
          jsonb_build_object('penalite_id', v_e.id, 'montant', v_e.donnees -> 'montant'));
  perform public.notifier(m.profil_id, v_e.tontine_id, 'penalite_annulee', 'Pénalité annulée',
    'Ta gérante a annulé ta pénalité de ' || public.format_montant((v_e.donnees ->> 'montant')::integer) || '.')
  from public.membres m where m.id = v_e.membre_id;
end;
$$;
revoke execute on function public.annuler_penalite(uuid) from public, anon;
grant execute on function public.annuler_penalite(uuid) to authenticated;

-- A1–A3 et P5 : relances automatiques du jour (9 h, Dakar) et pénalités.
-- Appelée chaque matin par pg_cron (via l'Edge Function « relances »). Idempotente.
create function public.preparer_relances(p_jour date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jour date := coalesce(p_jour, public.aujourdhui_dakar());
  v_relances integer := 0;
  v_penalites integer := 0;
  v_recaps integer := 0;
  r record;
begin
  perform public.demarrer_tontines();

  -- Relances J-3, J, J+1 : membres qui n'ont rien déclaré.
  for r in
    select t.id as tontine_id, t.nom, t.montant, tr.id as tour_id, tr.echeance, m.id as membre_id, m.profil_id,
           case tr.echeance - v_jour when 3 then 'j-3' when 0 then 'j' else 'j+1' end as moment
    from public.tontines t
    join public.tours tr on tr.tontine_id = t.id
    join public.cotisations c on c.tour_id = tr.id
    join public.membres m on m.id = c.membre_id
    where t.statut <> 'terminee'
      and c.statut = 'a_payer'
      and m.profil_id <> t.gerante_id
      and ((tr.echeance = v_jour + 3 and t.relance_j_moins_3)
        or (tr.echeance = v_jour and t.relance_jour_j)
        or (tr.echeance = v_jour - 1 and t.relance_j_plus_1))
      and not exists (
        select 1 from public.evenements e
        where e.tontine_id = t.id and e.membre_id = m.id and e.type = 'relance'
          and e.donnees ->> 'tour_id' = tr.id::text
          and e.donnees ->> 'moment' = case tr.echeance - v_jour when 3 then 'j-3' when 0 then 'j' else 'j+1' end
      )
  loop
    insert into public.evenements (tontine_id, membre_id, type, donnees)
    values (r.tontine_id, r.membre_id, 'relance',
            jsonb_build_object('manuelle', false, 'moment', r.moment, 'tour_id', r.tour_id));
    perform public.notifier(r.profil_id, r.tontine_id, 'relance',
      case r.moment when 'j+1' then 'Paiement en retard' else 'Rappel de paiement' end,
      '« ' || r.nom || ' » : ' || public.format_montant(r.montant) ||
      case r.moment
        when 'j-3' then ' à payer avant le ' || to_char(r.echeance, 'DD/MM') || '.'
        when 'j' then ' à payer aujourd’hui.'
        else ' à payer. L’échéance était hier.' end);
    v_relances := v_relances + 1;
  end loop;

  -- A3 : J+1, récapitulatif des retards à la gérante (un par tour).
  for r in
    select t.id as tontine_id, t.nom, t.gerante_id, tr.id as tour_id,
           string_agg(p.prenom, ', ' order by m.rang) as prenoms, count(*) as nb
    from public.tontines t
    join public.tours tr on tr.tontine_id = t.id and tr.echeance = v_jour - 1
    join public.cotisations c on c.tour_id = tr.id and c.statut = 'a_payer'
    join public.membres m on m.id = c.membre_id and m.profil_id <> t.gerante_id
    join public.profils p on p.id = m.profil_id
    where t.statut <> 'terminee' and t.relance_j_plus_1
      and not exists (
        select 1 from public.notifications n
        where n.profil_id = t.gerante_id and n.tontine_id = t.id and n.type = 'recap_retards'
          and public.jour_dakar(n.created_at) = v_jour
      )
    group by t.id, t.nom, t.gerante_id, tr.id
  loop
    perform public.notifier(r.gerante_id, r.tontine_id, 'recap_retards',
      case when r.nb > 1 then r.nb || ' paiements en retard' else '1 paiement en retard' end,
      '« ' || r.nom || ' » : ' || r.prenoms || '.');
    v_recaps := v_recaps + 1;
  end loop;

  -- P5 : pénalités, une par membre et par tour en retard (déclaration après l'échéance, ou rien déclaré).
  for r in
    select t.id as tontine_id, t.nom, t.penalite_retard, tr.id as tour_id, tr.numero, m.id as membre_id, m.profil_id
    from public.tontines t
    join public.tours tr on tr.tontine_id = t.id
    join public.cotisations c on c.tour_id = tr.id
    join public.membres m on m.id = c.membre_id
    where t.statut <> 'terminee' and t.penalite_retard > 0
      and m.profil_id <> t.gerante_id
      and tr.echeance < v_jour
      and (
        (c.declare_at is not null and public.jour_dakar(c.declare_at) > tr.echeance)
        or (c.declare_at is null and c.statut = 'paye' and public.jour_dakar(c.paye_at) > tr.echeance)
        or (c.declare_at is null and c.statut = 'a_payer')
      )
      and not exists (
        select 1 from public.evenements e
        where e.tontine_id = t.id and e.membre_id = m.id and e.type = 'penalite'
          and e.donnees ->> 'tour_id' = tr.id::text
      )
  loop
    insert into public.evenements (tontine_id, membre_id, type, donnees)
    values (r.tontine_id, r.membre_id, 'penalite',
            jsonb_build_object('montant', r.penalite_retard, 'tour_id', r.tour_id, 'tour', r.numero));
    perform public.notifier(r.profil_id, r.tontine_id, 'penalite', 'Pénalité de retard',
      '« ' || r.nom || ' » : pénalité de ' || public.format_montant(r.penalite_retard) || ' pour le tour ' || r.numero || '.');
    v_penalites := v_penalites + 1;
  end loop;

  return jsonb_build_object('jour', v_jour, 'relances', v_relances, 'recapitulatifs', v_recaps, 'penalites', v_penalites);
end;
$$;
revoke execute on function public.preparer_relances(date) from public, anon, authenticated;
grant execute on function public.preparer_relances(date) to service_role;

-- Pour l'Edge Function « push » : notifications à envoyer, avec le jeton Expo.
create function public.notifications_a_pousser(p_limite integer default 500)
returns table (id uuid, jeton text, titre text, corps text, tontine_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, p.expo_push_token, n.titre, n.corps, n.tontine_id
  from public.notifications n
  join public.profils p on p.id = n.profil_id
  where n.push_envoye_at is null and n.created_at > now() - interval '2 days'
  order by n.created_at
  limit p_limite
$$;
revoke execute on function public.notifications_a_pousser(integer) from public, anon, authenticated;
grant execute on function public.notifications_a_pousser(integer) to service_role;

create function public.marquer_pousses(p_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$ update public.notifications set push_envoye_at = now() where id = any (p_ids) $$;
revoke execute on function public.marquer_pousses(uuid[]) from public, anon, authenticated;
grant execute on function public.marquer_pousses(uuid[]) to service_role;

-- ---------------------------------------------------------------------------
-- Planification (pg_cron + pg_net). Les appels HTTP lisent l'URL du projet et la clé
-- service_role dans Vault (secrets « project_url » et « service_role_key ») ;
-- sans ces secrets (développement local), les appels sont simplement ignorés.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

create function public.appeler_fonction(p_nom text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_cle text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_cle from vault.decrypted_secrets where name = 'service_role_key';
  if v_url is null or v_cle is null then
    raise notice 'Secrets Vault absents : appel de % ignoré.', p_nom;
    return;
  end if;
  perform net.http_post(
    url := v_url || '/functions/v1/' || p_nom,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_cle),
    body := '{}'::jsonb
  );
end;
$$;
revoke execute on function public.appeler_fonction(text) from public, anon, authenticated;

-- 9 h à Dakar = 9 h UTC (pas d'heure d'été au Sénégal).
select cron.schedule('natt-relances-9h', '0 9 * * *', $$select public.appeler_fonction('relances')$$);
-- Envoi des notifications push en attente, toutes les minutes.
select cron.schedule('natt-push', '* * * * *', $$select public.appeler_fonction('push')$$);
