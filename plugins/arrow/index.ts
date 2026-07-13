import type { MathPainter } from '../../shared/types.js';
import { arrowShapeDef } from './arrow-shape.js';
import { ArrowTool } from './arrow-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerShape(arrowShapeDef);
  mp.registerTool(new ArrowTool());
  // Bind to a free left-half key. Built-in bindings take precedence, so if a
  // future core tool claims 'y' this simply won't fire.
  mp.bindKey('y', 'arrow');
}
