import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import { ListBox, ListBoxItem, type Selection } from 'react-aria-components'
import { Button, List, ListButton, Surface } from '@cladd-ui/react'
import {
  $part,
  $selectedConnectorIndex,
  $selectedIndices,
  duplicateSelected,
  removeSelected,
  selectConnector,
  setSelectedPlacements,
} from '../state/editorStore'

/**
 * Lists the placed SubPart instances and connectors. The SubPart list is a
 * react-aria ListBox supporting multi-select (click to replace, Ctrl/Cmd to
 * toggle, Shift to range-select), kept in sync with 3D selection via the shared
 * store. Connectors remain a single-select cladd list. Delete / Duplicate act on
 * the current selection (all selected SubParts, or the selected connector).
 */
export function PlacementList() {
  const part = useStore($part)
  const selectedIndices = useStore($selectedIndices)
  const selectedCon = useStore($selectedConnectorIndex)
  const hasSelection = selectedIndices.length > 0 || selectedCon >= 0

  // ListBox items need a stable `id`; SubPart placements key on `instanceId`.
  const items = useMemo(
    () => part.placements.map((placement, index) => ({ id: placement.instanceId, index, placement })),
    [part.placements],
  )
  const indexByInstanceId = useMemo(
    () => new Map(part.placements.map((p, i) => [p.instanceId, i])),
    [part.placements],
  )
  const selectedKeys = useMemo<Selection>(
    () => new Set(selectedIndices.flatMap((i) => (part.placements[i] ? [part.placements[i].instanceId] : []))),
    [selectedIndices, part.placements],
  )

  const onSelectionChange = (keys: Selection) => {
    if (keys === 'all') {
      setSelectedPlacements(part.placements.map((_, i) => i))
      return
    }
    setSelectedPlacements(
      [...keys].flatMap((key) => {
        const i = indexByInstanceId.get(String(key))
        return i == null ? [] : [i]
      }),
    )
  }

  const selectedLabel = selectedIndices.length > 0 ? ` · ${selectedIndices.length} selected` : ''

  return (
    <Surface outline className="flex h-full min-h-0 flex-col rounded-xl" contentClassName="flex min-h-0 flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs uppercase tracking-wide text-cladd-fg-softer">
          Placed ({part.placements.length}){selectedLabel}
        </span>
        <div className="flex gap-1">
          <Button size="xs" disabled={!hasSelection} onClick={() => duplicateSelected()}>
            Duplicate
          </Button>
          <Button size="xs" color="red" disabled={!hasSelection} onClick={() => removeSelected()}>
            Delete
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <ListBox
          aria-label="Placed SubParts"
          selectionMode="multiple"
          selectionBehavior="replace"
          items={items}
          selectedKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
          renderEmptyState={() => (
            <span className="block px-1 py-1 text-sm text-cladd-fg-softer">No SubParts placed</span>
          )}
          className="flex flex-col gap-0.5 outline-none"
        >
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.placement.instanceId}
              className={({ isSelected, isFocusVisible }) =>
                [
                  'flex cursor-default select-none flex-col rounded-md px-2 py-1 outline-none',
                  isSelected
                    ? 'bg-cladd-primary text-cladd-on-primary'
                    : 'text-cladd-fg hover:bg-cladd-surface-hover',
                  isFocusVisible && !isSelected ? 'ring-2 ring-cladd-primary' : '',
                ].join(' ')
              }
            >
              <span className="truncate text-sm">{item.placement.instanceId}</span>
              <span className="truncate text-xs opacity-70">{item.placement.subPartTemplateId}</span>
            </ListBoxItem>
          )}
        </ListBox>

        {part.connectors.length > 0 && (
          <>
            <span className="mt-2 block px-1 text-xs uppercase tracking-wide text-cladd-fg-softer">
              Connectors ({part.connectors.length})
            </span>
            <List>
              {part.connectors.map((c, i) => (
                <ListButton
                  key={c.id}
                  size="sm"
                  selected={i === selectedCon}
                  color="brand"
                  onClick={() => selectConnector(i)}
                  footer={c.flags === 'None' ? 'no flags' : c.flags}
                >
                  <span className="truncate font-mono">{c.id}</span>
                </ListButton>
              ))}
            </List>
          </>
        )}
      </div>
    </Surface>
  )
}
