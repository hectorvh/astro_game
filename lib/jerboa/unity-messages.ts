// Message contract between the shell and the Unity iframe.
// Full description: docs/unity-shell-contract.md. Keep both in sync with the Unity repo.

export const UNITY_PLAYER_PATH = '/game-build/play.html'

/** Messages Unity (via play.html) posts to the shell. Never personal or research data. */
export type UnityToShell =
  | { type: 'ready' }
  | { type: 'levelComplete'; level: number }
  | { type: 'exit'; reason: 'pause-menu' | 'quit' }
  /** Legacy builds. Treated exactly like `exit`. */
  | { type: 'astroBunnyExit' }

/** Messages the shell posts into the iframe. */
export type ShellToUnity = { type: 'setMuted'; muted: boolean }

export function unityPlayerUrl(level: number, muted: boolean): string {
  const params = new URLSearchParams({ level: String(level), embed: '1', muted: muted ? '1' : '0' })
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
    default:
      return null
  }
}
