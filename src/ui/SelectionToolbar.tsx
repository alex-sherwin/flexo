import { useStore } from '@nanostores/react'
import {
  Button,
  Toolbar as CladdToolbar,
  Segmented,
  SegmentedButton,
  ToolbarSeparator,
} from '@cladd-ui/react'
import {
  $toolMode,
  duplicateSelected,
  removeSelected,
  setToolMode,
  type ToolMode,
} from '../state/editorStore'
import { $hasSelection } from '../state/selectors'

const MODES: { mode: ToolMode; label: string }[] = [
  { mode: 'translate', label: 'Move' },
  { mode: 'rotate', label: 'Rotate' },
  { mode: 'scale', label: 'Scale' },
]

/**
 * Floating toolbar that appears centered below the main toolbar whenever
 * anything is selected (one or more SubParts, or a connector). Holds the
 * transform tool mode (drives the 3D gizmo via $toolMode) plus duplicate/delete,
 * all of which act on the whole selection.
 */
export function SelectionToolbar() {
  const hasSelection = useStore($hasSelection)
  const mode = useStore($toolMode)

  if (!hasSelection) return null

  return (
    <CladdToolbar size="sm">
      <Segmented>
        {MODES.map((m) => (
          <SegmentedButton
            key={m.mode}
            active={m.mode === mode}
            onClick={() => setToolMode(m.mode)}
          >
            {m.label}
          </SegmentedButton>
        ))}
      </Segmented>

      <ToolbarSeparator />

      <Button size="sm" onClick={() => duplicateSelected()}>
        Duplicate
      </Button>
      <Button size="sm" color="red" onClick={() => removeSelected()}>
        Delete
      </Button>
    </CladdToolbar>
  )
}
