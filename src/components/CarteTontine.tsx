import { Pressable, StyleSheet, View } from 'react-native';

import type { StatutAffiche } from '@/domain/statuts';
import { formatMontant } from '@/lib/format';
import { couleurs, espacements, rayons } from '@/theme';

import { PuceStatut } from './PuceStatut';
import { Texte } from './Texte';

type Props = {
  nom: string;
  montant: number;
  statut: StatutAffiche;
  /** Ligne « gérante · nb membres · fréquence », déjà composée. */
  details: string;
  /** Bien prévu (achat groupé), affiché partout où la tontine est présentée (T1). */
  bienPrevu?: string | null;
  onPress?: () => void;
};

/** Carte d'une tontine sur l'accueil (écran 05). */
export function CarteTontine({ nom, montant, statut, details, bienPrevu, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.carte, pressed && styles.appuye]}
    >
      <View style={styles.haut}>
        <Texte variante="sousTitre" style={styles.nom} numberOfLines={2}>
          {nom}
        </Texte>
        <PuceStatut statut={statut} />
      </View>
      <Texte variante="montant">{formatMontant(montant)}</Texte>
      {bienPrevu ? <Texte variante="corpsFort">{bienPrevu}</Texte> : null}
      <Texte couleur="texteSecondaire">{details}</Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    borderRadius: rayons.carteGrande,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    backgroundColor: couleurs.fond,
    padding: espacements.xl,
    gap: espacements.s,
  },
  appuye: { backgroundColor: couleurs.surface },
  haut: { flexDirection: 'row', alignItems: 'flex-start', gap: espacements.m },
  nom: { flex: 1 },
});
