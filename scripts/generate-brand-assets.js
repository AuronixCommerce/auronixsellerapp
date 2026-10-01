const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 1024;
const OUT = path.join(__dirname, '..', 'assets', 'brand');
fs.mkdirSync(OUT, { recursive: true });

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = Array.from({ length: 256 }, (_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      return c >>> 0;
    });
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePng(file, width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

function canvas(transparent = false) {
  const b = Buffer.alloc(SIZE * SIZE * 4);
  if (!transparent) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = (y * SIZE + x) * 4;
        const t = (x * 0.55 + y * 0.45) / SIZE;
        b[i] = Math.round(6 + 18 * t);
        b[i + 1] = Math.round(15 + 82 * t);
        b[i + 2] = Math.round(30 + 160 * t);
        b[i + 3] = 255;
      }
    }
  }
  return b;
}

function blendPixel(buf, x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  const a = Math.max(0, Math.min(1, alpha * (color[3] ?? 255) / 255));
  const dstA = buf[i + 3] / 255;
  const outA = a + dstA * (1 - a);
  if (outA <= 0) return;
  for (let k = 0; k < 3; k++) {
    buf[i + k] = Math.round((color[k] * a + buf[i + k] * dstA * (1 - a)) / outA);
  }
  buf[i + 3] = Math.round(outA * 255);
}

function disc(buf, cx, cy, radius, color, alpha = 1) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(SIZE - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(SIZE - 1, Math.ceil(cy + radius));
  const r2 = radius * radius;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        const edge = Math.min(1, Math.max(0, (r2 - d2) / (radius * 1.8)));
        blendPixel(buf, x, y, color, alpha * Math.min(1, edge + 0.2));
      }
    }
  }
}

function line(buf, x1, y1, x2, y2, width, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const radius = width / 2;
  for (let s = 0; s <= steps; s += 2) {
    const t = s / steps;
    disc(buf, x1 + dx * t, y1 + dy * t, radius, color, 1);
  }
}

function glow(buf, cx, cy, radius, color, strength = 0.4) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(SIZE - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(SIZE - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d <= 1) blendPixel(buf, x, y, color, strength * Math.pow(1 - d, 2.3));
    }
  }
}

function mark(buf, dark = true, scale = 1, ox = 0, oy = 0) {
  const p = (v) => v * scale;
  const fg = dark ? [249, 252, 255, 255] : [9, 24, 42, 255];
  const accent = dark ? [105, 195, 255, 255] : [11, 127, 229, 255];
  line(buf, ox + p(315), oy + p(760), ox + p(500), oy + p(290), p(92), fg);
  line(buf, ox + p(500), oy + p(290), ox + p(720), oy + p(760), p(92), fg);
  line(buf, ox + p(405), oy + p(590), ox + p(625), oy + p(590), p(70), accent);
  disc(buf, ox + p(500), oy + p(294), p(40), fg, 1);
}

function makeIcon() {
  const b = canvas(false);
  glow(b, 760, 220, 400, [90, 210, 255, 255], 0.42);
  glow(b, 180, 820, 360, [35, 95, 245, 255], 0.28);
  for (let y = 80; y < 390; y++) {
    const a = 0.035 * (1 - (y - 80) / 310);
    for (let x = 95; x < 930; x++) blendPixel(b, x, y, [255, 255, 255, 255], a);
  }
  mark(b, true);
  return b;
}

function makeSplash(dark) {
  const b = canvas(true);
  glow(b, 512, 510, 420, dark ? [30, 160, 250, 255] : [20, 110, 220, 255], dark ? 0.28 : 0.16);
  mark(b, dark);
  return b;
}

function makeAdaptive() {
  const b = canvas(true);
  glow(b, 512, 500, 360, [35, 150, 255, 255], 0.16);
  mark(b, true, 0.82, 90, 90);
  return b;
}

writePng(path.join(OUT, 'icon.png'), SIZE, SIZE, makeIcon());
writePng(path.join(OUT, 'adaptive-foreground.png'), SIZE, SIZE, makeAdaptive());
writePng(path.join(OUT, 'splash-dark.png'), SIZE, SIZE, makeSplash(true));
writePng(path.join(OUT, 'splash-light.png'), SIZE, SIZE, makeSplash(false));
console.log('Generated Auronix brand assets in assets/brand');
