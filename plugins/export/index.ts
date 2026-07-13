import type { MathPainter } from '../../shared/types.js';
import { ExportTool } from './export-tool.js';

export default function activate(mp: MathPainter): void {
  mp.registerTool(new ExportTool(mp));
  // 'p' is a free right-half key (mnemonic: PNG / export / print). The export
  // tool shows as a toolbar button too, so teachers can click it.
  mp.bindKey('p', 'export');
}
