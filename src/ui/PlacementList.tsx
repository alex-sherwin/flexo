import { useStore } from '@nanostores/react'
import { Button, List, ListButton, ListItem, Surface } from '@cladd-ui/react'
import { $part, $selectedIndex, duplicateSelected, removeSelected, selectPlacement } from '../state/editorStore'

/**
 * Lists the placed SubPart instances. Clicking a row selects it (kept in sync
 * with 3D selection via the shared store). Delete / Duplicate act on the
 * selection.
 */
export function PlacementList() {
  const part = useStore($part)
  const selected = useStore($selectedIndex)

  return (
    <Surface outline className="flex h-full min-h-0 flex-col rounded-xl" contentClassName="flex min-h-0 flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs uppercase tracking-wide text-cladd-fg-softer">
          Placed ({part.placements.length})
        </span>
        <div className="flex gap-1">
          <Button
            size="xs"
            disabled={selected < 0}
            onClick={() => duplicateSelected()}
          >
            Duplicate
          </Button>
          <Button
            size="xs"
            color="red"
            disabled={selected < 0}
            onClick={() => removeSelected()}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <List>
          {part.placements.length === 0 ? (
            <ListItem className="text-cladd-fg-softer">No SubParts placed</ListItem>
          ) : (
            part.placements.map((p, i) => (
              <ListButton
                key={p.instanceId}
                size="sm"
                selected={i === selected}
                color="brand"
                onClick={() => selectPlacement(i)}
                footer={p.subPartTemplateId}
              >
                <span className="truncate">{p.instanceId}</span>
              </ListButton>
            ))
          )}
        </List>
      </div>
    </Surface>
  )
}
