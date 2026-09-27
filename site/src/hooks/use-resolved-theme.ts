import { useSyncExternalStore } from "react"

import { useTheme } from "@/components/theme-provider"

const QUERY = "(prefers-color-scheme: dark)"

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

/** The theme actually on screen: `system` resolved to dark or light. */
export function useResolvedTheme(): "dark" | "light" {
  const { theme } = useTheme()
  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true
  )
  if (theme === "system") return systemDark ? "dark" : "light"
  return theme
}
