-- Natt — schéma initial (docs/architecture.md, section 3) + RLS (section 4).
-- Montants en entiers de FCFA. Toute écriture métier passera par des fonctions serveur
-- (RPC security definer / Edge Functions) ajoutées aux étapes suivantes.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.type_tontine as enum ('classique', 'achat_groupe');
create type public.frequence as enum ('jour', 'semaine', 'mois');
create type public.statut_tontine as enum ('en_preparation', 'en_cours', 'terminee');
create type public.statut_cotisation as enum ('a_payer', 'declare', 'paye');
create type public.palier as enum ('starter', 'pro', 'illimite');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profils (
  id uuid primary key references auth.users on delete cascade,
  prenom text not null check (char_length(prenom) between 2 and 30),
  telephone text not null unique,
  consentement_at timestamptz not null,
  consentement_version text not null,
  langue text not null default 'fr',
  fondatrice boolean not null default false,
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table public.tontines (
  id uuid primary key default gen_random_uuid(),
  gerante_id uuid not null references public.profils (id),
  nom text not null check (char_length(nom) between 2 and 40),
  type public.type_tontine not null default 'classique',
  bien_prevu text,
  montant integer not null check (montant >= 500),
  frequence public.frequence not null,
  nb_membres integer not null check (nb_membres between 2 and 50),
  date_debut date not null,
  code char(6) not null check (code ~ '^[0-9]{6}$'),
  statut public.statut_tontine not null default 'en_preparation',
  penalite_retard integer not null default 0 check (penalite_retard >= 0),
  relance_j_moins_3 boolean not null default true,
  relance_jour_j boolean not null default true,
  relance_j_plus_1 boolean not null default true,
  cycle_precedent_id uuid references public.tontines (id),
  created_at timestamptz not null default now(),
  -- T1 : le bien prévu est obligatoire pour un achat groupé.
  check (type <> 'achat_groupe' or (bien_prevu is not null and char_length(bien_prevu) > 0))
);
-- T4 : code unique parmi les tontines non terminées.
create unique index tontines_code_actif on public.tontines (code) where statut <> 'terminee';
create index tontines_gerante on public.tontines (gerante_id);

create table public.reglements (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines (id) on delete cascade,
  version integer not null check (version >= 1),
  lignes text[] not null,
  created_at timestamptz not null default now(),
  unique (tontine_id, version)
);

create table public.membres (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines (id) on delete cascade,
  profil_id uuid not null references public.profils (id),
  rang integer check (rang >= 1),
  reglement_version_acceptee integer,
  reglement_accepte_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tontine_id, profil_id),
  unique (tontine_id, rang)
);
create index membres_profil on public.membres (profil_id);

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines (id) on delete cascade,
  numero integer not null check (numero >= 1),
  echeance date not null,
  beneficiaire_membre_id uuid references public.membres (id),
  verse_at timestamptz,
  unique (tontine_id, numero)
);
create index tours_beneficiaire on public.tours (beneficiaire_membre_id);

create table public.cotisations (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  membre_id uuid not null references public.membres (id) on delete cascade,
  statut public.statut_cotisation not null default 'a_payer',
  moyen text check (moyen in ('wave', 'orange_money')),
  capture_path text,
  declare_at timestamptz,
  paye_at timestamptz,
  unique (tour_id, membre_id)
);
create index cotisations_membre on public.cotisations (membre_id);
-- « en_retard » n'est pas stocké : statut <> 'paye' et échéance du tour dépassée.

