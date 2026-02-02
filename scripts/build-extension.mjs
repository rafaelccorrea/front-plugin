#!/usr/bin/env node
/**
 * Prepara a extensão para distribuição (valida e garante que está pronta).
 * A pasta extension/ já contém os arquivos estáticos; este script apenas
 * confere que tudo está em ordem após create:extension-icons e validate:extension.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_DIR = path.resolve(__dirname, "..", "extension");

function main() {
  if (!fs.existsSync(EXT_DIR)) {
    console.error("Pasta da extensão não encontrada:", EXT_DIR);
    process.exit(1);
  }

  const manifestPath = path.join(EXT_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("manifest.json não encontrado na extensão.");
    process.exit(1);
  }

  console.log("Extensão pronta em:", EXT_DIR);
  console.log("Para carregar no Chrome: chrome://extensions -> Carregar sem compactação -> selecione a pasta extension");
}

main();
