import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { GridList, GridListItem } from 'react-aria-components'
import { Popover, PopoverRoot, PopoverTrigger, ToolbarButton, useToast } from '@cladd-ui/react'
import { History, MoveRight } from 'lucide-react'
import { $historyList, jumpToHistory, type HistoryListItem } from '../state/editorStore'

/**
 * Toolbar button that opens a popover showing the full undo/redo history as a
 * two-section GridList. Redo entries appear above the current-state marker;
 * undo entries below. Clicking any entry jumps to that point.
 */
export function HistoryButton() {
  const [open, setOpen] = useState(false)
  const historyList = useStore($historyList)
  const toast = useToast()

  const redoItems = historyList.filter((item) => item.stepsFromCurrent > 0)
  const undoItems = historyList.filter((item) => item.stepsFromCurrent < 0)
  const hasHistory = redoItems.length > 0 || undoItems.length > 0

  const handleJump = (item: HistoryListItem) => {
    if (item.stepsFromCurrent === 0) return
    const label = jumpToHistory(item.stepsFromCurrent)
    const prefix = item.stepsFromCurrent < 0 ? 'Undo' : 'Redo'
    toast({ title: `${prefix}: ${label}`, timeout: 1500 })
    setOpen(false)
  }

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <ToolbarButton aria-label="History" disabled={!hasHistory}>
          <History size={16} />
        </ToolbarButton>
      </PopoverTrigger>
      <Popover position="bottom-end" className="w-56 rounded-lg" contentClassName="p-1">
        <div className="flex max-h-80 flex-col overflow-auto">
          {redoItems.length > 0 && (
            <GridList
              aria-label="Redo history"
              selectionMode="none"
              className="flex flex-col gap-0.5 pb-0.5 outline-none"
            >
              {redoItems.map((item) => (
                <HistoryRow
                  key={item.stepsFromCurrent}
                  item={item}
                  label="Redo"
                  onPress={handleJump}
                />
              ))}
            </GridList>
          )}

          {/* Current position marker */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-cladd-primary">
            <MoveRight size={13} className="shrink-0" />
            <span className="text-xs font-semibold">current</span>
            <span className="h-px flex-1 bg-cladd-primary opacity-30" />
          </div>

          {undoItems.length > 0 && (
            <GridList
              aria-label="Undo history"
              selectionMode="none"
              className="flex flex-col gap-0.5 pt-0.5 outline-none"
            >
              {undoItems.map((item) => (
                <HistoryRow
                  key={item.stepsFromCurrent}
                  item={item}
                  label="Undo"
                  onPress={handleJump}
                />
              ))}
            </GridList>
          )}
        </div>
      </Popover>
    </PopoverRoot>
  )
}

function HistoryRow({
  item,
  label,
  onPress,
}: {
  item: HistoryListItem
  label: 'Undo' | 'Redo'
  onPress: (item: HistoryListItem) => void
}) {
  const textValue = item.detail ? `${label}: ${item.description} · ${item.detail}` : `${label}: ${item.description}`
  return (
    <GridListItem
      id={String(item.stepsFromCurrent)}
      textValue={textValue}
      onAction={() => onPress(item)}
      className={({ isFocusVisible }) =>
        [
          'flex cursor-default select-none flex-col gap-0.5 rounded-md px-2 py-1.5 outline-none',
          'hover:bg-cladd-surface-hover',
          isFocusVisible ? 'ring-1 ring-inset ring-cladd-primary' : '',
        ].join(' ')
      }
    >
      <span className="text-xs font-semibold text-cladd-fg">{label}</span>
      <span className="truncate text-xs text-cladd-fg-softer">
        {item.description}{item.detail ? ` · ${item.detail}` : ''}
      </span>
    </GridListItem>
  )
}
