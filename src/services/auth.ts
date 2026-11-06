import { PBKDF2_ITERATIONS, PROFILE_MAP, type Profile } from '../data/profiles';
import { pbkdf2Sha256 } from './pbkdf2';

const SESSION_KEY = 'minha-aprovacao:sessao';

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));

/** Compara em tempo constante para não vazar informação pelo tempo de resposta. */
function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Deixa a senha "tolerante": ignora maiúsculas/minúsculas, acentos, espaços,
 * hífens, pontos e sublinhados. Assim "Anny Cuiaba 2026", "anny-cuiabá-2026"
 * e "ANNYCUIABA2026" valem a mesma coisa. Mantenha igual a scripts/hash-senha.mjs.
 */
export function normalizePassword(password: string): string {
  return password
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // remove acentos
    .toLowerCase()
    .replace(/[\s\-_.]/g, '');
}

async function derive(password: string, saltHex: string): Promise<string> {
  const pw = new TextEncoder().encode(normalizePassword(password));
  const salt = fromHex(saltHex);
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    try {
      const key = await subtle.importKey('raw', pw, 'PBKDF2', false, ['deriveBits']);
      const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256);
      return toHex(bits);
    } catch {
      /* cai no cálculo em JavaScript abaixo */
    }
  }
  // Navegador sem crypto.subtle (site aberto por http:// ou IP): calcula em JS.
  await new Promise((r) => setTimeout(r, 30)); // deixa o "Entrando..." aparecer
  return toHex(pbkdf2Sha256(pw, salt, PBKDF2_ITERATIONS).buffer as ArrayBuffer);
}

/** Entra no perfil escolhido. Aceita o id do perfil ou o e-mail dele. */
export async function login(profileIdOrEmail: string, password: string): Promise<Profile> {
  const key = profileIdOrEmail.trim().toLowerCase();
  const profile = PROFILE_MAP[key] ?? Object.values(PROFILE_MAP).find((p) => p.email === key);
  if (!profile) throw new Error('Escolha o seu nome acima.');
  if (!normalizePassword(password)) throw new Error('Digite a senha.');
  const hash = await derive(password, profile.salt);
  if (!sameHex(hash, profile.hash)) throw new Error('Senha incorreta. Confira e tente de novo.');
  return profile;
}

export function readSession(): Profile | null {
  try {
    const id = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return id ? PROFILE_MAP[id] ?? null : null;
  } catch {
    return null;
  }
}

export function saveSession(profile: Profile, remember: boolean): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, profile.id);
  } catch {
    /* sem armazenamento: a sessão dura até recarregar */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignora */
  }
}
