import { RefreshCw, WifiOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { espacements, tailles, useCouleurs } from '@/theme';

import { BoutonSecondaire } from './BoutonSecondaire';
import { Texte } from './Texte';

type Props = { erreur: unknown; onReessayer?: () => void };

/** Erreur de chargement (souvent le réseau) avec « Réessayer ». */
export function EtatErreur({ erreur, onReessayer }: Props) {
  const couleurs = useCouleurs();
  return (
    <View style={styles.bloc}>
      <WifiOff size={tailles.icone * 2} color={couleurs.texteSecondaire} strokeWidth={2} />
      <Texte variante="corpsGrand" centre>
        {messageErreur(erreur)}
      </Texte>
      {onReessayer ? (
        <BoutonSecondaire
          libelle={textes.erreurs.reessayer}
          icone={RefreshCw}
          onPress={onReessayer}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacements.l,
  },
});
