import React from 'react'
import { PanelProps, BaseComponent } from '@/types'
import styles from './Panel.module.css'
import canvasStyles from './CanvasPanel.module.css'
import {
  useComponents,
  useSelectedComponents,
  useComponentActions,
  useDragContext,
} from '@/store/simple'
import { ComponentRenderer } from '@/components/ui/ComponentRenderer'
import { useDropTarget } from '@/hooks/useDragAndDrop'

interface CanvasPanelProps extends PanelProps {
  style?: React.CSSProperties
}

export const CanvasPanel = ({
  className,
  children,
  style,
}: CanvasPanelProps) => {
  const components = useComponents()
  const selected = useSelectedComponents()
  const dragContext = useDragContext()
  const { selectComponent, clearSelection, removeComponent } =
    useComponentActions()
  const dropHandlers = useDropTarget()

  const handleBackgroundClick = () => {
    // Only clear selection if not dragging
    if (dragContext?.state === 'idle') {
      clearSelection()
    }
  }

  const clearCanvas = () => {
    Array.from(components.keys()).forEach(id => removeComponent(id, false))
    clearSelection()
  }

  const isDragActive = dragContext?.state !== 'idle'

  const canvasAreaStyle: React.CSSProperties = {
    position: 'relative',
    minHeight: '600px',
    backgroundColor: isDragActive ? '#f8fafc' : '#ffffff',
    border: isDragActive ? '2px dashed #3b82f6' : '1px solid #e5e7eb',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  }

  return (
    <div
      className={`${styles['panel']} ${className || ''}`}
      style={style}
      role="main"
    >
      <div className={styles['panelHeader']}>
        <h2 className={styles['panelTitle']}>Canvas</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isDragActive && (
            <span
              style={{
                fontSize: '12px',
                color: '#059669',
                fontWeight: 500,
              }}
            >
              Drop here
            </span>
          )}
          <button onClick={clearCanvas}>Clear Canvas</button>
        </div>
      </div>
      <div
        className={`${styles['panelContent']} ${canvasStyles['canvasContent']}`}
      >
        {children || (
          <div
            className={canvasStyles['canvasArea']}
            onClick={handleBackgroundClick}
            style={canvasAreaStyle}
            {...dropHandlers}
            data-drop-target="true"
            data-testid="canvas-area"
            data-drag-state={dragContext?.state || 'idle'}
          >
            {components.size === 0 ? (
              <div className={canvasStyles['canvasPlaceholder']}>
                <h3>Design Canvas</h3>
                <p className={styles['placeholderText']}>
                  {isDragActive
                    ? 'Release to drop component here'
                    : 'Drop components here to start building your design'}
                </p>
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
        )}
      </div>
    </div>
  )
}
