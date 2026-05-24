import { describe, it, expect, beforeEach } from 'vitest'
import {
  $part,
  $selectedIndex,
  $canUndo,
  addSubPart,
  duplicateSelected,
  removeSelected,
  newPart,
  redo,
  undo,
  updatePlacementTransform,
} from './editorStore'

beforeEach(() => {
  newPart()
})

describe('editorStore', () => {
  it('adds SubParts with sequential lowercased instance ids and selects the last', () => {
    addSubPart('CoreStructuralA_Subpart_TrussBarA')
    addSubPart('CoreStructuralA_Subpart_TrussBarA')
    const ids = $part.get().placements.map((p) => p.instanceId)
    expect(ids).toEqual(['corestructurala_subpart_trussbara_1', 'corestructurala_subpart_trussbara_2'])
    expect($selectedIndex.get()).toBe(1)
  })

  it('uses the last dot-segment for the instance base name', () => {
    addSubPart('Core.Screw.A')
    expect($part.get().placements[0].instanceId).toBe('a_1')
  })

  it('duplicates the selected placement with its transform and a new id', () => {
    addSubPart('Core.Bolt')
    updatePlacementTransform(0, {
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    })
    duplicateSelected()
    const p = $part.get().placements
    expect(p.length).toBe(2)
    expect(p[1].instanceId).toBe('bolt_2')
    expect(p[1].position).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('removes the selected placement and clamps selection', () => {
    addSubPart('Core.A')
    addSubPart('Core.B')
    removeSelected()
    expect($part.get().placements.map((p) => p.instanceId)).toEqual(['a_1'])
    expect($selectedIndex.get()).toBe(0)
  })

  it('supports undo/redo of additions', () => {
    addSubPart('Core.A')
    addSubPart('Core.B')
    expect($canUndo.get()).toBe(true)
    undo()
    expect($part.get().placements.map((p) => p.instanceId)).toEqual(['a_1'])
    redo()
    expect($part.get().placements.map((p) => p.instanceId)).toEqual(['a_1', 'b_1'])
  })

  it('updatePlacementTransform does not create an undo step', () => {
    addSubPart('Core.A') // this pushes one undo snapshot (empty -> 1 placement)
    updatePlacementTransform(0, {
      position: { x: 5, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    })
    // A single undo should revert the whole add (transform update added no step).
    undo()
    expect($part.get().placements.length).toBe(0)
  })
})
