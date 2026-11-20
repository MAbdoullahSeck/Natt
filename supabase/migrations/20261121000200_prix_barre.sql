-- Point 3 : prix barré de l'abonnement annuel. Dans les notifications (texte simple, non barrable),
-- le prix annuel est suivi de « au lieu de <prix plein> » et de « 2 mois offerts ».

create function public.prix_plein_annuel(p_palier public.palier)
returns integer
language sql
immutable
set search_path = ''
as $$ select public.prix_abonnement(p_palier, 'mensuel') * 12 $$;

create or replace function public.envoyer_lien_paiement(p_profil_id uuid, p_palier public.palier, p_periodicite text, p_raison text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_prix text := public.format_montant(public.prix_abonnement(p_palier, p_periodicite))
                 || case p_periodicite
                      when 'annuel' then ' par an, au lieu de ' || public.format_montant(public.prix_plein_annuel(p_palier))
                                         || ' : 2 mois offerts'
                      else ' par mois' end;
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
