import { Tabs } from 'expo-router';

import { BarreOnglets } from '@/components';
import { useCouleurs } from '@/theme';

export default function LayoutOnglets() {
  const couleurs = useCouleurs();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: couleurs.fond } }}
      tabBar={(props) => <BarreOnglets {...props} />}
    >
      <Tabs.Screen name="accueil" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
