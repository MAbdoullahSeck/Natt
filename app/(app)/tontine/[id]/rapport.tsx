import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { FileDown } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import {
  BoutonPrincipal,
  BoutonSecondaire,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  LigneInfo,
  Texte,
} from '@/components';
import { useEvenementsPenalites } from '@/data/reglages';
import { prenomDe, useTontine } from '@/data/tontine';
import { calculerRapport } from '@/domain/rapport';
import { htmlRapport } from '@/features/rapport/htmlRapport';
import { partagerPdf } from '@/features/rapport/pdf';
import { textes } from '@/i18n';
import { formatMoisAnnee, formatMontant } from '@/lib/format';
import { partagerWhatsApp } from '@/lib/partage';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.rapport;

/** Écran 19b — Rapport du cycle, partageable sur WhatsApp. */
export default function RapportDuCycle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tontine = useTontine(id);
  const evenements = useEvenementsPenalites(id);
  const pdf = useMutation({
    mutationFn: (p: { html: string; titre: string }) => partagerPdf(p.html, p.titre),
  });

  if (tontine.isLoading || evenements.isLoading) return <Chargement />;
  if (tontine.error || !tontine.data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={tontine.error} onReessayer={tontine.refetch} />
      </Ecran>
    );

  const d = tontine.data;
  const r = calculerRapport(
    d.tontine.montant,
    d.tontine.nb_membres,
    d.membres,
    d.tours,
    d.cotisations,
    evenements.data ?? [],
  );
  const periode =
    r.debut && r.fin ? t.periodeValeur(formatMoisAnnee(r.debut), formatMoisAnnee(r.fin)) : '—';
  const lignes: [string, string][] = [
    [t.totalVerse, formatMontant(r.totalVerse)],
    [t.tours, String(r.nbTours)],
    [t.periode, periode],
    [t.aLHeure, t.pourcentage(r.pourcentageALHeure)],
    [t.retards, String(r.nbRetards)],
    [t.penalites, formatMontant(r.totalPenalites)],
  ];
  const message = t.message(
    d.tontine.nom,
    [
      ...lignes.map(([l, v]) => `${l} : ${v}`),
      '',
      `${t.ponctualite} :`,
      ...r.ponctualite.map(
        (p) => `- ${prenomDe(d.membres, p.membreId)} : ${t.ligneMembre(p.aLHeure, p.enRetard)}`,
      ),
    ].join('\n'),
  );

  return (
    <Ecran
      pied={
        <>
          <BoutonSecondaire
            libelle={pdf.isPending ? t.pdfEnCours : t.pdf}
            icone={FileDown}
            desactive={pdf.isPending}
            onPress={() =>
              pdf.mutate({
                titre: t.pdfTitreFichier(d.tontine.nom),
                html: htmlRapport({
                  nomTontine: d.tontine.nom,
                  rapport: r,
                  prenoms: Object.fromEntries(
                    d.membres.map((m) => [m.id, m.profil?.prenom ?? '—']),
                  ),
                }),
              })
            }
            testID="bouton-pdf"
          />
          <BoutonPrincipal libelle={t.partager} onPress={() => partagerWhatsApp(message)} />
        </>
      }
    >
      <EnTete titre={t.titre} filAriane={d.tontine.nom} onRetour={() => router.back()} />
      <View style={styles.carte}>
        <Texte variante="corpsFort" couleur="texteSecondaire">
          {t.totalVerse}
        </Texte>
        <Texte variante="montantGeant">{formatMontant(r.totalVerse)}</Texte>
      </View>
      <View>
        {lignes.slice(1).map(([l, v]) => (
          <LigneInfo key={l} libelle={l} valeur={v} />
        ))}
      </View>
      <Texte variante="sousTitre">{t.ponctualite}</Texte>
      <View>
        {r.ponctualite.map((p) => (
          <LigneInfo
            key={p.membreId}
            libelle={prenomDe(d.membres, p.membreId)}
            valeur={t.ligneMembre(p.aLHeure, p.enRetard)}
          />
        ))}
      </View>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.terracottaClair,
    borderRadius: rayons.carteGrande,
    padding: espacements.xl,
    gap: espacements.s,
  },
});
