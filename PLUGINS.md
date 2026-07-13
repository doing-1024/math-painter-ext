# 插件开发文档 / Plugin Development Guide

math-painter 内核刻意保持极简，所有内核之外的形状与工具都以**插件**形式按需加载，
从而保证冷启动足够快。本指南用中文与英文双语说明如何新增、构建并发布一个插件。

math-painter keeps a deliberately minimal kernel. Everything beyond the core
shapes and tools lives in **plugins**, loaded on demand so the cold start stays
fast. This guide explains, in Chinese and English, how to author, build, and
publish a plugin.

> 仓库 / Repo: <https://github.com/doing-1024/math-painter-ext>
> 主程序 / Host app: <https://github.com/doing-1024/math-painter>
> 冻结 API 镜像 / Frozen API mirror: `shared/types.ts`

---

## 1. 概述 / Overview

**中文** — 一个插件是一个 ES 模块，其**默认导出**是一个 `activate(mp)` 函数，
由主程序在导入插件时调用。插件通过唯一的 `MathPainter` 接口注册形状、工具、
快捷键以及可选的「公式渲染器」。内核可以自由重构内部实现，只要这个接口保持稳定
（仅在破坏性变更时抬高 `API_VERSION`），已发布的插件就能继续工作。

**English** — A plugin is an ES module whose **default export** is an `activate(mp)`
function, called by the host when the plugin is imported. A plugin registers
shapes, tools, key bindings, and an optional *formula renderer* through the
single, stable `MathPainter` interface. The core may refactor its internals
freely; as long as this surface is preserved (and `API_VERSION` only bumps on a
breaking change), published plugins keep working.

```ts
import type { MathPainter } from '../../shared/types.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(arrowShapeDef);   // 注册形状 / register a shape
  mp.registerTool(new ArrowTool());  // 注册工具 / register a tool
  mp.bindKey('y', 'arrow');          // 绑定快捷键 / bind a hotkey
}
```

---

## 2. 仓库结构 / Repository layout

**中文** — 每个插件是多文件 TypeScript（便于维护）。构建时 esbuild 会把每个插件
打包成**单个自包含的 ES 模块**，主程序通过 Blob URL 加载这唯一一个文件，运行时
不再解析相对导入。

**English** — Each plugin is authored as **multi-file TypeScript** for
maintainability. At build time esbuild bundles each plugin into a **single
self-contained ES module**; the host loads that one file via a blob URL, so
there is no runtime relative-import resolution.

```
math-painter-ext/
  plugins/
    <name>/
      mp.config.json   # { name, title, description, version, minApi, entry, author }
      index.ts         # export default function activate(mp: MathPainter)
      <shape>.ts       # 一个 ShapeDefinition
      <tool>.ts        # 一个 Tool
  shared/
    types.ts           # 冻结的 MathPainter / ShapeDefinition / Tool 契约
    geom.ts            # 小体积向量工具 / small vector helpers
    style.ts           # DEFAULT_STYLE
  plugins.json         # 官方索引（部署到 dist/plugins.json）
  build.mjs            # esbuild 打包脚本 / esbuild bundling script
  wrangler.toml        # Cloudflare Pages 配置 / Cloudflare Pages config
```

---

## 3. 插件清单 mp.config.json / Plugin manifest

**中文** — `mp.config.json` 描述插件元数据。`entry` 是相对插件根的路径，esbuild
会把 `plugins/<name>/index.ts` 输出为 `dist/<name>/index.js`，因此 `entry`
写作 `plugins/arrow/index.js`。`minApi` 声明该插件需要的最低 API 版本；加载器会
拒绝安装需要更新 API 的插件。

**English** — `mp.config.json` describes plugin metadata. `entry` is the path
relative to the plugin root. esbuild emits `plugins/<name>/index.ts` as
`dist/<name>/index.js`, so `entry` is `plugins/arrow/index.js`. `minApi`
declares the minimum API version the plugin needs; the loader refuses to install
a plugin that requires a newer API.

```json
{
  "name": "arrow",
  "title": "Arrow",
  "description": "Directed arrow / vector tool with an arrowhead.",
  "version": "1.0.1",
  "minApi": 1,
  "entry": "plugins/arrow/index.js",
  "author": "doing-1024"
}
```

