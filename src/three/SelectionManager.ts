import * as THREE from 'three'

/**
 * Click-to-select via raycasting. Selection fires on pointerup only when the
 * pointer barely moved (so camera-orbit drags and gizmo drags don't count as
 * clicks). Resolves the hit mesh's owning SubPart instance id from userData and
 * reports it (null when empty space is clicked).
 */
export class SelectionManager {
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private downX = 0
  private downY = 0
  private suppressed = false

  private readonly camera: THREE.Camera
  private readonly domElement: HTMLElement
  private readonly root: THREE.Object3D
  private readonly onSelect: (instanceId: string | null) => void

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    root: THREE.Object3D,
    onSelect: (instanceId: string | null) => void,
  ) {
    this.camera = camera
    this.domElement = domElement
    this.root = root
    this.onSelect = onSelect
    this.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.domElement.addEventListener('pointerup', this.handlePointerUp)
  }

  /** Suppress selection while a gizmo drag is in progress. */
  setSuppressed(suppressed: boolean): void {
    this.suppressed = suppressed
  }

  private readonly handlePointerDown = (e: PointerEvent): void => {
    this.downX = e.clientX
    this.downY = e.clientY
  }

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (this.suppressed) return
    const moved = Math.hypot(e.clientX - this.downX, e.clientY - this.downY)
    if (moved > 4) return // treat as a drag, not a click

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)

    const hits = this.raycaster.intersectObjects(this.root.children, true)
    for (const hit of hits) {
      const id = findInstanceId(hit.object)
      if (id) {
        this.onSelect(id)
        return
      }
    }
    this.onSelect(null)
  }

  dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.domElement.removeEventListener('pointerup', this.handlePointerUp)
  }
}

function findInstanceId(object: THREE.Object3D): string | null {
  let node: THREE.Object3D | null = object
  while (node) {
    const id = node.userData?.instanceId
    if (typeof id === 'string') return id
    node = node.parent
  }
  return null
}
