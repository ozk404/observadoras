import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { normalizeEvidence, readEvidenceForm } from "../src/server/evidence";
import { sourceUrlField } from "../src/server/reports";
import { imageFixture } from "./image-fixture";
test("evidence decoding preserves dimensions and removes EXIF and original filename", async () => {
  const jpeg = await sharp({
    create: { width: 80, height: 50, channels: 3, background: "#ffffff" },
  })
    .withExif({ IFD0: { Artist: "fictional-only-fixture" } })
    .jpeg()
    .toBuffer();
  const result = await normalizeEvidence(
    new File([new Uint8Array(jpeg)], "private-name.jpg", {
      type: "image/jpeg",
    }),
  );
  const metadata = await sharp(result.content).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.width, 80);
  assert.equal(metadata.height, 50);
  assert.equal(
    result.sha256,
    createHash("sha256").update(result.content).digest("hex"),
  );
});
test("missing, oversized, forged formats and corrupt images are rejected", async () => {
  for (const file of [
    new File([], "empty.png", { type: "image/png" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    }),
    new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], "image.png", {
      type: "image/png",
    }),
    new File(["not a picture"], "image.svg", { type: "image/svg+xml" }),
    new File(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      "truncated.png",
      { type: "image/png" },
    ),
  ])
    await assert.rejects(normalizeEvidence(file));
  const fixture = await imageFixture();
  await assert.rejects(
    normalizeEvidence(
      new File([new Uint8Array(fixture.buffer)], "forged.jpg", {
        type: "image/jpeg",
      }),
    ),
  );
});
test("image dimension limit is enforced before decoding excessive pixels", async () => {
  const large = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  await assert.rejects(
    normalizeEvidence(
      new File([new Uint8Array(large)], "huge.png", { type: "image/png" }),
    ),
  );
});
test("source URL is optional and permits only http/https without embedded credentials", () => {
  for (const value of [
    "",
    "https://example.test/post?id=1",
    "http://example.test",
  ])
    assert.equal(sourceUrlField.safeParse(value).success, true);
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///tmp/private",
    "https://user:secret@example.test",
    "example.test",
    "x".repeat(2049),
  ])
    assert.equal(sourceUrlField.safeParse(value).success, false);
});
test("multipart reads are bounded and duplicate or unexpected fields are rejected", async () => {
  await assert.rejects(
    readEvidenceForm(
      new Request("https://example.test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    ),
  );
  await assert.rejects(
    readEvidenceForm(
      new Request("https://example.test", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=a" },
        body: new Uint8Array(6 * 1024 * 1024 + 1),
      }),
    ),
  );
  const form = new FormData();
  form.append("description", "first");
  form.append("description", "second");
  await assert.rejects(
    readEvidenceForm(
      new Request("https://example.test", { method: "POST", body: form }),
    ),
  );
});
