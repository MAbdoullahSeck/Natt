import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { CaseCode, ClavierNumerique, Ecran, EnTete, Texte } from '@/components';
import { chargerApercu } from '@/data/rejoindre';
import { textes } from '@/i18n';
import { codeErreur, messageErreur } from '@/lib/erreurs';
import { codeInvitation } from '@/lib/invitation';

const t = textes.rejoindre;

/** Écrans 12 et 12b — saisie du code, erreurs (code inconnu, tontine complète ou terminée). */
export default function Rejoindre() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [verification, setVerification] = useState(false);
  const dejaVerifie = useRef(false);

  async function verifier(valeur: string) {
    setVerification(true);
    try {
      await chargerApercu(valeur);
      router.push({ pathname: '/rejoindre/reglement', params: { code: valeur } });
    } catch (e) {
      const c = codeErreur(e);
      setErreur((c && t.erreurs[c]) || messageErreur(e));
    } finally {
      setVerification(false);
    }
  }

  // Lien d'invitation (natt://rejoindre?code=123456) : directement l'aperçu et le règlement (écran 12c).
  useEffect(() => {
    const code = codeInvitation(params.code);
    if (code && !dejaVerifie.current) {
      dejaVerifie.current = true;
      router.replace({ pathname: '/rejoindre/reglement', params: { code } });
    }
  }, [params.code]);

  function saisir(chiffre: string) {
    if (verification) return;
    const valeur = (erreur ? '' : code) + chiffre;
    setErreur(null);
    if (valeur.length > 6) return;
    setCode(valeur);
    if (valeur.length === 6) verifier(valeur);
  }

  return (
    <Ecran
      pied={
        <ClavierNumerique
          onChiffre={saisir}
          onEffacer={() => {
            setErreur(null);
            setCode((c) => c.slice(0, -1));
          }}
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      <Texte couleur="texteSecondaire">{t.aide}</Texte>
      <CaseCode valeur={code} erreur={!!erreur} />
      {erreur ? (
        <Texte variante="corpsFort" couleur="terracotta" testID="erreur-code">
          {erreur}
        </Texte>
      ) : null}
      {verification ? <Texte couleur="texteSecondaire">{t.verification}</Texte> : null}
    </Ecran>
  );
}
