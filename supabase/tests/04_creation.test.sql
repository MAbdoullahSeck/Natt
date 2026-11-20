-- Étape 3 : creer_tontine, limites d'abonnement, mes_tontines.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, aud, role, phone) values
  ('66666666-6666-4666-8666-666666666661', 'authenticated', 'authenticated', '221786666661'),
  ('66666666-6666-4666-8666-666666666662', 'authenticated', 'authenticated', '221786666662'),
  ('66666666-6666-4666-8666-666666666663', 'authenticated', 'authenticated', '221786666663');
insert into public.profils (id, prenom, telephone, consentement_at, consentement_version, fondatrice) values
  ('66666666-6666-4666-8666-666666666661', 'Starter', '221786666661', now(), 'v1', false),
  ('66666666-6666-4666-8666-666666666662', 'Sans abonnement', '221786666662', now(), 'v1', false),
  ('66666666-6666-4666-8666-666666666663', 'Fondatrice', '221786666663', now(), 'v1', true);
insert into public.abonnements (profil_id, palier, periodicite, statut, expire_at) values
  ('66666666-6666-4666-8666-666666666661', 'starter', 'mensuel', 'actif', now() + interval '10 days'),
  ('66666666-6666-4666-8666-666666666662', 'pro', 'mensuel', 'expire', now() - interval '1 day'),
  ('66666666-6666-4666-8666-666666666662', 'illimite', 'mensuel', 'en_attente', null);

select is(public.limite_tontines('66666666-6666-4666-8666-666666666661'), 2, 'Starter : 2 tontines');
select is(public.limite_tontines('66666666-6666-4666-8666-666666666662'), 0, 'abonnement expiré ou en attente : 0');
select is(public.limite_tontines('66666666-6666-4666-8666-666666666663'), 2, 'fondatrice sans abonnement : limite Starter');
select is(public.echeance_tour('2027-01-31', 'mois', 2), '2027-02-28'::date, 'échéance mensuelle ramenée à la fin du mois');
select is(public.echeance_tour('2027-01-01', 'semaine', 3), '2027-01-15'::date, 'échéance hebdomadaire');
select is(public.format_montant(250000), '250' || U&'\202F' || '000' || U&'\00A0' || 'F', 'format des montants');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666661","role":"authenticated"}', true);

select throws_ok($$select public.creer_tontine('X', 'classique', null, 5000, 'mois', 5, current_date + 1)$$, 'nom_invalide', 'nom trop court');
select throws_ok($$select public.creer_tontine('Frigo', 'achat_groupe', '', 5000, 'mois', 5, current_date + 1)$$, 'bien_prevu_requis', 'bien obligatoire pour un achat groupé');
select throws_ok($$select public.creer_tontine('Test', 'classique', null, 499, 'mois', 5, current_date + 1)$$, 'montant_invalide', 'minimum 500 F');
select throws_ok($$select public.creer_tontine('Test', 'classique', null, 5000, 'mois', 51, current_date + 1)$$, 'nb_membres_invalide', '50 membres au plus');
select throws_ok($$select public.creer_tontine('Test', 'classique', null, 5000, 'mois', 5, current_date - 2)$$, 'date_passee', 'date de début dans le passé');

create temp table t1 as select * from public.creer_tontine('Les voisines', 'classique', 'ignoré', 10000, 'mois', 5, '2030-01-31');
select ok((select code ~ '^[0-9]{6}$' from t1), 'code à 6 chiffres');
select is((select bien_prevu from t1), null, 'pas de bien prévu pour une tontine classique');
select is((select count(*)::int from public.tours where tontine_id = (select id from t1)), 5, 'un tour par membre');
select is((select echeance from public.tours where tontine_id = (select id from t1) and numero = 2), '2030-02-28'::date, 'échéances calculées');
select is((select rang from public.membres where tontine_id = (select id from t1)), 1, 'la gérante est membre au rang 1');
select is((select count(*)::int from public.cotisations), 5, 'une cotisation par tour pour la gérante');
select is((select array_length(lignes, 1) from public.reglements where tontine_id = (select id from t1) and version = 1), 5, 'règlement v1 généré');
select is((select tour_numero from public.mes_tontines()), 1, 'mes_tontines : tour en cours');

select lives_ok($$select public.creer_tontine('Frigo', 'achat_groupe', 'Réfrigérateur', 5000, 'semaine', 3, current_date)$$, 'deuxième tontine (achat groupé)');
select throws_ok($$select public.creer_tontine('Trop', 'classique', null, 5000, 'mois', 3, current_date)$$, 'limite_atteinte', 'Starter : la 3e tontine est refusée');

select set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666662","role":"authenticated"}', true);
select throws_ok($$select public.creer_tontine('Test', 'classique', null, 5000, 'mois', 3, current_date)$$, 'limite_atteinte', 'sans abonnement actif : upsell');

select * from finish();
rollback;
