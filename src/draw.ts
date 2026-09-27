/* The renderer. The body is a stack of copies of its outline, spaced along
   a depth axis with a pillow profile (smaller at the caps); each copy is
   projected with the head's yaw and pitch, so the stack reads as a rounded
   extruded solid that turns, flips and shows its side. Nearest copies are
   lit with a directional gradient, the far side sits in shade. The face
   lives on the front cap and follows it. */

import type { Pose } from './engine';
import type { AnimalAvatarMouth, AnimalAvatarEyeStyle, AnimalAvatarFace, AnimalAvatarShading } from './types';
import { shade } from './color';
import { drawPlasticCap, mulAffine } from './plastic';

export interface DrawConfig {
  path: Path2D;
  face: AnimalAvatarFace;
  faceX: number;
  faceY: number;
  faceScale: number;
  color: string;
  ink: string;
  shading: AnimalAvatarShading;
  /** intensities and geometry of the lighting; omitted means the stock look */
  shadow?: number;
  highlight?: number;
  depth?: number;
  /** degrees clockwise from the top, where the light comes from */
  light?: number;
  rim?: number;
  spread?: number;
  /** identifies the outline for the material caches (the type name) */
  typeKey?: string;
  /** no animation loop follows this draw (reduced motion, paused): build
   * materials now instead of on idle time */
  still?: boolean;
  /** parts (a panda's ears, a chameleon's tail) drawn behind the head with `partsDepth` of its depth */
  parts?: Path2D;
  partsDepth?: number;
  /** the parts' own colour; omitted, they take the body's */
  partsColor?: string;
  /** layers further behind still, back to front, each with its own colour
      and share of the depth: the dark back of a lion's mane */
  back?: { path: Path2D; color: string; depth: number }[];
  /** the animal's mouth: the "ω" under a nose, a long smile, or none;
      hung from `y` in the body box */
  mouth?: AnimalAvatarMouth;
  /** the eye style; omitted means the stock eyes */
  eyes?: Partial<AnimalAvatarEyeStyle>;
  /** markings (stripes, a muzzle) printed on the front under the face:
      a colour and its outlines, each a flat x, y list in the body box */
  markings?: { color: string; polys: number[][] }[];
  /** the front as a dome rather than a flat cap: an ellipse in the body
      box (centre, radii) that swells by `bulge` body units at its middle
      and meets the cap at its edge. With it the face and the markings
      share this one surface, so they turn together with the body. */
  dome?: { cx: number; cy: number; rx: number; ry: number; bulge: number };
  /** the resolved surface: the whirl is white on dark, black on light */
  theme?: 'dark' | 'light';
  /** the device pixel ratio the context is scaled by: with it given the
      context's transform is taken as that scale and never read back */
  dpr?: number;
  /** plastic's side slices: filled as vectors, or blitted from sprites of
      the outline. `auto` (the default) blits on WebKit, where a
      conic-gradient fill costs thirty times a flat one. */
  sides?: 'auto' | 'vector' | 'sprite';
  /** the whirl's knobs; 1 everywhere is the stock look */
  whirl?: { strength: number; size: number; width: number; length: number; tilt: number };
}

/* The canvas is drawn larger than the avatar's layout box, so a hop or a
   flip can leave the box without being clipped. */
export const OVERSCAN = 1.5;
/** the body's centre sits this fraction of the box below the canvas
    centre: hops and flips need the room above, not below */
export const RISE = 0.1;

/* Copies through the depth, and the stock half-depth in body units. */
const SLICES = 17;
const HALF_DEPTH = 15;
/* Cap scale at the ends of the pillow, at the stock rim width. */
const CAP = 0.9;
const profile = (z: number, cap: number) => cap + (1 - cap) * Math.sqrt(Math.max(0, 1 - z * z));

/* The eyes' stock size and spacing, before an animal's own style. */
const EYE_GAP = 25;
const EYE_RX = 6.3;
const EYE_Y = 1;

interface Palette {
  base: string;
  far: string;
  near: string;
  light: string;
  dark: string;
  capTop: string;
  capBottom: string;
  /** the slice colours by draw order (far → near), crisp and smooth */
  crispMix: string[];
  smoothMix: string[];
  /** crisp: the lit side and cap gradients, for a light direction */
  grad: { lx: number; ly: number; lit: CanvasGradient; cap: CanvasGradient } | null;
}
const paletteCache = new Map<string, Palette>();
function palette(color: string, shadow: number, highlight: number): Palette {
  const key = `${color}|${shadow}|${highlight}`;
  let p = paletteCache.get(key);
  if (!p) {
    const far = shade(color, -0.3 * shadow, 0.05 * shadow);
    const near = shade(color, -0.12 * shadow, 0.03 * shadow);
    const crispMix: string[] = [], smoothMix: string[] = [];
    for (let j = 0; j < SLICES; j++) {
      const t = j / (SLICES - 1);
      crispMix.push(t > 0.6 ? '' : mixCss(far, near, t / 0.6));
      smoothMix.push(t >= 0.5 ? color : mixCss(far, color, t / 0.5));
    }
    p = {
      base: color,
      far,
      near,
      light: shade(color, 0.04 * highlight),
      dark: shade(color, -0.3 * shadow, 0.05 * shadow),
      capTop: shade(color, 0.035 * highlight),
      capBottom: shade(color, -0.035 * shadow),
      crispMix,
      smoothMix,
      grad: null,
    };
    if (paletteCache.size > 200) paletteCache.clear();
    paletteCache.set(key, p);
  }
  return p;
}

