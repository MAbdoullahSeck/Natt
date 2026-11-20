import type { BottomTabBarProps } from 'expo-router/tabs';

import { NavigationBas, type Onglet } from './NavigationBas';

/** Adaptateur entre les onglets expo-router et le composant NavigationBas (Figma 2:44). */
export function BarreOnglets({ state, navigateToTab }: BottomTabBarProps) {
  const actif = state.routes[state.index]?.name as Onglet;
  return (
    <NavigationBas
      actif={actif}
      onChange={(onglet) => {
        const route = state.routes.find((r) => r.name === onglet);
        if (route) navigateToTab(route.key);
      }}
    />
  );
}
