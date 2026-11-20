import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, FileText } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Chargement, Ecran, EnTete, EtatErreur, Interrupteur, Texte } from '@/components';
import { useModifierReglages } from '@/data/reglages';
import { useTontine } from '@/data/tontine';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatMontant } from '@/lib/format';
import { creerStyles, espacements, tailles, useCouleurs } from '@/theme';

const t = textes.reglages;

/** Écran 13b — Tontine · Réglages. */
export default function Reglages() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const modifier = useModifierReglages(id);

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  const tt = data.tontine;
  const actuels = {
    jMoins3: tt.relance_j_moins_3,
    jourJ: tt.relance_jour_j,
    jPlus1: tt.relance_j_plus_1,
    penalite: tt.penalite_retard,
  };

  return (
    <Ecran>
      <EnTete titre={t.titre} filAriane={tt.nom} onRetour={() => router.back()} />
      <View style={styles.section}>
        <Texte variante="sousTitre">{t.rappels}</Texte>
        <Texte couleur="texteSecondaire">{t.rappelsAide}</Texte>
        <Interrupteur
          libelle={t.jMoins3}
          valeur={tt.relance_j_moins_3}
          onChange={(v) => modifier.mutate({ ...actuels, jMoins3: v })}
          testID="interrupteur-j-3"
        />
        <Interrupteur
          libelle={t.jourJ}
          valeur={tt.relance_jour_j}
          onChange={(v) => modifier.mutate({ ...actuels, jourJ: v })}
        />
        <Interrupteur
          libelle={t.jPlus1}
          valeur={tt.relance_j_plus_1}
          onChange={(v) => modifier.mutate({ ...actuels, jPlus1: v })}
        />
      </View>
      <LigneReglage
        libelle={t.penalite}
        valeur={tt.penalite_retard > 0 ? formatMontant(tt.penalite_retard) : t.aucune}
        onPress={() => router.push({ pathname: '/tontine/[id]/reglages-penalite', params: { id } })}
      />
      <LigneReglage
        libelle={t.reglement}
        valeur={t.voirReglement}
        onPress={() =>
          router.push({ pathname: '/tontine/[id]/reglages-reglement', params: { id } })
        }
      />
      {modifier.error ? <Texte couleur="terracotta">{messageErreur(modifier.error)}</Texte> : null}
    </Ecran>
  );
}

function LigneReglage({
  libelle,
  valeur,
  onPress,
}: {
  libelle: string;
  valeur: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <Pressable onPress={onPress} style={styles.ligne} accessibilityRole="button">
      <FileText size={tailles.icone} color={couleurs.terracotta} strokeWidth={2} />
      <View style={styles.textes}>
        <Texte variante="corpsFort">{libelle}</Texte>
        <Texte couleur="texteSecondaire">{valeur}</Texte>
      </View>
      <ChevronRight size={tailles.icone} color={couleurs.texteSecondaire} strokeWidth={2} />
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  section: { gap: espacements.s },
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
