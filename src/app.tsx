import { useEffect } from 'react'
import { ViewportCanvas } from './three/ViewportCanvas'
import { SubPartBrowser } from './ui/SubPartBrowser'
import { PlacementList } from './ui/PlacementList'
import { TransformInspector } from './ui/TransformInspector'
import { EditorToolbar } from './ui/Toolbar'
import { PartHeader } from './ui/PartHeader'
import { ensureCatalogLoaded } from './state/catalogStore'

function App() {
  useEffect(() => {
    void ensureCatalogLoaded()
  }, [])

  return (
    <div className="fixed inset-0 bg-cladd-bg text-cladd-fg">
      <ViewportCanvas />

      {/* Top-center: transform tools / snap / undo */}
      <div className="absolute left-1/2 top-3 -translate-x-1/2">
        <EditorToolbar />
      </div>

      {/* Left: part header + SubPart catalog browser */}
      <div className="absolute left-3 top-3 bottom-3 flex w-72 flex-col gap-3">
        <PartHeader />
        <div className="min-h-0 flex-1">
          <SubPartBrowser />
        </div>
      </div>

      {/* Right: transform inspector + placed instances */}
      <div className="absolute right-3 top-3 bottom-3 flex w-72 flex-col gap-3">
        <TransformInspector />
        <div className="min-h-0 flex-1">
          <PlacementList />
        </div>
      </div>
    </div>
  )
}

export default App
