/**
 * Mélange cryptographiquement sûr et vérifiable (O2).
 * Fisher–Yates, tirages pris dans un flux HMAC-SHA256(graine, compteur) :
 * avec la graine enregistrée, n'importe qui peut refaire le tirage et retrouver le même ordre.
 * Sans dépendance : utilisable dans Deno (Edge Function) et dans Node (tests Jest).
 */
export const ALGORITHME = 'fisher-yates/hmac-sha256/v1';

export function nouvelleGraine(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function versHex(octets: Uint8Array): string {
  return Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');
}

export function depuisHex(hex: string): Uint8Array {
  const octets = new Uint8Array(hex.length / 2);
  for (let i = 0; i < octets.length; i++) octets[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return octets;
}

/** Flux d'entiers 32 bits dérivés de la graine. */
async function fluxAleatoire(graine: Uint8Array) {
  const cle = await crypto.subtle.importKey(
    'raw',
    graine as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  let compteur = 0;
  let tampon: number[] = [];
  return async function suivant(): Promise<number> {
    if (tampon.length === 0) {
      const message = new Uint8Array(8);
      new DataView(message.buffer).setUint32(4, compteur++);
      const bloc = new Uint8Array(await crypto.subtle.sign('HMAC', cle, message));
      const vue = new DataView(bloc.buffer);
      tampon = Array.from({ length: 8 }, (_, i) => vue.getUint32(i * 4));
    }
    return tampon.shift()!;
  };
}

/** Entier uniforme dans [0, n) sans biais (rejet). */
async function entierUniforme(suivant: () => Promise<number>, n: number): Promise<number> {
  const limite = Math.floor(0x100000000 / n) * n;
  for (;;) {
    const x = await suivant();
    if (x < limite) return x % n;
  }
}

export async function melanger<T>(elements: readonly T[], graine: Uint8Array): Promise<T[]> {
  const resultat = [...elements];
  const suivant = await fluxAleatoire(graine);
  for (let i = resultat.length - 1; i > 0; i--) {
    const j = await entierUniforme(suivant, i + 1);
    [resultat[i], resultat[j]] = [resultat[j], resultat[i]];
  }
  return resultat;
}
