// Frozen extension contract mirrored from math-painter/core. Plugins depend on
// THIS surface only. Keep it in sync with src/core/extension.ts (MathPainter)
// and the relevant core interfaces. When math-painter is published to npm,
// switch these imports to `from 'math-painter'`.

export interface Vec {
  x: number;
  y: number;
}

export interface Style {
  stroke: string;
  fill: string;
  width: number;
}

export interface Shape {
  id: string;
  type: string;
  style: Style;
  hidden?: boolean;
}

export interface SVGContext {
  ink: string;
}

export interface ShapeRenderOpts {
  scale: number;
  active: boolean;
}

export interface ShapeDefinition<T extends Shape = Shape> {
  type: T['type'];
  anchors(shape: T): Vec[];
  hit(shape: T, world: Vec, tolerance: number): boolean;
  draw(ctx: CanvasRenderingContext2D, shape: T, opts: ShapeRenderOpts): void;
  translate(shape: T, delta: Vec): T;
  nearest(shape: T, world: Vec): { point: Vec; dist: number };
  bbox(shape: T): Vec[];
  toSVG(shape: T, ctx: SVGContext): string;
  parse(value: unknown, id: string, style: Style): T | null;
  edgeAt?(shape: T, world: Vec): { a: Vec; b: Vec } | null;
  cascadeIds?(shape: T): string[];
}

export interface PointerInput {
  client: Vec;
  rawWorld: Vec;
  button: number;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
}

export interface Overlay {
  drawDashedSegment(a: Vec, b: Vec): void;
  drawDashedArc(c: Vec, r: number, a0: number, a1: number): void;
  drawAnchor(point: Vec, active: boolean): void;
  drawText(at: Vec, text: string): void;
  drawPoint(at: Vec): void;
  drawRect(x0: number, y0: number, x1: number, y1: number): void;
}

export interface EditorContext {
  readonly scene: { shapes: Record<string, Shape>; order: string[] };
  readonly selection: { list(): string[]; has(id: string): boolean; set(ids: string[]): void; clear(): void; add(id: string): void; toggle(id: string): void };
  readonly viewport: { x: number; y: number; scale: number; toWorld(cx: number, cy: number, rect: DOMRect): Vec; zoomAt(m: Vec, f: number): void };
  readonly commands: unknown;
  readonly idgen: { next(): string };
  lastSnap: Vec | null;
  add(shape: Shape): void;
  replace(before: Map<string, Shape>, after: Map<string, Shape>): void;
  deleteShapes(ids: string[]): void;
  snap(world: Vec, extra?: Vec[], exclude?: string[]): Vec;
  draw(): void;
  setStatus(message: string): void;
  setStatusText(message: string): void;
  promptText(message: string, defaultValue?: string): Promise<string | null>;
  promptChoice(title: string, options: { key: string; label: string }[]): Promise<string | null>;
}

export interface Tool {
  id: string;
  /** Short toolbar/legend label (e.g. the tool's key). Plugin tools set this
   *  so the host toolbar does not fall back to the first letter of the id. */
  label?: string;
  cursor?: string;
  activate?(ctx: EditorContext): void;
  deactivate?(ctx: EditorContext): void;
  pointerDown(ctx: EditorContext, e: PointerInput): void;
  pointerMove?(ctx: EditorContext, e: PointerInput): void;
  pointerUp?(ctx: EditorContext, e: PointerInput): void;
  pointerCancel?(ctx: EditorContext): void;
  dblClick?(ctx: EditorContext, e: PointerInput): void;
  cancel?(ctx: EditorContext): void;
  drawOverlay?(overlay: Overlay): void;
}

export interface FormulaRenderer {
  /** KaTeX CSS (or an `@import` rule) required to render the HTML. */
  css(): string;
  /** Render inline TeX to an HTML string (no wrapper element). */
  toHTML(tex: string): string;
}

export interface MathPainter {
  readonly apiVersion: number;
  registerShape<T extends Shape>(definition: ShapeDefinition<T>): void;
  registerTool(tool: Tool): void;
  bindKey(key: string, toolId: string): void;
  setFormulaRenderer(renderer: FormulaRenderer | null): void;
}
