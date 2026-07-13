// Renders LaTeX math to HTML via KaTeX. The math-painter core renders labels as
// HTML, so this plugin only needs to turn `$...$` TeX into KaTeX HTML — no
// canvas rasterization. KaTeX is vendored alongside this plugin at
// ../../vendor/katex so it loads from the same fast Cloudflare Pages origin.
import katex from '../../vendor/katex/katex.mjs';
import type { FormulaRenderer } from '../../shared/types.js';

// The host app sets globalThis.__MP_EXT_BASE__ to the plugin's deployed origin
// before importing the (bundled) plugin, so external assets (KaTeX fonts)
// resolve correctly even when the module is loaded via a blob URL. Falls back
// to import.meta.url when the global is absent.
function katexBaseUrl(): string {
  const hostBase = (globalThis as { __MP_EXT_BASE__?: string }).__MP_EXT_BASE__;
  const base = hostBase ? hostBase.replace(/\/?$/, '/') : new URL('../../vendor/katex/', import.meta.url).href;
  return base + 'vendor/katex/';
}

export function stripDelims(tex: string): string {
  const t = tex.trim();
  if (t.startsWith('$') && t.endsWith('$') && t.length >= 2) return t.slice(1, -1);
  if (t.startsWith('\\(') && t.endsWith('\\)')) return t.slice(2, -2);
  return t;
}

export const latexFormulaRenderer: FormulaRenderer = {
  // The full KaTeX stylesheet is inlined into this bundle at build time (no
  // separate request); font URLs keep a __MP_KATEX_BASE__ placeholder that is
  // resolved here to the host-provided origin so fonts still load from the CDN.
  css(): string {
    return __KATEX_CSS__.replace(/__MP_KATEX_BASE__/g, katexBaseUrl());
  },
  toHTML(tex: string): string {
    try {
      return katex.renderToString(stripDelims(tex), { throwOnError: false, displayMode: false });
    } catch {
      return `<span class="mp-math-error">${stripDelims(tex)}</span>`;
    }
  },
};
