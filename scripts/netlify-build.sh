#!/usr/bin/env bash
# Prepare Unity WebGL files for Netlify, then run next build.
#
# public/game-build/Build, TemplateData, and StreamingAssets are git symlinks
# into game-buildV3/. Netlify publishes a copy of public/ without the repo-root
# game-buildV3/ folder, so those links would 404. On Netlify we replace them
# with real copies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/game-buildV3"
DEST="$ROOT/public/game-build"

if [[ ! -f "$SRC/Build/game-buildV3.wasm" ]]; then
  echo "Unity build missing at $SRC/Build/game-buildV3.wasm" >&2
  exit 1
fi

if [[ "${NETLIFY:-}" == "true" || "${FORCE_UNITY_COPY:-}" == "1" ]]; then
  echo "Copying Unity WebGL files into public/game-build (dereferenced)..."
  mkdir -p "$DEST"
  rm -rf "$DEST/Build" "$DEST/TemplateData" "$DEST/StreamingAssets"
  cp -a "$SRC/Build" "$DEST/Build"
  cp -a "$SRC/TemplateData" "$DEST/TemplateData"
  cp -a "$SRC/StreamingAssets" "$DEST/StreamingAssets"
fi

cd "$ROOT"
pnpm build
