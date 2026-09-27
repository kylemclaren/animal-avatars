import type { CanvasHTMLAttributes, CSSProperties } from 'react';

/** The animals. */
export type AnimalAvatarType =
  | 'tiger'
  | 'elephant'
  | 'panda'
  | 'bunny'
  | 'chameleon'
  | 'penguin'
  | 'pig'
  | 'lion'
  | 'octopus'
  | 'owl'
  | 'sheep'
  | 'whale';

/**
 * What the face is made of: the eyes alone, or the eyes and the animal's
 * own mouth, which changes with the state. Each animal has its default.
 */
export type AnimalAvatarFace = 'eyes' | 'mouth';

/**
 * What the animal is doing. Each state is a pose plus its own motion:
 * - `default`: idle. Breathes, blinks, glances around, hops now and then.
 * - `working`: hops, and every third hop spins.
 * - `sleeping`: eyes shut, head down, slow breaths, the odd nod.
 * - `thinking`: head tilted, eyes up to one side and then the other, a
 *   small "hmm" of a mouth, a trail of thought bubbles pulsing above.
 * - `happy`: bounces and wiggles, eyes squeezed into smiles, a wide open
 *   grin, sparkles twinkling round the head.
 */
export type AnimalAvatarState = 'default' | 'working' | 'sleeping' | 'thinking' | 'happy';

/** How the landing squash of a jump plays out. */
export type AnimalAvatarSquashEase = 'sharp' | 'pulse' | 'soft' | 'bouncy';

/**
 * How the head is lit. `plastic` (default): a real glossy material shaded
 * per pixel — a baked pillow form, a hot spot and a sheen, a Fresnel rim,
 * a window reflection, saturated shadows. `crisp`: a lit rim with a clean
 * edge round the front, vector-style. `smooth`: no edge, a soft shadow
 * and highlight across the whole form. `flat`: the depth alone, no lighting.
 */
export type AnimalAvatarShading = 'crisp' | 'smooth' | 'plastic' | 'flat';

/**
 * An animal's mouth, hung from `y` in the 100×100 box:
 * - `animal`: the "ω" under a nose; `teeth` adds two buck teeth (a bunny's).
 * - `smile`: a long smile, `width` its half width in face units.
 * - `beak`: a two-tone beak, `width` its half width and `height` its
 *   length. A beak is a feature, not an expression, so it is drawn with
 *   either face; it opens while working.
 * - `none`: no mouth to show (an elephant's is behind its trunk).
 */
export interface AnimalAvatarMouth {
  style: 'animal' | 'smile' | 'beak' | 'none';
  y: number;
  width?: number;
  height?: number;
  teeth?: boolean;
  /** a beak's upper and lower colours */
  color?: string;
  shade?: string;
  /** an open mouth's inside and tongue */
  inside?: string;
  tongue?: string;
}

/** How an animal's eyes are drawn: round beads by default. */
export interface AnimalAvatarEyeStyle {
  /** size of an open eye */
  size: number;
  /** height of an open eye: 1 an upright pill, lower is rounder */
  tall: number;
  /** spacing between the eyes */
  gap: number;
  /** move the eyes up (negative) or down, in body units */
  y: number;
  /** the eyes' own colour, over the face ink */
  color?: string;
  /** catchlight: 0 none, 1 one sparkle, 2 a sparkle and a small dot */
  shine: number;
  /** size of the catchlight */
  shineSize: number;
}

export interface AnimalAvatarPreset {
  /** Display name, for labels and the default `aria-label`. */
  label: string;
  /** The animal's own colour. */
  color: string;
  /** The face the animal ships with. */
  face: AnimalAvatarFace;
  /** Where the face sits, in the 100×100 box. */
  faceX: number;
  faceY: number;
  /** Face scale. */
  faceScale: number;
  /** The front of the head as a dome the face and markings share: an
   * ellipse (centre, radii) swelling by `bulge` at its middle. */
  dome: { cx: number; cy: number; rx: number; ry: number; bulge: number };
  /** The animal's mouth. */
  mouth: AnimalAvatarMouth;
  /** The eyes. */
  eyes: Partial<AnimalAvatarEyeStyle>;
  /** The parts' own colour (a panda's ears) and their share of the depth. */
  partsColor?: string;
  partsDepth?: number;
}

