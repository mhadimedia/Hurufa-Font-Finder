import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceIcon = path.join(__dirname, '../src/assets/hurufa-icon.png');
const iconsDir = path.join(__dirname, '../src/assets/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate PNG icons in different sizes
async function generatePngIcons() {
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
  
  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
  }
  
  // Copy the largest size as the default icon
  fs.copyFileSync(
    path.join(iconsDir, 'icon-1024.png'),
    path.join(iconsDir, 'icon.png')
  );
}

// Generate ICO file for Windows
async function generateIcoFile() {
  // Use the 256x256 PNG for ICO
  await sharp(path.join(iconsDir, 'icon-256.png'))
    .toFile(path.join(iconsDir, 'icon.ico'));
}

// Generate ICNS file for macOS
async function generateIcnsFile() {
  // Use the 1024x1024 PNG for ICNS
  await sharp(path.join(iconsDir, 'icon-1024.png'))
    .toFile(path.join(iconsDir, 'icon.icns'));
}

async function main() {
  try {
    console.log('Generating PNG icons...');
    await generatePngIcons();
    
    console.log('Generating ICO file...');
    await generateIcoFile();
    
    console.log('Generating ICNS file...');
    await generateIcnsFile();
    
    console.log('Icon generation complete!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main(); 