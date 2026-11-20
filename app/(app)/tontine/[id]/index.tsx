import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { Chargement, Ecran, EnTete, EtatErreur } from '@/components';
import { useTontine } from '@/data/tontine';
import { VueGerante } from '@/features/tontine/VueGerante';
import { VueMembre } from '@/features/tontine/VueMembre';
import { textes } from '@/i18n';

/** Écrans 13 (gérante) et 16 (membre). */
export default function VueTontine() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={textes.accueil.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  if (data.estGerante && data.tontine.statut === 'terminee')
    return <Redirect href={{ pathname: '/tontine/[id]/fin', params: { id } }} />;
  if (data.estGerante) return <VueGerante donnees={data} />;
  return <VueMembre donnees={data} />;
}
