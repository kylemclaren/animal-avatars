import { Fragment, type ReactNode } from "react"
import * as lib from "cute-avatars"

import { CodeBlock } from "@/components/site/code"
import { SectionHeading } from "@/components/site/section-heading"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { INSTALL_COMMAND, cast, pick } from "@/lib/cast"
import { GROUPS, groupOfProp } from "@/lib/playground"
import { describeDefault, eyeStyleKeys, propDocs, type PropDoc } from "@/lib/props-doc"

const USAGE = `import { AnimalAvatar } from 'cute-avatars'

export function Assistant({ busy }: { busy: boolean }) {
  return (
    <AnimalAvatar
      type="${pick("owl", 9)}"
      state={busy ? 'working' : 'default'}
      size={40}
    />
  )
}`

/* documented only if the module really exports them */
const EXPORTS: { name: string; about: ReactNode }[] = [
  { name: "AnimalAvatar", about: "The component. Also the default export." },
  { name: "animalAvatarTypes", about: <>Every animal's <Code>type</Code>, in order.</> },
  { name: "animalAvatarPresets", about: "Each animal's label, colour, face and features." },
  { name: "animalAvatarPalette", about: "Each animal's colour on its own." },
  { name: "animalAvatarStates", about: <>The values <Code>state</Code> takes.</> },
  { name: "animalAvatarFaces", about: <>The values <Code>face</Code> takes.</> },
].filter((e) => e.name in lib)

const EXTRA_GROUP: Record<string, string> = { eyes: "Look" }
const EXTRA_DOCS: Record<string, string> = {
  className: "Classes for the canvas.",
  style: "Styles for the canvas, over the ones that size it.",
}
const ORDER = [...GROUPS.map((g) => g.label), "Other"]
const grouped = ORDER.map((label) => ({
  label,
  props: propDocs.filter((d) => (groupOfProp.get(d.name) ?? EXTRA_GROUP[d.name] ?? "Other") === label),
})).filter((g) => g.props.length)

function typeOf(d: PropDoc): string {
  if (d.name === "eyes" && eyeStyleKeys.length)
    return `{ ${eyeStyleKeys.map((k) => `${k}?`).join(", ")} }`
  const members = d.expandedType.split("|").length
  return members > 6 ? d.type : d.expandedType
}

function descriptionOf(d: PropDoc): ReactNode {
  const text = d.description || EXTRA_DOCS[d.name] || ""
  return (
    <>
      {inlineCode(text)}
      {d.name === "type" && (
        <span className="mt-1.5 flex flex-wrap gap-1">
          {cast.map((t) => (
            <Code key={t}>{t}</Code>
          ))}
        </span>
      )}
    </>
  )
}

/* backticks in the doc comments become code */
function inlineCode(text: string): ReactNode {
  return text.split("`").map((part, i) => (i % 2 ? <Code key={i}>{part}</Code> : part))
}

function DefaultValue({ doc }: { doc: PropDoc }) {
  const def = describeDefault(doc)
  if (def === null) return <span className="text-[13px] text-muted-foreground">none</span>
  if (doc.default === undefined) return <span className="text-[13px] text-muted-foreground italic">{def}</span>
  return <span className="font-mono text-xs">{def}</span>
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] bg-foreground/[0.06] px-1 py-px font-mono text-[12px] whitespace-nowrap text-foreground">
      {children}
    </code>
  )
}

export function Api() {
  return (
    <section id="api" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <SectionHeading eyebrow="API" title="One component, every prop optional">
        The defaults below are the ones the component applies. Any other canvas prop, such as{" "}
        <Code>onClick</Code> or <Code>aria-label</Code>, passes straight through.
      </SectionHeading>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <CodeBlock code={INSTALL_COMMAND} label="Terminal" copyLabel="Copy the install command" />
          <CodeBlock code={USAGE} label="Assistant.tsx" copyLabel="Copy the example" />
        </div>
        <div className="min-w-0 rounded-2xl border bg-card">
          <div className="flex h-10 items-center border-b px-4 font-mono text-xs text-muted-foreground">
            Exports
          </div>
          <dl className="divide-y">
            {EXPORTS.map((e) => (
              <div key={e.name} className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-mono text-[13px] text-primary">{e.name}</dt>
                <dd className="text-sm text-muted-foreground">{e.about}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t px-4 py-3 text-sm text-muted-foreground">
            The accessible name defaults to the animal and its state, such as "Panda, working".
          </p>
        </div>
      </div>

      <h3 className="mt-14 mb-4 font-heading text-2xl font-semibold">
        Props <span className="text-muted-foreground">({propDocs.length})</span>
      </h3>

      {/* a table where there is room for one */}
      <div className="overflow-hidden rounded-2xl border bg-card max-md:hidden">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-48 pl-4">Prop</TableHead>
              <TableHead className="w-56">Type</TableHead>
              <TableHead className="w-40">Default</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((g) => (
              <Fragment key={g.label}>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={4} className="pl-4 font-heading text-[15px] font-semibold">
                    {g.label}
                  </TableCell>
                </TableRow>
                {g.props.map((d) => {
                  return (
                    <TableRow key={d.name} className="[&>td]:align-top">
                      <TableCell className="py-3 pl-4 font-mono text-[13px] text-primary">{d.name}</TableCell>
                      <TableCell className="py-3 font-mono text-xs whitespace-normal text-muted-foreground">
                        {typeOf(d)}
                      </TableCell>
                      <TableCell className="py-3 whitespace-normal">
                        <DefaultValue doc={d} />
                      </TableCell>
                      <TableCell className="py-3 text-[13.5px] leading-relaxed whitespace-normal text-muted-foreground">
                        {descriptionOf(d)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* and a list on a phone */}
      <div className="flex flex-col gap-6 md:hidden">
        {grouped.map((g) => (
          <div key={g.label}>
            <h4 className="mb-2 font-heading text-lg font-semibold">{g.label}</h4>
            <ul className="divide-y rounded-2xl border bg-card">
              {g.props.map((d) => {
                const def = describeDefault(d)
                return (
                  <li key={d.name} className="flex flex-col gap-1.5 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[13px] text-primary">{d.name}</span>
                      {def && <span className="text-right"><DefaultValue doc={d} /></span>}
                    </div>
                    <span className="font-mono text-xs break-words text-muted-foreground">{typeOf(d)}</span>
                    <p className="text-sm text-muted-foreground">{descriptionOf(d)}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
