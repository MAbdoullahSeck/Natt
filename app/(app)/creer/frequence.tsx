import { router } from 'expo-router';
import { CalendarDays, CalendarRange, Sun } from 'lucide-react-native';

import { BoutonPrincipal, Ecran, EnTeteEtape, OptionSelection } from '@/components';
import type { Frequence } from '@/domain/dates';
import { textes } from '@/i18n';
import { useBrouillon } from '@/lib/brouillonCreation';

const OPTIONS: { valeur: Frequence; icone: typeof Sun }[] = [
  { valeur: 'jour', icone: Sun },
  { valeur: 'semaine', icone: CalendarRange },
  { valeur: 'mois', icone: CalendarDays },
];

/** Écran 08 — Créer · Fréquence (4/6) : jour, semaine ou mois. */
export default function EtapeFrequence() {
  const { brouillon, modifier } = useBrouillon();
  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={textes.commun.continuer}
          onPress={() => router.push('/creer/membres')}
        />
      }
    >
      <EnTeteEtape etape={4} titre={textes.creation.frequence.titre} />
      {OPTIONS.map(({ valeur, icone }) => (
        <OptionSelection
          key={valeur}
          icone={icone}
          titre={textes.frequences[valeur]}
          selectionne={brouillon.frequence === valeur}
          onPress={() => modifier({ frequence: valeur })}
        />
      ))}
    </Ecran>
  );
}
