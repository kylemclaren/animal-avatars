/* Generates src/shapes.ts: each animal's head outline as SVG path data
   in a 100×100 box, the parts drawn behind it (a panda's ears, a
   chameleon's tail) and the markings printed on its front (stripes,
   muzzles, patches). Run with `node scripts/gen-shapes.mjs`.

   Outlines are unions of simple primitives (circles, ellipses, round
   capped tubes, rounded polygons); markings are polylines, so the
   renderer can place every point on the head's dome as it turns.
   Numbers are rounded to 0.01 to keep the strings short. */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const f = (n) => Math.round(n * 100) / 100;
const pt = (p) => `${f(p[0])} ${f(p[1])}`;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => mul(a, 1 / len(a));
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

/* ── Rounded polygon: every vertex replaced by a circular fillet ────── */
function roundedPolygon(points, radius) {
  const n = points.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = points[(i - 1 + n) % n];
    const v = points[i];
    const q = points[(i + 1) % n];
    const r = typeof radius === "function" ? radius(i) : radius;
    const u1 = norm(sub(p, v));
    const u2 = norm(sub(q, v));
    const cosA = u1[0] * u2[0] + u1[1] * u2[1];
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosA)));
    /* tangent distance from the vertex; clamped so neighbouring fillets
       never overlap */
    let t = r / Math.tan(alpha / 2);
    const maxT = Math.min(len(sub(p, v)), len(sub(q, v))) / 2 - 0.01;
    let rr = r;
    if (t > maxT) { t = maxT; rr = t * Math.tan(alpha / 2); }
    const a = add(v, mul(u1, t));
    const b = add(v, mul(u2, t));
    /* sweep: 1 when the corner turns clockwise on screen (y down) */
    const sweep = cross(sub(v, p), sub(q, v)) > 0 ? 1 : 0;
    out.push({ a, b, rr, sweep });
  }
  let d = `M${pt(out[0].a)}`;
  for (let i = 0; i < n; i++) {
    const s = out[i];
    d += `A${f(s.rr)} ${f(s.rr)} 0 0 ${s.sweep} ${pt(s.b)}`;
    const next = out[(i + 1) % n];
    d += `L${pt(next.a)}`;
  }
  return d + "Z";
}


const circleAt = (cx, cy, r) => `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`;
/* Tiger: a wide round head with two round ears. Its stripes, muzzle,
   inner ears and nose are markings, printed on the front like the face. */
