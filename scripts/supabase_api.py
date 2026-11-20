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


if __name__ == '__main__':
    commande = sys.argv[1] if len(sys.argv) > 1 else ''
    if commande == 'migrations':
        migrations()
    elif commande == 'seed':
        seed()
    elif commande == 'tests':
        tests()
    elif commande == 'sql' and len(sys.argv) > 2:
        print(json.dumps(sql(sys.argv[2]), ensure_ascii=False, indent=2))
    else:
        print(__doc__)
