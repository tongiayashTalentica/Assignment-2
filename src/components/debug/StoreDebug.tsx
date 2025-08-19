import React from 'react'
import { useComponents, useDragContext, useCanvas } from '@/store'

export const StoreDebug = () => {
  const components = useComponents()
  const dragContext = useDragContext()
  const canvas = useCanvas()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '300px',
        zIndex: 9999,
      }}
    >
      <div>
        <strong>Debug Info:</strong>
      </div>
      <div>
        Components: {components instanceof Map ? components.size : 'Not a Map'}
      </div>
      <div>Components Type: {typeof components}</div>
      <div>Drag State: {dragContext.state}</div>
      <div>Canvas: {canvas ? 'OK' : 'Missing'}</div>
      <div>
        Store Keys:{' '}
        {Object.keys({ components, dragContext, canvas }).join(', ')}
      </div>
    </div>
  )
}
