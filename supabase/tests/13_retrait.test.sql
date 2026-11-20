-- Point 6 : retirer un membre.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, aud, role, phone) values
  ('ffff0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '221786000001'),
  ('ffff0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '221786000002'),
  ('ffff0000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', '221786000003'),
  ('ffff0000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', '221786000004'),
  ('ffff0000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', '221786000005');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('ffff0000-0000-4000-8000-000000000001', 'Gérante', '221786000001', now(), 'v1'),
  ('ffff0000-0000-4000-8000-000000000002', 'Deux', '221786000002', now(), 'v1'),
  ('ffff0000-0000-4000-8000-000000000003', 'Trois', '221786000003', now(), 'v1'),
  ('ffff0000-0000-4000-8000-000000000004', 'Quatre', '221786000004', now(), 'v1'),
  ('ffff0000-0000-4000-8000-000000000005', 'Remplaçante', '221786000005', now(), 'v1');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('ffff0000-0000-4000-8000-000000000001', 'pro', 'mensuel', 'actif');

create function pg_temp.en_tant_que(p_id text) returns void language sql as $f$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$f$;
create function pg_temp.membre(p_profil text, p_tontine uuid) returns uuid language sql as $f$
  select id from public.membres where profil_id = p_profil::uuid and tontine_id = p_tontine
$f$;

-- A : en préparation (date future), 3 places, 2 inscrites.
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000001');
create temp table a as select * from public.creer_tontine('Prépa', 'classique', null, 1000, 'mois', 3, current_date + 30);
grant select on a to authenticated;
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000002');
select public.rejoindre_tontine((select code from a), 1);
select throws_ok($$select public.retirer_membre(pg_temp.membre('ffff0000-0000-4000-8000-000000000001', (select id from a)))$$,
  'reserve_gerante', 'seule la gérante peut retirer');
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000001');
select throws_ok($$select public.retirer_membre(pg_temp.membre('ffff0000-0000-4000-8000-000000000001', (select id from a)))$$,
  'retrait_gerante_impossible', 'la gérante ne se retire pas');
select is(public.retirer_membre(pg_temp.membre('ffff0000-0000-4000-8000-000000000002', (select id from a)), 'supprimer'), 'remplacer',
  'avant le démarrage : la place se libère (mode imposé)');
select is((select count(*)::int from public.cotisations c join public.membres m on m.id = c.membre_id
           where m.profil_id = 'ffff0000-0000-4000-8000-000000000002'), 0, 'ses cotisations sont supprimées');
select is((select beneficiaire_membre_id from public.tours where tontine_id = (select id from a) and numero = 2), null, 'son tour est libre');
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000002');
select is_empty($$select 1 from public.tontines where id = (select id from a)$$, 'le membre retiré ne voit plus la tontine');
select is((select nb_inscrits from public.apercu_tontine((select code from a))), 1, 'la place est de nouveau disponible');
select lives_ok($$select public.rejoindre_tontine((select code from a), 1)$$, 'il peut rejoindre de nouveau');
select is((select rang from public.membres where profil_id = 'ffff0000-0000-4000-8000-000000000002' and tontine_id = (select id from a)), 2,
  'il reprend la place libre (même ligne, historique conservé)');

-- B : en cours, 4 membres. Tour 1 versé à la gérante.
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000001');
create temp table b as select * from public.creer_tontine('Cycle', 'classique', null, 1000, 'mois', 4, current_date);
grant select on b to authenticated;
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000002'); select public.rejoindre_tontine((select code from b), 1);
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000003'); select public.rejoindre_tontine((select code from b), 1);
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000004'); select public.rejoindre_tontine((select code from b), 1);
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000003');
select public.declarer_paiement((select c.id from public.cotisations c join public.tours tr on tr.id = c.tour_id
  where c.membre_id = pg_temp.membre('ffff0000-0000-4000-8000-000000000003', (select id from b)) and tr.numero = 2), 'wave');
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000001');
select public.marquer_verse((select id from public.tours where tontine_id = (select id from b) and numero = 1));

select throws_ok($$select public.retirer_membre(pg_temp.membre('ffff0000-0000-4000-8000-000000000001', (select id from b)))$$,
  'retrait_gerante_impossible', 'la gérante (déjà servie) ne peut pas être retirée');

-- Déjà servi : Deux reçoit le tour 2.
select public.marquer_verse((select id from public.tours where tontine_id = (select id from b) and numero = 2));
select throws_ok($$select public.retirer_membre(pg_temp.membre('ffff0000-0000-4000-8000-000000000002', (select id from b)))$$,
  'deja_servi', 'déjà servi : retrait impossible');

-- Trois (tour 3, a déjà payé le tour 2 versé et rien d'autre) : tour supprimé.
select is(public.retirer_membre(pg_temp.membre('ffff0000-0000-4000-8000-000000000003', (select id from b)), 'supprimer'), 'supprimer',
  'pendant le cycle : tour supprimé');
select is((select nb_membres from public.tontines where id = (select id from b)), 3, 'la tontine passe à 3 membres');
select is((select count(*)::int from public.tours where tontine_id = (select id from b)), 3, 'un tour de moins');
select is((select rang from public.membres where id = pg_temp.membre('ffff0000-0000-4000-8000-000000000004', (select id from b))), 3,
  'Quatre avance au rang 3');
select is((select beneficiaire_membre_id from public.tours where tontine_id = (select id from b) and numero = 3),
  pg_temp.membre('ffff0000-0000-4000-8000-000000000004', (select id from b)), 'et reçoit le tour 3 (date inchangée)');
select is((select statut::text from public.cotisations c join public.tours tr on tr.id = c.tour_id
           where c.membre_id = pg_temp.membre('ffff0000-0000-4000-8000-000000000003', (select id from b)) and tr.numero = 2), 'declare',
  'ses paiements des tours déjà versés restent dans l''historique');
select is((select max(version) from public.reglements where tontine_id = (select id from b)), 2, 'règlement régénéré (cagnotte recalculée)');
select ok((select '…' || array_to_string(lignes, ' ') like '%cagnotte de 3' || U&'\202F' || '000%' from public.reglements
           where tontine_id = (select id from b) and version = 2), 'cagnotte : montant × 3');
select is((select count(*)::int from public.evenements where type = 'membre_retire'
           and membre_id = pg_temp.membre('ffff0000-0000-4000-8000-000000000003', (select id from b))), 1, 'événement dans l''historique');
reset role;
select is((select count(*)::int from public.notifications where profil_id = 'ffff0000-0000-4000-8000-000000000003' and type = 'membre_retire'), 1,
  'le membre retiré est notifié');

-- Remplacer : Quatre (tour 3) est retiré, une remplaçante rejoint et prend son tour.
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000001');
select is(public.retirer_membre(pg_temp.membre('ffff0000-0000-4000-8000-000000000004', (select id from b)), 'remplacer'), 'remplacer',
  'pendant le cycle : place gardée pour une remplaçante');
select pg_temp.en_tant_que('ffff0000-0000-4000-8000-000000000005');
select public.rejoindre_tontine((select code from b), 2);
reset role;
select is((select rang from public.membres where profil_id = 'ffff0000-0000-4000-8000-000000000005'), 3, 'la remplaçante prend le tour 3');
select is((select count(*)::int from public.cotisations c join public.membres m on m.id = c.membre_id
           where m.profil_id = 'ffff0000-0000-4000-8000-000000000005'), 1,
  'elle ne doit que les tours non versés');

select * from finish();
rollback;
