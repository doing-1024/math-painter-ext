// Renders LaTeX math to HTML via KaTeX. The math-painter core renders labels as
// HTML, so this plugin only needs to turn `$...$` TeX into KaTeX HTML — no
// canvas rasterization. KaTeX is vendored alongside this plugin at
// ../../vendor/katex so it loads from the same fast Cloudflare Pages origin.
import katex from '../../vendor/katex/katex.mjs';
import type { FormulaRenderer } from '../../shared/types.js';

// The host app sets globalThis.__MP_EXT_BASE__ to the plugin's deployed origin
// before importing the (bundled) plugin, so external assets (KaTeX CSS/fonts)
// resolve correctly even when the module is loaded via a blob URL. Falls back
// to import.meta.url when the global is absent.
const hostBase: string | undefined = (globalThis as { __MP_EXT_BASE__?: string }).__MP_EXT_BASE__;
const katexBase =
  (hostBase ? hostBase.replace(/\/?$/, '/') : new URL('../../vendor/katex/', import.meta.url).href) + 'vendor/katex/';
export const katexBaseUrl = katexBase;
const KATEX_CSS_URL = katexBase + 'katex.min.css';

export function stripDelims(tex: string): string {
  const t = tex.trim();
  if (t.startsWith('$') && t.endsWith('$') && t.length >= 2) return t.slice(1, -1);
  if (t.startsWith('\\(') && t.endsWith('\\)')) return t.slice(2, -2);
  return t;
}

export const latexFormulaRenderer: FormulaRenderer = {
  // The label layer injects this once into the page; the browser fetches the
  // KaTeX stylesheet (and its fonts) from the deployed origin.
  css(): string {
    return `@import url(${KATEX_CSS_URL});`;
  },
  toHTML(tex: string): string {
    try {
      return katex.renderToString(stripDelims(tex), { throwOnError: false, displayMode: false });
    } catch {
      return `<span class="mp-math-error">${stripDelims(tex)}</span>`;
    }
  },
};
