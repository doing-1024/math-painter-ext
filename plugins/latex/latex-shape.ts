import type { Shape, Vec, Style, ShapeDefinition, SVGContext } from '../../shared/types.js';
import { add, dist } from '../../shared/geom.js';
import { drawLatex, latexSVG } from './katex-render.js';

export interface LaTeXLabelShape extends Shape {
  type: 'latex';
  tex: string;
  at: Vec;
}

function isVec(v: unknown): v is Vec {
  return !!v && typeof v === 'object' && typeof (v as Vec).x === 'number' && typeof (v as Vec).y === 'number';
}

export const latexShapeDef: ShapeDefinition<LaTeXLabelShape> = {
  type: 'latex',
  anchors: () => [], // no dot over the math
  hit: (s, world, tol) => dist(world, s.at) < tol * 2,
  draw: (ctx, s, opts) => drawLatex(ctx, s.tex, s.at, s.style.stroke, opts.scale),
  translate: (s, d) => ({ ...s, at: add(s.at, d) }),
  nearest: (s, world) => ({ point: s.at, dist: dist(world, s.at) }),
  bbox: (s) => [s.at],
  toSVG: (s, { ink }) => latexSVG(s.tex, ink, s.at),
  parse: (value, id, style: Style) => {
    if (!value || typeof value !== 'object') return null;
    const v = value as Record<string, unknown>;
    if (v.type !== 'latex' || typeof v.tex !== 'string' || !v.tex.trim()) return null;
    if (!isVec(v.at)) return null;
    return { id, type: 'latex', tex: v.tex, at: v.at, style };
  },
};
