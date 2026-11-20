-- Le journal des événements est en ajout seul : personne ne peut le modifier.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Jeu de données propre au test (annulé par le rollback final).
-- U1 gère T_A (membres : U1, U2). U3 gère T_B (membre : U3). U4 n'a pas encore de profil.
insert into auth.users (id, aud, role, phone) values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', '221781111111'),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', '221782222222'),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', '221783333333'),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', '221784444444');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('11111111-1111-4111-8111-111111111111', 'Test Un', '221781111111', now(), 'v1'),
  ('22222222-2222-4222-8222-222222222222', 'Test Deux', '221782222222', now(), 'v1'),
  ('33333333-3333-4333-8333-333333333333', 'Test Trois', '221783333333', now(), 'v1');
insert into public.tontines (id, gerante_id, nom, montant, frequence, nb_membres, date_debut, code, statut) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Tontine A', 5000, 'mois', 2, '2027-01-01', '111111', 'en_cours'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 'Tontine B', 5000, 'mois', 2, '2027-01-01', '222222', 'en_preparation');
insert into public.reglements (tontine_id, version, lignes) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, array['A']),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1, array['B']);
insert into public.membres (id, tontine_id, profil_id, rang) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 1),
  ('a1a1a1a1-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 2),
  ('b1b1b1b1-0000-4000-8000-000000000003', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 1);
insert into public.tours (id, tontine_id, numero, echeance) values
  ('a2a2a2a2-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, '2027-01-01'),
  ('b2b2b2b2-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1, '2027-01-01');
insert into public.cotisations (tour_id, membre_id) values
  ('a2a2a2a2-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000002'),
  ('b2b2b2b2-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000003');
insert into public.evenements (id, tontine_id, membre_id, auteur_id, type) values
  ('a3a3a3a3-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1a1a1a1-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'membre_rejoint'),
  ('b3b3b3b3-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b1b1b1b1-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'membre_rejoint');
insert into public.notifications (profil_id, tontine_id, type, titre, corps) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'test', 'Pour U1', '…'),
  ('33333333-3333-4333-8333-333333333333', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'test', 'Pour U3', '…');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('11111111-1111-4111-8111-111111111111', 'starter', 'mensuel', 'actif'),
  ('33333333-3333-4333-8333-333333333333', 'pro', 'mensuel', 'actif');

-- Se connecter en tant qu'une utilisatrice (jeton JWT simulé).
create function pg_temp.connecter(p_id uuid, p_tel text) returns void language sql as $f$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims',
                    json_build_object('sub', p_id, 'role', 'authenticated', 'phone', p_tel)::text, true);
$f$;

-- Membre connectée : ni ajout direct, ni modification, ni suppression.
select pg_temp.connecter('11111111-1111-4111-8111-111111111111', '221781111111');
select throws_ok($$insert into public.evenements (tontine_id, type) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'confirmation')$$,
  '42501', null, 'membre : insert direct interdit');
select throws_ok($$update public.evenements set type = 'confirmation'$$, '42501', null, 'membre : update interdit');
select throws_ok($$delete from public.evenements$$, '42501', null, 'membre : delete interdit');

-- service_role (Edge Functions) : peut ajouter, jamais modifier ni supprimer.
reset role;
set local role service_role;
select lives_ok($$insert into public.evenements (tontine_id, type) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'relance')$$,
  'service_role : ajout autorisé');
select throws_ok($$update public.evenements set type = 'confirmation'$$, '42501', null, 'service_role : update interdit');
select throws_ok($$delete from public.evenements$$, '42501', null, 'service_role : delete interdit');

-- Propriétaire de la base : le déclencheur bloque quand même.
reset role;
select throws_ok($$update public.evenements set donnees = '{"x":1}'$$, '42501', null, 'postgres : update bloqué par le déclencheur');
select throws_ok($$delete from public.evenements where id = 'a3a3a3a3-0000-4000-8000-000000000001'$$, '42501', null, 'postgres : delete bloqué');
select throws_ok($$truncate public.evenements cascade$$, '42501', null, 'postgres : truncate bloqué');
select throws_ok($$delete from public.tontines where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, '23503', null,
  'supprimer une tontine ne peut pas effacer son historique');
select is((select count(*)::int from public.evenements where tontine_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 2,
  'l''historique est intact');

select * from finish();
rollback;
