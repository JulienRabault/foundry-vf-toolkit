// Build dist/*.js: Foundry scripts with the lib/ helpers inlined, ready to paste into a
// script macro or send with the foundry-mcp `run-script` tool (which cannot import files).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'scripts', 'foundry');
const outDir = join(root, 'dist');
mkdirSync(outDir, { recursive: true });

const inline = (file, from) => {
  const lib = readFileSync(resolve(from, file), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace(/^export /gm, '');
  return `// --- inlined from ${file.replace(/^(\.\.\/)+/, '')} ---\n${lib.trim()}\n// --- end ---`;
};

for (const name of readdirSync(srcDir).filter(f => f.endsWith('.js'))) {
  const code = readFileSync(join(srcDir, name), 'utf8').replace(
    /\/\* @include (\S+) \*\//g,
    (_, file) => inline(file, srcDir)
  );
  writeFileSync(join(outDir, name), code);
  console.log(`dist/${name}`);
}
