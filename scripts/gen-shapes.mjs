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

/* ── Primitives ─────────────────────────────────────────────────────── */
const circleAt = (cx, cy, r) => `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`;
const ellipseAt = (cx, cy, rx, ry) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`;
const shoelace = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
/* a closed outline wound like circleAt's arcs (clockwise on screen), so
   overlapping outlines always union rather than cut a hole */
const cw = (pts) => (shoelace(pts) < 0 ? pts.slice().reverse() : pts);
const polyPath = (pts) => `M${cw(pts).map(pt).join("L")}Z`;

/* Markings are polylines, not path data: every point is placed on the
   head's dome each frame, so the print wraps round as the head turns. */
const ring = (cx, cy, rx, ry = rx, n = 40) => {
  const out = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * 2 * Math.PI; out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
  return out;
};
const ringRot = (cx, cy, rx, ry, rot, n = 40) => ring(0, 0, rx, ry, n).map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
const quad = (p0, c, p1, n = 10) => {
  const out = [];
  for (let i = 1; i <= n; i++) { const t = i / n, m = 1 - t; out.push([m * m * p0[0] + 2 * m * t * c[0] + t * t * p1[0], m * m * p0[1] + 2 * m * t * c[1] + t * t * p1[1]]); }
  return out;
};
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
/* a tapered stripe: wide at a (width w), a point at b */
function taper(a, b, w) {
  const d = norm(sub(b, a)), n = [-d[1] * w / 2, d[0] * w / 2];
  const l = add(a, n), r = sub(a, n), m = add(a, mul(sub(b, a), 0.55));
  return [l, ...quad(l, add(m, n), b), ...quad(b, sub(m, n), r)];
}
/* a soft rounded-triangle nose, `w` wide and `h` tall, flat side up at `top` */
const nose = (cx, top, w, h) => {
  const l = [cx - w / 2, top], r = [cx + w / 2, top], b = [cx, top + h];
  return [l, ...quad(l, [cx, top - h * 0.42], r, 6), ...quad(r, [cx + w * 0.18, top + h], b, 4), ...quad(b, [cx - w * 0.18, top + h], l, 4)];
};
/* n circles of radius r on a ring of radius R about (cx, cy), from angle
   a0 to a1 in degrees (0 to the right, 90 down): a mane, a fleece */
const circlesOnRing = (cx, cy, R, r, n, a0, a1) => {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / (n - (a1 - a0 >= 360 ? 0 : 1))) * Math.PI) / 180;
    d += circleAt(f(cx + R * Math.cos(a)), f(cy + R * Math.sin(a)), r);
  }
  return d;
};
const BLUSH = "rgba(255,110,150,0.42)";
/* two cheeks, `dx` either side of `cx` */
const blush = (cx, cy, dx, rx = 6, ry = 3.4, color = BLUSH) => ({ color, polys: [ring(cx - dx, cy, rx, ry, 24), ring(cx + dx, cy, rx, ry, 24)] });
/* three whisker dots on each side of a muzzle */
const whiskerDots = (cx, cy, dx, color) => ({ color, polys: [[-1, -1.6], [-2.6, 1.2], [0.6, 1.8]].flatMap(([x, y]) => [ring(cx - dx + x, cy + y, 0.95, 0.95, 12), ring(cx + dx - x, cy + y, 0.95, 0.95, 12)]) });

/* a rounded polygon as a polyline, for markings: each corner a fillet
   of radius r (a number, or one per corner) */
function roundedPolyPts(points, radius, seg = 6) {
  const n = points.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = points[(i - 1 + n) % n], v = points[i], q = points[(i + 1) % n];
    const r = Array.isArray(radius) ? radius[i] : radius;
    const u1 = norm(sub(p, v)), u2 = norm(sub(q, v));
    const alpha = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    let t = r / Math.tan(alpha / 2), rr = r;
    const maxT = Math.min(len(sub(p, v)), len(sub(q, v))) / 2 - 0.01;
    if (t > maxT) { t = maxT; rr = t * Math.tan(alpha / 2); }
    const a = add(v, mul(u1, t)), b = add(v, mul(u2, t));
    const c = add(v, mul(norm(add(u1, u2)), rr / Math.sin(alpha / 2)));
    let a0 = Math.atan2(a[1] - c[1], a[0] - c[0]), a1 = Math.atan2(b[1] - c[1], b[0] - c[0]);
    let d = a1 - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    for (let k = 0; k <= seg; k++) { const th = a0 + (d * k) / seg; out.push([c[0] + rr * Math.cos(th), c[1] + rr * Math.sin(th)]); }
  }
  return out;
}
/* a seeded random, for shapes that should look hand-made but never change */
const seeded = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
/* a fuzzy ring: n tufts round a circle of radius R, each a pointed flame
   reaching out by about `amp` (every one a little different), its tip
   leaning round by `lean`, as if the fur were brushed */
function fuzzyRing(cx, cy, R, n, amp, seed, lean = 0.3, phase = 0, soft = 1.8) {
  const rnd = seeded(seed), out = [], per = 10, pk = 0.5 + lean / 2;
  for (let i = 0; i < n; i++) {
    const a = amp * (0.7 + 0.6 * rnd());
    for (let k = 0; k < per; k++) {
      const u = k / per, th = phase + (2 * Math.PI * (i + u)) / n - Math.PI / 2;
      const d = u < pk ? u / pk : (1 - u) / (1 - pk);
      /* soft < 1 rounds the tips; the ease keeps the valleys soft too */
      const e = d * d * (3 - 2 * d);
      const r = R + a * Math.pow(e, soft);
      out.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
    }
  }
  return out;
}

/* a ring of locks, for a mane: n tapered tufts leaving a disc of radius
   R, each curving round the same way as it goes out (so the whole mane
   swirls), with a soft round tip; lengths and bends vary a little */
function locks(cx, cy, R, n, reach, width, curl, seed, phase = 0) {
  const rnd = seeded(seed);
  let d = circleAt(cx, cy, R);
  for (let i = 0; i < n; i++) {
    const th = phase + (2 * Math.PI * i) / n - Math.PI / 2;
    const L = reach * (0.8 + 0.4 * rnd()), bend = curl * (0.8 + 0.4 * rnd());
    const out = [Math.cos(th), Math.sin(th)], side = [-Math.sin(th), Math.cos(th)];
    const at = (r, s) => [cx + out[0] * r + side[0] * s, cy + out[1] * r + side[1] * s];
    const p0 = at(R - 7, 0), p1 = at(R + L * 0.45, L * bend * 0.15), p2 = at(R + L * 0.8, L * bend * 0.55), p3 = at(R + L, L * bend);
    d += polyPath(tube(cub(p0, p1, p2, p3), (t) => width * (1 - 0.72 * t), 16));
  }
  return d;
}

/* ── Tiger ──────────────────────────────────────────────────────────── */
/* A wide round head with two round ears: stripes, a cream muzzle with
   whisker dots, peach inner ears, a pink nose. */
const tiger = ellipseAt(50, 58, 39, 34) + circleAt(23, 28, 12) + circleAt(77, 28, 12);
const tigerMarks = [
  { color: "#FFD9BE", polys: [ring(23, 29, 6.5, 6.5, 28), ring(77, 29, 6.5, 6.5, 28)] },
  { color: "#FFF6EC", polys: [ring(41, 75, 11.5), ring(59, 75, 11.5), ring(50, 82, 12, 9)] },
  whiskerDots(50, 77.5, 11.5, "#E2BD9A"),
  { color: "#3B2418", polys: [
    taper([50, 20], [50, 39], 7.5), taper([39, 22], [42, 34], 5.5), taper([61, 22], [58, 34], 5.5),
    taper([8, 50], [24, 55], 6.5), taper([9, 64], [23, 65], 6),
    taper([92, 50], [76, 55], 6.5), taper([91, 64], [77, 65], 6)] },
  { color: "#FF8FA3", polys: [nose(50, 66, 11, 6)] },
];

/* ── Elephant ───────────────────────────────────────────────────────── */
/* A round head between two big round ears, a trunk curling up to the
   right at its tip, with a few wrinkles across it. */
const trunkLine = cub([50, 56], [50, 74], [49, 91], [62, 86]);
const elephant = circleAt(50, 46, 27) + ellipseAt(21, 44, 17, 21) + ellipseAt(79, 44, 17, 21) + polyPath(tube(trunkLine, (t) => 15 - 6 * t));
const elephantMarks = [
  { color: "#F4B4C6", polys: [ringRot(22, 46, 9.5, 13.5, 0.12), ringRot(78, 46, 9.5, 13.5, -0.12)] },
  blush(50, 55, 17),
  { color: "#7C91B8", polys: [0.42, 0.58, 0.74].map((t) => {
    const p = trunkLine(t), d = norm(sub(trunkLine(t + 0.01), trunkLine(t - 0.01))), nr = [-d[1], d[0]], h = 4.6 - 2.2 * t;
    return tube(lineFn(sub(p, mul(nr, h)), add(p, mul(nr, h))), () => 1.5, 6);
  }) },
];

/* ── Panda ──────────────────────────────────────────────────────────── */
/* A wide white head; the black ears are parts, behind it. */
const panda = ellipseAt(50, 56, 38, 33);
const pandaParts = circleAt(22, 28, 13) + circleAt(78, 28, 13);
const PANDA_INK = "#2B2B35";
const pandaMarks = [
  { color: PANDA_INK, polys: [ringRot(37, 57, 9.5, 12.5, 0.6), ringRot(63, 57, 9.5, 12.5, -0.6)] },
  blush(50, 65, 22, 5.5, 3.2),
  { color: PANDA_INK, polys: [ring(50, 67.5, 5.5, 3.8, 28)] },
];

/* ── Bunny ──────────────────────────────────────────────────────────── */
/* A round head with two tall ears leaning a little apart. */
const earL = (w) => tube(cub([41, 40], [38, 26], [34, 14], [32, 6]), () => w, 16);
const earR = (w) => tube(cub([59, 40], [62, 26], [66, 14], [68, 6]), () => w, 16);
const bunny = circleAt(50, 62, 30) + polyPath(earL(15)) + polyPath(earR(15));
const bunnyMarks = [
  { color: "#FFB3C7", polys: [tube(cub([40, 36], [38, 26], [34.5, 16], [33, 10]), () => 7, 14), tube(cub([60, 36], [62, 26], [65.5, 16], [67, 10]), () => 7, 14)] },
  { color: "#EFE8FF", polys: [ring(44.5, 74, 7.5, 6.5), ring(55.5, 74, 7.5, 6.5)] },
  blush(50, 67, 19),
  { color: "#FF8FA3", polys: [nose(50, 67.5, 8, 4)] },
];

/* ── Chameleon ──────────────────────────────────────────────────────── */
/* A round head under a rounded casque, turret eyes on the sides, a
   curled tail (a part) peeking out behind, lower right. */
const chameleon = ellipseAt(50, 58, 34, 29) + roundedPolygon([[31, 42], [50, 11], [69, 42]], 7) + circleAt(22, 50, 14) + circleAt(78, 50, 14);
/* the tail leaves from behind the head and winds inward, one and a bit
   turns, thinning as it goes, so the coil stays open */
const spiral = (t) => { const th = 0.85 * Math.PI - t * 2.35 * Math.PI, r = 16 - 12.5 * t; return [84 + r * Math.cos(th), 76 + r * Math.sin(th)]; };
const chameleonParts = polyPath(tube(spiral, (t) => 7.5 - 4.5 * t, 60));
const chameleonMarks = [
  /* the turrets: ridged cones of skin round each eye */
  { color: "#9BE7A0", polys: [ring(22, 50, 11.2), ring(78, 50, 11.2)] },
  { color: "#4DB85B", polys: [ring(22, 50, 9.6), ring(78, 50, 9.6)] },
  { color: "#9BE7A0", polys: [ring(22, 50, 8.4), ring(78, 50, 8.4)] },
  { color: "#4DB85B", polys: [ring(22, 50, 7.3), ring(78, 50, 7.3)] },
  { color: "#D9F59C", polys: [tube(cub([22, 66], [30, 86], [70, 86], [78, 66]), (t) => 3.2 + 1.6 * Math.sin(Math.PI * t), 30)] },
  { color: "#3E9E4C", polys: [tube(lineFn([50, 17], [50, 40]), (t) => 3 - 1.4 * t, 8)] },
  { color: "#F4E36A", polys: [ring(40, 32, 2.2, 2.2, 16), ring(60, 32, 2.2, 2.2, 16), ring(44, 22, 1.6, 1.6, 16), ring(56, 22, 1.6, 1.6, 16), ring(33, 67, 2, 2, 16), ring(67, 67, 2, 2, 16)] },
  blush(50, 62, 22, 4.8, 2.8),
];

/* ── Penguin ────────────────────────────────────────────────────────── */
/* An egg of a head with a little curl of a crest; the white face is a
   heart, two lobes and a chin, dipping to a point between the eyes. The
   beak is its mouth. */
const penguin = ellipseAt(50, 55, 38, 36) + polyPath(tube(cub([49, 24], [45, 13], [52, 6], [59, 10]), (t) => 6.5 - 3.5 * t, 16));
const penguinMarks = [
  { color: "#F9F8FC", polys: [ring(38, 58, 16), ring(62, 58, 16), ring(50, 72, 23, 15)] },
  blush(50, 67, 17, 5, 3),
];

/* ── Pig ────────────────────────────────────────────────────────────── */
/* A wide head with two pointed ears tipping out, a big snout with two
   nostrils, a small smile under it. */
const pig = ellipseAt(50, 58, 38, 32) + roundedPolygon([[15, 41], [14, 12], [40, 27]], 5) + roundedPolygon([[85, 41], [60, 27], [86, 12]], 5);
const pigMarks = [
  { color: "#FF8DAE", polys: [ringRot(23, 28, 4, 8, -0.55), ringRot(77, 28, 4, 8, 0.55)] },
  blush(50, 64, 24, 5.5, 3.2),
  { color: "#FF8DAE", polys: [ring(50, 69, 12.5, 8.5)] },
  { color: "#D2537A", polys: [ringRot(45.3, 69, 2.1, 3.4, 0.18, 20), ringRot(54.7, 69, 2.1, 3.4, -0.18, 20)] },
];

/* ── Lion ───────────────────────────────────────────────────────────── */
/* A golden head with round ears, in a fuzzy mane of curling locks: a
   deep rust layer of long ones at the back and a lighter layer of shorter
   ones before it, all swirling the same way (parts, behind the head); a
   cream muzzle with whisker dots, a brown nose. */
const lion = circleAt(50, 57, 29) + circleAt(29, 35, 8) + circleAt(71, 35, 8);
const lionBack = [{ color: "#C4572A", depth: 0.45, d: locks(50, 56, 35, 26, 9.5, 15, 0.5, 7) }];
const lionParts = locks(50, 56, 31, 20, 6.5, 13.5, 0.5, 3, 0.16);
const lionMarks = [
  { color: "#EE9A4C", polys: [ring(29, 35, 4.2, 4.2, 24), ring(71, 35, 4.2, 4.2, 24)] },
  { color: "#FFF3DC", polys: [ring(43.5, 71, 8.5), ring(56.5, 71, 8.5)] },
  whiskerDots(50, 73, 8.5, "#E5B98A"),
  blush(50, 65, 20, 4.8, 2.8),
  { color: "#7A4330", polys: [nose(50, 64, 10, 6)] },
];

/* ── Octopus ────────────────────────────────────────────────────────── */
/* A tall dome of a head over a short skirt; five tentacles (parts)
   curl out from under it; lighter spots on top. */
const octopus = ellipseAt(50, 46, 34, 31) + ellipseAt(50, 64, 31, 14);
const tentacle = (p0, p1, p2, p3) => polyPath(tube(cub(p0, p1, p2, p3), (t) => 10 - 6 * t, 28));
const octopusParts =
  tentacle([24, 66], [13, 78], [4, 86], [6, 74]) +
  tentacle([36, 74], [34, 90], [24, 97], [19, 88]) +
  tentacle([50, 76], [50, 92], [58, 99], [62, 91]) +
  tentacle([64, 74], [69, 88], [80, 94], [83, 85]) +
  tentacle([76, 66], [87, 78], [96, 86], [94, 74]);
const octopusMarks = [
  { color: "#FFA9A2", polys: [ring(34, 26, 4), ring(49, 19, 2.8, 2.8, 20), ring(63, 25, 4.5), ring(72, 38, 2.6, 2.6, 20), ring(27, 39, 2.4, 2.4, 20), ring(57, 33, 1.9, 1.9, 16)] },
  blush(50, 62, 22, 5, 3),
];

/* ── Owl ────────────────────────────────────────────────────────────── */
/* A round head with two feather tufts sweeping up and out, tapering to
   a point (a triangle would read as a cat's ear); two cream facial discs,
   rimmed, big eyes in them, a small beak between. */
const tuftL = cub([32, 37], [27, 26], [21, 19], [14, 14]), tuftR = cub([68, 37], [73, 26], [79, 19], [86, 14]);
const owl = ellipseAt(50, 57, 37, 34) + polyPath(tube(tuftL, (t) => 19 - 14 * t, 24)) + polyPath(tube(tuftR, (t) => 19 - 14 * t, 24));
const owlMarks = [
  { color: "#DDB287", polys: [tube(cub([30, 33], [26.5, 25], [21.5, 20], [17, 16.5]), (t) => 5.5 - 3.5 * t, 16), tube(cub([70, 33], [73.5, 25], [78.5, 20], [83, 16.5]), (t) => 5.5 - 3.5 * t, 16)] },
  { color: "#8E5E3C", polys: [ring(37, 56, 17), ring(63, 56, 17)] },
  { color: "#F6E6CF", polys: [ring(37, 56, 15.3), ring(63, 56, 15.3)] },
  blush(50, 68, 21, 4.6, 2.8),
];

/* ── Sheep ──────────────────────────────────────────────────────────── */
/* The head is the fleece: a cloud of wool bumps over a face whose chin
   drops below it. The face is a peach patch with a scalloped top, where
   the fringe hangs over it; tan ears (parts) droop out from under the
   wool at the sides. */
const sheep = circleAt(50, 46, 28) + circlesOnRing(50, 46, 27, 13, 10, 160, 380) + ellipseAt(50, 63, 23, 25);
const sheepParts = polyPath(ringRot(17.5, 66, 12.5, 5, -0.3)) + polyPath(ringRot(82.5, 66, 12.5, 5, 0.3));
/* the face patch: the lower arc of the face's ellipse, closed along the
   top by three bumps of fringe bulging down into it */
const sheepFace = (() => {
  const cx = 50, cy = 63, rx = 23, ry = 25, a0 = (-25 * Math.PI) / 180, a1 = (205 * Math.PI) / 180;
  const out = [];
  for (let i = 0; i <= 40; i++) { const a = a0 + ((a1 - a0) * i) / 40; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  const [lx, ly] = out[out.length - 1], rxp = out[0][0];
  for (let k = 0; k < 3; k++) {
    for (let j = 1; j <= 10; j++) {
      const u = j / 10, x = lx + ((rxp - lx) * (k + u)) / 3;
      out.push([x, ly + 4.5 * Math.sin(Math.PI * u)]);
    }
  }
  return out;
})();
const sheepMarks = [
  { color: "#F6D1B6", polys: [sheepFace] },
  blush(50, 72, 13, 3.8, 2.3),
  { color: "#F59BB3", polys: [nose(50, 69.5, 6.5, 3.8)] },
];

/* ── Whale ──────────────────────────────────────────────────────────── */
/* A round body with its tail curling up behind on the right, a pale
   grooved belly, a long smile; the water spout is a part. */
const whale = ellipseAt(44, 58, 35, 29) + polyPath(tube(cub([66, 72], [82, 68], [89, 57], [88, 44]), (t) => 11 - 5 * t, 20)) +
  polyPath(ringRot(82.5, 37.5, 8, 4.2, 0.83)) + polyPath(ringRot(93.5, 38, 8, 4.2, -0.785));
const whaleParts = polyPath(tube(lineFn([44, 34], [44, 16]), () => 3.6, 8)) + circleAt(36, 12, 4.2) + circleAt(44, 7.5, 4.6) + circleAt(52, 12, 4.2) + circleAt(30.5, 18.5, 2.2) + circleAt(57.5, 18.5, 2.2);
const whaleMarks = [
  { color: "#D4F0FF", polys: [ring(44, 83, 28, 11)] },
  { color: "#A9DDF7", polys: [tube(cub([27, 80], [36, 82.5], [52, 82.5], [61, 80]), () => 1.4, 12), tube(cub([31, 85], [38, 87], [50, 87], [57, 85]), () => 1.4, 12)] },
  blush(44, 64, 18, 5, 3),
];

/* ── Monkey ─────────────────────────────────────────────────────────── */
/* A round brown head with big round ears at its sides; a peach face in
   a heart (two lobes round the eyes and a muzzle), two nostrils, a grin. */
const monkey = ellipseAt(50, 55, 32, 31) + circleAt(14, 56, 11) + circleAt(86, 56, 11);
const monkeyMarks = [
  { color: "#F2CBA6", polys: [ring(14, 56, 6.5), ring(86, 56, 6.5)] },
  { color: "#F7D8BA", polys: [ring(40, 54, 12.5), ring(60, 54, 12.5), ring(50, 69, 18, 14)] },
  blush(50, 64, 17, 4.6, 2.8),
  { color: "#6B4430", polys: [ringRot(47.3, 63.5, 1.3, 1.9, 0.3, 14), ringRot(52.7, 63.5, 1.3, 1.9, -0.3, 14)] },
];

/* ── Llama ──────────────────────────────────────────────────────────── */
/* A long face, fuller at the muzzle; a big fluffy topknot whose bangs
   hang over the forehead in scallops; banana ears curving out, pink
   inside; a long cream muzzle with a llama's slit nostrils. */
const llamaTuftAt = [[34, 35, 8], [41, 27, 9.5], [50, 23, 10.5], [59, 27, 9.5], [66, 35, 8], [39, 38, 8], [61, 38, 8], [50, 34, 11]];
const llamaEarL = cub([32, 40], [22, 31], [14, 21], [17, 9]), llamaEarR = cub([68, 40], [78, 31], [86, 21], [83, 9]);
const llamaEarW = (t) => 12 + 3.5 * Math.sin(Math.PI * t) - 5 * t;
const llama = ellipseAt(50, 58, 26, 31) + ellipseAt(50, 74, 21.5, 16) + llamaTuftAt.map(([x, y, r]) => circleAt(x, y, r)).join("") +
  polyPath(tube(llamaEarL, llamaEarW, 18)) + polyPath(tube(llamaEarR, llamaEarW, 18));
const llamaMarks = [
  { color: "#F2A9AE", polys: [tube(cub([30, 37], [23, 30], [17.5, 22], [19, 13]), (t) => 5.5 + 1.5 * Math.sin(Math.PI * t) - 2.5 * t, 14), tube(cub([70, 37], [77, 30], [82.5, 22], [81, 13]), (t) => 5.5 + 1.5 * Math.sin(Math.PI * t) - 2.5 * t, 14)] },
  { color: "#FFF4E4", polys: llamaTuftAt.map(([x, y, r]) => ring(x, y, r)) },
  { color: "#FFF0DC", polys: [ring(50, 76, 18.5, 14)] },
  blush(50, 67, 18, 4.6, 2.8),
  { color: "#6B4A3A", polys: [ringRot(46.2, 70, 1.1, 2.6, -0.6, 14), ringRot(53.8, 70, 1.1, 2.6, 0.6, 14)] },
];

/* ── Koala ──────────────────────────────────────────────────────────── */
/* A wide grey head with big round ears, fluffy pale insides, and a big
   dark nose down the middle. */
const koala = ellipseAt(50, 58, 34, 30) + circleAt(17, 36, 16) + circleAt(83, 36, 16);
const koalaMarks = [
  { color: "#F4EEF4", polys: [ring(17, 37, 10), ring(83, 37, 10)] },
  { color: "#C9C5D1", polys: [ring(50, 74, 16, 10)] },
  blush(50, 67, 23, 5, 3),
  { color: "#3A3442", polys: [ring(50, 63.5, 7, 9)] },
];

/* ── Fox ────────────────────────────────────────────────────────────── */
/* A round crown, cheeks that flare into pointed tufts of fur, a pointed
   chin; tall ears with black tips and soft cream insides. The lower face
   is white, rising under the eyes, with the orange coming down between
   them to the nose. */
/* listed clockwise on screen, like the head's arcs, so the two union */
const foxCheeks = [[77, 48], [95, 58], [83, 62], [93, 70], [75, 72], [61, 84], [50, 90], [39, 84], [25, 72], [7, 70], [17, 62], [5, 58], [23, 48]];
const foxEarL = [[16, 47], [19, 4], [46, 29]], foxEarR = [[84, 47], [54, 29], [81, 4]];
const fox = ellipseAt(50, 50, 31, 24) + roundedPolygon(foxCheeks, (i) => [6, 1.5, 3, 1.5, 4, 8, 7, 8, 4, 1.5, 3, 1.5, 6][i]) +
  roundedPolygon(foxEarL, 5.5) + roundedPolygon(foxEarR, 5.5);
const foxMarks = [
  { color: "#FFE9D8", polys: [roundedPolyPts([[21, 41], [21.5, 14], [40, 30]], 4), roundedPolyPts([[79, 41], [60, 30], [78.5, 14]], 4)] },
  /* black tips: the top of each ear, cut off by the ear's own edge */
  { color: "#3A2420", polys: [[[0, 0], [40, 0], [40, 16], [22, 21], [0, 17]], [[100, 0], [60, 0], [60, 16], [78, 21], [100, 17]]] },
  { color: "#FFF7F0", polys: [[[0, 57], [16, 58], [28, 61], [36, 64], [43, 69], [50, 71], [57, 69], [64, 64], [72, 61], [84, 58], [100, 57], [100, 100], [0, 100]]] },
  blush(50, 67, 20, 4.8, 2.8),
  { color: "#2E2226", polys: [ring(50, 72.3, 4.4, 3.1, 24)] },
];

/* ── Out ────────────────────────────────────────────────────────────── */
const shapes = { tiger, elephant, panda, bunny, chameleon, penguin, pig, lion, octopus, owl, sheep, whale, monkey, llama, koala, fox };

/* Parts drawn behind the head with less depth than it. */
const parts = { panda: pandaParts, chameleon: chameleonParts, lion: lionParts, octopus: octopusParts, sheep: sheepParts, whale: whaleParts };

/* Layers further behind still, back to front, each its own colour and depth. */
const back = { lion: lionBack };

const markings = {
  tiger: tigerMarks, elephant: elephantMarks, panda: pandaMarks, bunny: bunnyMarks, chameleon: chameleonMarks,
  penguin: penguinMarks, pig: pigMarks, lion: lionMarks, octopus: octopusMarks, owl: owlMarks, sheep: sheepMarks, whale: whaleMarks,
  monkey: monkeyMarks, llama: llamaMarks, koala: koalaMarks, fox: foxMarks,
};

let ts = `/* Generated by scripts/gen-shapes.mjs — do not edit by hand. Head
   outlines, parts and markings in a 100×100 box. */

