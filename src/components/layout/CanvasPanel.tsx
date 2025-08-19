import React, { useCallback, useRef, useEffect } from 'react'
import { PanelProps, BaseComponent } from '@/types'
import styles from './Panel.module.css'
import canvasStyles from './CanvasPanel.module.css'
import {
  useComponents,
  useSelectedComponents,
  useComponentActions,
  useDragContext,
  useCanvas,
  useCanvasActions,
} from '@/store'
import { ComponentRenderer } from '@/components/ui/ComponentRenderer'
import { useDropTarget } from '@/hooks/useDragAndDrop'

interface CanvasPanelProps extends PanelProps {
  style?: React.CSSProperties
}

export const CanvasPanel = React.memo(
  ({ className, children, style }: CanvasPanelProps) => {
    const components = useComponents()
    const selected = useSelectedComponents()
    const dragContext = useDragContext()
    const canvas = useCanvas()
    const { selectComponent, clearSelection, removeComponent } =
      useComponentActions()
    const { setZoom, updateGrid } = useCanvasActions()
    const dropHandlers = useDropTarget()
    const canvasRef = useRef<HTMLDivElement>(null)

    // Handle keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!selected.length) return

        const selectedComponent = selected[0]

        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault()
            selectComponent(selectedComponent.id, false)
            break
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
            e.preventDefault()
            // Movement handled by existing drag system
            break
          case 'Delete':
          case 'Backspace':
            e.preventDefault()
            selected.forEach((comp: BaseComponent) => removeComponent(comp.id))
            break
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selected, selectComponent, removeComponent])

    const handleBackgroundClick = useCallback(() => {
      // Only clear selection if not dragging
      if (dragContext?.state === 'idle') {
        clearSelection()
      }
    }, [dragContext?.state, clearSelection])

    const clearCanvas = useCallback(() => {
      Array.from(components.keys()).forEach(id => removeComponent(id, false))
      clearSelection()
    }, [components, removeComponent, clearSelection])

    const handleZoomChange = useCallback(
      (newZoom: number) => {
        setZoom(Math.max(0.25, Math.min(3, newZoom)))
      },
      [setZoom]
    )

    const toggleGrid = useCallback(() => {
      updateGrid({ visible: !canvas.grid.visible })
    }, [canvas.grid.visible, updateGrid])

    const toggleSnapToGrid = useCallback(() => {
      updateGrid({ snapToGrid: !canvas.grid.snapToGrid })
    }, [canvas.grid.snapToGrid, updateGrid])

    const isDragActive = dragContext?.state !== 'idle'

    // Grid pattern SVG
    const gridPattern = canvas.grid.visible ? (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.3,
        }}
      >
        <defs>
          <pattern
            id="grid"
            width={canvas.grid.size * canvas.zoom}
            height={canvas.grid.size * canvas.zoom}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${canvas.grid.size * canvas.zoom} 0 L 0 0 0 ${canvas.grid.size * canvas.zoom}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    ) : null

    const canvasAreaStyle: React.CSSProperties = {
      position: 'relative',
      minHeight: `${canvas.dimensions.height}px`,
      width: `${canvas.dimensions.width}px`,
      maxWidth: '100%',
      backgroundColor: isDragActive ? '#f8fafc' : '#ffffff',
      border: isDragActive ? '2px dashed #3b82f6' : '2px solid #e5e7eb',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      overflow: 'hidden',
      transform: `scale(${canvas.zoom})`,
      transformOrigin: 'top left',
      margin: '20px auto',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }

    return (
      <div
        className={`${styles['panel']} ${className || ''}`}
        style={style}
        role="main"
      >
        <div className={styles['panelHeader']}>
          <h2 className={styles['panelTitle']}>Canvas</h2>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Canvas Controls */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                fontSize: '12px',
              }}
            >
              <label>Zoom:</label>
              <select
                value={Math.round(canvas.zoom * 100)}
                onChange={e => handleZoomChange(parseInt(e.target.value) / 100)}
                style={{ padding: '2px 4px', fontSize: '11px' }}
              >
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
                <option value={300}>300%</option>
              </select>
            </div>

            {/* Grid Controls */}
            <button
              onClick={toggleGrid}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: canvas.grid.visible ? '#3b82f6' : '#e5e7eb',
                color: canvas.grid.visible ? 'white' : '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Toggle grid visibility"
            >
              Grid
            </button>

            <button
              onClick={toggleSnapToGrid}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: canvas.grid.snapToGrid ? '#059669' : '#e5e7eb',
                color: canvas.grid.snapToGrid ? 'white' : '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Toggle snap to grid"
            >
              Snap
            </button>

            {isDragActive && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#059669',
                  fontWeight: 500,
                  marginLeft: '8px',
                }}
              >
                Drop here
              </span>
            )}

            <button
              onClick={clearCanvas}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '8px',
              }}
            >
              Clear Canvas
            </button>
          </div>
        </div>
        <div
          className={`${styles['panelContent']} ${canvasStyles['canvasContent']}`}
          style={{ overflow: 'auto', padding: '20px' }}
        >
          {children || (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <div
                ref={canvasRef}
                className={canvasStyles['canvasArea']}
                onClick={handleBackgroundClick}
                style={canvasAreaStyle}
                {...dropHandlers}
                data-drop-target="true"
                data-testid="canvas-area"
                data-drag-state={dragContext?.state || 'idle'}
              >
                {/* Grid Background */}
                {gridPattern}

                {/* Boundary indicators */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                >
                  {/* Canvas boundary guides */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      backgroundColor: '#3b82f6',
                      opacity: isDragActive ? 0.5 : 0,
                      transition: 'opacity 0.2s',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      backgroundColor: '#3b82f6',
                      opacity: isDragActive ? 0.5 : 0,
                      transition: 'opacity 0.2s',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: '#3b82f6',
                      opacity: isDragActive ? 0.5 : 0,
                      transition: 'opacity 0.2s',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: '#3b82f6',
                      opacity: isDragActive ? 0.5 : 0,
                      transition: 'opacity 0.2s',
                    }}
                  />
                </div>

                {/* Canvas Content */}
                {components.size === 0 ? (
                  <div
                    className={canvasStyles['canvasPlaceholder']}
                    style={{ zIndex: 3, position: 'relative' }}
                  >
                    <h3>Design Canvas</h3>
                    <p className={styles['placeholderText']}>
                      {isDragActive
                        ? 'Release to drop component here'
                        : 'Drop components here to start building your design'}
                    </p>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        marginTop: '8px',
                      }}
                    >
                      {canvas.dimensions.width} × {canvas.dimensions.height}px |
                      Zoom: {Math.round(canvas.zoom * 100)}%
                    </div>
                    {isDragActive && (
                      <div
                        className="drop-zone-active"
                        style={{
                          marginTop: '16px',
                          padding: '12px 20px',
                          backgroundColor: '#dbeafe',
                          border: '2px dashed #3b82f6',
                          borderRadius: '12px',
                          color: '#1e40af',
                          fontSize: '14px',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}
                      >
                        🎯 Release to place component here
                      </div>
                    )}
                  </div>
                ) : (
                  Array.from(components.values()).map(component => {
                    // Ensure proper typing since Map values might be inferred as unknown
                    const typedComponent = component as BaseComponent
                    const isSelected = selected.some(
                      (selectedComponent: BaseComponent) =>
                        selectedComponent?.id === typedComponent.id
                    )

                    return (
                      <ComponentRenderer
                        key={typedComponent.id}
                        component={typedComponent}
                        isSelected={isSelected}
                        onSelect={selectComponent}
                      />
                    )
                  })
                )}

                {/* Canvas Info Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    zIndex: 1000,
                    pointerEvents: 'none',
                  }}
                >
                  {components.size} components | {canvas.dimensions.width}×
                  {canvas.dimensions.height}px
                </div>

                {/* Performance indicator during drag operations */}
                {isDragActive && dragContext?.performanceData && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      zIndex: 1000,
                      pointerEvents: 'none',
                    }}
                  >
                    FPS:{' '}
                    {dragContext.performanceData.averageFrameTime > 0
                      ? Math.round(
                          1000 / dragContext.performanceData.averageFrameTime
                        )
                      : 0}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)
