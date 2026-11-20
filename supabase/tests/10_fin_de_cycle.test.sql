-- Étape 9 : relance du cycle.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, aud, role, phone) values
  ('cccc0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '221783000001'),
  ('cccc0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '221783000002');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('cccc0000-0000-4000-8000-000000000001', 'Gérante', '221783000001', now(), 'v1'),
  ('cccc0000-0000-4000-8000-000000000002', 'Membre', '221783000002', now(), 'v1');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('cccc0000-0000-4000-8000-000000000001', 'starter', 'mensuel', 'actif');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccc0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
create temp table t as select * from public.creer_tontine('Duo', 'achat_groupe', 'Ventilateur', 3000, 'jour', 2, current_date);
grant select on t to authenticated;
select public.modifier_reglages((select id from t), true, false, true, 250);
select set_config('request.jwt.claims', '{"sub":"cccc0000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select public.rejoindre_tontine((select code from t), 2);
select set_config('request.jwt.claims', '{"sub":"cccc0000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select throws_ok($$select public.relancer_cycle((select id from t), current_date)$$, 'cycle_non_termine', 'cycle en cours : pas de relance');
select public.marquer_verse(tr.id) from public.tours tr where tr.tontine_id = (select id from t) order by tr.numero;
select is((select statut::text from public.tontines where id = (select id from t)), 'terminee', 'clôture au dernier tour versé');

create temp table n as select * from public.relancer_cycle((select id from t), current_date + 1);
select is((select cycle_precedent_id from n), (select id from t), 'nouveau cycle lié à l''ancien');
select isnt((select code from n), (select code from t), 'nouveau code');
select is((select penalite_retard from n), 250, 'mêmes réglages');
select ok((select 'Pénalité de 250' || U&'\00A0' || 'F par retard.' = any (lignes) from public.reglements where tontine_id = (select id from n)),
  'règlement v1 du nouveau cycle avec la pénalité');
select throws_ok($$select public.relancer_cycle((select id from t), current_date)$$, 'cycle_deja_relance', 'une seule relance par cycle');

reset role;
select is((select count(*)::int from public.notifications where type = 'nouveau_cycle' and tontine_id = (select id from n)), 1,
  'les membres sont invités avec le nouveau code');

select * from finish();
rollback;
