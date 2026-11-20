import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { couleurs } from '@/theme';

/** Indicateur de chargement centré. */
export function Chargement() {
  return (
    <View style={styles.centre} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={couleurs.terracotta} />
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center' },
});
