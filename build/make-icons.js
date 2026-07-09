/* Genera los iconos PNG de la PWA (sin librerías externas, solo zlib de Node).
   Dibuja un hexágono estilo NEXUS con degradado sobre fondo oscuro. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ---------- CRC32 para los chunks PNG ----------
const CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- geometría ----------
function hexPts(cx, cy, R) {
  const p = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 90); p.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
  return p;
}
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function lerp(a, b, t) { return a + (b - a) * t; }

function render(S, maskable) {
  const buf = Buffer.alloc(S * S * 4);
  const cx = S / 2, cy = S / 2;
  const outerR = (maskable ? 0.34 : 0.42) * S;
  const holeR = outerR * 0.62;
  const coreR = outerR * 0.30;
  const outer = hexPts(cx, cy, outerR);
  const hole = hexPts(cx, cy, holeR);
  const core = hexPts(cx, cy, coreR);
  // cian (0,229,255) -> violeta (124,92,255)
  const C1 = [0, 229, 255], C2 = [124, 92, 255];

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // fondo oscuro con brillo radial
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / (S * 0.5);
      const glow = Math.max(0, 1 - dist);
      let br = Math.min(255, 6 + glow * glow * 46);
      let bg = Math.min(255, 8 + glow * glow * 34);
      let bb = Math.min(255, 20 + glow * glow * 110);
      // cobertura del hexágono con supersampling 3x3
      let cov = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const px = x + (sx + 0.5) / 3, py = y + (sy + 0.5) / 3;
        if ((inPoly(px, py, outer) && !inPoly(px, py, hole)) || inPoly(px, py, core)) cov++;
      }
      cov /= 9;
      const t = x / S;
      const hr = lerp(C1[0], C2[0], t), hg = lerp(C1[1], C2[1], t), hb = lerp(C1[2], C2[2], t);
      buf[i] = Math.round(lerp(br, hr, cov));
      buf[i + 1] = Math.round(lerp(bg, hg, cov));
      buf[i + 2] = Math.round(lerp(bb, hb, cov));
      buf[i + 3] = 255;
    }
  }
  return buf;
}

const outDir = path.resolve(__dirname, "..", "assets", "icons");
fs.mkdirSync(outDir, { recursive: true });
const targets = [
  { file: "icon-192.png", size: 192, mask: false },
  { file: "icon-512.png", size: 512, mask: false },
  { file: "icon-maskable-512.png", size: 512, mask: true }
];
targets.forEach((t) => {
  const data = png(t.size, t.size, render(t.size, t.mask));
  fs.writeFileSync(path.join(outDir, t.file), data);
  console.log("✔ " + t.file + " (" + t.size + "x" + t.size + ", " + data.length + " bytes)");
});
console.log("Iconos generados en assets/icons/");
