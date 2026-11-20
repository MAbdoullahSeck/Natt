import { router } from 'expo-router';

import { BoutonPrincipal, ChampSaisie, Ecran, EnTeteEtape, Texte } from '@/components';
import { nomTontineValide } from '@/domain/validation';
import { textes } from '@/i18n';
import { useBrouillon } from '@/lib/brouillonCreation';

const t = textes.creation.nom;

/** Écran 06 — Créer · Nom (1/6). */
export default function EtapeNom() {
  const { brouillon, modifier } = useBrouillon();
  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={textes.commun.continuer}
          desactive={!nomTontineValide(brouillon.nom)}
          onPress={() => router.push('/creer/type')}
        />
      }
    >
      <EnTeteEtape etape={1} titre={t.titre} />
      <ChampSaisie
        value={brouillon.nom}
        onChangeText={(nom) => modifier({ nom })}
        placeholder={t.placeholder}
        maxLength={40}
        autoFocus
        autoCapitalize="sentences"
      />
      <Texte couleur="texteSecondaire">{t.aide}</Texte>
    </Ecran>
  );
}
