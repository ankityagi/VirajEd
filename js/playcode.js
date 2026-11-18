/* Play codes: short codes a kid gets for spending coins, typed into BrainPlay for play time.

   This file is self-contained so the same copy can go into Vihaan's site and BrainPlay.

   A code is 6 characters from the Crockford base32 alphabet (0-9 and A-Z without I, L, O, U),
   shown as two groups of three ("K7Q-2MX"). Its 30 bits are:
     kid      2 bits   0 = p1 (Viraj), 1 = p2 (Vihaan), 2 = p3, 3 = p4
     minutes  4 bits   index i, minutes = 5 * (i + 1), so 5 to 80
     nonce    8 bits   random, so two codes for the same minutes on one day differ
     sig     16 bits   first 16 bits of HMAC-SHA256(KEY, "bp1|kid|i|nonce|YYYY-MM-DD")
   The date is not in the code: the checker signs with its own local date, so a code only
   checks out on the day it was made. Accepting each code once is up to the checker
   (BrainPlay keeps a list of codes already used).

   The key is in public page code, so someone who reads the source could make codes.
   That is fine for a kids' reward; a small server could hold the key later. */
window.PlayCode = (function () {
  const KEY = '03cb62ac1d9345cf6c9845cf24391f31';
  const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const KIDS = ['p1', 'p2', 'p3', 'p4'];

  /* ---- SHA-256 and HMAC (plain JS, so it works without a secure context) ---- */
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(bytes) {
    const len = bytes.length, bitLen = len * 8;
    const n = ((len + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
    m.set(bytes); m[len] = 0x80;
    const dv = new DataView(m.buffer);
    dv.setUint32(n - 8, Math.floor(bitLen / 4294967296)); dv.setUint32(n - 4, bitLen >>> 0);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const W = new Uint32Array(64);
    const rotr = (x, r) => (x >>> r) | (x << (32 - r));
    for (let o = 0; o < n; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    const out = new Uint8Array(32), ov = new DataView(out.buffer);
    H.forEach((v, i) => ov.setUint32(i * 4, v));
    return out;
  }
  const utf8 = s => new TextEncoder().encode(s);
  function hmac(key, msg) {
    let k = utf8(key); if (k.length > 64) k = sha256(k);
    const ip = new Uint8Array(64), op = new Uint8Array(64);
    for (let i = 0; i < 64; i++) { ip[i] = (k[i] || 0) ^ 0x36; op[i] = (k[i] || 0) ^ 0x5c; }
    const m = utf8(msg), inner = new Uint8Array(64 + m.length); inner.set(ip); inner.set(m, 64);
    const ih = sha256(inner), outer = new Uint8Array(96); outer.set(op); outer.set(ih, 64);
    return sha256(outer);
  }

  /* ---- codes ---- */
  // local calendar day, e.g. "2026-11-18"
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const sig = (kid, mi, nonce, day) => { const h = hmac(KEY, `bp1|${kid}|${mi}|${nonce}|${day}`); return (h[0] << 8) | h[1]; };
  const MINUTES = Array.from({ length: 16 }, (_, i) => 5 * (i + 1));

  // make(player 'p1', minutes 5..80 in steps of 5, nonce 0..255, day?) -> "K7Q2MX"
  function make(player, minutes, nonce, day = today()) {
    const kid = KIDS.indexOf(player), mi = minutes / 5 - 1;
    if (kid < 0 || !Number.isInteger(mi) || mi < 0 || mi > 15) throw new Error('bad play code input');
    nonce &= 255;
    const n = ((kid << 28) | (mi << 24) | (nonce << 16) | sig(kid, mi, nonce, day)) >>> 0;
    let s = '';
    for (let i = 5; i >= 0; i--) s += ABC[(n >>> (i * 5)) & 31];
    return s;
  }
  // tidy what a kid typed: drop spaces and dashes, read O as 0 and I or L as 1
  const clean = s => String(s).toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  // check(text, day?) -> { ok: true, player, minutes, code } or { ok: false, reason }
  function check(text, day = today()) {
    const c = clean(text);
    if (c.length !== 6) return { ok: false, reason: 'A code has 6 letters and numbers.' };
    let n = 0;
    for (const ch of c) { const v = ABC.indexOf(ch); if (v < 0) return { ok: false, reason: 'That code has a letter codes never use.' }; n = n * 32 + v; }
    const kid = n >>> 28, mi = (n >>> 24) & 15, nonce = (n >>> 16) & 255, s = n & 0xffff;
    if (sig(kid, mi, nonce, day) !== s) return { ok: false, reason: "That code isn't right, or it was made on another day." };
    return { ok: true, player: KIDS[kid], minutes: MINUTES[mi], code: c };
  }
  const pretty = code => code.slice(0, 3) + '-' + code.slice(3);

  return { make, check, clean, pretty, today, MINUTES, _sha256: sha256, _hmac: hmac };
})();
