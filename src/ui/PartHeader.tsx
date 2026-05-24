import { useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import { Button, Dialog, Input, Surface } from '@cladd-ui/react'
import { $part, setPartId } from '../state/editorStore'
import { serializePart } from '../ksa/partXmlSerializer'

/** Returns human-readable warnings about the current part prior to export. */
function validate(partId: string, instanceIds: string[]): string[] {
  const warnings: string[] = []
  if (!partId.trim()) warnings.push('Part Id is empty.')
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const id of instanceIds) {
    if (seen.has(id)) dupes.add(id)
    seen.add(id)
  }
  if (dupes.size > 0) warnings.push(`Duplicate instance ids: ${[...dupes].join(', ')}`)
  if (instanceIds.length === 0) warnings.push('No SubParts placed.')
  return warnings
}

/**
 * Top-left panel: edit the Part Id and export the current Part to KSA XML
 * (shown in a dialog with copy-to-clipboard).
 */
export function PartHeader() {
  const part = useStore($part)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const xml = useMemo(() => (open ? serializePart(part) : ''), [open, part])
  const warnings = useMemo(
    () => validate(part.partId, part.placements.map((p) => p.instanceId)),
    [part],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(xml)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.warn('clipboard write failed', err)
    }
  }

  return (
    <Surface outline className="rounded-xl" contentClassName="flex flex-col gap-2 p-2">
      <div className="px-1 text-xs uppercase tracking-wide text-cladd-fg-softer">Part</div>
      <Input
        size="sm"
        value={part.partId}
        inputClassName="font-mono"
        onChange={(v: string) => setPartId(v)}
        placeholder="part_id"
      />
      <Button size="sm" color="brand" onClick={() => setOpen(true)}>
        Export XML
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Export Part XML"
        className="w-[40rem] max-w-[90vw]"
      >
        <div className="flex flex-col gap-2">
          {warnings.length > 0 && (
            <Surface
              color="yellow"
              variant="solid-fill"
              className="rounded-lg"
              contentClassName="p-2 text-xs"
            >
              {warnings.map((w) => (
                <div key={w}>⚠ {w}</div>
              ))}
            </Surface>
          )}
          <textarea
            readOnly
            value={xml}
            className="h-80 w-full resize-none rounded-lg bg-cladd-bg p-2 font-mono text-xs text-cladd-fg outline-none"
            spellCheck={false}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button size="sm" color="brand" onClick={copy}>
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </Button>
          </div>
        </div>
      </Dialog>
    </Surface>
  )
}
