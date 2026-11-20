-- Étape 6 : paiement (écrans 17, 18). Natt ne touche jamais l'argent : le membre paie la gérante
-- dans Wave ou Orange Money, puis déclare son paiement ici. Aucun solde, aucun portefeuille.

-- P2 : au retour de l'application de paiement, la cotisation passe en « declare ».
create function public.declarer_paiement(p_cotisation_id uuid, p_moyen text, p_capture_path text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
  if v_c.id is null or v_m.profil_id <> auth.uid() then
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
$$;
revoke execute on function public.declarer_paiement(uuid, text, text) from public, anon;
grant execute on function public.declarer_paiement(uuid, text, text) to authenticated;

-- Capture facultative jointe après la déclaration (écran 18).
create function public.joindre_capture(p_cotisation_id uuid, p_capture_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.membres;
begin
  select m.* into v_m
  from public.cotisations c join public.membres m on m.id = c.membre_id
  where c.id = p_cotisation_id;
  if v_m.id is null or v_m.profil_id <> auth.uid() then
    raise exception 'introuvable' using errcode = 'P0001';
  end if;
  -- Le chemin doit être celui de cette cotisation : {tontine_id}/{cotisation_id}/fichier.
  if split_part(p_capture_path, '/', 1) <> v_m.tontine_id::text
     or split_part(p_capture_path, '/', 2) <> p_cotisation_id::text then
    raise exception 'chemin_invalide' using errcode = '22023';
  end if;
  update public.cotisations set capture_path = p_capture_path where id = p_cotisation_id;
end;
$$;
revoke execute on function public.joindre_capture(uuid, text) from public, anon;
grant execute on function public.joindre_capture(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage : bucket privé « captures ». Chemin : {tontine_id}/{cotisation_id}/{fichier}.
-- Le membre dépose la capture de sa cotisation ; la gérante et le membre la lisent.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('captures', 'captures', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.capture_du_membre(p_nom text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cotisations c
    join public.membres m on m.id = c.membre_id
    where c.id::text = split_part(p_nom, '/', 2)
      and m.tontine_id::text = split_part(p_nom, '/', 1)
      and m.profil_id = auth.uid()
  )
$$;

create function public.capture_de_ma_tontine(p_nom text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tontines t
    where t.id::text = split_part(p_nom, '/', 1) and t.gerante_id = auth.uid()
  )
$$;
revoke execute on function public.capture_du_membre(text) from public, anon;
revoke execute on function public.capture_de_ma_tontine(text) from public, anon;
grant execute on function public.capture_du_membre(text) to authenticated;
grant execute on function public.capture_de_ma_tontine(text) to authenticated;

create policy "captures : dépôt par le membre" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'captures' and public.capture_du_membre(name));

create policy "captures : lecture membre et gérante" on storage.objects
  for select to authenticated
  using (bucket_id = 'captures' and (public.capture_du_membre(name) or public.capture_de_ma_tontine(name)));
