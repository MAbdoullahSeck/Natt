import { Bell, CircleCheck, Grid3x3, Info, Package, Users } from 'lucide-react-native';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BarreEtapes,
  BoutonPrincipal,
  BoutonSecondaire,
  CarteInfo,
  CarteTontine,
  CaseCode,
  ChampSaisie,
  ClavierNumerique,
  EnTete,
  Interrupteur,
  LigneMembre,
  LigneTour,
  NavigationBas,
  Notification,
  OptionSelection,
  PuceStatut,
  Texte,
  type Onglet,
} from '@/components';
import { textes } from '@/i18n';
import { formatHeure, formatMoisAnnee, formatMontant } from '@/lib/format';
import { espacements } from '@/theme';

const t = textes.demo;

/** Page de démonstration interne des composants de base (étape 0). */
export default function Demo() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ContenuDemo />;
}

function ContenuDemo() {
  const [code, setCode] = useState('');
  const [option, setOption] = useState<'classique' | 'achat'>('classique');
  const [relance, setRelance] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('accueil');

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <EnTete titre={t.titre} filAriane={t.filAriane} onRetour={() => setCode('')} />
        <BarreEtapes etape={2} />

        <Section titre={t.sections.boutons}>
          <BoutonPrincipal libelle={textes.commun.continuer} onPress={() => {}} />
          <BoutonPrincipal libelle={textes.commun.continuer} desactive />
          <BoutonSecondaire libelle={textes.accueil.rejoindreAvecCode} icone={Grid3x3} />
        </Section>

        <Section titre={t.sections.clavier}>
          <CaseCode valeur={code} />
          <CaseCode valeur="482913" erreur />
          <ClavierNumerique
            onChiffre={(c) => setCode((v) => (v.length < 6 ? v + c : v))}
            onEffacer={() => setCode((v) => v.slice(0, -1))}
          />
        </Section>

        <Section titre={t.sections.champs}>
          <ChampSaisie placeholder={t.exemples.champPlaceholder} />
          <ChampSaisie prefixe="+221" value="77 123 45 67" lectureSeule />
          <OptionSelection
            icone={Users}
            titre={t.exemples.optionClassique}
            sousTitre={t.exemples.optionClassiqueDetail}
            selectionne={option === 'classique'}
            onPress={() => setOption('classique')}
          />
          <OptionSelection
            icone={Package}
            titre={t.exemples.optionAchat}
            sousTitre={t.exemples.optionAchatDetail}
            selectionne={option === 'achat'}
            onPress={() => setOption('achat')}
          />
          <Interrupteur libelle={t.exemples.interrupteur} valeur={relance} onChange={setRelance} />
        </Section>

        <Section titre={t.sections.statuts}>
          <View style={styles.rangee}>
            <PuceStatut statut="paye" />
            <PuceStatut statut="en_attente" />
            <PuceStatut statut="en_retard" />
          </View>
        </Section>

        <Section titre={t.sections.listes}>
          <CarteTontine
            nom={t.exemples.nomTontine}
            montant={10000}
            statut="en_attente"
            details={`Aminata · ${textes.accueil.membres(12)} · ${textes.frequences.mois}`}
          />
          <View>
            <LigneMembre prenom="Fatou" statut="paye" onMarquerPaye={() => {}} />
            <LigneMembre prenom="Moussa" statut="en_attente" onMarquerPaye={() => {}} />
            <LigneMembre prenom="Awa" statut="en_retard" onMarquerPaye={() => {}} />
          </View>
          <View>
            <LigneTour numero={1} prenom="Aminata" periode={formatMoisAnnee('2026-12-05')} />
            <LigneTour numero={2} prenom="Fatou" periode={formatMoisAnnee('2027-01-05')} />
          </View>
        </Section>

        <Section titre={t.sections.divers}>
          <CarteInfo icone={Info}>{textes.paiement.directement('Aminata')}</CarteInfo>
          <Notification
            icone={CircleCheck}
            confirmation
            titre={t.exemples.notifTitre}
            texte={t.exemples.notifTexte('Fatou', formatMontant(10000))}
            heure={formatHeure(new Date(2026, 11, 5, 9, 5))}
          />
          <Notification
            icone={Bell}
            titre={t.exemples.notifTitre}
            texte={t.exemples.notifTexte('Moussa', formatMontant(2500))}
            heure={formatHeure(new Date(2026, 11, 5, 14, 30))}
          />
        </Section>
      </ScrollView>
      <NavigationBas actif={onglet} onChange={setOnglet} />
    </SafeAreaView>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Texte variante="sousTitre">{titre}</Texte>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { padding: espacements.marge, gap: espacements.xxl },
  section: { gap: espacements.l },
  rangee: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.s },
});
