const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const { decode } = require('@msgpack/msgpack');

const RPACK_MAP_BASE64 = 'xA0eC70rP1X8RW71ZlNPGuC7MJSGumu/QVBvm+/etxBhFyDfMomonW2ryZAADF2v0sFW5RZkkYJldJfKI9ZS0f+0oOgvilg4WmAZlknb18g7PkNLpWNHqmopkvQVz2I0eNMdPOIFjipXDhvNTC3yQCwleUgPsnq1p2w35px7VH7+h9yaAuQzouuxLgPdmaaw59WIGIN89r7hXJ/DIUYfCE7QdhJf7v2PROqjXosoCTWeacwKx4UHrUrzd+ln1NqEgJO2TXP6JyZ/BMb78XI5UcI2qWis+O3FucvOdaQ9gdlCcByVEbzYjJj5WaET9xR9s+xxwOON8AGuWzEGJCI6uCz3hIvJZfu2n66zAy0BaXQf5KPs7lw0IZNKD2riYgKeIpz9PPxxx8atWWcFcG2KRBL6JIZfr9F6R87+UGPdUQZvGOBSqAmdVnNMuFNsw6AOGc8+DX4HMmhG6kj5mS6rpEkgXlU1OAy807FYFnkoChrh8s3EOduiumBydn2V73/IwN43lL+1FIGSJUWs5/Vmpys2WsET40s66I2DG3wnsJpC64eq3FSOeCbSVynUt/gvj4l18EF3wh7/2BUR5QSXF/Mx0JsA18q0Tyo72bJr2l2hPzBhvZE9Tubfvk2CjB0jEJhk9IUze5BDu6mI8dalHPbMbrlbC5bt1enFywimgEA=';
const m = Buffer.from(RPACK_MAP_BASE64, 'base64');
const dm = m.slice(256, 512);

// Step 1: RPack decode
const filePath = process.argv[2] || '참고/RisuAI_Agent_V4/🧋K-Ver V4.1.1 Preset 2_preset.risup';
const f = fs.readFileSync(filePath);
const r = Buffer.from(new Uint8Array(f.length));
for (let i = 0; i < f.length; i++) r[i] = dm[f[i]];

// Step 2: gzip decompress
const g = zlib.gunzipSync(r);

// Step 3: msgpack decode (outer)
const obj = decode(g);
const presetBuf = Buffer.from(obj.preset);
console.log('[1] Outer decoded. Inner preset size:', presetBuf.length);

// Step 4: AES-GCM decrypt (matching RisuAI decryptBuffer from util.ts)
// Key: SHA-256 hash of 'risupreset'
// IV: 12-byte zeros
const keyHash = crypto.createHash('sha256').update('risupreset').digest();
const iv = Buffer.alloc(12);

const authTagLength = 16;
const encrypted = presetBuf.slice(0, presetBuf.length - authTagLength);
const authTag = presetBuf.slice(presetBuf.length - authTagLength);

const decipher = crypto.createDecipheriv('aes-256-gcm', keyHash, iv);
decipher.setAuthTag(authTag);
const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
console.log('[2] AES-GCM decrypted. Size:', decrypted.length);

// Step 5: msgpack decode (inner)
const inner = decode(decrypted);
const json = JSON.stringify(inner, null, 2);
const outPath = filePath.replace('.risup', '_DECODED.json');
fs.writeFileSync(outPath, json, 'utf-8');
console.log('[3] Saved:', outPath);

// Keyword search
console.log('\n========== KEYWORD SEARCH ==========');
const kws = ['Alpha', 'Dragon', 'ESFJ', 'morality', 'CORE TASK', 'executor', 'actor',
             'systemPrompt', 'mainPrompt', 'jailbreak', 'globalNote', 'You are', 'green dragon'];
kws.forEach(k => {
  const idx = json.toLowerCase().indexOf(k.toLowerCase());
  if (idx >= 0) {
    const start = Math.max(0, idx - 40);
    const end = Math.min(json.length, idx + k.length + 80);
    const ctx = json.substring(start, end).replace(/\n/g, '\\n');
    console.log('  [FOUND] "' + k + '" at offset ' + idx);
    console.log('    context: ...' + ctx + '...');
  } else {
    console.log('  [NOT FOUND] "' + k + '"');
  }
});

// Top-level keys summary
console.log('\n========== TOP LEVEL KEYS ==========');
for (const [k, v] of Object.entries(inner)) {
  const t = Array.isArray(v) ? ('array[' + v.length + ']') : typeof v;
  let preview = '';
  if (typeof v === 'string') preview = v.substring(0, 100).replace(/\n/g, '\\n');
  console.log('  ' + k + ': ' + t + (preview ? (' = "' + preview + '"') : ''));
}

console.log('\nDone!');
