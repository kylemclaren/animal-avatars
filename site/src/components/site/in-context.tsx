import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import type { AnimalAvatarState, AnimalAvatarType } from "cute-avatars"
import { ArrowUpIcon, HashIcon, MoonIcon } from "lucide-react"
import { cn } from "cn"

import { Avatar } from "@/components/site/avatar"
import { SectionHeading } from "@/components/site/section-heading"
import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@/components/ui/message"
import { useInView } from "@/hooks/use-in-view"
import { pick, stateName, stateOr, states } from "@/lib/cast"

/* the states the demos lean on, with stand-ins should one go away */
const IDLE: AnimalAvatarState = "default"
const WORKING = stateOr("working")
const THINKING = stateOr("thinking", WORKING)
const HAPPY = stateOr("happy", IDLE)
const SLEEPING = stateOr("sleeping")

const listFormat = new Intl.ListFormat("en-GB", { type: "conjunction" })
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

export function InContext() {
  const [hoot, setHoot] = useState<AnimalAvatarState>(IDLE)
  const team = useTeam()
  return (
    <section id="in-context" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <SectionHeading eyebrow="In context" title="They show what they're doing">
        {cap(listFormat.format(states.map(stateName)))}: between them, the states cover most of
        what an assistant, an agent or a teammate needs to show.
      </SectionHeading>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel
          className="lg:col-span-7 lg:row-span-2"
          caption={
            <>
              An assistant that shows its work: <Code>thinking</Code> while it waits,{" "}
              <Code>working</Code> while it writes, <Code>happy</Code> when it's done.
            </>
          }
        >
          <Chat onState={setHoot} />
        </Panel>
        <Panel
          className="lg:col-span-5"
          caption={<>A team of agents at a glance, in every state at once.</>}
        >
          <Roster team={team} />
        </Panel>
        <Panel
          className="lg:col-span-5"
          caption={<>Small in a sidebar. Only the ones on screen animate.</>}
        >
          <Sidebar team={team} hoot={hoot} />
        </Panel>
      </div>
    </section>
  )
}

function Panel({
  className,
  caption,
  children,
}: {
  className?: string
  caption: ReactNode
  children: ReactNode
}) {
  return (
    <figure className={cn("flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card shadow-sm", className)}>
      <div className="min-h-0 flex-1">{children}</div>
      <figcaption className="border-t bg-muted/40 px-4 py-3 text-sm text-pretty text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
      {children}
    </code>
  )
}

/* ── the chat ──────────────────────────────────────────────────────── */

const HOOT = pick("owl", 9)
const PROMPTS = [
  {
    q: "Why did last night's deploy fail?",
    a: "The orders migration timed out. It rewrites 2.1 million rows in one transaction, and the deploy gives up after 30 seconds. I've opened #483, which moves them in batches of 5,000.",
  },
  {
    q: "Summarise my open PRs",
    a: "Three are open. #482 adds dark mode to settings and is approved. #479 fixes the flaky login test and needs one more review. #475 moves to React 19, but CI is red on Safari.",
  },
  {
    q: "Plan my Friday",
    a: "Merge #482 first thing, then review #479. After lunch, pair with Sam on the Safari failure. I've kept 4 to 5 pm free for the release notes.",
  },
]
const UNKNOWN = "I'm a demo owl, so I only know three answers. Try one of the suggestions."

type Msg = { id: number; from: "you" | "hoot"; text: string; done?: boolean }
type Phase = "idle" | "thinking" | "writing" | "done"
const PHASE_STATE: Record<Phase, AnimalAvatarState> = {
  idle: IDLE,
  thinking: THINKING,
  writing: WORKING,
  done: HAPPY,
}
const PHASE_STATUS: Record<Phase, string> = {
  idle: "Online",
  thinking: "Thinking…",
  writing: "Writing a reply…",
  done: "Done",
}

