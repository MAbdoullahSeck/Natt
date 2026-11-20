import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { BoutonPrincipal, CaseACocher, Ecran, EnTete, Lien, Texte } from '@/components';
import { VERSION_CONSENTEMENT } from '@/domain/consentement';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const t = textes.inscription.consentement;

/** Écran 04 — Consentement (D1) : case non cochée, bouton désactivé tant qu'elle ne l'est pas. */
export default function EcranConsentement() {
  const { prenom = '' } = useLocalSearchParams<{ prenom: string }>();
  const { rafraichirProfil } = useSession();
  const [accepte, setAccepte] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creerCompte() {
    setEnvoi(true);
    setErreur(null);
    const { error } = await supabase.rpc('creer_profil', {
      p_prenom: prenom,
      p_consentement_version: VERSION_CONSENTEMENT,
    });
    if (error) {
      setEnvoi(false);
      setErreur(messageErreur(error));
      return;
    }
    await rafraichirProfil();
    router.replace('/');
  }

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.bouton}
          desactive={!accepte || envoi}
          onPress={creerCompte}
          testID="bouton-creer-compte"
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      <Texte variante="corpsGrand">{t.texte}</Texte>
      <Lien libelle={t.mesDroits} onPress={() => router.push('/droits')} />
      <CaseACocher
        libelle={t.caseLibelle}
        coche={accepte}
        onChange={setAccepte}
        testID="case-consentement"
      />
      {erreur ? <Texte couleur="terracotta">{erreur}</Texte> : null}
    </Ecran>
  );
}
