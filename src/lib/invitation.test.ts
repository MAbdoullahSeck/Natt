import {
  codeValide,
  lienApp,
  pageTexte,
  URL_PLAY_STORE,
} from '../../supabase/functions/_shared/invitation';

import { codeInvitation, lienInvitation } from './invitation';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- mock officiel du paquet
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('./supabase', () => ({ supabaseUrl: 'https://projet.supabase.co' }));

describe('lien d’invitation', () => {
  it('lien https partagé sur WhatsApp', () => {
    expect(lienInvitation('482913')).toBe(
      'https://projet.supabase.co/functions/v1/invitation?code=482913',
    );
  });
  it('extrait le code d’un paramètre ou d’un lien', () => {
    expect(codeInvitation('482913')).toBe('482913');
    expect(codeInvitation(['482913'])).toBe('482913');
    expect(codeInvitation('natt://rejoindre?code=482913')).toBe('482913');
    expect(codeInvitation('https://x/functions/v1/invitation?code=482913&a=1')).toBe('482913');
    expect(codeInvitation('12345')).toBeNull();
    expect(codeInvitation(undefined)).toBeNull();
  });
});

describe('page de secours (Edge Function invitation)', () => {
  it('code, lien de téléchargement et étapes', () => {
    const page = pageTexte('482913');
    expect(page).toContain('Code de la tontine : 482 913');
    expect(page).toContain(URL_PLAY_STORE);
    expect(page).toContain('Rejoindre avec un code');
  });
  it('code invalide', () => {
    expect(codeValide('12a456')).toBe(false);
    expect(pageTexte('12')).toContain('n’est pas valable');
  });
  it('lien de l’app vers l’aperçu', () => {
    expect(lienApp('482913')).toBe('natt://rejoindre?code=482913');
  });
});
