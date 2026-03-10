import fs from 'fs';
import { execSync } from 'child_process';

// We will use a simple base64 1x1 png if we can't generate one, but let's try to use sharp via npx
try {
  console.log("Installing sharp...");
  execSync('npm install sharp --no-save');
  const sharp = await import('sharp');
  
  const svgBuffer = fs.readFileSync('./public/icon.svg');
  
  await sharp.default(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192x192.png');
    
  await sharp.default(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512x512.png');
    
  console.log("Icons generated successfully!");
} catch (e) {
  console.error("Failed to generate icons:", e);
}
