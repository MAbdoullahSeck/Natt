-- Natt — données de démonstration (local uniquement : `supabase db reset`).
-- Personnes : Aminata, Fatou, Moussa, Khady, Mariama, Bineta, Coumba, Awa, Ndeye.
-- 3 tontines :
--   1. « Tontine des sœurs » — gérée par Aminata, classique, 10 000 F / mois, 6 membres, en cours.
--   2. « Frigo Médina »      — gérée par Fatou, achat groupé (Réfrigérateur), 25 000 F / mois, 4 membres.
--   3. « Tontine du marché » — gérée par Awa, 2 000 F / semaine, 8 places, en préparation.
--      Aminata n'en fait pas partie (utile pour vérifier la RLS).
-- Date de référence : 20 novembre 2026.
-- TODO : aligner noms, montants et statuts sur l'écran Accueil Figma (nœud 2:95).

-- ---------------------------------------------------------------------------
-- Utilisatrices (auth) et profils
-- ---------------------------------------------------------------------------
create function pg_temp.utilisatrice(p_id uuid, p_prenom text, p_tel text, p_fondatrice boolean default false)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, phone, phone_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    encrypted_password, confirmation_token, recovery_token,
    email_change_token_new, email_change, phone_change, phone_change_token,
    email_change_token_current, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated',
    p_tel, now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now(),
    '', '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id::text, p_id,
          jsonb_build_object('sub', p_id::text, 'phone', p_tel), 'phone', now(), now(), now());
  insert into public.profils (id, prenom, telephone, consentement_at, consentement_version, fondatrice)
  values (p_id, p_prenom, p_tel, '2026-09-01 10:00+00', 'v1', p_fondatrice);
end $$;

select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000001', 'Aminata', '221770000001', true);
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000002', 'Fatou',   '221770000002');
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000003', 'Moussa',  '221770000003');
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000004', 'Khady',   '221770000004');
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000005', 'Mariama', '221770000005');
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000006', 'Bineta',  '221770000006');
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000007', 'Coumba',  '221770000007');
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000008', 'Awa',     '221770000008');
select pg_temp.utilisatrice('a0000000-0000-4000-8000-000000000009', 'Ndeye',   '221770000009');

-- ---------------------------------------------------------------------------
-- Tontines
-- ---------------------------------------------------------------------------
insert into public.tontines
  (id, gerante_id, nom, type, bien_prevu, montant, frequence, nb_membres, date_debut, code, statut, penalite_retard)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Tontine des sœurs', 'classique', null, 10000, 'mois', 6, '2026-09-05', '482913', 'en_cours', 0),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'Frigo Médina', 'achat_groupe', 'Réfrigérateur', 25000, 'mois', 4, '2026-10-15', '175604', 'en_cours', 1000),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000008',
   'Tontine du marché', 'classique', null, 2000, 'semaine', 8, '2026-12-07', '903318', 'en_preparation', 0);

-- Règlement v1 (R1), généré à partir des paramètres.
insert into public.reglements (tontine_id, version, lignes) values
  ('b0000000-0000-4000-8000-000000000001', 1, array[
    'Chaque membre paie 10 000 F avant le 5 de chaque mois.',
    'Pas de pénalité de retard.',
    'La gérante fixe l’ordre des tours.']),
  ('b0000000-0000-4000-8000-000000000002', 1, array[
    'Chaque membre paie 25 000 F avant le 15 de chaque mois.',
    'Pénalité de 1 000 F par retard.',
    'Chaque membre reçoit un réfrigérateur à son tour.',
    'La gérante fixe l’ordre des tours.']),
  ('b0000000-0000-4000-8000-000000000003', 1, array[
    'Chaque membre paie 2 000 F chaque semaine, avant le lundi.',
    'Pas de pénalité de retard.',
    'L’ordre des tours sera tiré au sort.']);

-- ---------------------------------------------------------------------------
-- Membres (rang = ordre des tours), tours, cotisations
-- ---------------------------------------------------------------------------
create function pg_temp.membre(p_tontine uuid, p_profil uuid, p_rang int)
returns void language plpgsql as $$
declare
  v_id uuid;
  v_quand timestamptz := (select date_debut from public.tontines where id = p_tontine) - interval '20 days' + p_rang * interval '1 hour';
begin
  insert into public.membres (tontine_id, profil_id, rang, reglement_version_acceptee, reglement_accepte_at, created_at)
  values (p_tontine, p_profil, p_rang, 1, v_quand, v_quand)
  returning id into v_id;
  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees, created_at) values
    (p_tontine, v_id, p_profil, 'membre_rejoint', '{}', v_quand),
    (p_tontine, v_id, p_profil, 'reglement_accepte', '{"version":1}', v_quand);
