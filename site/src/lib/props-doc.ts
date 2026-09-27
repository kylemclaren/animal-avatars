/*
 * The props, read straight from the library's source so the site keeps up
 * as the library changes: names, types and descriptions come from
 * `AnimalAvatarProps` in src/types.ts, and the defaults from the
 * destructuring in src/AnimalAvatar.tsx (what the code really does, not
 * what a comment says it does).
 */
import typesSource from "../../../src/types.ts?raw"
import componentSource from "../../../src/AnimalAvatar.tsx?raw"

export type PropDefault = string | number | boolean

export interface PropDoc {
  name: string
  /** The type as written in types.ts. */
  type: string
  /** The type with the library's own unions spelled out. */
  expandedType: string
  description: string
  /** The default the component applies, when it applies one. */
  default: PropDefault | undefined
}

/* the props whose default is not a value but "whatever the animal has" */
const DERIVED_DEFAULTS: Record<string, string> = {
  face: "the animal's own",
  eyes: "the animal's own",
  color: "the animal's own",
  ink: "auto",
  seed: "from the instance id",
}

export function parseInterface(src: string, name: string) {
  const start = src.search(new RegExp(`export interface ${name}\\b[^{]*\\{`))
  if (start < 0) return []
  const open = src.indexOf("{", start)
  /* the interface closes at the first brace back at the start of a line */
  const close = src.indexOf("\n}", open)
  const body = src.slice(open + 1, close < 0 ? undefined : close)
  const members: { name: string; type: string; doc: string }[] = []
  let doc: string[] | null = null
  let lastDoc = ""
  for (const raw of body.split("\n")) {
    const line = raw.trim()
    if (doc) {
      const end = line.indexOf("*/")
      doc.push((end >= 0 ? line.slice(0, end) : line).replace(/^\*\s?/, ""))
      if (end >= 0) {
        lastDoc = doc.join(" ")
        doc = null
      }
      continue
    }
    if (line.startsWith("/**")) {
      const rest = line.slice(3)
      const end = rest.indexOf("*/")
      if (end >= 0) lastDoc = rest.slice(0, end)
      else doc = [rest]
      continue
    }
    const m = line.match(/^(['\w-]+)\??:\s*(.+?);?$/)
    if (m) {
      members.push({ name: m[1].replace(/'/g, ""), type: m[2], doc: tidy(lastDoc) })
      lastDoc = ""
    }
  }
  return members
}

export function parseUnions(src: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  const re = /export type (\w+)\s*=\s*([^;]+);/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const parts = m[2].split("|").map((s) => s.trim()).filter(Boolean)
    if (parts.every((p) => /^'[^']*'$/.test(p))) out[m[1]] = parts.map((p) => p.slice(1, -1))
  }
  return out
}

export function parseDefaults(src: string): Record<string, PropDefault> {
  const out: Record<string, PropDefault> = {}
  /* the destructured props: from the component's opening `{` to `ref` */
  const start = src.search(/function AnimalAvatar\(\s*\{/)
  if (start < 0) return out
  const end = src.indexOf("ref", src.indexOf("}", start))
  const block = src.slice(start, end)
  const re = /^\s*(\w+)\s*=\s*(.+?),?\s*$/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(block))) {
    const v = m[2].trim()
    if (/^(['"]).*\1$/.test(v)) out[m[1]] = v.slice(1, -1)
    else if (v === "true" || v === "false") out[m[1]] = v === "true"
    else if (!Number.isNaN(Number(v))) out[m[1]] = Number(v)
  }
  return out
}

function tidy(s: string) {
  return s.replace(/\s+/g, " ").trim()
}

/* "Default `26`." and the like: the table has a column for that */
function withoutDefault(desc: string) {
  return tidy(desc.replace(/\s*Default `[^`]+`[^.]*\.?/g, ""))
}

function expand(type: string, unions: Record<string, string[]>) {
  return type
    .split("|")
    .map((part) => {
      const p = part.trim()
      const u = unions[p]
      return u ? u.map((v) => `'${v}'`).join(" | ") : p
    })
    .join(" | ")
}

const unions = parseUnions(typesSource)
const defaults = parseDefaults(componentSource)
const members = parseInterface(typesSource, "AnimalAvatarProps")

export const propDocs: PropDoc[] = members.map((m) => ({
  name: m.name,
  type: m.type,
  expandedType: expand(m.type, unions),
  description: withoutDefault(m.doc),
  default: defaults[m.name],
}))

export const propDefaults = defaults

export const eyeStyleKeys = parseInterface(typesSource, "AnimalAvatarEyeStyle").map((m) => m.name)

export const libraryUnions = unions

/** The default as the table shows it. */
export function describeDefault(doc: PropDoc): string | null {
  if (doc.default !== undefined) {
    return typeof doc.default === "string" ? `'${doc.default}'` : String(doc.default)
  }
  return DERIVED_DEFAULTS[doc.name] ?? null
}
