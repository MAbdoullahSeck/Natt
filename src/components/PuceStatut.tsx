import { StyleSheet, View } from 'react-native';

import type { StatutAffiche } from '@/domain/statuts';
import { textes } from '@/i18n';
import { couleurs, espacements, rayons, type Couleur } from '@/theme';

import { Texte } from './Texte';

const APPARENCE: Record<StatutAffiche, { fond: Couleur; texte: Couleur; libelle: string }> = {
  paye: { fond: 'vertPuce', texte: 'vert', libelle: textes.statuts.paye },
  en_attente: { fond: 'grisPuce', texte: 'texteSecondaire', libelle: textes.statuts.enAttente },
  en_retard: { fond: 'terracottaPuce', texte: 'terracotta', libelle: textes.statuts.enRetard },
};

/** Statut toujours en couleur + mot (CLAUDE.md, règle 3). */
export function PuceStatut({ statut }: { statut: StatutAffiche }) {
  const a = APPARENCE[statut];
  return (
    <View style={[styles.puce, { backgroundColor: couleurs[a.fond] }]} testID={`puce-${statut}`}>
      <Texte variante="libelle" couleur={a.texte}>
        {a.libelle}
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  puce: {
    alignSelf: 'flex-start',
    borderRadius: rayons.puce,
    paddingHorizontal: espacements.m,
    paddingVertical: espacements.xs,
  },
});
