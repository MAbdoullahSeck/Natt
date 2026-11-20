import {
  corpsDemande,
  egaliteSure,
  ipnAuthentique,
  sha256Hex,
} from '../../supabase/functions/_shared/paytech';

const CLE = 'cle-api-de-test';
const SECRET = 'cle-secrete-de-test';

describe('IPN PayTech : authenticité', () => {
  it('SHA-256 connu', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('accepte une IPN dont les empreintes correspondent', async () => {
    const champs = {
      api_key_sha256: await sha256Hex(CLE),
      api_secret_sha256: await sha256Hex(SECRET),
    };
    expect(await ipnAuthentique(champs, CLE, SECRET)).toBe(true);
  });

  it('accepte les empreintes en majuscules', async () => {
    const champs = {
      api_key_sha256: (await sha256Hex(CLE)).toUpperCase(),
      api_secret_sha256: (await sha256Hex(SECRET)).toUpperCase(),
    };
    expect(await ipnAuthentique(champs, CLE, SECRET)).toBe(true);
  });

  it('refuse une mauvaise clé, une empreinte absente ou des secrets non configurés', async () => {
    const bon = await sha256Hex(SECRET);
    expect(
      await ipnAuthentique(
        { api_key_sha256: await sha256Hex('autre'), api_secret_sha256: bon },
        CLE,
        SECRET,
      ),
    ).toBe(false);
    expect(await ipnAuthentique({ api_secret_sha256: bon }, CLE, SECRET)).toBe(false);
    expect(await ipnAuthentique({ api_key_sha256: '', api_secret_sha256: '' }, '', '')).toBe(false);
  });

  it('comparaison sûre', () => {
    expect(egaliteSure('abc', 'abc')).toBe(true);
    expect(egaliteSure('abc', 'abd')).toBe(false);
    expect(egaliteSure('abc', 'ab')).toBe(false);
  });
});

describe('demande de paiement PayTech', () => {
  it('montant, devise, URL et environnement', () => {
    const c = corpsDemande({
      montant: 25000,
      refCommand: 'NATT-20261121-ABC',
      palier: 'pro',
      periodicite: 'annuel',
      urlIpn: 'https://x/functions/v1/paytech-ipn',
      urlSucces: 'natt://abonnement?paiement=succes',
      urlAnnulation: 'natt://abonnement?paiement=annule',
      env: 'test',
    });
    expect(c).toMatchObject({
      item_price: 25000,
      currency: 'XOF',
      ref_command: 'NATT-20261121-ABC',
      env: 'test',
      ipn_url: 'https://x/functions/v1/paytech-ipn',
      item_name: 'Abonnement Natt Pro (1 an)',
    });
  });
  it('tout ce qui n’est pas « prod » part en test', () => {
    const c = corpsDemande({
      montant: 1000,
      refCommand: 'r',
      palier: 'starter',
      periodicite: 'mensuel',
      urlIpn: '',
      urlSucces: '',
      urlAnnulation: '',
      env: 'n importe quoi',
    });
    expect(c.env).toBe('test');
    expect(c.item_name).toBe('Abonnement Natt Starter (1 mois)');
  });
});
