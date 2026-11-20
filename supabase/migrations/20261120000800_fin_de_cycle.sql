-- Étape 9 : fin de cycle (écrans 19, 19b) et relance du cycle (F3).
-- La clôture automatique au dernier tour versé est faite par marquer_verse (étape 5).

-- Données complémentaires d'une notification (ex. le code du nouveau cycle).
alter table public.notifications add column donnees jsonb not null default '{}';

create function public.relancer_cycle(p_tontine_id uuid, p_date_debut date)
returns public.tontines
language plpgsql
security definer
set search_path = ''
as $$
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
  where m.tontine_id = v_ancienne.id and m.profil_id <> v_ancienne.gerante_id;
  update public.notifications set donnees = jsonb_build_object('code', v_nouvelle.code)
  where tontine_id = v_nouvelle.id and type = 'nouveau_cycle';

  return v_nouvelle;
end;
$$;
revoke execute on function public.relancer_cycle(uuid, date) from public, anon;
grant execute on function public.relancer_cycle(uuid, date) to authenticated;
