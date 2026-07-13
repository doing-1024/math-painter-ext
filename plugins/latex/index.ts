import type { MathPainter } from '../../shared/types.js';
import { latexFormulaRenderer } from './katex-render.js';

// The LaTeX plugin does not add a separate shape or tool: it contributes a
// formula renderer to the built-in label, so any label text with `$...$`
// segments is typeset by KaTeX. This keeps the core minimal (no typesetting
// dependency) while `$$`-free single-`$` math just works in labels.
export default function activate(mp: MathPainter): void {
  mp.setFormulaRenderer(latexFormulaRenderer);
}
