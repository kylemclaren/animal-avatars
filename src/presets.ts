import type { AnimalAvatarFace, AnimalAvatarPreset, AnimalAvatarState, AnimalAvatarType } from './types';

/**
 * The five animals: each has its own colour, says where on its head the
 * face sits, and brings its own dome, eyes and mouth.
 */
export const animalAvatarPresets: Record<AnimalAvatarType, AnimalAvatarPreset> = {
  tiger: { label: 'Tiger', color: '#FF8A1F', face: 'mouth', faceX: 50, faceY: 54, faceScale: 0.9, dome: { cx: 50, cy: 58, rx: 39, ry: 34, bulge: 14 }, mouth: { style: 'animal', y: 71.5 }, eyes: { size: 0.8, tall: 0.7, gap: 1.2, y: -2, shine: 1 } },
  elephant: { label: 'Elephant', color: '#9DB3D6', face: 'eyes', faceX: 50, faceY: 44, faceScale: 0.85, dome: { cx: 50, cy: 46, rx: 27, ry: 27, bulge: 12 }, mouth: { style: 'none', y: 70 }, eyes: { size: 0.8, tall: 0.7, gap: 1.35, y: -1, shine: 1 } },
  panda: { label: 'Panda', color: '#F4F2FA', face: 'mouth', faceX: 50, faceY: 55, faceScale: 0.9, partsColor: '#2B2B35', dome: { cx: 50, cy: 56, rx: 38, ry: 33, bulge: 14 }, mouth: { style: 'animal', y: 71.3 }, eyes: { size: 0.52, tall: 0.8, gap: 1.15, y: -0.5, color: '#FFFFFF' } },
  bunny: { label: 'Bunny', color: '#B9A4FF', face: 'mouth', faceX: 50, faceY: 60, faceScale: 0.9, dome: { cx: 50, cy: 62, rx: 30, ry: 30, bulge: 12 }, mouth: { style: 'animal', y: 71.5 }, eyes: { size: 0.78, tall: 0.7, gap: 1.15, y: -1.5, shine: 1 } },
  chameleon: { label: 'Chameleon', color: '#5FD068', face: 'mouth', faceX: 50, faceY: 52, faceScale: 0.95, partsDepth: 0.5, dome: { cx: 50, cy: 58, rx: 34, ry: 29, bulge: 12 }, mouth: { style: 'smile', y: 71, width: 13 }, eyes: { size: 0.72, tall: 0.8, gap: 2.36, y: -3.1, shine: 1 } },
};

export const animalAvatarTypes = Object.keys(animalAvatarPresets) as AnimalAvatarType[];
export const animalAvatarFaces: AnimalAvatarFace[] = ['eyes', 'mouth'];
export const animalAvatarStates: AnimalAvatarState[] = ['default', 'working', 'sleeping'];

/** Colour by animal — the palette on its own. */
export const animalAvatarPalette: Record<AnimalAvatarType, string> = Object.fromEntries(
  animalAvatarTypes.map((t) => [t, animalAvatarPresets[t].color])
) as Record<AnimalAvatarType, string>;

export const stateLabels: Record<AnimalAvatarState, string> = {
  default: 'idle',
  working: 'working',
  sleeping: 'sleeping',
};
