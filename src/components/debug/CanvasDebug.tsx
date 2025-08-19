import React from 'react'
import { ComponentType } from '@/types'
import {
  useComponents,
  useComponentActions,
  useDragContext,
  useCanvas,
} from '@/store'
import { ComponentFactory } from '@/utils/componentFactory'

export const CanvasDebug = () => {
  const components = useComponents()
  const dragContext = useDragContext()
  const canvas = useCanvas()
  const { addComponent, removeComponent, clearSelection } =
    useComponentActions()

  const addTestComponent = (type: ComponentType) => {
    const position = {
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
    }

    try {
      const newComponent = ComponentFactory.create(type, position)
      console.log('🧪 DEBUG: Creating component:', newComponent)
      console.log('🧪 DEBUG: Components before add:', components.size)
      addComponent(newComponent)
      console.log('🧪 DEBUG: Components after add:', components.size)
      console.log('🧪 DEBUG: Canvas state:', canvas)
    } catch (error) {
      console.error('🚨 DEBUG: Error adding component:', error)
    }
  }

  const clearAllComponents = () => {
    console.log('🧪 DEBUG: Clearing all components, count:', components.size)
    try {
      // First clear selection to avoid issues
      clearSelection()

      // Get all component IDs and remove them
      const componentIds = Array.from(components.keys())
      console.log('🧪 DEBUG: Removing component IDs:', componentIds)

      componentIds.forEach(id => {
        removeComponent(id)
        console.log('🧪 DEBUG: Removed component:', id)
      })

      console.log('🧪 DEBUG: All components cleared, new count:', 0)
    } catch (error) {
      console.error('🚨 DEBUG: Error clearing components:', error)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 10000,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🧪 Canvas Debug
      </div>
      <div style={{ marginBottom: '8px', fontSize: '10px', lineHeight: '1.3' }}>
        <div>Components: {components.size}</div>
        <div>
          Canvas: {canvas.dimensions.width}x{canvas.dimensions.height}
        </div>
        <div>Drag State: {dragContext.state}</div>
        <div>Map Valid: {components instanceof Map ? '✅' : '❌'}</div>
        {components.size > 0 && (
          <div style={{ marginTop: '4px' }}>
            <div>IDs: {Array.from(components.keys()).join(', ')}</div>
            <div>
              Types:{' '}
              {Array.from(components.values())
                .map((c: any) => c.type)
                .join(', ')}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => addTestComponent(ComponentType.TEXT)}
          style={{ padding: '4px', fontSize: '10px' }}
        >
          Add Text
        </button>
        <button
          onClick={() => addTestComponent(ComponentType.BUTTON)}
          style={{ padding: '4px', fontSize: '10px' }}
        >
          Add Button
        </button>
        <button
          onClick={() => addTestComponent(ComponentType.IMAGE)}
          style={{ padding: '4px', fontSize: '10px' }}
        >
          Add Image
        </button>
        <button
          onClick={clearAllComponents}
          style={{
            padding: '4px',
            fontSize: '10px',
            backgroundColor: '#dc2626',
            color: 'white',
          }}
        >
          Clear All ({components.size})
        </button>
        <div style={{ marginTop: '4px', fontSize: '9px', color: '#888' }}>
          Try: Double-click palette items, drag to canvas, or use buttons above
        </div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '10px' }}>
        Map check: {components instanceof Map ? '✅ Valid Map' : '❌ Not a Map'}
      </div>
    </div>
  )
}
