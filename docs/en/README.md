# math-painter Plugin Development Docs (English)

Welcome! This is the official English documentation for **math-painter plugins**.
math-painter keeps a deliberately minimal kernel; everything beyond the core
shapes and tools lives in **plugins**, loaded on demand so the cold start stays
fast.

## Contents

- [Quick Start](./quickstart.md) — copy the template, edit the manifest, implement, build, and install in the app. Get your first plugin running fast.
- [API Reference](./api.md) — the frozen `MathPainter` interface plus the full `ShapeDefinition`, `Tool`, `EditorContext`, and `FormulaRenderer` contracts.
- [Examples](./examples.md) — the `arrow` (shape + tool) and `latex` (renderer-only) worked examples.

## Official plugins

- `arrow` (key `y`), `latex` (formula renderer), `export` (key `P`, SVG/PNG export).
  See the root `plugins.json` and `README.md`.

## Repo

- Plugin repo: <https://github.com/doing-1024/math-painter-ext>
- Host app: <https://github.com/doing-1024/math-painter>
- Deploy Base URL: `https://mp-ext.doi.l.cd` (overridable via the in-app `math-painter:plugin-base` localStorage setting)

## The one-line mental model

A plugin is an ES module whose default export is `activate(mp)`; it registers
shapes, tools, keys, and (optionally) a formula renderer **only** through the
frozen `MathPainter` interface. The core may refactor freely; as long as this
surface is stable, published plugins keep working.

```ts
import type { MathPainter } from '../shared/types.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(myShapeDef);
  mp.registerTool(new MyTool());
  mp.bindKey('y', 'my-tool');
}
```

Not sure where to begin? Open [Quick Start](./quickstart.md).
