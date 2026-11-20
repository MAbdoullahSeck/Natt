import { fireEvent, render, screen } from '@testing-library/react-native';

import { textes } from '@/i18n';

import { BoutonPrincipal } from './BoutonPrincipal';
import { CaseCode } from './CaseCode';
import { ClavierNumerique } from './ClavierNumerique';
import { LigneMembre } from './LigneMembre';
import { PuceStatut } from './PuceStatut';

describe('PuceStatut', () => {
  it.each([
    ['paye', textes.statuts.paye],
    ['en_attente', textes.statuts.enAttente],
    ['en_retard', textes.statuts.enRetard],
  ] as const)('affiche toujours le mot du statut %s', async (statut, mot) => {
    await render(<PuceStatut statut={statut} />);
    expect(screen.getByText(mot)).toBeTruthy();
  });
});

describe('BoutonPrincipal', () => {
  it('appelle onPress', async () => {
    const onPress = jest.fn();
    await render(<BoutonPrincipal libelle="Continuer" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ne réagit pas quand il est désactivé', async () => {
    const onPress = jest.fn();
    await render(<BoutonPrincipal libelle="Continuer" onPress={onPress} desactive />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('ClavierNumerique', () => {
  it('transmet les chiffres et l’effacement', async () => {
    const onChiffre = jest.fn();
    const onEffacer = jest.fn();
    await render(<ClavierNumerique onChiffre={onChiffre} onEffacer={onEffacer} />);
    await fireEvent.press(screen.getByTestId('touche-7'));
    await fireEvent.press(screen.getByTestId('touche-0'));
    await fireEvent.press(screen.getByTestId('touche-effacer'));
    expect(onChiffre.mock.calls).toEqual([['7'], ['0']]);
    expect(onEffacer).toHaveBeenCalledTimes(1);
  });
});

describe('CaseCode', () => {
  it('affiche 6 cases et les chiffres saisis', async () => {
    await render(<CaseCode valeur="12" />);
    expect(screen.getAllByTestId(/case-code-/)).toHaveLength(6);
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });
});

describe('LigneMembre', () => {
  it('propose « Marquer payé » seulement si le membre n’a pas payé', async () => {
    const { rerender } = await render(
      <LigneMembre prenom="Fatou" statut="en_attente" onMarquerPaye={() => {}} />,
    );
    expect(screen.getByText(textes.membre.marquerPaye)).toBeTruthy();
    await rerender(<LigneMembre prenom="Fatou" statut="paye" onMarquerPaye={() => {}} />);
    expect(screen.queryByText(textes.membre.marquerPaye)).toBeNull();
  });
});
