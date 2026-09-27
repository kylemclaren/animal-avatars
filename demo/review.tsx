/* Close-ups for tuning: /review.html?a=owl,lion&size=220&light */
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { drawAnimalAvatarFrame, animalAvatarTypes, animalAvatarPresets, animalAvatarShapes, animalAvatarParts, animalAvatarMarkings, autoInk, restPose, ANIMAL_AVATAR_OVERSCAN, type AnimalAvatarPose, type AnimalAvatarState, type AnimalAvatarType } from '../src';

const DEG = Math.PI / 180;
const q = new URLSearchParams(location.search);
const LIST = (q.get('a')?.split(',') as AnimalAvatarType[]) ?? animalAvatarTypes;
const SIZE = Number(q.get('size') ?? 200);
if (q.has('light')) document.body.classList.add('light');
const shading = (q.get('shading') ?? 'plastic') as 'plastic';

const SHOTS: { label: string; state: AnimalAvatarState; pose: Partial<AnimalAvatarPose>; face?: 'eyes' | 'mouth' }[] = [
  { label: 'front', state: 'default', pose: {} },
  { label: '25°', state: 'default', pose: { yaw: 25 * DEG, lookX: 3 } },
  { label: '-40°', state: 'default', pose: { yaw: -40 * DEG } },
  { label: 'working', state: 'working', pose: { y: -20 } },
  { label: 'sleeping', state: 'sleeping', pose: {} },
];

function Shot({ type, state, pose, face }: { type: AnimalAvatarType; state: AnimalAvatarState; pose: Partial<AnimalAvatarPose>; face?: 'eyes' | 'mouth' }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const p = animalAvatarPresets[type];
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = c.height = Math.round(SIZE * ANIMAL_AVATAR_OVERSCAN * dpr);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAnimalAvatarFrame(ctx, SIZE, { ...restPose(state), ...pose } as AnimalAvatarPose, {
      path: new Path2D(animalAvatarShapes[type]), face: face ?? p.face, faceX: p.faceX, faceY: p.faceY, faceScale: p.faceScale,
      color: p.color, ink: autoInk(p.color), shading, typeKey: type, still: true, dpr,
      parts: animalAvatarParts[type] ? new Path2D(animalAvatarParts[type] as string) : undefined, partsColor: p.partsColor, partsDepth: p.partsDepth,
      markings: animalAvatarMarkings[type], dome: p.dome, eyes: p.eyes, mouth: p.mouth,
    });
  }, [type, state, pose, face]);
  const css = SIZE * ANIMAL_AVATAR_OVERSCAN;
  return <canvas ref={ref} style={{ width: css, height: css, margin: -css * 0.13 }} />;
}

function App() {
  return (
    <>
      {LIST.map((t) => (
        <div className="row" key={t}>
          <span className="label">{t}</span>
          {SHOTS.map((s) => <Shot key={s.label} type={t} state={s.state} pose={s.pose} face={s.face} />)}
        </div>
      ))}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
