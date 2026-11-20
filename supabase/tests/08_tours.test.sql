-- Étape 7 : tirage au sort et échange de tours.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, aud, role, phone) values
  ('aaaa0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '221781000001'),
  ('aaaa0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '221781000002'),
  ('aaaa0000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', '221781000003');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('aaaa0000-0000-4000-8000-000000000001', 'Gérante', '221781000001', now(), 'v1'),
  ('aaaa0000-0000-4000-8000-000000000002', 'Deux', '221781000002', now(), 'v1'),
  ('aaaa0000-0000-4000-8000-000000000003', 'Trois', '221781000003', now(), 'v1');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('aaaa0000-0000-4000-8000-000000000001', 'starter', 'mensuel', 'actif');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaa0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
create temp table t as select * from public.creer_tontine('Trio', 'classique', null, 2000, 'mois', 3, current_date + 30);
grant select on t to authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaa0000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select public.rejoindre_tontine((select code from t), 1);

reset role;
create temp table m as select id, profil_id, rang from public.membres where tontine_id = (select id from t);
select throws_ok($$select public.appliquer_tirage((select id from t), 'aaaa0000-0000-4000-8000-000000000001', array[]::uuid[], 'g', 'test')$$,
  'tontine_incomplete', 'tirage seulement quand la tontine est complète');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaa0000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select public.rejoindre_tontine((select code from t), 1);
reset role;
insert into m select id, profil_id, rang from public.membres where profil_id = 'aaaa0000-0000-4000-8000-000000000003';
grant select on t, m to service_role, authenticated;

select throws_ok($$select public.appliquer_tirage((select id from t), 'aaaa0000-0000-4000-8000-000000000002', (select array_agg(id) from m), 'g', 'test')$$,
  'reserve_gerante', 'seule la gérante peut demander le tirage');
select throws_ok($$select public.appliquer_tirage((select id from t), 'aaaa0000-0000-4000-8000-000000000001', (select array_agg(id) from m where rang < 3), 'g', 'test')$$,
  'ordre_invalide', 'l''ordre doit contenir tous les membres');

set local role authenticated;
select throws_ok($$select public.appliquer_tirage((select id from t), 'aaaa0000-0000-4000-8000-000000000001', (select array_agg(id) from m), 'g', 'test')$$,
  '42501', null, 'le client ne peut pas appeler appliquer_tirage directement');
reset role;

-- Ordre tiré : Trois, Gérante, Deux.
set local role service_role;
select lives_ok($$select public.appliquer_tirage((select id from t), 'aaaa0000-0000-4000-8000-000000000001',
  array[(select id from m where rang = 3), (select id from m where rang = 1), (select id from m where rang = 2)], 'graine', 'test')$$,
  'tirage appliqué');
reset role;
select is((select rang from public.membres where profil_id = 'aaaa0000-0000-4000-8000-000000000003'), 1, 'nouveau rang');
select is((select p.prenom from public.tours tr join public.membres mm on mm.id = tr.beneficiaire_membre_id join public.profils p on p.id = mm.profil_id
           where tr.tontine_id = (select id from t) and tr.numero = 1), 'Trois', 'bénéficiaires mis à jour');
select throws_ok($$select public.appliquer_tirage((select id from t), 'aaaa0000-0000-4000-8000-000000000001', (select array_agg(id) from m), 'g', 'test')$$,
  'tirage_deja_fait', 'un seul tirage par cycle');
select is((select count(*)::int from public.notifications where type = 'tirage' and tontine_id = (select id from t)), 2, 'les membres sont notifiés');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaa0000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select public.marquer_tirage_vu((select id from t));
select is((select count(*)::int from public.vues_tirage v join public.evenements e on e.id = v.evenement_id where e.tontine_id = (select id from t)), 2, 'vu par 2 membres');
select throws_ok($$select public.echanger_tours((select id from m where rang = 1), (select id from m where rang = 2))$$,
  'reserve_gerante', 'seule la gérante peut échanger');

-- Échange Gérante (rang 2) <-> Deux (rang 3).
select set_config('request.jwt.claims', '{"sub":"aaaa0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.echanger_tours(
  (select id from public.membres where profil_id = 'aaaa0000-0000-4000-8000-000000000001' and tontine_id = (select id from t)),
  (select id from public.membres where profil_id = 'aaaa0000-0000-4000-8000-000000000002' and tontine_id = (select id from t)))$$,
  'échange des tours');
select results_eq($$select rang from public.membres where tontine_id = (select id from t) order by profil_id$$,
  $$values (3), (2), (1)$$, 'rangs échangés');
reset role;
select is((select count(*)::int from public.notifications where type = 'echange' and tontine_id = (select id from t)), 1,
  'le membre concerné est notifié (pas la gérante elle-même)');

select * from finish();
rollback;
