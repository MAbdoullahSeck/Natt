import { router } from 'expo-router';
import { Moon, Smartphone, Sun } from 'lucide-react-native';

import { Ecran, EnTete, OptionSelection } from '@/components';
import { textes } from '@/i18n';
import { type Apparence, useTheme } from '@/theme';

const t = textes.apparence;
const OPTIONS: { valeur: Apparence; icone: typeof Sun }[] = [
  { valeur: 'automatique', icone: Smartphone },
  { valeur: 'clair', icone: Sun },
  { valeur: 'sombre', icone: Moon },
];

/** Profil → Apparence : Automatique (suit le téléphone), Clair ou Sombre. Choix mémorisé. */
export default function EcranApparence() {
  const { apparence, changerApparence } = useTheme();
  return (
    <Ecran>
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      {OPTIONS.map(({ valeur, icone }) => (
        <OptionSelection
          key={valeur}
          icone={icone}
          titre={t[valeur]}
          sousTitre={t[`${valeur}Detail`]}
          selectionne={apparence === valeur}
          onPress={() => changerApparence(valeur)}
          testID={`apparence-${valeur}`}
        />
      ))}
    </Ecran>
  );
}
