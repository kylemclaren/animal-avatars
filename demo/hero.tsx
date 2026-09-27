/* The README's hero: every animal frozen in a chosen pose on one stage.
   Open /hero.html and screenshot #hero at 1280×640, 2×. */
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { drawAnimalAvatarFrame, animalAvatarPresets, animalAvatarShapes, animalAvatarParts, animalAvatarMarkings, autoInk, restPose, ANIMAL_AVATAR_OVERSCAN, type AnimalAvatarPose, type AnimalAvatarState, type AnimalAvatarType } from '../src';

const DEG = Math.PI / 180;

type Cast = { type: AnimalAvatarType; size: number; state?: AnimalAvatarState; pose: Partial<AnimalAvatarPose> };

const CAST: Cast[] = [
  { type: 'tiger', size: 212, pose: { yaw: 16 * DEG, pitch: 3 * DEG, lookX: 3, roll: -3 * DEG } },
  { type: 'elephant', size: 232, pose: { yaw: 9 * DEG, pitch: 4 * DEG, lookX: 2.5, lookY: -1 } },
  { type: 'panda', size: 264, state: 'working', pose: { yaw: 0, pitch: 6 * DEG, y: -14, sy: 1.04, sx: 0.97, lookY: -1.5 } },
  { type: 'bunny', size: 232, pose: { yaw: -9 * DEG, pitch: 3 * DEG, lookX: -2, roll: 4 * DEG } },
  { type: 'chameleon', size: 212, pose: { yaw: -16 * DEG, pitch: 2 * DEG, lookX: -3 } },
];

function Character({ type, size, state = 'default', pose }: Cast) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const p = animalAvatarPresets[type];
    const dpr = Math.min(3, devicePixelRatio || 1);
    c.width = c.height = Math.round(size * ANIMAL_AVATAR_OVERSCAN * dpr);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const face = type === 'elephant' ? 'eyes' : 'mouth';
    drawAnimalAvatarFrame(ctx, size, { ...restPose(state), ...pose } as AnimalAvatarPose, {
      path: new Path2D(animalAvatarShapes[type]), face, faceX: p.faceX, faceY: p.faceY, faceScale: p.faceScale,
      color: p.color, ink: autoInk(p.color), shading: 'plastic', typeKey: type, still: true, dpr,
      parts: animalAvatarParts[type] ? new Path2D(animalAvatarParts[type] as string) : undefined, partsColor: p.partsColor, partsDepth: p.partsDepth,
      markings: animalAvatarMarkings[type], dome: p.dome, eyes: p.eyes, mouth: p.mouth,
    });
  }, [type, size, state, pose]);
  const css = size * ANIMAL_AVATAR_OVERSCAN;
  const glow = animalAvatarPresets[type].color;
  return (
    <div className="char" style={{ margin: `0 ${-css * 0.16}px` }}>
      <div className="glow" style={{ width: size * 1.1, height: size * 1.1, background: glow }} />
      <div className="floor" style={{ width: size * 0.7 }} />
      <canvas ref={ref} style={{ width: css, height: css, margin: `${-css * 0.17}px 0 ${-css * 0.1}px` }} />
    </div>
  );
}

function Hero() {
  return (
    <div id="hero">
      <div className="title">
        <h1><span>animal-avatars</span></h1>
        <p>Cute, glossy, living animal avatars for React</p>
        <div className="facts"><span>5 animals</span><i /><span>idle · working · sleeping</span><i /><span>2D canvas, no WebGL</span></div>
      </div>
      <div className="stage">
        {CAST.map((c) => <Character key={c.type} {...c} />)}
      </div>
    </div>
  );
}

document.fonts.ready.then(() => createRoot(document.getElementById('root')!).render(<Hero />));
