import { router } from 'expo-router';
import { BellRing, ListOrdered, Settings, Share2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BoutonPrincipal,
  BoutonSecondaire,
  CarteInfo,
  Ecran,
  EnTete,
  LigneMembre,
  Lien,
  Texte,
} from '@/components';
import { useMarquerVerse } from '@/data/actions';
import { useRelancer } from '@/data/reglages';
import { type DonneesTontine, prenomDe } from '@/data/tontine';
import { resumeTour, statutMembre, tourEnCours } from '@/domain/tontine';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatDate, formatMontant } from '@/lib/format';
import { lienRejoindre, partagerWhatsApp } from '@/lib/partage';
import { espacements } from '@/theme';

import { CarteCagnotte } from './CarteCagnotte';

const t = textes.tontine;

type Props = { donnees: DonneesTontine };

/** Écran 13 — Tontine · Gérante. */
export function VueGerante({ donnees }: Props) {
  const { tontine, membres, tours, cotisations } = donnees;
  const tour = tourEnCours(tours);
  const verse = useMarquerVerse(tontine.id);
  const relancer = useRelancer(tontine.id);
  const id = tontine.id;
  const places = tontine.nb_membres - membres.length;

  const resume = tour ? resumeTour(tontine.montant, tontine.nb_membres, tour, cotisations) : null;
  const beneficiaire = tour ? prenomDe(membres, tour.beneficiaire_membre_id) : '';

  let pied: ReactNode = null;
  if (tour && resume?.toutPaye && tour.beneficiaire_membre_id) {
    pied = (
      <BoutonPrincipal
        libelle={
          tontine.type === 'achat_groupe'
            ? t.bienRemis(beneficiaire)
            : t.cagnotteRemise(beneficiaire)
        }
        desactive={verse.isPending}
        onPress={() =>
          verse.mutate(tour.id, {
            onSuccess: (statut) => {
              if (statut === 'terminee')
                router.replace({ pathname: '/tontine/[id]/fin', params: { id } });
            },
          })
        }
        testID="bouton-verse"
      />
    );
  } else if (tour) {
    pied = (
      <BoutonPrincipal
        libelle={textes.relances.retardataires}
        icone={BellRing}
        desactive={relancer.isPending}
        onPress={() => relancer.mutate(undefined)}
        testID="bouton-relancer"
      />
    );
  }

  return (
    <Ecran pied={pied}>
      <EnTete titre={tontine.nom} onRetour={() => router.back()} />
      {tour && resume ? (
        <CarteCagnotte
          titre={
            tontine.type === 'achat_groupe' ? t.bienDuTour(tour.numero) : t.cagnotte(tour.numero)
          }
          montant={
            tontine.type === 'achat_groupe' && tontine.bien_prevu
              ? tontine.bien_prevu
              : formatMontant(resume.cagnotte)
          }
          sousTitre={t.pour(beneficiaire, formatDate(tour.echeance))}
          detail={t.recus(formatMontant(resume.recu), resume.nbPayes, resume.nbMembres)}
        />
      ) : (
        <Texte variante="corpsGrand">{t.toutVerse}</Texte>
      )}

      {places > 0 ? (
        <CarteInfo icone={Share2}>
          <Texte variante="corpsFort">{t.code(tontine.code)}</Texte>
          <Texte couleur="texteSecondaire">{t.places(places)}</Texte>
          <Lien
            libelle={t.partagerCode}
            onPress={() =>
              partagerWhatsApp(
                textes.creation.cree.message(
                  tontine.nom,
                  tontine.code,
                  lienRejoindre(tontine.code),
                ),
              )
            }
          />
        </CarteInfo>
      ) : null}

      <View style={styles.rangee}>
        <View style={styles.moitie}>
          <BoutonSecondaire
            libelle={t.tours}
            icone={ListOrdered}
            onPress={() => router.push({ pathname: '/tontine/[id]/tours', params: { id } })}
          />
        </View>
        <View style={styles.moitie}>
          <BoutonSecondaire
            libelle={t.reglages}
            icone={Settings}
            onPress={() => router.push({ pathname: '/tontine/[id]/reglages', params: { id } })}
          />
        </View>
      </View>

      <View>
        <Texte variante="sousTitre">{t.membres}</Texte>
        {membres.map((m) => {
          const statut = tour ? statutMembre(tour, cotisations, m.id) : 'paye';
          const cotisation = tour
            ? cotisations.find((c) => c.tour_id === tour.id && c.membre_id === m.id)
            : undefined;
          return (
            <LigneMembre
              key={m.id}
              prenom={
                m.profil_id === tontine.gerante_id
                  ? `${m.profil?.prenom} (${t.toi})`
                  : (m.profil?.prenom ?? '—')
              }
              statut={statut}
              onPress={() =>
                router.push({
                  pathname: '/tontine/[id]/membre/[membreId]',
                  params: { id, membreId: m.id },
                })
              }
              onMarquerPaye={
                cotisation
                  ? () =>
                      router.push({
                        pathname: '/tontine/[id]/confirmer',
                        params: { id, cotisation: cotisation.id },
                      })
                  : undefined
              }
            />
          );
        })}
      </View>
      {relancer.data !== undefined ? (
        <Texte variante="corpsFort" couleur="vert">
          {textes.relances.envoyees(relancer.data)}
        </Texte>
      ) : null}
      {verse.error || relancer.error ? (
        <Texte couleur="terracotta">{messageErreur(verse.error ?? relancer.error)}</Texte>
      ) : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', gap: espacements.m },
  moitie: { flex: 1 },
});
