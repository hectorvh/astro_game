// One WebGL probe per page load. Each probe creates a real WebGL context, and
// browsers only keep a handful alive (they drop the oldest one past the limit),
// so this must never run per render.

let webglSupport: boolean | null = null

type LoseContext = { loseContext: () => void }

export function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    const ctx = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as
      | WebGLRenderingContext
      | WebGL2RenderingContext
      | null
    webglSupport = !!ctx
    // Release the probe context right away so it does not count against the limit.
    ;(ctx?.getExtension('WEBGL_lose_context') as LoseContext | null)?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}