| 字段 / Field | 说明 / Meaning |
| --- | --- |
| `name` | 唯一标识 / unique id (used as `toolId` when bound) |
| `title` | 面板展示名 / display name in the panel |
| `version` | 语义化版本 / semver; used by the update checker |
| `minApi` | 需要的最低 `API_VERSION` / minimum `API_VERSION` |
| `entry` | 入口相对路径 / relative entry path (`<name>/index.js`) |
| `author` | 作者 / author |

---

## 4. 冻结的扩展 API / The frozen API

**中文** — `MathPainter`（`shared/types.ts` 中的镜像，对应主程序
`src/core/extension.ts`）是插件唯一依赖的契约。`API_VERSION` 当前为 `1`。

**English** — `MathPainter` (mirrored in `shared/types.ts`, matching the host's
`src/core/extension.ts`) is the *only* contract a plugin depends on.
`API_VERSION` is currently `1`.

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

| 方法 / Method | 说明 / Meaning |
| --- | --- |
| `registerShape(def)` | 注册一个形状定义 / register a shape definition |
| `registerTool(tool)` | 注册一个工具（自动出现在工具栏）/ register a tool |
| `bindKey(key, toolId)` | 把按键绑定到已注册的工具 / bind a key to a registered tool |
| `setFormulaRenderer(r)` | 贡献一个公式渲染器（如 KaTeX）/ contribute a formula renderer |

**快捷键约定 / Key-binding convention:** 所有左侧按键（v d s c b a g t w，以及动作
x r z e f q 1）都已被内置占用，因此插件应使用右侧空闲键（如 `y`、`m`）。
内置绑定优先于插件绑定。

**All left-half keys are taken by built-ins** (tools v d s c b a g t w; actions
x r z e f q 1), so plugins should use a free right-half key (e.g. `y`, `m`).
Built-in bindings take precedence over plugin bindings.

---

## 5. 形状定义 ShapeDefinition / Writing a shape

**中文** — 形状*拥有*自己全部的行为：锚点、命中测试、绘制、平移、最近点、包围盒、
SVG 导出、解析，全部写在 `ShapeDefinition` 里，没有需要改动的中央 `switch`。

**English** — A shape *owns* all of its behaviour: anchors, hit-testing,
drawing, translation, nearest-point, bounding box, SVG export, and parsing all
live in the `ShapeDefinition`. There is no central `switch` to edit.

```ts
export interface ShapeDefinition<T extends Shape = Shape> {
  type: T['type'];
  anchors(shape: T): Vec[];                                  // 抓取点 / grab dots
  hit(shape: T, world: Vec, tolerance: number): boolean;     // 命中测试 / hit test
  draw(ctx: CanvasRenderingContext2D, shape: T, opts: ShapeRenderOpts): void;
  translate(shape: T, delta: Vec): T;                        // 平移 / move
  nearest(shape: T, world: Vec): { point: Vec; dist: number };
  bbox(shape: T): Vec[];                                     // 选择框 / selection box
  toSVG(shape: T, ctx: SVGContext): string;                  // 导出 SVG / SVG export
  parse(value: unknown, id: string, style: Style): T | null; // 解析场景文件 / parse
  edgeAt?(shape: T, world: Vec): { a: Vec; b: Vec } | null;  // 可选：边 / optional edge
  cascadeIds?(shape: T): string[];                            // 可选：级联删除 / cascade
}
```

关键约定 / Key conventions:

- **`draw` 使用 `opts.scale`** 把屏幕像素换算为世界单位（线宽、箭头大小等都除以
  `scale`），使视觉尺寸不随缩放变化。
  **`draw` must use `opts.scale`** to convert screen pixels to world units (line
  widths, arrow sizes, … are divided by `scale`) so visuals stay constant.
- **`parse` 必须在格式不符时返回 `null`**，否则会破坏场景文件导入。
  **`parse` must return `null` on malformed input**, or scene import breaks.
- 锚点（`anchors`）会渲染成抓取点；若不想在末端显示抓取点（如箭头头部），不要把它
  列入。 **Anchors render as grab dots**; omit a point (e.g. an arrowhead tip) if
  you do not want a dot there.

---

## 6. 工具定义 Tool / Writing a tool

**中文** — 工具实现 `Tool` 接口：按下/移动/抬起、取消、双击，以及可选的 `drawOverlay`
（实时预览）。工具拿到 `EditorContext`，并把每一次取点都经过 `ctx.snap` 以获得吸附。

**English** — A tool implements the `Tool` interface: down/move/up, cancel,
dblClick, and an optional `drawOverlay` for live preview. It receives an
`EditorContext` and routes every point pick through `ctx.snap` for snapping.

