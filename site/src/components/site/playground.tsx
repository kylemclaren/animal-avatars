import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { animalAvatarPalette, animalAvatarPresets, autoInk, type AnimalAvatarType } from "cute-avatars"
import { ArrowUpIcon, RotateCcwIcon } from "lucide-react"
import { cn } from "cn"

import { Avatar } from "@/components/site/avatar"
import { CodeBlock } from "@/components/site/code"
import { SectionHeading } from "@/components/site/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useResolvedTheme } from "@/hooks/use-resolved-theme"
import { cast, colorOf, labelOf, stateName } from "@/lib/cast"
import {
  CONTROLS,
  GROUPS,
  changedIn,
  defaultOf,
  formatValue,
  initialValues,
  toJsx,
  toProps,
  valueOf,
  withValue,
  type Control,
  type SliderControl,
  type Values,
} from "@/lib/playground"
import { propDocs } from "@/lib/props-doc"

const docOf = new Map(propDocs.map((d) => [d.name, d.description]))

type FieldProps<C extends Control = Control> = {
  control: C
  values: Values
  set: (prop: string, value: string | number | boolean | undefined) => void
}

export function Playground({
  values,
  setValues,
}: {
  values: Values
  setValues: Dispatch<SetStateAction<Values>>
}) {
  const [tab, setTab] = useState(GROUPS[0].id)
  const canvas = useRef<HTMLCanvasElement>(null)
  const siteTheme = useResolvedTheme()

  const set = (prop: string, value: string | number | boolean | undefined) =>
    setValues((v) => withValue(v, prop, value))
  const resetAll = () => setValues((v) => initialValues(v.type))

  const jsx = toJsx(values)
  const code = `import { AnimalAvatar } from 'cute-avatars'\n\n${jsx}`
  const changed = changedIn(values, CONTROLS.map((c) => c.prop))
  const pristine = JSON.stringify(values) === JSON.stringify(initialValues(values.type))

  const size = Number(valueOf(values, "size"))
  const theme = valueOf(values, "theme")
  const surface = theme === "dark" || theme === "light" ? theme : siteTheme
  const interactive = valueOf(values, "interactive") !== false
  const moving = valueOf(values, "paused") !== true && Number(valueOf(values, "speed")) > 0
  const state = String(valueOf(values, "state"))

  return (
    <section id="playground" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <SectionHeading eyebrow="Playground" title="Try every prop">
        Pick an animal, give it something to do and tune the light. The code keeps up, and only
        lists what you changed.
      </SectionHeading>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        {/* the stage and its code: sticky, so a control far down still shows its effect */}
        <div className="sticky top-16 z-10 flex min-w-0 flex-col gap-4 lg:top-20">
          <div
            className={cn(
              "sky relative isolate flex h-60 items-center justify-center overflow-hidden rounded-3xl border text-foreground shadow-sm sm:h-[400px]",
              surface
            )}
          >
            <div className="stars" />
            <Badge
              variant="outline"
              className="absolute top-3 left-3 h-6 gap-1.5 border-border bg-background/60 px-2.5 font-heading text-[13px] text-foreground backdrop-blur"
            >
              <span className="size-2 rounded-full" style={{ background: colorOf(values.type) }} />
              {labelOf(values.type)}
              <span className="text-muted-foreground">{stateName(state)}</span>
            </Badge>
            <div className="relative flex" style={{ width: size, height: size }}>
              <span className="floor" style={{ bottom: -size * 0.07 }} />
              <Avatar ref={canvas} {...toProps(values)} />
            </div>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-background/60 backdrop-blur"
                disabled={!interactive || !moving}
                onClick={() => canvas.current?.click()}
              >
                <ArrowUpIcon data-icon="inline-start" />
                Hop
              </Button>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {interactive ? "Hover near it, or click it" : "interactive is off"}
              </span>
            </div>
          </div>
          <CodeBlock code={code} label="App.tsx" copyLabel="Copy JSX" className="max-lg:hidden" />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-3xl border bg-card shadow-sm">
            <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-0">
              <div className="border-b p-2">
                <TabsList className="h-10! w-full">
                  {GROUPS.map((g) => {
                    const n = changedIn(
                      values,
                      g.sections.flatMap((s) => s.controls.map((c) => c.prop))
                    )
                    return (
                      <TabsTrigger key={g.id} value={g.id} className="flex-auto gap-1.5 px-1.5 text-[13px] sm:px-2">
                        {g.label}
                        {n > 0 && (
                          <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] leading-none font-semibold text-primary-foreground">
                            {n}
                          </span>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
              {GROUPS.map((g) => (
                <TabsContent key={g.id} value={g.id} className="p-5">
                  <div className="flex flex-col gap-7">
                    {g.sections.map((s, i) => (
                      <div key={i} className="flex flex-col gap-5">
                        {s.title && (
                          <div className="-mb-1">
                            <h3 className="font-heading text-base font-semibold">{s.title}</h3>
                            {s.note && <p className="text-sm text-muted-foreground">{s.note}</p>}
                          </div>
                        )}
                        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                          {s.controls.map((c) => (
                            <Field key={c.prop} control={c} values={values} set={set} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            <div className="flex items-center gap-3 border-t px-5 py-3">
              <span className="text-sm text-muted-foreground">
                {changed === 0
                  ? "Every prop at its default"
                  : `${changed} ${changed === 1 ? "prop" : "props"} changed`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={resetAll}
                disabled={pristine}
              >
                <RotateCcwIcon data-icon="inline-start" />
                Reset all
              </Button>
            </div>
          </div>
          <CodeBlock code={code} label="App.tsx" copyLabel="Copy JSX" className="lg:hidden" />
        </div>
      </div>
    </section>
  )
}

function Field(props: FieldProps) {
  const { control } = props
  switch (control.kind) {
    case "animal":
      return <AnimalField {...props} />
    case "slider":
      return <SliderField {...(props as FieldProps<SliderControl>)} />
    case "choice":
      return <ChoiceField {...props} options={control.options} />
    case "select":
      return <SelectField {...props} options={control.options} />
    case "switch":
      return <SwitchField {...props} />
    case "color":
      return <ColorField {...props} />
  }
}

/** A prop's name, its description on hover, and a mark when it is changed. */
function FieldHeader({
  prop,
  values,
  set,
  value,
  resetLabel,
}: {
  prop: string
  values: Values
  set: FieldProps["set"]
  value?: React.ReactNode
  resetLabel?: string
}) {
  const changed = prop !== "type" && values[prop] !== undefined
  const doc = docOf.get(prop)
  return (
    <div className="flex h-5 items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={doc ? 0 : undefined}
              className={cn(
                "flex items-center gap-1.5 font-mono text-[13px] outline-none",
                doc && "cursor-help decoration-muted-foreground/50 decoration-dotted underline-offset-4 hover:underline focus-visible:underline",
                changed ? "text-primary" : "text-foreground"
              )}
            />
          }
        >
          {changed && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
          {prop}
        </TooltipTrigger>
        {doc && (
          <TooltipContent side="top" align="start" className="max-w-72 text-pretty">
            {doc.replace(/`/g, "")}
          </TooltipContent>
        )}
      </Tooltip>
      <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{value}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={resetLabel ?? `Reset ${prop}`}
              className={cn("-mr-1 text-muted-foreground", !changed && "invisible")}
              onClick={() => set(prop, undefined)}
            />
          }
        >
          <RotateCcwIcon />
        </TooltipTrigger>
        <TooltipContent>{resetLabel ?? "Reset to default"}</TooltipContent>
      </Tooltip>
    </div>
  )
}

function SliderField({ control, values, set }: FieldProps<SliderControl>) {
  const raw = valueOf(values, control.prop)
  const unset = raw === undefined
  const v = unset ? control.fallback : Number(raw)
  return (
    <div className={cn("flex flex-col gap-3", control.wide && "sm:col-span-2")}>
      <FieldHeader
        prop={control.prop}
        values={values}
        set={set}
        value={unset && control.auto ? "auto" : formatValue(control, v)}
      />
      <Slider
        value={[v]}
        min={control.min}
        max={control.max}
        step={control.step}
        onValueChange={(next) => set(control.prop, Array.isArray(next) ? next[0] : next)}
        aria-label={control.prop}
      />
    </div>
  )
}

function ChoiceField({ control, values, set, options }: FieldProps & { options: string[] }) {
  const v = String(valueOf(values, control.prop))
  return (
    <div className="flex flex-col gap-2.5 sm:col-span-2">
      <FieldHeader prop={control.prop} values={values} set={set} />
      <ToggleGroup
        value={[v]}
        onValueChange={(next) => next[0] && set(control.prop, next[0])}
        variant="outline"
        size="sm"
        spacing={1}
        aria-label={control.prop}
        className="w-full flex-wrap"
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o}
            value={o}
            className="min-w-fit flex-1 font-mono text-xs aria-pressed:border-primary/50 aria-pressed:bg-primary/12 aria-pressed:text-foreground"
          >
            {o}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function SelectField({ control, values, set, options }: FieldProps & { options: string[] }) {
  const v = String(valueOf(values, control.prop))
  return (
    <div className="flex flex-col gap-2.5">
      <FieldHeader prop={control.prop} values={values} set={set} />
      <Select value={v} onValueChange={(next) => next && set(control.prop, String(next))}>
        <SelectTrigger className="w-full font-mono text-xs" aria-label={control.prop}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="font-mono text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SwitchField({ control, values, set }: FieldProps) {
  const v = valueOf(values, control.prop) === true
  return (
    <div className="flex flex-col gap-2.5">
      <FieldHeader prop={control.prop} values={values} set={set} />
      <label className="flex h-8 cursor-pointer items-center justify-between rounded-lg border px-3 text-sm text-muted-foreground">
        {v ? "On" : "Off"}
        <Switch checked={v} onCheckedChange={(c) => set(control.prop, c)} aria-label={control.prop} />
      </label>
    </div>
  )
}

function AnimalField({ values, set }: FieldProps) {
  const items = useMemo(() => Object.fromEntries(cast.map((t) => [t, labelOf(t)])), [])
  return (
    <div className="flex flex-col gap-2.5 sm:col-span-2">
      <FieldHeader prop="type" values={values} set={set} />
      <Select
        value={values.type}
        items={items}
        onValueChange={(t) => t && set("type", t as AnimalAvatarType)}
      >
        <SelectTrigger className="h-9! w-full" aria-label="type">
          <SelectValue>
            {(t: AnimalAvatarType) => (
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full ring-1 ring-foreground/10" style={{ background: colorOf(t) }} />
                {labelOf(t)}
                <span className="font-mono text-xs text-muted-foreground">"{t}"</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {cast.map((t) => (
            <SelectItem key={t} value={t}>
              <span className="size-3 rounded-full ring-1 ring-foreground/10" style={{ background: colorOf(t) }} />
              {labelOf(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const toHex6 = (c: string) =>
  c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c

/* the palette, once per colour: a white tiger is one click away */
const SWATCHES = Object.entries(
  Object.entries(animalAvatarPalette as Record<string, string>).reduce<Record<string, string[]>>(
    (acc, [type, color]) => ((acc[color.toUpperCase()] ??= []).push(type), acc),
    {}
  )
)

function ColorField({ control, values, set }: FieldProps) {
  const isInk = control.prop === "ink"
  const own = String(defaultOf("color", values.type))
  const body = String(valueOf(values, "color"))
  const current = isInk ? String(values.ink ?? autoInk(body)) : body
  const unset = values[control.prop] === undefined
  const [draft, setDraft] = useState(current)
  useEffect(() => setDraft(current), [current])
  const commit = (s: string) => {
    const hex = s.startsWith("#") ? s : `#${s}`
    if (HEX.test(hex)) set(control.prop, toHex6(hex).toUpperCase())
    else setDraft(current)
  }
  const label = animalAvatarPresets[values.type]?.label ?? values.type
  return (
    <div className="flex flex-col gap-2.5 sm:col-span-2">
      <FieldHeader
        prop={control.prop}
        values={values}
        set={set}
        value={isInk && unset ? "auto" : undefined}
        resetLabel={isInk ? "Back to auto" : `Back to the ${label.toLowerCase()}'s own`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border shadow-sm ring-1 ring-foreground/5 focus-within:ring-3 focus-within:ring-ring/50"
          style={{ background: current }}
        >
          <input
            type="color"
            value={toHex6(current).toLowerCase()}
            onChange={(e) => set(control.prop, e.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`Pick the ${control.prop} colour`}
          />
        </label>
        <Input
          value={draft}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value.trim())}
          className="w-24 font-mono text-xs uppercase"
          aria-label={`${control.prop} as hex`}
        />
        {!isInk && (
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-1">
            {SWATCHES.map(([color, types]) => (
              <Tooltip key={color}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => set("color", color)}
                      aria-label={`${types.map((t) => labelOf(t as AnimalAvatarType)).join(", ")} colour`}
                      className={cn(
                        "size-5 rounded-full ring-1 ring-foreground/15 transition-transform outline-none hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring",
                        body.toUpperCase() === color && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-card"
                      )}
                      style={{ background: color }}
                    />
                  }
                />
                <TooltipContent>
                  {types.map((t) => labelOf(t as AnimalAvatarType)).join(", ")}
                  {color === own.toUpperCase() ? " (own)" : ""}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
        {isInk && (
          <span className="text-xs text-muted-foreground">
            {unset ? "Dark on a light body, light on a dark one" : "The face, drawn in your colour"}
          </span>
        )}
      </div>
    </div>
  )
}
