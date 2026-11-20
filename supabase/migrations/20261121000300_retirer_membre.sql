-- Point 6 : retirer un membre (gérante).
-- Un membre n'est jamais supprimé (le journal en ajout seul garde son historique) : il est marqué
-- « retiré » (retire_at). Toutes les fonctions qui listent ou comptent les membres ignorent désormais
-- les membres retirés (définitions reprises à l'identique, avec ce seul filtre en plus).

alter table public.membres add column retire_at timestamptz;
create index membres_actifs on public.membres (tontine_id) where retire_at is null;

alter table public.evenements drop constraint evenements_type_check;
alter table public.evenements add constraint evenements_type_check check (
  type in (
    'declaration', 'confirmation', 'relance', 'penalite', 'penalite_annulee',
    'tirage', 'echange', 'reglement_accepte', 'membre_rejoint', 'cycle_termine',
    'versement', 'reglement_modifie', 'membre_retire',
    'abonnement_paye', 'abonnement_paiement_annule'
  )
);

CREATE OR REPLACE FUNCTION public.est_membre(p_tontine_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.membres m
    where m.tontine_id = p_tontine_id and m.profil_id = (select auth.uid()) and m.retire_at is null
  ) or exists (
    select 1 from public.tontines t
    where t.id = p_tontine_id and t.gerante_id = (select auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.partage_une_tontine(p_profil_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.membres moi
    join public.membres autre on autre.tontine_id = moi.tontine_id
    where moi.profil_id = (select auth.uid()) and autre.profil_id = p_profil_id
      and moi.retire_at is null and autre.retire_at is null
  );
$function$;

CREATE OR REPLACE FUNCTION public.ajouter_membre(p_tontine_id uuid, p_profil_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_rang integer;
  v_version integer;
  v_membre uuid;
begin
  select min(n) into v_rang
  from generate_series(1, (select nb_membres from public.tontines where id = p_tontine_id)) n
  where not exists (select 1 from public.membres m where m.tontine_id = p_tontine_id and m.rang = n and m.retire_at is null);
  if v_rang is null then
    raise exception 'tontine_complete' using errcode = 'P0001';
  end if;

  select max(version) into v_version from public.reglements where tontine_id = p_tontine_id;

  -- Une personne retirée qui revient retrouve sa ligne (l'historique reste attaché au même membre).
  update public.membres
  set retire_at = null, rang = v_rang, reglement_version_acceptee = v_version, reglement_accepte_at = now()
  where tontine_id = p_tontine_id and profil_id = p_profil_id and retire_at is not null
  returning id into v_membre;
  if v_membre is null then
    insert into public.membres (tontine_id, profil_id, rang, reglement_version_acceptee, reglement_accepte_at)
    values (p_tontine_id, p_profil_id, v_rang, v_version, now())
    returning id into v_membre;
  end if;

  update public.tours set beneficiaire_membre_id = v_membre
  where tontine_id = p_tontine_id and numero = v_rang;

  -- Cotisations des tours dont la cagnotte n'a pas encore été remise (une remplaçante arrivée
  -- pendant le cycle ne doit rien pour les tours déjà versés).
  insert into public.cotisations (tour_id, membre_id)
  select tr.id, v_membre from public.tours tr
  where tr.tontine_id = p_tontine_id and tr.verse_at is null
  on conflict (tour_id, membre_id) do nothing;

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees) values
    (p_tontine_id, v_membre, p_profil_id, 'membre_rejoint', jsonb_build_object('rang', v_rang)),
    (p_tontine_id, v_membre, p_profil_id, 'reglement_accepte', jsonb_build_object('version', v_version));

  return v_membre;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apercu_tontine(p_code text)
 RETURNS TABLE(id uuid, nom text, type type_tontine, bien_prevu text, montant integer, frequence frequence, nb_membres integer, nb_inscrits integer, date_debut date, gerante_prenom text, ordre_tirage boolean, reglement_version integer, reglement_lignes text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_t public.tontines;
  v_inscrits integer;
begin
  if auth.uid() is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  v_t := public.tontine_par_code(btrim(p_code));
  if exists (select 1 from public.membres m where m.tontine_id = v_t.id and m.profil_id = auth.uid() and m.retire_at is null) then
    raise exception 'deja_membre' using errcode = 'P0001';
  end if;
  select count(*) into v_inscrits from public.membres m where m.tontine_id = v_t.id and m.retire_at is null;
  if v_inscrits >= v_t.nb_membres then
    raise exception 'tontine_complete' using errcode = 'P0001';
  end if;

  return query
  select v_t.id, v_t.nom, v_t.type, v_t.bien_prevu, v_t.montant, v_t.frequence, v_t.nb_membres,
         v_inscrits, v_t.date_debut,
         (select p.prenom from public.profils p where p.id = v_t.gerante_id),
         exists (select 1 from public.evenements e where e.tontine_id = v_t.id and e.type = 'tirage'),
         r.version, r.lignes
  from public.reglements r
  where r.tontine_id = v_t.id
  order by r.version desc
  limit 1;
end;
$function$;

CREATE OR REPLACE FUNCTION public.rejoindre_tontine(p_code text, p_version_reglement integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_t public.tontines;
  v_prenom text;
begin
  if v_uid is null or not exists (select 1 from public.profils where id = v_uid) then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  v_t := public.tontine_par_code(btrim(p_code));
  -- Verrou : deux personnes ne peuvent pas prendre la dernière place en même temps.
  perform 1 from public.tontines where id = v_t.id for update;

  if exists (select 1 from public.membres m where m.tontine_id = v_t.id and m.profil_id = v_uid and m.retire_at is null) then
    raise exception 'deja_membre' using errcode = 'P0001';
  end if;
  if (select count(*) from public.membres m where m.tontine_id = v_t.id and m.retire_at is null) >= v_t.nb_membres then
    raise exception 'tontine_complete' using errcode = 'P0001';
  end if;
  if p_version_reglement is distinct from (select max(version) from public.reglements where tontine_id = v_t.id) then
    raise exception 'reglement_change' using errcode = 'P0001';
  end if;

  perform public.ajouter_membre(v_t.id, v_uid);
  perform public.demarrer_tontines();

  select prenom into v_prenom from public.profils where id = v_uid;
  perform public.notifier(v_t.gerante_id, v_t.id, 'membre_rejoint',
    'Nouveau membre', v_prenom || ' a rejoint « ' || v_t.nom || ' ».');

  return v_t.id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.demarrer_tontines()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_nb integer;
begin
  update public.tontines t set statut = 'en_cours'
  where t.statut = 'en_preparation'
    and t.date_debut <= public.aujourdhui_dakar()
    and (select count(*) from public.membres m where m.tontine_id = t.id and m.retire_at is null) >= t.nb_membres;
  get diagnostics v_nb = row_count;
  return v_nb;
end;
$function$;

CREATE OR REPLACE FUNCTION public.appliquer_tirage(p_tontine_id uuid, p_auteur_id uuid, p_ordre uuid[], p_graine text, p_algorithme text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_t public.tontines;
  v_membres uuid[];
  v_evenement uuid;
begin
  select * into v_t from public.tontines where id = p_tontine_id for update;
  if v_t.id is null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  if v_t.gerante_id <> p_auteur_id then
    raise exception 'reserve_gerante' using errcode = '42501';
  end if;
  if exists (select 1 from public.evenements where tontine_id = v_t.id and type = 'tirage') then
    raise exception 'tirage_deja_fait' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.tours where tontine_id = v_t.id and verse_at is not null) then
    raise exception 'tour_deja_verse' using errcode = 'P0001';
  end if;
  select array_agg(id order by id) into v_membres from public.membres where tontine_id = v_t.id and retire_at is null;
  if coalesce(array_length(v_membres, 1), 0) < v_t.nb_membres then
    raise exception 'tontine_incomplete' using errcode = 'P0001';
  end if;
  if (select array_agg(x order by x) from unnest(p_ordre) x) is distinct from v_membres then
    raise exception 'ordre_invalide' using errcode = '22023';
  end if;

  perform public.appliquer_ordre(v_t.id, p_ordre);

  insert into public.evenements (tontine_id, auteur_id, type, donnees)
  values (v_t.id, p_auteur_id, 'tirage',
          jsonb_build_object('ordre', to_jsonb(p_ordre), 'graine', p_graine, 'algorithme', p_algorithme))
  returning id into v_evenement;

  insert into public.vues_tirage (evenement_id, profil_id) values (v_evenement, p_auteur_id);

  perform public.notifier(m.profil_id, v_t.id, 'tirage', 'Tirage au sort',
    '« ' || v_t.nom || ' » : ton tour est le n° ' || m.rang || '.')
  from public.membres m where m.tontine_id = v_t.id and m.profil_id <> p_auteur_id and m.retire_at is null;

  return v_evenement;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cotisations_dues(p_tontine_id uuid)
 RETURNS TABLE(membre_id uuid, profil_id uuid, cotisation_id uuid, tour_id uuid, echeance date, statut statut_cotisation)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select distinct on (m.id) m.id, m.profil_id, c.id, tr.id, tr.echeance, c.statut
  from public.membres m
  join public.cotisations c on c.membre_id = m.id
  join public.tours tr on tr.id = c.tour_id
  where m.tontine_id = p_tontine_id and c.statut <> 'paye' and m.retire_at is null
  order by m.id, tr.numero
$function$;

CREATE OR REPLACE FUNCTION public.preparer_relances(p_jour date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      and m.retire_at is null
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
    join public.membres m on m.id = c.membre_id and m.profil_id <> t.gerante_id and m.retire_at is null
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
      and m.retire_at is null
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
$function$;

CREATE OR REPLACE FUNCTION public.mes_tontines()
 RETURNS TABLE(id uuid, nom text, type type_tontine, bien_prevu text, montant integer, frequence frequence, nb_membres integer, statut statut_tontine, date_debut date, est_gerante boolean, gerante_prenom text, nb_inscrits integer, tour_numero integer, tour_echeance date, ma_cotisation_statut statut_cotisation, ma_declare_at timestamp with time zone, ma_paye_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with mes as (
    select t.*, m.id as membre_id
    from public.tontines t
    join public.membres m on m.tontine_id = t.id and m.profil_id = (select auth.uid()) and m.retire_at is null
  ),
  courant as (
    select distinct on (tr.tontine_id) tr.tontine_id, tr.id as tour_id, tr.numero, tr.echeance
    from public.tours tr
    where tr.tontine_id in (select mes.id from mes) and tr.verse_at is null
    order by tr.tontine_id, tr.numero
  )
  select
    mes.id, mes.nom, mes.type, mes.bien_prevu, mes.montant, mes.frequence, mes.nb_membres,
    mes.statut, mes.date_debut,
    mes.gerante_id = (select auth.uid()),
    g.prenom,
    (select count(*)::integer from public.membres x where x.tontine_id = mes.id and x.retire_at is null),
    c.numero, c.echeance,
    co.statut, co.declare_at, co.paye_at
  from mes
  join public.profils g on g.id = mes.gerante_id
  left join courant c on c.tontine_id = mes.id
  left join public.cotisations co on co.tour_id = c.tour_id and co.membre_id = mes.membre_id
  where mes.statut <> 'terminee'
     or (mes.gerante_id = (select auth.uid())
         and not exists (select 1 from public.tontines s where s.cycle_precedent_id = mes.id))
  order by (mes.statut = 'terminee'), mes.created_at desc
$function$;

CREATE OR REPLACE FUNCTION public.nouvelle_version_reglement(p_tontine_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  from public.membres m where m.tontine_id = p_tontine_id and m.profil_id <> v_t.gerante_id and m.retire_at is null;
  return v_version;
end;
$function$;

CREATE OR REPLACE FUNCTION public.marquer_verse(p_tour_id uuid)
 RETURNS statut_tontine
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_tour public.tours;
  v_t public.tontines;
  v_beneficiaire public.membres;
  v_dernier boolean;
begin
  select * into v_tour from public.tours where id = p_tour_id for update;
  if v_tour.id is null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  perform public.exiger_gerante(v_tour.tontine_id);
  select * into v_t from public.tontines where id = v_tour.tontine_id for update;
  if v_tour.verse_at is not null then
    raise exception 'deja_verse' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.tours where tontine_id = v_t.id and numero < v_tour.numero and verse_at is null) then
    raise exception 'tour_precedent_non_verse' using errcode = 'P0001';
  end if;
  if v_tour.beneficiaire_membre_id is null then
    raise exception 'sans_beneficiaire' using errcode = 'P0001';
  end if;

  update public.tours set verse_at = now() where id = v_tour.id;
  select * into v_beneficiaire from public.membres where id = v_tour.beneficiaire_membre_id;

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees)
  values (v_t.id, v_beneficiaire.id, auth.uid(), 'versement',
          jsonb_build_object('tour_id', v_tour.id, 'numero', v_tour.numero,
                             'montant', v_t.montant * v_t.nb_membres));

  if v_beneficiaire.profil_id <> auth.uid() then
    perform public.notifier(v_beneficiaire.profil_id, v_t.id, 'versement', 'Cagnotte reçue',
      case when v_t.type = 'achat_groupe'
        then 'Ta gérante a noté la remise de ton bien (' || v_t.bien_prevu || ') pour « ' || v_t.nom || ' ».'
        else 'Ta gérante a noté la remise de ta cagnotte de ' || public.format_montant(v_t.montant * v_t.nb_membres)
             || ' pour « ' || v_t.nom || ' ».' end);
  end if;

  v_dernier := not exists (select 1 from public.tours where tontine_id = v_t.id and verse_at is null);
  if v_dernier then
    update public.tontines set statut = 'terminee' where id = v_t.id;
    insert into public.evenements (tontine_id, auteur_id, type, donnees)
    values (v_t.id, auth.uid(), 'cycle_termine', jsonb_build_object('nb_tours', v_t.nb_membres));
    perform public.notifier(m.profil_id, v_t.id, 'cycle_termine', 'Tontine terminée',
      '« ' || v_t.nom || ' » est terminée. Merci à toutes !')
    from public.membres m where m.tontine_id = v_t.id and m.profil_id <> auth.uid() and m.retire_at is null;
    return 'terminee'::public.statut_tontine;
  end if;
  return v_t.statut;
end;
$function$;

CREATE OR REPLACE FUNCTION public.relancer_cycle(p_tontine_id uuid, p_date_debut date)
 RETURNS tontines
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_ancienne public.tontines;
  v_nouvelle public.tontines;
begin
  perform public.exiger_gerante(p_tontine_id);
  select * into v_ancienne from public.tontines where id = p_tontine_id for update;
  if v_ancienne.statut <> 'terminee' then
    raise exception 'cycle_non_termine' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.tontines where cycle_precedent_id = p_tontine_id) then
    raise exception 'cycle_deja_relance' using errcode = 'P0001';
  end if;

  -- Mêmes paramètres ; creer_tontine vérifie la date, la limite du palier (B3) et crée le règlement v1.
  v_nouvelle := public.creer_tontine(
    v_ancienne.nom, v_ancienne.type, v_ancienne.bien_prevu, v_ancienne.montant,
    v_ancienne.frequence, v_ancienne.nb_membres, p_date_debut
  );

  update public.tontines
  set cycle_precedent_id = v_ancienne.id,
      penalite_retard = v_ancienne.penalite_retard,
      relance_j_moins_3 = v_ancienne.relance_j_moins_3,
      relance_jour_j = v_ancienne.relance_jour_j,
      relance_j_plus_1 = v_ancienne.relance_j_plus_1,
      reglement_libres = v_ancienne.reglement_libres
  where id = v_nouvelle.id
  returning * into v_nouvelle;

  update public.reglements
  set lignes = public.generer_lignes_reglement(v_nouvelle.id) || v_nouvelle.reglement_libres
  where tontine_id = v_nouvelle.id and version = 1;

  -- Les mêmes membres sont invités : chacune reconfirme sa participation et le règlement avec le code.
  perform public.notifier(m.profil_id, v_nouvelle.id, 'nouveau_cycle', 'Nouveau cycle',
    '« ' || v_nouvelle.nom || ' » recommence. Rejoins le nouveau cycle avec le code ' || v_nouvelle.code || '.')
  from public.membres m
  where m.tontine_id = v_ancienne.id and m.profil_id <> v_ancienne.gerante_id and m.retire_at is null;
  update public.notifications set donnees = jsonb_build_object('code', v_nouvelle.code)
  where tontine_id = v_nouvelle.id and type = 'nouveau_cycle';

  return v_nouvelle;
end;
$function$;

CREATE OR REPLACE FUNCTION public.declarer_paiement(p_cotisation_id uuid, p_moyen text, p_capture_path text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_c public.cotisations;
  v_m public.membres;
  v_t public.tontines;
  v_prenom text;
begin
  if auth.uid() is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  if p_moyen not in ('wave', 'orange_money') then
    raise exception 'moyen_invalide' using errcode = '22023';
  end if;
  select * into v_c from public.cotisations where id = p_cotisation_id for update;
  select * into v_m from public.membres where id = v_c.membre_id;
  if v_c.id is null or v_m.profil_id <> auth.uid() or v_m.retire_at is not null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  if v_c.statut <> 'a_payer' then
    raise exception 'deja_declare' using errcode = 'P0001';
  end if;
  select * into v_t from public.tontines where id = v_m.tontine_id;

  update public.cotisations
  set statut = 'declare', moyen = p_moyen, declare_at = now(),
      capture_path = coalesce(p_capture_path, capture_path)
  where id = v_c.id;

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees)
  values (v_t.id, v_m.id, auth.uid(), 'declaration',
          jsonb_build_object('cotisation_id', v_c.id, 'tour_id', v_c.tour_id, 'moyen', p_moyen));

  if v_t.gerante_id <> auth.uid() then
    select prenom into v_prenom from public.profils where id = auth.uid();
    perform public.notifier(v_t.gerante_id, v_t.id, 'declaration', 'Paiement à vérifier',
      v_prenom || ' dit avoir payé ' || public.format_montant(v_t.montant) || ' par '
      || case p_moyen when 'wave' then 'Wave' else 'Orange Money' end
      || '. Vérifie et marque payé.');
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- retirer_membre (gérante)
--  - avant le démarrage : retrait libre, la place se libère (une autre personne peut rejoindre avec le code) ;
--  - pendant le cycle, si le membre n'a pas reçu la cagnotte :
--      'remplacer' : son tour reste, sans bénéficiaire, pour une remplaçante qui rejoint avec le code ;
--      'supprimer' : les membres suivants avancent d'un rang (tours, dates et paiements inchangés),
--                    le dernier tour disparaît, la tontine passe à N-1 membres (cagnotte : montant × N-1) ;
--  - s'il a déjà reçu la cagnotte : refus (il doit encore ses cotisations).
-- Les cotisations des tours non versés sont supprimées ; un montant déjà payé pour ces tours est
-- indiqué dans l'événement (« a_rembourser ») : la gérante le rend en dehors de Natt.
-- ---------------------------------------------------------------------------
create function public.retirer_membre(p_membre_id uuid, p_mode text default 'remplacer')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.membres;
  v_t public.tontines;
  v_mode text := p_mode;
  v_rang integer;
  v_a_rembourser integer;
  a_rembourser_autres integer := 0;
  v_prenom text;
begin
  select * into v_m from public.membres where id = p_membre_id;
  if v_m.id is null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  perform public.exiger_gerante(v_m.tontine_id);
  select * into v_t from public.tontines where id = v_m.tontine_id for update;

  if v_m.retire_at is not null then
    raise exception 'deja_retire' using errcode = 'P0001';
  end if;
  if v_m.profil_id = v_t.gerante_id then
    raise exception 'retrait_gerante_impossible' using errcode = 'P0001';
  end if;
  if v_t.statut = 'terminee' then
    raise exception 'tontine_terminee' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.tours where beneficiaire_membre_id = v_m.id and verse_at is not null) then
    raise exception 'deja_servi' using errcode = 'P0001';
  end if;
  if v_mode not in ('remplacer', 'supprimer') then
    raise exception 'mode_invalide' using errcode = '22023';
  end if;
  if v_t.statut = 'en_preparation' then
    v_mode := 'remplacer';
  end if;
  if v_mode = 'supprimer' and v_t.nb_membres <= 2 then
    raise exception 'trop_peu_de_membres' using errcode = 'P0001';
  end if;

  v_rang := v_m.rang;
  select coalesce(count(*), 0) * v_t.montant into v_a_rembourser
  from public.cotisations c join public.tours tr on tr.id = c.tour_id
  where c.membre_id = v_m.id and tr.verse_at is null and c.statut <> 'a_payer';

  delete from public.cotisations c using public.tours tr
  where tr.id = c.tour_id and c.membre_id = v_m.id and tr.verse_at is null;
  update public.tours set beneficiaire_membre_id = null where beneficiaire_membre_id = v_m.id;
  update public.membres set retire_at = now(), rang = null where id = v_m.id;

  if v_mode = 'supprimer' and v_rang is not null then
    -- Les membres suivants avancent d'un rang ; les tours gardent leurs dates et leurs paiements ;
    -- c'est le dernier tour qui disparaît (le cycle se termine une période plus tôt).
    a_rembourser_autres := (
      select coalesce(count(*), 0) * v_t.montant
      from public.cotisations c join public.tours tr on tr.id = c.tour_id
      where tr.tontine_id = v_t.id and tr.numero = v_t.nb_membres and c.statut <> 'a_payer');
    delete from public.tours where tontine_id = v_t.id and numero = v_t.nb_membres;
    update public.membres set rang = rang + 1000 where tontine_id = v_t.id and rang > v_rang;
    update public.membres set rang = rang - 1001 where tontine_id = v_t.id and rang > 1000;
    update public.tours tr set beneficiaire_membre_id = m.id
    from public.membres m
    where tr.tontine_id = v_t.id and tr.verse_at is null
      and m.tontine_id = v_t.id and m.retire_at is null and m.rang = tr.numero;
    update public.tontines set nb_membres = nb_membres - 1 where id = v_t.id;
    -- La cagnotte change : le règlement est régénéré (nouvelle version à accepter).
    perform public.nouvelle_version_reglement(v_t.id);
  end if;

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees)
  values (v_t.id, v_m.id, auth.uid(), 'membre_retire',
          jsonb_build_object('mode', v_mode, 'rang', v_rang, 'a_rembourser', v_a_rembourser,
                             'avances_dernier_tour_a_rembourser', a_rembourser_autres));

  select prenom into v_prenom from public.profils where id = v_m.profil_id;
  perform public.notifier(v_m.profil_id, null, 'membre_retire', 'Retrait d’une tontine',
    'Ta gérante t’a retirée de « ' || v_t.nom || ' ».'
    || case when v_a_rembourser > 0
         then ' Les ' || public.format_montant(v_a_rembourser) || ' déjà payés pour les tours à venir sont à régler avec elle.'
         else '' end);
  return v_mode;
end;
$$;
revoke execute on function public.retirer_membre(uuid, text) from public, anon;
grant execute on function public.retirer_membre(uuid, text) to authenticated;
