// Generate Android adaptive icon resources from logo
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, 'logo_original.png');
const ANDROID_RES = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// Android icon sizes (mipmap-XXX)
const sizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground sizes for adaptive icon (108dp base, with padding)
const foregroundSizes = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generate() {
  for (const { folder, size } of sizes) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    // Standard icon
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // Round icon
    const roundBuf = await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    // Create circular mask
    const circle = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    );

    await sharp(roundBuf)
      .composite([{ input: circle, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log(`✅ ${folder}: ${size}x${size}`);
  }

  // Generate adaptive icon foreground
  for (const { folder, size } of foregroundSizes) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    // Foreground: logo centered with padding (72% of total area)
    const logoSize = Math.round(size * 0.6);
    const padding = Math.round((size - logoSize) / 2);

    await sharp(SOURCE)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padding,
        bottom: size - logoSize - padding,
        left: padding,
        right: size - logoSize - padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`✅ ${folder}: foreground ${size}x${size}`);
  }

  // Also copy to web (public folder for PWA)
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, 'public', 'logo512.png'));

  await sharp(SOURCE)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, 'public', 'logo192.png'));

  console.log('✅ Web icons generated');
  console.log('🎉 All icons generated!');
}

generate().catch(console.error);
