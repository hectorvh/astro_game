// Development only: counts WebGL contexts created on this page and warns when a
// single menu visit creates more than WEBGL_VISIT_LIMIT. Imported for its side
// effect from journey-app.tsx. In production the body is dead code and nothing
// is patched.

const WEBGL_VISIT_LIMIT = 3
const WEBGL_TYPES = new Set(['webgl', 'webgl2', 'experimental-webgl'])

type CounterState = {
  /** Contexts created since page load. */
  created: number
  /** Contexts created and not yet lost. */
  live: number
  /** Contexts created during the current visit (see beginWebGLVisit). */
  visit: number
  visitLabel: string
  warned: boolean
}

declare global {
  interface Window {
    /** Development only: WebGL context counter (lib/jerboa/dev-webgl-counter.ts). */
    __astroBunnyWebGL?: CounterState
  }
}

function install(): void {
  const PATCHED = Symbol.for('astroBunny.webglCounter')
  const proto = HTMLCanvasElement.prototype as HTMLCanvasElement & { [PATCHED]?: true }
  if (proto[PATCHED]) return
  proto[PATCHED] = true

  const state: CounterState = { created: 0, live: 0, visit: 0, visitLabel: 'page', warned: false }
  window.__astroBunnyWebGL = state
  const seen = new WeakSet<object>()
  const original = proto.getContext

  proto.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
    const ctx = (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest)
    if (ctx && WEBGL_TYPES.has(type) && !seen.has(ctx)) {
      seen.add(ctx)
      state.created += 1
      state.live += 1
      state.visit += 1
      this.addEventListener('webglcontextlost', () => {
        state.live = Math.max(0, state.live - 1)
      })
      if (state.visit > WEBGL_VISIT_LIMIT && !state.warned) {
        state.warned = true
        console.warn(
          `[webgl] ${state.visit} WebGL contexts created during "${state.visitLabel}" (limit ${WEBGL_VISIT_LIMIT}). ` +
            'Something is creating contexts repeatedly; browsers drop the oldest one past their limit.',
        )
      }
    }
    return ctx
  } as typeof proto.getContext
}

/** Starts a new counting window, e.g. when the menu mounts. No-op in production. */
export function beginWebGLVisit(label: string): void {
  const state = typeof window === 'undefined' ? undefined : window.__astroBunnyWebGL
  if (!state) return
  state.visit = 0
  state.visitLabel = label
  state.warned = false
}

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  install()
}
