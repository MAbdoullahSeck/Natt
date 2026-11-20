import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { CaseCode, ClavierNumerique, Ecran, EnTete, Lien, Texte } from '@/components';
import { formatTelephoneComplet, numeroInternational } from '@/domain/telephone';
import { textes } from '@/i18n';
import { supabase } from '@/lib/supabase';

const t = textes.inscription.code;
const DELAI_RENVOI = 60;

/** Écran 02 — Code SMS : vérification automatique au 6e chiffre, renvoi après 60 s. */
export default function EcranCode() {
  const { numero = '' } = useLocalSearchParams<{ numero: string }>();
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState(false);
  const [verification, setVerification] = useState(false);
  const [restant, setRestant] = useState(DELAI_RENVOI);

  useEffect(() => {
    if (restant <= 0) return;
    const minuteur = setTimeout(() => setRestant((r) => r - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [restant]);

  async function verifier(valeur: string) {
    setVerification(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: numeroInternational(numero),
      token: valeur,
      type: 'sms',
    });
    setVerification(false);
    if (error) {
      setErreur(true);
      return;
    }
    router.replace('/');
  }

  function saisir(chiffre: string) {
    if (verification) return;
    const valeur = (erreur ? '' : code) + chiffre;
    setErreur(false);
    if (valeur.length > 6) return;
    setCode(valeur);
    if (valeur.length === 6) verifier(valeur);
  }

  async function renvoyer() {
    setRestant(DELAI_RENVOI);
    setCode('');
    setErreur(false);
    await supabase.auth.signInWithOtp({ phone: numeroInternational(numero) });
  }

  return (
    <Ecran
      pied={
        <ClavierNumerique
          onChiffre={saisir}
          onEffacer={() => {
            setErreur(false);
            setCode((c) => c.slice(0, -1));
          }}
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      <Texte couleur="texteSecondaire">{t.aide(formatTelephoneComplet(numero))}</Texte>
      <CaseCode valeur={code} erreur={erreur} />
      {erreur ? <Texte couleur="terracotta">{t.erreur}</Texte> : null}
      {verification ? <Texte couleur="texteSecondaire">{t.verification}</Texte> : null}
      {restant > 0 ? (
        <Texte couleur="texteSecondaire">{t.renvoyerDans(restant)}</Texte>
      ) : (
        <Lien libelle={t.renvoyer} onPress={renvoyer} />
      )}
    </Ecran>
  );
}
