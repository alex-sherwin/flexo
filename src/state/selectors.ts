import { computed } from 'nanostores'
import { $part, $selectedConnectorIndex, $selectedIndices } from './editorStore'
import type { Connector, SubPartPlacement } from '../ksa/types'

/** The currently selected placement when exactly one SubPart is selected, else null. */
export const $selectedPlacement = computed(
  [$part, $selectedIndices],
  (part, indices): SubPartPlacement | null =>
    indices.length === 1 ? part.placements[indices[0]] ?? null : null,
)

/** A selected SubPart paired with its index. */
export interface SelectedPlacement {
  index: number
  placement: SubPartPlacement
}

/** All currently selected SubParts (index + placement), in selection order. */
export const $selectedPlacements = computed(
  [$part, $selectedIndices],
  (part, indices): SelectedPlacement[] =>
    indices.flatMap((index) => {
      const placement = part.placements[index]
      return placement ? [{ index, placement }] : []
    }),
)

/** True when anything (one or more SubParts, or a connector) is selected. */
export const $hasSelection = computed(
  [$selectedIndices, $selectedConnectorIndex],
  (indices, conIndex): boolean => indices.length > 0 || conIndex >= 0,
)

/**
 * The single selected entity (SubPart or connector) as a discriminated union, or
 * null. The SubPart branch is non-null ONLY when exactly one SubPart is selected;
 * multi-selection is represented by {@link $selectedPlacements} instead and drives
 * the bulk transform UI. SubPart and connector selection are mutually exclusive.
 */
export type SelectedEntity =
  | { kind: 'subpart'; index: number; placement: SubPartPlacement }
  | { kind: 'connector'; index: number; connector: Connector }

export const $selectedEntity = computed(
  [$part, $selectedIndices, $selectedConnectorIndex],
  (part, subIndices, conIndex): SelectedEntity | null => {
    if (subIndices.length === 1) {
      const placement = part.placements[subIndices[0]]
      if (placement) return { kind: 'subpart', index: subIndices[0], placement }
    }
    const connector = part.connectors[conIndex]
    if (conIndex >= 0 && connector) return { kind: 'connector', index: conIndex, connector }
    return null
  },
)