function Chat({ onState }: { onState: (s: AnimalAvatarState) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 1, from: "you", text: "Morning! Anything on fire?" },
    {
      id: 2,
      from: "hoot",
      text: "All quiet. The nightly build passed, and two pull requests are waiting for your review.",
      done: true,
    },
  ])
  const [phase, setPhase] = useState<Phase>("idle")
  const [asked, setAsked] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const timers = useRef<number[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, "-15% 0px")
  const played = useRef(false)
  const nextId = useRef(3)
  const busy = phase === "thinking" || phase === "writing"
  const state = PHASE_STATE[phase]

  useEffect(() => onState(state), [state, onState])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [msgs, phase])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const send = (question: string, answer: string) => {
    if (busy) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    const q = nextId.current++
    const a = nextId.current++
    setMsgs((m) => [...m, { id: q, from: "you", text: question }])
    setPhase("thinking")
    later(() => {
      const words = answer.split(" ")
      setPhase("writing")
      setMsgs((m) => [...m, { id: a, from: "hoot", text: "" }])
      words.forEach((_, i) =>
        later(
          () =>
            setMsgs((m) =>
              m.map((x) => (x.id === a ? { ...x, text: words.slice(0, i + 1).join(" ") } : x))
            ),
          60 * (i + 1)
        )
      )
      later(() => {
        setMsgs((m) => m.map((x) => (x.id === a ? { ...x, done: true } : x)))
        setPhase("done")
        later(() => setPhase("idle"), 1900)
      }, 60 * words.length + 300)
    }, 1800)
  }

  const ask = (p: (typeof PROMPTS)[number]) => {
    if (busy) return
    setAsked((a) => [...a, p.q])
    send(p.q, p.a)
  }

  /* the first time the chat scrolls into view, ask the first question */
  useEffect(() => {
    if (!inView || played.current) return
    played.current = true
    const t = window.setTimeout(() => ask(PROMPTS[0]), 700)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setDraft("")
    const known = PROMPTS.find((p) => p.q.toLowerCase() === text.toLowerCase())
    if (known) ask(known)
    else send(text, UNKNOWN)
  }

  const left = PROMPTS.filter((p) => !asked.includes(p.q))
  const lastHoot = [...msgs].reverse().find((m) => m.from === "hoot")?.id

  return (
    <div ref={root} className="flex h-[540px] flex-col lg:h-full lg:min-h-[560px]">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar type={HOOT} size={34} state={state} />
        <div className="min-w-0">
          <div className="font-heading leading-tight font-semibold">Hoot</div>
          <div className="text-xs text-muted-foreground" aria-live="polite">
            {PHASE_STATUS[phase]}
          </div>
        </div>
        <Badge variant="outline" className="ml-auto h-6 font-mono text-[11.5px] font-normal">
          state="{state}"
        </Badge>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        <MessageGroup className="min-h-full justify-end gap-4">
          {msgs.map((m) =>
            m.from === "you" ? (
              <Message key={m.id} align="end">
                <MessageContent>
                  <Bubble align="end">
                    <BubbleContent>{m.text}</BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            ) : (
              <Message key={m.id}>
                <MessageAvatar className="min-w-7 overflow-visible bg-transparent">
                  <Avatar type={HOOT} size={28} state={m.id === lastHoot ? state : IDLE} />
                </MessageAvatar>
                <MessageContent>
                  <Bubble variant="muted">
                    <BubbleContent>
                      {m.text}
                      {!m.done && (
                        <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-caret bg-foreground/70" />
                      )}
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            )
          )}
          {phase === "thinking" && (
            <Message>
              <MessageAvatar className="min-w-7 overflow-visible bg-transparent">
                <Avatar type={HOOT} size={28} state={THINKING} />
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="muted">
                  <BubbleContent className="flex items-center gap-1 py-3" aria-label="Hoot is thinking">
                    <Dot delay={0} />
                    <Dot delay={160} />
                    <Dot delay={320} />
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          )}
        </MessageGroup>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2.5 border-t p-3">
        <div className="flex flex-wrap gap-1.5">
          {left.map((p) => (
            <Button
              key={p.q}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full font-normal"
              disabled={busy}
              onClick={() => ask(p)}
            >
              {p.q}
            </Button>
          ))}
          {left.length === 0 && (
            <span className="px-1 text-sm text-muted-foreground">That's everything Hoot knows.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask Hoot something…"
            aria-label="Message Hoot"
            className="h-9 rounded-full px-4"
          />
          <Button type="submit" size="icon" className="size-9 shrink-0 rounded-full" disabled={busy || !draft.trim()} aria-label="Send">
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 rounded-full bg-muted-foreground/70 motion-safe:animate-bounce"
      style={{ animationDelay: `${delay}ms`, animationDuration: "1s" }}
    />
  )
}

/* ── the team: one simulation, shown as a roster and in the sidebar ── */

type Agent = {
  type: AnimalAvatarType
  name: string
  role: string
  state: AnimalAvatarState
  status: string
  work: string[]
  ideas: string[]
}

const TEAM: Agent[] = [
  {
    type: pick("penguin", 5),
    name: "Pip",
    role: "Code review",
    state: WORKING,
    status: "Reviewing #482",
    work: ["Reviewing #482", "Reviewing #479", "Re-running the checks"],
    ideas: ["Reading the diff", "Weighing two fixes"],
  },
  {
    type: pick("octopus", 8),
    name: "Inky",
    role: "Triage",
    state: THINKING,
    status: "Grouping 14 new issues",
    work: ["Labelling bug reports", "Closing duplicates"],
    ideas: ["Grouping 14 new issues", "Reading a stack trace"],
  },
  {
    type: pick("lion", 7),
    name: "Leo",
    role: "Releases",
    state: HAPPY,
    status: "Shipped v2.4.0",
    work: ["Tagging v2.4.1", "Writing the changelog"],
    ideas: ["Picking the next version", "Checking the release notes"],
  },
  {
    type: pick("sheep", 10),
    name: "Dolly",
    role: "Docs",
    state: SLEEPING,
    status: "Asleep · back at 9:00",
    work: ["Updating the API docs", "Fixing broken links"],
    ideas: ["Outlining a guide", "Reading the new props"],
  },
  {
    type: pick("elephant", 1),
    name: "Tusk",
    role: "Tests",
    state: IDLE,
    status: "Waiting for a task",
    work: ["Running 1,204 tests", "Hunting a flaky test"],
    ideas: ["Working out what broke", "Choosing tests to run"],
  },
]

const any = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

/** An agent's next step: idle → thinking → working → happy → idle, with naps. */
function advance(a: Agent): Agent {
  /* checked in this order so a state standing in for another still moves on */
  if (a.state === SLEEPING) return { ...a, state: IDLE, status: "Awake, waiting for a task" }
  if (a.state === WORKING && !a.status.startsWith("Done"))
    return { ...a, state: HAPPY, status: `Done: ${a.status.charAt(0).toLowerCase()}${a.status.slice(1)}` }
  if (a.state === THINKING) return { ...a, state: WORKING, status: any(a.work) }
  if (a.state === HAPPY && HAPPY !== IDLE) return { ...a, state: IDLE, status: "Waiting for a task" }
  return Math.random() < 0.25
    ? { ...a, state: SLEEPING, status: "Asleep · back at 9:00" }
    : { ...a, state: THINKING, status: any(a.ideas) }
}

function useTeam() {
  const [team, setTeam] = useState(TEAM)
  const [running, setRunning] = useState(false)
  const last = useRef(-1)
  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      setTeam((all) => {
        let i = Math.floor(Math.random() * all.length)
        if (i === last.current) i = (i + 1) % all.length
        last.current = i
        return all.map((a, j) => (j === i ? advance(a) : a))
      })
    }, 2200)
    return () => window.clearInterval(t)
  }, [running])
  return { team, setRunning }
}

