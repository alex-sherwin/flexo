import { useStore } from '@nanostores/react'
import { Button, NumberField, Segmented, SegmentedButton, Toolbar as CladdToolbar } from '@cladd-ui/react'
import {
  $canRedo,
  $canUndo,
  $snap,
  $toolMode,
  redo,
  setSnap,
  setToolMode,
  undo,
  type ToolMode,
} from '../state/editorStore'

const MODES: { mode: ToolMode; label: string }[] = [
  { mode: 'translate', label: 'Move' },
  { mode: 'rotate', label: 'Rotate' },
  { mode: 'scale', label: 'Scale' },
]

/**
 * Top toolbar: transform tool mode (drives the 3D gizmo via $toolMode), grid/
 * rotation snap increments (0 = off), and undo/redo. Everything is wired to the
 * shared store, so the 3D gizmo reacts without any direct coupling.
 */
export function EditorToolbar() {
  const mode = useStore($toolMode)
  const snap = useStore($snap)
  const canUndo = useStore($canUndo)
  const canRedo = useStore($canRedo)

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

      <div className="flex items-center gap-1 px-1">
        <span className="text-xs text-cladd-fg-softer">Grid</span>
        <NumberField
          size="sm"
          input={false}
          min={0}
          max={10}
          step={0.1}
          value={snap.translate ?? 0}
          onChange={(v) => setSnap({ ...snap, translate: v > 0 ? v : undefined })}
        />
        <span className="text-xs text-cladd-fg-softer">Rot°</span>
        <NumberField
          size="sm"
          input={false}
          min={0}
          max={90}
          step={15}
          value={snap.rotateDeg ?? 0}
          onChange={(v) => setSnap({ ...snap, rotateDeg: v > 0 ? v : undefined })}
        />
      </div>

      <Button size="sm" disabled={!canUndo} onClick={() => undo()}>
        Undo
      </Button>
      <Button size="sm" disabled={!canRedo} onClick={() => redo()}>
        Redo
      </Button>
    </CladdToolbar>
  )
}
