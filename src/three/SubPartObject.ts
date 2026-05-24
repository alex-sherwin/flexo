import * as THREE from 'three'
import type { CatalogSubPart } from '../ksa/catalog'
import type { SubPartPlacement } from '../ksa/types'
import { getSubPartGeometry } from './MeshAtlasCache'
import { applyPlacement } from './coords'

/**
 * A placed SubPart in the scene: a Group carrying its instance id (for raycast
 * lookup) and a single mesh extracted from the catalog entry's mesh atlas.
 * Untextured for the initial pass (MeshStandardMaterial); texturing is a Phase 9
 * stretch goal.
 */
export class SubPartObject {
  readonly group = new THREE.Group()
  readonly instanceId: string

  private material: THREE.MeshStandardMaterial

  private constructor(instanceId: string, mesh: THREE.Mesh, material: THREE.MeshStandardMaterial) {
    this.instanceId = instanceId
    this.material = material
    this.group.name = `subpart:${instanceId}`
    this.group.userData.instanceId = instanceId
    this.group.add(mesh)
  }

  static async create(
    catalog: CatalogSubPart,
    placement: SubPartPlacement,
  ): Promise<SubPartObject> {
    const geometry = await getSubPartGeometry(catalog.atlasUrl, catalog.meshNodeName)
    const material = new THREE.MeshStandardMaterial({
      color: 0xbfc4cc,
      metalness: 0.6,
      roughness: 0.5,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData.instanceId = placement.instanceId
    const obj = new SubPartObject(placement.instanceId, mesh, material)
    obj.setPlacement(placement)
    return obj
  }

  /** Applies a placement transform to the group via the calibrated coords mapping. */
  setPlacement(placement: SubPartPlacement): void {
    applyPlacement(this.group, placement)
  }

  /** Toggles the selection highlight (emissive tint). */
  setSelected(selected: boolean): void {
    this.material.emissive.setHex(selected ? 0x2a4d6e : 0x000000)
  }

  dispose(): void {
    // Geometry is shared/cached across instances (MeshAtlasCache) — do not
    // dispose it here. Only the per-instance material is owned by this object.
    this.material.dispose()
  }
}
