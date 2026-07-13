# API 参考（中文）

本页是插件可用的**完整契约**。所有接口都来自 `shared/types.ts`（它是主程序
`src/core/extension.ts` 的镜像，务必与之一致）。`API_VERSION` 当前为 `1`。

## MathPainter（插件唯一依赖的接口）

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

| 方法 | 说明 |
| --- | --- |
| `registerShape(def)` | 注册一个形状定义 |
| `registerTool(tool)` | 注册一个工具（自动出现在工具栏） |
| `bindKey(key, toolId)` | 把按键绑定到已注册的工具 |
| `setFormulaRenderer(r)` | 贡献一个公式渲染器（如 KaTeX）；传 `null` 可卸载 |

**快捷键约定**：所有左侧按键（v d s c b a g t w，以及动作 x r z e f q 1）都已被
内置占用，插件应使用右侧空闲键（如 `y`、`m`）。内置绑定优先于插件绑定。

## 共享类型 / Shared types

```ts
export interface Vec { x: number; y: number; }
export interface Style { stroke: string; fill: string; width: number; }
export interface Shape { id: string; type: string; style: Style; hidden?: boolean; }
export interface SVGContext { ink: string; }
export interface ShapeRenderOpts { scale: number; active: boolean; }
```

## ShapeDefinition（形状定义）

形状*拥有*自己全部的行为，没有需要改动的中央 `switch`。

```ts
export interface ShapeDefinition<T extends Shape = Shape> {
  type: T['type'];
  anchors(shape: T): Vec[];                                  // 抓取点
  hit(shape: T, world: Vec, tolerance: number): boolean;     // 命中测试
  draw(ctx: CanvasRenderingContext2D, shape: T, opts: ShapeRenderOpts): void;
  translate(shape: T, delta: Vec): T;                        // 平移
  nearest(shape: T, world: Vec): { point: Vec; dist: number };
  bbox(shape: T): Vec[];                                     // 选择框采样点
  toSVG(shape: T, ctx: SVGContext): string;                  // 导出 SVG
  parse(value: unknown, id: string, style: Style): T | null; // 解析场景文件
  edgeAt?(shape: T, world: Vec): { a: Vec; b: Vec } | null;  // 可选：边
  cascadeIds?(shape: T): string[];                           // 可选：级联删除
}
```

关键约定：

- **`draw` 必须使用 `opts.scale`** 把屏幕像素换算为世界单位（线宽、箭头大小等除以
  `scale`），使视觉尺寸不随缩放变化。
- **`parse` 必须在格式不符时返回 `null`**，否则会破坏场景文件导入。
- **锚点（`anchors`）会渲染成抓取点**；若不想在末端显示抓取点（如箭头头部），不要把它
  列入。

## Tool（工具）

```ts
export interface Tool {
  id: string;
  label?: string;   // 工具栏标签（建议设为按键，避免回退到 id 首字母）
  cursor?: string;  // CSS 光标
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

- **`label` 建议设为该工具的按键**（例如 arrow 设为 `'Y'`），避免与内置标签撞车。
- **`PointerInput`** 提供 `client`、`rawWorld`、`button`、`shift`、`alt`、`ctrl`；
  `rawWorld` 是未吸附的世界坐标，工具应显式调用 `ctx.snap(rawWorld)`。
- **`drawOverlay`** 用 `Overlay` 画虚线、锚点、文本等预览；每次移动后调用 `ctx.draw()`
  触发重绘。

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

## EditorContext（编辑器上下文）

工具通过它与编辑器交互：

| 成员 | 用途 |
| --- | --- |
| `scene` | 当前场景（`shapes` 与 `order`） |
| `selection` | 选区（`list/has/set/clear/add/toggle`） |
| `viewport` | 视口（`x/y/scale`、`toWorld`、`zoomAt`） |
| `idgen.next()` | 生成唯一形状 id |
| `add(shape)` | 新增形状 |
| `replace(before, after)` | 用命令替换一组形状（可撤销） |
| `deleteShapes(ids)` | 删除 |
| `snap(world, extra?, exclude?)` | 吸附到锚点或边 |
| `draw()` | 请求重绘 |
| `setStatus(msg)` | 终态状态（触发重绘） |
| `setStatusText(msg)` | 每帧状态文本（不触发重绘） |
| `promptText(msg, def?)` | 非阻塞文本输入，回车返回文本/`null` 取消 |
| `promptChoice(title, opts)` | 选项菜单，返回所选 key 或 `null` |

> `promptText` 回车返回文本（空字符串表示不带标签创建），仅 `Esc`/失焦返回 `null`。
> 不要把空回车当作取消。

## FormulaRenderer（公式渲染器）

贡献给内置标签，让 `$...$` 片段被排版（如 KaTeX）。不新增形状或工具。

```ts
export interface FormulaRenderer {
  css(): string;        // 注入页面的 CSS（如 KaTeX @import）
  toHTML(tex: string): string; // TeX -> HTML
}
// 使用：mp.setFormulaRenderer(latexFormulaRenderer);
```

## 外部资源（External assets）

若插件要加载 CSS/字体/wasm，必须从 `globalThis.__MP_EXT_BASE__` 拼 URL（主程序会在
导入前把它设为插件部署源），仅在全局缺失时回退到 `import.meta.url`：

```ts
const hostBase = (globalThis as { __MP_EXT_BASE__?: string }).__MP_EXT_BASE__;
const assetBase =
  (hostBase ? hostBase.replace(/\/?$/, '/') : new URL('../../assets/', import.meta.url).href)
  + 'assets/';
```

## 版本与兼容

主程序只在 `API_VERSION` 发生破坏性变更时抬高它。若你新增了插件需要的能力，请先调整
`shared/types.ts`（与主程序 `src/core/extension.ts` 保持同步），并把插件的 `minApi`
设为所需版本；加载器会拒绝安装需要更新 API 的插件。保持 `shared/types.ts` 与主程序
冻结 API **始终一致**。
