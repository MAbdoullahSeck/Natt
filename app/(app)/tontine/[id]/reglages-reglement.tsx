import { router, useLocalSearchParams } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  BoutonPrincipal,
  BoutonSecondaire,
  Chargement,
  ChampSaisie,
  Ecran,
  EnTete,
  EtatErreur,
  Texte,
} from '@/components';
import { useModifierReglement } from '@/data/reglages';
import { useTontine } from '@/data/tontine';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { creerStyles, espacements, rayons, tailles, useCouleurs } from '@/theme';

const t = textes.reglages.reglementEcran;

/** Règlement : lignes générées + règles ajoutées par la gérante (R1) ; nouvelle version (R2). */
export default function ReglageReglement() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const modifier = useModifierReglement(id);
  const [libres, setLibres] = useState<string[] | null>(null);
  const [nouvelle, setNouvelle] = useState('');

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );
  const lignesLibres = libres ?? data.tontine.reglement_libres;
  const generees = (data.reglement?.lignes ?? []).slice(
    0,
    (data.reglement?.lignes.length ?? 0) - data.tontine.reglement_libres.length,
  );
  const modifie = libres !== null;

  return (
    <Ecran
      pied={
        data.estGerante && modifie ? (
          <BoutonPrincipal
            libelle={t.bouton}
            desactive={modifier.isPending}
            onPress={() => modifier.mutate(lignesLibres, { onSuccess: () => router.back() })}
          />
        ) : null
      }
    >
      <EnTete
        titre={t.titre}
        filAriane={data.reglement ? t.version(data.reglement.version) : data.tontine.nom}
        onRetour={() => router.back()}
      />
      <View style={styles.bloc}>
        {generees.map((l, i) => (
          <Texte key={i}>• {l}</Texte>
        ))}
      </View>
      {data.estGerante ? (
        <>
          <Texte variante="sousTitre">{t.ajoutees}</Texte>
          {lignesLibres.map((l, i) => (
            <View key={`${i}-${l}`} style={styles.ligneLibre}>
              <Texte style={styles.flex}>• {l}</Texte>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.retirer}
                hitSlop={12}
                onPress={() => setLibres(lignesLibres.filter((_, j) => j !== i))}
              >
                <X size={tailles.icone} color={couleurs.terracotta} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
          <ChampSaisie
            value={nouvelle}
            onChangeText={setNouvelle}
            placeholder={t.placeholder}
            maxLength={200}
          />
          <BoutonSecondaire
            libelle={t.ajouter}
            icone={Plus}
            desactive={nouvelle.trim().length < 2}
            onPress={() => {
              setLibres([...lignesLibres, nouvelle.trim()]);
              setNouvelle('');
            }}
          />
          {modifie ? <Texte couleur="texteSecondaire">{t.aide}</Texte> : null}
        </>
      ) : (
        lignesLibres.map((l, i) => <Texte key={i}>• {l}</Texte>)
      )}
      {modifier.error ? <Texte couleur="terracotta">{messageErreur(modifier.error)}</Texte> : null}
    </Ecran>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bloc: {
    gap: espacements.s,
    padding: espacements.l,
    borderRadius: rayons.carte,
    backgroundColor: couleurs.terracottaClair,
  },
  ligneLibre: { flexDirection: 'row', alignItems: 'center', gap: espacements.m },
  flex: { flex: 1 },
}));
