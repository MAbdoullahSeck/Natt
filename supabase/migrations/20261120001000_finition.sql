-- Étape 11 : finition.

-- marquer_verse renvoyait un texte au lieu du type statut_tontine (avertissement de supabase db lint).
-- Remise de la cagnotte du tour en cours au bénéficiaire. Au dernier tour, la tontine est terminée (F1).
create or replace function public.marquer_verse(p_tour_id uuid)
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
    return 'terminee'::public.statut_tontine;
  end if;
  return v_t.statut;
end;
$$;

-- Le push transmet aussi le type et les données de la notification (ex. code du nouveau cycle).
drop function public.notifications_a_pousser(integer);
create function public.notifications_a_pousser(p_limite integer default 500)
returns table (id uuid, jeton text, titre text, corps text, tontine_id uuid, type text, donnees jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, p.expo_push_token, n.titre, n.corps, n.tontine_id, n.type, n.donnees
  from public.notifications n
  join public.profils p on p.id = n.profil_id
  where n.push_envoye_at is null and n.created_at > now() - interval '2 days'
  order by n.created_at
  limit p_limite
$$;
revoke execute on function public.notifications_a_pousser(integer) from public, anon, authenticated;
grant execute on function public.notifications_a_pousser(integer) to service_role;
