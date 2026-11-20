-- Étape 4 : aperçu et rejoindre.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, aud, role, phone) values
  ('77777777-7777-4777-8777-777777777771', 'authenticated', 'authenticated', '221787777771'),
  ('77777777-7777-4777-8777-777777777772', 'authenticated', 'authenticated', '221787777772'),
  ('77777777-7777-4777-8777-777777777773', 'authenticated', 'authenticated', '221787777773');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('77777777-7777-4777-8777-777777777771', 'Gérante', '221787777771', now(), 'v1'),
  ('77777777-7777-4777-8777-777777777772', 'Binta', '221787777772', now(), 'v1'),
  ('77777777-7777-4777-8777-777777777773', 'Sokhna', '221787777773', now(), 'v1');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('77777777-7777-4777-8777-777777777771', 'pro', 'mensuel', 'actif');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777771","role":"authenticated"}', true);
create temp table t as select * from public.creer_tontine('Duo', 'classique', null, 2000, 'mois', 2, current_date);
grant select on t to authenticated;

select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777772","role":"authenticated"}', true);
select throws_ok($$select * from public.apercu_tontine('000000')$$, 'code_inconnu', 'code inconnu');
select is((select nb_inscrits from public.apercu_tontine((select code from t))), 1, 'aperçu : 1 inscrite sur 2');
select is((select gerante_prenom from public.apercu_tontine((select code from t))), 'Gérante', 'aperçu : prénom de la gérante');
select is((select reglement_version from public.apercu_tontine((select code from t))), 1, 'aperçu : règlement v1');
select is_empty($$select 1 from public.tontines$$, 'avant de rejoindre, la tontine n''est pas visible');
select throws_ok($$select public.rejoindre_tontine((select code from t), 0)$$, 'reglement_change', 'il faut accepter la dernière version');
select lives_ok($$select public.rejoindre_tontine((select code from t), 1)$$, 'Binta rejoint');
select is((select rang from public.membres where profil_id = '77777777-7777-4777-8777-777777777772'), 2, 'rang = ordre d''arrivée');
select is((select count(*)::int from public.cotisations c join public.membres m on m.id = c.membre_id
           where m.profil_id = '77777777-7777-4777-8777-777777777772'), 2, 'une cotisation par tour');
select is((select statut::text from public.tontines), 'en_cours', 'complète et date atteinte : en cours');
select throws_ok($$select * from public.apercu_tontine((select code from t))$$, 'deja_membre', 'déjà membre');

select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777773","role":"authenticated"}', true);
select throws_ok($$select * from public.apercu_tontine((select code from t))$$, 'tontine_complete', 'tontine complète');
select throws_ok($$select public.rejoindre_tontine((select code from t), 1)$$, 'tontine_complete', 'impossible de rejoindre une tontine complète');

reset role;
select is((select count(*)::int from public.notifications where profil_id = '77777777-7777-4777-8777-777777777771' and type = 'membre_rejoint'), 1,
  'la gérante est notifiée');

select * from finish();
rollback;
