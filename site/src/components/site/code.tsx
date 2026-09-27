import { useEffect, useRef, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Token = { text: string; kind?: string }

/*
 * Just enough of a TSX lexer for the snippets on this page: strings,
 * keywords, tags and their attributes, numbers and punctuation. Inside a
 * tag, a bare word is an attribute unless it sits in an `{expression}`.
 */
type Rule = { id: string; re: RegExp }
const RULES: Rule[] = [
  { id: "comment", re: /\/\/[^\n]*/y },
  { id: "string", re: /'[^'\n]*'|"[^"\n]*"/y },
  { id: "tagStart", re: /<\/?(?=[A-Za-z])/y },
  { id: "tagEnd", re: /\/?>/y },
  { id: "keyword", re: /\b(?:import|from|export|function|return|const)\b/y },
  { id: "number", re: /\b(?:true|false|null|undefined)\b|\d+(?:\.\d+)?/y },
  { id: "word", re: /[A-Za-z_$][\w$.-]*/y },
  { id: "brace", re: /[{}]/y },
  { id: "punct", re: /[()[\]=,:;]/y },
  { id: "space", re: /\s+/y },
  { id: "other", re: /./y },
]

export function highlight(code: string): Token[] {
  const out: Token[] = []
  let inTag = false
  let depth = 0
  let afterTagStart = false
  let i = 0
  while (i < code.length) {
    for (const { id, re } of RULES) {
      re.lastIndex = i
      const m = re.exec(code)
      if (!m) continue
      const text = m[0]
      let kind: string | undefined
      switch (id) {
        case "comment":
        case "punct":
          kind = "punct"
          break
        case "string":
        case "keyword":
        case "number":
          kind = id === "keyword" ? "keyword" : id
          break
        case "tagStart":
          inTag = true
          depth = 0
          kind = "punct"
          break
        case "tagEnd":
          if (inTag && depth === 0) inTag = false
          kind = "punct"
          break
        case "brace":
          if (inTag) depth += text === "{" ? 1 : -1
          kind = "punct"
          break
        case "word":
          kind = afterTagStart ? "tag" : inTag && depth === 0 ? "attr" : undefined
          break
      }
      afterTagStart = id === "tagStart"
      out.push({ text, kind })
      i += text.length
      break
    }
  }
  return out
}

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={copy}
            aria-label={copied ? "Copied" : label}
            className={cn("text-muted-foreground hover:text-foreground", className)}
          />
        }
      >
        {copied ? <CheckIcon className="text-online" /> : <CopyIcon />}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : label}</TooltipContent>
    </Tooltip>
  )
}

export function Code({ code, className }: { code: string; className?: string }) {
  return (
    <pre
      className={cn(
        "overflow-x-auto font-mono text-[13px] leading-[1.7] text-foreground",
        className
      )}
    >
      <code>
        {highlight(code).map((t, i) =>
          t.kind ? (
            <span key={i} className={`syn-${t.kind}`}>
              {t.text}
            </span>
          ) : (
            t.text
          )
        )}
      </code>
    </pre>
  )
}

/** A code panel: a label, the copy button, the code. */
export function CodeBlock({
  code,
  label,
  copyLabel = "Copy code",
  className,
  children,
}: {
  code: string
  label: string
  copyLabel?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-code shadow-[0_1px_0_0_rgb(255_255_255/0.04)_inset]",
        className
      )}
    >
      <div className="flex h-10 items-center gap-2 border-b pr-1.5 pl-4">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        {children}
        <CopyButton value={code} label={copyLabel} className="ml-auto" />
      </div>
      <Code code={code} className="px-4 py-3.5" />
    </div>
  )
}
