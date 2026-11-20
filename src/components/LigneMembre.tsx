import { Pressable, View } from 'react-native';

import type { StatutAffiche } from '@/domain/statuts';
import { textes } from '@/i18n';
import { creerStyles, espacements, rayons } from '@/theme';

import { PuceStatut } from './PuceStatut';
import { Texte } from './Texte';

type Props = {
  prenom: string;
  statut: StatutAffiche;
  /** Affiche « Marquer payé » sur les membres non payés (vue gérante). */
  onMarquerPaye?: () => void;
  onPress?: () => void;
};

/** Ligne de la liste des membres — Figma « Membre · Statut et validation » (6:226). */
export function LigneMembre({ prenom, statut, onMarquerPaye, onPress }: Props) {
  const styles = useStyles();
  const initiale = prenom.charAt(0).toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.ligne}
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Texte variante="corpsFort">{initiale}</Texte>
      </View>
      <View style={styles.textes}>
        <Texte variante="corpsFort" numberOfLines={1}>
          {prenom}
        </Texte>
        <PuceStatut statut={statut} />
      </View>
      {onMarquerPaye && statut !== 'paye' ? (
        <Pressable
          accessibilityRole="button"
          onPress={onMarquerPaye}
          style={({ pressed }) => [styles.marquer, pressed && styles.appuye]}
        >
          <Texte variante="libelle" couleur="blanc">
            {textes.membre.marquerPaye}
          </Texte>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.m,
    paddingVertical: espacements.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.separateur,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: espacements.xs },
  marquer: {
    minHeight: 48,
    borderRadius: rayons.touche,
    backgroundColor: couleurs.fondAccent,
    paddingHorizontal: espacements.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appuye: { opacity: 0.85 },
}));
