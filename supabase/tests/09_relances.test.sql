-- Étape 8 : réglages, règlement versionné, relances et pénalités.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, aud, role, phone) values
  ('bbbb0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '221782000001'),
  ('bbbb0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '221782000002'),
  ('bbbb0000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', '221782000003');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version) values
  ('bbbb0000-0000-4000-8000-000000000001', 'Gérante', '221782000001', now(), 'v1'),
  ('bbbb0000-0000-4000-8000-000000000002', 'Ponctuelle', '221782000002', now(), 'v1'),
  ('bbbb0000-0000-4000-8000-000000000003', 'Retard', '221782000003', now(), 'v1');
insert into public.abonnements (profil_id, palier, periodicite, statut) values
  ('bbbb0000-0000-4000-8000-000000000001', 'starter', 'mensuel', 'actif');

-- Tontine hebdomadaire de 3 membres, premier tour aujourd'hui.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbb0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
create temp table t as select * from public.creer_tontine('Hebdo', 'classique', null, 1000, 'semaine', 3, current_date);
grant select on t to authenticated, service_role;
select set_config('request.jwt.claims', '{"sub":"bbbb0000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select public.rejoindre_tontine((select code from t), 1);
select set_config('request.jwt.claims', '{"sub":"bbbb0000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select public.rejoindre_tontine((select code from t), 1);

-- Réglages : pénalité de 500 F → règlement v2, à accepter par les membres.
select throws_ok($$select public.modifier_reglages((select id from t), true, true, true, 500)$$, 'reserve_gerante', 'réglages réservés à la gérante');
select set_config('request.jwt.claims', '{"sub":"bbbb0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.modifier_reglages((select id from t), false, true, true, 500)$$, 'la gérante change les réglages');
select is((select max(version) from public.reglements where tontine_id = (select id from t)), 2, 'pénalité modifiée : règlement v2');
select ok((select 'Pénalité de 500' || U&'\00A0' || 'F par retard.' = any (lignes) from public.reglements where tontine_id = (select id from t) and version = 2),
  'la pénalité apparaît dans le règlement');
select is((select reglement_version_acceptee from public.membres where profil_id = 'bbbb0000-0000-4000-8000-000000000001' and tontine_id = (select id from t)), 2,
  'la gérante accepte d''office la nouvelle version');
select is(public.modifier_reglement((select id from t), array['Rendez-vous chez Awa', '  ']), 3, 'ligne libre : règlement v3');
select is((select lignes[array_upper(lignes, 1)] from public.reglements where tontine_id = (select id from t) and version = 3), 'Rendez-vous chez Awa', 'ligne libre ajoutée à la fin');

select set_config('request.jwt.claims', '{"sub":"bbbb0000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok($$select public.accepter_reglement((select id from t), 2)$$, 'reglement_change', 'il faut accepter la dernière version');
select lives_ok($$select public.accepter_reglement((select id from t), 3)$$, 'le membre accepte la v3');

-- Ponctuelle déclare le tour 1 aujourd'hui (à temps). Retard ne fait rien.
select public.declarer_paiement((select c.id from public.cotisations c join public.membres m on m.id = c.membre_id join public.tours tr on tr.id = c.tour_id
  where m.profil_id = 'bbbb0000-0000-4000-8000-000000000002' and tr.numero = 1), 'wave');

reset role;
-- Relances automatiques : jour J (tour 1) pour Retard seulement ; J-3 désactivé.
set local role service_role;
select is((public.preparer_relances(current_date) ->> 'relances')::int, 1, 'jour J : une relance (celle qui n''a rien déclaré)');
select is((public.preparer_relances(current_date) ->> 'relances')::int, 0, 'relances idempotentes');
-- Lendemain : J+1, récapitulatif à la gérante, pénalité pour Retard seulement.
select is(public.preparer_relances(current_date + 1) - 'jour', '{"relances": 1, "penalites": 1, "recapitulatifs": 1}'::jsonb,
  'J+1 : relance, récapitulatif et pénalité');
select is((public.preparer_relances(current_date + 2) ->> 'penalites')::int, 0, 'une seule pénalité par tour');
reset role;
select is((select count(*)::int from public.evenements e join public.membres m on m.id = e.membre_id
           where e.type = 'penalite' and m.profil_id = 'bbbb0000-0000-4000-8000-000000000002'), 0,
  'pas de pénalité pour une déclaration à temps');

-- Relances manuelles.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbb0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is(public.relancer((select id from t)), 0, 'aujourd''hui personne n''est en retard (échéance du jour)');
select is(public.relancer((select id from t), (select id from public.membres where profil_id = 'bbbb0000-0000-4000-8000-000000000003' and tontine_id = (select id from t))), 1,
  'relance manuelle d''un membre');
select throws_ok($$select public.relancer((select id from t), (select id from public.membres where profil_id = 'bbbb0000-0000-4000-8000-000000000003' and tontine_id = (select id from t)))$$,
  'deja_relance_aujourdhui', 'une relance manuelle par membre et par jour');
select throws_ok($$select public.relancer((select id from t), (select id from public.membres where profil_id = 'bbbb0000-0000-4000-8000-000000000002' and tontine_id = (select id from t)))$$,
  'rien_a_relancer', 'pas de relance pour un paiement déjà déclaré');

-- Annulation de pénalité.
select lives_ok($$select public.annuler_penalite((select e.id from public.evenements e where e.type = 'penalite' and e.tontine_id = (select id from t)))$$,
  'la gérante annule la pénalité');
select throws_ok($$select public.annuler_penalite((select e.id from public.evenements e where e.type = 'penalite' and e.tontine_id = (select id from t)))$$,
  'deja_annulee', 'pas de double annulation');

select * from finish();
rollback;
