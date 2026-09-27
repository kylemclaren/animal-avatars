import { useEffect, useState, type RefObject } from "react"

/** Whether an element is on screen, for demos that should only run then. */
export function useInView(
  ref: RefObject<Element | null>,
  rootMargin = "0px"
): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== "function") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return inView
}