import type { AnimalAvatarType } from './types';

export const SHAPE_PATHS: Record<AnimalAvatarType, string> = {
`;
for (const [k, v] of Object.entries(shapes)) ts += `  ${k}: '${v}',\n`;
ts += "};\n\n/** Parts drawn behind the head with a fraction of its depth. */\nexport const SHAPE_PARTS: Partial<Record<AnimalAvatarType, string>> = {\n";
for (const [k, v] of Object.entries(parts)) ts += `  ${k}: '${v}',\n`;
ts += "};\n\n/** Layers behind the parts, back to front, each with its own colour and share of the depth. */\nexport const SHAPE_BACK: Partial<Record<AnimalAvatarType, { d: string; color: string; depth: number }[]>> = {\n";
for (const [k, v] of Object.entries(back)) ts += `  ${k}: [\n${v.map((l) => `    { color: '${l.color}', depth: ${l.depth}, d: '${l.d}' },\n`).join("")}  ],\n`;
ts += "};\n\n/** Markings (stripes, muzzles) printed on the front under the face: a colour and its outlines, each a flat x, y list, all wound the same way. */\nexport const SHAPE_MARKINGS: Record<AnimalAvatarType, { color: string; polys: number[][] }[]> = {\n";
const flat = (poly) => `[${cw(poly).map((q) => `${f(q[0])},${f(q[1])}`).join(",")}]`;
for (const [k, v] of Object.entries(markings)) ts += `  ${k}: [\n${v.map((m) => `    { color: '${m.color}', polys: [${m.polys.map(flat).join(", ")}] },\n`).join("")}  ],\n`;
ts += "};\n";

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(resolve(here, "../src/shapes.ts"), ts);
console.log("wrote src/shapes.ts", Object.keys(shapes).join(", "));
