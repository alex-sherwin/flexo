import { useEffect, useRef } from 'react'
import { EditorScene } from './EditorScene'
import { loadDockingPortCalibration } from './debugCalibration'

/**
 * Mounts the three.js {@link EditorScene} (Viewport + store-driven SubPart sync)
 * into a full-size div for its lifetime. Disposes cleanly on unmount (handles
 * React StrictMode's double-invoke in dev).
 */
export function ViewportCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = new EditorScene(host)

    if (new URLSearchParams(window.location.search).get('debug') === 'dockingport') {
      void loadDockingPortCalibration(scene.viewport.scene)
    }

    return () => scene.dispose()
  }, [])

  return <div ref={hostRef} className="absolute inset-0" />
}
