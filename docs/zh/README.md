# math-painter 插件开发文档（中文）

欢迎！本目录是 **math-painter 插件**的官方中文开发文档。math-painter 内核刻意
保持极简，所有内核之外的形状与工具都以**插件**形式按需加载，从而保证冷启动足够快。

## 目录

- [快速上手](./quickstart.md) — 复制模板、改清单、实现、构建、在应用里安装，最快跑通第一个插件。
- [API 参考](./api.md) — 冻结的 `MathPainter` 接口，以及 `ShapeDefinition`、`Tool`、`EditorContext`、`FormulaRenderer` 的完整契约。
- [示例](./examples.md) — `arrow`（形状 + 工具）与 `latex`（仅贡献公式渲染器）两个完整可运行示例。

## 仓库

- 插件仓库：<https://github.com/doing-1024/math-painter-ext>
- 主程序：<https://github.com/doing-1024/math-painter>
- 部署 Base URL：`https://mp-ext.doi.l.cd`（可在应用内用 `math-painter:plugin-base` localStorage 改为镜像）

## 一句话原理

插件是一个默认导出 `activate(mp)` 的 ES 模块；它只通过**冻结的 `MathPainter` 接口**
注册形状、工具、快捷键与（可选）公式渲染器。内核可自由重构，只要这个接口不变，
已发布的插件就能继续工作。

```ts
import type { MathPainter } from '../shared/types.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(myShapeDef);
  mp.registerTool(new MyTool());
  mp.bindKey('y', 'my-tool');
}
```

不确定从哪看起？直接打开 [快速上手](./quickstart.md)。
