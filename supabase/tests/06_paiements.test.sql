-- Étape 5 : confirmer_paiement et marquer_verse.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, aud, role, phone) values
  ('88888888-8888-4888-8888-888888888881', 'authenticated', 'authenticated', '221788888881'),
  ('88888888-8888-4888-8888-888888888882', 'authenticated', 'authenticated', '221788888882');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('88888888-8888-4888-8888-888888888881', 'Gérante', '221788888881', now(), 'v1'),
  ('88888888-8888-4888-8888-888888888882', 'Membre', '221788888882', now(), 'v1');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('88888888-8888-4888-8888-888888888881', 'starter', 'mensuel', 'actif');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888881","role":"authenticated"}', true);
create temp table t as select * from public.creer_tontine('Duo', 'classique', null, 2000, 'semaine', 2, current_date);
grant select on t to authenticated;
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888882","role":"authenticated"}', true);
select public.rejoindre_tontine((select code from t), 1);

create temp table ids as
select c.id as cot, tr.numero, m.profil_id, tr.id as tour
from public.cotisations c join public.tours tr on tr.id = c.tour_id join public.membres m on m.id = c.membre_id;
grant select on ids to authenticated;

-- Le membre ne peut pas confirmer son propre paiement.
select throws_ok($$select public.confirmer_paiement((select cot from ids where numero = 1 and profil_id = '88888888-8888-4888-8888-888888888882'))$$,
  'reserve_gerante', 'un membre ne peut pas confirmer');
select throws_ok($$select public.marquer_verse((select tour from ids where numero = 1 limit 1))$$,
  'reserve_gerante', 'un membre ne peut pas marquer versé');

select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888881","role":"authenticated"}', true);
select lives_ok($$select public.confirmer_paiement((select cot from ids where numero = 1 and profil_id = '88888888-8888-4888-8888-888888888882'))$$,
  'la gérante confirme');
select is((select statut::text from public.cotisations where id = (select cot from ids where numero = 1 and profil_id = '88888888-8888-4888-8888-888888888882')),
  'paye', 'cotisation payée');
select throws_ok($$select public.confirmer_paiement((select cot from ids where numero = 1 and profil_id = '88888888-8888-4888-8888-888888888882'))$$,
  'deja_paye', 'pas de double confirmation');
select is((select count(*)::int from public.evenements where type = 'confirmation'), 1, 'événement de confirmation');
select throws_ok($$select public.marquer_verse((select tour from ids where numero = 2 limit 1))$$,
  'tour_precedent_non_verse', 'les tours se versent dans l''ordre');
select is(public.marquer_verse((select tour from ids where numero = 1 limit 1)), 'en_cours'::public.statut_tontine, 'tour 1 versé');
select throws_ok($$select public.marquer_verse((select tour from ids where numero = 1 limit 1))$$, 'deja_verse', 'pas de double versement');
select is(public.marquer_verse((select tour from ids where numero = 2 limit 1)), 'terminee'::public.statut_tontine, 'dernier tour : tontine terminée');
select is((select count(*)::int from public.evenements where type = 'cycle_termine'), 1, 'événement de fin de cycle');

reset role;
select is((select count(*)::int from public.notifications where profil_id = '88888888-8888-4888-8888-888888888882' and type in ('confirmation', 'versement', 'cycle_termine')), 3,
  'le membre est notifié (confirmation, cagnotte, fin)');
select is((select count(*)::int from public.notifications where profil_id = '88888888-8888-4888-8888-888888888881' and type <> 'membre_rejoint'), 0,
  'la gérante ne se notifie pas elle-même');

select * from finish();
rollback;