type Team = ReturnType<typeof useTeam>

const BADGE: Record<string, { label: string; dot: string }> = {
  default: { label: "Idle", dot: "bg-muted-foreground/60" },
  thinking: { label: "Thinking", dot: "bg-rb-1" },
  working: { label: "Working", dot: "text-rb-3 bg-current animate-presence" },
  happy: { label: "Done", dot: "bg-rb-4" },
  sleeping: { label: "Asleep", dot: "bg-transparent ring-1 ring-inset ring-muted-foreground/70" },
}
const badgeOf = (s: string) => BADGE[s] ?? { label: stateName(s), dot: "bg-muted-foreground/60" }

function Roster({ team: { team, setRunning } }: { team: Team }) {
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root)
  useEffect(() => setRunning(inView), [inView, setRunning])
  const busy = team.filter((a) => a.state === WORKING || a.state === THINKING).length
  return (
    <div ref={root}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-heading font-semibold">Agents</span>
        <span className="text-xs text-muted-foreground">
          {busy} of {team.length} busy
        </span>
      </div>
      <div className="flex flex-col p-1.5">
        {team.map((a) => {
          const b = badgeOf(a.state)
          return (
            <Item key={a.name} size="sm" className="gap-3 px-2.5 py-2">
              <ItemMedia>
                <Avatar type={a.type} size={36} state={a.state} />
              </ItemMedia>
              <ItemContent className="min-w-0 gap-0.5">
                <ItemTitle className="gap-1.5">
                  {a.name}
                  <span className="font-normal text-muted-foreground">· {a.role}</span>
                </ItemTitle>
                <ItemDescription className="truncate">{a.status}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="outline" className="h-6 gap-1.5 px-2 font-normal">
                  <span className={cn("size-1.5 rounded-full", b.dot)} />
                  {b.label}
                </Badge>
              </ItemActions>
            </Item>
          )
        })}
      </div>
    </div>
  )
}

