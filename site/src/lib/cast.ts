import {
  animalAvatarPresets,
  animalAvatarStates,
  animalAvatarTypes,
  type AnimalAvatarState,
  type AnimalAvatarType,
} from "cute-avatars"

export const GITHUB_URL = "https://github.com/kylemclaren/cute-avatars"
export const BOT_AVATARS_URL =
  "https://github.com/Jakubantalik/Libraries.dev/tree/main/packages/bot-avatars"
export const INSTALL_COMMAND = "npm install cute-avatars"

/** Every animal, in the library's order. Never a list of our own. */
export const cast: readonly AnimalAvatarType[] = animalAvatarTypes

/** Every state, in the library's order. */
export const states: readonly AnimalAvatarState[] = animalAvatarStates

export const labelOf = (t: AnimalAvatarType) =>
  animalAvatarPresets[t]?.label ?? t

export const colorOf = (t: AnimalAvatarType) =>
  animalAvatarPresets[t]?.color ?? "#b9a4ff"

/**
 * A named animal when the library has it, otherwise one from the cast, so
 * the mock UIs keep working as animals come and go.
 */
export function pick(name: string, fallback = 0): AnimalAvatarType {
  const all = animalAvatarTypes as readonly string[]
  return (
    all.includes(name)
      ? name
      : animalAvatarTypes[fallback % animalAvatarTypes.length]
  ) as AnimalAvatarType
}

/** A state when the library has it, otherwise a stand-in. */
export function stateOr(
  name: string,
  fallback: AnimalAvatarState = "default"
): AnimalAvatarState {
  return (
    (animalAvatarStates as readonly string[]).includes(name) ? name : fallback
  ) as AnimalAvatarState
}

/** How the page names a state: `default` is the idle one. */
export const stateName = (s: string) => (s === "default" ? "idle" : s)
