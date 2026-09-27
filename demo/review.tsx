/* Close-ups for tuning: /review.html?a=owl,lion&size=220&light */
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimalAvatarSim, animalAvatarDrawConfig, drawAnimalAvatarFrame, animalAvatarTypes, animalAvatarPresets, animalAvatarShapes, animalAvatarParts, animalAvatarMarkings, autoInk, restPose, ANIMAL_AVATAR_OVERSCAN, type AnimalAvatarPose, type AnimalAvatarState, type AnimalAvatarType } from '../src';

const DEG = Math.PI / 180;
const q = new URLSearchParams(location.search);
const LIST = (q.get('a')?.split(',') as AnimalAvatarType[]) ?? animalAvatarTypes;
const SIZE = Number(q.get('size') ?? 200);
if (q.has('light')) document.body.classList.add('light');
const shading = (q.get('shading') ?? 'plastic') as 'plastic';

/* a pose from a real sim, `at` seconds into the state (the states' own
   motion — a ponder, a bounce — is the point of looking at them) */
const lived = (state: AnimalAvatarState, at: number): Partial<AnimalAvatarPose> => {
  const sim = new AnimalAvatarSim(0.37, state);
  for (let t = 0; t < at; t += 1 / 60) sim.update(1 / 60);
  return { ...sim.pose, w: [...sim.pose.w] as AnimalAvatarPose['w'] };
};
const SHOTS: { label: string; state: AnimalAvatarState; pose: Partial<AnimalAvatarPose>; face?: 'eyes' | 'mouth' }[] = [
  { label: 'front', state: 'default', pose: {} },
  { label: '25°', state: 'default', pose: { yaw: 25 * DEG, lookX: 3 } },
  { label: '-40°', state: 'default', pose: { yaw: -40 * DEG } },
  { label: 'working', state: 'working', pose: { y: -20 } },
  { label: 'sleeping', state: 'sleeping', pose: {} },
  { label: 'tongue', state: 'default', pose: { tongue: 1, yaw: 14 * DEG, time: 2 } },
  { label: 'thinking', state: 'thinking', pose: lived('thinking', Number(q.get('think') ?? 2.6)) },
  { label: 'happy', state: 'happy', pose: lived('happy', Number(q.get('happy') ?? 0.55)) },
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
    drawAnimalAvatarFrame(ctx, SIZE, { ...restPose(state), ...pose } as AnimalAvatarPose,
      animalAvatarDrawConfig(type, { face: face ?? p.face, shading, still: true, dpr, theme: q.has('light') ? 'light' : 'dark' }));
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