/* the numbers of an hsl() string; any other colour is normalised through shade() first */
const hslNums = (c: string) => (c.startsWith('hsl(') ? c : shade(c, 0)).match(/[\d.]+/g)!.map(Number);
function mixCss(a: string, b: string, t: number): string {
  /* interpolate the hsl numbers */
  const pa = hslNums(a);
  const pb = hslNums(b);
  const m = pa.map((v, i) => v + (pb[i] - v) * t);
  return `hsl(${m[0].toFixed(1)} ${m[1].toFixed(1)}% ${m[2].toFixed(1)}%)`;
}

/* The whirl: the cartoon motion round a spinning body — one tapered
   trail on a tilted ring, made of the body's own material: a translucent
   plastic tube in the body colour, lit from the same light — a lighter
   flank toward it, a darker underside, a white specular ridge along the
   top — with a soft halo so it reads as a puff of plastic cloud. The
   ring lies in the body's equatorial plane seen a little from above,
   with a touch of perspective: the near half (sin > 0) is larger,
   thicker and stronger and is drawn over the body and face, casting a
   soft shadow on them; the far half is smaller and fainter and goes
   behind. */
const WHIRL_SEGMENTS = 34;
const WHIRL_SPAN = Math.PI * 1.55;
const WHIRL_RX = 57;
const WHIRL_RATIO = 0.4;
const WHIRL_TILT = -0.28;
interface WhirlInk {
  base: string;
  light: string;
  dark: string;
  halo: string;
}
const whirlInkCache = new Map<string, WhirlInk>();
function whirlInk(color: string): WhirlInk {
  let w = whirlInkCache.get(color);
  if (!w) {
    w = { base: shade(color, 0.1, 0.02), light: shade(color, 0.3, 0.04), dark: shade(color, -0.22, 0.08), halo: shade(color, 0.2) };
    if (whirlInkCache.size > 200) whirlInkCache.clear();
    whirlInkCache.set(color, w);
  }
  return w;
}
/* an hsl() from shade() with an alpha */
const withAlpha = (hsl: string, a: number) => hsl.replace(')', ` / ${Math.max(0, Math.min(1, a)).toFixed(3)})`);

function drawWhirl(ctx: CanvasRenderingContext2D, pose: Pose, color: string, lx: number, ly: number, near: boolean, knobs?: DrawConfig['whirl']) {
  const strength = knobs?.strength ?? 0;
  const k = Math.min(1, pose.whirl * strength);
  if (k <= 0.01) return;
  const sizeK = knobs?.size ?? 1, widthK = knobs?.width ?? 1, lengthK = knobs?.length ?? 1, tiltK = knobs?.tilt ?? 1;
  const span = WHIRL_SPAN * lengthK;
  const ink = whirlInk(color);
  /* the ring runs the way the body's near face moves: to the right */
  const head = -pose.whirlAngle;
  const rx = WHIRL_RX * sizeK;
  const ry = rx * WHIRL_RATIO * tiltK * (near ? 1.14 : 0.86);
  /* where round the ring the light falls, in the ring's own frame */
  const lightA = Math.atan2(ly, lx) - WHIRL_TILT;
  ctx.save();
  ctx.rotate(WHIRL_TILT);
  ctx.translate(0, 5);
  ctx.lineCap = 'butt';
  const seg = (a0: number, a1: number, width: number, style: string, dy: number) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(0, dy, rx, ry, 0, a0, a1, false);
    ctx.stroke();
  };
  /* the near half casts a soft shadow on the body it crosses */
  if (near) {
    for (let i = 0; i < WHIRL_SEGMENTS; i++) {
      const f = i / WHIRL_SEGMENTS;
      const a1 = head + f * span, a0 = a1 + span / WHIRL_SEGMENTS + 0.012;
      if (Math.sin((a0 + a1) / 2) <= 0) continue;
      const fade = Math.pow(1 - f, 1.3);
      seg(a1, a0, (2 + 8 * fade) * 1.5 * widthK, `rgba(0,0,0,${(0.2 * k * fade).toFixed(3)})`, 3.5);
    }
  }
  for (let i = 0; i < WHIRL_SEGMENTS; i++) {
    const f = i / WHIRL_SEGMENTS;
    /* the trail lies at the angles the head has already passed */
    const a1 = head + f * span, a0 = a1 + span / WHIRL_SEGMENTS + 0.012;
    const mid = (a0 + a1) / 2;
    if ((Math.sin(mid) > 0) !== near) continue;
    /* perspective and depth: the nearest point of the ring is fullest */
    const depth = 0.6 + 0.4 * Math.sin(mid);
    const fade = Math.pow(1 - f, 1.3);
    /* a gentle puff along the trail */
    const puff = 1 + 0.18 * Math.sin(f * 9 + 1.2);
    const width = (2 + 8 * fade) * depth * widthK * puff;
    const a = k * (0.3 + 0.7 * fade) * depth;
    /* how much this stretch of the ring faces the light */
    const facing = 0.5 + 0.5 * Math.cos(mid - lightA);
    /* halo, underside, body, lit flank, specular ridge: a plastic tube */
    seg(a1, a0, width * 2.6, withAlpha(ink.halo, a * 0.2), 0);
    seg(a1, a0, width * 0.8, withAlpha(ink.dark, a * 0.45), width * 0.32);
    seg(a1, a0, width, withAlpha(ink.base, a * 0.72), 0);
    seg(a1, a0, width * 0.62, withAlpha(ink.light, a * 0.78 * (0.4 + 0.6 * facing)), -width * 0.16);
    seg(a1, a0, width * 0.24, `rgba(255,255,255,${(a * 0.9 * (0.15 + 0.85 * facing * facing)).toFixed(3)})`, -width * 0.3);
  }
  ctx.restore();
}

/**
 * Draw one frame. `box` is the avatar's layout size in CSS px; the canvas
 * is `box * OVERSCAN` square with the body's centre `RISE * box` below
 * its middle, and the context already scaled for the device pixel ratio.
 */
