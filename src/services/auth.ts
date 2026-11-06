import { PBKDF2_ITERATIONS, PROFILE_MAP, PROFILES, type Profile } from '../data/profiles';

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

async function derive(password: string, saltHex: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Este navegador bloqueou a verificação de senha. Abra o site pelo endereço https:// (ou localhost).');
  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS }, key, 256);
  return toHex(bits);
}

export async function login(email: string, password: string): Promise<Profile> {
  const normalized = email.trim().toLowerCase();
  const profile = PROFILES.find((p) => p.email === normalized);
  // Calcula o hash mesmo quando o e-mail não existe, para o tempo de resposta ser igual.
  const hash = await derive(password, profile?.salt ?? PROFILES[0].salt);
  if (!profile || !sameHex(hash, profile.hash)) throw new Error('E-mail ou senha incorretos.');
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
