/**
 * Replace em dashes (U+2014) with human-readable punctuation.
 * Run: node scripts/remove-em-dashes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const EM = "\u2014";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".cursor",
]);
const EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".md", ".mdx"]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(name.name)) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(name.name))) files.push(full);
  }
  return files;
}

function replaceEmDashes(content) {
  if (!content.includes(EM)) return content;

  let text = content;

  // Empty / table placeholders
  text = text.replace(/"\u2014"/g, '"-"');
  text = text.replace(/'\u2014'/g, "'-'");
  text = text.replace(/>\u2014</g, ">-<");
  text = text.replace(/:\s*"\u2014"/g, ': "-"');
  text = text.replace(/=\s*"\u2014"/g, '= "-"');

  // word—word (no spaces)
  text = text.replace(/(\S)\u2014(\S)/g, "$1, $2");

  // spaced em dash
  text = text.replace(/ \u2014 /g, ", ");

  // any remaining
  text = text.replace(/\u2014/g, ", ");

  // Cleanup artifacts
  text = text.replace(/, ,/g, ", ");
  text = text.replace(/,,/g, ",");

  // Known label patterns
  text = text.replace(/General, may/g, "General: may");
  text = text.replace(/\^General, /g, "^General: ");
  text = text.replace(/replace\(\/^General, \//g, "replace(/^General: /");

  // Email / signature closings
  text = text.replace(/<p style="[^"]*">, Tellacity/g, '<p style="margin-top: 24px; color: #6b7280; font-size: 13px;">Tellacity');
  text = text.replace(/, Tellacity Trust/g, "Tellacity Trust");

  return text;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (file.includes(`${path.sep}scripts${path.sep}remove-em-dashes.mjs`)) continue;
  const before = fs.readFileSync(file, "utf8");
  const after = replaceEmDashes(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
  }
}

console.log(`Updated ${changed} files.`);