export function draw(ctx: CanvasRenderingContext2D, box: number, pose: Pose, cfg: DrawConfig) {
  const full = box * OVERSCAN;
  ctx.clearRect(0, 0, full, full);
  const S = box / 100;
  /* the context's transform as given (the device scale) is the base of
     every transform set here; known from `dpr`, else read once */
  let dpr: number, base: readonly number[];
  if (cfg.dpr !== undefined) {
    dpr = cfg.dpr;
    base = [dpr, 0, 0, dpr, 0, 0];
  } else if (ctx.getTransform) {
    const t = ctx.getTransform();
    base = [t.a, t.b, t.c, t.d, t.e, t.f];
    dpr = t.a || 1;
  } else {
    dpr = 1;
    base = [1, 0, 0, 1, 0, 0];
  }
  const shadow = cfg.shadow ?? 0.35, highlight = cfg.highlight ?? 1.3;
  const halfDepth = HALF_DEPTH * (cfg.depth ?? 0.65);
  const cap = 1 - (1 - CAP) * (cfg.rim ?? 0.5);
  const spread = cfg.spread ?? 1.55;
  /* the light's direction on screen: a unit vector toward the source */
  const la = ((cfg.light ?? 265) * Math.PI) / 180;
  const lx = Math.sin(la), ly = -Math.cos(la);
  const pal = palette(cfg.color, shadow, highlight);

  const cy0 = Math.cos(pose.yaw), sy = Math.sin(pose.yaw);
  const cp0 = Math.cos(pose.pitch), sp = Math.sin(pose.pitch);
  /* which cap faces the viewer: the front while this is positive */
  const facing = cy0 * cp0;
  /* edge-on, every slice would thin to a line and the stack would show
     gaps; a floor on the foreshortening keeps it a solid */
  const floor = (v: number) => (Math.abs(v) < 0.22 ? (v < 0 ? -0.22 : 0.22) : v);
  const cy = floor(cy0), cp = floor(cp0);

  /* body space: the box centre plus the pose's offset, its roll and
     squash. The squash and stretch scale about the body's base (y = 50),
     so a landing keeps the feet on the ground and presses the top down,
     and a stretch rises from the base. */
  const cr = Math.cos(pose.roll), sr = Math.sin(pose.roll), kx = pose.sx * S, ky = pose.sy * S;
  const lift = 50 * (1 - pose.sy) * S;
  const body = mulAffine(base, [cr * kx, sr * kx, -sr * ky, cr * ky, full / 2 + pose.x * S - sr * lift, full / 2 + RISE * box + pose.y * S + cr * lift]);
  ctx.save();
  ctx.setTransform(body[0], body[1], body[2], body[3], body[4], body[5]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const mode = cfg.shading;
  /* one solid: the slice stack (or the plastic material) for an outline
     at a depth; the thin parts come first with a fraction of the depth,
     then the body over them */
  const drawSolid = (path: Path2D, key: string, halfDepth: number, color = cfg.color, own = pal): boolean => {
    const pal = own;
    /* the lit gradient, in the body's own space: light from the upper left */
    let lit: CanvasGradient | string = pal.near;
    let capFill: CanvasGradient | string = pal.base;
    if (mode === 'crisp') {
      if (!pal.grad || pal.grad.lx !== lx || pal.grad.ly !== ly) {
        const g = ctx.createLinearGradient(lx * 56, ly * 56, -lx * 56, -ly * 56);
        g.addColorStop(0, pal.light);
        g.addColorStop(0.45, pal.near);
        g.addColorStop(1, pal.dark);
        const c = ctx.createLinearGradient(lx * 46, ly * 46, -lx * 46, -ly * 46);
        c.addColorStop(0, pal.capTop);
        c.addColorStop(1, pal.capBottom);
        pal.grad = { lx, ly, lit: g, cap: c };
      }
      lit = pal.grad.lit;
      capFill = pal.grad.cap;
    }

    /* plastic: the material module draws the whole body — side copies from
       its matcap and the front cap as a lit texture. While a form is still
       baking on idle time it declines, and the stock slices with the smooth
       overlay stand in for that frame. */
    let plasticDone = false;
    if (mode === 'plastic') {
      plasticDone = drawPlasticCap(
        ctx,
        { ...cfg, path, typeKey: key, color },
        { cy, sy, cp, sp, facing, roll: pose.roll, halfDepth, cap, lx, ly, dev: box * dpr, ctm: body, still: cfg.still },
        pal,
        null,
        { shadow, highlight, spread, rim: cfg.rim ?? 0.5 }
      );
    }
    const mode2: AnimalAvatarShading = mode === 'plastic' && !plasticDone ? 'smooth' : mode;
    const soft = mode2 === 'smooth';
    const union = soft && typeof Path2D === 'function' ? new Path2D() : null;
    /* slices, far to near; each sets its transform outright from the
       body's, no save/restore */
    const order = facing >= 0 ? 1 : -1;
    const [ca, cb, cc, cd, ce, cf] = body;
    let fill: CanvasGradient | string | null = null;
    /* each slice's affine is applied relative to the previous slice's: one
       transform() per slice, no save/restore */
    let pa = 1, pb = 0, pc = 0, pd = 1, pe = 0, pf = 0;
    for (let j = 0; j < SLICES && !plasticDone; j++) {
      const k = order > 0 ? j : SLICES - 1 - j;
      const z = -1 + (2 * k) / (SLICES - 1);
      const s = profile(z, cap);
      const near = j / (SLICES - 1);
      /* yaw about Y then pitch about X, orthographic: an affine per slice,
         then the path's own origin at its centre */
      const m0 = cy * s, m1 = sy * sp * s, m3 = cp * s;
      const e = z * sy * halfDepth - 50 * m0, fo = -z * cy * sp * halfDepth - 50 * m1 - 50 * m3;
      const det = pa * pd - pb * pc;
      const ia = pd / det, ib = -pb / det, ic = -pc / det, id = pa / det, ie = (pc * pf - pd * pe) / det, jf = (pb * pe - pa * pf) / det;
      ctx.transform(ia * m0 + ic * m1, ib * m0 + id * m1, ic * m3, id * m3, ia * e + ic * fo + ie, ib * e + id * fo + jf);
      pa = m0; pb = m1; pc = 0; pd = m3; pe = e; pf = fo;
      let style: CanvasGradient | string;
      /* smooth: one colour ramp through the depth to the front, no edge at the cap */
      if (soft) style = pal.smoothMix[j];
      else if (j === SLICES - 1) style = capFill;
      else if (near > 0.6) style = lit;
      else style = pal.crispMix[j];
      if (style !== fill) ctx.fillStyle = fill = style;
      ctx.fill(path);
      if (union) union.addPath(path, { a: m0, b: m1, c: 0, d: m3, e, f: fo });
    }
    if (!plasticDone) ctx.setTransform(ca, cb, cc, cd, ce, cf);

    /* smooth: a soft shadow from the lower right and a light from the upper
       left, laid over the whole form so nothing has an edge */
    if (union && mode2 === 'smooth') {
      /* the two gradients are made per frame on purpose: a kept one is
         slower to use in Safari than a fresh one */
      ctx.save();
      ctx.clip(union);
      const sa = Math.min(1, 0.34 * shadow);
      const sg = ctx.createRadialGradient(-lx * 45, -ly * 45, 4 * spread, -lx * 45, -ly * 45, 84 * spread);
      sg.addColorStop(0, `rgba(0,0,0,${sa})`);
      sg.addColorStop(0.5, `rgba(0,0,0,${sa * 0.35})`);
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = sg;
      ctx.fillRect(-120, -120, 240, 240);
      ctx.globalCompositeOperation = 'source-over';
      const ha = Math.min(1, 0.22 * highlight);
      const hg = ctx.createRadialGradient(lx * 37, ly * 37, 0, lx * 37, ly * 37, 62 * spread);
      hg.addColorStop(0, `rgba(255,255,255,${ha})`);
      hg.addColorStop(0.6, `rgba(255,255,255,${ha * 0.23})`);
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(-120, -120, 240, 240);
      ctx.restore();
    }

    return plasticDone;
  };

  /* the far half of the whirl sits behind everything */
  drawWhirl(ctx, pose, cfg.color, lx, ly, false, cfg.whirl);

  cfg.back?.forEach((l, i) => drawSolid(l.path, `${cfg.typeKey ?? 'custom'}:back${i}`, halfDepth * l.depth, l.color, palette(l.color, shadow, highlight)));
  if (cfg.parts) {
    /* parts can wear their own colour: a panda's black ears */
    const pc = cfg.partsColor;
    drawSolid(cfg.parts, `${cfg.typeKey ?? 'custom'}:parts`, halfDepth * (cfg.partsDepth ?? 0.4), pc ?? cfg.color, pc ? palette(pc, shadow, highlight) : pal);
  }
  const plasticDone = drawSolid(cfg.path, cfg.typeKey ?? 'custom', halfDepth);

  /* the face: each feature sits on a sphere behind the front cap, so a
     turn slides it round the head — the eye moving toward the edge
     narrows, the other comes to the front, and past the side they go */
  if (facing > -0.2) {
    ctx.save();
    /* The face is printed on the front of the body, so it cannot leave
       it: clip to the front slice's own outline first. On a wide turn a
       feature's place on the sphere can reach past the body's foreshortened
       silhouette, and without this it floats off the side. */
    {
      const zf = facing >= 0 ? 1 : -1;
      const sf = profile(zf, cap);
      const m0 = cy * sf, m1 = sy * sp * sf, m3 = cp * sf;
      const e = zf * sy * halfDepth - 50 * m0;
      const fo = -zf * cy * sp * halfDepth - 50 * m1 - 50 * m3;
      const [ca, cb, cc, cd, ce, cf] = body;
      ctx.setTransform(ca * m0 + cc * m1, cb * m0 + cd * m1, cc * m3, cd * m3, ca * e + cc * fo + ce, cb * e + cd * fo + cf);
      ctx.clip(cfg.path);
      ctx.setTransform(ca, cb, cc, cd, ce, cf);
    }
    /* a point of the front, from the body box to body space: the cap's
       own affine, pushed out along the depth axis by the dome */
    const zf = facing >= 0 ? 1 : -1;
    const sf = profile(zf, cap);
    const dome = cfg.dome;
    const front = (x: number, y: number, out: number[]) => {
      let d = zf * halfDepth;
      if (dome) {
        const u = (x - dome.cx) / dome.rx, v = (y - dome.cy) / dome.ry;
        const k = 1 - u * u - v * v;
        if (k > 0) d += zf * dome.bulge * Math.sqrt(k);
      }
      const px = x - 50, py = y - 50;
      out[0] = cy * sf * px + d * sy;
      out[1] = sy * sp * sf * px + cp * sf * py - d * cy * sp;
    };
    if (cfg.markings) {
      const q = [0, 0];
      const print = new Path2D();
      ctx.globalAlpha = plasticDone ? 0.96 : 1;
      for (const m of cfg.markings) {
        const path = new Path2D();
        for (const poly of m.polys) {
          for (let i = 0; i < poly.length; i += 2) {
            front(poly[i], poly[i + 1], q);
            if (i === 0) path.moveTo(q[0], q[1]);
            else path.lineTo(q[0], q[1]);
          }
          path.closePath();
        }
        ctx.fillStyle = m.color;
        ctx.fill(path);
        print.addPath(path);
      }
      ctx.globalAlpha = 1;
      /* the print sits under the same light as the head: a soft sheen on
         the lit side, a little shade toward the far edge, so a muzzle or
         a patch reads as part of the form rather than a sticker on it.
         Every outline is wound the same way, so their union is one clip. */
      if (mode !== 'flat') {
        const c = [0, 0];
        front(dome ? dome.cx : 50, dome ? dome.cy : 50, c);
        const R = (dome ? Math.max(dome.rx, dome.ry) : 40) * sf;
        const g = ctx.createRadialGradient(
          c[0] + lx * R * 0.5, c[1] + ly * R * 0.5 - R * 0.25, R * 0.05,
          c[0] + lx * R * 0.15, c[1] + ly * R * 0.15 - R * 0.1, R * 1.2
        );
        g.addColorStop(0, `rgba(255,255,255,${Math.min(0.5, 0.2 * highlight)})`);
        g.addColorStop(0.4, 'rgba(255,255,255,0)');
        g.addColorStop(0.72, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${Math.min(0.5, 0.45 * shadow)})`);
        ctx.save();
        ctx.clip(print);
        ctx.fillStyle = g;
        ctx.fillRect(-150, -150, 300, 300);
        ctx.restore();
      }
    }
    ctx.translate(cfg.faceX - 50, cfg.faceY - 50);
    ctx.scale(cfg.faceScale, cfg.faceScale);
    /* under a clear coat the print shows the gloss faintly through it */
    if (plasticDone) ctx.globalAlpha = 0.93;
    /* on a dome the features sit on the same surface as the markings: a
       feature's place is the front's, its foreshortening the front's own
       stretch there */
    let place: Place | undefined;
    if (dome) {
      const fx = cfg.faceX, fy = cfg.faceY, fs = cfg.faceScale;
      const p = [0, 0], px = [0, 0], py = [0, 0];
      place = (x, y) => {
        const bx = fx + x * fs, by = fy + y * fs;
        front(bx, by, p);
        front(bx + 1, by, px);
        front(bx, by + 1, py);
        const sx = Math.abs(px[0] - p[0]), syy = Math.abs(py[1] - p[1]);
        return { x: (p[0] - (fx - 50)) / fs, y: (p[1] - (fy - 50)) / fs, sx, sy: syy, z: Math.min(sx, syy) };
      };
    }
    /* the face's lines keep to a floor of about a device-independent
       pixel, so a sleeping lid or a mouth still reads at 32px */
    drawFace(ctx, pose, cfg, place, 1.1 / ((box / 100) * cfg.faceScale));
    ctx.restore();
    /* a chameleon's tongue: it leaves the mouth and reaches out past the
       head toward the side it faces, so it is drawn over everything, not
       clipped to the front */
    if (cfg.mouth?.snap && Math.abs(pose.tongue) > 0.01) {
      const m = [0, 0];
      front(cfg.faceX, cfg.mouth.y + 1.5, m);
      const side = Math.sign(pose.tongue), reach = Math.abs(pose.tongue);
      const L = 56 * reach;
      /* the line it flies along: nearly level, bowing up, with a wobble
         while it travels that settles at full reach */
      const tx = m[0] + side * L, ty = m[1] + L * 0.1;
      const cx = m[0] + side * L * 0.5, cy = m[1] - L * (0.16 + 0.1 * Math.sin(Math.PI * reach) * (1 - reach));
      const at = (t: number) => {
        const u = 1 - t;
        return [u * u * m[0] + 2 * u * t * cx + t * t * tx, u * u * m[1] + 2 * u * t * cy + t * t * ty];
      };
      /* a tapered body, thick at the mouth */
      const N = 16, L1: number[][] = [], R1: number[][] = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * 0.94, [x, y] = at(t), [x2, y2] = at(Math.min(1, t + 0.02));
        const d = Math.hypot(x2 - x, y2 - y) || 1, nx = -(y2 - y) / d, ny = (x2 - x) / d;
        const hw = (7.4 - 3.4 * t) / 2;
        L1.push([x + nx * hw, y + ny * hw]);
        R1.push([x - nx * hw, y - ny * hw]);
      }
      const [ca, cb, cc, cd, ce, cf] = body;
      ctx.save();
      ctx.setTransform(ca, cb, cc, cd, ce, cf);
      ctx.fillStyle = '#F2758F';
      ctx.beginPath();
      L1.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let i = R1.length - 1; i >= 0; i--) ctx.lineTo(R1[i][0], R1[i][1]);
      ctx.closePath();
      ctx.fill();
      /* its root, rounded, down in the open mouth */
      ctx.beginPath();
      ctx.arc(m[0], m[1], 3.7, 0, Math.PI * 2);
      ctx.fill();
      /* a pale stripe down its middle, the light catching it */
      ctx.strokeStyle = 'rgba(255,205,215,0.8)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 1; i <= 12; i++) {
        const [x, y] = at((i / 12) * 0.82);
        if (i === 1) ctx.moveTo(x, y - 0.8);
        else ctx.lineTo(x, y - 0.8);
      }
      ctx.stroke();
      /* the sticky tip: a glossy ball */
      const r = 7;
      const g = ctx.createRadialGradient(tx - side * 1.8, ty - 2, 0.5, tx, ty, r);
      g.addColorStop(0, '#FF9FB4');
      g.addColorStop(0.6, '#EC5B7E');
      g.addColorStop(1, '#C93F65');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(tx - side * 2, ty - 2.4, 1.9, 1.3, -0.5 * side, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  /* the near half of the whirl passes in front of the face */
  drawWhirl(ctx, pose, cfg.color, lx, ly, true, cfg.whirl);
  ctx.setTransform(body[0], body[1], body[2], body[3], body[4], body[5]);
  drawFlourishes(ctx, pose, cfg.theme);
  ctx.restore();
}

/* Each state's own touch, beside the head rather than on it, in the
   body's space (the 100×100 box, centred): thinking trails three thought
   bubbles up to the right, pulsing in turn like a typing indicator, the
   small one first as the state comes in; happy twinkles four sparkles
   round the head, each on its own beat. */
const BUBBLES = [[86, 6, 2.8], [95, -2.5, 3.9], [105.5, -12, 5.2]];
const SPARKLES = [[6, 8, 8, 0], [95, 10, 6.4, 0.35], [-3, 50, 6.8, 0.62], [104, 58, 5.6, 0.15], [50, -8, 5, 0.8]];
function drawFlourishes(ctx: CanvasRenderingContext2D, pose: Pose, theme: DrawConfig['theme']) {
  const [, , , wt, wh] = pose.w;
  const T = pose.time;
  if (wt > 0.01) {
    ctx.fillStyle = theme === 'light' ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.9)';
    BUBBLES.forEach(([x, y, r], i) => {
      const grow = Math.max(0, Math.min(1, (wt - i * 0.2) / 0.6));
      if (grow <= 0) return;
      const k = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (T * 0.8 - i * 0.2));
      ctx.globalAlpha = grow * (0.55 + 0.45 * k);
      ctx.beginPath();
      ctx.arc(x - 50, y - 50, r * (0.85 + 0.2 * k) * grow, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  if (wh > 0.01) {
    for (const [x, y, r, off] of SPARKLES) {
      /* twinkle once a cycle: grow, turn a little, go */
      const c = (((T / 1.5 + off) % 1) + 1) % 1;
      const s = c < 0.55 ? Math.sin((Math.PI * c) / 0.55) : 0;
      const R = r * s * wh;
      if (R < 0.2) continue;
      ctx.save();
      ctx.translate(x - 50, y - 50);
      ctx.rotate(c * 1.4);
      const k = R * 0.14;
      ctx.beginPath();
      ctx.moveTo(0, -R);
      ctx.quadraticCurveTo(k, -k, R, 0);
      ctx.quadraticCurveTo(k, k, 0, R);
      ctx.quadraticCurveTo(-k, k, -R, 0);
      ctx.quadraticCurveTo(-k, -k, 0, -R);
      /* a deeper gold on a light surface, where the bright one washes out */
      ctx.fillStyle = theme === 'light' ? '#F2A600' : '#FFD24A';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* Radius of the sphere the face is drawn on, in body units. */
const FACE_R = 30;

/* A feature's place on the sphere: longitude and latitude from its
   design position, turned by the head. Returns its screen offset, its
   foreshortening, and how much it faces the viewer. */
function onSphere(x: number, y: number, yaw: number, pitch: number) {
  const lon = Math.asin(Math.max(-1, Math.min(1, x / FACE_R))) + yaw;
  const lat = Math.asin(Math.max(-1, Math.min(1, -y / FACE_R))) + pitch;
  const cl = Math.cos(lat);
  return {
    x: FACE_R * Math.sin(lon) * cl,
    y: -FACE_R * Math.sin(lat),
    sx: Math.cos(lon),
    sy: cl,
    z: Math.cos(lon) * cl,
  };
}

/* An eye's curve as a short polyline with round joins, cached by its
   numbers. Stroking the open eye's hairpin curve directly gives a pill in
   Chrome but a teardrop in Safari, whose stroker does not round a cusp;
   both stroke a polyline the same way. */
const EYE_STEPS = 8;
const eyePaths = new Map<number, Path2D>();
function eyePath(x0: number, y0: number, cy: number): Path2D {
  const qx = Math.round(x0 * 50), qy = Math.round(y0 * 50), qc = Math.round(cy * 50);
  const key = qx + 2000 * qy + 4e6 * qc;
  let p = eyePaths.get(key);
  if (!p) {
    const ax = qx / 50, ay = qy / 50, ac = qc / 50;
    let d = `M${-ax} ${ay}`;
    for (let i = 1; i <= EYE_STEPS; i++) {
      const t = i / EYE_STEPS, mt = 1 - t;
      d += ` L${(mt * mt * -ax + t * t * ax).toFixed(3)} ${((mt * mt + t * t) * ay + 2 * mt * t * ac).toFixed(3)}`;
    }
    p = new Path2D(d);
    if (eyePaths.size > 256) eyePaths.clear();
    eyePaths.set(key, p);
  }
  return p;
}

type Place = (x: number, y: number) => { x: number; y: number; sx: number; sy: number; z: number };

function drawFace(ctx: CanvasRenderingContext2D, pose: Pose, cfg: DrawConfig, place: Place | undefined, minLine: number) {
  const [wd, ww, ws, wt, wh] = pose.w;
  const ink = cfg.ink;
  const es = cfg.eyes ?? {};
  const eSize = es.size ?? 1, eTall = es.tall ?? 1, shine = es.shine ?? 0, shineSize = es.shineSize ?? 1;
  const ey = EYE_Y + (es.y ?? 0);
  const half = (EYE_GAP / 2) * (es.gap ?? 1);
  const lx = pose.lookX, ly = pose.lookY;
  const { yaw, pitch } = pose;

  /* place a feature: skip it once it has gone round the side */
  const at = (x: number, y: number, fn: () => void, alpha = 1) => {
    const q = place ? place(x, y) : onSphere(x, y, yaw, pitch);
    if (q.z <= 0.02 || alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha * Math.min(1, q.z * 5);
    ctx.translate(q.x, q.y);
    ctx.scale(Math.max(0.02, q.sx), Math.max(0.02, q.sy));
    fn();
    ctx.restore();
  };

  /* Each eye is one stroked curve — endpoints at ±x0,y0, a control point
     at 0,cy, width w, round caps — so every look is the same shape with
     different numbers, and a blend of the numbers is a real morph: the
     upright pill of an open eye squashes into a shut line, swings up into
     a laughing arc, or droops into a sleeping lid. */
  /* the eyes take the head's aim, but only once it really aims
     somewhere: at rest and through the small drift of a breath they keep
     their own shape, and past that they draw taller looking up, shorter
     looking down, and a little wider from the corner of a sideways
     glance — the mimic that makes a turn read as a look */
  const past = (v: number, d: number) => (Math.abs(v) <= d ? 0 : (Math.sign(v) * (Math.abs(v) - d)) / (1 - d));
  const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
  const up = past(clamp1(-pose.pitch / 0.26 - pose.lookY / 7), 0.34);
  const side = Math.abs(past(clamp1(pose.lookX / 4.5), 0.4));
  const tall = Math.max(0.3, 1 + 0.55 * up - 0.1 * side);
  const wide = 1 - 0.05 * up + 0.12 * side;
  /* thinking looks with open eyes; working and happy laugh them shut */
  const open = wd + wt + (ww + wh) * (1 - pose.laugh);
  const laugh = (ww + wh) * pose.laugh;
  const lift = Math.max(0, -pose.y) / 26;
  const sag = 0.5 + 0.5 * pose.breath;
  for (const side of [-1, 1] as const) {
    const lid = side < 0 ? pose.blinkL : pose.blinkR;
    const e = Math.max(0, Math.min(1, pose.eyeOpen * (1 - lid)));
    const kOpen = open * e, kShut = open * (1 - e), kLaugh = laugh, kSleep = ws;
    const x0 = kOpen * 0.01 + kShut * 5.4 + kLaugh * 6.2 + kSleep * 6;
    const y0 = kOpen * 1.1 * tall * eTall + kShut * 0.6 + kLaugh * (2.2 - lift * 1.5) + kSleep * (-1.4 + sag);
    const cy = kOpen * -3.3 * tall * eTall + kShut * 0.6 + kLaugh * (-11.4 - 4 * lift) + kSleep * (5.4 + 2 * sag);
    const w = Math.max(minLine, kOpen * EYE_RX * 2 * wide * eSize + kShut * 2.8 + kLaugh * 4.4 + kSleep * 4);
    /* the eyes drift toward the look when open, less so when shut */
    let dx = lx * (kOpen + 0.5 * (kShut + kLaugh)), dy = ly * (kOpen + 0.5 * kShut);
    /* rolling eyes: the right one wanders off on its own slow loop */
    if (es.roll && side > 0) {
      dx += (2.8 * Math.sin(pose.time * 0.83) - lx * 0.8) * kOpen;
      dy += 1.8 * Math.sin(pose.time * 1.21 + 1) * kOpen;
    }
    at(side * half + dx, ey + dy, () => {
      if (es.iris && kOpen * e > 0.05) {
        const a = ctx.globalAlpha;
        ctx.globalAlpha = a * Math.min(1, kOpen * e * 1.4);
        ctx.fillStyle = es.iris;
        ctx.beginPath();
        ctx.arc(0, 0, (w / 2) * (es.irisSize ?? 1.75), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.globalAlpha = a;
      }
      ctx.strokeStyle = es.color ?? ink;
      ctx.lineWidth = w;
      ctx.stroke(eyePath(x0, y0, cy));
      /* lashes: two flicks off the top outer edge of an open eye */
      if (es.lashes && kOpen * e > 0.05) {
        const hw = w / 2, hh = 1.1 * tall * eTall + hw;
        const a = ctx.globalAlpha;
        ctx.globalAlpha = a * Math.min(1, kOpen * e * 1.5);
        ctx.lineWidth = Math.max(minLine * 0.8, 1.15);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const [deg, len, out] of [[58, 0.55, 0.72], [24, 0.48, 0.5]]) {
          const t = (deg * Math.PI) / 180, px = side * hw * Math.cos(t), py = -hh * Math.sin(t);
          const dx = side * Math.cos(t * out), dy = -Math.sin(t) - 0.35;
          const n = Math.hypot(dx, dy);
          ctx.moveTo(px, py);
          ctx.lineTo(px + (dx / n) * hw * len, py + (dy / n) * hw * len);
        }
        ctx.stroke();
        ctx.globalAlpha = a;
      }
      /* catchlights: they fade out as the lid comes down, and sit toward
         the light rather than following the look */
      const a = kOpen * e * e;
      if (shine > 0 && a > 0.05) {
        const r = EYE_RX * eSize;
        ctx.globalAlpha *= a;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-r * 0.32, cy * 0.35 - r * 0.2, r * 0.36 * shineSize, 0, Math.PI * 2);
        ctx.fill();
        if (shine > 1) {
          ctx.beginPath();
          ctx.arc(r * 0.3, y0 + r * 0.25, r * 0.16 * shineSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  const mo = cfg.mouth;
  if (mo && (cfg.face === 'mouth' || mo.style === 'beak')) {
    /* The animal mouths. Every number is a blend of the three states', so
       a switch morphs rather than swaps; working, a little open mouth
       drops under the line, deeper at the top of a hop. A beak is a
       feature rather than an expression, so it shows with either face. */
    const b = (d: number, w: number, s: number, t: number, h: number) => wd * d + ww * w + ws * s + wt * t + wh * h;
    const kd = 1 + 0.08 * pose.breath;
    const hop = Math.max(0, -pose.y) / 26;
    /* working opens the mouth with each hop; happy beams, wider still */
    const open = ww * (5.6 + 4 * hop) + wh * (4.8 + 4 * hop) + (mo.snap ? 4.5 * Math.abs(pose.tongue) : 0);
    const lw = Math.max(minLine, b(1.55, 1.6, 1.35, 1.5, 1.6));
    /* thinking pulls the mouth small and off to the side it looks to */
    const hmm = wt * Math.max(-1, Math.min(1, lx / 3));
    const ay = (mo.y - cfg.faceY) / cfg.faceScale;
    const pocketFill = (pocket: Path2D, ty: number, tw: number) => {
      ctx.fillStyle = mo.inside ?? '#5B1F2B';
      ctx.fill(pocket);
      ctx.save();
      ctx.clip(pocket);
      ctx.fillStyle = mo.tongue ?? '#FF7F96';
      ctx.beginPath();
      ctx.ellipse(0, ty, tw, open * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    if (mo.style === 'smile') {
      /* a long, gentle smile with its corners tucked up: a chameleon's */
      const sw = (mo.width ?? 14) * b(kd, 1.05, 0.8, 0.5, 1.15);
      const sag = b(3.2, 2.2, 1.2, 0.8, 3.6);
      at(lx * 0.2 + hmm * (mo.width ?? 14) * 0.3, ay, () => {
        if (open > 0.3) {
          const pocket = new Path2D();
          pocket.moveTo(-sw * 0.7, sag * 0.55);
          pocket.quadraticCurveTo(0, sag * 1.6, sw * 0.7, sag * 0.55);
          pocket.bezierCurveTo(sw * 0.6, sag + open * 1.3, -sw * 0.6, sag + open * 1.3, -sw * 0.7, sag * 0.55);
          pocketFill(pocket, sag + open * 1.05, sw * 0.4);
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-sw - 1.2, -1.4);
        ctx.quadraticCurveTo(-sw - 0.6, 0.2, -sw, 0);
        ctx.quadraticCurveTo(0, sag * 2, sw, 0);
        ctx.quadraticCurveTo(sw + 0.6, 0.2, sw + 1.2, -1.4);
        ctx.stroke();
      });
    } else if (mo.style === 'animal') {
      /* a short line down from the nose, then two small curves out to
         either side, the "ω" */
      const hw = b(5.4 * kd, 6, 3.8, 3.4, 6.6);
      const dip = b(2.5 * kd, 2.2, 1.2, 1, 2.9);
      const ph = b(2.2, 1.8, 1.4, 1.9, 2);
      at(lx * 0.2 + hmm * 1.6, ay, () => {
        if (open > 0.3) {
          const w2 = hw * 0.62, y0 = ph + dip * 0.55;
          const pocket = new Path2D();
          pocket.moveTo(-w2, y0);
          pocket.quadraticCurveTo(-hw * 0.25, ph + dip * 1.1, 0, ph + 0.4);
          pocket.quadraticCurveTo(hw * 0.25, ph + dip * 1.1, w2, y0);
          pocket.bezierCurveTo(w2, y0 + open * 1.25, -w2, y0 + open * 1.25, -w2, y0);
          pocketFill(pocket, y0 + open * 0.95, w2 * 0.72);
        }
        if (mo.teeth) {
          /* two buck teeth from under the nose, the curves drawn over
             their sides */
          const tw = 1.9, tt = ph + 0.1, tb = ph + 3.3, r = 0.8;
          const teeth = new Path2D();
          for (const [x0, x1] of [[-tw, -0.08], [0.08, tw]]) {
            teeth.moveTo(x0, tt);
            teeth.lineTo(x1, tt);
            teeth.lineTo(x1, tb - r);
            teeth.quadraticCurveTo(x1, tb, x1 - r, tb);
            teeth.lineTo(x0 + r, tb);
            teeth.quadraticCurveTo(x0, tb, x0, tb - r);
            teeth.closePath();
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fill(teeth);
          ctx.strokeStyle = ink;
          ctx.lineWidth = lw * 0.5;
          ctx.stroke(teeth);
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -0.4);
        ctx.lineTo(0, ph);
        ctx.moveTo(-hw, ph - 0.5);
        ctx.quadraticCurveTo(-hw * 0.5, ph + dip * 2, 0, ph);
        ctx.quadraticCurveTo(hw * 0.5, ph + dip * 2, hw, ph - 0.5);
        ctx.stroke();
      });
    } else if (mo.style === 'beak') {
      /* A two-tone beak: the lower half tucked under the upper, its tip
         peeking out below; working, it drops open on the dark inside. */
      const bw = mo.width ?? 4.5, bh = mo.height ?? 5.5;
      const gape = ww * (2.4 + 2.6 * hop) + wh * (2 + 2.6 * hop);
      at(lx * 0.2, ay, () => {
        if (gape > 0.2) {
          ctx.fillStyle = mo.inside ?? '#5B1F2B';
          ctx.beginPath();
          ctx.moveTo(-bw * 0.62, bh * 0.4);
          ctx.lineTo(bw * 0.62, bh * 0.4);
          ctx.lineTo(0, bh * 0.98 + gape);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = mo.shade ?? '#E07A1E';
        ctx.beginPath();
        ctx.moveTo(-bw * 0.7, bh * 0.3 + gape * 0.4);
        ctx.lineTo(bw * 0.7, bh * 0.3 + gape * 0.4);
        ctx.quadraticCurveTo(bw * 0.4, bh * 0.85 + gape, 0, bh * 1.18 + gape);
        ctx.quadraticCurveTo(-bw * 0.4, bh * 0.85 + gape, -bw * 0.7, bh * 0.3 + gape * 0.4);
        ctx.fill();
        ctx.fillStyle = mo.color ?? '#FFA63D';
        ctx.beginPath();
        ctx.moveTo(-bw, 0);
        ctx.quadraticCurveTo(0, -bh * 0.28, bw, 0);
        ctx.quadraticCurveTo(bw * 0.55, bh * 0.62, 0, bh);
        ctx.quadraticCurveTo(-bw * 0.55, bh * 0.62, -bw, 0);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.ellipse(-bw * 0.3, bh * 0.2, bw * 0.3, bh * 0.1, -0.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }
}
