import { describe, it, expect } from 'vitest'
import { DOMParser } from '@xmldom/xmldom'
import type { Document as XmlDocument, Element as XmlElement } from '@xmldom/xmldom'
import { serializePart } from './partXmlSerializer'
import type { EditingPart, SubPartPlacement } from './types'
import { EULER_ZERO, VEC3_ONE, VEC3_ZERO } from './types'

function placement(p: Partial<SubPartPlacement>): SubPartPlacement {
  return {
    instanceId: 'x',
    subPartTemplateId: 'T',
    position: { ...VEC3_ZERO },
    rotation: { ...EULER_ZERO },
    scale: { ...VEC3_ONE },
    ...p,
  }
}

function parse(xml: string): XmlDocument {
  return new DOMParser().parseFromString(xml, 'application/xml')
}

function tags(parent: XmlDocument | XmlElement, tag: string): XmlElement[] {
  return Array.from(parent.getElementsByTagName(tag))
}

function subPartById(doc: XmlDocument, id: string): XmlElement {
  const el = tags(doc, 'SubPart').find((e) => e.getAttribute('Id') === id)
  if (!el) throw new Error(`SubPart not found: ${id}`)
  return el
}

/** First descendant element with the given tag, or null. */
function child(el: XmlElement, tag: string): XmlElement | null {
  return el.getElementsByTagName(tag)[0] ?? null
}

describe('serializePart', () => {
  // Reconstructed from CoreCouplingAAssets.xml's CoreCouplingA_Prefab_DockingPort1WA
  // (the calibration part). Asserts transform/axis omission + G6 formatting.
  const part: EditingPart = {
    partId: 'CoreCouplingA_Prefab_DockingPort1WA',
    editorTags: [],
    placements: [
      placement({
        instanceId: 'identity_1',
        subPartTemplateId: 'CoreCouplingA_Subpart_InteriorTunnelA',
      }),
      placement({
        instanceId: 'CoreCouplingA_Subpart_GuideRingA1',
        subPartTemplateId: 'CoreCouplingA_Subpart_GuideRingA',
        position: { x: 0.1427, y: 0, z: -0.0601 },
      }),
      placement({
        instanceId: 'CoreCouplingA_Subpart_LatchHousingA4',
        subPartTemplateId: 'CoreCouplingA_Subpart_LatchHousingA',
        position: { x: 0, y: 0, z: 0.4731 },
        rotation: { x: 3.14159, y: 0, z: 0 },
      }),
      placement({
        instanceId: 'CoreCouplingA_Subpart_ActuatorMergedA1',
        subPartTemplateId: 'CoreCouplingA_Subpart_ActuatorMergedA',
        position: { x: -0.02294, y: -0.19896, z: -0.56421 },
        rotation: { x: -0.3876, y: 0.36137, z: 0.71372 },
      }),
    ],
  }

  const xml = serializePart(part)
  const doc = parse(xml)

  it('produces a valid, parseable Assets/Part document', () => {
    expect(tags(doc, 'parsererror').length).toBe(0)
    const partEl = tags(doc, 'Part')[0]
    expect(partEl.getAttribute('Id')).toBe('CoreCouplingA_Prefab_DockingPort1WA')
    expect(tags(doc, 'SubPart').length).toBe(4)
  })

  it('omits <Transform> for an identity placement', () => {
    const sp = subPartById(doc, 'identity_1')
    expect(sp.getAttribute('InstanceOf')).toBe('CoreCouplingA_Subpart_InteriorTunnelA')
    expect(child(sp, 'Transform')).toBeNull()
  })

  it('emits position-only transform and omits zero axes', () => {
    const sp = subPartById(doc, 'CoreCouplingA_Subpart_GuideRingA1')
    const pos = child(sp, 'Position')!
    expect(pos.getAttribute('X')).toBe('0.1427')
    expect(pos.getAttribute('Z')).toBe('-0.0601')
    expect(pos.hasAttribute('Y')).toBe(false)
    expect(child(sp, 'Rotation')).toBeNull()
    expect(child(sp, 'Scale')).toBeNull()
  })

  it('emits rotation in radians alongside position', () => {
    const sp = subPartById(doc, 'CoreCouplingA_Subpart_LatchHousingA4')
    expect(child(sp, 'Position')!.getAttribute('Z')).toBe('0.4731')
    const rot = child(sp, 'Rotation')!
    expect(rot.getAttribute('X')).toBe('3.14159')
    expect(rot.hasAttribute('Y')).toBe(false)
    expect(rot.hasAttribute('Z')).toBe(false)
  })

  it('emits all axes for a fully-transformed placement', () => {
    const sp = subPartById(doc, 'CoreCouplingA_Subpart_ActuatorMergedA1')
    const pos = child(sp, 'Position')!
    expect(pos.getAttribute('X')).toBe('-0.02294')
    expect(pos.getAttribute('Y')).toBe('-0.19896')
    expect(pos.getAttribute('Z')).toBe('-0.56421')
    const rot = child(sp, 'Rotation')!
    expect(rot.getAttribute('X')).toBe('-0.3876')
    expect(rot.getAttribute('Y')).toBe('0.36137')
    expect(rot.getAttribute('Z')).toBe('0.71372')
  })

  it('includes the XML declaration', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true)
  })
})