end $$;

select pg_temp.membre('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 1);
select pg_temp.membre('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 2);
select pg_temp.membre('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 3);
select pg_temp.membre('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 4);
select pg_temp.membre('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 5);
select pg_temp.membre('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', 6);

select pg_temp.membre('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 1);
select pg_temp.membre('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 2);
select pg_temp.membre('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000007', 3);
select pg_temp.membre('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 4);

select pg_temp.membre('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000008', 1);
select pg_temp.membre('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000009', 2);
select pg_temp.membre('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 3);

-- Tours (T5 : échéances depuis la date de début et la fréquence), bénéficiaire = membre de même rang,
-- et une cotisation « à payer » par membre et par tour pour les tontines en cours.
create function pg_temp.tours(p_tontine uuid)
returns void language plpgsql as $$
declare
  t public.tontines;
  pas interval;
  n int;
  v_tour uuid;
begin
  select * into t from public.tontines where id = p_tontine;
  pas := case t.frequence when 'jour' then interval '1 day' when 'semaine' then interval '1 week' else interval '1 month' end;
  for n in 1 .. t.nb_membres loop
    insert into public.tours (tontine_id, numero, echeance, beneficiaire_membre_id)
    values (p_tontine, n, (t.date_debut + (n - 1) * pas)::date,
            (select id from public.membres where tontine_id = p_tontine and rang = n))
    returning id into v_tour;
    if t.statut = 'en_cours' then
      insert into public.cotisations (tour_id, membre_id)
      select v_tour, m.id from public.membres m where m.tontine_id = p_tontine;
    end if;
  end loop;
end $$;

select pg_temp.tours('b0000000-0000-4000-8000-000000000001');
select pg_temp.tours('b0000000-0000-4000-8000-000000000002');
select pg_temp.tours('b0000000-0000-4000-8000-000000000003');

-- Déclare (et éventuellement confirme) un paiement, avec les événements correspondants.
create function pg_temp.paiement(p_tontine uuid, p_tour int, p_prenom text, p_moyen text, p_quand timestamptz, p_confirme boolean)
returns void language plpgsql as $$
declare
  v_cot uuid;
  v_membre uuid;
  v_profil uuid;
  v_gerante uuid := (select gerante_id from public.tontines where id = p_tontine);
begin
  select c.id, m.id, m.profil_id into v_cot, v_membre, v_profil
  from public.cotisations c
  join public.tours t on t.id = c.tour_id
  join public.membres m on m.id = c.membre_id
  join public.profils p on p.id = m.profil_id
  where t.tontine_id = p_tontine and t.numero = p_tour and p.prenom = p_prenom;

  update public.cotisations
  set statut = case when p_confirme then 'paye' else 'declare' end::public.statut_cotisation,
      moyen = p_moyen, declare_at = p_quand,
      paye_at = case when p_confirme then p_quand + interval '2 hours' end
  where id = v_cot;

  insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees, created_at)
  values (p_tontine, v_membre, v_profil, 'declaration', jsonb_build_object('cotisation_id', v_cot, 'moyen', p_moyen), p_quand);
  if p_confirme then
    insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees, created_at)
    values (p_tontine, v_membre, v_gerante, 'confirmation', jsonb_build_object('cotisation_id', v_cot), p_quand + interval '2 hours');
  end if;
end $$;

-- Tontine des sœurs : tours 1 et 2 payés et versés.
select pg_temp.paiement('b0000000-0000-4000-8000-000000000001', tour, prenom,
                        case when tour = 1 then 'wave' else 'orange_money' end,
                        (date '2026-09-05' + (tour - 1) * interval '1 month') - interval '2 days', true)
from generate_series(1, 2) tour,
     unnest(array['Aminata', 'Fatou', 'Moussa', 'Khady', 'Mariama', 'Bineta']) prenom;
update public.tours set verse_at = echeance + interval '10 hours'
where tontine_id = 'b0000000-0000-4000-8000-000000000001' and numero in (1, 2);

-- Tour 3 (échéance 5 novembre) : tout le monde a payé sauf Moussa → « En retard ».
select pg_temp.paiement('b0000000-0000-4000-8000-000000000001', 3, prenom, 'wave', '2026-11-03 09:00+00', true)
from unnest(array['Aminata', 'Fatou', 'Khady', 'Mariama', 'Bineta']) prenom;
insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees, created_at)
select 'b0000000-0000-4000-8000-000000000001', m.id, 'a0000000-0000-4000-8000-000000000001',
       'relance', '{"manuelle":true}', '2026-11-06 09:00+00'
from public.membres m
where m.tontine_id = 'b0000000-0000-4000-8000-000000000001' and m.profil_id = 'a0000000-0000-4000-8000-000000000003';

-- Tour 4 (échéance 5 décembre) : Aminata a payé, Fatou a déclaré (« En attente »), les autres à payer.
select pg_temp.paiement('b0000000-0000-4000-8000-000000000001', 4, 'Aminata', 'wave', '2026-11-18 10:00+00', true);
select pg_temp.paiement('b0000000-0000-4000-8000-000000000001', 4, 'Fatou', 'wave', '2026-11-19 18:30+00', false);

-- Frigo Médina : tour 1 versé ; tour 2 (15 novembre) : Coumba a déclaré, Mariama en retard avec pénalité.
select pg_temp.paiement('b0000000-0000-4000-8000-000000000002', 1, prenom, 'orange_money', '2026-10-13 12:00+00', true)
from unnest(array['Fatou', 'Aminata', 'Coumba', 'Mariama']) prenom;
update public.tours set verse_at = '2026-10-15 16:00+00'
where tontine_id = 'b0000000-0000-4000-8000-000000000002' and numero = 1;
select pg_temp.paiement('b0000000-0000-4000-8000-000000000002', 2, prenom, 'wave', '2026-11-12 08:00+00', true)
from unnest(array['Fatou', 'Aminata']) prenom;
select pg_temp.paiement('b0000000-0000-4000-8000-000000000002', 2, 'Coumba', 'orange_money', '2026-11-15 20:00+00', false);
insert into public.evenements (tontine_id, membre_id, auteur_id, type, donnees, created_at)
select 'b0000000-0000-4000-8000-000000000002', m.id, null, 'penalite',
       jsonb_build_object('montant', 1000, 'tour', 2), '2026-11-16 09:00+00'
from public.membres m
where m.tontine_id = 'b0000000-0000-4000-8000-000000000002' and m.profil_id = 'a0000000-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------
-- Abonnements (B1, B5 : activation manuelle en attendant la décision d'encaissement)
-- ---------------------------------------------------------------------------
insert into public.abonnements (profil_id, palier, periodicite, statut, expire_at) values
  ('a0000000-0000-4000-8000-000000000001', 'starter', 'mensuel', 'actif', '2026-12-20 23:59+00'),
  ('a0000000-0000-4000-8000-000000000002', 'pro', 'annuel', 'actif', '2027-10-01 23:59+00'),
  ('a0000000-0000-4000-8000-000000000008', 'starter', 'mensuel', 'actif', '2026-12-01 23:59+00');

-- ---------------------------------------------------------------------------
-- Notifications (écran 22)
-- ---------------------------------------------------------------------------
insert into public.notifications (profil_id, tontine_id, type, titre, corps, created_at, lu_at) values
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'declaration',
   'Paiement à vérifier', 'Fatou dit avoir payé 10 000 F.', '2026-11-19 18:31+00', null),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'rappel',
   'Rappel de paiement', 'Frigo Médina : 25 000 F à payer avant le 15 décembre.', '2026-11-20 09:00+00', null),
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'relance',
   'Paiement en retard', 'Tontine des sœurs : 10 000 F à payer à Aminata.', '2026-11-06 09:00+00', null),
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'tour',
   'Ton tour approche', 'Tontine des sœurs : tu reçois la cagnotte le 5 décembre.', '2026-11-20 09:00+00', null);

-- ---------------------------------------------------------------------------
-- Calendrier (C1). Dates des fêtes religieuses APPROXIMATIVES (calendrier lunaire,
-- ±1 jour selon l'observation de la lune) : à confirmer avant mise en production.
-- ---------------------------------------------------------------------------
insert into public.evenements_calendrier (nom, date_debut, date_fin) values
  ('Rentrée scolaire', '2026-10-01', null),
  ('Ramadan', '2027-02-08', '2027-03-09'),
  ('Korité', '2027-03-10', null),
  ('Tabaski', '2027-05-17', null),
  ('Tamkharit', '2027-06-16', null),
  ('Magal de Touba', '2027-07-25', null),
  ('Gamou', '2027-08-15', null),
  ('Rentrée scolaire', '2027-10-01', null);
