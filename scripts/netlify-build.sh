#!/usr/bin/env bash
# Prepare Unity WebGL files for Netlify, then run next build.
#
# public/game-build Build, TemplateData, and StreamingAssets are git symlinks
# into game-buildV11/. Only the Brotli files (*.br) and the loader are in git.
# If Unity exported uncompressed (no .br in Build/), create them with:
#   node scripts/brotli-unity-build.mjs game-buildV11
#
# TODO(2026-11-12): game-buildV10 stays as a fallback until V11 is verified on a
# phone; then delete it from git. Netlify publishes a copy of public/ without those
# repo-root folders, so those links would 404. On Netlify we replace them
# with real copies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DRIFT="$ROOT/public/game-build"
SRC_DRIFT="$ROOT/game-buildV11"

if [[ ! -f "$SRC_DRIFT/Build/game-buildV11.wasm.br" ]]; then
  echo "Unity build missing at $SRC_DRIFT/Build/game-buildV11.wasm.br" >&2
  echo "Run: node scripts/brotli-unity-build.mjs game-buildV11" >&2
  exit 1
fi

copy_unity() {
  local src="$1"
  local dest="$2"
  mkdir -p "$dest"
  rm -rf "$dest/Build" "$dest/TemplateData" "$dest/StreamingAssets"
  cp -a "$src/Build" "$dest/Build"
  cp -a "$src/TemplateData" "$dest/TemplateData"
  cp -a "$src/StreamingAssets" "$dest/StreamingAssets"
}

if [[ "${NETLIFY:-}" == "true" || "${FORCE_UNITY_COPY:-}" == "1" ]]; then
  echo "Copying Unity WebGL files into public/ (dereferenced)..."
  copy_unity "$SRC_DRIFT" "$DEST_DRIFT"
fi

cd "$ROOT"
pnpm build
