import sharp from "sharp";
export async function imageFixture() {
  return {
    name: "captura-ficticia.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 320, height: 180, channels: 3, background: "#f3eef4" },
    })
      .png()
      .toBuffer(),
  };
}
