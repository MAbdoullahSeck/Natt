import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useCouleurs } from '@/theme';

/** Indicateur de chargement centré. */
export function Chargement() {
  const couleurs = useCouleurs();
  return (
    <View style={styles.centre} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={couleurs.terracotta} />
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center' },
});
