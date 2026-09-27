import { useState, type CSSProperties } from "react"
import type { AnimalAvatarState } from "animal-avatars"

import { Avatar } from "@/components/site/avatar"
import { CopyButton } from "@/components/site/code"
import { GitHubIcon } from "@/components/site/icons"
import { buttonVariants } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { GITHUB_URL, INSTALL_COMMAND, cast, labelOf, stateName, states } from "@/lib/cast"

/* the lineup fills one row up to twelve, then splits into even rows */
const rows = Math.ceil(cast.length / 12)
const perRow = Math.ceil(cast.length / rows)

export function Hero() {
  const [state, setState] = useState<AnimalAvatarState>("default")

  return (
    <section id="top" className="sky relative isolate overflow-hidden">
      <div className="stars" />
      <div className="relative mx-auto max-w-6xl px-4 pt-28 text-center sm:pt-36">
        <h1 className="font-heading text-[clamp(3rem,11vw,7.25rem)] leading-[0.95] font-bold tracking-[-0.025em]">
          <span className="text-rainbow">animal-avatars</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-heading text-xl font-medium text-balance text-muted-foreground sm:text-2xl">
          Cute, glossy, living animal avatars for React
        </p>

        {/* the README's facts line, where the states are switches for the whole cast */}
        <div className="mx-auto mt-7 flex w-fit max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-[1.4rem] border bg-foreground/[0.04] px-1.5 py-1.5 font-heading text-[15px] font-medium text-muted-foreground backdrop-blur-sm">
          <span className="px-2.5">{cast.length} animals</span>
          <Dot className="max-sm:hidden" />
          <ToggleGroup
            value={[state]}
            onValueChange={(v) => v[0] && setState(v[0] as AnimalAvatarState)}
            spacing={0.5}
            aria-label="What every animal is doing"
            className="flex-wrap justify-center"
          >
            {states.map((s) => (
              <ToggleGroupItem
                key={s}
                value={s}
                className="h-7 rounded-full px-2.5 font-heading text-[15px] font-medium text-muted-foreground hover:bg-foreground/8 hover:text-foreground aria-pressed:bg-primary/20 aria-pressed:text-foreground"
              >
                {stateName(s)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Dot className="max-sm:hidden" />
          <span className="px-2.5 max-sm:hidden">2D canvas, no WebGL</span>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="flex h-11 items-center gap-3 rounded-xl border bg-card/70 pr-1.5 pl-4 font-mono text-sm shadow-sm backdrop-blur">
            <span className="text-muted-foreground select-none" aria-hidden>
              $
            </span>
            <span>{INSTALL_COMMAND}</span>
            <CopyButton value={INSTALL_COMMAND} label="Copy the install command" />
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ size: "lg", className: "h-11 gap-2 rounded-xl px-4 text-[15px]" })}
          >
            <GitHubIcon className="size-[18px]" />
            GitHub
          </a>
        </div>
      </div>

      <ul
        aria-label="The cast"
        className="lineup relative mx-auto mt-14 flex max-w-[1400px] flex-wrap justify-center gap-y-7 px-3 sm:mt-16"
        style={{ "--n": perRow } as CSSProperties}
      >
        {cast.map((t, i) => (
          <li key={t} className="flex w-(--cell) flex-col items-center">
            <div className="relative flex size-(--size)">
              <span className="floor -bottom-[7%]" />
              <Avatar type={t} state={state} size="var(--size)" seed={i / cast.length} />
            </div>
            <span className="mt-3 font-heading text-sm font-medium text-muted-foreground sm:text-[15px]">
              {labelOf(t)}
            </span>
          </li>
        ))}
      </ul>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      <p className="relative px-4 pt-8 pb-16 text-center text-sm text-muted-foreground sm:pb-24">
        Switch their state above, move your pointer close to catch an eye, or click one to make it hop.
      </p>
    </section>
  )
}

function Dot({ className }: { className?: string }) {
  return (
    <i
      aria-hidden
      className={`size-1 shrink-0 rounded-full bg-muted-foreground/50 ${className ?? ""}`}
    />
  )
}
