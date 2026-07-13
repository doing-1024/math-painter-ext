# Quick Start (English)

This guide gets your first plugin running in math-painter in a few minutes and
installed with one click from the app.

## 1. Prerequisites

- Node.js (18+) and npm.
- Clone the plugin repo:

```bash
git clone https://github.com/doing-1024/math-painter-ext.git
cd math-painter-ext
npm install
```

## 2. Copy the template

The easiest start is to copy the existing `arrow` plugin:

```bash
cp -r plugins/arrow plugins/my-tool
```

## 3. Edit the plugin manifest (mp.config.json)

Open `plugins/my-tool/mp.config.json` and set your own metadata:

```json
{
  "name": "my-tool",
  "title": "My Tool",
  "description": "An example plugin.",
  "version": "1.0.0",
  "minApi": 1,
  "entry": "plugins/my-tool/index.js",
  "author": "your-name"
}
```

| Field | Meaning |
| --- | --- |
| `name` | Unique id, used as the `toolId` when bound |
| `title` | Display name in the panel |
| `version` | Semver; used by the update checker |
| `minApi` | Minimum `API_VERSION` required (currently 1) |
| `entry` | Entry path, always `plugins/<name>/index.js` |
| `author` | Author |

## 4. Implement the plugin

Edit `plugins/my-tool/index.ts` and register your content in `activate(mp)`:

```ts
import type { MathPainter } from '../../shared/types.js';
import { myShapeDef } from './my-shape.js';
import { MyTool } from './my-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(myShapeDef);
  mp.registerTool(new MyTool());
  mp.bindKey('y', 'my-tool'); // bind a free right-half key
}
```

- Shape lives in `my-shape.ts` (implement `ShapeDefinition`).
- Tool lives in `my-tool.ts` (implement `Tool`).
- Use a free right-half key (`y`, `m`, …) — all left-half keys are taken by built-ins.
- Set `Tool.label` to your key (e.g. `'Y'`) so the toolbar does not fall back to
  the id's first letter.

See the [API Reference](./api.md) for the full contracts.

## 5. Build

```bash
npm run build
```

The build bundles each plugin into a single self-contained ES module at
`dist/<name>/index.js`, and copies KaTeX assets and `plugins.json` into `dist/`.
Verify that `dist/my-tool/index.js` has **no runtime relative imports** (esbuild
inlines them).

## 6. Deploy to Cloudflare Pages

1. Connect this repo in Cloudflare Pages.
2. Build command: `npm install && npm run build`.
3. Output directory: `dist`.
4. Push `main` to trigger the deploy; the deployed Base URL must be
   `https://mp-ext.doi.l.cd` (or the mirror you set in-app).

## 7. Install in the app

1. Open the math-painter host app (default `http://localhost:5173`).
2. Press `` ` `` or click the `EXT` button to open the **Plugins** panel.
3. The panel auto-fetches the official list; find your plugin and click
   **Install**.
4. The shape/tool appears in the toolbar immediately and the hotkey works.

## 8. Local debugging tips

- **Debug without deploying**: use the panel's "third-party URL import" and paste
  a local bundle URL to skip deployment. `entry` in `plugins.json` controls the
  load address.
- **Version & updates**: bump `version` in `mp.config.json` after changes; the app
  shows an update reminder (top-right toast) on next launch.
- **External assets**: if your plugin loads CSS/fonts/wasm, compose the URL from
  `globalThis.__MP_EXT_BASE__` (see "External assets" in the
  [API Reference](./api.md)); under blob-URL loading, relative paths fail.

## FAQ

**Q: The toolbar button shows the wrong letter?**
A: Set `Tool.label` to your hotkey (e.g. `'Y'`) instead of relying on the id's
first letter.

**Q: Plugin fails to load with a "relative import" error?**
A: The host loads one bundled file via a blob URL, so there can be no runtime
relative imports. Ensure `npm run build` inlines dependencies (`bundle: true`).

**Q: My hotkey does nothing?**
A: Left-half keys are taken by built-ins; use a free right-half key. Built-in
bindings take precedence over plugin bindings.

Next: read the [API Reference](./api.md) for the full contracts, or copy the
complete code from [Examples](./examples.md).
