import { router } from 'expo-router';
import { Package, Users } from 'lucide-react-native';

import {
  BoutonPrincipal,
  ChampSaisie,
  Ecran,
  EnTeteEtape,
  OptionSelection,
  Texte,
} from '@/components';
import { bienPrevuValide } from '@/domain/validation';
import { textes } from '@/i18n';
import { useBrouillon } from '@/lib/brouillonCreation';

const t = textes.creation.type;

/** Écran 06b — Créer · Type (2/6). */
export default function EtapeType() {
  const { brouillon, modifier } = useBrouillon();
  const valide = brouillon.type === 'classique' || bienPrevuValide(brouillon.bienPrevu);
  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={textes.commun.continuer}
          desactive={!valide}
          onPress={() => router.push('/creer/montant')}
        />
      }
    >
      <EnTeteEtape etape={2} titre={t.titre} />
      <OptionSelection
        icone={Users}
        titre={t.classique}
        sousTitre={t.classiqueDetail}
        selectionne={brouillon.type === 'classique'}
        onPress={() => modifier({ type: 'classique' })}
      />
      <OptionSelection
        icone={Package}
        titre={t.achat}
        sousTitre={t.achatDetail}
        selectionne={brouillon.type === 'achat_groupe'}
        onPress={() => modifier({ type: 'achat_groupe' })}
      />
      {brouillon.type === 'achat_groupe' ? (
        <>
          <Texte variante="corpsFort">{t.bienQuestion}</Texte>
          <ChampSaisie
            value={brouillon.bienPrevu}
            onChangeText={(bienPrevu) => modifier({ bienPrevu })}
            placeholder={t.bienPlaceholder}
            maxLength={40}
            autoCapitalize="sentences"
          />
        </>
      ) : null}
    </Ecran>
  );
}
