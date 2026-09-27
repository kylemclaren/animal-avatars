import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { cn } from "cn"

import { Avatar } from "@/components/site/avatar"
import { GitHubIcon } from "@/components/site/icons"
import { useTheme } from "@/components/theme-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useResolvedTheme } from "@/hooks/use-resolved-theme"
import { GITHUB_URL, cast } from "@/lib/cast"

const LINKS = [
  { href: "#playground", label: "Playground" },
  { href: "#animals", label: "Animals" },
  { href: "#in-context", label: "In context" },
  { href: "#api", label: "API" },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-border bg-background/75 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <a
          href="#top"
          className="-ml-1 flex items-center gap-2 rounded-lg px-1 py-1 font-heading text-lg font-semibold tracking-[-0.01em] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar type={cast[0]} size={26} aria-hidden />
          animal-avatars
        </a>
        <nav aria-label="Sections" className="ml-auto hidden items-center gap-0.5 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={buttonVariants({ variant: "ghost", className: "text-muted-foreground hover:text-foreground" })}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <ThemeToggle />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="animal-avatars on GitHub"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <GitHubIcon className="size-[18px]" />
          </a>
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const { setTheme } = useTheme()
  const resolved = useResolvedTheme()
  const next = resolved === "dark" ? "light" : "dark"
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(next)}
            aria-label={`Switch to the ${next} theme`}
          />
        }
      >
        {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
      </TooltipTrigger>
      <TooltipContent>
        {resolved === "dark" ? "Morning" : "Night"} <Kbd>D</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}
