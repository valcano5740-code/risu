const fs = require('fs');
const zlib = require('zlib');
const { decode } = require('@msgpack/msgpack');

// RPack decode map
const RPACK_MAP_BASE64 = "xA0eC70rP1X8RW71ZlNPGuC7MJSGumu/QVBvm+/etxBhFyDfMomonW2ryZAADF2v0sFW5RZkkYJldJfKI9ZS0f+0oOgvilg4WmAZlknb18g7PkNLpWNHqmopkvQVz2I0eNMdPOIFjipXDhvNTC3yQCwleUgPsnq1p2w35px7VH7+h9yaAuQzouuxLgPdmaaw59WIGIN89r7hXJ/DIUYfCE7QdhJf7v2PROqjXosoCTWeacwKx4UHrUrzd+ln1NqEgJO2TXP6JyZ/BMb78XI5UcI2qWis+O3FucvOdaQ9gdlCcByVEbzYjJj5WaET9xR9s+xxwOON8AGuWzEGJCI6uCz3hIvJZfu2n66zAy0BaXQf5KPs7lw0IZNKD2riYgKeIpz9PPxxx8atWWcFcG2KRBL6JIZfr9F6R87+UGPdUQZvGOBSqAmdVnNMuFNsw6AOGc8+DX4HMmhG6kj5mS6rpEkgXlU1OAy807FYFnkoChrh8s3EOduiumBydn2V73/IwN43lL+1FIGSJUWs5/Vmpys2WsET40s66I2DG3wnsJpC64eq3FSOeCbSVynUt/gvj4l18EF3wh7/2BUR5QSXF/Mx0JsA18q0Tyo72bJr2l2hPzBhvZE9Tubfvk2CjB0jEJhk9IUze5BDu6mI8dalHPbMbrlbC5bt1enFywimgEA=";

const mapData = Buffer.from(RPACK_MAP_BASE64, 'base64');
const decodeMap = mapData.slice(256, 512);

function decodeRPack(data) {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = decodeMap[data[i]];
    }
    return result;
}

// Main
const inputPath = process.argv[2];
if (!inputPath) {
    console.error('Usage: node decode_risup.js <file.risup>');
    process.exit(1);
}

console.log(`[1] Reading: ${inputPath}`);
const fileData = fs.readFileSync(inputPath);
console.log(`  Size: ${fileData.length} bytes`);

console.log(`[2] RPack decoding...`);
const rpackDecoded = Buffer.from(decodeRPack(new Uint8Array(fileData)));

// Check if gzip compressed
let msgpackData = rpackDecoded;
if (rpackDecoded[0] === 0x1f && rpackDecoded[1] === 0x8b) {
    console.log(`[2.5] Detected gzip. Decompressing...`);
    msgpackData = zlib.gunzipSync(rpackDecoded);
}

console.log(`[3] MessagePack decoding...`);
let obj;
try {
    obj = decode(msgpackData);
} catch(e) {
    console.error('MessagePack decode failed:', e.message);
    // Try the inner 'preset' field if the outer wrapper has it
    process.exit(1);
}

// If the object has a 'preset' field that is a Buffer/Uint8Array, decode that too
if (obj && obj.preset && (obj.preset instanceof Uint8Array || Buffer.isBuffer(obj.preset))) {
    console.log(`[3.5] Found nested 'preset' binary. Decoding inner msgpack...`);
    let innerData = Buffer.from(obj.preset);
    // Check if inner is gzip
    if (innerData[0] === 0x1f && innerData[1] === 0x8b) {
        innerData = zlib.gunzipSync(innerData);
    }
    try {
        obj.preset = decode(innerData);
    } catch(e) {
        // Try as JSON
        try {
            obj.preset = JSON.parse(innerData.toString('utf-8'));
        } catch(e2) {
            console.log('  Could not decode inner preset');
        }
    }
}

// Save full JSON
const outputPath = inputPath.replace(/\.risup$/, '_FULL.json');
console.log(`[4] Saving to: ${outputPath}`);

// Custom replacer to handle Uint8Array
function replacer(key, value) {
    if (value instanceof Uint8Array || (value && value.type === 'Buffer')) {
        // Try to decode as UTF-8 text
        const buf = Buffer.isBuffer(value) ? value : Buffer.from(value.data || value);
        const text = buf.toString('utf-8');
        // If it looks like text, return as string
        if (text.length < 10000 && /^[\x20-\x7E\n\r\t\u00A0-\uFFFF]*$/.test(text)) {
            return text;
        }
        return `[Binary: ${buf.length} bytes]`;
    }
    return value;
}

fs.writeFileSync(outputPath, JSON.stringify(obj, replacer, 2), 'utf-8');

// Analysis
console.log('\n========== ANALYSIS ==========');
const fullText = JSON.stringify(obj, replacer);

// Keyword search
const keywords = ['Alpha', 'Dragon', 'Green', 'ESFJ', 'morality', 'territorially', 'CORE TASK', 'executor', 'actor', 'systemPrompt'];
console.log('\n[KEYWORD SEARCH]:');
keywords.forEach(kw => {
    const idx = fullText.indexOf(kw);
    if (idx >= 0) {
        const context = fullText.substring(Math.max(0, idx - 40), Math.min(fullText.length, idx + kw.length + 40));
        console.log(`  "${kw}": FOUND! Context: ...${context}...`);
    } else {
        console.log(`  "${kw}": not found`);
    }
});

// Show top-level keys
console.log('\n[TOP LEVEL KEYS]:');
Object.keys(obj).forEach(k => {
    const val = obj[k];
    const type = Array.isArray(val) ? `Array(${val.length})` : typeof val;
    const preview = typeof val === 'string' ? val.substring(0, 80) : '';
    console.log(`  ${k}: ${type} ${preview}`);
});

console.log('\nDone!');
