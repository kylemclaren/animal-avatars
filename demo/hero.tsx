/* The README's hero: the animals as a repeating pattern, the title on a
   plate in the middle.
   Open /hero.html (dark) or /hero.html?theme=light and screenshot #hero
   at 1280×640, 2×. */
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { drawAnimalAvatarFrame, animalAvatarPresets, animalAvatarShapes, animalAvatarParts, animalAvatarMarkings, autoInk, restPose, ANIMAL_AVATAR_OVERSCAN, type AnimalAvatarPose, type AnimalAvatarState, type AnimalAvatarType } from '../src';

const DEG = Math.PI / 180;

type Cast = { type: AnimalAvatarType; size: number; state?: AnimalAvatarState; pose: Partial<AnimalAvatarPose> };

/* The pattern: a staggered grid, every row shifted half a cell and two
   animals along, so no animal stacks over itself; each tile gets its own
   turn and tilt, and now and then one is asleep or mid-hop. */
const CELL_X = 136, CELL_Y = 124, TILE = 78;
const ORDER: AnimalAvatarType[] = ['tiger', 'elephant', 'panda', 'bunny', 'chameleon'];
const YAWS = [-18, 10, -6, 16, -12, 4];
const ROLLS = [-6, 3, 0, 5, -3, -1, 6];
const tiles: (Cast & { x: number; y: number; key: string })[] = [];
for (let row = -1; row <= 5; row++) {
  for (let col = -1; col <= 9; col++) {
    const n = (row + 1) * 11 + col + 1;
    const type = ORDER[(((col + row * 2) % 5) + 5) % 5];
    const sleeping = n % 9 === 4, working = n % 7 === 2;
    tiles.push({
      key: `${row}:${col}`,
      type,
      size: TILE,
      state: sleeping ? 'sleeping' : working ? 'working' : 'default',
      x: col * CELL_X + (row % 2 ? CELL_X / 2 : 0) + 8,
      y: row * CELL_Y + 22,
      pose: { yaw: YAWS[n % YAWS.length] * DEG, roll: ROLLS[n % ROLLS.length] * DEG, pitch: 3 * DEG, lookX: ((n % 5) - 2) * 1.2, ...(working ? { y: -8 } : {}) },
    });
  }
}

function Tile({ type, size, state = 'default', pose, x, y }: Cast & { x: number; y: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const p = animalAvatarPresets[type];
    const dpr = Math.min(3, devicePixelRatio || 1);
    c.width = c.height = Math.round(size * ANIMAL_AVATAR_OVERSCAN * dpr);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAnimalAvatarFrame(ctx, size, { ...restPose(state), ...pose } as AnimalAvatarPose, {
      path: new Path2D(animalAvatarShapes[type]), face: p.face, faceX: p.faceX, faceY: p.faceY, faceScale: p.faceScale,
      color: p.color, ink: autoInk(p.color), shading: 'plastic', typeKey: type, still: true, dpr,
      parts: animalAvatarParts[type] ? new Path2D(animalAvatarParts[type] as string) : undefined, partsColor: p.partsColor, partsDepth: p.partsDepth,
      markings: animalAvatarMarkings[type], dome: p.dome, eyes: p.eyes, mouth: p.mouth,
    });
  }, [type, size, state, pose]);
  const css = size * ANIMAL_AVATAR_OVERSCAN;
  return <canvas ref={ref} className="tile" style={{ left: x - css / 2, top: y - css / 2, width: css, height: css }} />;
}

const theme = new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark';

function Hero() {
  return (
    <div id="hero" data-theme={theme}>
      <div className="pattern">{tiles.map(({ key, ...t }) => <Tile key={key} {...t} />)}</div>
      <div className="veil" />
      <div className="plate">
        <h1><span>animal-avatars</span></h1>
        <p>Cute, glossy, living animal avatars for React</p>
        <div className="facts"><span>5 animals</span><i /><span>idle · working · sleeping</span><i /><span>2D canvas, no WebGL</span></div>
      </div>
    </div>
  );
}

document.fonts.ready.then(() => createRoot(document.getElementById('root')!).render(<Hero />));
