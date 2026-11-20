-- Point 2 : liens de paiement signés, commandes et IPN PayTech.
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (id, aud, role, phone) values
  ('eeee0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '221785000001');

-- Inscription : un lien Starter mensuel est envoyé (notification avec URL).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"eeee0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select public.creer_profil('Payeuse', 'v1');
reset role;
select is((select count(*)::int from public.notifications where profil_id = 'eeee0000-0000-4000-8000-000000000001' and type = 'abonnement_lien'), 1,
  'inscription : lien de paiement envoyé');
select ok((select donnees ->> 'url' like '%/functions/v1/paytech-checkout?g=eeee0000-0000-4000-8000-000000000001&p=starter&d=mensuel&e=%&s=%'
           from public.notifications where profil_id = 'eeee0000-0000-4000-8000-000000000001' and type = 'abonnement_lien'),
  'le lien contient gérante, palier, périodicité, expiration et signature');

-- Tarifs (B1).
select is(public.prix_abonnement('starter', 'mensuel'), 1000, 'Starter mensuel 1 000 F');
select is(public.prix_abonnement('pro', 'annuel'), 25000, 'Pro annuel 25 000 F');
select is(public.prix_abonnement('illimite', 'annuel'), 50000, 'Illimité annuel 50 000 F');
select is(public.prix_plein_annuel('pro'), 30000, 'prix plein annuel Pro (barré) : 30 000 F');
create temp table notif_annuelle as
  select public.envoyer_lien_paiement('eeee0000-0000-4000-8000-000000000001', 'pro', 'annuel', 'limite') as id;
select ok((select corps like '%25' || U&'\202F' || '000' || U&'\00A0' || 'F par an, au lieu de 30' || U&'\202F' || '000' || U&'\00A0' || 'F : 2 mois offerts%'
           from public.notifications where id = (select id from notif_annuelle)),
  'notification annuelle : prix plein et 2 mois offerts');

-- Calcul des dates d'expiration.
select is(public.nouvelle_expiration(null, 'mensuel', '2026-11-21 10:00+00'), '2026-12-21 10:00+00'::timestamptz, 'mensuel : +1 mois');
select is(public.nouvelle_expiration(null, 'annuel', '2026-11-21 10:00+00'), '2027-11-21 10:00+00'::timestamptz, 'annuel : +12 mois');
select is(public.nouvelle_expiration('2026-12-10 00:00+00', 'mensuel', '2026-11-21 10:00+00'), '2027-01-10 00:00+00'::timestamptz,
  'prolongation à partir de la fin de l''abonnement en cours');
select is(public.nouvelle_expiration('2026-11-01 00:00+00', 'mensuel', '2026-11-21 10:00+00'), '2026-12-21 10:00+00'::timestamptz,
  'abonnement déjà expiré : à partir de maintenant');
select is(public.nouvelle_expiration(null, 'mensuel', '2027-01-31 00:00+00'), '2027-02-28 00:00+00'::timestamptz, 'fin de mois');

-- Signature et expiration des liens.
create temp table lien as
  select 'eeee0000-0000-4000-8000-000000000001'::uuid as g, 'pro'::text as p, 'mensuel'::text as d,
         extract(epoch from now() + interval '1 day')::bigint as e;
alter table lien add column s text;
update lien set s = public.signature_lien_paiement(g, p, d, e);
grant select on lien to service_role, authenticated;

set local role service_role;
select throws_ok($$select public.creer_paiement_abonnement(g, 'illimite', d, e, s) from lien$$, 'lien_invalide', 'palier modifié : signature refusée');
select throws_ok($$select public.creer_paiement_abonnement(g, p, d, e + 1, s) from lien$$, 'lien_invalide', 'expiration modifiée : signature refusée');
select throws_ok($$select public.creer_paiement_abonnement(g, p, d, e, 'faux') from lien$$, 'lien_invalide', 'fausse signature refusée');
create temp table cmd as select (public.creer_paiement_abonnement(g, p, d, e, s)).* from lien;
select is((select montant from cmd), 2500, 'commande au tarif du palier');
select ok((select ref_command ~ '^NATT-[0-9]{8}-[0-9A-F]{10}$' from cmd), 'ref_command unique et lisible');
reset role;
set local role authenticated;
select throws_ok($$select public.creer_paiement_abonnement(g, p, d, e, s) from lien$$, '42501', null,
  'la création de commande est réservée au système');
reset role;
update lien set e = extract(epoch from now() - interval '1 minute')::bigint;
update lien set s = public.signature_lien_paiement(g, p, d, e);
set local role service_role;
select throws_ok($$select public.creer_paiement_abonnement(g, p, d, e, s) from lien$$, 'lien_expire', 'lien expiré refusé');

-- IPN : succès, doublon, journal, notification, abonnement.
select is(public.traiter_ipn_paytech((select ref_command from cmd), 'sale_complete', 'Wave', '{"item_price":"2500"}'), 'active', 'paiement réussi : abonnement activé');
select is(public.traiter_ipn_paytech((select ref_command from cmd), 'sale_complete', 'Wave', '{}'), 'doublon', 'IPN en double ignorée');
select throws_ok($$select public.traiter_ipn_paytech('NATT-INCONNUE', 'sale_complete', 'Wave', '{}')$$, 'commande_inconnue', 'commande inconnue refusée');
reset role;
select is((select count(*)::int from public.abonnements where profil_id = 'eeee0000-0000-4000-8000-000000000001' and statut = 'actif'), 1,
  'un seul abonnement actif');
select ok((select expire_at between now() + interval '27 days' and now() + interval '32 days' from public.abonnements
           where profil_id = 'eeee0000-0000-4000-8000-000000000001' and statut = 'actif'), 'Pro actif pour un mois');
select is((select count(*)::int from public.evenements where auteur_id = 'eeee0000-0000-4000-8000-000000000001' and type = 'abonnement_paye'), 1,
  'paiement journalisé (une seule fois)');

-- J-5 avant expiration : lien de renouvellement.
select public.envoyer_liens_expiration(public.jour_dakar(
  (select expire_at from public.abonnements where profil_id = 'eeee0000-0000-4000-8000-000000000001' and statut = 'actif')) - 5);
select is((select count(*)::int from public.notifications where profil_id = 'eeee0000-0000-4000-8000-000000000001'
           and type = 'abonnement_lien' and donnees ->> 'raison' = 'expiration' and donnees ->> 'palier' = 'pro'), 1,
  'J-5 : lien de renouvellement Pro envoyé');

select * from finish();
rollback;
