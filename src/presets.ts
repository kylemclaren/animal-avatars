import type { AnimalAvatarFace, AnimalAvatarPreset, AnimalAvatarState, AnimalAvatarType } from './types';

/**
 * The twelve animals: each has its own colour, says where on its head the
 * face sits, and brings its own dome, eyes and mouth.
 */
export const animalAvatarPresets: Record<AnimalAvatarType, AnimalAvatarPreset> = {
  tiger: { label: 'Tiger', color: '#FF8A1F', face: 'mouth', faceX: 50, faceY: 54, faceScale: 0.9, dome: { cx: 50, cy: 58, rx: 39, ry: 34, bulge: 14 }, mouth: { style: 'animal', y: 71.5 }, eyes: { size: 0.8, tall: 0.7, gap: 1.2, y: -2, shine: 1 } },
  elephant: { label: 'Elephant', color: '#9DB3D6', face: 'eyes', faceX: 50, faceY: 44, faceScale: 0.85, dome: { cx: 50, cy: 46, rx: 27, ry: 27, bulge: 12 }, mouth: { style: 'none', y: 70 }, eyes: { size: 0.8, tall: 0.7, gap: 1.35, y: -1, shine: 1 } },
  panda: { label: 'Panda', color: '#F4F2FA', face: 'mouth', faceX: 50, faceY: 55, faceScale: 0.9, partsColor: '#2B2B35', dome: { cx: 50, cy: 56, rx: 38, ry: 33, bulge: 14 }, mouth: { style: 'animal', y: 71.3 }, eyes: { size: 0.52, tall: 0.8, gap: 1.15, y: -0.5, color: '#FFFFFF' } },
  bunny: { label: 'Bunny', color: '#B9A4FF', face: 'mouth', faceX: 50, faceY: 60, faceScale: 0.9, dome: { cx: 50, cy: 62, rx: 30, ry: 30, bulge: 12 }, mouth: { style: 'animal', y: 71.5, teeth: true }, eyes: { size: 0.78, tall: 0.7, gap: 1.15, y: -1.5, shine: 1 } },
  chameleon: { label: 'Chameleon', color: '#5FD068', face: 'mouth', faceX: 50, faceY: 52, faceScale: 0.95, partsDepth: 0.5, dome: { cx: 50, cy: 58, rx: 34, ry: 29, bulge: 12 }, mouth: { style: 'smile', y: 71, width: 13, snap: true }, eyes: { size: 0.5, tall: 0.8, gap: 2.36, y: -3.1, shine: 1, iris: '#F6C443', irisSize: 1.8, roll: true } },
  penguin: { label: 'Penguin', color: '#33406A', face: 'mouth', faceX: 50, faceY: 57, faceScale: 0.9, dome: { cx: 50, cy: 56, rx: 38, ry: 36, bulge: 14 }, mouth: { style: 'beak', y: 61.5, width: 6.2, height: 6.8, color: '#FFA63D', shade: '#EE7A1E' }, eyes: { size: 0.78, tall: 0.72, gap: 1.05, y: -1.5, shine: 1, color: '#1D2135' } },
  pig: { label: 'Pig', color: '#FFA9C2', face: 'mouth', faceX: 50, faceY: 53, faceScale: 0.9, dome: { cx: 50, cy: 58, rx: 38, ry: 32, bulge: 14 }, mouth: { style: 'smile', y: 81, width: 4.5 }, eyes: { size: 0.8, tall: 0.7, gap: 1.16, y: -1, shine: 1 } },
  lion: { label: 'Lion', color: '#FFB53B', face: 'mouth', faceX: 50, faceY: 53, faceScale: 0.9, partsColor: '#E07A2E', partsDepth: 0.6, dome: { cx: 50, cy: 57, rx: 29, ry: 29, bulge: 12 }, mouth: { style: 'animal', y: 70 }, eyes: { size: 0.78, tall: 0.7, gap: 0.98, y: -1, shine: 1 } },
  octopus: { label: 'Octopus', color: '#FF7373', face: 'mouth', faceX: 50, faceY: 50, faceScale: 0.95, partsDepth: 0.55, dome: { cx: 50, cy: 48, rx: 34, ry: 31, bulge: 14 }, mouth: { style: 'smile', y: 61, width: 5 }, eyes: { size: 0.88, tall: 0.75, gap: 1.01, y: -1, shine: 1 } },
  owl: { label: 'Owl', color: '#B07A51', face: 'mouth', faceX: 50, faceY: 56, faceScale: 0.95, dome: { cx: 50, cy: 57, rx: 37, ry: 34, bulge: 14 }, mouth: { style: 'beak', y: 59.5, width: 4.6, height: 8, color: '#FFB23F', shade: '#E3861E' }, eyes: { size: 1, tall: 0.78, gap: 1.095, y: -1, shine: 2, color: '#2A1C12' } },
  sheep: { label: 'Sheep', color: '#FFF7EA', face: 'mouth', faceX: 50, faceY: 62, faceScale: 0.88, partsColor: '#EBB894', partsDepth: 0.45, dome: { cx: 50, cy: 58, rx: 34, ry: 32, bulge: 14 }, mouth: { style: 'animal', y: 73.3 }, eyes: { size: 0.72, tall: 0.75, gap: 0.93, y: -0.5, shine: 1 } },
  whale: { label: 'Whale', color: '#4AAEF0', face: 'mouth', faceX: 44, faceY: 55, faceScale: 0.95, partsColor: '#BFEAFF', dome: { cx: 44, cy: 58, rx: 35, ry: 29, bulge: 13 }, mouth: { style: 'smile', y: 66, width: 9 }, eyes: { size: 0.8, tall: 0.72, gap: 1.01, y: -1, shine: 1 } },
};

export const animalAvatarTypes = Object.keys(animalAvatarPresets) as AnimalAvatarType[];
export const animalAvatarFaces: AnimalAvatarFace[] = ['eyes', 'mouth'];
export const animalAvatarStates: AnimalAvatarState[] = ['default', 'working', 'thinking', 'happy', 'sleeping'];

/** Colour by animal — the palette on its own. */
export const animalAvatarPalette: Record<AnimalAvatarType, string> = Object.fromEntries(
  animalAvatarTypes.map((t) => [t, animalAvatarPresets[t].color])
) as Record<AnimalAvatarType, string>;

export const stateLabels: Record<AnimalAvatarState, string> = {
  default: 'idle',
  working: 'working',
  sleeping: 'sleeping',
  thinking: 'thinking',
  happy: 'happy',
};
