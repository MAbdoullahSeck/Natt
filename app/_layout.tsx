import { Nunito_400Regular, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/lib/session';
import { couleurs } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [policesChargees, erreur] = useFonts({ Nunito_400Regular, Nunito_700Bold });
  const [clientRequetes] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
      }),
  );

  if (!policesChargees && !erreur) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={clientRequetes}>
        <SessionProvider>
          <StatusBar style="dark" />
          <Navigation />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function Navigation() {
  const { chargement } = useSession();
  useEffect(() => {
    if (!chargement) SplashScreen.hideAsync();
  }, [chargement]);
  if (chargement) return null;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}
    />
  );
}
