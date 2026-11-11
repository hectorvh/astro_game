// Message contract between the shell and the Unity iframe.
// Full description: docs/unity-shell-contract.md. Keep both in sync with the Unity repo.

import { canToggleFullscreen } from './fullscreen'
import type { RunMode } from './levels'

export const UNITY_PLAYER_PATH = '/game-build/play.html'

/** Messages Unity (via play.html) posts to the shell. Never personal or research data. */
export type UnityToShell =
  | { type: 'ready' }
  | { type: 'levelComplete'; level: number }
  | { type: 'exit'; reason: 'pause-menu' | 'quit' }
  /** Legacy builds. Treated exactly like `exit`. */
  | { type: 'astroBunnyExit' }
  /** The participant toggled Unity's own Mute button. Not terminal. */
  | { type: 'mutedChanged'; muted: boolean }
  /** The participant pressed Unity's Full screen button (only shown when fs=1). Not terminal. */
  | { type: 'toggleFullscreen' }

/** Messages the shell posts into the iframe. */
export type ShellToUnity =
  | { type: 'setMuted'; muted: boolean }
  /** Sent on every fullscreenchange and once after 'ready'. */
  | { type: 'fullscreenChanged'; active: boolean }

/** Unity's names for the run modes (BoxSpawner.GameMode). Always sent: without it
 *  Unity falls back to Trial and would record every mission as practice. */
const UNITY_MODE: Record<RunMode, 'assessment' | 'trial'> = {
  mission: 'assessment',
  practice: 'trial',
}

export function unityPlayerUrl(level: number, muted: boolean, mode: RunMode): string {
  const params = new URLSearchParams({
    level: String(level),
    mode: UNITY_MODE[mode],
    embed: '1',
    muted: muted ? '1' : '0',
    // 0 on iPhone browsers, in the native app and where the API is missing: Unity hides its button.
    fs: canToggleFullscreen() ? '1' : '0',
  })
  return `${UNITY_PLAYER_PATH}?${params.toString()}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Returns a typed message, or null for anything unknown or malformed. */
export function parseUnityMessage(data: unknown): UnityToShell | null {
  if (!isRecord(data)) return null
  switch (data.type) {
    case 'ready':
      return { type: 'ready' }
    case 'levelComplete':
      return Number.isInteger(data.level) && (data.level as number) >= 1 && (data.level as number) <= 4
        ? { type: 'levelComplete', level: data.level as number }
        : null
    case 'exit':
      return { type: 'exit', reason: data.reason === 'quit' ? 'quit' : 'pause-menu' }
    case 'astroBunnyExit':
      return { type: 'astroBunnyExit' }
    case 'mutedChanged':
      return typeof data.muted === 'boolean' ? { type: 'mutedChanged', muted: data.muted } : null
    case 'toggleFullscreen':
      return { type: 'toggleFullscreen' }
    default:
      return null
  }
}
