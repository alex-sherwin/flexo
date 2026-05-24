import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { Input, Surface } from '@cladd-ui/react'
import { $selectedIndex } from '../state/editorStore'
import { $selectedPlacement } from '../state/selectors'
import { pushUndo, updatePlacementTransform } from '../state/editorStore'
import type { PlacementTransform } from '../state/editorStore'
import type { SubPartPlacement } from '../ksa/types'

const RAD2DEG = 180 / Math.PI
const DEG2RAD = Math.PI / 180

/** Format a number for display: trim to ~5 decimals, no trailing zeros. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return String(Math.round(n * 1e5) / 1e5)
}

/**
 * A single numeric field. Free-types while focused (local string state), and
 * reflects external store changes (e.g. gizmo drags) when not focused. Commits a
 * parsed number on every valid keystroke; calls `onInteractionStart` once on
 * focus so a typing session collapses into a single undo step.
 */
function ScalarField(props: {
  value: number
  onCommit: (n: number) => void
  onInteractionStart: () => void
  label: string
}) {
  const { value, onCommit, onInteractionStart, label } = props
  // `draft` is non-null only while the field is focused; otherwise the field
  // shows the live store value (so gizmo drags / undo update it). This avoids a
  // setState-in-effect sync.
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <label className="flex items-center gap-1">
      <span className="w-3 text-xs text-cladd-fg-softer">{label}</span>
      <Input
        size="sm"
        type="number"
        value={draft ?? fmt(value)}
        inputClassName="font-mono"
        onChange={(v: string) => {
          setDraft(v)
          const n = Number.parseFloat(v)
          if (Number.isFinite(n)) onCommit(n)
        }}
        onFocus={() => {
          setDraft(fmt(value))
          onInteractionStart()
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  )
}

type Axis = 'x' | 'y' | 'z'

/**
 * Numeric transform inspector for the selected placement. Two-way bound with the
 * 3D gizmo: both edit the SAME store (updatePlacementTransform), so typing moves
 * the model live and gizmo drags update these fields live. Rotation is shown in
 * degrees but stored/exported in radians.
 */
export function TransformInspector() {
  const placement = useStore($selectedPlacement)
  const index = useStore($selectedIndex)
  if (!placement) return null

  const commit = (mutate: (t: PlacementTransform) => void) => {
    const next: PlacementTransform = {
      position: { ...placement.position },
      rotation: { ...placement.rotation },
      scale: { ...placement.scale },
    }
    mutate(next)
    updatePlacementTransform(index, next)
  }

  const posField = (axis: Axis) => (
    <ScalarField
      label={axis.toUpperCase()}
      value={placement.position[axis]}
      onInteractionStart={pushUndo}
      onCommit={(n) => commit((t) => (t.position[axis] = n))}
    />
  )
  const rotField = (axis: Axis) => (
    <ScalarField
      label={axis.toUpperCase()}
      value={placement.rotation[axis] * RAD2DEG}
      onInteractionStart={pushUndo}
      onCommit={(deg) => commit((t) => (t.rotation[axis] = deg * DEG2RAD))}
    />
  )
  const scaleField = (axis: Axis) => (
    <ScalarField
      label={axis.toUpperCase()}
      value={placement.scale[axis]}
      onInteractionStart={pushUndo}
      onCommit={(n) => commit((t) => (t.scale[axis] = n))}
    />
  )

  return (
    <Surface outline className="rounded-xl" contentClassName="flex flex-col gap-2 p-2">
      <InstanceHeader placement={placement} />
      <Section title="Position (m)">
        {posField('x')}
        {posField('y')}
        {posField('z')}
      </Section>
      <Section title="Rotation (°)">
        {rotField('x')}
        {rotField('y')}
        {rotField('z')}
      </Section>
      <Section title="Scale">
        {scaleField('x')}
        {scaleField('y')}
        {scaleField('z')}
      </Section>
    </Surface>
  )
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-cladd-fg-softer">{props.title}</span>
      <div className="grid grid-cols-3 gap-1">{props.children}</div>
    </div>
  )
}

function InstanceHeader({ placement }: { placement: SubPartPlacement }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="truncate font-mono text-sm" title={placement.instanceId}>
        {placement.instanceId}
      </span>
      <span className="truncate text-xs text-cladd-fg-softer" title={placement.subPartTemplateId}>
        {placement.subPartTemplateId}
      </span>
    </div>
  )
}
