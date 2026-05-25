# Part XML Serialize / Parse

Flexo exports the edited Part to KSA "Assets" Part XML and can parse a Part back
(used by the coordinate calibration and future import). All XML uses built-in DOM
APIs — `@xmldom/xmldom` (browser-compatible, also runs in node tests); no
third-party XML library.

## Serializer — `src/ksa/partXmlSerializer.ts`

`serializePart(part: EditingPart): string` mirrors space-tape's
`PartXmlSerializer.cs`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Assets>
    <Part Id="...">
        <EditorTag Value="..."/>          <!-- per editorTags -->
        <SubPart Id="instance" InstanceOf="template">
            <Transform>
                <Position X="0.1427" Z="-0.0601"/>
                <Rotation X="3.14159"/>
                <Scale X="2"/>
            </Transform>
        </SubPart>
    </Part>
</Assets>
```

Rules (verified against Core XML + the C# serializer):
- `<Transform>` is **omitted** when position=0 ∧ rotation=0 ∧ scale=1.
- Each of `<Position>/<Rotation>/<Scale>` is omitted when equal to its default
  (0 / 0 / 1) within `EPSILON = 1e-9`.
- Each axis attribute (`X`/`Y`/`Z`) is omitted when equal to the default.
- Rotation is **Euler XYZ radians**.
- Numbers use `formatG6` (see below).
- Built with `DOMImplementation` + `XMLSerializer`, then pretty-printed (4-space
  indent) by a small string pass (safe — no mixed text nodes).

**Out of scope (initial pass):** connectors and GameData are not emitted yet; the
`<Part>` currently carries SubPart placements + editor tags.

## Number formatting — `src/ksa/formatG6.ts`

`formatG6(n)` replicates .NET `double.ToString("G6")`: 6 significant digits, trailing
zeros trimmed, `.NET`-style exponential (`E+NN`) only outside the fixed range
(exponent < -4 or ≥ 6). KSA's serializer uses "G6" for all transform numbers, so this
keeps export byte-compatible. **Never** write raw `toString()`/`toFixed()` into XML.

## Parser — `src/ksa/partXmlParser.ts`

`parsePartPlacements(xmlText, partId, parserImpl?)` is the inverse: finds the
`<Part Id=partId>`, reads each `<SubPart InstanceOf=…>` and its `<Transform>` into
`SubPartPlacement[]` (missing axes default to 0/0/1; rotation in radians). The
optional `parserImpl` lets tests inject `@xmldom/xmldom`'s `DOMParser`; the browser
uses the global `DOMParser`.

## Part catalog & GameData merge — `src/ksa/partCatalog.ts`

The "+ Part" importer builds its catalog from the Core `*Assets.xml` files, but in
KSA's Core data the geometry `<Part>` carries **no** connector `<Flags>` and (mostly)
no `<EditorTag>` — those live in the sibling `*GameData.xml` files under
`<PartGameData Id="…">`. So `loadCorePartCatalog()` also fetches each
`<name>GameData.xml` (derived from the asset filename; missing siblings are skipped
silently) and `mergeGameData()` folds them into each `CatalogPart`:

- connector `<Flags>` (`ToSurface`/`FromSurface`/`Internal`) are applied to the
  matching connector by `Id` (geometry is the source of truth — flags-only
  connectors with no geometry counterpart are ignored);
- `<EditorTag Value="…">` values are unioned into `editorTags`.

`addPart(placements, connectors, editorTags)` then unions the imported editor tags
into the current project. Without this merge the `ToSurface` flag (e.g. on solar
panels) and most editor tags were dropped on import. The vite dev server streams the
GameData files under `/ksa/`; `vite/ksaAssets.ts` copies the existing ones into
`dist/ksa/` for production.

## Export UI

`src/ui/PartHeader.tsx`: a Part-id field (`setPartId`) + an "Export XML" button that
opens a cladd `Dialog` showing `serializePart($part)` with copy-to-clipboard and
pre-export warnings (empty id, duplicate instance ids, no placements).

## Tests
- `partXmlSerializer.test.ts` — transform/axis omission + G6 formatting, round-trip
  parse, XML declaration.
- `formatG6.test.ts` — fixed/exponential cases.
- `partXmlParser.test.ts` — serialize→parse round-trip within G6 precision.
