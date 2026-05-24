# Asset Pipeline & Production Build

How the KSA model/texture/XML assets reach the app — and **what must be done so the
production build (`pnpm build`) includes them** (today they only work in `pnpm dev`).

## How assets are addressed

All runtime code fetches game assets from the `/ksa/` URL prefix, e.g.:
- catalog XML: `/ksa/CoreStructuralAAssets.xml`
- meshes: `/ksa/Meshes/CoreStructuralA_MeshAtlas.glb`
- textures: `/ksa/Textures/CoreStructuralA_TextureAtlas_Diffuse.ktx2`

These map to `thirdparty/ksa/Content/Core/...` on disk.

The KTX2 transcoder worker assets are addressed from `/basis/` and live in
`public/basis/` — Vite copies `public/` into `dist/` automatically, so **those work
in the production build already**. Only the `/ksa/` assets need attention.

## Dev: `vite/ksaAssets.ts` plugin (`configureServer`)

In dev, the `ksaAssets()` plugin installs middleware that serves `GET /ksa/*` by
streaming files from `thirdparty/ksa/Content/Core` (with a path-traversal guard and
per-extension `Content-Type`). This is **dev-server only** — `configureServer` does
not run during `vite build`.

## The production gap

`pnpm build` runs `tsc -b && vite build`. The `ksaAssets` plugin contributes nothing
to the build output, and `thirdparty/` is outside `public/`, so **`dist/ksa/` is never
created** → the built static app's `fetch('/ksa/...')` returns 404 and nothing loads.

## Build: the `writeBundle` hook (implemented)

`vite/ksaAssets.ts` has a `writeBundle` hook that emits into `dist/ksa/` exactly the
files the app fetches — **selectively**, because copying the full `Content/Core/Meshes`
+ `Textures` trees pulls in huge unrelated planet/cloud assets (a wholesale copy is
~2.7 GB; the selective copy is ~105 MB).

What it copies:
1. The catalog `*Assets.xml` files (the `CATALOG_XML` list — keep in sync with
   `ASSET_FILES` in `src/ksa/catalog.ts`).
2. Only the `Meshes/*.glb` and `Textures/*.ktx2` paths **referenced** by those XML —
   resolved at build time by parsing each XML (`@xmldom/xmldom`) and collecting every
   `<MeshAtlas Path>` plus the `<Diffuse>/<Normal>/<AoRoughMetal>/<Emissive>` `Path`s
   (`collectReferencedAssets`). ThinFilm `.dds` is intentionally excluded (unused).

Implementation notes:
- Uses only `node:fs`/`node:path` + the already-present `@xmldom/xmldom` — no new dep.
- Strips a leading UTF-8 **BOM** before parsing: some KSA XML files begin with a BOM
  that strict `@xmldom` rejects (the browser `DOMParser` tolerates it, which is why
  dev worked without this).
- `configResolved` captures Vite's `root`; `writeBundle(options)` uses `options.dir`
  as the output dir, creating parent dirs per file.

## Remaining considerations
- **Base path / deploy subpath:** the `/ksa/` and `/basis/` URL prefixes are absolute.
  For a sub-path deploy, set Vite `base` and make those prefixes respect
  `import.meta.env.BASE_URL` (in `src/ksa/catalog.ts`, `src/three/textureSupport.ts`,
  and the calibration loader). For root deploys, no change.
- **Size (~105 MB):** all category atlases ship up front. To shrink, split per-category
  and lazy-load, or convert textures offline (see `plans/FLEXO_TEXTURING.md` appendix).
- **Cache headers / CDN:** atlases are large and content-stable — serve `dist/` with
  long cache lifetimes.
- **Alternative considered:** `vite-plugin-static-copy` — rejected to avoid a dep and
  because selective copy needs the XML-reference resolution anyway.

## Verifying a production build
```
pnpm build
# emitted (selective):
#   dist/ksa/CoreStructuralAAssets.xml                              (14 *Assets.xml)
#   dist/ksa/Meshes/CoreStructuralA_MeshAtlas.glb                  (~14 .glb)
#   dist/ksa/Textures/CoreStructuralA_TextureAtlas_Diffuse.ktx2    (~47 .ktx2)
#   dist/basis/basis_transcoder.wasm                  (copied by Vite from public/)
pnpm preview   # serves dist/; add a SubPart and confirm it renders textured
```

## Current status
- ✅ Dev (`pnpm dev`): `/ksa/*` served by `ksaAssets()`; `/basis/*` from `public/`.
- ✅ Build (`pnpm build`): `/basis/*` from `public/`; `/ksa/*` emitted by the
  `writeBundle` hook (catalog XML + referenced GLB/KTX2 only, ~105 MB).
