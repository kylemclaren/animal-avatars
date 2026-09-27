import { useState } from "react"
import type { AnimalAvatarType } from "animal-avatars"
import { cn } from "cn"

import { Avatar } from "@/components/site/avatar"
import { SectionHeading } from "@/components/site/section-heading"
import { cast, colorOf, labelOf, stateOr } from "@/lib/cast"

const HAPPY = stateOr("happy")

export function Gallery({
  selected,
  onPick,
}: {
  selected: AnimalAvatarType
  onPick: (type: AnimalAvatarType) => void
}) {
  const [cheered, setCheered] = useState<AnimalAvatarType | null>(null)
  const leave = (t: AnimalAvatarType) => setCheered((c) => (c === t ? null : c))

  return (
    <section id="animals" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <SectionHeading eyebrow="The cast" title="Meet the animals">
        {cast.length} animals, each with its own colour, markings and mouth. Hover one to cheer it
        up, or click it to try it in the playground.
      </SectionHeading>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {cast.map((t) => {
          const color = colorOf(t)
          const current = selected === t
          return (
            <li key={t}>
              <button
                type="button"
                onClick={() => onPick(t)}
                onPointerEnter={() => setCheered(t)}
                onPointerLeave={() => leave(t)}
                onFocus={() => setCheered(t)}
                onBlur={() => leave(t)}
                aria-label={`Try the ${labelOf(t).toLowerCase()} in the playground`}
                aria-current={current || undefined}
                className={cn(
                  "group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card px-3.5 pt-9 pb-3.5 text-left shadow-xs transition duration-200 outline-none hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50",
                  current && "border-primary/60 ring-1 ring-primary/40 hover:border-primary/60"
                )}
              >
                {current && (
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <span className="size-1.5 rounded-full bg-primary" />
                    In playground
                  </span>
                )}
                <div className="relative mx-auto flex size-21">
                  <span className="floor -bottom-[7%]" />
                  <Avatar type={t} size={84} state={cheered === t ? HAPPY : "default"} />
                </div>
                <div className="relative mt-5 flex items-center justify-between gap-2">
                  <span className="font-heading text-lg leading-none font-semibold">{labelOf(t)}</span>
                  <span
                    className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/15"
                    style={{ background: color }}
                  />
                </div>
                <div className="relative mt-1.5 flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
                  <span>"{t}"</span>
                  <span>{color.toUpperCase()}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
