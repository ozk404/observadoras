import sharp from "sharp";

// Bound concurrent decodes; derivatives stay in memory and are never public files.
let active = 0;
const waiting: Array<() => void> = [];
async function enter() {
  if (active < 2) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}
function leave() {
  const next = waiting.shift();
  if (next) next();
  else active--;
}
export async function evidenceThumbnail(content: Buffer) {
  await enter();
  try {
    return await sharp(content, {
      limitInputPixels: 20_000_000,
      failOn: "warning",
    })
      .resize({
        width: 256,
        height: 192,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 72 })
      .toBuffer();
  } finally {
    leave();
  }
}
