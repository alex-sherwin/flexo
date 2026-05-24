/**
 * Core domain types for the flexo Part editor. These mirror the in-game
 * space-tape editor's state model (PartEditorState.cs / GameDataModels.cs) but
 * are intentionally framework-agnostic — no React, no three.js imports.
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** Euler rotation in radians, applied in XYZ order (matches KSA's serialization). */
export interface EulerXYZ {
  x: number
  y: number
  z: number
}

export const VEC3_ZERO: Readonly<Vec3> = { x: 0, y: 0, z: 0 }
export const VEC3_ONE: Readonly<Vec3> = { x: 1, y: 1, z: 1 }
export const EULER_ZERO: Readonly<EulerXYZ> = { x: 0, y: 0, z: 0 }

/** One placed SubPart instance within the Part being edited. */
export interface SubPartPlacement {
  /** Unique instance id within this Part, e.g. "trussbara_1". */
  instanceId: string
  /** Catalog SubPart template id, e.g. "CoreStructuralA_Subpart_TrussBarA". */
  subPartTemplateId: string
  /** Position relative to the Part origin, in meters. */
  position: Vec3
  /** Rotation in radians (Euler XYZ). */
  rotation: EulerXYZ
  /** Scale, default (1,1,1). */
  scale: Vec3
}

/** The full Part being assembled in the editor. */
export interface EditingPart {
  /** Part id used in the exported XML (must be unique), e.g. "fixme_part_id". */
  partId: string
  /** Optional editor tags emitted as <EditorTag Value="..."/> in the Assets <Part>. */
  editorTags: string[]
  /** All placed SubPart instances. */
  placements: SubPartPlacement[]
}

export function createEmptyPart(): EditingPart {
  return { partId: 'fixme_part_id', editorTags: [], placements: [] }
}
