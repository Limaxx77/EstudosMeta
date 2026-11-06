// Gera sal + hash para trocar a senha de um perfil em src/data/profiles.ts.
// Uso:  node scripts/hash-senha.mjs "nova senha"
// Copie os valores impressos para os campos "salt" e "hash" do perfil.
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Informe a nova senha entre aspas (mínimo de 10 caracteres).');
  process.exit(1);
}
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, key, 256);
const hex = (b) => Buffer.from(b).toString('hex');
console.log(`salt: '${hex(salt)}',`);
console.log(`hash: '${hex(bits)}',`);
