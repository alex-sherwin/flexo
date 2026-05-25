import { useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  Button,
  Toolbar as CladdToolbar,
  Dialog,
  Popover,
  PopoverRoot,
  PopoverTrigger,
} from '@cladd-ui/react'
import { Layers } from 'lucide-react'
import {
  $part,
  $selectedIndices,
  moveSelectedPlacementsToLayer,
  removeSelected,
} from '../state/editorStore'
import { $hasMultiSelection } from '../state/selectors'
import { CONNECTOR_LAYER_ID } from '../ksa/types'

/**
 * Floating toolbar stacked beneath {@link SelectionToolbar}, shown only when more
 * than one entity is selected. Holds actions that are specific to a multi-selection
 * (bulk layer move, bulk delete) and act on the whole selection at once. New
 * multi-select-only actions belong here.
 */
export function MultiSelectToolbar() {
  const hasMultiSelection = useStore($hasMultiSelection)
  const count = useStore($selectedIndices).length

  if (!hasMultiSelection) return null

  return (
    <CladdToolbar size="sm">
      <ChangeLayerButton />
      <DeleteAllButton count={count} />
    </CladdToolbar>
  )
}

/** "Change Layer" popover: picks a destination layer for the whole selection. */
function ChangeLayerButton() {
  const part = useStore($part)
  const [open, setOpen] = useState(false)
  // SubParts never belong to the built-in Connectors layer.
  const layers = part.layers.filter((l) => l.id !== CONNECTOR_LAYER_ID)

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button size="sm">
          <Layers className="size-4" />
          Change Layer
        </Button>
      </PopoverTrigger>
      <Popover position="bottom-start" className="w-48 rounded-lg" contentClassName="p-1">
        <div className="flex flex-col gap-0.5">
          {layers.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant="transparent"
              className="justify-start"
              onClick={() => {
                moveSelectedPlacementsToLayer(l.id)
                setOpen(false)
              }}
            >
              {l.name}
            </Button>
          ))}
        </div>
      </Popover>
    </PopoverRoot>
  )
}

/** "Delete All (N)" with a confirm dialog; clears the selection on confirm. */
function DeleteAllButton({ count }: { count: number }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <Button size="sm" color="red" onClick={() => setConfirmDelete(true)}>
        Delete All ({count})
      </Button>

      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(false)
        }}
        title="Delete SubParts"
        text={`Delete all ${count} selected SubParts?`}
        cancelButtonText="Cancel"
        confirmButtonText="Delete All"
        confirmButtonColor="red"
        onConfirm={() => {
          removeSelected()
          setConfirmDelete(false)
        }}
      />
    </>
  )
}
