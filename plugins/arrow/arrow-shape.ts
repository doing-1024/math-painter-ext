import type { Shape, Vec, Style, ShapeDefinition } from '../../shared/types.js';
import { add, sub, dist, distToSegment, projectOnSegment, normalize } from '../../shared/geom.js';

export interface ArrowShape extends Shape {
  type: 'arrow';
  a: Vec;
  b: Vec;
}

function isVec(v: unknown): v is Vec {
  return !!v && typeof v === 'object' && typeof (v as Vec).x === 'number' && typeof (v as Vec).y === 'number';
}

function head(b: Vec, dir: Vec, scale: number) {
  const len = 12 / scale;
  const ang = Math.atan2(dir.y, dir.x);
  const spread = Math.PI / 7;
  return {
    h1: { x: b.x - len * Math.cos(ang - spread), y: b.y - len * Math.sin(ang - spread) },
    h2: { x: b.x - len * Math.cos(ang + spread), y: b.y - len * Math.sin(ang + spread) },
  };
}

export const arrowShapeDef: ShapeDefinition<ArrowShape> = {
  type: 'arrow',
  // Only the tail gets a grab dot; an anchor at the head would cover the
  // arrowhead. The whole shaft stays selectable via the line hit-test.
  anchors: (s) => [s.a],
  hit: (s, world, tol) => distToSegment(world, s.a, s.b) < tol,
  draw: (ctx, s, opts) => {
    ctx.strokeStyle = s.style.stroke;
    ctx.lineWidth = (opts.active ? 2.5 : 1.5) / opts.scale;
    ctx.beginPath();
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
    ctx.stroke();
    const dir = normalize(sub(s.b, s.a));
    const { h1, h2 } = head(s.b, dir, opts.scale);
    ctx.beginPath();
    ctx.moveTo(s.b.x, s.b.y);
    ctx.lineTo(h1.x, h1.y);
    ctx.moveTo(s.b.x, s.b.y);
    ctx.lineTo(h2.x, h2.y);
    ctx.stroke();
  },
  translate: (s, d) => ({ ...s, a: add(s.a, d), b: add(s.b, d) }),
  nearest: (s, world) => {
    const p = projectOnSegment(world, s.a, s.b);
    return { point: p, dist: distToSegment(world, s.a, s.b) };
  },
  bbox: (s) => [s.a, s.b],
  toSVG: (s, { ink }) => {
    const dir = normalize(sub(s.b, s.a));
    const { h1, h2 } = head(s.b, dir, 1);
    const line = (x1: number, y1: number, x2: number, y2: number) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="1.5" fill="none"/>`;
    return line(s.a.x, s.a.y, s.b.x, s.b.y) + line(s.b.x, s.b.y, h1.x, h1.y) + line(s.b.x, s.b.y, h2.x, h2.y);
  },
  parse: (value, id, style: Style) => {
    if (!value || typeof value !== 'object') return null;
    const v = value as Record<string, unknown>;
    if (v.type !== 'arrow' || !isVec(v.a) || !isVec(v.b)) return null;
    return { id, type: 'arrow', a: v.a, b: v.b, style };
  },
};
