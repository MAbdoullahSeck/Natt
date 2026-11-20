import { StyleSheet, View } from 'react-native';

import { Texte } from '@/components';
import { couleurs, espacements, rayons } from '@/theme';

type Props = { titre: string; montant: string; sousTitre?: string; detail?: string };

/** Carte de la cagnotte du tour (écrans 13 et 16). */
export function CarteCagnotte({ titre, montant, sousTitre, detail }: Props) {
  return (
    <View style={styles.carte}>
      <Texte variante="corpsFort" couleur="texteSecondaire">
        {titre}
      </Texte>
      <Texte variante="montantGeant" numberOfLines={1} adjustsFontSizeToFit>
        {montant}
      </Texte>
      {sousTitre ? <Texte variante="corpsFort">{sousTitre}</Texte> : null}
      {detail ? <Texte couleur="texteSecondaire">{detail}</Texte> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.terracottaClair,
    borderRadius: rayons.carteGrande,
    padding: espacements.xl,
    gap: espacements.s,
  },
});
