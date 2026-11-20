import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { couleurs, espacements, rayons, tailles } from '@/theme';

import { Texte } from './Texte';

type Props = { icone?: LucideIcon; children: ReactNode };

/** Carte d'information sur fond terracotta clair. */
export function CarteInfo({ icone: Icone, children }: Props) {
  return (
    <View style={styles.carte}>
      {Icone ? <Icone size={tailles.icone} color={couleurs.terracotta} strokeWidth={2} /> : null}
      <View style={styles.contenu}>
        {typeof children === 'string' ? <Texte>{children}</Texte> : children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.terracottaClair,
    borderRadius: rayons.carte,
    padding: espacements.l,
    flexDirection: 'row',
    gap: espacements.m,
    alignItems: 'flex-start',
  },
  contenu: { flex: 1 },
});
