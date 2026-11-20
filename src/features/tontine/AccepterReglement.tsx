import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BoutonPrincipal, CaseACocher, Ecran, EnTete, Texte } from '@/components';
import { useAccepterReglement } from '@/data/reglages';
import type { DonneesTontine } from '@/data/tontine';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.reglementAccepter;

/** R2 : nouvelle version du règlement à accepter à l'ouverture de la tontine. */
export function AccepterReglement({ donnees }: { donnees: DonneesTontine }) {
  const [accepte, setAccepte] = useState(false);
  const accepter = useAccepterReglement(donnees.tontine.id);
  const reglement = donnees.reglement!;
  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.bouton}
          desactive={!accepte || accepter.isPending}
          onPress={() => accepter.mutate(reglement.version)}
          testID="bouton-accepter-reglement"
        />
      }
    >
      <EnTete titre={t.titre} filAriane={donnees.tontine.nom} onRetour={() => router.back()} />
      <Texte variante="corpsGrand">{t.aide}</Texte>
      <View style={styles.bloc}>
        {reglement.lignes.map((l, i) => (
          <Texte key={i}>• {l}</Texte>
        ))}
      </View>
      <CaseACocher libelle={t.accepter} coche={accepte} onChange={setAccepte} />
      {accepter.error ? <Texte couleur="terracotta">{messageErreur(accepter.error)}</Texte> : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  bloc: {
    gap: espacements.s,
    padding: espacements.l,
    borderRadius: rayons.carte,
    backgroundColor: couleurs.terracottaClair,
  },
});
