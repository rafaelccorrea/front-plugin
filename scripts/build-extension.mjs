#!/usr/bin/env node
/**
 * Prepara a extensão para distribuição (valida e garante que está pronta).
 * Atualiza o manifest com um build_timestamp para que o Chrome carregue as
 * alterações mais recentes ao clicar em "Atualizar" na extensão.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_DIR = path.resolve(__dirname, "..", "extension");
const MANIFEST_PATH = path.join(EXT_DIR, "manifest.json");

function main() {
  if (!fs.existsSync(EXT_DIR)) {
    console.error("Pasta da extensão não encontrada:", EXT_DIR);
    process.exit(1);
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("manifest.json não encontrado na extensão.");
    process.exit(1);
  }

  // Atualiza o manifest com timestamp para forçar o Chrome a recarregar os arquivos
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  manifest.build_timestamp = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

  console.log("Extensão pronta em:", EXT_DIR);
  console.log("Build em:", manifest.build_timestamp);
  console.log("");
  console.log("No Chrome: chrome://extensions -> clique em Atualizar (ícone de recarregar) na extensão para carregar as últimas alterações.");
}

main();
