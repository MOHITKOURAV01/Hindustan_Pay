/**
 * Generates app icon and splash PNGs (vector-style "H" + text).
 * Run: node assets/images/generate-assets.js
 */
const path = require("path");
const Jimp = require("jimp");

function fill(img, size, color) {
  const c = Jimp.intToRGBA(color);
  img.scan(0, 0, size, size, function (x, y, idx) {
    this.bitmap.data[idx] = c.r;
    this.bitmap.data[idx + 1] = c.g;
    this.bitmap.data[idx + 2] = c.b;
    this.bitmap.data[idx + 3] = c.a;
  });
}

function strokeInsetBorder(img, size, color) {
  const b = Math.round(size * 0.04);
  for (let y = b; y < size - b; y++) {
    img.setPixelColor(color, b, y);
    img.setPixelColor(color, size - b - 1, y);
  }
  for (let x = b; x < size - b; x++) {
    img.setPixelColor(color, x, b);
    img.setPixelColor(color, x, size - b - 1);
  }
}

function drawH(img, size) {
  const bg = Jimp.rgbaToInt(13, 13, 13, 255); // #0D0D0D
  const saffron = Jimp.rgbaToInt(255, 107, 0, 255); // #FF6B00
  const subtle = Jimp.rgbaToInt(255, 107, 0, 90);
  fill(img, size, bg);

  const m = Math.round(size * 0.2);
  const t = Math.round(size * 0.12);
  const top = m;
  const bot = size - m;
  const left = m;
  const right = size - m;
  const midY = Math.round(size * 0.52);

  // left vertical
  for (let y = top; y < bot; y++) {
    for (let x = left; x < left + t; x++) img.setPixelColor(saffron, x, y);
  }
  // right vertical
  for (let y = top; y < bot; y++) {
    for (let x = right - t; x < right; x++) img.setPixelColor(saffron, x, y);
  }
  // center bar
  for (let y = midY - Math.round(t * 0.5); y < midY + Math.round(t * 0.5); y++) {
    for (let x = left; x < right; x++) img.setPixelColor(saffron, x, y);
  }

  strokeInsetBorder(img, size, subtle);
}

async function main() {
  const outDir = __dirname;
  const icon = new Jimp(1024, 1024);
  drawH(icon, 1024);
  await icon.writeAsync(path.join(outDir, "icon.png"));

  const adaptive = new Jimp(1024, 1024);
  drawH(adaptive, 1024);
  await adaptive.writeAsync(path.join(outDir, "adaptive-icon.png"));

  const splash = new Jimp(2048, 2048);
  const sbg = Jimp.rgbaToInt(13, 13, 13, 255); // #0D0D0D
  fill(splash, 2048, sbg);

  const saffron = Jimp.rgbaToInt(255, 107, 0, 255); // #FF6B00

  // Mark / monogram
  const mark = new Jimp(380, 380);
  drawH(mark, 380);
  splash.composite(mark, Math.round((2048 - 380) / 2), 560);

  const titleFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const subtitleFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const title = "Hindustan Pay";
  const subtitle = "Apna paisa, apna hisaab";

  const titleY = 1030;
  splash.print(
    titleFont,
    0,
    titleY,
    { text: title, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
    2048,
    80,
  );
  splash.print(
    subtitleFont,
    0,
    titleY + 80,
    { text: subtitle, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
    2048,
    50,
  );

  // small accent underline
  const barW = 620;
  const barH = 8;
  const barX = Math.round((2048 - barW) / 2);
  const barY = titleY - 26;
  for (let y = barY; y < barY + barH; y++) {
    for (let x = barX; x < barX + barW; x++) splash.setPixelColor(saffron, x, y);
  }
  await splash.writeAsync(path.join(outDir, "splash.png"));
  console.log("Wrote icon.png, adaptive-icon.png, splash.png to assets/images/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
