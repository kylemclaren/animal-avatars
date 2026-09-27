import { Avatar } from "@/components/site/avatar"
import { Kbd } from "@/components/ui/kbd"
import { BOT_AVATARS_URL, GITHUB_URL, cast, stateOr } from "@/lib/cast"

/* three of the cast, spread across it, asleep at the bottom of the page */
const sleepers = [cast[0], cast[Math.floor(cast.length / 2)], cast[cast.length - 1]]
const SLEEPING = stateOr("sleeping")

export function Footer() {
  return (
    <footer className="sky relative isolate overflow-hidden border-t">
      <div className="stars" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 pt-16 pb-12 text-center">
        <div className="flex items-end gap-5" aria-hidden>
          {sleepers.map((t, i) => (
            <Avatar key={t} type={t} size={i === 1 ? 56 : 44} state={SLEEPING} interactive={false} />
          ))}
        </div>
        <p className="font-heading text-3xl font-bold tracking-[-0.02em]">
          <span className="text-rainbow">animal-avatars</span>
        </p>
        <p className="max-w-xl text-sm text-balance text-muted-foreground">
          MIT licence · Rendering engine from{" "}
          <a href={BOT_AVATARS_URL} target="_blank" rel="noreferrer" className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
            bot-avatars
          </a>{" "}
          by Jakub Antalik ·{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
            GitHub
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          Press <Kbd className="border bg-background/60 text-foreground">D</Kbd> to swap night for day.
        </p>
      </div>
    </footer>
  )
}
