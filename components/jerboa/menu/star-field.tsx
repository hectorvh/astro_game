'use client'

import { useEffect, useRef } from 'react'

type Star = { x: number; y: number; r: number; a: number; v: number }

export function StarField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const stars: Star[] = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() < 0.75 ? 1 : 2,
      a: 0.3 + Math.random() * 0.6,
      v: 0.004 + Math.random() * 0.01,
    }))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let alive = true

    const draw = (drift: boolean, dt: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const pxW = Math.max(1, Math.floor(width * dpr))
      const pxH = Math.max(1, Math.floor(height * dpr))
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW
        canvas.height = pxH
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#E6EDF3'
      for (const star of stars) {
        if (drift) {
          star.x += star.v * dt
          if (star.x > 1) star.x -= 1
        }
        ctx.globalAlpha = star.a
        ctx.fillRect(star.x * width, star.y * height, star.r, star.r)
      }
      ctx.globalAlpha = 1
    }

    let last = performance.now()
    const tick = (now: number) => {
      if (!alive) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      draw(!motion.matches, dt)
      if (!motion.matches) frame = window.requestAnimationFrame(tick)
    }

    draw(false, 0)
    if (!motion.matches) frame = window.requestAnimationFrame(tick)
    const onResize = () => draw(!motion.matches, 0)
    window.addEventListener('resize', onResize)
    return () => {
      alive = false
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
    />
  )
}