export interface AnimalAvatarProps
  extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'color' | 'ref'> {
  /** Which animal. Default `tiger`. */
  type?: AnimalAvatarType;
  /** Face kind. Defaults to the type's own. */
  face?: AnimalAvatarFace;
  /** What the animal is doing: `default` (idle), `working`, `sleeping`, `thinking` or `happy`. */
  state?: AnimalAvatarState;
  /** Rendered size in px, or any CSS length. Default `64`. */
  size?: number | string;
  /** The animal's colour. Defaults to its palette colour. */
  color?: string;
  /** Eye style, over the type's own. Experimental. */
  eyes?: Partial<AnimalAvatarEyeStyle>;
  /** Face ink. Defaults to dark, or light on a dark body. */
  ink?: string;
  /**
   * Lightness of the body colour: 1 as the palette has it, below 1 darker,
   * above 1 lighter (0.5–1.5 is the useful range). Default `1`.
   */
  brightness?: number;
  /**
   * Saturation of the body colour: 1 as the palette has it, below 1
   * duller, above 1 more vivid (0.5–1.5 is the useful range). Default `1.5`.
   */
  saturation?: number;
  /** Multiplier on every animation's speed. Default `1`. */
  speed?: number;
  /** Freeze every animation on its current frame. */
  paused?: boolean;
  /**
   * 0–1. Offsets the blink and glance timing so a row of avatars does not
   * blink in unison. Defaults to a value derived from the instance id.
   */
  seed?: number;
  /** How the body is lit: `plastic` (default), `crisp`, `smooth` or
   * `flat`. `true` and `false` mean crisp and flat. */
  shading?: AnimalAvatarShading | boolean;
  /** Strength of the shadow side, 0–2. Default `0.35`. */
  shadow?: number;
  /** Strength of the lit side, 0–2. Default `1.3`. */
  highlight?: number;
  /** Thickness of the body, 0.2–2: what shows when it turns or flips. Default `0.65`. */
  depth?: number;
  /** Where the light comes from, in degrees clockwise from the top. Default `265` (from the left). */
  light?: number;
  /** Width of the lit rim in `crisp` shading, strength of the Fresnel rim in `plastic`, 0–2. Default `0.5`. */
  rim?: number;
  /** Reach of the soft shading in `smooth`, width of the highlight in `plastic`, 0.4–2.5. Default `1.55`. */
  spread?: number;
  /**
   * Pointer play: the eyes and head follow a pointer that comes near, and
   * a click makes the avatar hop and turn right round. Default `true`.
   */
  interactive?: boolean;
  /**
   * The surface the avatar sits on, for touches that have to read against
   * it. `auto` (default) reads an ancestor `data-theme` attribute or
   * `dark` / `light` class, then `prefers-color-scheme`.
   */
  theme?: 'auto' | 'dark' | 'light';
  /**
   * How far the head turns from side to side while idle, 0–2: `1` as the
   * library has it, `0` keeps it facing forward. Default `1`.
   */
  turn?: number;
  /** The whirl round a spin: its strength, 0–2. Off by default (`0`); `1` turns it on. */
  whirl?: number;
  /** Size of the whirl's ring, 0.6–1.6. Default `1`. */
  whirlSize?: number;
  /** Thickness of the whirl's trail, 0.4–2. Default `1`. */
  whirlWidth?: number;
  /** Length of the trail round the ring, 0.4–1.6. Default `1`. */
  whirlLength?: number;
  /** How flat the ring is seen, 0.5–1.8 (higher is more open). Default `1`. */
  whirlTilt?: number;
  /** The jump (an idle flip, a click): how high, in body units — the body is 100 tall. Default `26`. */
  jumpHeight?: number;
  /** Seconds the jump spends in the air. Default `0.68`. */
  jumpTime?: number;
  /** How much the body stretches in the air, 0–2. Default `1`. */
  jumpStretch?: number;
  /** How much the body squashes on the ground, before take-off and on landing, 0–2. Default `1.15`. */
  jumpSquash?: number;
  /** Seconds the landing squash takes, from contact to recovered. Default `0.37`. */
  jumpSquashTime?: number;
  /**
   * How the landing squash plays out: `sharp` (all at once, then eases
   * off), `pulse` (a quick press that recovers without a wobble, the
   * default), `soft` (eases in and out), `bouncy` (overshoots into a
   * stretch and settles).
   */
  jumpSquashEase?: AnimalAvatarSquashEase;
  /** Seconds a jump holds its deepest squash on the ground before recovering. Default `0.11`. */
  jumpGroundTime?: number;
  /**
   * How the weight settles through that hold, in the same shapes as
   * `jumpSquashEase`: the body presses a little deeper and comes back to
   * the held depth, `sharp` at once, `pulse` quickly, `soft` in the
   * middle, `bouncy` with a wobble. Default `pulse`.
   */
  jumpGroundEase?: AnimalAvatarSquashEase;
  /** Seconds the body takes to rise from its deepest squash back to its own shape. Default `0.33`. */
  jumpRiseTime?: number;
  /**
   * How it rises: `sharp` lets go at once and eases in to rest, `pulse`
   * leaves quickly with a long settle, `soft` eases out of the squash and
   * into rest, `bouncy` passes rest into a slight stretch and settles
   * back. Default `pulse`.
   */
  jumpRiseEase?: AnimalAvatarSquashEase;
  /** Seconds a click's jump takes for its landing squash (an idle jump's uses `jumpSquashTime`). Default `0.24`. */
  jumpClickSquashTime?: number;
  /** Whole turns made in the air, 0–2. Default `1`. */
  jumpSpin?: number;
  /** Degrees of lean into a jump. Default `6`. */
  jumpLean?: number;
  /** Seconds between idle jumps, give or take 40 %; 0 for none. Default `8`. */
  jumpEvery?: number;
  /** When the landing squash begins: seconds before touch-down (negative, bracing for the ground) or after it. Default `0`, the moment of contact. */
  jumpLand?: number;
  className?: string;
  style?: CSSProperties;
}
