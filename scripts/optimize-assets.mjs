import sharp from "sharp";
import { readFile, writeFile, rename } from "node:fs/promises";

const logoInput = "images/digital-world-logo.png";
const logoOutput = "images/digital-world-logo.webp";
await sharp(logoInput)
  .resize({ width: 900, withoutEnlargement: true })
  .webp({ quality: 80, effort: 6, smartSubsample: true })
  .toFile(logoOutput);

for (const file of ["images/2(1).webp", "images/3(1).webp", "images/4(1).webp"]) {
  const temp = file.replace(/\.webp$/i, ".optimized.webp");
  await sharp(file)
    .resize({ width: 1000, height: 1250, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76, effort: 6, smartSubsample: true })
    .toFile(temp);
  await rename(temp, file);
}

let html = await readFile("index.html", "utf8");
html = html.replaceAll('src="images/digital-world-logo.png"', 'src="images/digital-world-logo.webp"');
html = html.replaceAll('href="images/digital-world-logo.png"', 'href="images/digital-world-logo.webp"');
html = html.replace(
  '<img src="images/digital-world-logo.webp" alt="Digital World logo" width="900" height="525" fetchpriority="high" decoding="async">',
  '<img src="images/digital-world-logo.webp" alt="Digital World logo" width="900" height="525" loading="eager" fetchpriority="high" decoding="async">'
);
await writeFile("index.html", html);
console.log("Optimized logo and portfolio WebP assets; updated visible logo references.");
