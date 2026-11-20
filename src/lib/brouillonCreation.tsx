import { createContext, type ReactNode, useContext, useState } from 'react';

import type { Frequence } from '@/domain/dates';

/** Réponses du parcours de création (écrans 06 à 10), gardées en mémoire jusqu'à la création. */
export type Brouillon = {
  nom: string;
  type: 'classique' | 'achat_groupe';
  bienPrevu: string;
  montant: number;
  frequence: Frequence;
  nbMembres: number;
  dateDebut: Date;
};

const initial = (): Brouillon => ({
  nom: '',
  type: 'classique',
  bienPrevu: '',
  montant: 0,
  frequence: 'mois',
  nbMembres: 0,
  dateDebut: new Date(),
});

type Contexte = { brouillon: Brouillon; modifier: (p: Partial<Brouillon>) => void };
const ContexteBrouillon = createContext<Contexte | null>(null);

export function BrouillonProvider({ children }: { children: ReactNode }) {
  const [brouillon, setBrouillon] = useState<Brouillon>(initial);
  return (
    <ContexteBrouillon.Provider
      value={{ brouillon, modifier: (p) => setBrouillon((b) => ({ ...b, ...p })) }}
    >
      {children}
    </ContexteBrouillon.Provider>
  );
}

export function useBrouillon(): Contexte {
  const c = useContext(ContexteBrouillon);
  if (!c) throw new Error('useBrouillon hors du parcours de création');
  return c;
}
