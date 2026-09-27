export { AnimalAvatar } from './AnimalAvatar';
export { default } from './AnimalAvatar';

export {
  animalAvatarPresets,
  animalAvatarPalette,
  animalAvatarTypes,
  animalAvatarFaces,
  animalAvatarStates,
} from './presets';
export { SHAPE_PATHS as animalAvatarShapes, SHAPE_PARTS as animalAvatarParts, SHAPE_BACK as animalAvatarBack, SHAPE_MARKINGS as animalAvatarMarkings } from './shapes';
export { drawConfigFor as animalAvatarDrawConfig } from './config';
export { autoInk, luminance, parseColor, shade } from './color';
export { Sim as AnimalAvatarSim, restPose } from './engine';
export { draw as drawAnimalAvatarFrame, OVERSCAN as ANIMAL_AVATAR_OVERSCAN, RISE as ANIMAL_AVATAR_RISE } from './draw';
export { warmPlastic as warmAnimalAvatarPlastic } from './plastic';
/* the plastic material's building blocks, for renderers on other canvases */
export { buildForm as bakeAnimalAvatarForm, buildMatcap as buildAnimalAvatarMatcap, shadeTexels as shadeAnimalAvatarTexels, capFrame as animalAvatarCapFrame, tierFor as animalAvatarTier, PAD as ANIMAL_AVATAR_PAD, SPAN as ANIMAL_AVATAR_SPAN, MATCAP_SIZE as ANIMAL_AVATAR_MATCAP_SIZE } from './plastic';
export type { Form as AnimalAvatarForm, Frame as AnimalAvatarFrame, Material as AnimalAvatarMaterial, Rig as AnimalAvatarRig } from './plastic';
export { JUMP_DEFAULTS as animalAvatarJumpDefaults } from './engine';
export type { JumpConfig as AnimalAvatarJumpConfig } from './engine';
export type { DrawConfig as AnimalAvatarDrawConfig } from './draw';
export type { Pose as AnimalAvatarPose } from './engine';

export type {
  AnimalAvatarProps,
  AnimalAvatarType,
  AnimalAvatarFace,
  AnimalAvatarState,
  AnimalAvatarShading,
  AnimalAvatarPreset,
  AnimalAvatarMouth,
  AnimalAvatarEyeStyle,
  AnimalAvatarSquashEase,
} from './types';