function Sidebar({ team: { team }, hoot }: { team: Team; hoot: AnimalAvatarState }) {
  const people = [{ type: HOOT, name: "Hoot", state: hoot }, ...team]
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="A mock sidebar" className="flex flex-col gap-3 border-r bg-sidebar p-2.5 text-[13px]">
        <div className="flex items-center gap-2 px-1.5 pt-0.5 font-heading text-sm font-semibold">
          <span className="grid size-5 place-items-center rounded-md bg-rainbow text-[10px] font-bold text-white">
            A
          </span>
          Acme
        </div>
        <ul className="flex flex-col">
          {["general", "releases"].map((c) => (
            <li key={c} className="flex h-7 items-center gap-2 rounded-md px-1.5 text-muted-foreground">
              <HashIcon className="size-3.5" />
              {c}
            </li>
          ))}
        </ul>
        <div>
          <div className="px-1.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Direct messages
          </div>
          <ul className="flex flex-col">
            {people.map((p, i) => (
              <li
                key={p.name}
                className={cn(
                  "flex h-7 items-center gap-2 rounded-md px-1.5",
                  i === 0 ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <Avatar type={p.type} size={18} state={p.state} />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto flex items-center">
                  {p.state === SLEEPING ? (
                    <MoonIcon className="size-3 text-muted-foreground" aria-label="asleep" />
                  ) : (
                    <span className={cn("size-1.5 rounded-full", badgeOf(p.state).dot)} />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <Sizes />
    </div>
  )
}

/* the same animal down the sizes a sidebar, a list and a header use */
function Sizes() {
  const type = pick("pig", 6)
  return (
    <div className="flex flex-col justify-center gap-3 p-4 max-sm:border-l-0">
      <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Sizes</div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        {[16, 20, 24, 32, 48].map((s) => (
          <div key={s} className="flex items-center gap-2 sm:flex-col sm:gap-1.5">
            <Avatar type={type} size={s} />
            <span className="font-mono text-[11px] text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
