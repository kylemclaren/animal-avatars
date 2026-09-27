import type { DrawConfig } from './draw';
import type { AnimalAvatarType } from './types';
import { animalAvatarPresets } from './presets';
import { SHAPE_PATHS, SHAPE_PARTS, SHAPE_BACK, SHAPE_MARKINGS } from './shapes';
import { autoInk } from './color';

/**
 * Everything the renderer needs to draw an animal, from its preset and
 * shapes, for drawing frames yourself with `drawAnimalAvatarFrame` (a
 * recorder, a sprite sheet, another canvas). `over` replaces any of it.
 */
export function drawConfigFor(type: AnimalAvatarType, over: Partial<DrawConfig> = {}): DrawConfig {
  const p = animalAvatarPresets[type];
  const parts = SHAPE_PARTS[type];
  return {
    path: new Path2D(SHAPE_PATHS[type]),
    parts: parts ? new Path2D(parts) : undefined,
    partsColor: p.partsColor,
    partsDepth: p.partsDepth,
    back: SHAPE_BACK[type]?.map((l) => ({ path: new Path2D(l.d), color: l.color, depth: l.depth })),
    markings: SHAPE_MARKINGS[type],
    dome: p.dome,
    eyes: p.eyes,
    mouth: p.mouth,
    face: p.face,
    faceX: p.faceX,
    faceY: p.faceY,
    faceScale: p.faceScale,
    color: p.color,
    ink: autoInk(p.color),
    shading: 'plastic',
    typeKey: type,
    ...over,
  };
}
