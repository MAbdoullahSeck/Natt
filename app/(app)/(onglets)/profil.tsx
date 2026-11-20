import { BoutonSecondaire, Ecran, EnTete, Texte } from '@/components';
import { formatTelephoneComplet } from '@/domain/telephone';
import { textes } from '@/i18n';
import { useProfil, useSession } from '@/lib/session';
import { LogOut } from 'lucide-react-native';

/** Écran 23 — Profil (complété à l'étape 10). */
export default function Profil() {
  const profil = useProfil();
  const { deconnecter } = useSession();
  return (
    <Ecran avecOnglets>
      <EnTete titre={profil.prenom} />
      <Texte couleur="texteSecondaire">{formatTelephoneComplet(profil.telephone)}</Texte>
      <BoutonSecondaire libelle={textes.profil.deconnecter} icone={LogOut} onPress={deconnecter} />
    </Ecran>
  );
}
