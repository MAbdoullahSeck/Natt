import { router } from 'expo-router';
import {
  ChevronRight,
  Crown,
  Database,
  Languages,
  LogOut,
  type LucideIcon,
  MessageCircle,
  SunMoon,
} from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

import { Ecran, EnTete, Texte } from '@/components';
import { config } from '@/config';
import { usePalierActif } from '@/data/abonnement';
import { formatTelephoneComplet } from '@/domain/telephone';
import { textes } from '@/i18n';
import { formatDate } from '@/lib/format';
import { useProfil, useSession } from '@/lib/session';
import { creerStyles, espacements, rayons, tailles, useCouleurs, useTheme } from '@/theme';

const t = textes.profilEcran;

/** Écran 23 — Profil. */
export default function Profil() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const profil = useProfil();
  const { deconnecter } = useSession();
  const { apparence } = useTheme();
  const { palier, data: abonnements } = usePalierActif();
  const actif = abonnements?.find((a) => a.statut === 'actif' && a.palier === palier);
  const abonnement =
    palier && actif?.expire_at
      ? textes.abonnement.actifJusquau(
          textes.abonnement.paliers[palier],
          formatDate(actif.expire_at, { annee: true }),
        )
      : palier
        ? textes.abonnement.paliers[palier]
        : textes.abonnement.aucun;

  return (
    <Ecran avecOnglets>
      <EnTete titre={profil.prenom} />
      <Texte variante="corpsGrand" couleur="texteSecondaire">
        {formatTelephoneComplet(profil.telephone)}
      </Texte>
      {profil.fondatrice ? (
        <View style={styles.badge}>
          <Crown size={tailles.icone} color={couleurs.vert} strokeWidth={2} />
          <Texte variante="libelle" couleur="vert">
            {t.fondatrice}
          </Texte>
        </View>
      ) : null}
      <View>
        <Ligne
          icone={Crown}
          libelle={t.abonnement}
          valeur={abonnement}
          onPress={() => router.push('/abonnement')}
        />
        <Ligne icone={Database} libelle={t.donnees} onPress={() => router.push('/mes-donnees')} />
        <Ligne icone={Languages} libelle={t.langue} valeur={t.francais} />
        <Ligne
          icone={SunMoon}
          libelle={t.apparence}
          valeur={textes.apparence[apparence]}
          onPress={() => router.push('/apparence')}
          testID="ligne-apparence"
        />
        {config.numeroAideWhatsApp ? (
          <Ligne
            icone={MessageCircle}
            libelle={t.aide}
            onPress={() => Linking.openURL(`https://wa.me/${config.numeroAideWhatsApp}`)}
          />
        ) : null}
        <Ligne
          icone={LogOut}
          libelle={t.deconnecter}
          onPress={deconnecter}
          testID="bouton-deconnecter"
        />
      </View>
    </Ecran>
  );
}

type PropsLigne = {
  icone: LucideIcon;
  libelle: string;
  valeur?: string;
  onPress?: () => void;
  testID?: string;
};

function Ligne({ icone: Icone, libelle, valeur, onPress, testID }: PropsLigne) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.ligne}
      accessibilityRole={onPress ? 'button' : undefined}
      testID={testID}
    >
      <Icone size={tailles.icone} color={couleurs.terracotta} strokeWidth={2} />
      <View style={styles.textes}>
        <Texte variante="corpsFort">{libelle}</Texte>
        {valeur ? <Texte couleur="texteSecondaire">{valeur}</Texte> : null}
      </View>
      {onPress ? (
        <ChevronRight size={tailles.icone} color={couleurs.texteSecondaire} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.s,
    alignSelf: 'flex-start',
    backgroundColor: couleurs.vertPuce,
    borderRadius: rayons.puce,
    paddingHorizontal: espacements.m,
    paddingVertical: espacements.xs,
  },
  ligne: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.separateur,
  },
  textes: { flex: 1, gap: espacements.xs },
}));
