const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Distance to rounded rectangle
function sdRoundRect(px, py, rx, ry, rw, rh, rad) {
  const dx = Math.max(Math.abs(px - (rx + rw / 2)) - (rw / 2 - rad), 0);
  const dy = Math.max(Math.abs(py - (ry + rh / 2)) - (rh / 2 - rad), 0);
  return Math.sqrt(dx * dx + dy * dy) - rad;
}

function renderPosIcon(isMaskable) {
  return function(x, y, size) {
    const u = x / size;
    const v = y / size;

    if (isMaskable) {
      // Solid emerald gradient background edge-to-edge
      // Safe zone is central 80% (0.1 to 0.9)
    }

    // Check outer rounded squircle for non-maskable
    if (!isMaskable) {
      const cornerRadius = 0.22;
      const d = sdRoundRect(u, v, 0.02, 0.02, 0.96, 0.96, cornerRadius);
      if (d > 0.005) {
        return [0, 0, 0, 0]; // Transparent outside
      }
    }

    // Emerald gradient background
    // Top-left: #10b981 (16, 185, 129), Bottom-right: #047857 (4, 120, 87)
    const t = (u + v) / 2;
    let bgR = Math.round(16 * (1 - t) + 4 * t);
    let bgG = Math.round(185 * (1 - t) + 120 * t);
    let bgB = Math.round(129 * (1 - t) + 87 * t);

    // Inner highlight border for standard icon
    if (!isMaskable) {
      const borderD = sdRoundRect(u, v, 0.03, 0.03, 0.94, 0.94, 0.21);
      if (borderD > -0.015 && borderD <= 0) {
        bgR = Math.min(255, bgR + 35);
        bgG = Math.min(255, bgG + 35);
        bgB = Math.min(255, bgB + 35);
      }
    }

    // Scale POS terminal glyph into safe area
    // Center is (0.5, 0.53)
    const scale = isMaskable ? 0.65 : 0.72;
    const cx = 0.5;
    const cy = isMaskable ? 0.52 : 0.52;
    const gx = (u - cx) / scale;
    const gy = (v - cy) / scale;

    // --- POS Register Monitor Bezel ---
    // from gx: -0.32 to +0.32, gy: -0.32 to +0.08
    if (gx >= -0.34 && gx <= 0.34 && gy >= -0.30 && gy <= 0.08) {
      const dMonitor = sdRoundRect(gx, gy, -0.34, -0.30, 0.68, 0.38, 0.05);
      if (dMonitor <= 0) {
        // Inner screen (dark slate)
        const dScreen = sdRoundRect(gx, gy, -0.29, -0.25, 0.58, 0.28, 0.03);
        if (dScreen <= 0) {
          // Inside screen: Dark slate (#0f172a)
          let scrR = 15, scrG = 23, scrB = 42;

          // Header amount bar inside screen: gx: -0.24 to +0.05, gy: -0.21 to -0.14 (Emerald green)
          if (gx >= -0.25 && gx <= 0.05 && gy >= -0.21 && gy <= -0.14) {
            scrR = 16; scrG = 185; scrB = 129;
          }

          // Item line 1: gx: -0.25 to -0.05, gy: -0.10 to -0.07 (slate-500)
          if (gx >= -0.25 && gx <= -0.05 && gy >= -0.10 && gy <= -0.07) {
            scrR = 71; scrG = 85; scrB = 105;
          }
          // Item line 2: gx: -0.25 to +0.10, gy: -0.05 to -0.02
          if (gx >= -0.25 && gx <= 0.10 && gy >= -0.05 && gy <= -0.02) {
            scrR = 71; scrG = 85; scrB = 105;
          }
          // Item line 3: gx: -0.25 to +0.02, gy: 0.00 to 0.03
          if (gx >= -0.25 && gx <= 0.02 && gy >= 0.00 && gy <= 0.03) {
            scrR = 71; scrG = 85; scrB = 105;
          }

          // Checkmark circle in right screen: center (0.18, -0.08), radius 0.06
          const distCheckCircle = Math.sqrt((gx - 0.18)**2 + (gy - 0.08)**2);
          if (distCheckCircle <= 0.06) {
            scrR = 16; scrG = 185; scrB = 129;
          }

          return [scrR, scrG, scrB, 255];
        }
        // Bezel: White (#ffffff)
        return [255, 255, 255, 255];
      }
    }

    // --- Monitor Stand Neck ---
    // gx: -0.08 to +0.08, gy: 0.08 to 0.16
    if (gx >= -0.08 && gx <= 0.08 && gy >= 0.08 && gy <= 0.16) {
      return [226, 232, 240, 255]; // Slate 200
    }

    // --- Cash Drawer Base ---
    // gx: -0.40 to +0.40, gy: 0.16 to 0.36
    if (gx >= -0.40 && gx <= 0.40 && gy >= 0.16 && gy <= 0.36) {
      const dBase = sdRoundRect(gx, gy, -0.40, 0.16, 0.80, 0.20, 0.04);
      if (dBase <= 0) {
        // Drawer front inset line: gx: -0.35 to 0.35, gy: 0.21 to 0.28
        if (gx >= -0.35 && gx <= 0.35 && gy >= 0.21 && gy <= 0.28) {
          // Key lock / button in center: radius 0.025 at (0, 0.245)
          const distLock = Math.sqrt(gx**2 + (gy - 0.245)**2);
          if (distLock <= 0.022) {
            return [100, 116, 139, 255]; // Slate 500
          }
          return [226, 232, 240, 255]; // Drawer slot
        }
        return [248, 250, 252, 255]; // Base white
      }
    }

    // --- Receipt Paper Coming from Top ---
    // gx: 0.14 to 0.28, gy: -0.42 to -0.28
    if (gx >= 0.14 && gx <= 0.28 && gy >= -0.42 && gy <= -0.28) {
      // Receipt lines
      if (gy >= -0.38 && gy <= -0.36 && gx >= 0.17 && gx <= 0.25) {
        return [148, 163, 184, 255];
      }
      if (gy >= -0.34 && gy <= -0.32 && gx >= 0.17 && gx <= 0.23) {
        return [16, 185, 129, 255];
      }
      return [255, 255, 255, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

const pubDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

// 1. 192x192 standard icon
console.log('Generating pwa-192x192.png...');
const icon192 = createPng(192, 192, renderPosIcon(false));
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), icon192);

// 2. 512x512 standard icon
console.log('Generating pwa-512x512.png...');
const icon512 = createPng(512, 512, renderPosIcon(false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), icon512);

// 3. Apple touch icon 180x180
console.log('Generating apple-touch-icon.png...');
const appleIcon = createPng(180, 180, renderPosIcon(false));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), appleIcon);

// 4. 512x512 maskable icon (safe zone padding, solid background)
console.log('Generating pwa-maskable-512x512.png...');
const maskable512 = createPng(512, 512, renderPosIcon(true));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), maskable512);

console.log('All PWA icons generated successfully!');
