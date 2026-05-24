import { atom, computed } from 'nanostores'
import { indexCatalog, loadCoreCatalog, type CatalogSubPart } from '../ksa/catalog'

/** The loaded Core SubPart catalog (empty until {@link ensureCatalogLoaded}). */
export const $catalog = atom<CatalogSubPart[]>([])
export const $catalogLoading = atom<boolean>(true)

/** id -> entry index, recomputed when the catalog changes. */
export const $catalogIndex = computed($catalog, indexCatalog)

let started = false

/** Loads the catalog once (idempotent). Safe to call from multiple mounts. */
export async function ensureCatalogLoaded(): Promise<void> {
  if (started) return
  started = true
  try {
    const entries = await loadCoreCatalog()
    $catalog.set(entries)
  } catch (err) {
    console.error('flexo: catalog load failed', err)
  } finally {
    $catalogLoading.set(false)
  }
}
