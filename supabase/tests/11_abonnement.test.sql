-- Étape 10 : abonnement et retrait du consentement.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, aud, role, phone) values
  ('dddd0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '221784000001');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('dddd0000-0000-4000-8000-000000000001', 'Nouvelle', '221784000001', now(), 'v1');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddd0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.creer_tontine('Test', 'classique', null, 1000, 'mois', 2, current_date)$$, 'limite_atteinte', 'sans abonnement : upsell');
select is((select statut from public.demander_abonnement('starter', 'mensuel')), 'en_attente', 'demande en attente');
select is((select palier::text from public.demander_abonnement('pro', 'annuel')), 'pro', 'la demande en attente est remplacée');
select is((select count(*)::int from public.abonnements), 1, 'une seule demande en attente');
select throws_ok($$select public.activer_abonnement((select id from public.abonnements where profil_id = 'dddd0000-0000-4000-8000-000000000001'))$$, '42501', null, 'une gérante ne peut pas s''activer elle-même');
select throws_ok($$select public.creer_tontine('Test', 'classique', null, 1000, 'mois', 2, current_date)$$, 'limite_atteinte', 'en attente : toujours bloquée');

reset role;
set local role service_role;
select is((select statut from public.activer_abonnement((select id from public.abonnements where profil_id = 'dddd0000-0000-4000-8000-000000000001'))), 'actif', 'activation manuelle');
reset role;
select ok((select expire_at > now() + interval '360 days' from public.abonnements where profil_id = 'dddd0000-0000-4000-8000-000000000001'), 'annuel : un an');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddd0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.creer_tontine('Test', 'classique', null, 1000, 'mois', 2, current_date)$$, 'abonnement actif : création possible');

select lives_ok($$select public.retirer_consentement()$$, 'retrait du consentement');
reset role;
select results_eq($$select prenom, telephone, (select phone from auth.users where id = 'dddd0000-0000-4000-8000-000000000001')
                  from public.profils where id = 'dddd0000-0000-4000-8000-000000000001'$$,
  $$values ('Ancien membre'::text, 'supprime-dddd0000-0000-4000-8000-000000000001'::text, null::text)$$,
  'prénom et numéro effacés, tontine conservée');

select * from finish();
rollback;
