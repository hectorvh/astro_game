import type { ReactNode } from 'react'

/** Scattered decorative glyphs that frame the space UI panels. */
export function DecorGlyphs({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="absolute left-[6%] top-[12%] size-5 text-lane-cyan/70 animate-float-slow" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 13.2 8.8 20 10 13.2 11.2 12 18 10.8 11.2 4 10 10.8 8.8Z" />
      </svg>
      <svg className="absolute right-[8%] top-[18%] size-4 text-portal-magenta/60 animate-float-slow" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: '1.2s' }}>
        <circle cx="12" cy="12" r="4" />
      </svg>
      <svg className="absolute left-[12%] bottom-[16%] size-6 text-portal-mint/50 animate-float-slow" viewBox="0 0 24 24" fill="none" style={{ animationDelay: '0.6s' }}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute right-[10%] bottom-[22%] size-5 text-portal-amber/60 animate-float-slow" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: '1.8s' }}>
        <path d="M12 2 13.2 8.8 20 10 13.2 11.2 12 18 10.8 11.2 4 10 10.8 8.8Z" />
      </svg>
      <svg className="absolute left-[46%] top-[7%] size-3 text-hud-text/70 animate-float-slow" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: '2.4s' }}>
        <circle cx="12" cy="12" r="3" />
      </svg>
    </div>
  )
}

/** Full-page layered space backdrop for the onboarding-style panels. */
export function PanelStage({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-cover bg-bottom bg-no-repeat opacity-40"
        style={{ backgroundImage: "url('/images/Gemini_Generated_Image_gjhy10gjhy10gjhy.jpeg')" }}
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

/** The hull-panel card that holds a screen's content. */
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`mx-auto w-full rounded-3xl border-2 border-primary/40 bg-card/95 p-6 shadow-storybook backdrop-blur-sm sm:p-8 ${className}`}
    >
      {children}
    </section>
  )
}
