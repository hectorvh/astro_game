'use client'

import dynamic from 'next/dynamic'
import { ChevronLeft } from 'lucide-react'
import { useSession } from '@/lib/jerboa/session-context'

const Model3dViewer = dynamic(
  () => import('./model-3d-viewer').then((mod) => mod.Model3dViewer),
  { ssr: false },
)

export function Model3dScreen({
  modelSrc,
  title,
  label,
  rotation,
}: {
  modelSrc: string
  title: string
  label: string
  rotation?: [number, number, number]
}) {
  const { goTo } = useSession()

  return (
    <main className="relative flex h-dvh w-full items-center justify-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/Gemini_Generated_Image_gjhy10gjhy10gjhy.jpeg')" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-background/50"
      />

      <div className="relative z-[1] h-full w-[85%]">
        <Model3dViewer modelSrc={modelSrc} label={label} rotation={rotation} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo('map')}
            aria-label="Back to map"
            className="pointer-events-auto flex size-12 items-center justify-center rounded-2xl border-2 border-primary/40 bg-card/90 text-foreground shadow-storybook backdrop-blur-sm transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-6" />
          </button>
            <div className="rounded-2xl border-2 border-primary/40 bg-card/90 px-4 py-3 shadow-storybook backdrop-blur-sm">
            <h1 className="font-display text-2xl font-bold text-purple">{title}</h1>
            <p className="text-sm font-semibold text-muted-foreground">
              Drag to rotate · scroll or pinch to zoom
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
