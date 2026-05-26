const fs = require('fs');

// RPack Polyfill Map from index.html
const RPACK_MAP_BASE64 = "xA0eC70rP1X8RW71ZlNPGuC7MJSGumu/QVBvm+/etxBhFyDfMomonW2ryZAADF2v0sFW5RZkkYJldJfKI9ZS0f+0oOgvilg4WmAZlknb18g7PkNLpWNHqmopkvQVz2I0eNMdPOIFjipXDhvNTC3yQCwleUgPsnq1p2w35px7VH7+h9yaAuQzouuxLgPdmaaw59WIGIN89r7hXJ/DIUYfCE7QdhJf7v2PROqjXosoCTWeacwKx4UHrUrzd+ln1NqEgJO2TXP6JyZ/BMb78XI5UcI2qWis+O3FucvOdaQ9gdlCcByVEbzYjJj5WaET9xR9s+xxwOON8AGuWzEGJCI6uCz3hIvJZfu2n66zAy0BaXQf5KPs7lw0IZNKD2riYgKeIpz9PPxxx8atWWcFcG2KRBL6JIZfr9F6R87+UGPdUQZvGOBSqAmdVnNMuFNsw6AOGc8+DX4HMmhG6kj5mS6rpEkgXlU1OAy807FYFnkoChrh8s3EOduiumBydn2V73/IwN43lL+1FIGSJUWs5/Vmpys2WsET40s66I2DG3wnsJpC64eq3FSOeCbSVynUt/gvj4l18EF3wh7/2BUR5QSXF/Mx0JsA18q0Tyo72bJr2l2hPzBhvZE9Tubfvk2CjB0jEJhk9IUze5BDu6mI8dalHPbMbrlbC5bt1enFywimgEA=";

function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

const mapData = base64ToUint8Array(RPACK_MAP_BASE64);
const decodeMap = mapData.slice(256, 512);

function decodeRPack(data) {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = decodeMap[data[i]];
    }
    return result;
}

// Decode the file
const inputPath = process.argv[2];
const outputPath = inputPath + '.js';

console.log(`Decoding ${inputPath} ...`);
const fileData = fs.readFileSync(inputPath);

// risum files might be compressed or just mapped. Let's try matching the decodeMap.
try {
    const decoded = decodeRPack(new Uint8Array(fileData));
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(decoded);
    
    // Check if it looks like JS
    if (text.includes('function') || text.includes('const ') || text.includes('{')) {
        fs.writeFileSync(outputPath, text);
        console.log(`Successfully decoded to ${outputPath}`);
    } else {
        // Maybe it's not text, just raw bytes or gzip? Let's save the raw decoded bytes anyway.
        fs.writeFileSync(outputPath + '.bin', decoded);
        console.log(`Decoded content doesn't look like plain text. Saved as ${outputPath}.bin`);
    }
} catch (e) {
    console.error("Error decoding:", e);
}
