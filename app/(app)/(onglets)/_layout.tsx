import { Tabs } from 'expo-router';

import { BarreOnglets } from '@/components';

export default function LayoutOnglets() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarreOnglets {...props} />}>
      <Tabs.Screen name="accueil" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
