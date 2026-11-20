-- Étape 2 : création du profil par creer_profil.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, aud, role, phone) values
  ('55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', '221785555555');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);

select throws_ok($$select public.creer_profil('A', 'v1')$$, 'prenom_invalide', 'prénom trop court refusé');
select throws_ok($$select public.creer_profil('Awa', '')$$, 'consentement_requis', 'consentement obligatoire');
select lives_ok($$select public.creer_profil('  Awa  ', 'v1')$$, 'création du profil');
select is((select telephone from public.profils where id = '55555555-5555-4555-8555-555555555555'), '221785555555',
  'le téléphone vient du compte Auth');
select is((select prenom from public.profils where id = '55555555-5555-4555-8555-555555555555'), 'Awa', 'prénom nettoyé');

reset role;
set local role anon;
select throws_ok($$select public.creer_profil('Awa', 'v1')$$, '42501', null, 'anon ne peut pas créer de profil');

select * from finish();
rollback;
