import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { DOMParser } from '@xmldom/xmldom'
import type { Plugin } from 'vite'

/**
 * Serves the KSA "Core" mod assets (XML, GLB, textures) under the `/ksa/` URL
 * prefix, mapped from `thirdparty/ksa/Content/Core`. This keeps large binary game
 * assets out of `public/` while letting the app `fetch('/ksa/...')`.
 *
 * - dev (`configureServer`): streams files on demand.
 * - build (`writeBundle`): copies the catalog XML plus ONLY the GLB/KTX2 files those
 *   XML reference (the Content/Core/Meshes + Textures trees also contain huge,
 *   unrelated planet/cloud assets, so a wholesale copy is avoided) into `dist/ksa/`.
 *   See docs/asset-pipeline.md.
 */
const CORE_DIR = 'thirdparty/ksa/Content/Core'

// Catalog asset XML files (flat at the Core root). Keep in sync with
// ASSET_FILES in src/ksa/catalog.ts.
const CATALOG_XML = [
  'CoreStructuralAAssets.xml',
  'CoreCouplingAAssets.xml',
  'CoreFuelTankAAssets.xml',
  'CoreCommandAAssets.xml',
  'CorePropulsionAAssets.xml',
  'CorePropulsionBAssets.xml',
  'CoreElectricalAAssets.xml',
  'CoreFairingAAssets.xml',
  'CorePassageAAssets.xml',
  'CoreLandingAAssets.xml',
  'CoreServiceModuleAAssets.xml',
  'CoreIVAPropAAssets.xml',
  'CoreIVASpaceAAssets.xml',
  'PartAssets.xml',
]

// Sibling *GameData.xml files (connector flags + editor tags). Not every asset
// file has one; missing siblings are skipped silently. See src/ksa/partCatalog.ts.
const GAMEDATA_XML = CATALOG_XML.map((f) => f.replace(/Assets\.xml$/, 'GameData.xml'))

// PbrMaterial child elements the app actually loads (see src/ksa/catalog.ts).
const TEXTURE_ELEMENTS = ['Diffuse', 'Normal', 'AoRoughMetal', 'Emissive']

/**
 * Parses the catalog XML and returns the set of relative asset paths they
 * reference (e.g. "Meshes/X.glb", "Textures/Y.ktx2") — the minimal file set the
 * app fetches at runtime.
 */
function collectReferencedAssets(srcRoot: string): Set<string> {
  const refs = new Set<string>()
  const parser = new DOMParser()
  for (const file of CATALOG_XML) {
    const path = join(srcRoot, file)
    if (!existsSync(path)) continue
    // Some KSA XML files start with a UTF-8 BOM, which strict @xmldom rejects.
    // eslint-disable-next-line no-irregular-whitespace -- BOM is invisible but real
    const text = readFileSync(path, 'utf-8').replace(/^﻿/, '')
    const doc = parser.parseFromString(text, 'application/xml')
    for (const atlas of Array.from(doc.getElementsByTagName('MeshAtlas'))) {
      const p = atlas.getAttribute('Path')
      if (p) refs.add(p)
    }
    for (const tag of TEXTURE_ELEMENTS) {
      for (const el of Array.from(doc.getElementsByTagName(tag))) {
        const p = el.getAttribute('Path')
        if (p) refs.add(p)
      }
    }
  }
  return refs
}

const MIME: Record<string, string> = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.xml': 'application/xml',
  '.ktx2': 'image/ktx2',
  '.png': 'image/png',
  '.json': 'application/json',
}

export function ksaAssets(): Plugin {
  let root = process.cwd()
  return {
    name: 'flexo-ksa-assets',
    configResolved(config) {
      root = config.root
    },
    // Emit the assets the app fetches at /ksa/* into dist/ksa/ for production.
    writeBundle(options) {
      const srcRoot = join(root, CORE_DIR)
      const outDir = options.dir ?? join(root, 'dist')
      const dstRoot = join(outDir, 'ksa')

      const copy = (rel: string) => {
        const src = join(srcRoot, rel)
        if (!existsSync(src)) {
          this.warn(`ksaAssets: referenced asset missing, skipped: ${rel}`)
          return
        }
        const dst = join(dstRoot, rel)
        mkdirSync(dirname(dst), { recursive: true })
        copyFileSync(src, dst)
      }

      // Catalog XML (the app fetches these by name) + only the GLB/KTX2 they reference.
      for (const file of CATALOG_XML) copy(file)
      // GameData siblings — copy only those that exist (most asset files lack one).
      for (const file of GAMEDATA_XML) {
        if (existsSync(join(srcRoot, file))) copy(file)
      }
      for (const rel of collectReferencedAssets(srcRoot)) copy(rel)
    },
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
