import { Capacitor } from '@capacitor/core'

interface WebkitFullscreenDocument {
  webkitFullscreenElement?: Element | null
  webkitFullscreenEnabled?: boolean
}

interface WebkitFullscreenElement {
  webkitRequestFullscreen?: () => void | Promise<void>
}

interface NavigatorStandalone {
  standalone?: boolean
}

export function isFullscreen(): boolean {
  const doc = document as Document & WebkitFullscreenDocument
  return !!(document.fullscreenElement || doc.webkitFullscreenElement)
}

export function isFullscreenSupported(): boolean {
  const doc = document as Document & WebkitFullscreenDocument
  return !!(document.fullscreenEnabled || doc.webkitFullscreenEnabled)
}

export function isIOSPhoneBrowser(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
  if (!isIPhone) return false
  const standalone = (navigator as Navigator & NavigatorStandalone).standalone === true
  if (standalone) return false
  if (window.matchMedia('(display-mode: standalone)').matches) return false
  if (window.matchMedia('(display-mode: fullscreen)').matches) return false
  return true
}

// Call this synchronously from a click or tap handler. Do not await anything
// before requestFullscreen, or the browser will reject the user gesture.
export async function enterFullscreen(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      try {
        const { StatusBar } = await import('@capacitor/status-bar')
        await StatusBar.hide()
        await StatusBar.setOverlaysWebView({ overlay: true })
      } catch {
        // The WebView is already full screen if the plugin is missing.
      }
      return true
    }

    if (typeof document === 'undefined') return false
    if (isFullscreen()) return true

    const root = document.documentElement as HTMLElement & WebkitFullscreenElement
    if (typeof root.requestFullscreen === 'function') {
      await root.requestFullscreen({ navigationUI: 'hide' })
      return true
    }
    if (typeof root.webkitRequestFullscreen === 'function') {
      await Promise.resolve(root.webkitRequestFullscreen())
      return true
    }
    return false
  } catch {
    return false
  }
}
