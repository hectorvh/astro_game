import type { ReactNode } from 'react'

/** Scattered decorative glyphs that frame the storybook UI panels. */
export function DecorGlyphs({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="absolute left-[6%] top-[12%] size-6 text-amber/70 animate-float-slow" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 22 20H2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <svg className="absolute right-[8%] top-[18%] size-5 text-teal/60 animate-float-slow" viewBox="0 0 24 24" fill="none" style={{ animationDelay: '1.2s' }}>
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute left-[12%] bottom-[16%] size-7 text-purple/50 animate-float-slow" viewBox="0 0 24 24" fill="none" style={{ animationDelay: '0.6s' }}>
        <path d="M2 12c4-6 8 6 12 0s8-6 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <svg className="absolute right-[10%] bottom-[22%] size-5 text-clay/60 animate-float-slow" viewBox="0 0 24 24" fill="none" style={{ animationDelay: '1.8s' }}>
        <path d="M12 3 21 12 12 21 3 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <svg className="absolute left-[46%] top-[7%] size-4 text-crystal/70 animate-float-slow" viewBox="0 0 24 24" fill="none" style={{ animationDelay: '2.4s' }}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  )
}

/** Full-page layered desert backdrop for the onboarding-style panels. */
export function PanelStage({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 sm:py-12">
      {/* Background dune band (parallax base layer) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-cover bg-bottom bg-no-repeat opacity-40"
        style={{ backgroundImage: "url('/images/desert-hero.webp')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background/30"
      />
      <DecorGlyphs />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  )
}

/** The cream storybook card that holds a screen's content. */
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`mx-auto w-full rounded-3xl border-2 border-secondary/40 bg-card/95 p-6 shadow-storybook backdrop-blur-sm sm:p-8 ${className}`}
    >
      {children}
    </section>
  )
}
