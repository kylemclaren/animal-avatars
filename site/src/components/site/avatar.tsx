import type { Ref } from "react"
import { AnimalAvatar, type AnimalAvatarProps } from "animal-avatars"

import { useResolvedTheme } from "@/hooks/use-resolved-theme"

/**
 * `AnimalAvatar` with the site's theme passed down. The component reads an
 * `auto` theme from the page once per render, so a theme switch would
 * otherwise wait for the next prop change to reach the whirl's colour.
 */
export function Avatar({
  ref,
  theme,
  ...props
}: AnimalAvatarProps & { ref?: Ref<HTMLCanvasElement> }) {
  const resolved = useResolvedTheme()
  return (
    <AnimalAvatar
      ref={ref}
      theme={theme && theme !== "auto" ? theme : resolved}
      {...props}
    />
  )
}
