import { router } from 'expo-router';
import { useState } from 'react';

import { BoutonPrincipal, ChampSaisie, Ecran, EnTete, Texte } from '@/components';
import { prenomValide } from '@/domain/validation';
import { textes } from '@/i18n';

const t = textes.inscription.prenom;

/** Écran 03 — Prénom (2 à 30 caractères). */
export default function EcranPrenom() {
  const [prenom, setPrenom] = useState('');
  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={textes.commun.continuer}
          desactive={!prenomValide(prenom)}
          onPress={() =>
            router.push({ pathname: '/consentement', params: { prenom: prenom.trim() } })
          }
        />
      }
    >
      <EnTete titre={t.titre} />
      <Texte couleur="texteSecondaire">{t.aide}</Texte>
      <ChampSaisie
        value={prenom}
        onChangeText={setPrenom}
        placeholder={t.placeholder}
        autoFocus
        autoCapitalize="words"
        autoComplete="given-name"
        maxLength={30}
        returnKeyType="next"
      />
    </Ecran>
  );
}
