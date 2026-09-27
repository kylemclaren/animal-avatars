# animal-avatars

Animated animal avatars for React. Five glossy 3D heads (a tiger, an elephant, a panda, a bunny and a chameleon) with living faces that blink, look toward the pointer, turn, hop and fall asleep. Drawn on a 2D canvas, no WebGL.

```bash
npm install animal-avatars
```

```tsx
import { AnimalAvatar } from 'animal-avatars';

<AnimalAvatar type="panda" size={64} />
<AnimalAvatar type="chameleon" state="working" />
<AnimalAvatar type="bunny" state="sleeping" face="eyes" />
```

## The animals

| `type`      | Colour    | Mouth                         |
| ----------- | --------- | ----------------------------- |
| `tiger`     | orange    | "ω" under a pink nose         |
| `elephant`  | blue-grey | none (the trunk sits there)   |
| `panda`     | white     | "ω" under a black nose        |
| `bunny`     | lilac     | "ω" under a pink nose         |
| `chameleon` | green     | a long smile                  |

Each head's front is a gentle dome. The eyes, the mouth and the markings (stripes, muzzles, patches, spots) all sit on it, so they turn together with the head.

## States

- `default`: idle. Breathes, blinks, glances around and hops now and then.
- `working`: hops and spins, with its mouth open.
- `sleeping`: eyes shut, head down, slow breaths.

A state change morphs the face rather than swapping it.

## Props

| Prop | Default | |
| --- | --- | --- |
| `type` | `'tiger'` | Which animal. |
| `state` | `'default'` | `default`, `working` or `sleeping`. |
| `face` | the animal's own | `eyes`, or `mouth` for the eyes and the mouth. |
| `size` | `64` | Size in px, or any CSS length. |
| `color` | the animal's own | The head colour. `color="#F4F2FA"` on the tiger gives a white tiger. |
| `eyes` | the animal's own | Partial eye style: `size`, `tall`, `gap`, `y`, `color`, `shine`, `shineSize`. |
| `ink` | auto | The colour of the face. |
| `shading` | `'plastic'` | `plastic`, `crisp`, `smooth` or `flat`. |
| `interactive` | `true` | Follows a nearby pointer; a click makes it hop. |
| `speed` / `paused` | `1` / `false` | Animation speed, or freeze it. |
| `theme` | `'auto'` | The surface it sits on, for touches that must read against it. |

There are also lighting controls (`shadow`, `highlight`, `depth`, `light`, `rim`, `spread`), idle motion (`turn`, `seed`) and the jump (`jumpHeight`, `jumpEvery`, `jumpSpin` and friends). See `AnimalAvatarProps` in `src/types.ts` for all of them.

Motion respects `prefers-reduced-motion`, and the animation only runs while the avatar is on screen.

## Development

```bash
npm install
npm run dev        # the demo at http://localhost:5182
npm run typecheck
npm run build
npm run shapes     # regenerate src/shapes.ts from scripts/gen-shapes.mjs
```

To add an animal:

1. Add its head outline, any parts drawn behind the head, and its markings to `scripts/gen-shapes.mjs`. Then run `npm run shapes`.
2. Add its name to `AnimalAvatarType` in `src/types.ts`.
3. Add its preset (colour, face position, dome, eyes, mouth) to `src/presets.ts`.

## Credits

The rendering engine comes from [bot-avatars](https://github.com/Jakubantalik/Libraries.dev/tree/main/packages/bot-avatars) by Jakub Antalik (MIT).

## License

MIT
