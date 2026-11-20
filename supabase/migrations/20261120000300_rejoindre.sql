-- Étape 4 : rejoindre une tontine (écrans 12, 12b, 12c).

-- Notification in-app (écran 22) ; l'envoi push est fait par l'Edge Function « push » (étape 8).
create function public.notifier(
  p_profil_id uuid, p_tontine_id uuid, p_type text, p_titre text, p_corps text
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (profil_id, tontine_id, type, titre, corps)
  values (p_profil_id, p_tontine_id, p_type, p_titre, p_corps)
  returning id
$$;
revoke execute on function public.notifier(uuid, uuid, text, text, text) from public, anon, authenticated;

-- Passe en « en_cours » les tontines complètes dont la date de début est atteinte (T3).
-- Appelée après chaque arrivée et chaque jour par pg_cron (étape 8).
create function public.demarrer_tontines()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nb integer;
begin
  update public.tontines t set statut = 'en_cours'
  where t.statut = 'en_preparation'
    and t.date_debut <= public.aujourdhui_dakar()
    and (select count(*) from public.membres m where m.tontine_id = t.id) >= t.nb_membres;
  get diagnostics v_nb = row_count;
  return v_nb;
end;
$$;
revoke execute on function public.demarrer_tontines() from public, anon, authenticated;

-- Tontine accessible avec ce code (non terminée), ou erreur explicite.
create function public.tontine_par_code(p_code text)
returns public.tontines
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_t public.tontines;
begin
  select * into v_t from public.tontines
  where code = p_code
  order by (statut = 'terminee'), created_at desc
  limit 1;
  if v_t.id is null then
    raise exception 'code_inconnu' using errcode = 'P0001';
  end if;
  if v_t.statut = 'terminee' then
    raise exception 'tontine_terminee' using errcode = 'P0001';
  end if;
  return v_t;
end;
$$;
revoke execute on function public.tontine_par_code(text) from public, anon, authenticated;

-- Écran 12c : aperçu avant de rejoindre (montant, fréquence, membres, gérante, ordre des tours, règlement).
create function public.apercu_tontine(p_code text)
returns table (
  id uuid,
  nom text,
  type public.type_tontine,
  bien_prevu text,
  montant integer,
  frequence public.frequence,
  nb_membres integer,
  nb_inscrits integer,
  date_debut date,
  gerante_prenom text,
  ordre_tirage boolean,
  reglement_version integer,
  reglement_lignes text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_t public.tontines;
  v_inscrits integer;
begin
  if auth.uid() is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  v_t := public.tontine_par_code(btrim(p_code));
  if exists (select 1 from public.membres m where m.tontine_id = v_t.id and m.profil_id = auth.uid()) then
    raise exception 'deja_membre' using errcode = 'P0001';
  end if;
  select count(*) into v_inscrits from public.membres m where m.tontine_id = v_t.id;
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
$$;
revoke execute on function public.apercu_tontine(text) from public, anon;
grant execute on function public.apercu_tontine(text) to authenticated;

-- Rejoindre : code valide, place disponible, règlement accepté (version affichée = dernière version).
create function public.rejoindre_tontine(p_code text, p_version_reglement integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
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

  if exists (select 1 from public.membres m where m.tontine_id = v_t.id and m.profil_id = v_uid) then
    raise exception 'deja_membre' using errcode = 'P0001';
  end if;
  if (select count(*) from public.membres m where m.tontine_id = v_t.id) >= v_t.nb_membres then
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
$$;
revoke execute on function public.rejoindre_tontine(text, integer) from public, anon;
grant execute on function public.rejoindre_tontine(text, integer) to authenticated;
