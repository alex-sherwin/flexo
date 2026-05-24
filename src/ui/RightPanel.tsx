import { useState } from 'react'
import { Button, Tooltip } from '@cladd-ui/react'
import { TransformInspector } from './TransformInspector'
import { PlacementList } from './PlacementList'

/** A panel-with-divided-right-column glyph that reads as an inspector panel. */
function InspectorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  )
}

/**
 * The right-side editor inspector (transform fields + placed-instance list),
 * with a hide/show toggle. When hidden it collapses to a single floating icon
 * button in the top-right so the viewport reads as uncluttered by default.
 */
export function RightPanel() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <div className="absolute right-3 top-3">
        <Tooltip tooltip="Show inspector">
          <Button square rounded variant="solid" onClick={() => setVisible(true)} aria-label="Show inspector">
            <InspectorIcon />
          </Button>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="absolute right-3 top-3 bottom-3 flex w-72 flex-col gap-3">
      <div className="flex justify-end">
        <Tooltip tooltip="Hide inspector">
          <Button square size="sm" variant="solid" onClick={() => setVisible(false)} aria-label="Hide inspector">
            <InspectorIcon />
          </Button>
        </Tooltip>
      </div>
      <TransformInspector />
      <div className="min-h-0 flex-1">
        <PlacementList />
      </div>
    </div>
  )
}
