# Coordinate System & Transforms

All conversion between KSA Part-space transforms (as stored in `$part` / XML) and
three.js `Object3D` transforms is isolated in **`src/three/coords.ts`**. If anything
about placement orientation looks wrong, fix it there — nowhere else does transform
math.

## The mapping (current hypothesis)

glTF/GLB and three.js are both **right-handed, Y-up, meters**. KSA authors SubPart
transforms against the same GLB space, so transforms are applied **directly**:

- `applyPlacement(obj, placement)`: `obj.position.set(x,y,z)`,
  `obj.rotation.set(rx, ry, rz, 'XYZ')`, `obj.scale.set(sx,sy,sz)`.
- `readPlacementTransform(obj)`: inverse — reads position/scale and converts the
  quaternion back to Euler `'XYZ'`.

Rotation is **Euler XYZ in radians** (matches KSA's `quat.ToXyzRadians()` and the XML
`<Rotation>` element). No axis flip is currently applied.

## Calibration (`?debug=dockingport`)

Because the Euler order / handedness is the highest-risk assumption, open the app
with `http://localhost:5173/?debug=dockingport`. This loads the real Core part
`CoreCouplingA_Prefab_DockingPort1WA` from its Part XML (`debugCalibration.ts` +
`partXmlParser.ts`) and renders it.

- **Correct** → it forms a coherent, radially-symmetric docking port.
- **Scrambled** → adjust the Euler order or axis signs in `coords.ts` and document
  what was verified. The `EULER_ORDER` constant and the `.set(..., 'XYZ')` calls are
  the two knobs.

## Why everything routes through coords.ts

The store can hold rotation however is convenient, but export must be Euler XYZ
radians and the 3D view must match the game. Centralizing the conversion means the
serializer ([xml-io.md](./xml-io.md)), the gizmo read-back, and the scene apply all
agree, and a calibration fix lands in exactly one place.

## Related
- Mesh local origins are baked in `MeshAtlasCache` so a SubPart sits at its authored
  origin; the placement transform then positions it. See
  [subpart-catalog.md](./subpart-catalog.md).
