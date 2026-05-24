import { computed } from 'nanostores'
import { $part, $selectedIndex } from './editorStore'
import type { SubPartPlacement } from '../ksa/types'

/** The currently selected placement, or null when nothing is selected. */
export const $selectedPlacement = computed(
  [$part, $selectedIndex],
  (part, index): SubPartPlacement | null => part.placements[index] ?? null,
)
