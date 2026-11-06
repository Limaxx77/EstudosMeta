// PBKDF2-HMAC-SHA256 em JavaScript puro. Usado só quando o navegador não
// oferece crypto.subtle (por exemplo, site aberto por http:// ou por IP),
// para que o login funcione em qualquer aparelho.

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
const W = new Uint32Array(64);

/** Processa um bloco de 64 bytes (16 palavras) sobre o estado h. */
function block(h: Uint32Array, m: Uint32Array) {
  for (let i = 0; i < 16; i++) W[i] = m[i];
  for (let i = 16; i < 64; i++) {
    const a = W[i - 15], b = W[i - 2];
    const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
    const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
    W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
  }
  let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
  for (let i = 0; i < 64; i++) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const t1 = (k + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
    k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
  }
  h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += k;
}

function sha256(data: Uint8Array): Uint8Array {
  const len = data.length;
  const total = Math.ceil((len + 9) / 64) * 64;
  const buf = new Uint8Array(total);
  buf.set(data);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(total - 4, len * 8);
  view.setUint32(total - 8, Math.floor((len * 8) / 2 ** 32));
  const h = new Uint32Array(IV);
  const m = new Uint32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) m[i] = view.getUint32(off + i * 4);
    block(h, m);
  }
  return wordsToBytes(h);
}

function wordsToBytes(h: Uint32Array): Uint8Array {
  const out = new Uint8Array(32);
  const v = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) v.setUint32(i * 4, h[i]);
  return out;
}

/** Estado do SHA-256 depois de absorver um bloco de 64 bytes (chave XOR pad). */
function padState(key: Uint8Array, pad: number): Uint32Array {
  const h = new Uint32Array(IV);
  const m = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    let w = 0;
    for (let j = 0; j < 4; j++) w = (w << 8) | ((key[i * 4 + j] ?? 0) ^ pad);
    m[i] = w;
  }
  block(h, m);
  return h;
}

/** HMAC de uma mensagem de 32 bytes, reaproveitando os estados ipad/opad. */
function hmac32(inner: Uint32Array, outer: Uint32Array, msg: Uint32Array): Uint32Array {
  const m = new Uint32Array(16);
  m.set(msg);
  m[8] = 0x80000000;
  m[15] = (64 + 32) * 8;
  const h1 = new Uint32Array(inner);
  block(h1, m);
  m.set(h1);
  const h2 = new Uint32Array(outer);
  block(h2, m);
  return h2;
}

export function pbkdf2Sha256(password: Uint8Array, salt: Uint8Array, iterations: number): Uint8Array {
  let key = password;
  if (key.length > 64) key = sha256(key);
  const inner = padState(key, 0x36);
  const outer = padState(key, 0x5c);

  // U1 = HMAC(senha, sal || INT(1)) — mensagem de tamanho livre.
  const first = new Uint8Array(64 + salt.length + 4);
  for (let i = 0; i < 64; i++) first[i] = (key[i] ?? 0) ^ 0x36;
  first.set(salt, 64);
  first[first.length - 1] = 1;
  const ih = sha256(first);
  const second = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) second[i] = (key[i] ?? 0) ^ 0x5c;
  second.set(ih, 64);
  const u1 = sha256(second);

  const v = new DataView(u1.buffer);
  let u = new Uint32Array(8);
  for (let i = 0; i < 8; i++) u[i] = v.getUint32(i * 4);
  const t = new Uint32Array(u);
  for (let n = 1; n < iterations; n++) {
    u = hmac32(inner, outer, u);
    for (let i = 0; i < 8; i++) t[i] ^= u[i];
  }
  return wordsToBytes(t);
}
