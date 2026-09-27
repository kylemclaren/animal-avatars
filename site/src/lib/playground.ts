import {
  animalAvatarFaces,
  animalAvatarPresets,
  type AnimalAvatarProps,
  type AnimalAvatarType,
} from "animal-avatars"

import { cast, pick, states } from "@/lib/cast"
import { libraryUnions, propDefaults, propDocs } from "@/lib/props-doc"

export type Value = string | number | boolean
/** The playground's props: the animal, plus whatever differs from the defaults. */
export type Values = { type: AnimalAvatarType } & { [prop: string]: Value | undefined }

type Base = { prop: string }
export type SliderControl = Base & {
  kind: "slider"
  min: number
  max: number
  step: number
  unit?: string
  fallback: number
  /** no default value: the library works one out (the seed) */
  auto?: boolean
  /** spans both columns */
  wide?: boolean
}
export type ChoiceControl = Base & { kind: "choice"; options: string[]; fallback: string }
export type SelectControl = Base & { kind: "select"; options: string[]; fallback: string }
export type SwitchControl = Base & { kind: "switch"; fallback: boolean }
export type ColorControl = Base & { kind: "color" }
export type AnimalControl = Base & { kind: "animal" }
export type Control =
  | SliderControl
  | ChoiceControl
  | SelectControl
  | SwitchControl
  | ColorControl
  | AnimalControl

export type Group = {
  id: string
  label: string
  sections: { title?: string; note?: string; controls: Control[] }[]
}

/* option lists, from the library where it says, else from its types */
function literals(prop: string): string[] {
  const doc = propDocs.find((d) => d.name === prop)
  return doc ? [...doc.expandedType.matchAll(/'([^']+)'/g)].map((m) => m[1]) : []
}
function defaultFirst(options: string[], prop: string) {
  const d = propDefaults[prop]
  return typeof d === "string" && options.includes(d)
    ? [d, ...options.filter((o) => o !== d)]
    : options
}
const shadings = defaultFirst(
  libraryUnions.AnimalAvatarShading ?? ["plastic", "crisp", "smooth", "flat"],
  "shading"
)
const eases = libraryUnions.AnimalAvatarSquashEase ?? ["sharp", "pulse", "soft", "bouncy"]
const themes = defaultFirst(literals("theme").length ? literals("theme") : ["auto", "dark", "light"], "theme")

const slider = (
  prop: string,
  min: number,
  max: number,
  step: number,
  fallback: number,
  unit?: string
): SliderControl => ({ kind: "slider", prop, min, max, step, fallback, unit })

export const GROUPS: Group[] = [
  {
    id: "basics",
    label: "Basics",
    sections: [
      {
        controls: [
          { kind: "animal", prop: "type" },
          { kind: "choice", prop: "state", options: [...states], fallback: "default" },
          { kind: "choice", prop: "face", options: [...animalAvatarFaces], fallback: "mouth" },
          { ...slider("size", 16, 240, 1, 64, "px"), wide: true },
          { kind: "switch", prop: "interactive", fallback: true },
          { kind: "switch", prop: "paused", fallback: false },
        ],
      },
    ],
  },
  {
    id: "look",
    label: "Look",
    sections: [
      {
        controls: [
          { kind: "color", prop: "color" },
          { kind: "color", prop: "ink" },
          slider("brightness", 0.5, 1.5, 0.01, 1),
          slider("saturation", 0, 2, 0.01, 1.5),
          { kind: "choice", prop: "theme", options: themes, fallback: "auto" },
        ],
      },
    ],
  },
  {
    id: "lighting",
    label: "Lighting",
    sections: [
      {
        controls: [
          { kind: "choice", prop: "shading", options: shadings, fallback: "plastic" },
          slider("light", 0, 360, 1, 265, "°"),
          slider("shadow", 0, 2, 0.01, 0.35),
          slider("highlight", 0, 2, 0.01, 1.3),
          slider("rim", 0, 2, 0.01, 0.5),
          slider("spread", 0.4, 2.5, 0.01, 1.55),
          slider("depth", 0.2, 2, 0.01, 0.65),
        ],
      },
    ],
  },
  {
    id: "motion",
    label: "Motion",
    sections: [
      {
        controls: [
          slider("speed", 0, 3, 0.05, 1, "×"),
          slider("turn", 0, 2, 0.01, 1),
          { ...slider("seed", 0, 1, 0.01, 0.5), auto: true },
        ],
      },
      {
        title: "Whirl",
        note: "A ring that trails a spin. Turn it up, then make the animal hop.",
        controls: [
          slider("whirl", 0, 2, 0.01, 0),
          slider("whirlSize", 0.6, 1.6, 0.01, 1),
          slider("whirlWidth", 0.4, 2, 0.01, 1),
          slider("whirlLength", 0.4, 1.6, 0.01, 1),
          slider("whirlTilt", 0.5, 1.8, 0.01, 1),
        ],
      },
    ],
  },
  {
    id: "jump",
    label: "Jump",
    sections: [
      {
        title: "Hop",
        controls: [
          slider("jumpHeight", 0, 80, 1, 26),
          slider("jumpTime", 0.2, 2, 0.01, 0.68, "s"),
          slider("jumpSpin", 0, 2, 1, 1),
          slider("jumpLean", 0, 30, 1, 6, "°"),
          slider("jumpStretch", 0, 2, 0.01, 1),
          slider("jumpEvery", 0, 20, 0.5, 8, "s"),
        ],
      },
      {
        title: "Landing",
        controls: [
          slider("jumpSquash", 0, 2, 0.01, 1.15),
          slider("jumpClickSquashTime", 0.05, 1, 0.01, 0.24, "s"),
          slider("jumpSquashTime", 0.05, 1, 0.01, 0.37, "s"),
          { kind: "select", prop: "jumpSquashEase", options: eases, fallback: "pulse" },
          slider("jumpGroundTime", 0, 0.5, 0.01, 0.11, "s"),
          { kind: "select", prop: "jumpGroundEase", options: eases, fallback: "pulse" },
          slider("jumpRiseTime", 0.05, 1, 0.01, 0.33, "s"),
          { kind: "select", prop: "jumpRiseEase", options: eases, fallback: "pulse" },
          slider("jumpLand", -0.3, 0.3, 0.01, 0, "s"),
        ],
      },
    ],
  },
]

