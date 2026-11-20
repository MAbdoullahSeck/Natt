import { View } from 'react-native';

import { textes } from '@/i18n';
import { creerStyles, espacements, rayons } from '@/theme';

import { Texte } from './Texte';

type Props = {
  /** Chiffres déjà saisis (0 à `longueur`). */
  valeur: string;
  longueur?: number;
  /** Code invalide : cases en terracotta (écran 12b). */
  erreur?: boolean;
};

/** Cases du code à 6 chiffres (code SMS, code d'invitation). Saisie via ClavierNumerique. */
export function CaseCode({ valeur, longueur = 6, erreur = false }: Props) {
  const styles = useStyles();
  const chiffres = valeur.slice(0, longueur).split('');
  return (
    <View
      style={styles.rangee}
      accessible
      accessibilityLabel={textes.code.saisi(chiffres.length, longueur)}
    >
      {Array.from({ length: longueur }, (_, i) => {
        const active = !erreur && i === chiffres.length;
        return (
          <View
            key={i}
            testID={`case-code-${i}`}
            style={[styles.case, active && styles.active, erreur && styles.erreur]}
          >
            <Texte variante="montant" couleur={erreur ? 'terracotta' : 'texte'}>
              {chiffres[i] ?? ''}
            </Texte>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  rangee: { flexDirection: 'row', gap: espacements.s },
  case: {
    flex: 1,
    height: 64,
    borderRadius: rayons.touche,
    backgroundColor: couleurs.surface,
    borderWidth: 2,
    borderColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: couleurs.bordureChamp },
  erreur: { borderColor: couleurs.terracotta, backgroundColor: couleurs.terracottaPuce },
}));
