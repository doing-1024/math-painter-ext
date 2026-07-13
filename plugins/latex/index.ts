import type { MathPainter } from '../../shared/types.js';
import { latexShapeDef } from './latex-shape.js';
import { LaTeXTool } from './latex-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(latexShapeDef);
  mp.registerTool(new LaTeXTool());
  // 'm' = math. Bound to a free key; built-in bindings take precedence.
  mp.bindKey('m', 'latex');
}
