# math-painter-ext

Official plugin repository for [math-painter](https://github.com/doing-1024/math-painter).
Plugins here are built to static ES modules and hosted on Cloudflare Pages; the
app's **Plugins** panel fetches `plugins.json` and installs them with one click.

## Layout

```
plugins/<name>/
  mp.config.json     # { name, title, description, version, minApi, entry, author }
  index.ts           # export default function activate(mp: MathPainter)
  <shape>.ts         # a ShapeDefinition
  <tool>.ts          # a Tool
shared/
  types.ts           # the frozen MathPainter / ShapeDefinition / Tool contract
  geom.ts            # small vector helpers
  style.ts           # DEFAULT_STYLE
plugins.json         # the official index (deployed to dist/plugins.json)
```

Each plugin is **multi-file TypeScript** for maintainability. The build bundles
it into a **single self-contained ES module** with esbuild, so the host app
loads one file (via a blob URL) with no runtime relative-import resolution.
Shared helpers and any npm dependency (e.g. `katex`) are inlined by the bundle.
External assets (CSS/fonts) are fetched from `globalThis.__MP_EXT_BASE__` — see
`math-painter/EXTENSIONS.md`. The host contract `shared/types.ts` mirrors
`math-painter/src/core/extension.ts` — keep the two in sync.

## Available plugins / 已有插件

| 插件 | 说明 |
| --- | --- |
| `arrow` | 带箭头的向量/有向线段工具（快捷键 `y`） |
| `latex` | 内置标签的 KaTeX 公式渲染器（无单独形状/工具），标签里写 `$...$` 即排版 |
| `export` | SVG / PNG 导出：白底黑字、自动裁剪到内容边界（快捷键 `P`，也有工具栏按钮） |

## Plugin development guide / 插件开发文档

Full plugin-development docs live in **[`docs/`](./docs/README.md)**, split by
language for the best experience:

- 中文: **[`docs/zh/`](./docs/zh/README.md)** — 快速上手 / API 参考 / 示例
- English: **[`docs/en/`](./docs/en/README.md)** — Quick Start / API Reference / Examples

Read them before authoring a plugin.

## Add a plugin

1. Copy `plugins/arrow` to `plugins/<your-name>`.
2. Edit `mp.config.json` (unique `name`, `entry: "<your-name>/index.js"`,
   `minApi` ≤ current `API_VERSION`).
3. Implement `index.ts` (`export default function activate(mp)`), your
   `ShapeDefinition`, and your `Tool`.
4. Add an entry to `plugins.json`.

## Build & deploy

```bash
npm install
npm run build        # esbuild bundles each plugin -> dist/<name>/index.js,
                      # copies KaTeX CSS/fonts + plugins.json into dist/
```

Deploy `dist/` to Cloudflare Pages:

- Dashboard: connect this repo, build command `npm install && npm run build`,
  output directory `dist`.
- Or CLI: `npx wrangler pages deploy dist`.

The deployed base URL must match what the app expects
(`https://mp-ext.doi.l.cd` by default; overridable in-app via the
`math-painter:plugin-base` localStorage setting for mirrors).

---

插件开发完整文档见 **[`docs/zh/`](./docs/zh/README.md)**（中文）与
**[`docs/en/`](./docs/en/README.md)**（English）。
