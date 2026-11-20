-- Étape 5 : vues tontine (écrans 13, 13c, 14, 16) — confirmation des paiements et remise de la cagnotte.

-- Nouveaux types d'événements : remise de la cagnotte et nouvelle version du règlement.
alter table public.evenements drop constraint evenements_type_check;
alter table public.evenements add constraint evenements_type_check check (
  type in (
    'declaration', 'confirmation', 'relance', 'penalite', 'penalite_annulee',
    'tirage', 'echange', 'reglement_accepte', 'membre_rejoint', 'cycle_termine',
    'versement', 'reglement_modifie'
  )
);

-- Remplace lignes_reglement_generees(tontines), que PostgREST exposait comme colonne calculée.
drop function public.lignes_reglement_generees(public.tontines);

create function public.generer_lignes_reglement(p_tontine_id uuid)
returns text[]
language sql
stable
security definer
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
  from public.tontines t
  where t.id = p_tontine_id
$$;
revoke execute on function public.generer_lignes_reglement(uuid) from public, anon, authenticated;

create or replace function public.creer_tontine(
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
  values (v_t.id, 1, public.generer_lignes_reglement(v_t.id));

  insert into public.tours (tontine_id, numero, echeance)
  select v_t.id, n, public.echeance_tour(p_date_debut, p_frequence, n)
  from generate_series(1, p_nb_membres) n;

  perform public.ajouter_membre(v_t.id, v_uid);

  return v_t;
end;
$$;

-- Garde-fou commun : l'utilisatrice connectée est la gérante de la tontine.
create function public.exiger_gerante(p_tontine_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  if not exists (select 1 from public.tontines where id = p_tontine_id and gerante_id = auth.uid()) then
    raise exception 'reserve_gerante' using errcode = '42501';
  end if;
end;
$$;
revoke execute on function public.exiger_gerante(uuid) from public, anon, authenticated;

-- P3 : seule la gérante passe un paiement en « payé » (écran 14).
create function public.confirmer_paiement(p_cotisation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_c public.cotisations;
  v_tontine public.tontines;
  v_membre public.membres;
begin
  select * into v_c from public.cotisations where id = p_cotisation_id for update;
  if v_c.id is null then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  select m.* into v_membre from public.membres m where m.id = v_c.membre_id;
  select t.* into v_tontine from public.tontines t where t.id = v_membre.tontine_id;
  perform public.exiger_gerante(v_tontine.id);
  if v_c.statut = 'paye' then
    raise exception 'deja_paye' using errcode = 'P0001';
  end if;

  update public.cotisations set statut = 'paye', paye_at = now() where id = v_c.id;

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees)
  values (v_tontine.id, v_membre.id, auth.uid(), 'confirmation',
          jsonb_build_object('cotisation_id', v_c.id, 'tour_id', v_c.tour_id,
                             'sans_declaration', v_c.statut = 'a_payer'));

  if v_membre.profil_id <> auth.uid() then
    perform public.notifier(v_membre.profil_id, v_tontine.id, 'confirmation', 'Paiement reçu',
      'Ta gérante a confirmé ton paiement de ' || public.format_montant(v_tontine.montant)
      || ' pour « ' || v_tontine.nom || ' ».');
  end if;
end;
$$;
revoke execute on function public.confirmer_paiement(uuid) from public, anon;
grant execute on function public.confirmer_paiement(uuid) to authenticated;

-- Remise de la cagnotte du tour en cours au bénéficiaire. Au dernier tour, la tontine est terminée (F1).
create function public.marquer_verse(p_tour_id uuid)
returns public.statut_tontine
language plpgsql
security definer
set search_path = ''
as $$
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
    from public.membres m where m.tontine_id = v_t.id and m.profil_id <> auth.uid();
    return 'terminee';
  end if;
  return v_t.statut;
end;
$$;
revoke execute on function public.marquer_verse(uuid) from public, anon;
grant execute on function public.marquer_verse(uuid) to authenticated;
