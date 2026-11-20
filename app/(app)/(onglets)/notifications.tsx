import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeftRight,
  Bell,
  CircleCheck,
  FileText,
  type LucideIcon,
  Shuffle,
  TriangleAlert,
  UserPlus,
  Wallet2,
} from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chargement, EnTete, EtatErreur, Notification, Texte } from '@/components';
import { cles } from '@/data/cles';
import { marquerNotificationsLues, useNotifications } from '@/data/reglages';
import { grouperParJour, jourRelatif } from '@/domain/notifications';
import { textes } from '@/i18n';
import { formatDate, formatHeure } from '@/lib/format';
import { couleurs, espacements } from '@/theme';

const t = textes.notifications;

const ICONES: Record<string, LucideIcon> = {
  confirmation: CircleCheck,
  versement: Wallet2,
  declaration: Bell,
  relance: Bell,
  recap_retards: TriangleAlert,
  penalite: TriangleAlert,
  penalite_annulee: CircleCheck,
  tirage: Shuffle,
  echange: ArrowLeftRight,
  membre_rejoint: UserPlus,
  reglement: FileText,
  cycle_termine: CircleCheck,
};
const CONFIRMATIONS = new Set(['confirmation', 'versement', 'penalite_annulee', 'cycle_termine']);

/** Écran 22 — Notifications, par jour. */
export default function Notifications() {
  const { data, isLoading, error, refetch, isRefetching } = useNotifications();
  const client = useQueryClient();

  // À l'ouverture de l'onglet, tout est marqué comme lu.
  useFocusEffect(
    useCallback(() => {
      refetch();
      marquerNotificationsLues().then(() =>
        client.invalidateQueries({ queryKey: cles.notifications }),
      );
    }, [refetch, client]),
  );

  let contenu;
  if (isLoading) contenu = <Chargement />;
  else if (error) contenu = <EtatErreur erreur={error} onReessayer={refetch} />;
  else if (!data || data.length === 0)
    contenu = (
      <Texte variante="corpsGrand" couleur="texteSecondaire">
        {t.vide}
      </Texte>
    );
  else
    contenu = grouperParJour(data).map((groupe) => {
      const relatif = jourRelatif(groupe.jour);
      return (
        <View key={groupe.jour.toISOString()} style={styles.groupe}>
          <Texte variante="corpsFort" couleur="texteSecondaire">
            {relatif === 'aujourdhui'
              ? t.aujourdhui
              : relatif === 'hier'
                ? t.hier
                : formatDate(groupe.jour)}
          </Texte>
          {groupe.elements.map((n) => (
            <Pressable
              key={n.id}
              disabled={!n.tontine_id}
              onPress={() =>
                n.tontine_id &&
                router.push({ pathname: '/tontine/[id]', params: { id: n.tontine_id } })
              }
              accessibilityRole="button"
            >
              <Notification
                icone={ICONES[n.type] ?? Bell}
                titre={n.titre}
                texte={n.corps}
                heure={formatHeure(n.created_at)}
                confirmation={CONFIRMATIONS.has(n.type)}
              />
            </Pressable>
          ))}
        </View>
      );
    });

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contenu}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={couleurs.terracotta}
          />
        }
      >
        <EnTete titre={t.titre} />
        {contenu}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.marge, gap: espacements.xl, flexGrow: 1 },
  groupe: { gap: espacements.m },
});
