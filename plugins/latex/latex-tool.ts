import type { Tool, EditorContext, PointerInput, Overlay, Vec } from '../../shared/types.js';
import type { LaTeXLabelShape } from './latex-shape.js';
import { DEFAULT_STYLE } from '../../shared/style.js';
import { setRedraw } from './katex-render.js';

export class LaTeXTool implements Tool {
  id = 'latex';
  label = 'M';
  cursor = 'text';

  activate(ctx: EditorContext): void {
    // Let async-rendered labels trigger a repaint while this tool is active.
    setRedraw(() => ctx.draw());
  }

  pointerDown(ctx: EditorContext, e: PointerInput): void {
    const at: Vec = ctx.snap(e.rawWorld);
    ctx.promptText('LaTeX (e.g. $\\alpha$):', '$\\alpha$').then((text) => {
      if (text === null) return; // Esc / blur
      const tex = text.trim();
      if (!tex) return;
      ctx.add({ id: ctx.idgen.next(), type: 'latex', tex, at, style: { ...DEFAULT_STYLE } } as LaTeXLabelShape);
    });
  }

  drawOverlay(o: Overlay): void {
    // No rubber-band preview; the label appears once text is entered.
  }
}
