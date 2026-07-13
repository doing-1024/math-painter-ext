# 示例（中文）

两个完整可运行示例：`arrow`（新增形状 + 工具）与 `latex`（仅贡献公式渲染器）。
完整代码也可直接参考仓库里的 `plugins/arrow` 与 `plugins/latex`。

## 示例一：arrow（形状 + 工具）

### plugins/arrow/index.ts（入口）

```ts
import type { MathPainter } from '../../shared/types.js';
import { arrowShapeDef } from './arrow-shape.js';
import { ArrowTool } from './arrow-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(arrowShapeDef);
  mp.registerTool(new ArrowTool());
  mp.bindKey('y', 'arrow'); // 绑定右侧空闲键
}
```

### plugins/arrow/arrow-shape.ts（形状，节选）

```ts
export const arrowShapeDef: ShapeDefinition<ArrowShape> = {
  type: 'arrow',
  anchors: (s) => [s.a],                 // 仅尾端抓取点，避免遮挡箭头头部
  hit: (s, world, tol) => distToSegment(world, s.a, s.b) < tol,
  draw: (ctx, s, opts) => {
    ctx.strokeStyle = s.style.stroke;
    ctx.lineWidth = (opts.active ? 2.5 : 1.5) / opts.scale; // 用 scale 换算
    ctx.beginPath();
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
    ctx.stroke();
    // ... 画箭头头部（见仓库完整代码）
  },
  translate: (s, d) => ({ ...s, a: add(s.a, d), b: add(s.b, d) }),
  nearest: (s, world) => ({ point: projectOnSegment(world, s.a, s.b), dist: distToSegment(world, s.a, s.b) }),
  bbox: (s) => [s.a, s.b],
  toSVG: (s, { ink }) => `<line x1="${s.a.x}" y1="${s.a.y}" x2="${s.b.x}" y2="${s.b.y}" stroke="${ink}" stroke-width="1.5"/>`,
  parse: (value, id, style) => {
    const v = value as Record<string, unknown>;
    if (v.type !== 'arrow' || !isVec(v.a) || !isVec(v.b)) return null; // 不符返回 null
    return { id, type: 'arrow', a: v.a, b: v.b, style };
  },
};
```

### plugins/arrow/arrow-tool.ts（工具，节选）

```ts
export class ArrowTool implements Tool {
  id = 'arrow';
  label = 'Y';          // 工具栏显示按键
  cursor = 'crosshair';
  private start: Vec | null = null;
  private preview: Vec | null = null;

  pointerDown(ctx: EditorContext, e: PointerInput): void {
    if (!this.start) {
      this.start = ctx.snap(e.rawWorld);  // 吸附
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

## 示例二：latex（仅贡献公式渲染器）

`latex` 插件不新增形状或工具，而是贡献一个 `FormulaRenderer`，让内置标签里的 `$...$`
片段由 KaTeX 排版。内核因此保持极简（不含排版依赖）。

### plugins/latex/index.ts

```ts
import type { MathPainter } from '../../shared/types.js';
import { latexFormulaRenderer } from './katex-render.js';

export default function activate(mp: MathPainter): void {
  mp.setFormulaRenderer(latexFormulaRenderer); // 无形状、无工具、无按键
}
```

### plugins/latex/katex-render.ts（节选）

```ts
import katex from '../../vendor/katex/katex.mjs';
import type { FormulaRenderer } from '../../shared/types.js';

// 主程序在导入前会把 __MP_EXT_BASE__ 设为插件部署源，确保 KaTeX CSS/字体可解析。
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

## 下一步

- 想加新能力？先读 [API 参考](./api.md)。
- 想快速跑通？回到 [快速上手](./quickstart.md)。
