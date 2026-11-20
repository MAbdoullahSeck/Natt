-- Point 1 : appeler une Edge Function avec un corps JSON (ex. date simulée pour tester les relances).
-- La tâche pg_cron de 9 h continue d'appeler appeler_fonction('relances') sans corps.

drop function public.appeler_fonction(text);
create function public.appeler_fonction(p_nom text, p_corps jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_cle text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_cle from vault.decrypted_secrets where name = 'service_role_key';
  if v_url is null or v_cle is null then
    raise notice 'Secrets Vault absents : appel de % ignoré.', p_nom;
    return null;
  end if;
  return net.http_post(
    url := v_url || '/functions/v1/' || p_nom,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_cle),
    body := coalesce(p_corps, '{}'::jsonb)
  );
end;
$$;
revoke execute on function public.appeler_fonction(text, jsonb) from public, anon, authenticated;
