import type { ReactNode } from "react"

/** A section's name, its title, and a line on what it is for. */
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-x-12 gap-y-3 sm:mb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
      <div>
        <p className="font-heading text-[15px] font-semibold text-primary">{eyebrow}</p>
        <h2 className="mt-1.5 font-heading text-4xl font-semibold tracking-[-0.01em] text-balance sm:text-5xl">
          {title}
        </h2>
      </div>
      {children && (
        <p className="max-w-xl text-base text-pretty text-muted-foreground sm:text-lg lg:pb-1.5">
          {children}
        </p>
      )}
    </div>
  )
}
