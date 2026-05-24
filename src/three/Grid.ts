import * as THREE from 'three'

/**
 * Origin-centered reference grid (XZ plane) plus colored origin axes.
 * Matches KSA's Y-up, meters convention; 1 grid cell = 1 meter.
 */
export function createGrid(size = 10, divisions = 20): THREE.Group {
  const group = new THREE.Group()
  group.name = 'flexo-grid'

  const grid = new THREE.GridHelper(size, divisions, 0x5a5b66, 0x2c2d36)
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.6
  group.add(grid)

  // Origin axes: X=red, Y=green, Z=blue, 1m long.
  const axes = new THREE.AxesHelper(1)
  group.add(axes)

  return group
}
