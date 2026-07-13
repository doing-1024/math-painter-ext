// Renders LaTeX math to a cached canvas image (via KaTeX -> SVG foreignObject)
// and to an SVG fragment for export. KaTeX is vendored alongside this plugin at
// ../../vendor/katex so it loads from the same fast Cloudflare Pages origin.
import katex from '../../vendor/katex/katex.mjs';

// The host app sets globalThis.__MP_EXT_BASE__ to the plugin's deployed origin
// before importing the (bundled) plugin, so external assets (KaTeX CSS/fonts)
// resolve correctly even when the module is loaded via a blob URL. Falls back
// to import.meta.url when the global is absent.
const hostBase: string | undefined = (globalThis as { __MP_EXT_BASE__?: string }).__MP_EXT_BASE__;
const katexBase = (hostBase ? hostBase.replace(/\/?$/, '/') : new URL('../../vendor/katex/', import.meta.url).href) + 'vendor/katex/';
const KATEX_CSS_URL = katexBase + 'katex.min.css';
const FONT_PX = 18;

let cssText: string | null = null;
let cssPromise: Promise<string> | null = null;

async function loadCss(): Promise<string> {
  if (cssText) return cssText;
  if (!cssPromise) {
    cssPromise = fetch(KATEX_CSS_URL)
      .then((r) => r.text())
      .then((t) => {
        // Rewrite relative font URLs to absolute so they resolve from the
        // deployed origin even inside an SVG data URL / foreignObject.
        cssText = t.replace(/url\(fonts\//g, `url(${katexBase}fonts/`);
        return cssText;
      });
  }
  return cssPromise;
}

export function stripDelims(tex: string): string {
  const t = tex.trim();
  if (t.startsWith('$') && t.endsWith('$') && t.length >= 2) return t.slice(1, -1);
  if (t.startsWith('\\(') && t.endsWith('\\)')) return t.slice(2, -2);
  return t;
}

function measure(html: string, fontPx: number): { w: number; h: number } {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = '-99999px';
  div.style.top = '0';
  div.style.fontSize = fontPx + 'px';
  div.style.lineHeight = '1';
  div.style.display = 'inline-block';
  div.innerHTML = html;
  document.body.appendChild(div);
  const w = div.offsetWidth || fontPx;
  const h = div.offsetHeight || fontPx;
  document.body.removeChild(div);
  return { w, h };
}

const imgCache = new Map<string, HTMLImageElement>();
let redraw: (() => void) | null = null;

export function setRedraw(fn: () => void): void {
  redraw = fn;
}

async function buildImage(tex: string, color: string): Promise<HTMLImageElement> {
  const html = katex.renderToString(stripDelims(tex), { throwOnError: false, displayMode: false });
  const css = await loadCss();
  const { w, h } = measure(html, FONT_PX);
  const pad = Math.ceil(FONT_PX * 0.35);
  const W = w + pad * 2;
  const H = h + pad * 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<style>${css}</style>` +
    `<foreignObject x="0" y="0" width="${W}" height="${H}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="color:${color};font-size:${FONT_PX}px;line-height:1;display:inline-block;padding:${pad}px;box-sizing:border-box;white-space:nowrap;">${html}</div>` +
    `</foreignObject></svg>`;
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
  return img;
}

export async function getLatexImage(tex: string, color: string): Promise<HTMLImageElement> {
  const key = `${tex}|${color}`;
  const cached = imgCache.get(key);
  if (cached) return cached;
  const img = await buildImage(tex, color);
  imgCache.set(key, img);
  return img;
}

/** Draw the LaTeX label centred on the world point `at`. Synchronous: if the
 *  rasterized image is not ready yet, draws the raw source as a placeholder and
 *  schedules a redraw when it finishes. */
export function drawLatex(
  ctx: CanvasRenderingContext2D,
  tex: string,
  at: { x: number; y: number },
  color: string,
  scale: number,
): void {
  const key = `${tex}|${color}`;
  const img = imgCache.get(key);
  if (img && img.width) {
    const w = img.width / scale;
    const h = img.height / scale;
    ctx.drawImage(img, at.x - w / 2, at.y - h / 2, w, h);
    return;
  }
  // Placeholder (raw source) until the rasterized image is ready.
  ctx.fillStyle = color;
  ctx.font = `${FONT_PX / scale}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tex, at.x, at.y);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  getLatexImage(tex, color).then(() => redraw && redraw()).catch(() => {});
}

/** SVG fragment for export: KaTeX HTML inside a foreignObject, centred on `at`. */
export function latexSVG(tex: string, ink: string, at: { x: number; y: number }): string {
  const html = katex.renderToString(stripDelims(tex), { throwOnError: false, displayMode: false });
  const style = `@import url(${KATEX_CSS_URL});`;
  return (
    `<foreignObject x="${at.x}" y="${at.y}" width="800" height="200" overflow="visible">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);color:${ink};font-size:${FONT_PX}px;line-height:1;white-space:nowrap;">` +
    `<style>${style}</style>${html}</div>` +
    `</foreignObject>`
  );
}

export { katexBase };
