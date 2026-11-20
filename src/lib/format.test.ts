import {
  ESPACE_FINE_INSECABLE as FINE,
  ESPACE_INSECABLE as NBSP,
  formatDate,
  formatHeure,
  formatMois,
  formatMoisAnnee,
  formatMontant,
  formatNombre,
  versDate,
} from './format';

describe('formatNombre', () => {
  it.each([
    [0, '0'],
    [500, '500'],
    [1000, `1${FINE}000`],
    [10000, `10${FINE}000`],
    [250000, `250${FINE}000`],
    [1250000, `1${FINE}250${FINE}000`],
    [-2500, `-2${FINE}500`],
  ])('%p → %p', (valeur, attendu) => {
    expect(formatNombre(valeur)).toBe(attendu);
  });

  it('arrondit les décimales', () => {
    expect(formatNombre(999.6)).toBe(`1${FINE}000`);
  });
});

describe('formatMontant', () => {
  it('affiche « 10 000 F » avec espaces insécables', () => {
    expect(formatMontant(10000)).toBe(`10${FINE}000${NBSP}F`);
  });

  it('petits montants', () => {
    expect(formatMontant(500)).toBe(`500${NBSP}F`);
  });

  it('cagnotte de 12 membres à 25 000 F', () => {
    expect(formatMontant(25000 * 12)).toBe(`300${FINE}000${NBSP}F`);
  });

  it('se lit « 10 000 F » une fois les espaces normalisées', () => {
    expect(formatMontant(10000).replace(/[  ]/g, ' ')).toBe('10 000 F');
  });
});

describe('versDate', () => {
  it('lit une date SQL sans décalage de fuseau', () => {
    const d = versDate('2026-12-05');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 11, 5]);
  });

  it('renvoie la même instance pour une Date', () => {
    const d = new Date(2027, 0, 1);
    expect(versDate(d)).toBe(d);
  });
});

describe('formatDate', () => {
  it('« 5 décembre »', () => {
    expect(formatDate('2026-12-05')).toBe(`5${NBSP}décembre`);
  });

  it('« 1er » pour le premier du mois', () => {
    expect(formatDate(new Date(2027, 0, 1))).toBe(`1er${NBSP}janvier`);
  });

  it('avec année', () => {
    expect(formatDate('2027-08-15', { annee: true })).toBe(`15${NBSP}août${NBSP}2027`);
  });

  it.each([
    ['2027-02-10', 'février'],
    ['2027-07-10', 'juillet'],
    ['2027-09-10', 'septembre'],
  ])('mois accentués et longs (%s)', (date, mois) => {
    expect(formatDate(date)).toBe(`10${NBSP}${mois}`);
  });
});

describe('formatMoisAnnee', () => {
  it.each([
    ['2027-01-15', 'Janv.'],
    ['2027-02-15', 'Févr.'],
    ['2027-03-15', 'Mars'],
    ['2027-04-15', 'Avr.'],
    ['2027-05-15', 'Mai'],
    ['2027-06-15', 'Juin'],
    ['2027-07-15', 'Juil.'],
    ['2027-08-15', 'Août'],
    ['2027-09-15', 'Sept.'],
    ['2027-10-15', 'Oct.'],
    ['2027-11-15', 'Nov.'],
    ['2027-12-15', 'Déc.'],
  ])('%s → %s 2027', (date, mois) => {
    expect(formatMoisAnnee(date)).toBe(`${mois}${NBSP}2027`);
  });
});

describe('formatMois', () => {
  it('met une majuscule', () => {
    expect(formatMois('2026-12-01')).toBe('Décembre');
  });
});

describe('formatHeure', () => {
  it('« 9 h 05 »', () => {
    expect(formatHeure(new Date(2026, 11, 5, 9, 5))).toBe(`9${NBSP}h${NBSP}05`);
  });
});
