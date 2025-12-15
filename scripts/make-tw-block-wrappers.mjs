import fs from "node:fs";
import path from "node:path";

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, cb);
    else cb(p);
  }
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function withoutExt(p) {
  return p.replace(/\.(tsx|ts)$/, "");
}

function makeWrappers({ repoRoot, appName }) {
  const base = path.join(
    repoRoot,
    "apps",
    appName,
    "src",
    "components",
    "tw-blocks"
  );

  if (!fs.existsSync(base)) {
    throw new Error(`Base directory not found: ${base}`);
  }

  walk(base, (filePath) => {
    if (!/\.(ts|tsx)$/.test(filePath)) return;

    const rel = toPosix(path.relative(base, filePath));
    const relNoExt = withoutExt(rel);
    const target = `@tokenization/tw-blocks-shared/src/${relNoExt}`;
    const content = `export * from "${target}";\n`;

    fs.writeFileSync(filePath, content, "utf8");
  });
}

const repoRoot = process.cwd();
const appName = process.argv[2];

if (!appName) {
  console.error("Usage: node scripts/make-tw-block-wrappers.mjs <app-name>");
  process.exit(2);
}

makeWrappers({ repoRoot, appName });
console.log(`✅ tw-blocks wrappers generated for apps/${appName}`);
