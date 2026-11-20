import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { textes } from '@/i18n';
import { formatDate } from '@/lib/format';
import { creerStyles, espacements, rayons, tailles, useCouleurs } from '@/theme';

import { BoutonSecondaire } from './BoutonSecondaire';
import { Texte } from './Texte';

type Props = {
  valeur: Date;
  onChange: (date: Date) => void;
  minimum?: Date;
  libelleBouton?: string;
};

/** Date en gros + bouton « Changer la date » (sélecteur natif du téléphone). */
export function ChoixDate({ valeur, onChange, minimum, libelleBouton }: Props) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const [ouvert, setOuvert] = useState(false);

  function ouvrir() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: valeur,
        minimumDate: minimum,
        mode: 'date',
        onChange: (evenement, date) => {
          if (evenement.type === 'set' && date) onChange(date);
        },
      });
    } else {
      setOuvert((o) => !o);
    }
  }

  return (
    <View style={styles.bloc}>
      <View style={styles.carte}>
        <CalendarDays size={tailles.icone} color={couleurs.terracotta} strokeWidth={2} />
        <Texte variante="sousTitre">{formatDate(valeur, { annee: true })}</Texte>
      </View>
      {Platform.OS !== 'web' ? (
        <BoutonSecondaire
          libelle={libelleBouton ?? textes.creation.date.changer}
          icone={CalendarDays}
          onPress={ouvrir}
        />
      ) : null}
      {ouvert && Platform.OS === 'ios' ? (
        <DateTimePicker
          value={valeur}
          minimumDate={minimum}
          mode="date"
          display="inline"
          locale="fr-FR"
          accentColor={couleurs.terracotta}
          onChange={(_e, date) => date && onChange(date)}
        />
      ) : null}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bloc: { gap: espacements.m },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.m,
    padding: espacements.l,
    borderRadius: rayons.carte,
    backgroundColor: couleurs.surface,
  },
}));
