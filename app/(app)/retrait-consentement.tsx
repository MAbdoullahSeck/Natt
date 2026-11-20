import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { BoutonPrincipal, CaseACocher, Ecran, EnTete, Texte } from '@/components';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const t = textes.mesDonnees.retrait;

/** D2 : retrait du consentement (compte désactivé, données personnelles effacées). */
export default function RetraitConsentement() {
  const { deconnecter } = useSession();
  const [compris, setCompris] = useState(false);
  const retirer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('retirer_consentement');
      if (error) throw error;
    },
    onSuccess: () => deconnecter(),
  });

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.confirmer}
          desactive={!compris || retirer.isPending}
          onPress={() => retirer.mutate()}
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      <Texte variante="corpsGrand">{t.texte}</Texte>
      <CaseACocher libelle={t.case} coche={compris} onChange={setCompris} />
      {retirer.error ? <Texte couleur="terracotta">{messageErreur(retirer.error)}</Texte> : null}
    </Ecran>
  );
}