```ts
export interface Tool {
  id: string;
  label?: string;   // 工具栏标签（建议设为按键，避免回退到 id 首字母）
  cursor?: string;  // CSS 光标 / CSS cursor
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

- **`label` 建议设为该工具的按键**（例如 arrow 设为 `'Y'`），这样工具栏不会把插件
  工具回退成 id 首字母而导致与内置标签撞车。
  **Set `label` to the tool's key** (e.g. `'Y'` for arrow) so the host toolbar
  does not fall back to the id's first letter and collide with a built-in label.
- **`PointerInput`** 提供 `client`、`rawWorld`、`button`、`shift`、`alt`、`ctrl`；
  其中 `rawWorld` 是未吸附的世界坐标，工具应显式调用 `ctx.snap(rawWorld)`。
  **`PointerInput`** exposes `client`, `rawWorld`, `button`, `shift`, `alt`,
  `ctrl`; `rawWorld` is *un-snapped* — call `ctx.snap(rawWorld)` explicitly.
- **`drawOverlay`** 用 `Overlay` 画虚线、锚点、文本等预览；每次移动后调用 `ctx.draw()`
  触发重绘。**`drawOverlay`** draws dashed segments, anchors, text, etc.; call
  `ctx.draw()` after each move to repaint.

---

## 7. 编辑器上下文 EditorContext / The editor context

**中文** — 工具通过 `EditorContext` 与编辑器交互。常用能力：

**English** — A tool talks to the editor through `EditorContext`. Common
capabilities:

| 成员 / Member | 用途 / Purpose |
| --- | --- |
| `scene` | 当前场景（`shapes` 与 `order`）/ current scene |
| `selection` | 选区（`list/has/set/clear/add/toggle`）/ selection |
| `viewport` | 视口（`x/y/scale`、`toWorld`、`zoomAt`）/ viewport |
| `idgen.next()` | 生成唯一形状 id / unique shape id |
| `add(shape)` | 新增形状 / add a shape |
| `replace(before, after)` | 用命令替换一组形状（可撤销）/ undoable replace |
| `deleteShapes(ids)` | 删除 / delete |
| `snap(world, extra?, exclude?)` | 吸附到锚点或边 / snap to anchor or edge |
| `draw()` | 请求重绘 / request a repaint |
| `setStatus(msg)` | 终态状态（触发重绘）/ terminal status (repaints) |
| `setStatusText(msg)` | 每帧状态文本（不触发重绘）/ per-frame text (no repaint) |
| `promptText(msg, def?)` | 非阻塞文本输入，回车返回文本/`null` 取消 / async text prompt |
| `promptChoice(title, opts)` | 选项菜单，返回所选 key 或 `null` / choice menu |

> 注意 / Note: `promptText` 回车返回文本（空字符串表示不带标签创建），仅 `Esc`/失焦
> 返回 `null`。不要把空回车当作取消。
> `promptText` resolves to the text on Enter (empty string = create without a
> label), and to `null` only on `Esc`/blur — do not treat empty Enter as cancel.

---

## 8. 外部资源与公式渲染器 / External assets & FormulaRenderer

**中文** — 若插件需要外部资源（CSS、字体、wasm），必须从
`globalThis.__MP_EXT_BASE__` 拼出 URL（主程序会在导入前把它设为插件部署源），
并仅在全局缺失时回退到 `import.meta.url`：

**English** — If a plugin fetches **external assets** (CSS, fonts, wasm), it
must compose the URL from `globalThis.__MP_EXT_BASE__` (the host sets this to the
plugin's deployed origin before importing), falling back to `import.meta.url`
only when the global is absent:

```ts
const hostBase = (globalThis as { __MP_EXT_BASE__?: string }).__MP_EXT_BASE__;
const assetBase =
  (hostBase ? hostBase.replace(/\/?$/, '/') : new URL('../../assets/', import.meta.url).href)
  + 'assets/';
