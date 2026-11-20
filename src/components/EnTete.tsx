import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { textes } from '@/i18n';
import { espacements, tailles, useCouleurs } from '@/theme';

import { Texte } from './Texte';

type Props = {
  titre: string;
  filAriane?: string;
  onRetour?: () => void;
};

/** En-tête d'écran : Retour + fil d'Ariane + titre. */
export function EnTete({ titre, filAriane, onRetour }: Props) {
  const couleurs = useCouleurs();
  return (
    <View style={styles.entete}>
      {onRetour || filAriane ? (
        <View style={styles.haut}>
          {onRetour ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={textes.commun.retour}
              onPress={onRetour}
              hitSlop={12}
              style={styles.retour}
            >
              <ChevronLeft size={tailles.icone} color={couleurs.texte} strokeWidth={2} />
              <Texte variante="corpsFort">{textes.commun.retour}</Texte>
            </Pressable>
          ) : null}
          {filAriane ? <Texte couleur="texteSecondaire">{filAriane}</Texte> : null}
        </View>
      ) : null}
      <Texte variante="titre" accessibilityRole="header">
        {titre}
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  entete: { gap: espacements.l },
  haut: {
    minHeight: tailles.zoneTactile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retour: {
    minHeight: tailles.zoneTactile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.xs,
  },
});
