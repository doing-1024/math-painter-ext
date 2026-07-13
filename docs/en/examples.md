# Examples (English)

Two complete, runnable examples: `arrow` (new shape + tool) and `latex`
(renderer-only). The full source also lives in `plugins/arrow` and
`plugins/latex`.

## Example 1: arrow (shape + tool)

### plugins/arrow/index.ts (entry)

```ts
import type { MathPainter } from '../../shared/types.js';
import { arrowShapeDef } from './arrow-shape.js';
import { ArrowTool } from './arrow-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(arrowShapeDef);
  mp.registerTool(new ArrowTool());
  mp.bindKey('y', 'arrow'); // bind a free right-half key
}
```

### plugins/arrow/arrow-shape.ts (shape, excerpt)

```ts
export const arrowShapeDef: ShapeDefinition<ArrowShape> = {
  type: 'arrow',
  anchors: (s) => [s.a],                 // tail only, so the head stays unobscured
  hit: (s, world, tol) => distToSegment(world, s.a, s.b) < tol,
  draw: (ctx, s, opts) => {
    ctx.strokeStyle = s.style.stroke;
    ctx.lineWidth = (opts.active ? 2.5 : 1.5) / opts.scale; // scale-aware
    ctx.beginPath();
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
    ctx.stroke();
    // ... draw the arrowhead (see the repo for the full code)
  },
  translate: (s, d) => ({ ...s, a: add(s.a, d), b: add(s.b, d) }),
  nearest: (s, world) => ({ point: projectOnSegment(world, s.a, s.b), dist: distToSegment(world, s.a, s.b) }),
  bbox: (s) => [s.a, s.b],
  toSVG: (s, { ink }) => `<line x1="${s.a.x}" y1="${s.a.y}" x2="${s.b.x}" y2="${s.b.y}" stroke="${ink}" stroke-width="1.5"/>`,
  parse: (value, id, style) => {
    const v = value as Record<string, unknown>;
    if (v.type !== 'arrow' || !isVec(v.a) || !isVec(v.b)) return null; // null on bad input
    return { id, type: 'arrow', a: v.a, b: v.b, style };
  },
};
```

### plugins/arrow/arrow-tool.ts (tool, excerpt)

```ts
export class ArrowTool implements Tool {
  id = 'arrow';
  label = 'Y';          // show the key on the toolbar
  cursor = 'crosshair';
  private start: Vec | null = null;
  private preview: Vec | null = null;

  pointerDown(ctx: EditorContext, e: PointerInput): void {
    if (!this.start) {
      this.start = ctx.snap(e.rawWorld);  // snap
      this.preview = this.start;
      ctx.draw();
      return;
    }
    const end = ctx.snap(e.rawWorld);
    const begin = this.start;
    this.start = null;
    this.preview = null;
    ctx.add({ id: ctx.idgen.next(), type: 'arrow', a: begin, b: end, style: { ...DEFAULT_STYLE } });
  }

  pointerMove(ctx: EditorContext, e: PointerInput): void {
    if (this.start) { this.preview = ctx.snap(e.rawWorld); ctx.draw(); }
  }

  drawOverlay(o: Overlay): void {
    if (this.start && this.preview) o.drawDashedSegment(this.start, this.preview);
  }
}
```

## Example 2: latex (renderer-only)

The `latex` plugin adds no shape or tool — it contributes a `FormulaRenderer` so
`$...$` segments inside built-in labels are typeset by KaTeX. This keeps the core
minimal (no typesetting dependency).

### plugins/latex/index.ts

```ts
import type { MathPainter } from '../../shared/types.js';
import { latexFormulaRenderer } from './katex-render.js';

export default function activate(mp: MathPainter): void {
  mp.setFormulaRenderer(latexFormulaRenderer); // no shape, no tool, no key
}
```

### plugins/latex/katex-render.ts (excerpt)

```ts
import katex from '../../vendor/katex/katex.mjs';
import type { FormulaRenderer } from '../../shared/types.js';

// The host sets __MP_EXT_BASE__ to the plugin's deployed origin before importing,
// so KaTeX CSS/fonts resolve even under blob-URL loading.
const hostBase: string | undefined = (globalThis as { __MP_EXT_BASE__?: string }).__MP_EXT_BASE__;
const katexBase =
  (hostBase ? hostBase.replace(/\/?$/, '/') : new URL('../../vendor/katex/', import.meta.url).href) + 'vendor/katex/';
const KATEX_CSS_URL = katexBase + 'katex.min.css';

export const latexFormulaRenderer: FormulaRenderer = {
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
```

## Next steps

- Need a new capability? Read the [API Reference](./api.md).
- Want to get running fast? Back to [Quick Start](./quickstart.md).
