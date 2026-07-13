import { build } from 'esbuild';
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';

// 1. Generate vendor/katex in the source tree so esbuild can bundle katex.mjs
//    inline (the host loads one self-contained file; no relative-import
//    resolution needed at runtime). vendor/ is gitignored.
rmSync('vendor', { recursive: true, force: true });
mkdirSync('vendor/katex/fonts', { recursive: true });
const katexDist = 'node_modules/katex/dist';
cpSync(`${katexDist}/katex.mjs`, 'vendor/katex/katex.mjs');
cpSync(`${katexDist}/katex.min.css`, 'vendor/katex/katex.min.css');
for (const f of readdirSync(`${katexDist}/fonts`)) {
  if (f.endsWith('.woff2')) cpSync(`${katexDist}/fonts/${f}`, `vendor/katex/fonts/${f}`);
}

// 2. Bundle each plugin into a single ES module.
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
const plugins = JSON.parse(readFileSync('plugins.json', 'utf8'));
for (const p of plugins) {
  await build({
    entryPoints: [`plugins/${p.name}/index.ts`],
    outfile: `dist/${p.name}/index.js`,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
  });
}

// 3. Copy vendored KaTeX CSS + fonts to dist (fetched at runtime via the host
//    provided base URL). The katex JS itself is already inlined in the bundle.
mkdirSync('dist/vendor/katex/fonts', { recursive: true });
cpSync('vendor/katex/katex.min.css', 'dist/vendor/katex/katex.min.css');
for (const f of readdirSync('vendor/katex/fonts')) {
  cpSync(`vendor/katex/fonts/${f}`, `dist/vendor/katex/fonts/${f}`);
}

cpSync('plugins.json', 'dist/plugins.json');
console.log(`built ${plugins.length} plugin(s) -> dist/`);