-- Journal en ajout seul (P4). Les clés étrangères sont en « restrict » :
-- l'historique ne disparaît jamais, même si une tontine ou un membre est supprimé.
create table public.evenements (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines (id) on delete restrict,
  membre_id uuid references public.membres (id) on delete restrict,
  auteur_id uuid references public.profils (id) on delete restrict,
  type text not null check (
    type in (
      'declaration', 'confirmation', 'relance', 'penalite', 'penalite_annulee',
      'tirage', 'echange', 'reglement_accepte', 'membre_rejoint', 'cycle_termine'
    )
  ),
  donnees jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index evenements_tontine on public.evenements (tontine_id, created_at);
create index evenements_membre on public.evenements (membre_id);
create index evenements_auteur on public.evenements (auteur_id);

create table public.evenements_calendrier (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  date_debut date not null,
  date_fin date,
  created_at timestamptz not null default now(),
  check (date_fin is null or date_fin >= date_debut)
);
create index evenements_calendrier_date on public.evenements_calendrier (date_debut);

create table public.abonnements (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references public.profils (id),
  palier public.palier not null,
  periodicite text not null check (periodicite in ('mensuel', 'annuel')),
  statut text not null check (statut in ('actif', 'expire', 'en_attente')),
  expire_at timestamptz,
  created_at timestamptz not null default now()
);
create index abonnements_profil on public.abonnements (profil_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references public.profils (id),
  tontine_id uuid references public.tontines (id),
  type text not null,
  titre text not null,
  corps text not null,
  lu_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profil on public.notifications (profil_id, created_at desc);
create index notifications_tontine on public.notifications (tontine_id);

-- ---------------------------------------------------------------------------
-- Journal en ajout seul : personne (pas même service_role ou postgres)
-- ne peut modifier ni supprimer un événement.
-- ---------------------------------------------------------------------------
create function public.evenements_ajout_seul()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Le journal des événements est en ajout seul (% interdit).', tg_op
    using errcode = '42501';
end;
$$;

create trigger evenements_pas_de_modification
  before update or delete on public.evenements
  for each row execute function public.evenements_ajout_seul();

create trigger evenements_pas_de_vidage
  before truncate on public.evenements
  for each statement execute function public.evenements_ajout_seul();

-- ---------------------------------------------------------------------------
-- Fonctions d'aide pour la RLS (security definer : évite la récursion sur membres)
-- ---------------------------------------------------------------------------
create function public.est_membre(p_tontine_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.membres m
    where m.tontine_id = p_tontine_id and m.profil_id = (select auth.uid())
  ) or exists (
    select 1 from public.tontines t
    where t.id = p_tontine_id and t.gerante_id = (select auth.uid())
  );
$$;

create function public.est_gerante(p_tontine_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tontines t
    where t.id = p_tontine_id and t.gerante_id = (select auth.uid())
  );
$$;

-- Vrai si l'utilisatrice connectée partage au moins une tontine avec ce profil.
create function public.partage_une_tontine(p_profil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membres moi
    join public.membres autre on autre.tontine_id = moi.tontine_id
    where moi.profil_id = (select auth.uid()) and autre.profil_id = p_profil_id
  );
$$;

revoke execute on function public.est_membre(uuid) from public, anon;
revoke execute on function public.est_gerante(uuid) from public, anon;
revoke execute on function public.partage_une_tontine(uuid) from public, anon;
grant execute on function public.est_membre(uuid) to authenticated;
grant execute on function public.est_gerante(uuid) to authenticated;
grant execute on function public.partage_une_tontine(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Privilèges : anon n'a accès à rien ; authenticated n'écrit que ce qui est listé.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke insert, update, delete, truncate on all tables in schema public from authenticated;
revoke update, delete, truncate on public.evenements from service_role;

grant insert (id, prenom, telephone, consentement_at, consentement_version, langue)
  on public.profils to authenticated;
grant update (prenom, langue, expo_push_token) on public.profils to authenticated;
grant update (lu_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- RLS sur toutes les tables
-- ---------------------------------------------------------------------------
alter table public.profils enable row level security;
alter table public.tontines enable row level security;
alter table public.reglements enable row level security;
alter table public.membres enable row level security;
alter table public.tours enable row level security;
alter table public.cotisations enable row level security;
alter table public.evenements enable row level security;
alter table public.evenements_calendrier enable row level security;
alter table public.abonnements enable row level security;
alter table public.notifications enable row level security;

-- profils : chacun lit, crée et modifie son propre profil.
-- Les prénoms et téléphones des autres membres passent par la vue profils_publics.
create policy "profils : lecture du sien" on public.profils
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profils : création du sien" on public.profils
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and telephone = coalesce((select auth.jwt()) ->> 'phone', '')
  );

create policy "profils : modification du sien" on public.profils
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Données des tontines : lecture pour les membres, écriture via fonctions serveur seulement.
create policy "tontines : lecture membres" on public.tontines
  for select to authenticated
  using (gerante_id = (select auth.uid()) or public.est_membre(id));

create policy "reglements : lecture membres" on public.reglements
  for select to authenticated
  using (public.est_membre(tontine_id));

create policy "membres : lecture membres" on public.membres
  for select to authenticated
  using (public.est_membre(tontine_id));

create policy "tours : lecture membres" on public.tours
  for select to authenticated
  using (public.est_membre(tontine_id));

create policy "cotisations : lecture membres" on public.cotisations
  for select to authenticated
  using (
    exists (
      select 1 from public.tours t
      where t.id = tour_id and public.est_membre(t.tontine_id)
    )
  );

create policy "evenements : lecture membres" on public.evenements
  for select to authenticated
  using (public.est_membre(tontine_id));

create policy "evenements_calendrier : lecture" on public.evenements_calendrier
  for select to authenticated
  using (true);

create policy "abonnements : lecture du sien" on public.abonnements
  for select to authenticated
  using (profil_id = (select auth.uid()));

create policy "notifications : lecture des siennes" on public.notifications
  for select to authenticated
  using (profil_id = (select auth.uid()));

create policy "notifications : marquer lues" on public.notifications
  for update to authenticated
  using (profil_id = (select auth.uid()))
  with check (profil_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Vue : prénom et téléphone des personnes qui partagent une tontine avec soi
-- (docs/architecture.md, section 4). N'expose ni consentement ni jeton push.
-- ---------------------------------------------------------------------------
create view public.profils_publics
with (security_barrier = true)
as
  select p.id, p.prenom, p.telephone
  from public.profils p
  where p.id = (select auth.uid()) or public.partage_une_tontine(p.id);

revoke all on public.profils_publics from anon, public;
grant select on public.profils_publics to authenticated;
