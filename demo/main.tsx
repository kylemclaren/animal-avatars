import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimalAvatar, drawAnimalAvatarFrame, animalAvatarPresets, animalAvatarShapes, animalAvatarParts, animalAvatarMarkings, autoInk, restPose, ANIMAL_AVATAR_OVERSCAN, type AnimalAvatarState, type AnimalAvatarType } from '../src';

const DEG = Math.PI / 180;
const ANIMALS: AnimalAvatarType[] = ['tiger', 'elephant', 'panda', 'bunny', 'chameleon'];
const YAWS = [-40, -20, 0, 20, 40];
const states: AnimalAvatarState[] = ['default', 'working', 'sleeping'];

/* one frozen pose per canvas: the head turned by `yaw` */
function TurnStrip({ type, size = 96, state = 'default' }: { type: AnimalAvatarType; size?: number; state?: AnimalAvatarState }) {
  const refs = useRef<Array<HTMLCanvasElement | null>>([]);
  useEffect(() => {
    const p = animalAvatarPresets[type];
    const dpr = Math.min(2, devicePixelRatio || 1);
    YAWS.forEach((yaw, i) => {
      const c = refs.current[i];
      if (!c) return;
      c.width = c.height = Math.round(size * ANIMAL_AVATAR_OVERSCAN * dpr);
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pose = { ...restPose(state), yaw: yaw * DEG };
      drawAnimalAvatarFrame(ctx, size, pose, {
        path: new Path2D(animalAvatarShapes[type]), face: p.face, faceX: p.faceX, faceY: p.faceY, faceScale: p.faceScale,
        color: p.color, ink: autoInk(p.color), shading: 'plastic', typeKey: type, still: true, dpr,
        parts: animalAvatarParts[type] ? new Path2D(animalAvatarParts[type] as string) : undefined, partsColor: p.partsColor, partsDepth: p.partsDepth,
        markings: animalAvatarMarkings[type], dome: p.dome, eyes: p.eyes, mouth: p.mouth,
      });
    });
  }, [type, size, state]);
  const css = size * ANIMAL_AVATAR_OVERSCAN;
  return (
    <>
      {YAWS.map((y, i) => (
        <div className="cell" key={y}>
          <canvas ref={(el) => (refs.current[i] = el)} style={{ width: css, height: css, margin: -css * 0.12 }} />
          <span className="label">{y}°</span>
        </div>
      ))}
    </>
  );
}

function App() {
  return (
    <>
      <h1>Animals: tiger, elephant, panda, bunny, chameleon. Hover to make them look, click to make them hop.</h1>
      <div className="row">
        {ANIMALS.map((t, i) => (
          <div className="cell" key={t}><AnimalAvatar type={t} size={170} seed={i / 5} /><span className="label">{animalAvatarPresets[t].label}</span></div>
        ))}
      </div>
      <h2>States: idle, working, sleeping</h2>
      {ANIMALS.map((t) => (
        <div className="row tight" key={t}>
          {states.map((s) => (
            <div className="cell" key={s}><AnimalAvatar type={t} state={s} size={110} /><span className="label">{s}</span></div>
          ))}
          <TurnStrip type={t} />
        </div>
      ))}
      <h2>Small sizes, dark and light</h2>
      <div className="row">
        {ANIMALS.map((t) => <AnimalAvatar key={t} type={t} size={48} />)}
        {ANIMALS.map((t) => <AnimalAvatar key={t + '32'} type={t} size={32} />)}
      </div>
      <div className="row light" data-theme="light">
        {ANIMALS.map((t) => <AnimalAvatar key={t} type={t} size={64} />)}
        {ANIMALS.map((t) => <AnimalAvatar key={t + '48'} type={t} size={48} />)}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
