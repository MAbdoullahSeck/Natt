import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { creerStyles, espacements, rayons, tailles, useCouleurs } from '@/theme';

import { Texte } from './Texte';

type Props = {
  icone: LucideIcon;
  titre: string;
  texte: string;
  /** Heure déjà formatée. */
  heure: string;
  /** Confirmation (paiement reçu) : icône en vert. */
  confirmation?: boolean;
};

/** Élément de la liste des notifications — Figma « Notification » (6:546). */
export function Notification({ icone: Icone, titre, texte, heure, confirmation }: Props) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <View style={styles.carte}>
      <View style={[styles.pastille, confirmation && styles.pastilleConfirmation]}>
        <Icone
          size={tailles.icone}
          color={confirmation ? couleurs.vert : couleurs.terracotta}
          strokeWidth={2}
        />
      </View>
      <View style={styles.textes}>
        <View style={styles.haut}>
          <Texte variante="corpsFort" style={styles.titre}>
            {titre}
          </Texte>
          <Texte couleur="texteSecondaire">{heure}</Texte>
        </View>
        <Texte>{texte}</Texte>
      </View>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    flexDirection: 'row',
    gap: espacements.m,
    padding: espacements.l,
    borderRadius: rayons.carte,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    backgroundColor: couleurs.fond,
  },
  pastille: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: couleurs.terracottaClair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilleConfirmation: { backgroundColor: couleurs.vertPuce },
  textes: { flex: 1, gap: espacements.xs },
  haut: { flexDirection: 'row', gap: espacements.s },
  titre: { flex: 1 },
}));
