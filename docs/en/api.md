# API Reference (English)

This page is the **full contract** available to plugins. Every interface comes
from `shared/types.ts` (a mirror of the host's `src/core/extension.ts`; keep the
two in sync). `API_VERSION` is currently `1`.

## MathPainter (the only interface a plugin depends on)

```ts
export const API_VERSION = 1;

export interface MathPainter {
  readonly apiVersion: number;
  registerShape<T extends Shape>(definition: ShapeDefinition<T>): void;
  registerTool(tool: Tool): void;
  bindKey(key: string, toolId: string): void;
  setFormulaRenderer(renderer: FormulaRenderer | null): void;
}
```

| Method | Meaning |
| --- | --- |
| `registerShape(def)` | Register a shape definition |
| `registerTool(tool)` | Register a tool (auto-appears in the toolbar) |
| `bindKey(key, toolId)` | Bind a key to a registered tool |
| `setFormulaRenderer(r)` | Contribute a formula renderer (e.g. KaTeX); pass `null` to uninstall |
| `renderSVG(opts?)` | Render the current scene to an SVG string (white background, dark ink, auto-cropped to content bounds) |
| `renderCanvas(opts?)` | Render the current scene to a PNG-ready canvas (white background, black ink, auto-cropped); returns `null` when the scene is empty |

**Key-binding convention:** all left-half keys (v d s c b a g t w, plus actions
x r z e f q 1) are taken by built-ins, so plugins should use a free right-half
key (e.g. `y`, `m`). Built-in bindings take precedence over plugin bindings.

## Shared types

```ts
export interface Vec { x: number; y: number; }
export interface Style { stroke: string; fill: string; width: number; }
export interface Shape { id: string; type: string; style: Style; hidden?: boolean; }
export interface SVGContext { ink: string; }
export interface ShapeRenderOpts { scale: number; active: boolean; }
```

## ShapeDefinition

A shape *owns* all of its behaviour — there is no central `switch` to edit.

```ts
export interface ShapeDefinition<T extends Shape = Shape> {
  type: T['type'];
  anchors(shape: T): Vec[];                                  // grab dots
  hit(shape: T, world: Vec, tolerance: number): boolean;     // hit test
  draw(ctx: CanvasRenderingContext2D, shape: T, opts: ShapeRenderOpts): void;
  translate(shape: T, delta: Vec): T;                        // move
  nearest(shape: T, world: Vec): { point: Vec; dist: number };
  bbox(shape: T): Vec[];                                     // selection box
  toSVG(shape: T, ctx: SVGContext): string;                  // SVG export
  parse(value: unknown, id: string, style: Style): T | null; // parse scene file
  edgeAt?(shape: T, world: Vec): { a: Vec; b: Vec } | null;  // optional edge
  cascadeIds?(shape: T): string[];                           // optional cascade
}
```

Key conventions:

- **`draw` must use `opts.scale`** to convert screen pixels to world units (line
  widths, arrow sizes, … divided by `scale`) so visuals stay constant on zoom.
- **`parse` must return `null` on malformed input**, or scene import breaks.
- **Anchors render as grab dots**; omit a point (e.g. an arrowhead tip) if you do
  not want a dot there.

## Tool

```ts
export interface Tool {
  id: string;
  label?: string;   // toolbar label (set to the key to avoid id-first-letter fallback)
  cursor?: string;  // CSS cursor
  activate?(ctx: EditorContext): void;
  pointerDown(ctx: EditorContext, e: PointerInput): void;
  pointerMove?(ctx: EditorContext, e: PointerInput): void;
  pointerUp?(ctx: EditorContext, e: PointerInput): void;
  pointerCancel?(ctx: EditorContext): void;
  dblClick?(ctx: EditorContext, e: PointerInput): void;
  cancel?(ctx: EditorContext): void;
  drawOverlay?(overlay: Overlay): void;
}
```

- **Set `label` to the tool's key** (e.g. `'Y'` for arrow) so the host toolbar does
  not fall back to the id's first letter and collide with a built-in label.
- **`PointerInput`** exposes `client`, `rawWorld`, `button`, `shift`, `alt`, `ctrl`;
  `rawWorld` is *un-snapped* — call `ctx.snap(rawWorld)` explicitly.
- **`drawOverlay`** draws dashed segments, anchors, text, etc.; call `ctx.draw()`
  after each move to repaint.

```ts
export interface PointerInput {
  client: Vec; rawWorld: Vec; button: number;
  shift: boolean; alt: boolean; ctrl: boolean;
}

export interface Overlay {
  drawDashedSegment(a: Vec, b: Vec): void;
  drawDashedArc(c: Vec, r: number, a0: number, a1: number): void;
  drawAnchor(point: Vec, active: boolean): void;
  drawText(at: Vec, text: string): void;
  drawPoint(at: Vec): void;
  drawRect(x0: number, y0: number, x1: number, y1: number): void;
}
```

## EditorContext

A tool talks to the editor through it:

| Member | Purpose |
| --- | --- |
| `scene` | Current scene (`shapes` and `order`) |
| `selection` | Selection (`list/has/set/clear/add/toggle`) |
| `viewport` | Viewport (`x/y/scale`, `toWorld`, `zoomAt`) |
| `idgen.next()` | Unique shape id |
| `add(shape)` | Add a shape |
| `replace(before, after)` | Undoable replace of a shape set |
| `deleteShapes(ids)` | Delete |
| `snap(world, extra?, exclude?)` | Snap to anchor or edge |
| `draw()` | Request a repaint |
| `setStatus(msg)` | Terminal status (repaints) |
| `setStatusText(msg)` | Per-frame text (no repaint) |
| `promptText(msg, def?)` | Async text prompt; resolves text on Enter, `null` on cancel |
| `promptChoice(title, opts)` | Choice menu; resolves chosen key or `null` |

> `promptText` resolves to the text on Enter (empty string = create without a
> label), and to `null` only on `Esc`/blur — do not treat empty Enter as cancel.

## FormulaRenderer

Contributed to built-in labels so `$...$` segments are typeset (e.g. KaTeX).
Adds no shape or tool.

```ts
export interface FormulaRenderer {
  css(): string;        // CSS injected once (e.g. KaTeX @import)
  toHTML(tex: string): string; // TeX -> HTML
}
// usage: mp.setFormulaRenderer(latexFormulaRenderer);
```

## External assets

If a plugin fetches CSS/fonts/wasm, it must compose the URL from
`globalThis.__MP_EXT_BASE__` (the host sets this to the plugin's deployed origin
before importing), falling back to `import.meta.url` only when the global is
absent:

```ts
const hostBase = (globalThis as { __MP_EXT_BASE__?: string }).__MP_EXT_BASE__;
const assetBase =
  (hostBase ? hostBase.replace(/\/?$/, '/') : new URL('../../assets/', import.meta.url).href)
  + 'assets/';
```

## Versioning & compatibility

The host only bumps `API_VERSION` on a breaking change. If you need a new
capability, adjust the contract in `shared/types.ts` (kept in sync with the
host's `src/core/extension.ts`), and set your plugin's `minApi` to the required
version; the loader refuses to install a plugin that needs a newer API. Keep
`shared/types.ts` **in sync** with the host's frozen API at all times.