export const CONTROLS: Control[] = GROUPS.flatMap((g) => g.sections.flatMap((s) => s.controls))
const byProp = new Map(CONTROLS.map((c) => [c.prop, c]))
export const groupOfProp = new Map(
  GROUPS.flatMap((g) => g.sections.flatMap((s) => s.controls.map((c) => [c.prop, g.label] as const)))
)

export const DEFAULT_TYPE = (propDefaults.type as AnimalAvatarType | undefined) ?? cast[0]

/** The value a prop has when the playground leaves it alone. */
export function defaultOf(prop: string, type: AnimalAvatarType): Value | undefined {
  const preset = animalAvatarPresets[type]
  if (prop === "type") return DEFAULT_TYPE
  if (prop === "face") return preset?.face
  if (prop === "color") return preset?.color
  if (prop === "ink" || prop === "seed") return undefined
  const control = byProp.get(prop)
  const fallback = control && "fallback" in control ? control.fallback : undefined
  return propDefaults[prop] ?? fallback
}

export function valueOf(values: Values, prop: string): Value | undefined {
  return values[prop] ?? defaultOf(prop, values.type)
}

const same = (a: Value | undefined, b: Value | undefined) =>
  typeof a === "number" && typeof b === "number"
    ? Math.abs(a - b) < 1e-9
    : typeof a === "string" && typeof b === "string"
      ? a.toLowerCase() === b.toLowerCase()
      : a === b

/** Set a prop; setting it back to its default drops it. */
export function withValue(values: Values, prop: string, value: Value | undefined): Values {
  const next = { ...values }
  if (prop === "type") return withType(values, value as AnimalAvatarType)
  if (value === undefined || same(value, defaultOf(prop, values.type))) delete next[prop]
  else next[prop] = value
  return next
}

/** A new animal keeps the settings, but wears its own colour and face. */
export function withType(values: Values, type: AnimalAvatarType): Values {
  const next: Values = { ...values, type }
  delete next.color
  delete next.face
  return next
}

export function initialValues(type: AnimalAvatarType = pick("bunny", 3)): Values {
  return { type, size: 160 }
}

export function changedIn(values: Values, props: string[]) {
  return props.filter((p) => p !== "type" && values[p] !== undefined).length
}

const round = (n: number) => Number(n.toFixed(4))

function attr(prop: string, v: Value) {
  if (typeof v === "boolean") return v ? prop : `${prop}={false}`
  if (typeof v === "number") return `${prop}={${round(v)}}`
  return `${prop}="${v}"`
}

/** The JSX for the current props, listing only what differs from the defaults. */
export function toJsx(values: Values): string {
  const attrs: string[] = []
  for (const { prop } of CONTROLS) {
    const v = values[prop]
    if (v === undefined) continue
    if (prop === "type" && v === DEFAULT_TYPE) continue
    attrs.push(attr(prop, v))
  }
  if (!attrs.length) return "<AnimalAvatar />"
  const line = `<AnimalAvatar ${attrs.join(" ")} />`
  if (line.length <= 60) return line
  return `<AnimalAvatar\n${attrs.map((a) => `  ${a}`).join("\n")}\n/>`
}

/** The props to hand the live avatar. */
export function toProps(values: Values): AnimalAvatarProps {
  const props: Record<string, Value> = {}
  for (const [k, v] of Object.entries(values)) if (v !== undefined) props[k] = v
  return props as AnimalAvatarProps
}

export function formatValue(control: SliderControl, v: number) {
  const decimals = control.step >= 1 ? 0 : control.step >= 0.1 ? 1 : 2
  return `${v.toFixed(decimals)}${control.unit ?? ""}`
}
