import { useQuery } from '@tanstack/react-query';
import { Image, StyleSheet } from 'react-native';

import { urlCapture } from '@/lib/captures';
import { rayons } from '@/theme';

/** Capture de paiement jointe (lien signé temporaire). */
export function ApercuCapture({ chemin }: { chemin: string }) {
  const { data: url } = useQuery({
    queryKey: ['capture', chemin],
    queryFn: () => urlCapture(chemin),
  });
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 320, borderRadius: rayons.carte },
});
