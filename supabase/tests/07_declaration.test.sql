-- Étape 6 : declarer_paiement, joindre_capture, Storage.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, aud, role, phone) values
  ('99999999-9999-4999-8999-999999999991', 'authenticated', 'authenticated', '221789999991'),
  ('99999999-9999-4999-8999-999999999992', 'authenticated', 'authenticated', '221789999992'),
  ('99999999-9999-4999-8999-999999999993', 'authenticated', 'authenticated', '221789999993');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('99999999-9999-4999-8999-999999999991', 'Gérante', '221789999991', now(), 'v1'),
  ('99999999-9999-4999-8999-999999999992', 'Membre', '221789999992', now(), 'v1'),
  ('99999999-9999-4999-8999-999999999993', 'Intruse', '221789999993', now(), 'v1');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('99999999-9999-4999-8999-999999999991', 'starter', 'mensuel', 'actif');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999991","role":"authenticated"}', true);
create temp table t as select * from public.creer_tontine('Duo', 'classique', null, 2000, 'semaine', 2, current_date);
grant select on t to authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999992","role":"authenticated"}', true);
select public.rejoindre_tontine((select code from t), 1);
create temp table cot as
  select c.id, m.tontine_id from public.cotisations c join public.membres m on m.id = c.membre_id
  join public.tours tr on tr.id = c.tour_id
  where m.profil_id = '99999999-9999-4999-8999-999999999992' and tr.numero = 1;
grant select on cot to authenticated;

select throws_ok($$select public.declarer_paiement((select id from cot), 'especes')$$, 'moyen_invalide', 'moyen inconnu refusé');
select lives_ok($$select public.declarer_paiement((select id from cot), 'wave')$$, 'le membre déclare son paiement');
select is((select statut::text from public.cotisations where id = (select id from cot)), 'declare', 'cotisation déclarée');
select throws_ok($$select public.declarer_paiement((select id from cot), 'wave')$$, 'deja_declare', 'pas de double déclaration');
select throws_ok($$select public.joindre_capture((select id from cot), 'autre/chemin.jpg')$$, 'chemin_invalide', 'chemin de capture contrôlé');
select lives_ok($$select public.joindre_capture((select id from cot), (select tontine_id || '/' || id || '/1.jpg' from cot))$$, 'capture jointe');
select ok(public.capture_du_membre((select tontine_id || '/' || id || '/1.jpg' from cot)), 'Storage : le membre peut déposer sa capture');

select set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999991","role":"authenticated"}', true);
select ok(public.capture_de_ma_tontine((select tontine_id || '/' || id || '/1.jpg' from cot)), 'Storage : la gérante peut lire la capture');
select throws_ok($$select public.declarer_paiement((select id from cot), 'wave')$$, 'introuvable', 'on ne déclare pas pour une autre');

select set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999993","role":"authenticated"}', true);
select ok(not public.capture_du_membre((select tontine_id || '/' || id || '/1.jpg' from cot))
          and not public.capture_de_ma_tontine((select tontine_id || '/' || id || '/1.jpg' from cot)),
  'Storage : une autre personne ne peut ni déposer ni lire');

reset role;
select is((select count(*)::int from public.notifications where profil_id = '99999999-9999-4999-8999-999999999991' and type = 'declaration'), 1,
  'la gérante est notifiée de la déclaration');

select * from finish();
rollback;
