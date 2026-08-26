// verify-security.mjs — Run: node verify-security.mjs [--with-build]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const results = [];
const add = (id, status, detail) => {
  results.push({ id, status, detail });
  console.log(`[${status}] ${id} — ${detail}`);
};

// ---- Recursive walker (.ts/.tsx/.js/.jsx/.mdx) ----
function* walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?|mdx)$/.test(f)) yield p;
  }
}
const files = [...walk(SRC)];

// ==== STATIC CHECKS ====
let s1 = 0;
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  if (/geminiApiKey|setGeminiApiKey/.test(c)) { s1++; console.log(`  HIT: ${f}`); }
}
add("S1-client-secret", s1 === 0 ? "PASS" : "FAIL", `${s1} occurrence(s) of geminiApiKey`);

let s2 = 0;
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  const m = c.match(/dangerouslySetInnerHTML/g);
  if (m) { s2 += m.length; console.log(`  HIT: ${f}`); }
}
add("S2-danger-html", s2 === 0 ? "PASS" : "FAIL", `${s2} occurrence(s)`);

const pubSecretShape = /NEXT_PUBLIC_[A-Z_]*(KEY|TOKEN|SECRET|PASSWORD)/;
let s3 = [];
for (const f of files) {
  fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (pubSecretShape.test(line)) s3.push(`${f}:${i + 1}`);
  });
}
add("S3-nextpublic-secrets", s3.length === 0 ? "PASS" : "FAIL", s3.join(", ") || "clean");

// ==== S4: Anchor & <Link> audit (order-agnostic, brace-aware) ====
function extractAttrs(tag) {
  const attrs = {};
  const re = /([:\w-]+)(?:\s*=\s*)("(?:[^"]*)"|'(?:[^']*)'|\{[^}]*\}|[^\s>]+)/g;
  let m;
  while ((m = re.exec(tag)) !== null) {
    let v = m[2];
    if (v.startsWith("{")) v = v.slice(1, -1);
    else v = v.replace(/^["']|["']$/g, "");
    attrs[m[1].toLowerCase()] = v.toLowerCase();
  }
  return attrs;
}
const unsafeLinks = [];
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  // Match BOTH plain <a> and next/link <Link>
  for (const m of c.matchAll(/<(?:a|Link)\b[^>]*>/g)) {
    const a = extractAttrs(m[0]);
    const t = a.target?.replace(/['"{}/]/g, "").trim();
    if (t !== "_blank") continue;
    const rel = a.rel || "";
    if (!(rel.includes("noopener") && rel.includes("noreferrer"))) {
      const upto = c.slice(0, m.index);
      const line = upto.split("\n").length;
      unsafeLinks.push(`${path.relative(ROOT, f)}:${line}`);
    }
  }
}
add("S4-blank-links", unsafeLinks.length === 0 ? "PASS" : "FAIL",
  unsafeLinks.length ? unsafeLinks.join("; ") : "all _blank links carry noopener+noreferrer");

// ==== S5: .env hygiene / git tracking ====
const gi = fs.existsSync(".gitignore") ? fs.readFileSync(".gitignore", "utf8") : "";
add("S5-gitignore-env", /\.env(\.local)?/m.test(gi) ? "PASS" : "FAIL",
  ".gitignore coverage of .env files");
try {
  const tracked = execSync('git ls-files "*.env*"').toString().trim();
  add("S6-env-not-tracked", tracked ? "FAIL" : "PASS",
    tracked ? `TRACKED IN GIT: ${tracked} — REMOVE & ROTATE KEYS` : "no env files tracked");
} catch { add("S6-env-not-tracked", "SKIP", "not a git repo"); }

// ==== S7: Built-bundle secret scan (run AFTER npm run build) ====
if (process.argv.includes("--with-build")) {
  const staticDir = path.join(ROOT, ".next", "static");
  let leaks = [];
  const patterns = [
    [/AIza[0-9A-Za-z_\-]{30,}/g, "Google/Gemini API key"],
    [/ya29\.[0-9A-Za-z_\-]+/g, "Google OAuth token"],
    [/sk-[A-Za-z0-9]{20,}/g, "OpenAI-style secret key"],
    [/\b\d{5}x[A-Za-z0-9]{90,}/g, "LINE channel access token shape"],
  ];
  function* walkAll(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) yield* walkAll(p);
      else yield p;
    }
  }
  try {
    for (const f of walkAll(staticDir)) {
      const c = fs.readFileSync(f, "utf8");
      for (const [re, label] of patterns) {
        if (re.test(c)) leaks.push(`${path.relative(ROOT, f)} → ${label}`);
      }
    }
  } catch { add("S7-bundle-leak", "SKIP", ".next/static not found — run npm run build first"); }
  add("S7-bundle-leak", leaks.length === 0 ? "PASS" : "FAIL", leaks.join("; ") || "no secret-shaped strings in client bundle");
}

// ==== SUMMARY ====
const failed = results.filter((r) => r.status === "FAIL");
console.log("\n═══════════════════════════════");
console.log(`TOTAL: ${results.length} | PASS: ${results.filter(r=>r.status==="PASS").length} | FAIL: ${failed.length}`);
console.log("VERDICT:", failed.length === 0 ? "✅ STATIC PROOFS CLEAN" : "❌ FIX REQUIRED");
fs.writeFileSync(`security-report-${Date.now()}.json`, JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
