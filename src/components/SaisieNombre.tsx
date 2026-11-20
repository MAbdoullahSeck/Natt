import { View } from 'react-native';

import { creerStyles, espacements, rayons } from '@/theme';

import { Texte } from './Texte';

type Props = { valeur: string; erreur?: boolean; testID?: string };

/** Affichage d'un nombre saisi au pavé numérique (montant, nombre de membres). */
export function SaisieNombre({ valeur, erreur, testID }: Props) {
  const styles = useStyles();
  return (
    <View style={[styles.champ, erreur && styles.erreur]} testID={testID}>
      <Texte variante="montantGeant" couleur={erreur ? 'terracotta' : 'texte'} numberOfLines={1}>
        {valeur}
      </Texte>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  champ: {
    minHeight: 80,
    borderRadius: rayons.champ,
    borderWidth: 1.5,
    borderColor: couleurs.bordureChamp,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacements.l,
  },
  erreur: { borderColor: couleurs.terracotta },
}));
