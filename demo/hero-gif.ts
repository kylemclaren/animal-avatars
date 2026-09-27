/* The README's animated hero, drawn on one canvas: a staggered pattern of
   every animal, each alive on its own sim, under a title plate.

   /hero-gif.html?theme=dark            plays it live
   /hero-gif.html?theme=dark&sink=URL   records it: T frames at FPS, the
                                        last K cross-faded into the first so
                                        the loop has no seam, each posted to
                                        scripts/hero-gif.mjs */
import {
  AnimalAvatarSim,
  drawAnimalAvatarFrame,
  animalAvatarTypes,
  animalAvatarStates,
  animalAvatarPresets,
  animalAvatarShapes,
  animalAvatarParts,
  animalAvatarMarkings,
  autoInk,
  ANIMAL_AVATAR_OVERSCAN,
  type AnimalAvatarDrawConfig,
  type AnimalAvatarState,
} from '../src';

const W = 1280, H = 640, FPS = 25, T = 100, K = 15;
const q = new URLSearchParams(location.search);
const theme: 'dark' | 'light' = q.get('theme') === 'light' ? 'light' : 'dark';
const sink = q.get('sink');

const INK = {
  dark: {
    base: ['#15112A', '#0E0C1A'],
    glows: [
      { cx: 0.5, cy: 1.15, rx: 1.2, ry: 0.9, color: '58,42,107', stop: 0.6, a: 1 },
      { cx: 0.5, cy: -0.1, rx: 0.7, ry: 0.6, color: '42,33,80', stop: 0.7, a: 1 },
    ],
    dots: { colors: ['#FFFFFF'], alpha: 0.55, sizes: [1.5, 1, 1.5, 1, 1, 1.5, 1, 1.5, 1, 1] },
    veil: '14,12,26', veilA: [0.62, 0.18],
    plate: 'rgba(21,17,42,0.78)', plateEdge: 'rgba(255,255,255,0.1)', plateShadow: 'rgba(0,0,0,0.45)',
    title: ['#FFB36B', '#FF8FB1', '#B9A4FF', '#7FE08A'],
    sub: '#BDB3DC',
    pill: 'rgba(255,255,255,0.06)', pillEdge: 'rgba(255,255,255,0.09)', pillText: '#A99FCB', pillDot: '#6E6494',
  },
  light: {
    base: ['#FBF9FF', '#F1ECFD'],
    glows: [
      { cx: 0.5, cy: 1.18, rx: 1.2, ry: 0.9, color: '217,204,255', stop: 0.62, a: 1 },
      { cx: 0.5, cy: -0.1, rx: 0.7, ry: 0.6, color: '255,255,255', stop: 0.7, a: 1 },
    ],
    dots: { colors: ['#FFC59A', '#C9B8FF', '#FFB3C7', '#A8E6B0'], alpha: 0.7, sizes: [3, 2.5, 3, 2, 2.5, 3, 2, 3, 2, 2.5] },
    veil: '247,244,255', veilA: [0.66, 0.2],
    plate: 'rgba(252,250,255,0.84)', plateEdge: 'rgba(90,70,160,0.14)', plateShadow: 'rgba(70,50,130,0.18)',
    title: ['#FF7A2E', '#EE4F86', '#8363FF', '#2FB553'],
    sub: '#5E5387',
    pill: 'rgba(90,70,160,0.06)', pillEdge: 'rgba(90,70,160,0.14)', pillText: '#6D6199', pillDot: '#B4A9D6',
  },
}[theme];
const DOTS = [[8, 18], [17, 42], [27, 9], [38, 30], [61, 12], [72, 36], [83, 8], [93, 27], [4, 58], [97, 55]];