```

**公式渲染器 / Formula renderer:** `latex` 插件不新增形状或工具，而是贡献一个
`FormulaRenderer`，让内置标签里的 `$...$` 片段由 KaTeX 排版。这样内核保持极简
（不含排版依赖），而标签内的 `$...$` 数学自然生效。

**The `latex` plugin adds no shape or tool** — it contributes a `FormulaRenderer`
so `$...$` segments inside built-in labels are typeset by KaTeX. This keeps the
core minimal (no typesetting dependency) while `$...$` math in labels just works.

```ts
export interface FormulaRenderer {
  css(): string;        // 注入页面的 KaTeX CSS / KaTeX CSS injected once
  toHTML(tex: string): string; // TeX -> HTML / TeX to HTML
}
// 使用 / usage: mp.setFormulaRenderer(latexFormulaRenderer);
```

---

## 9. 构建与打包 / Build & bundle

**中文** — 插件以多文件 TS 编写，但构建会把每个插件打包成单个 ES 模块。共享工具
（`shared/geom`、`shared/style`）与任意 npm 依赖（如 `katex`）都会被 esbuild 内联。

**English** — Plugins are authored as multi-file TS, but the build bundles each
into a single ES module. Shared helpers (`shared/geom`, `shared/style`) and any
npm dependency (e.g. `katex`) are inlined by esbuild.

```bash
npm install
npm run build
# 等价步骤 / equivalent steps:
#   1. 生成 vendor/katex（拷贝 katex.mjs / katex.min.css / woff2 字体，已 gitignore）
#   2. 用 esbuild 把每个插件打包为 dist/<name>/index.js（bundle:true, esm, browser）
#   3. 复制 KaTeX CSS/字体与 plugins.json 到 dist/
```

构建产物 / Output:

```
dist/
  arrow/index.js        # 自包含 ES 模块 / self-contained ES module
  latex/index.js
  vendor/katex/...      # KaTeX CSS + woff2 字体（运行时按需加载）
  plugins.json          # 官方索引 / official index
```

> 运行时**不要依赖相对导入**：主程序通过 Blob URL 加载，相对路径会解析失败。esbuild
> 已内联它们。
> **Do not rely on runtime relative imports**: the host loads via a blob URL,
> where relative paths fail to resolve — esbuild inlines them.

---

## 10. 官方索引与托管 / Official index & hosting

**中文** — 根目录的 `plugins.json` 是官方插件索引，部署到
`dist/plugins.json`，主程序插件面板（`EXT` 按钮或 `` ` `` 键）从
`https://mp-ext.doi.l.cd/plugins.json` 自动拉取（`math-painter:plugin-base`
localStorage 可改为镜像地址）。第三方插件则按任意 URL 导入，导入前会给出明确的
「第三方代码以完整页面权限运行」警告。

**English** — The root `plugins.json` is the official index, deployed to
`dist/plugins.json`. The app's **Plugins** panel (`EXT` button or the `` ` ``
key) fetches it from `https://mp-ext.doi.l.cd/plugins.json` (overridable via the
`math-painter:plugin-base` localStorage setting). Third-party plugins are
imported by URL from anywhere; importing shows a clear warning that third-party
code runs with full page privileges.

```json
[
  {
    "name": "arrow",
    "title": "Arrow",
    "description": "Directed arrow / vector tool.",
    "version": "1.0.1",
    "minApi": 1,
    "entry": "arrow/index.js",
    "author": "doing-1024"
  },
  {
    "name": "latex",
    "title": "LaTeX",
    "description": "KaTeX formula renderer for built-in labels.",
    "version": "1.0.1",
    "minApi": 1,
    "entry": "latex/index.js",
    "author": "doing-1024"
  }
]
```

**部署 / Deploy** （Cloudflare Pages）：构建命令 `npm install && npm run build`，
输出目录 `dist`。或用 CLI：`npx wrangler pages deploy dist`。部署后的 Base URL 必须与
主程序预期一致（默认 `https://mp-ext.doi.l.cd`）。
**Deploy (Cloudflare Pages):** build command `npm install && npm run build`,
output directory `dist`. Or CLI: `npx wrangler pages deploy dist`. The deployed
base URL must match what the app expects (default `https://mp-ext.doi.l.cd`).

---

## 11. 完整示例：arrow / Worked example: arrow

**`plugins/arrow/index.ts`** — 入口 / entry:

```ts
import type { MathPainter } from '../../shared/types.js';
import { arrowShapeDef } from './arrow-shape.js';
import { ArrowTool } from './arrow-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(arrowShapeDef);
  mp.registerTool(new ArrowTool());
  mp.bindKey('y', 'arrow'); // 绑定右侧空闲键 / bind a free right-half key
}
```

**`plugins/arrow/arrow-shape.ts`** — 形状（节选）/ shape (excerpt):

