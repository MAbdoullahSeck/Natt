-- Étape 7 : ordre des tours, tirage au sort (O2), échange (O3) — écrans 15, 15b, 15c.

-- « Vu par N membres » (écran 15c).
create table public.vues_tirage (
  evenement_id uuid not null references public.evenements (id) on delete restrict,
  profil_id uuid not null references public.profils (id) on delete cascade,
  vu_at timestamptz not null default now(),
  primary key (evenement_id, profil_id)
);
create index vues_tirage_profil on public.vues_tirage (profil_id);
alter table public.vues_tirage enable row level security;
revoke all on public.vues_tirage from anon;
revoke insert, update, delete, truncate on public.vues_tirage from authenticated;
create policy "vues_tirage : lecture membres" on public.vues_tirage
  for select to authenticated
  using (exists (select 1 from public.evenements e where e.id = evenement_id and public.est_membre(e.tontine_id)));

-- Remet les rangs dans l'ordre donné et met à jour les bénéficiaires des tours (usage interne).
-- Les rangs passent d'abord par des valeurs temporaires pour respecter unique(tontine_id, rang).
create function public.appliquer_ordre(p_tontine_id uuid, p_ordre uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.membres set rang = rang + 1000 where tontine_id = p_tontine_id and id = any (p_ordre);
  update public.membres m set rang = o.position
  from unnest(p_ordre) with ordinality as o(membre_id, position)
  where m.id = o.membre_id and m.tontine_id = p_tontine_id;
  update public.tours tr set beneficiaire_membre_id = m.id
  from public.membres m
  where m.tontine_id = p_tontine_id and tr.tontine_id = p_tontine_id and tr.numero = m.rang;
end;
$$;
revoke execute on function public.appliquer_ordre(uuid, uuid[]) from public, anon, authenticated;

-- O2 : enregistre le résultat du tirage fait par l'Edge Function « tirage-au-sort ».
-- Réservée à service_role ; l'Edge Function transmet l'identité de la gérante qui l'a demandé.
create function public.appliquer_tirage(
  p_tontine_id uuid, p_auteur_id uuid, p_ordre uuid[], p_graine text, p_algorithme text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
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
  select array_agg(id order by id) into v_membres from public.membres where tontine_id = v_t.id;
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
  from public.membres m where m.tontine_id = v_t.id and m.profil_id <> p_auteur_id;

  return v_evenement;
end;
$$;
revoke execute on function public.appliquer_tirage(uuid, uuid, uuid[], text, text) from public, anon, authenticated;
grant execute on function public.appliquer_tirage(uuid, uuid, uuid[], text, text) to service_role;

-- 15c : le membre qui ouvre le résultat du tirage est compté dans « vu par N membres ».
create function public.marquer_tirage_vu(p_tontine_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.vues_tirage (evenement_id, profil_id)
  select e.id, auth.uid()
  from public.evenements e
  where e.tontine_id = p_tontine_id and e.type = 'tirage' and public.est_membre(p_tontine_id)
  on conflict do nothing
$$;
revoke execute on function public.marquer_tirage_vu(uuid) from public, anon;
grant execute on function public.marquer_tirage_vu(uuid) to authenticated;

-- O3 : échange de tours entre deux membres, par la gérante, tours non versés uniquement.
create function public.echanger_tours(p_membre_a uuid, p_membre_b uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_a public.membres;
  v_b public.membres;
  v_t public.tontines;
  v_ordre uuid[];
begin
  select * into v_a from public.membres where id = p_membre_a;
  select * into v_b from public.membres where id = p_membre_b;
  if v_a.id is null or v_b.id is null or v_a.tontine_id <> v_b.tontine_id or v_a.id = v_b.id then
    raise exception 'echange_invalide' using errcode = '22023';
  end if;
  perform public.exiger_gerante(v_a.tontine_id);
  select * into v_t from public.tontines where id = v_a.tontine_id for update;
  if exists (
    select 1 from public.tours
    where tontine_id = v_t.id and numero in (v_a.rang, v_b.rang) and verse_at is not null
  ) then
    raise exception 'tour_deja_verse' using errcode = 'P0001';
  end if;

  -- Nouvel ordre : tous les membres par rang, avec A et B intervertis.
  select array_agg(case when m.id = v_a.id then v_b.id when m.id = v_b.id then v_a.id else m.id end order by m.rang)
  into v_ordre
  from public.membres m where m.tontine_id = v_t.id and m.rang is not null;
  perform public.appliquer_ordre(v_t.id, v_ordre);

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees) values
    (v_t.id, v_a.id, auth.uid(), 'echange',
     jsonb_build_object('avec', v_b.id, 'ancien_rang', v_a.rang, 'nouveau_rang', v_b.rang)),
    (v_t.id, v_b.id, auth.uid(), 'echange',
     jsonb_build_object('avec', v_a.id, 'ancien_rang', v_b.rang, 'nouveau_rang', v_a.rang));

  perform public.notifier(x.profil_id, v_t.id, 'echange', 'Ton tour a changé',
    '« ' || v_t.nom || ' » : ton tour est maintenant le n° ' || x.nouveau_rang || ' ('
    || to_char(public.echeance_tour(v_t.date_debut, v_t.frequence, x.nouveau_rang), 'DD/MM/YYYY') || ').')
  from (values (v_a.profil_id, v_b.rang), (v_b.profil_id, v_a.rang)) as x(profil_id, nouveau_rang)
  where x.profil_id <> auth.uid();
end;
$$;
revoke execute on function public.echanger_tours(uuid, uuid) from public, anon;
grant execute on function public.echanger_tours(uuid, uuid) to authenticated;
