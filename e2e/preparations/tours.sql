begin;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
create temp table nt as select * from public.creer_tontine('Trio du quartier', 'classique', null, 5000, 'semaine', 3, current_date + 7);
select public.ajouter_membre((select id from nt), 'a0000000-0000-4000-8000-000000000002');
select public.ajouter_membre((select id from nt), 'a0000000-0000-4000-8000-000000000003');
commit;
