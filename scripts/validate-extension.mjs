#!/usr/bin/env node
/**
 * Valida a pasta da extensão: manifest.json e arquivos obrigatórios.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_DIR = path.resolve(__dirname, "..", "extension");

const REQUIRED_FILES = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "icons/icon-16.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];

function main() {
  if (!fs.existsSync(EXT_DIR)) {
    console.error("Pasta da extensão não encontrada:", EXT_DIR);
    process.exit(1);
  }

  const missing = [];
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(EXT_DIR, file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    console.error("Arquivos obrigatórios da extensão não encontrados:");
    missing.forEach((f) => console.error("  -", f));
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(EXT_DIR, "manifest.json"), "utf-8"));
  } catch (e) {
    console.error("manifest.json inválido:", e.message);
    process.exit(1);
  }

  const requiredManifestFields = ["manifest_version", "name", "version", "action", "icons"];
  for (const field of requiredManifestFields) {
    if (!(field in manifest)) {
      console.error("manifest.json deve conter o campo:", field);
      process.exit(1);
    }
  }

  console.log("Extensão validada com sucesso.");
}

main();