const ellipseAt = (cx, cy, rx, ry) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`;
const tiger = ellipseAt(50, 58, 39, 34) + circleAt(23, 28, 12) + circleAt(77, 28, 12);
/* Markings are polylines, not path data: every point is placed on the
   head's dome each frame, so the print wraps round as the head turns. */
const ring = (cx, cy, rx, ry, n = 40) => {
  const out = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * 2 * Math.PI; out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
  return out;
};
const quad = (p0, c, p1, n = 10) => {
  const out = [];
  for (let i = 1; i <= n; i++) { const t = i / n, m = 1 - t; out.push([m * m * p0[0] + 2 * m * t * c[0] + t * t * p1[0], m * m * p0[1] + 2 * m * t * c[1] + t * t * p1[1]]); }
  return out;
};
/* a tapered stripe: wide at a (width w), a point at b */
function taper(a, b, w) {
  const d = norm(sub(b, a)), n = [-d[1] * w / 2, d[0] * w / 2];
  const l = add(a, n), r = sub(a, n), m = add(a, mul(sub(b, a), 0.55));
  return [l, ...quad(l, add(m, n), b), ...quad(b, sub(m, n), r)];
}
const tigerMarks = [
  { color: "#FFD9BE", polys: [ring(23, 29, 6.5, 6.5, 28), ring(77, 29, 6.5, 6.5, 28)] },
  { color: "#FFF6EC", polys: [ring(41, 75, 11.5, 11.5), ring(59, 75, 11.5, 11.5), ring(50, 82, 12, 9)] },
  { color: "#3B2418", polys: [
    taper([50, 20], [50, 39], 7.5), taper([39, 22], [42, 34], 5.5), taper([61, 22], [58, 34], 5.5),
    taper([8, 50], [24, 55], 6.5), taper([9, 64], [23, 65], 6),
    taper([92, 50], [76, 55], 6.5), taper([91, 64], [77, 65], 6)] },
  { color: "#FF8FA3", polys: [[[44.5, 66], ...quad([44.5, 66], [50, 63.5], [55.5, 66], 6), ...quad([55.5, 66], [52, 72], [50, 72], 4), ...quad([50, 72], [48, 72], [44.5, 66], 4)]] },
];

/* ── More animals ─────────────────────────────────────────────────── */
const shoelace = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
/* a closed outline wound like circleAt's arcs (clockwise on screen), so
   subpaths overlapping it union rather than cut a hole */
const cw = (pts) => (shoelace(pts) < 0 ? pts.slice().reverse() : pts);
const polyPath = (pts) => `M${cw(pts).map(pt).join("L")}Z`;
const cub = (p0, p1, p2, p3) => (t) => { const m = 1 - t; return [0, 1].map((k) => m * m * m * p0[k] + 3 * m * m * t * p1[k] + 3 * m * t * t * p2[k] + t * t * t * p3[k]); };
const lineFn = (a, b) => (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/* a tube round a centre line c(t), t in 0..1, width w(t), round caps */
function tube(c, w, n = 24) {
  const L = [], R = [];
  const dir = (t) => norm(sub(c(Math.min(1, t + 0.01)), c(Math.max(0, t - 0.01))));
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = c(t), d = dir(t), nr = [-d[1], d[0]], h = w(t) / 2;
    L.push(add(p, mul(nr, h)));
    R.push(sub(p, mul(nr, h)));
  }
  const cap = (t, from) => {
    const p = c(t), d = dir(t), h = w(t) / 2, a0 = Math.atan2(d[1], d[0]) + from;
    const out = [];
    for (let k = 1; k < 8; k++) { const a = a0 - (k * Math.PI) / 8; out.push([p[0] + h * Math.cos(a), p[1] + h * Math.sin(a)]); }
    return out;
  };
  return [...L, ...cap(1, Math.PI / 2), ...R.reverse(), ...cap(0, -Math.PI / 2)];
}
const ringRot = (cx, cy, rx, ry, rot, n = 40) => ring(0, 0, rx, ry, n).map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
const BLUSH = "rgba(255,110,150,0.42)";
const blush = (cy, dx = 17, rx = 6, ry = 3.4) => ({ color: BLUSH, polys: [ring(50 - dx, cy, rx, ry, 24), ring(50 + dx, cy, rx, ry, 24)] });

/* Elephant: a round head between two big round ears, a trunk curling up
   to the right at its tip. */
const trunkLine = cub([50, 56], [50, 74], [49, 91], [62, 86]);
const elephant = circleAt(50, 46, 27) + ellipseAt(21, 44, 17, 21) + ellipseAt(79, 44, 17, 21) + polyPath(tube(trunkLine, (t) => 15 - 6 * t));
const elephantMarks = [
  { color: "#F4B4C6", polys: [ringRot(22, 46, 10, 14, 0.12), ringRot(78, 46, 10, 14, -0.12)] },
  blush(55, 17),
  { color: "#7C91B8", polys: [0.42, 0.58, 0.74].map((t) => {
    const p = trunkLine(t), d = norm(sub(trunkLine(t + 0.01), trunkLine(t - 0.01))), nr = [-d[1], d[0]], h = 4.6 - 2.2 * t;
    return tube(lineFn(sub(p, mul(nr, h)), add(p, mul(nr, h))), () => 1.5, 6);
  }) },
];

/* Panda: a wide white head; the black ears are parts, behind it. */
const panda = ellipseAt(50, 56, 38, 33);
const pandaParts = circleAt(22, 28, 13) + circleAt(78, 28, 13);
const PANDA_INK = "#2B2B35";
const pandaMarks = [
  { color: PANDA_INK, polys: [ringRot(37, 57, 9.5, 12.5, 0.6), ringRot(63, 57, 9.5, 12.5, -0.6)] },
  blush(65, 22, 5.5, 3.2),
  { color: PANDA_INK, polys: [ring(50, 67.5, 5.5, 3.8, 28)] },
];

/* Bunny: a round head with two tall ears leaning a little apart. */
const earL = (w) => tube(cub([41, 40], [38, 26], [34, 14], [32, 6]), () => w, 16);
const earR = (w) => tube(cub([59, 40], [62, 26], [66, 14], [68, 6]), () => w, 16);
const bunny = circleAt(50, 62, 30) + polyPath(earL(15)) + polyPath(earR(15));
const bunnyMarks = [
  { color: "#FFB3C7", polys: [tube(cub([40, 36], [38, 26], [34.5, 16], [33, 10]), () => 7, 14), tube(cub([60, 36], [62, 26], [65.5, 16], [67, 10]), () => 7, 14)] },
  { color: "#EFE8FF", polys: [ring(44.5, 74, 7.5, 6.5), ring(55.5, 74, 7.5, 6.5)] },
  blush(67, 19),
  { color: "#FF8FA3", polys: [[[46, 67.5], ...quad([46, 67.5], [50, 65.5], [54, 67.5], 6), ...quad([54, 67.5], [51.5, 71.5], [50, 71.5], 4), ...quad([50, 71.5], [48.5, 71.5], [46, 67.5], 4)]] },
];

/* Chameleon: a round head under a rounded casque, turret eyes on the
   sides, a curled tail (a part) peeking out behind, lower right. */
const chameleon = ellipseAt(50, 58, 34, 29) + roundedPolygon([[31, 42], [50, 11], [69, 42]], 7) + circleAt(22, 50, 14) + circleAt(78, 50, 14);
/* the tail leaves from behind the head and winds inward, one and a bit
   turns, thinning as it goes, so the coil stays open */
const spiral = (t) => { const th = 0.85 * Math.PI - t * 2.35 * Math.PI, r = 16 - 12.5 * t; return [84 + r * Math.cos(th), 76 + r * Math.sin(th)]; };
const chameleonParts = polyPath(tube(spiral, (t) => 7.5 - 4.5 * t, 60));
const chameleonMarks = [
  { color: "#9BE7A0", polys: [ring(22, 50, 10.5, 10.5), ring(78, 50, 10.5, 10.5)] },
  { color: "#4DB85B", polys: [ring(22, 50, 8, 8), ring(78, 50, 8, 8)] },
  { color: "#9BE7A0", polys: [ring(22, 50, 6.2, 6.2), ring(78, 50, 6.2, 6.2)] },
  { color: "#D9F59C", polys: [tube(cub([22, 66], [30, 86], [70, 86], [78, 66]), (t) => 3.2 + 1.6 * Math.sin(Math.PI * t), 30)] },
  { color: "#3E9E4C", polys: [tube(lineFn([50, 17], [50, 40]), (t) => 3 - 1.4 * t, 8)] },
  { color: "#F4E36A", polys: [ring(40, 32, 2.2, 2.2, 16), ring(60, 32, 2.2, 2.2, 16), ring(44, 22, 1.6, 1.6, 16), ring(56, 22, 1.6, 1.6, 16), ring(33, 67, 2, 2, 16), ring(67, 67, 2, 2, 16)] },
  blush(62, 22, 4.8, 2.8),
];

const shapes = { tiger, elephant, panda, bunny, chameleon };

/* Parts drawn behind the head with less depth than it. */
const parts = { panda: pandaParts, chameleon: chameleonParts };

const markings = { tiger: tigerMarks, elephant: elephantMarks, panda: pandaMarks, bunny: bunnyMarks, chameleon: chameleonMarks };

let ts = `/* Generated by scripts/gen-shapes.mjs — do not edit by hand. Head
   outlines, parts and markings in a 100×100 box. */

