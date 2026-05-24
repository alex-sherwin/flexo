import { useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import { List, ListButton, ListItem, SearchField, Surface } from '@cladd-ui/react'
import { $catalog, $catalogLoading } from '../state/catalogStore'
import { addSubPart } from '../state/editorStore'

const MAX_RESULTS = 200

/**
 * Filterable catalog browser. Clicking a SubPart adds it to the workspace at the
 * origin (and selects it). Results are capped to keep the list responsive.
 */
export function SubPartBrowser() {
  const catalog = useStore($catalog)
  const loading = useStore($catalogLoading)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q ? catalog.filter((s) => s.id.toLowerCase().includes(q)) : catalog
    return matches.slice(0, MAX_RESULTS)
  }, [catalog, query])

  return (
    <Surface outline className="flex h-full min-h-0 flex-col rounded-xl" contentClassName="flex min-h-0 flex-col">
      <Surface className="rounded-t-xl" contentClassName="p-1.5" outline>
        <SearchField
          size="sm"
          value={query}
          onChange={setQuery}
          placeholder="Search SubParts"
        />
      </Surface>
      <div className="min-h-0 flex-1 overflow-auto">
        <List>
          {loading ? (
            <ListItem className="text-cladd-fg-softer">Loading catalog…</ListItem>
          ) : filtered.length === 0 ? (
            <ListItem className="text-cladd-fg-softer">No matches</ListItem>
          ) : (
            filtered.map((s) => (
              <ListButton
                key={s.id}
                size="sm"
                onClick={() => addSubPart(s.id)}
                title={s.id}
              >
                <span className="truncate">{s.id}</span>
              </ListButton>
            ))
          )}
        </List>
      </div>
    </Surface>
  )
}
