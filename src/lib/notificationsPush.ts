import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { couleurs } from '@/theme';

import { supabase } from './supabase';

/**
 * Notifications push (expo-notifications). Le jeton Expo est enregistré dans
 * `profils.expo_push_token` ; l'envoi est fait par l'Edge Function « push ».
 * Toute notification existe aussi dans la table `notifications` (écran 22).
 */
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function identifiantProjet(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
  );
}

/** Demande l'autorisation et enregistre le jeton. Ne fait rien sur le web ou un émulateur. */
export async function enregistrerPush(profilId: string): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('natt', {
      name: 'Natt',
      // eslint-disable-next-line import/namespace -- exporté via « export * », mal résolu par eslint-plugin-import
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: couleurs.terracotta,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId = identifiantProjet();
  if (!projectId) return null; // EAS non configuré : pas de jeton possible.
  const jeton = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await supabase.from('profils').update({ expo_push_token: jeton }).eq('id', profilId);
  return jeton;
}

/** Appui sur une notification : ouvre la tontine concernée. Renvoie la fonction de nettoyage. */
export function ecouterOuvertureNotifications(): () => void {
  if (Platform.OS === 'web') return () => undefined;
  const abonnement = Notifications.addNotificationResponseReceivedListener((reponse) => {
    const tontineId = reponse.notification.request.content.data?.tontine_id;
    if (typeof tontineId === 'string') {
      router.push({ pathname: '/tontine/[id]', params: { id: tontineId } });
    }
  });
  return () => abonnement.remove();
}
