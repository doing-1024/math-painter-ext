import type { Vec } from './types.js';

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);
export const normalize = (v: Vec): Vec => {
  const d = dist(v, { x: 0, y: 0 }) || 1;
  return { x: v.x / d, y: v.y / d };
};
export const projectOnSegment = (p: Vec, a: Vec, b: Vec): Vec => {
  const ab = sub(b, a);
  const denom = ab.x * ab.x + ab.y * ab.y || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / denom));
  return { x: a.x + ab.x * t, y: a.y + ab.y * t };
};
export const distToSegment = (p: Vec, a: Vec, b: Vec): number => dist(p, projectOnSegment(p, a, b));
