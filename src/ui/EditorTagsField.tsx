import { useMemo, useState } from 'react'
import { Chip, CloseIcon, Input, List, ListButton } from '@cladd-ui/react'
import { KNOWN_EDITOR_TAGS } from '../ksa/types'

/**
 * Editor-tag combobox for the Part Data dialog: an autocomplete input over the
 * KSA {@link KNOWN_EDITOR_TAGS}, plus removable chips for the current tags.
 * Typing filters the known tags; if the typed text matches none, it can still be
 * added verbatim (KSA accepts arbitrary tag strings), so custom tags are allowed.
 */
export function EditorTagsField({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)

  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }
  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const query = draft.trim().toLowerCase()
  const suggestions = useMemo(
    () =>
      KNOWN_EDITOR_TAGS.filter(
        (t) => !tags.includes(t) && (query === '' || t.toLowerCase().includes(query)),
      ),
    [query, tags],
  )
  const showCustom =
    query !== '' &&
    !tags.some((t) => t.toLowerCase() === query) &&
    !KNOWN_EDITOR_TAGS.some((t) => t.toLowerCase() === query)

  return (
    <div className="mt-2 flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Chip
              key={tag}
              size="sm"
              as="button"
              clickable
              icon={CloseIcon}
              onClick={() => removeTag(tag)}
              title={`Remove ${tag}`}
            >
              {tag}
            </Chip>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          size="sm"
          value={draft}
          onChange={setDraft}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag(draft)
            }
          }}
          placeholder="Add tag…"
        />
        {focused && (showCustom || suggestions.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-cladd-outline bg-cladd-bg">
            <List>
              {showCustom && (
                <ListButton
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTag(draft)}
                >
                  Add “{draft.trim()}”
                </ListButton>
              )}
              {suggestions.map((t) => (
                <ListButton
                  key={t}
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTag(t)}
                >
                  {t}
                </ListButton>
              ))}
            </List>
          </div>
        )}
      </div>
    </div>
  )
}
