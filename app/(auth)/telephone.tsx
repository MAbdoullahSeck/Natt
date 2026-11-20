import { router } from 'expo-router';
import { useState } from 'react';

import { BoutonPrincipal, ChampSaisie, ClavierNumerique, Ecran, EnTete, Texte } from '@/components';
import {
  formatTelephone,
  LONGUEUR_NUMERO,
  numeroInternational,
  numeroValide,
} from '@/domain/telephone';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { supabase } from '@/lib/supabase';

const t = textes.inscription.telephone;

/** Écran 01 — Inscription · Téléphone. */
export default function EcranTelephone() {
  const [numero, setNumero] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function recevoirCode() {
    setEnvoi(true);
    setErreur(null);
    const { error } = await supabase.auth.signInWithOtp({ phone: numeroInternational(numero) });
    setEnvoi(false);
    if (error) {
      setErreur(messageErreur(error));
      return;
    }
    router.push({ pathname: '/code', params: { numero } });
  }

  return (
    <Ecran
      pied={
        <>
          <BoutonPrincipal
            libelle={t.bouton}
            desactive={!numeroValide(numero) || envoi}
            onPress={recevoirCode}
            testID="bouton-recevoir-code"
          />
          <ClavierNumerique
            onChiffre={(c) => setNumero((n) => (n.length < LONGUEUR_NUMERO ? n + c : n))}
            onEffacer={() => setNumero((n) => n.slice(0, -1))}
          />
        </>
      }
    >
      <EnTete titre={t.titre} />
      <Texte couleur="texteSecondaire">{t.aide}</Texte>
      <ChampSaisie prefixe={t.prefixe} value={formatTelephone(numero)} lectureSeule />
      {erreur ? <Texte couleur="terracotta">{erreur}</Texte> : null}
      {numero.length === LONGUEUR_NUMERO && !numeroValide(numero) ? (
        <Texte couleur="terracotta">{t.invalide}</Texte>
      ) : null}
    </Ecran>
  );
}
