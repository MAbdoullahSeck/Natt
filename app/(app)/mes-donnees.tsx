import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';

import { BoutonSecondaire, Ecran, EnTete, LigneInfo, Texte } from '@/components';
import { formatTelephoneComplet } from '@/domain/telephone';
import { textes } from '@/i18n';
import { formatDate } from '@/lib/format';
import { useProfil } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const t = textes.mesDonnees;

/** Profil → Mes données (D1, D2). */
export default function MesDonnees() {
  const profil = useProfil();
  const { data: nbTontines } = useQuery({
    queryKey: ['nb-tontines', profil.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('membres')
        .select('id', { count: 'exact', head: true })
        .eq('profil_id', profil.id);
      return count ?? 0;
    },
  });

  return (
    <Ecran
      pied={
        <BoutonSecondaire
          libelle={t.retirer}
          onPress={() => router.push('/retrait-consentement')}
          testID="bouton-retirer"
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      <Texte variante="corpsGrand">{t.texte}</Texte>
      <View>
        <LigneInfo libelle={t.prenom} valeur={profil.prenom} />
        <LigneInfo libelle={t.telephone} valeur={formatTelephoneComplet(profil.telephone)} />
        <LigneInfo
          libelle={t.consentement}
          valeur={formatDate(profil.consentement_at, { annee: true })}
        />
        <LigneInfo libelle={t.version} valeur={profil.consentement_version} />
        <LigneInfo libelle={t.tontines} valeur={String(nbTontines ?? '…')} />
      </View>
    </Ecran>
  );
}
