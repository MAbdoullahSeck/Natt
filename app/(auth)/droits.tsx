import { router } from 'expo-router';

import { Ecran, EnTete, Texte } from '@/components';
import { textes } from '@/i18n';

const t = textes.inscription.droits;

/** Lien « Mes droits » de l'écran 04. */
export default function EcranDroits() {
  return (
    <Ecran>
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      {t.lignes.map((ligne) => (
        <Texte key={ligne} variante="corpsGrand">
          {ligne}
        </Texte>
      ))}
    </Ecran>
  );
}