import type { AnimalAvatarType } from './types';

export const SHAPE_PATHS: Record<AnimalAvatarType, string> = {
`;
for (const [k, v] of Object.entries(shapes)) ts += `  ${k}: '${v}',\n`;
ts += "};\n\n/** Parts drawn behind the head with a fraction of its depth. */\nexport const SHAPE_PARTS: Partial<Record<AnimalAvatarType, string>> = {\n";
for (const [k, v] of Object.entries(parts)) ts += `  ${k}: '${v}',\n`;
ts += "};\n\n/** Markings (stripes, muzzles) printed on the front under the face: a colour and its outlines, each a flat x, y list. */\nexport const SHAPE_MARKINGS: Partial<Record<AnimalAvatarType, { color: string; polys: number[][] }[]>> = {\n";
const flat = (poly) => `[${poly.map((q) => `${f(q[0])},${f(q[1])}`).join(",")}]`;
for (const [k, v] of Object.entries(markings)) ts += `  ${k}: [\n${v.map((m) => `    { color: '${m.color}', polys: [${m.polys.map(flat).join(", ")}] },\n`).join("")}  ],\n`;
ts += "};\n";

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(resolve(here, "../src/shapes.ts"), ts);
console.log("wrote src/shapes.ts", Object.keys(shapes).join(", "));