/* ── the pattern: every row shifted half a cell and five animals along ── */
const CELL_X = 136, CELL_Y = 124, TILE = 78;
const CSS = TILE * ANIMAL_AVATAR_OVERSCAN;
type Tile = { x: number; y: number; sim: InstanceType<typeof AnimalAvatarSim>; cfg: AnimalAvatarDrawConfig; canvas: HTMLCanvasElement };
const tiles: Tile[] = [];
for (let row = -1; row <= 5; row++) {
  for (let col = -1; col <= 9; col++) {
    const n = (row + 1) * 11 + col + 1;
    const type = animalAvatarTypes[(((col + row * 5) % animalAvatarTypes.length) + animalAvatarTypes.length) % animalAvatarTypes.length];
    const state: AnimalAvatarState = n % 9 === 4 ? 'sleeping' : n % 7 === 2 ? 'working' : n % 10 === 7 ? 'thinking' : n % 8 === 1 ? 'happy' : 'default';
    const p = animalAvatarPresets[type];
    const sim = new AnimalAvatarSim((n * 0.6180339) % 1, state);
    /* desynchronise: each starts a different way into its own life */
    for (let k = 0, w = 60 + ((n * 37) % 150); k < w; k++) sim.update(1 / 60);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.round(CSS);
    tiles.push({
      x: col * CELL_X + (row % 2 ? CELL_X / 2 : 0) + 8,
      y: row * CELL_Y + 22,
      sim,
      canvas,
      cfg: {
        path: new Path2D(animalAvatarShapes[type]), face: p.face, faceX: p.faceX, faceY: p.faceY, faceScale: p.faceScale,
        color: p.color, ink: autoInk(p.color), shading: 'plastic', typeKey: type, still: true, dpr: 1, theme,
        parts: animalAvatarParts[type] ? new Path2D(animalAvatarParts[type] as string) : undefined, partsColor: p.partsColor, partsDepth: p.partsDepth,
        markings: animalAvatarMarkings[type], dome: p.dome, eyes: p.eyes, mouth: p.mouth,
      },
    });
  }
}

const hero = document.getElementById('hero') as HTMLCanvasElement;
hero.width = W;
hero.height = H;
const ctx = hero.getContext('2d')!;
const under = document.createElement('canvas');
under.width = W;
under.height = H;
const uctx = under.getContext('2d')!;

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* an elliptical glow, as CSS draws radial-gradient(rx ry at cx cy) */
function glow(c: CanvasRenderingContext2D, g: (typeof INK)['glows'][number]) {
  c.save();
  c.translate(g.cx * W, g.cy * H);
  c.scale(g.rx * W, g.ry * H);
  const rg = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  rg.addColorStop(0, `rgba(${g.color},${g.a})`);
  rg.addColorStop(g.stop, `rgba(${g.color},0)`);
  c.fillStyle = rg;
  c.fillRect(-2, -2, 4, 4);
  c.restore();
}

function backdrop(c: CanvasRenderingContext2D) {
  const lg = c.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, INK.base[0]);
  lg.addColorStop(1, INK.base[1]);
  c.fillStyle = lg;
  c.fillRect(0, 0, W, H);
  for (const g of INK.glows) glow(c, g);
  c.globalAlpha = INK.dots.alpha;
  DOTS.forEach(([x, y], i) => {
    c.fillStyle = INK.dots.colors[i % INK.dots.colors.length];
    c.beginPath();
    c.arc((x / 100) * W, (y / 100) * H, INK.dots.sizes[i] / 2 + 0.25, 0, Math.PI * 2);
    c.fill();
  });
  c.globalAlpha = 1;
}

