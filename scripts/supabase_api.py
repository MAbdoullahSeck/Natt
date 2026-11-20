#!/usr/bin/env python3
"""
Opérations sur le projet Supabase distant par l'API de gestion (HTTPS uniquement).

Pour les environnements qui ne peuvent pas joindre Postgres directement (sessions cloud) :
`supabase db push` y est impossible, ce script fait la même chose par l'endpoint SQL de l'API.
Sur un poste de développement, préférer `npm run db:push`.

Jeton : variable SUPABASE_ACCESS_TOKEN, ou injecté par le proxy de l'environnement.
Projet : variable SUPABASE_PROJECT_REF (par défaut natt-dev).

  python3 scripts/supabase_api.py migrations   # applique les migrations manquantes (et les enregistre
                                               # dans supabase_migrations.schema_migrations, comme le CLI)
  python3 scripts/supabase_api.py seed         # charge supabase/seed.sql (base vide seulement)
  python3 scripts/supabase_api.py tests        # tests pgTAP dans des transactions annulées
  python3 scripts/supabase_api.py relance-e2e  # test de bout en bout d'une relance planifiée (voir plus bas)
  python3 scripts/supabase_api.py sql "select 1"
"""
import glob
import json
import os
import subprocess
import sys
import tempfile

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.environ.get('SUPABASE_PROJECT_REF', 'vzvtuthjxyjaitesnvih')
JETON = os.environ.get('SUPABASE_ACCESS_TOKEN', 'injecte-par-le-proxy')


def sql(requete: str):
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f:
        json.dump({'query': requete}, f)
        chemin = f.name
    r = subprocess.run(
        ['curl', '-s', '-m', '300', '-X', 'POST',
         f'https://api.supabase.com/v1/projects/{REF}/database/query',
         '-H', f'Authorization: Bearer {JETON}', '-H', 'Content-Type: application/json',
         '--data-binary', f'@{chemin}'],
        capture_output=True, text=True)
    os.unlink(chemin)
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        raise SystemExit(f'Réponse inattendue : {r.stdout[:500]} {r.stderr[:500]}')


def erreur(reponse):
    return reponse.get('message') if isinstance(reponse, dict) else None


def migrations():
    sql('create schema if not exists supabase_migrations; '
        'create table if not exists supabase_migrations.schema_migrations '
        '(version text not null primary key, statements text[], name text);')
    deja = {x['version'] for x in sql('select version from supabase_migrations.schema_migrations')}
    for f in sorted(glob.glob(os.path.join(RACINE, 'supabase/migrations/*.sql'))):
        base = os.path.basename(f)[:-4]
        version, nom = base.split('_', 1)
        if version in deja:
            continue
        contenu = open(f).read()
        enregistrement = (
            "insert into supabase_migrations.schema_migrations (version, name, statements) "
            f"values ('{version}', '{nom}', array[$natt${contenu}$natt$]);")
        r = sql(contenu + '\n;\n' + enregistrement)
        if erreur(r):
            raise SystemExit(f'ÉCHEC {base} : {erreur(r)}')
        print('appliquée', base)
    print('Migrations à jour.')


def seed():
    if sql('select count(*) as n from public.profils')[0]['n'] > 0:
        raise SystemExit('La base contient déjà des profils : seed non chargé.')
    r = sql(open(os.path.join(RACINE, 'supabase/seed.sql')).read())
    if erreur(r):
        raise SystemExit(f'ÉCHEC seed : {erreur(r)}')
    print('Seed chargé :', sql('select (select count(*) from profils) profils, (select count(*) from tontines) tontines')[0])


FIN_TEST = """
reset role;
do $resultats$
begin
  -- L'exception annule toute la transaction : aucune donnée de test n'est conservée.
  raise exception 'RESULTATS % % ', _get('curr_test'), num_failed();
end $resultats$;
"""


def tests():
    echecs = 0
    for f in sorted(glob.glob(os.path.join(RACINE, 'supabase/tests/*.sql'))):
        contenu = open(f).read().replace('select * from finish();\nrollback;', FIN_TEST)
        message = erreur(sql(contenu)) or ''
        i = message.find('RESULTATS')
        if i < 0:
            echecs += 1
            print('ERREUR', os.path.basename(f), message[:300])
            continue
        total, rates = message[i:].split()[1:3]
        echecs += int(rates)
        print(f"{os.path.basename(f)} : {int(total) - int(rates)}/{total}")
    raise SystemExit(1 if echecs else 0)


def relance_e2e(jour='2026-12-02', telephone='221770000003'):
    """
    Test de bout en bout d'une relance planifiée, par le même chemin que pg_cron :
    Vault (URL + clé service) → pg_net → Edge Function « relances » → preparer_relances → notifications
    → Edge Function push → API Expo.
    - jour : date simulée (par défaut J-3 du tour 4 de « Tontine des sœurs » dans le seed) ;
    - un jeton Expo factice est posé sur le profil testé puis retiré ;
    les relances créées restent dans l'historique (journal en ajout seul), comme en vrai.
    """
    import time
    profil = sql(f"select id from public.profils where telephone = '{telephone}'")[0]['id']
    sql(f"update public.profils set expo_push_token = 'ExponentPushToken[natt-test-e2e]' where id = '{profil}'")
    try:
        debut = sql('select now() as t')[0]['t']
        avant = sql(f"select count(*) as n from public.notifications where profil_id = '{profil}' and type = 'relance'")[0]['n']
        requete = sql(f"select public.appeler_fonction('relances', '{{\"jour\": \"{jour}\"}}'::jsonb) as id")[0]['id']
        for _ in range(30):
            time.sleep(2)
            r = sql(f"select status_code, content::text as contenu from net._http_response where id = {requete}")
            if r:
                break
        else:
            raise SystemExit('ÉCHEC : pas de réponse de la fonction relances')
        reponse = json.loads(r[0]['contenu'] or '{}')
        print('HTTP', r[0]['status_code'], json.dumps(reponse, ensure_ascii=False))
        nouvelles = sql(f"""select count(*) as n, count(push_envoye_at) as poussees from public.notifications
                            where profil_id = '{profil}' and type = 'relance' and created_at >= '{debut}'""")[0]
        ok = (r[0]['status_code'] == 200 and nouvelles['n'] >= 1
              and (reponse.get('push') or {}).get('envoyees', 0) >= 1 and nouvelles['poussees'] == nouvelles['n'])
        print(f"Nouvelles relances pour le profil testé : {nouvelles['n']} (avant : {avant}), envoyées en push : {nouvelles['poussees']}")
        print('RÉUSSI' if ok else 'ÉCHEC')
        if not ok:
            raise SystemExit(1)
    finally:
        sql(f"update public.profils set expo_push_token = null where id = '{profil}'")


if __name__ == '__main__':
    commande = sys.argv[1] if len(sys.argv) > 1 else ''
    if commande == 'migrations':
        migrations()
    elif commande == 'seed':
        seed()
    elif commande == 'tests':
        tests()
    elif commande == 'relance-e2e':
        relance_e2e(*sys.argv[2:4])
    elif commande == 'sql' and len(sys.argv) > 2:
        print(json.dumps(sql(sys.argv[2]), ensure_ascii=False, indent=2))
    else:
        print(__doc__)
