import type { Tool, EditorContext, PointerInput, MathPainter } from '../../shared/types.js';

/** Trigger a browser download for the given blob. */
function download(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export tool: on activation it opens a small choice (SVG / PNG) and downloads
 * the current scene. Both formats are white-background and auto-cropped to the
 * content bounds. The tool captures `mp` so it can call the host's render API.
 */
export class ExportTool implements Tool {
  id = 'export';
  label = 'P';
  cursor = 'default';

  constructor(private readonly mp: MathPainter) {}

  activate(ctx: EditorContext): void {
    void (async () => {
      const choice = await ctx.promptChoice('导出 / Export', [
        { key: 's', label: 'SVG' },
        { key: 'p', label: 'PNG' },
      ]);
      if (choice === 's') {
        const svg = this.mp.renderSVG({ background: '#ffffff', ink: '#000000' });
        download('math-painter.svg', new Blob([svg], { type: 'image/svg+xml' }));
        ctx.setStatus('EXPORT: svg');
      } else if (choice === 'p') {
        const canvas = this.mp.renderCanvas({ background: '#ffffff', ink: '#000000' });
        if (!canvas) {
          ctx.setStatus('EXPORT: empty');
          return;
        }
        canvas.toBlob((blob) => {
          if (blob) {
            download('math-painter.png', blob);
            ctx.setStatus('EXPORT: png');
          }
        }, 'image/png');
      }
    })();
  }

  // Required by the Tool interface but unused: export is a one-shot action.
  pointerDown(_ctx: EditorContext, _e: PointerInput): void {}
}
