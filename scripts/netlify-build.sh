#!/usr/bin/env bash
# Prepare Unity WebGL files for Netlify, then run next build.
#
# public/game-build/Build and TemplateData are git symlinks into game-buildV2/.
# Netlify publishes a copy of public/ without the repo-root game-buildV2/ folder,
# so those links would 404. On Netlify we replace them with real copies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/game-buildV2"
DEST="$ROOT/public/game-build"

if [[ ! -f "$SRC/Build/game-buildV2.wasm" ]]; then
  echo "Unity build missing at $SRC/Build/game-buildV2.wasm" >&2
  exit 1
fi

if [[ "${NETLIFY:-}" == "true" || "${FORCE_UNITY_COPY:-}" == "1" ]]; then
  echo "Copying Unity WebGL files into public/game-build (dereferenced)..."
  mkdir -p "$DEST"
  rm -rf "$DEST/Build" "$DEST/TemplateData"
  cp -a "$SRC/Build" "$DEST/Build"
  cp -a "$SRC/TemplateData" "$DEST/TemplateData"
fi

cd "$ROOT"
pnpm build
