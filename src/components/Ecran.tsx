import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { couleurs, espacements } from '@/theme';

type Props = {
  children: ReactNode;
  /** Zone fixe en bas : bouton principal, pavé numérique… */
  pied?: ReactNode;
  /** Contenu défilant (par défaut). */
  defilement?: boolean;
  /** Pas de marge en bas (écran avec navigation du bas). */
  avecOnglets?: boolean;
};

/** Gabarit d'écran : marges de 24, fond blanc, zone d'action en bas. */
export function Ecran({ children, pied, defilement = true, avecOnglets = false }: Props) {
  const contenu = defilement ? (
    <ScrollView
      contentContainerStyle={styles.contenu}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.contenu, styles.fixe]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.ecran} edges={avecOnglets ? ['top'] : ['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.ecran}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {contenu}
        {pied ? <View style={styles.pied}>{pied}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.marge, gap: espacements.xl, flexGrow: 1 },
  fixe: { flex: 1 },
  pied: {
    paddingHorizontal: espacements.marge,
    paddingBottom: espacements.l,
    paddingTop: espacements.s,
    gap: espacements.m,
  },
});
