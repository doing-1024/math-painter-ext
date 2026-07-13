# 快速上手（中文）

本指南带你在几分钟内跑通第一个插件，并在 math-painter 主程序里一键安装。

## 1. 前置条件

- 安装 Node.js（建议 18+）与 npm。
- 克隆插件仓库：

```bash
git clone https://github.com/doing-1024/math-painter-ext.git
cd math-painter-ext
npm install
```

## 2. 复制模板

最简单的方式是复制已有的 `arrow` 插件作为起点：

```bash
cp -r plugins/arrow plugins/my-tool
```

## 3. 编辑插件清单 mp.config.json

打开 `plugins/my-tool/mp.config.json`，改成你自己的元数据：

```json
{
  "name": "my-tool",
  "title": "My Tool",
  "description": "一个示例插件。",
  "version": "1.0.0",
  "minApi": 1,
  "entry": "plugins/my-tool/index.js",
  "author": "your-name"
}
```

| 字段 | 说明 |
| --- | --- |
| `name` | 唯一标识，用作绑定工具时的 `toolId` |
| `title` | 面板展示名 |
| `version` | 语义化版本，供更新检查使用 |
| `minApi` | 需要的最低 `API_VERSION`（当前为 1） |
| `entry` | 入口相对路径，固定为 `plugins/<name>/index.js` |
| `author` | 作者 |

## 4. 实现插件

编辑 `plugins/my-tool/index.ts`，在 `activate(mp)` 里注册你的内容：

```ts
import type { MathPainter } from '../../shared/types.js';
import { myShapeDef } from './my-shape.js';
import { MyTool } from './my-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(myShapeDef);
  mp.registerTool(new MyTool());
  mp.bindKey('y', 'my-tool'); // 绑定右侧空闲键
}
```

- 形状写在 `my-shape.ts`（实现 `ShapeDefinition`）。
- 工具写在 `my-tool.ts`（实现 `Tool`）。
- 快捷键使用右侧空闲键（`y`、`m` 等），因为左侧按键都已被内置占用。
- 把 `Tool.label` 设为你的按键（如 `'Y'`），工具栏才不会把插件工具回退成 id 首字母。

详细的接口契约见 [API 参考](./api.md)。

## 5. 构建

```bash
npm run build
```

构建会把每个插件用 esbuild 打包成单个自包含 ES 模块，输出到 `dist/<name>/index.js`，
并复制 KaTeX 资源与 `plugins.json` 到 `dist/`。请确认 `dist/my-tool/index.js` 中
**没有运行时相对导入**（esbuild 已内联）。

## 6. 部署到 Cloudflare Pages

1. 在 Cloudflare Pages 连接本仓库。
2. 构建命令：`npm install && npm run build`。
3. 输出目录：`dist`。
4. 推送 `main` 触发自动部署，部署后的 Base URL 必须是
   `https://mp-ext.doi.l.cd`（或你在应用内设置的镜像）。

## 7. 在应用里安装

1. 打开 math-painter 主程序（默认 `http://localhost:5173`）。
2. 按 `` ` `` 键或点工具栏 `EXT` 打开**插件面板**。
3. 面板会自动拉取官方列表，找到你的插件，点**安装**。
4. 安装后形状/工具立即出现在工具栏，快捷键生效。

## 8. 本地调试技巧

- **未部署也能调试**：在插件面板里用「第三方 URL 导入」直接填 `http://localhost:xxxx/...`
  或本地打包产物路径，可跳过部署。`plugins.json` 里的 `entry` 决定了加载地址。
- **版本与更新**：改了代码就抬高 `mp.config.json` 里的 `version`，应用会在下次打开时
  弹出更新提醒（右上角 toast）。
- **外部资源**：若插件要加载 CSS/字体/wasm，必须用
  `globalThis.__MP_EXT_BASE__` 拼 URL（见 [API 参考](./api.md) 的「外部资源」一节），
  否则 Blob URL 加载下相对路径会解析失败。

## 常见问题

**Q：工具栏按钮显示成错误字母？**
A：给 `Tool` 设 `label` 为你的快捷键（如 `'Y'`），不要依赖 id 首字母回退。

**Q：插件加载报错「相对导入失败」？**
A：主程序通过 Blob URL 加载单个打包文件，运行时不能有相对导入。确认 `npm run build`
已把依赖内联（`bundle: true`）。

**Q：快捷键没反应？**
A：左侧按键被内置占用，改用右侧空闲键；内置绑定优先于插件绑定。

下一步：读 [API 参考](./api.md) 了解完整契约，或看 [示例](./examples.md) 抄完整代码。
