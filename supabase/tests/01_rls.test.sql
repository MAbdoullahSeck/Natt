-- RLS : chaque membre ne voit que ses tontines ; aucune écriture directe sur les données métier.
begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

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

-- 1. RLS activée sur toutes les tables du schéma public.
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity), 0,
  'RLS activée sur toutes les tables'
);

-- 2. U1 (gérante de A) ne voit pas la tontine B.
select pg_temp.connecter('11111111-1111-4111-8111-111111111111', '221781111111');
select results_eq('select id from public.tontines', $$values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)$$,
  'U1 ne voit que sa tontine');
select is_empty($$select 1 from public.membres where tontine_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$, 'U1 ne voit pas les membres de B');
select is_empty($$select 1 from public.tours where tontine_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$, 'U1 ne voit pas les tours de B');
select is_empty($$select 1 from public.reglements where tontine_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$, 'U1 ne voit pas le règlement de B');
select is_empty($$select 1 from public.evenements where tontine_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$, 'U1 ne voit pas les événements de B');
select is_empty($$select 1 from public.cotisations where tour_id = 'b2b2b2b2-0000-4000-8000-000000000001'$$, 'U1 ne voit pas les cotisations de B');
select is((select count(*)::int from public.membres), 2, 'U1 voit les 2 membres de A');
select is((select count(*)::int from public.cotisations), 1, 'U1 voit les cotisations de A');
select is((select count(*)::int from public.evenements), 1, 'U1 voit les événements de A');

-- 3. U2 (simple membre de A) voit A, pas B.
select pg_temp.connecter('22222222-2222-4222-8222-222222222222', '221782222222');
select results_eq('select id from public.tontines', $$values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)$$,
  'U2, membre de A, voit A et seulement A');

-- 4. U3 ne voit pas A.
select pg_temp.connecter('33333333-3333-4333-8333-333333333333', '221783333333');
select results_eq('select id from public.tontines', $$values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)$$,
  'U3 ne voit pas une tontine dont il ne fait pas partie');
select is_empty($$select 1 from public.cotisations where tour_id = 'a2a2a2a2-0000-4000-8000-000000000001'$$, 'U3 ne voit pas les cotisations de A');

-- 5. Profils : la table ne montre que le sien ; la vue montre les co-membres.
select pg_temp.connecter('11111111-1111-4111-8111-111111111111', '221781111111');
select results_eq('select id from public.profils', $$values ('11111111-1111-4111-8111-111111111111'::uuid)$$,
  'profils : U1 ne lit que son propre profil');
select set_eq('select prenom from public.profils_publics', array['Test Un', 'Test Deux'],
  'profils_publics : U1 voit les personnes de ses tontines, pas les autres');
select throws_ok('select expo_push_token from public.profils_publics', '42703', null,
  'profils_publics n''expose pas le jeton push');

-- 6. Pas d'écriture directe sur les données métier.
select throws_ok($$insert into public.tontines (gerante_id, nom, montant, frequence, nb_membres, date_debut, code)
  values ('11111111-1111-4111-8111-111111111111', 'Directe', 5000, 'mois', 2, '2027-01-01', '333333')$$,
  '42501', null, 'insert direct dans tontines interdit');
select throws_ok($$update public.tontines set montant = 1000000$$, '42501', null, 'update direct de tontines interdit');
select throws_ok($$delete from public.tontines$$, '42501', null, 'delete direct de tontines interdit');
select throws_ok($$insert into public.membres (tontine_id, profil_id) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111')$$,
  '42501', null, 'impossible de s''ajouter soi-même à une tontine');
select throws_ok($$update public.cotisations set statut = 'paye'$$, '42501', null, 'impossible de marquer payé directement');
select throws_ok($$update public.tours set verse_at = now()$$, '42501', null, 'update direct de tours interdit');
select throws_ok($$insert into public.reglements (tontine_id, version, lignes) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2, array['x'])$$,
  '42501', null, 'insert direct de règlement interdit');
select throws_ok($$insert into public.abonnements (profil_id, palier, periodicite, statut) values ('11111111-1111-4111-8111-111111111111', 'illimite', 'annuel', 'actif')$$,
  '42501', null, 'impossible de s''attribuer un abonnement');

-- 7. Profil : modification limitée à son prénom, sa langue et son jeton push.
select throws_ok($$update public.profils set fondatrice = true where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'impossible de se déclarer gérante fondatrice');
select lives_ok($$update public.profils set prenom = 'Nouveau' where id = '11111111-1111-4111-8111-111111111111'$$,
  'U1 peut changer son prénom');
update public.profils set prenom = 'Pirate' where id = '22222222-2222-4222-8222-222222222222';
reset role;
select is((select prenom from public.profils where id = '22222222-2222-4222-8222-222222222222'), 'Test Deux',
  'U1 ne peut pas changer le prénom de U2');

-- 8. Création de profil : seulement le sien, avec son propre numéro.
select pg_temp.connecter('44444444-4444-4444-8444-444444444444', '221784444444');
select throws_ok($$insert into public.profils (id, prenom, telephone, consentement_at, consentement_version)
  values ('44444444-4444-4444-8444-444444444444', 'Quatre', '221789999999', now(), 'v1')$$,
  '42501', null, 'impossible de créer un profil avec le numéro d''une autre');
select throws_ok($$insert into public.profils (id, prenom, telephone, consentement_at, consentement_version)
  values ('11111111-1111-4111-8111-111111111111', 'Usurpée', '221784444444', now(), 'v1')$$,
  '42501', null, 'impossible de créer le profil d''une autre');
select lives_ok($$insert into public.profils (id, prenom, telephone, consentement_at, consentement_version)
  values ('44444444-4444-4444-8444-444444444444', 'Quatre', '221784444444', now(), 'v1')$$,
  'U4 crée son profil avec son numéro');
select is_empty('select 1 from public.tontines', 'une nouvelle inscrite ne voit aucune tontine');

-- 9. Notifications et abonnements : seulement les siens.
select pg_temp.connecter('11111111-1111-4111-8111-111111111111', '221781111111');
select results_eq('select titre from public.notifications', $$values ('Pour U1')$$, 'U1 ne lit que ses notifications');
select is((select count(*)::int from public.abonnements), 1, 'U1 ne lit que son abonnement');
select lives_ok('update public.notifications set lu_at = now()', 'U1 peut marquer ses notifications lues');
select throws_ok($$update public.notifications set titre = 'x'$$, '42501', null, 'U1 ne peut pas réécrire une notification');

-- 10. Anonyme : aucun accès.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok('select * from public.tontines', '42501', null, 'anon ne lit pas les tontines');
select throws_ok('select * from public.profils', '42501', null, 'anon ne lit pas les profils');

select * from finish();
rollback;
