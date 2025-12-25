import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple solid color icon
// Using a dark background with white "L" text for Learning
async function createIcons() {
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#000000"/>
      <text x="256" y="380" font-family="Arial, sans-serif" font-size="320" font-weight="bold" fill="#ffffff" text-anchor="middle">L</text>
    </svg>
  `;

  // Create 512x512 icon
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));

  // Create 192x192 icon (resized from 512)
  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));

  console.log("✓ Created properly sized icons (192x192 and 512x512)");
}

createIcons().catch((error) => {
  console.error("Error creating icons:", error);
  process.exit(1);
});
