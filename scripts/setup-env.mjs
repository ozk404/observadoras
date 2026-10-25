import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
const password = randomBytes(24).toString("hex");
try {
  await writeFile(
    ".env",
    `POSTGRES_USER=observadoras\nPOSTGRES_DB=observadoras\nPOSTGRES_PASSWORD=${password}\nDATABASE_URL=postgresql://observadoras:${password}@db:5432/observadoras\nAUTH_SECRET=${randomBytes(48).toString("hex")}\nAPP_ORIGIN=http://localhost:3000\nCOOKIE_SECURE=false\nTRUST_PROXY=false\nOPENAI_API_KEY=\nOPENAI_MODEL=\nAI_DATA_MODE=synthetic\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Created .env with random local secrets. Existing files are never replaced.",
  );
} catch (error) {
  if (error.code === "EEXIST")
    console.log(".env already exists; left unchanged.");
  else throw error;
}
