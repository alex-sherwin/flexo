import { atom } from 'nanostores'
import type { EditingPart, EulerXYZ, SubPartPlacement, Vec3 } from '../ksa/types'
import { createEmptyPart } from '../ksa/types'

/**
 * Framework-agnostic editor state (nanostores). No React / three.js imports —
 * the three.js scene subscribes via `$part.subscribe(...)` and React reads via
 * `useStore($...)`. Actions are plain exported functions; `$part` is treated as
 * immutable (every mutation replaces it with a fresh object so subscribers fire).
 *
 * Mirrors space-tape's PartEditorController (undo/redo, selection, add/remove/
 * duplicate, transform updates).
 */

export type ToolMode = 'translate' | 'rotate' | 'scale'
export interface SnapSettings {
  translate?: number
  rotateDeg?: number
}

export interface PlacementTransform {
  position: Vec3
  rotation: EulerXYZ
  scale: Vec3
}

export const $part = atom<EditingPart>(createEmptyPart())
export const $selectedIndex = atom<number>(-1)
export const $toolMode = atom<ToolMode>('translate')
export const $snap = atom<SnapSettings>({})
export const $canUndo = atom(false)
export const $canRedo = atom(false)

const MAX_UNDO = 50
const undoStack: EditingPart[] = []
const redoStack: EditingPart[] = []

function clone(part: EditingPart): EditingPart {
  return structuredClone(part)
}

function refreshHistoryFlags(): void {
  $canUndo.set(undoStack.length > 0)
  $canRedo.set(redoStack.length > 0)
}

function clampSelection(): void {
  const max = $part.get().placements.length - 1
  const i = $selectedIndex.get()
  if (i > max) $selectedIndex.set(max)
}

/** Snapshot current state onto the undo stack (call before a mutation). */
export function pushUndo(): void {
  undoStack.push(clone($part.get()))
  if (undoStack.length > MAX_UNDO) undoStack.shift()
  redoStack.length = 0
  refreshHistoryFlags()
}

export function undo(): void {
  const prev = undoStack.pop()
  if (!prev) return
  redoStack.push(clone($part.get()))
  $part.set(prev)
  clampSelection()
  refreshHistoryFlags()
}

export function redo(): void {
  const next = redoStack.pop()
  if (!next) return
  undoStack.push(clone($part.get()))
  $part.set(next)
  clampSelection()
  refreshHistoryFlags()
}

function lastSegmentLower(templateId: string): string {
  const seg = templateId.split('.').pop() ?? templateId
  return seg.toLowerCase()
}

/** Adds a SubPart from the catalog at the origin and selects it. */
export function addSubPart(templateId: string): void {
  pushUndo()
  const part = clone($part.get())
  const base = lastSegmentLower(templateId)
  const count = part.placements.filter((p) => p.subPartTemplateId === templateId).length
  part.placements.push({
    instanceId: `${base}_${count + 1}`,
    subPartTemplateId: templateId,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  })
  $part.set(part)
  $selectedIndex.set(part.placements.length - 1)
}

/**
 * Imports a whole Part by appending all of its SubPart instances to the current
 * project, preserving each one's position/rotation/scale. InstanceIds are
 * regenerated (using the same naming scheme as {@link addSubPart}) so they never
 * collide with placements already in the project. The last added is selected.
 */
export function addPart(placements: readonly SubPartPlacement[]): void {
  if (placements.length === 0) return
  pushUndo()
  const part = clone($part.get())
  for (const src of placements) {
    const base = lastSegmentLower(src.subPartTemplateId)
    const count = part.placements.filter((p) => p.subPartTemplateId === src.subPartTemplateId).length
    part.placements.push({
      instanceId: `${base}_${count + 1}`,
      subPartTemplateId: src.subPartTemplateId,
      position: { ...src.position },
      rotation: { ...src.rotation },
      scale: { ...src.scale },
    })
  }
  $part.set(part)
  $selectedIndex.set(part.placements.length - 1)
}

export function removeSelected(): void {
  const i = $selectedIndex.get()
  if (i < 0 || i >= $part.get().placements.length) return
  pushUndo()
  const part = clone($part.get())
  part.placements.splice(i, 1)
  $part.set(part)
  $selectedIndex.set(Math.min(i, part.placements.length - 1))
}

export function duplicateSelected(): void {
  const i = $selectedIndex.get()
  const src = $part.get().placements[i]
  if (!src) return
  pushUndo()
  const part = clone($part.get())
  const base = lastSegmentLower(src.subPartTemplateId)
  const count = part.placements.filter((p) => p.subPartTemplateId === src.subPartTemplateId).length
  part.placements.push({
    instanceId: `${base}_${count + 1}`,
    subPartTemplateId: src.subPartTemplateId,
    position: { ...src.position },
    rotation: { ...src.rotation },
    scale: { ...src.scale },
  })
  $part.set(part)
  $selectedIndex.set(part.placements.length - 1)
}

export function selectPlacement(index: number): void {
  $selectedIndex.set(index)
}

/**
 * Updates the transform of the placement at `index`. Does NOT push undo — the
 * caller pushes once at the start of an interaction (gizmo drag / field focus).
 */
export function updatePlacementTransform(index: number, t: PlacementTransform): void {
  const current = $part.get()
  if (index < 0 || index >= current.placements.length) return
  const part = clone(current)
  const p = part.placements[index]
  p.position = { ...t.position }
  p.rotation = { ...t.rotation }
  p.scale = { ...t.scale }
  $part.set(part)
}

export function setPartId(partId: string): void {
  const part = clone($part.get())
  part.partId = partId
  $part.set(part)
}

export function newPart(): void {
  undoStack.length = 0
  redoStack.length = 0
  refreshHistoryFlags()
  $part.set(createEmptyPart())
  $selectedIndex.set(-1)
}

export function setToolMode(mode: ToolMode): void {
  $toolMode.set(mode)
}

export function setSnap(snap: SnapSettings): void {
  $snap.set(snap)
}
