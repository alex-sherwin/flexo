import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Serves the KSA "Core" mod assets (XML, GLB, textures) under the `/ksa/` URL
 * prefix in dev, mapped from `thirdparty/ksa/Content/Core`. This keeps large
 * binary game assets out of `public/` while letting the app `fetch('/ksa/...')`.
 *
 * For production (`vite build`), copy `thirdparty/ksa/Content/Core` to
 * `dist/ksa/` as a follow-up build step (not needed for the dev-first pass).
 */
const CORE_DIR = 'thirdparty/ksa/Content/Core'

const MIME: Record<string, string> = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.xml': 'application/xml',
  '.ktx2': 'image/ktx2',
  '.png': 'image/png',
  '.json': 'application/json',
}

export function ksaAssets(): Plugin {
  return {
    name: 'flexo-ksa-assets',
    configureServer(server) {
      const root = server.config.root
      const baseDir = join(root, CORE_DIR)
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/ksa/')) return next()
        // Strip query string and decode, then prevent path traversal.
        const rel = decodeURIComponent(req.url.slice('/ksa/'.length).split('?')[0])
        const abs = normalize(join(baseDir, rel))
        if (!abs.startsWith(baseDir)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        try {
          const st = statSync(abs)
          if (!st.isFile()) return next()
          res.setHeader('Content-Type', MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream')
          res.setHeader('Content-Length', st.size)
          createReadStream(abs).pipe(res)
        } catch {
          next()
        }
      })
    },
  }
}
