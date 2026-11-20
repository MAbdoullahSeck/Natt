import { Bell, House, User, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { textes } from '@/i18n';
import { creerStyles, espacements, tailles, useCouleurs } from '@/theme';

import { Texte } from './Texte';

export type Onglet = 'accueil' | 'notifications' | 'profil';

const ONGLETS: { cle: Onglet; icone: LucideIcon; libelle: string }[] = [
  { cle: 'accueil', icone: House, libelle: textes.navigation.accueil },
  { cle: 'notifications', icone: Bell, libelle: textes.navigation.notifications },
  { cle: 'profil', icone: User, libelle: textes.navigation.profil },
];

type Props = { actif: Onglet; onChange: (onglet: Onglet) => void };

/** Navigation du bas — Figma « Navigation · Accueil actif » (2:44). */
export function NavigationBas({ actif, onChange }: Props) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.barre, { paddingBottom: Math.max(bottom, espacements.s) }]}>
      {ONGLETS.map(({ cle, icone: Icone, libelle }) => {
        const estActif = cle === actif;
        return (
          <Pressable
            key={cle}
            accessibilityRole="tab"
            accessibilityState={{ selected: estActif }}
            onPress={() => onChange(cle)}
            style={styles.onglet}
            testID={`onglet-${cle}`}
          >
            <Icone
              size={tailles.icone}
              color={estActif ? couleurs.terracotta : couleurs.texteSecondaire}
              strokeWidth={2}
            />
            <Texte
              variante={estActif ? 'libelle' : 'corps'}
              couleur={estActif ? 'terracotta' : 'texteSecondaire'}
              numberOfLines={1}
            >
              {libelle}
            </Texte>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  barre: {
    flexDirection: 'row',
    backgroundColor: couleurs.fond,
    borderTopWidth: 1,
    borderTopColor: couleurs.separateur,
    paddingTop: espacements.m,
  },
  onglet: { flex: 1, minHeight: 56, alignItems: 'center', gap: espacements.xs },
}));
