import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { numeroPourPaiement, ouvrirPaiement } from './paiementMobile';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

describe('paiement mobile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('numéro local sans indicatif', () => {
    expect(numeroPourPaiement('221771234567')).toBe('771234567');
    expect(numeroPourPaiement('771234567')).toBe('771234567');
  });

  it('copie le numéro et ouvre l’application', async () => {
    const ouvrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await expect(ouvrirPaiement('wave', '221771234567')).resolves.toBe('application');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('771234567');
    expect(ouvrir).toHaveBeenCalledWith('wave://');
  });

  it('Orange Money : composeur USSD #144# si l’application ne s’ouvre pas', async () => {
    const ouvrir = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error('non pris en charge'))
      .mockResolvedValueOnce(undefined);
    await expect(ouvrirPaiement('orange_money', '221771234567')).resolves.toBe('secours');
    expect(ouvrir).toHaveBeenLastCalledWith(expect.stringMatching(/^(tel:%23144%23)$/));
  });

  it('copie seulement si rien ne s’ouvre', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('rien'));
    await expect(ouvrirPaiement('wave', '221771234567')).resolves.toBe('copie_seulement');
  });
});
