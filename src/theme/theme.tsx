import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { type NomPalette, type Palette, palettes } from './couleurs';

/** Réglage de l'apparence (Profil) : suit le téléphone par défaut. */
export type Apparence = 'automatique' | 'clair' | 'sombre';

const CLE = 'natt.apparence';

type Theme = {
  apparence: Apparence;
  changerApparence: (a: Apparence) => void;
  schema: NomPalette;
  couleurs: Palette;
};

const ContexteTheme = createContext<Theme>({
  apparence: 'automatique',
  changerApparence: () => undefined,
  schema: 'clair',
  couleurs: palettes.clair,
});

export function schemaPour(apparence: Apparence, systeme: string | null | undefined): NomPalette {
  if (apparence === 'automatique') return systeme === 'dark' ? 'sombre' : 'clair';
  return apparence;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systeme = useColorScheme();
  const [apparence, setApparence] = useState<Apparence>('automatique');

  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((v) => {
        if (v === 'clair' || v === 'sombre' || v === 'automatique') setApparence(v);
      })
      .catch(() => undefined);
  }, []);

  const valeur = useMemo<Theme>(() => {
    const schema = schemaPour(apparence, systeme);
    return {
      apparence,
      changerApparence: (a) => {
        setApparence(a);
        AsyncStorage.setItem(CLE, a).catch(() => undefined);
      },
      schema,
      couleurs: palettes[schema],
    };
  }, [apparence, systeme]);

  return <ContexteTheme.Provider value={valeur}>{children}</ContexteTheme.Provider>;
}

export function useTheme(): Theme {
  return useContext(ContexteTheme);
}

/** Palette active (claire ou sombre). */
export function useCouleurs(): Palette {
  return useContext(ContexteTheme).couleurs;
}

/**
 * Styles qui dépendent des couleurs : `const useStyles = creerStyles((couleurs) => ({ … }))`
 * puis `const styles = useStyles()` dans le composant. Un seul calcul par palette.
 */
type StylesNommes = Parameters<typeof StyleSheet.create>[0];

export function creerStyles<S extends StylesNommes>(
  fabrique: (couleurs: Palette) => S & StylesNommes,
): () => Readonly<S> {
  const cache = new Map<Palette, Readonly<S>>();
  return function useStyles() {
    const couleurs = useCouleurs();
    const existants = cache.get(couleurs);
    if (existants) return existants;
    const styles = StyleSheet.create<S>(fabrique(couleurs));
    cache.set(couleurs, styles);
    return styles;
  };
}
