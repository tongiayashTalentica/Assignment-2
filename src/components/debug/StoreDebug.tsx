import React, { useState, useEffect } from 'react'
import { useComponents, useDragContext, useCanvas } from '@/store'

export const StoreDebug = () => {
  const [isVisible, setIsVisible] = useState(false)
  const components = useComponents()
  const dragContext = useDragContext()
  const canvas = useCanvas()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle debug panel with Ctrl+Shift+D (or Cmd+Shift+D on Mac)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === 'D'
      ) {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontFamily: 'monospace',
          zIndex: 9999,
          cursor: 'pointer',
          opacity: 0.7,
          transition: 'opacity 0.2s ease',
        }}
        onClick={() => setIsVisible(true)}
        title="Click or press Ctrl+Shift+D to show debug info"
      >
        🐛
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '8px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxWidth: '250px',
        zIndex: 9999,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        <strong style={{ fontSize: '12px' }}>Debug</strong>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0',
            fontSize: '14px',
            opacity: 0.7,
          }}
          title="Hide debug panel"
        >
          ×
        </button>
      </div>
      <div>Components: {components instanceof Map ? components.size : 0}</div>
      <div>Drag: {dragContext.state}</div>
      <div>Canvas: {canvas ? 'OK' : 'None'}</div>
    </div>
  )
}
