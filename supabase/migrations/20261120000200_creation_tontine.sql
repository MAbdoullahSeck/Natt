-- Étape 3 : accueil et création de tontine (écrans 05 à 11).

-- Lignes libres ajoutées par la gérante au règlement (R1) ; le règlement complet est
-- « lignes générées + lignes libres », recalculé à chaque nouvelle version.
alter table public.tontines add column reglement_libres text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------------

-- Date du jour à Dakar (A2 : tout le calendrier de Natt suit l'heure de Dakar).
create function public.aujourdhui_dakar()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Africa/Dakar')::date $$;

-- T5 : échéance du tour n = date de début + (n - 1) périodes.
-- Pour les mois, Postgres ramène au dernier jour du mois (31 janvier + 1 mois = 28 février).
create function public.echeance_tour(p_debut date, p_frequence public.frequence, p_numero integer)
returns date
language sql
immutable
set search_path = ''
as $$
  select (p_debut + (p_numero - 1) * case p_frequence
            when 'jour' then interval '1 day'
            when 'semaine' then interval '1 week'
            else interval '1 month' end)::date
$$;

-- « 10 000 F » : espace fine insécable entre milliers, espace insécable avant F.
create function public.format_montant(p_montant integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(p_montant::text, '(\d)(?=(\d{3})+$)', '\1' || U&'\202F', 'g') || U&'\00A0' || 'F'
$$;

-- Lignes du règlement générées à partir des paramètres (R1).
create function public.lignes_reglement_generees(t public.tontines)
returns text[]
language sql
stable
set search_path = ''
as $$
  select array[
    'Chaque membre paie ' || public.format_montant(t.montant) || ' ' ||
      case t.frequence when 'jour' then 'chaque jour' when 'semaine' then 'chaque semaine' else 'chaque mois' end || '.',
    'Chaque paiement doit être fait au plus tard le jour de l’échéance.',
    case when t.penalite_retard > 0
      then 'Pénalité de ' || public.format_montant(t.penalite_retard) || ' par retard.'
      else 'Pas de pénalité de retard.' end,
    case when t.type = 'achat_groupe'
      then 'À son tour, chaque membre reçoit : ' || t.bien_prevu || '.'
      else 'À son tour, chaque membre reçoit la cagnotte de ' || public.format_montant(t.montant * t.nb_membres) || '.' end,
    'L’ordre des tours suit l’ordre d’arrivée ; la gérante peut le modifier ou faire un tirage au sort.'
  ]
$$;

-- Code d'invitation à 6 chiffres, unique parmi les tontines non terminées (T4).
create function public.generer_code()
returns char(6)
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_code char(6);
begin
  loop
    v_code := lpad(floor(random() * 1000000)::integer::text, 6, '0');
    exit when not exists (
      select 1 from public.tontines where code = v_code and statut <> 'terminee'
    );
  end loop;
  return v_code;
end;
$$;

-- B1–B2 : nombre maximal de tontines gérées non terminées. NULL = illimité.
-- Sans abonnement actif : 0 (sauf gérante fondatrice : limite Starter, B4).
create function public.limite_tontines(p_profil_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with meilleur as (
    select a.palier
    from public.abonnements a
    where a.profil_id = p_profil_id
      and a.statut = 'actif'
      and (a.expire_at is null or a.expire_at > now())
    order by case a.palier when 'illimite' then 3 when 'pro' then 2 else 1 end desc
    limit 1
  )
  select case
    when (select palier from meilleur) is null then
      case when (select fondatrice from public.profils where id = p_profil_id) then 2 else 0 end
    when (select palier from meilleur) = 'starter' then 2
    when (select palier from meilleur) = 'pro' then 6
    else null
  end
$$;

-- Ajoute un membre à une tontine (usage interne) : premier rang libre (ordre d'arrivée, O1),
-- bénéficiaire du tour correspondant, une cotisation par tour, événements.
create function public.ajouter_membre(p_tontine_id uuid, p_profil_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rang integer;
  v_version integer;
  v_membre uuid;
begin
  select min(n) into v_rang
  from generate_series(1, (select nb_membres from public.tontines where id = p_tontine_id)) n
  where not exists (select 1 from public.membres m where m.tontine_id = p_tontine_id and m.rang = n);
  if v_rang is null then
    raise exception 'tontine_complete' using errcode = 'P0001';
  end if;

  select max(version) into v_version from public.reglements where tontine_id = p_tontine_id;

  insert into public.membres (tontine_id, profil_id, rang, reglement_version_acceptee, reglement_accepte_at)
  values (p_tontine_id, p_profil_id, v_rang, v_version, now())
  returning id into v_membre;

  update public.tours set beneficiaire_membre_id = v_membre
  where tontine_id = p_tontine_id and numero = v_rang;

  insert into public.cotisations (tour_id, membre_id)
  select tr.id, v_membre from public.tours tr where tr.tontine_id = p_tontine_id;

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees) values
    (p_tontine_id, v_membre, p_profil_id, 'membre_rejoint', jsonb_build_object('rang', v_rang)),
    (p_tontine_id, v_membre, p_profil_id, 'reglement_accepte', jsonb_build_object('version', v_version));

  return v_membre;
end;
$$;
revoke execute on function public.ajouter_membre(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- creer_tontine (écran 10)
-- ---------------------------------------------------------------------------
create function public.creer_tontine(
  p_nom text,
  p_type public.type_tontine,
  p_bien_prevu text,
  p_montant integer,
  p_frequence public.frequence,
  p_nb_membres integer,
  p_date_debut date
)
returns public.tontines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limite integer;
  v_t public.tontines;
begin
  if v_uid is null or not exists (select 1 from public.profils where id = v_uid) then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  if char_length(btrim(coalesce(p_nom, ''))) not between 2 and 40 then
    raise exception 'nom_invalide' using errcode = '22023';
  end if;
  if p_type = 'achat_groupe' and char_length(btrim(coalesce(p_bien_prevu, ''))) < 2 then
    raise exception 'bien_prevu_requis' using errcode = '22023';
  end if;
  if p_montant is null or p_montant < 500 then
    raise exception 'montant_invalide' using errcode = '22023';
  end if;
  if p_nb_membres is null or p_nb_membres not between 2 and 50 then
    raise exception 'nb_membres_invalide' using errcode = '22023';
  end if;
  if p_date_debut is null or p_date_debut < public.aujourdhui_dakar() then
    raise exception 'date_passee' using errcode = '22023';
  end if;

  -- B3 : limite du palier (verrou pour éviter deux créations simultanées).
  perform 1 from public.profils where id = v_uid for update;
  v_limite := public.limite_tontines(v_uid);
  if v_limite is not null and (
    select count(*) from public.tontines where gerante_id = v_uid and statut <> 'terminee'
  ) >= v_limite then
    raise exception 'limite_atteinte' using errcode = 'P0001';
  end if;

  insert into public.tontines (gerante_id, nom, type, bien_prevu, montant, frequence, nb_membres, date_debut, code)
  values (
    v_uid, btrim(p_nom), p_type,
    case when p_type = 'achat_groupe' then btrim(p_bien_prevu) end,
    p_montant, p_frequence, p_nb_membres, p_date_debut, public.generer_code()
  )
  returning * into v_t;

  insert into public.reglements (tontine_id, version, lignes)
  values (v_t.id, 1, public.lignes_reglement_generees(v_t));

  insert into public.tours (tontine_id, numero, echeance)
  select v_t.id, n, public.echeance_tour(p_date_debut, p_frequence, n)
  from generate_series(1, p_nb_membres) n;

  perform public.ajouter_membre(v_t.id, v_uid);

  return v_t;
end;
$$;
revoke execute on function public.creer_tontine(text, public.type_tontine, text, integer, public.frequence, integer, date) from public, anon;
grant execute on function public.creer_tontine(text, public.type_tontine, text, integer, public.frequence, integer, date) to authenticated;

-- ---------------------------------------------------------------------------
-- mes_tontines (écran 05) : une ligne par tontine, avec mon statut pour le tour en cours
-- (premier tour dont la cagnotte n'a pas été remise).
-- Les tontines terminées restent visibles pour la gérante tant qu'elle n'a pas relancé le cycle.
-- ---------------------------------------------------------------------------
create function public.mes_tontines()
returns table (
  id uuid,
  nom text,
  type public.type_tontine,
  bien_prevu text,
  montant integer,
  frequence public.frequence,
  nb_membres integer,
  statut public.statut_tontine,
  date_debut date,
  est_gerante boolean,
  gerante_prenom text,
  nb_inscrits integer,
  tour_numero integer,
  tour_echeance date,
  ma_cotisation_statut public.statut_cotisation,
  ma_declare_at timestamptz,
  ma_paye_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with mes as (
    select t.*, m.id as membre_id
    from public.tontines t
    join public.membres m on m.tontine_id = t.id and m.profil_id = (select auth.uid())
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
    (select count(*)::integer from public.membres x where x.tontine_id = mes.id),
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
$$;
revoke execute on function public.mes_tontines() from public, anon;
grant execute on function public.mes_tontines() to authenticated;

-- ---------------------------------------------------------------------------
-- suggestions_calendrier (C2) : événements qui tombent pendant le cycle.
-- La date ajustée est calculée dans l'app (src/domain/calendrier.ts).
-- ---------------------------------------------------------------------------
create function public.suggestions_calendrier(p_date_debut date, p_frequence public.frequence, p_nb_membres integer)
returns setof public.evenements_calendrier
language sql
stable
set search_path = ''
as $$
  select e.*
  from public.evenements_calendrier e
  where e.date_debut > p_date_debut
    and e.date_debut <= public.echeance_tour(p_date_debut, p_frequence, p_nb_membres)
  order by e.date_debut
$$;
revoke execute on function public.suggestions_calendrier(date, public.frequence, integer) from public, anon;
grant execute on function public.suggestions_calendrier(date, public.frequence, integer) to authenticated;