/* ── the plate: measured once the font is in ── */
const TITLE_FONT = '700 72px Fredoka', SUB_FONT = '500 23px Fredoka', PILL_FONT = '500 15px Fredoka';
const FACTS = [`${animalAvatarTypes.length} animals`, `${animalAvatarStates.length} states`, '2D canvas, no WebGL'];
let plate = { x: 0, y: 0, w: 0, h: 0 };
let pillW = 0;
function measure() {
  ctx.font = TITLE_FONT;
  ctx.letterSpacing = '-1.5px';
  const tw = ctx.measureText('animal-avatars').width;
  ctx.letterSpacing = '0px';
  ctx.font = SUB_FONT;
  const sw = ctx.measureText('Cute, glossy, living animal avatars for React').width;
  ctx.font = PILL_FONT;
  pillW = 36 + FACTS.reduce((a, f) => a + ctx.measureText(f).width, 0) + (FACTS.length - 1) * 28;
  const w = Math.max(tw, sw, pillW) + 112, h = 38 + 72 + 12 + 28 + 16 + 35 + 36;
  plate = { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

function drawPlate() {
  const { x, y, w, h } = plate;
  /* shadow, then the blurred pattern through the glass, then the tint */
  ctx.save();
  ctx.shadowColor = INK.plateShadow;
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 24;
  roundRect(ctx, x, y, w, h, 40);
  ctx.fillStyle = INK.plate;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, 40);
  ctx.clip();
  ctx.filter = 'blur(14px)';
  ctx.drawImage(under, 0, 0);
  ctx.filter = 'none';
  ctx.fillStyle = INK.plate;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 40);
  ctx.strokeStyle = INK.plateEdge;
  ctx.lineWidth = 1;
  ctx.stroke();

  /* the wordmark, its gradient spanning just the word */
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = TITLE_FONT;
  ctx.letterSpacing = '-1.5px';
  const tw = ctx.measureText('animal-avatars').width;
  const tg = ctx.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
  INK.title.forEach((c, i) => tg.addColorStop([0, 0.35, 0.65, 1][i], c));
  ctx.fillStyle = tg;
  const ty = y + 38 + 60;
  ctx.fillText('animal-avatars', W / 2, ty);
  ctx.letterSpacing = '0px';

  ctx.font = SUB_FONT;
  ctx.fillStyle = INK.sub;
  const sy = ty + 12 + 36;
  ctx.fillText('Cute, glossy, living animal avatars for React', W / 2, sy);

  /* the facts pill */
  const ph = 35, px = W / 2 - pillW / 2, py = sy + 18;
  roundRect(ctx, px, py, pillW, ph, ph / 2);
  ctx.fillStyle = INK.pill;
  ctx.fill();
  ctx.strokeStyle = INK.pillEdge;
  ctx.stroke();
  ctx.font = PILL_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = px + 18;
  FACTS.forEach((f, i) => {
    if (i) {
      ctx.fillStyle = INK.pillDot;
      ctx.beginPath();
      ctx.arc(cx + 12, py + ph / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      cx += 28;
    }
    ctx.fillStyle = INK.pillText;
    ctx.fillText(f, cx, py + ph / 2 + 1);
    cx += ctx.measureText(f).width;
  });
}

function frame(dt: number) {
  backdrop(uctx);
  for (const t of tiles) {
    if (dt > 0) t.sim.update(dt);
    const tc = t.canvas.getContext('2d')!;
    tc.setTransform(1, 0, 0, 1, 0, 0);
    drawAnimalAvatarFrame(tc, TILE, t.sim.pose, t.cfg);
    uctx.drawImage(t.canvas, t.x - CSS / 2, t.y - CSS / 2);
  }
  /* a veil toward the middle, so the plate's words have room */
  uctx.save();
  uctx.translate(W / 2, H / 2);
  uctx.scale(0.6 * W, 0.62 * H);
  const vg = uctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  vg.addColorStop(0, `rgba(${INK.veil},${INK.veilA[0]})`);
  vg.addColorStop(0.7, `rgba(${INK.veil},${INK.veilA[1]})`);
  vg.addColorStop(1, `rgba(${INK.veil},0)`);
  uctx.fillStyle = vg;
  uctx.fillRect(-2, -2, 4, 4);
  uctx.restore();
  ctx.drawImage(under, 0, 0);
  drawPlate();
}

const status = document.getElementById('status')!;
const post = (path: string, body?: Blob) => fetch(`${sink}${path}${path.includes('?') ? '&' : '?'}theme=${theme}`, { method: 'POST', body });
const png = () => new Promise<Blob>((r) => hero.toBlob((b) => r(b!), 'image/png'));

async function record() {
  await post('/start');
  const head: ImageBitmap[] = [];
  for (let f = 0; f < T + K; f++) {
    frame(f === 0 ? 0 : 1 / FPS);
    if (f < K) head.push(await createImageBitmap(hero));
    if (f >= K && f < T) await post(`/frame?i=${f}`, await png());
    if (f >= T) {
      /* the tail dissolves into the head: frame T-1 flows on into frame 0 */
      const i = f - T;
      ctx.globalAlpha = i / K;
      ctx.drawImage(head[i], 0, 0);
      ctx.globalAlpha = 1;
      await post(`/frame?i=${i}`, await png());
    }
    status.textContent = `recording ${theme}: ${f + 1} / ${T + K}`;
  }
  await post(`/done?fps=${FPS}`);
  status.textContent = `done: docs/hero-${theme}.gif`;
  document.title = 'done';
}

async function play() {
  let last = performance.now();
  const loop = (now: number) => {
    frame(Math.min(0.05, (now - last) / 1000));
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

document.body.style.background = INK.base[1];
await Promise.all([document.fonts.load(TITLE_FONT), document.fonts.load(SUB_FONT), document.fonts.load(PILL_FONT)]);
measure();
if (sink) record();
else play();
