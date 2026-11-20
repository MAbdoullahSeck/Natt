-- Étape 2 : inscription (écrans 01 à 04).
-- Création du profil par une fonction serveur : le téléphone vient du compte Auth (jamais du client)
-- et le consentement (D1) est horodaté côté serveur.

create function public.creer_profil(p_prenom text, p_consentement_version text)
returns public.profils
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tel text;
  v_prenom text := btrim(p_prenom);
  v_profil public.profils;
begin
  if v_uid is null then
    raise exception 'non_connecte' using errcode = '28000';
  end if;
  if char_length(v_prenom) not between 2 and 30 then
    raise exception 'prenom_invalide' using errcode = '22023';
  end if;
  if coalesce(btrim(p_consentement_version), '') = '' then
    raise exception 'consentement_requis' using errcode = '22023';
  end if;

  select u.phone into v_tel from auth.users u where u.id = v_uid;
  if v_tel is null then
    raise exception 'telephone_inconnu' using errcode = '22023';
  end if;

  insert into public.profils (id, prenom, telephone, consentement_at, consentement_version)
  values (v_uid, v_prenom, v_tel, now(), p_consentement_version)
  on conflict (id) do update
    set prenom = excluded.prenom,
        consentement_at = excluded.consentement_at,
        consentement_version = excluded.consentement_version
  returning * into v_profil;

  return v_profil;
end;
$$;

revoke execute on function public.creer_profil(text, text) from public, anon;
grant execute on function public.creer_profil(text, text) to authenticated;