```ts
export const arrowShapeDef: ShapeDefinition<ArrowShape> = {
  type: 'arrow',
  anchors: (s) => [s.a],                 // 仅尾端抓取点，避免遮挡箭头 / tail only
  hit: (s, world, tol) => distToSegment(world, s.a, s.b) < tol,
  draw: (ctx, s, opts) => {
    ctx.strokeStyle = s.style.stroke;
    ctx.lineWidth = (opts.active ? 2.5 : 1.5) / opts.scale; // 用 scale 换算 / scale-aware
    ctx.beginPath();
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
    ctx.stroke();
    // ... 画箭头头部 / draw arrowhead
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

**`plugins/arrow/arrow-tool.ts`** — 工具（节选）/ tool (excerpt):

```ts
export class ArrowTool implements Tool {
  id = 'arrow';
  label = 'Y';          // 工具栏显示按键 / show the key on the toolbar
  cursor = 'crosshair';
  private start: Vec | null = null;
  private preview: Vec | null = null;

  pointerDown(ctx: EditorContext, e: PointerInput): void {
    if (!this.start) {
      this.start = ctx.snap(e.rawWorld);  // 吸附 / snap
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

---

## 12. 完整示例：LaTeX / Worked example: LaTeX

**中文** — `latex` 插件只贡献公式渲染器，让内置标签支持 `$...$` 数学，不新增形状或工具：

**English** — The `latex` plugin only contributes a formula renderer so built-in
labels support `$...$` math — no shape or tool added:

```ts
import type { MathPainter } from '../../shared/types.js';
import { latexFormulaRenderer } from './katex-render.js';

export default function activate(mp: MathPainter): void {
  mp.setFormulaRenderer(latexFormulaRenderer); // 无形状、无工具、无按键 / no shape/tool/key
}
```

`katex-render.ts` 用 `globalThis.__MP_EXT_BASE__` 拼出 KaTeX CSS 与字体地址（见第 8 节），
把 `$...$` TeX 通过 `katex.renderToString` 转成 HTML。
`katex-render.ts` composes the KaTeX CSS/font URL from `globalThis.__MP_EXT_BASE__`
(see §8) and turns `$...$` TeX into HTML via `katex.renderToString`.

---

## 13. 发布清单 / Publishing checklist

**中文**
1. 在 `plugins/` 下新增 `plugins/<name>/`，复制 `arrow` 作为起点。
2. 编辑 `mp.config.json`：唯一 `name`、正确的 `entry`、合适的 `minApi`。
3. 实现 `index.ts` 的 `activate(mp)`、形状定义与工具。
4. 若用到外部资源，按第 8 节用 `globalThis.__MP_EXT_BASE__` 拼 URL。
5. 在根 `plugins.json` 增加条目（注意 `entry` 为 `<name>/index.js`）。
6. `npm install && npm run build` 验证构建，确认 `dist/<name>/index.js` 无相对导入。
7. 部署 `dist/` 到 Cloudflare Pages（构建 `npm install && npm run build`，输出 `dist`）。
8. 推送 main，触发自动部署；主程序面板即可一键安装。

**English**
1. Add `plugins/<name>/` under `plugins/`, copying `arrow` as a starting point.
2. Edit `mp.config.json`: unique `name`, correct `entry`, sensible `minApi`.
3. Implement `activate(mp)` in `index.ts` plus your shape definition and tool.
4. If you need external assets, compose URLs from `globalThis.__MP_EXT_BASE__` (§8).
5. Add an entry to the root `plugins.json` (`entry` is `<name>/index.js`).
6. Run `npm install && npm run build`; verify `dist/<name>/index.js` has no
   relative imports.
7. Deploy `dist/` to Cloudflare Pages (build `npm install && npm run build`,
   output `dist`).
8. Push to `main` to trigger the deploy; the app's panel can then install it
   with one click.

---

## 版本与兼容 / Versioning & compatibility

**中文** — 主程序只在 `API_VERSION` 发生破坏性变更时抬高它。若你新增了插件需要的
能力，请先在 `shared/types.ts`（与主程序 `src/core/extension.ts` 保持同步）调整契约，
并把插件的 `minApi` 设为所需版本；加载器会拒绝安装需要更新 API 的插件。
保持 `shared/types.ts` 与主程序冻结 API **始终一致**。

**English** — The host only bumps `API_VERSION` on a breaking change. If you need
a new capability, adjust the contract in `shared/types.ts` (kept in sync with the
host's `src/core/extension.ts`), and set your plugin's `minApi` to the required
version; the loader refuses to install a plugin that needs a newer API. Keep
`shared/types.ts` **in sync** with the host's frozen API at all times.
