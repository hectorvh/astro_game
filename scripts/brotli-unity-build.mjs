#!/usr/bin/env node
// Brotli-compress a Unity WebGL build that was exported with compression disabled.
//
//   node scripts/brotli-unity-build.mjs game-buildV10
//
// Writes <name>.data.br, <name>.wasm.br and <name>.framework.js.br next to the
// originals (which are left untouched). The loader stays uncompressed, as in a
// Unity Brotli export. The server sends the .br files with Content-Encoding: br
// (netlify.toml, next.config.mjs), so the browser decompresses them and Unity's
// loader never sees the difference.
//
// Uses Node's built-in zlib, no extra dependency. Skips files whose .br is newer.

import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { constants, createBrotliCompress } from 'node:zlib'

const dir = process.argv[2]
if (!dir) {
  console.error('Usage: node scripts/brotli-unity-build.mjs <unity-build-folder>')
  process.exit(1)
}

const name = basename(resolve(dir))
const buildDir = join(dir, 'Build')
const targets = [
  { file: `${name}.data`, mode: constants.BROTLI_MODE_GENERIC },
  { file: `${name}.wasm`, mode: constants.BROTLI_MODE_GENERIC },
  { file: `${name}.framework.js`, mode: constants.BROTLI_MODE_TEXT },
]

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

for (const { file, mode } of targets) {
  const src = join(buildDir, file)
  const out = `${src}.br`
  if (!existsSync(src)) {
    console.error(`Missing ${src}`)
    process.exit(1)
  }
  const size = statSync(src).size
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
    console.log(`skip  ${file}.br (up to date, ${mb(statSync(out).size)})`)
    continue
  }
  const started = Date.now()
  await pipeline(
    createReadStream(src),
    createBrotliCompress({
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_LGWIN]: constants.BROTLI_MAX_WINDOW_BITS,
        [constants.BROTLI_PARAM_MODE]: mode,
        [constants.BROTLI_PARAM_SIZE_HINT]: size,
      },
    }),
    createWriteStream(out),
  )
  const seconds = ((Date.now() - started) / 1000).toFixed(0)
  console.log(`wrote ${file}.br  ${mb(size)} -> ${mb(statSync(out).size)}  (${seconds}s)`)
}
