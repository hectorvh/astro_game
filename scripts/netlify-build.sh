#!/usr/bin/env bash
# Prepare Unity WebGL files for Netlify, then run next build.
#
# public/game-build Build, TemplateData, and StreamingAssets are git symlinks
# into game-buildV7/. Netlify publishes a copy of public/ without those
# repo-root folders, so those links would 404. On Netlify we replace them
# with real copies.
#
# Unused Unity package dumps, prototype images, and source .unitypackage
# files live under public/ (~300MB). They are not referenced by the app
# and would be uploaded with the site, so they are stripped on Netlify only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DRIFT="$ROOT/public/game-build"
SRC_DRIFT="$ROOT/game-buildV7"

if [[ ! -f "$SRC_DRIFT/Build/game-buildV7.wasm.br" ]]; then
  echo "Unity build missing at $SRC_DRIFT/Build/game-buildV7.wasm.br" >&2
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

# Drop assets that are not served by the live app so the publish upload
# stays under Netlify size/time limits.
strip_unpublished_assets() {
  echo "public/ before strip: $(du -sh "$ROOT/public" | cut -f1)"
  rm -rf \
    "$ROOT/public/3d/bunny3D" \
    "$ROOT/public/3d/laika3D" \
    "$ROOT/public/dev"
  rm -f \
    "$ROOT/public/3d/"*.unitypackage \
    "$ROOT/public/videos/generate_a_video_intro_in_one.mp4"
  echo "public/ after strip:  $(du -sh "$ROOT/public" | cut -f1)"
}

if [[ "${NETLIFY:-}" == "true" || "${FORCE_UNITY_COPY:-}" == "1" ]]; then
  echo "Copying Unity WebGL files into public/ (dereferenced)..."
  copy_unity "$SRC_DRIFT" "$DEST_DRIFT"
fi

if [[ "${NETLIFY:-}" == "true" ]]; then
  strip_unpublished_assets
fi

cd "$ROOT"
pnpm build
