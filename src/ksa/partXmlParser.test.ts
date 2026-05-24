import { describe, it, expect } from 'vitest'
import { DOMParser } from '@xmldom/xmldom'
import { parsePartPlacements } from './partXmlParser'
import { serializePart } from './partXmlSerializer'
import type { EditingPart } from './types'

const part: EditingPart = {
  partId: 'TestPart',
  editorTags: [],
  placements: [
    {
      instanceId: 'identity_1',
      subPartTemplateId: 'Core.A',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    {
      instanceId: 'b_1',
      subPartTemplateId: 'Core.B',
      position: { x: 0.1427, y: 0, z: -0.0601 },
      rotation: { x: 3.14159, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    {
      instanceId: 'c_1',
      subPartTemplateId: 'Core.C',
      position: { x: -0.02294, y: -0.19896, z: -0.56421 },
      rotation: { x: -0.3876, y: 0.36137, z: 0.71372 },
      scale: { x: 2, y: 2, z: 2 },
    },
  ],
}

describe('parsePartPlacements (round-trip with serializer)', () => {
  const xml = serializePart(part)
  const parsed = parsePartPlacements(xml, 'TestPart', new DOMParser())

  it('recovers every placement', () => {
    expect(parsed.length).toBe(3)
    expect(parsed.map((p) => p.instanceId)).toEqual(['identity_1', 'b_1', 'c_1'])
    expect(parsed.map((p) => p.subPartTemplateId)).toEqual(['Core.A', 'Core.B', 'Core.C'])
  })

  it('recovers transforms within G6 precision', () => {
    const c = parsed[2]
    expect(c.position.x).toBeCloseTo(-0.02294, 5)
    expect(c.position.y).toBeCloseTo(-0.19896, 5)
    expect(c.position.z).toBeCloseTo(-0.56421, 5)
    expect(c.rotation.x).toBeCloseTo(-0.3876, 5)
    expect(c.rotation.y).toBeCloseTo(0.36137, 5)
    expect(c.rotation.z).toBeCloseTo(0.71372, 5)
    expect(c.scale.x).toBeCloseTo(2, 5)
  })

  it('defaults identity placement to zero/one', () => {
    const a = parsed[0]
    expect(a.position).toEqual({ x: 0, y: 0, z: 0 })
    expect(a.rotation).toEqual({ x: 0, y: 0, z: 0 })
    expect(a.scale).toEqual({ x: 1, y: 1, z: 1 })
  })

  it('throws on unknown part id', () => {
    expect(() => parsePartPlacements(xml, 'Nope', new DOMParser())).toThrow()
  })
})
