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

Each plugin is **multi-file TypeScript** for maintainability; imports use the
`.js` extension so the compiled output is native ES modules the browser loads
directly (no bundler step). The host app only depends on `shared/types.ts`,
which mirrors `math-painter/src/core/extension.ts` — keep the two in sync.

## Add a plugin

1. Copy `plugins/arrow` to `plugins/<your-name>`.
2. Edit `mp.config.json` (unique `name`, `entry: "plugins/<your-name>/index.js"`,
   `minApi` ≤ current `API_VERSION`).
3. Implement `index.ts` (`export default function activate(mp)`), your
   `ShapeDefinition`, and your `Tool`.
4. Add an entry to `plugins.json`.

## Build & deploy

```bash
npm install
npm run build        # tsc -> dist/, copies plugins.json into dist/
```

Deploy `dist/` to Cloudflare Pages:

- Dashboard: connect this repo, build command `npm install && npm run build`,
  output directory `dist`.
- Or CLI: `npx wrangler pages deploy dist`.

The deployed base URL must match what the app expects
(`https://ext.math-painter.pages.dev` by default; overridable in-app via the
`math-painter:plugin-base` localStorage setting for mirrors).
