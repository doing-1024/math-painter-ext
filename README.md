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

## Plugin development guide / 插件开发文档

A full bilingual (中文 / English) guide covering the frozen API, `ShapeDefinition`,
`Tool`, `EditorContext`, external-asset URLs, the build, and the official index
lives in **[PLUGINS.md](./PLUGINS.md)**. Read it before authoring a plugin.

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

插件开发完整文档（中英文双语）见 **[PLUGINS.md](./PLUGINS.md)**。
