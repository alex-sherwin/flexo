import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom'
import type { Document as XmlDocument, Element as XmlElement } from '@xmldom/xmldom'
import type { EditingPart, EulerXYZ, SubPartPlacement, Vec3 } from './types'
import { formatG6 } from './formatG6'

/**
 * Serializes an EditingPart to KSA "Assets" Part XML, mirroring the rules in
 * space-tape's PartXmlSerializer.cs:
 *  - <Transform> omitted entirely when position=0, rotation=0, scale=1.
 *  - Each of <Position>/<Rotation>/<Scale> omitted when equal to its default
 *    (0 / 0 / 1) within EPSILON.
 *  - Each axis attribute omitted when equal to the default.
 *  - Numbers formatted with .NET "G6" semantics (see formatG6).
 *  - Rotation is stored as Euler XYZ radians.
 *
 * XML is built with @xmldom/xmldom's DOMImplementation/XMLSerializer (browser-
 * compatible, also runs in node tests), then pretty-printed with 4-space
 * indentation to match the Core XML style.
 *
 * NOTE: Connectors / GameData are out of scope for the initial pass (see the
 * plan's Phase 9). The <Part> currently emits SubPart placements + EditorTags.
 */

const EPSILON = 1e-9

export function serializePart(part: EditingPart): string {
  const doc = new DOMImplementation().createDocument(null, 'Assets', null)
  const assets = doc.documentElement! // 'Assets' root, created above
  const partEl = doc.createElement('Part')
  partEl.setAttribute('Id', part.partId)

  for (const tag of part.editorTags) {
    if (!tag.trim()) continue
    const el = doc.createElement('EditorTag')
    el.setAttribute('Value', tag)
    partEl.appendChild(el)
  }

  for (const placement of part.placements) {
    partEl.appendChild(buildSubPartElement(doc, placement))
  }

  assets.appendChild(partEl)

  const body = new XMLSerializer().serializeToString(doc)
  return '<?xml version="1.0" encoding="utf-8"?>\n' + prettyXml(body) + '\n'
}

function buildSubPartElement(doc: XmlDocument, placement: SubPartPlacement): XmlElement {
  const el = doc.createElement('SubPart')
  el.setAttribute('Id', placement.instanceId)
  el.setAttribute('InstanceOf', placement.subPartTemplateId)
  const transform = buildTransformElement(doc, placement)
  if (transform) el.appendChild(transform)
  return el
}

/** Returns a <Transform> element, or null if the placement is identity. */
function buildTransformElement(doc: XmlDocument, placement: SubPartPlacement): XmlElement | null {
  const pos = buildVectorElement(doc, 'Position', placement.position, 0)
  const rot = buildRotationElement(doc, placement.rotation)
  const scale = buildVectorElement(doc, 'Scale', placement.scale, 1)

  if (!pos && !rot && !scale) return null

  const transform = doc.createElement('Transform')
  if (pos) transform.appendChild(pos)
  if (rot) transform.appendChild(rot)
  if (scale) transform.appendChild(scale)
  return transform
}

/** Builds e.g. <Position X="1.5" Z="-0.5"/>, omitting axes equal to `def`. */
function buildVectorElement(
  doc: XmlDocument,
  name: string,
  v: Vec3,
  def: number,
): XmlElement | null {
  const xDiff = Math.abs(v.x - def) > EPSILON
  const yDiff = Math.abs(v.y - def) > EPSILON
  const zDiff = Math.abs(v.z - def) > EPSILON
  if (!xDiff && !yDiff && !zDiff) return null

  const el = doc.createElement(name)
  if (xDiff) el.setAttribute('X', formatG6(v.x))
  if (yDiff) el.setAttribute('Y', formatG6(v.y))
  if (zDiff) el.setAttribute('Z', formatG6(v.z))
  return el
}

/** Rotation is exported as Euler XYZ radians; default is 0 on every axis. */
function buildRotationElement(doc: XmlDocument, rot: EulerXYZ): XmlElement | null {
  return buildVectorElement(doc, 'Rotation', rot, 0)
}

/**
 * Re-indents the flat XMLSerializer output with 4-space indentation. Safe here
 * because the document contains only elements/attributes (no mixed text nodes).
 */
function prettyXml(xml: string): string {
  const lines = xml.replace(/></g, '>\n<').split('\n')
  const out: string[] = []
  let depth = 0
  for (const line of lines) {
    const isClosing = /^<\//.test(line)
    if (isClosing) depth = Math.max(0, depth - 1)
    out.push('    '.repeat(depth) + line)
    const isOpening =
      /^<[^/!?]/.test(line) && !/\/>$/.test(line) && !/<\/[^>]+>$/.test(line)
    if (isOpening) depth++
  }
  return out.join('\n')
}
