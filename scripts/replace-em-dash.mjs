/**
 * Replaces Unicode em dash (U+2014) in source/docs:
 * - Quoted placeholder "—" becomes "-" (empty table cells).
 * - Remaining em dashes become ", " then ", ," is collapsed.
 * Do NOT add a step that collapses all double spaces (that corrupts indentation).
 * Prefer colons or periods in comments after running this, then search for awkward ", " pairs.
 */
import fs from "node:fs";
import path from "node:path";

const EM = "\u2014";
const skip = new Set(["node_modules", ".next", ".git"]);
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".mdx"]);

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(name.name)) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (exts.has(path.extname(name.name).toLowerCase())) acc.push(p);
  }
}

const files = [];
walk(".", files);
let changed = 0;

for (const f of files) {
  let t = fs.readFileSync(f, "utf8");
  if (!t.includes(EM)) continue;
  const raw = t;
  t = t.replaceAll(`"${EM}"`, `"-"`);
  t = t.replaceAll(`'${EM}'`, `'-'`);
  t = t.replaceAll(EM, ", ");
  t = t.replace(/,\s*,/g, ",");
  if (t !== raw) {
    fs.writeFileSync(f, t, "utf8");
    changed++;
    console.log(f);
  }
}
console.error("files changed:", changed);
