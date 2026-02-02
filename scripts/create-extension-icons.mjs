#!/usr/bin/env node
/**
 * Gera os ícones da extensão (16, 48, 128) a partir do favicon do projeto.
 * Se sharp estiver instalado, redimensiona; senão, copia o favicon para os três arquivos.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "client", "public", "chatlead-pro-favicon.png");
const OUT_DIR = path.join(ROOT, "extension", "icons");
const SIZES = [16, 48, 128];

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error("Arquivo fonte não encontrado:", SOURCE);
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    sharp = null;
  }

  if (sharp) {
    for (const size of SIZES) {
      const outPath = path.join(OUT_DIR, `icon-${size}.png`);
      await sharp(SOURCE).resize(size, size).png().toFile(outPath);
      console.log("Gerado:", outPath);
    }
  } else {
    const buffer = fs.readFileSync(SOURCE);
    for (const size of SIZES) {
      const outPath = path.join(OUT_DIR, `icon-${size}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log("Copiado (sem redimensionar):", outPath);
    }
    console.log("Dica: instale 'sharp' (yarn add -D sharp) para gerar ícones nos tamanhos corretos.");
  }

  console.log("Ícones da extensão criados com sucesso.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
