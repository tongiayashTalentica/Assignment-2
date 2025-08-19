import React, { useState, useCallback, useRef } from 'react'
import { BaseComponent, ComponentType, DragState } from '@/types'
import { useComponentActions, useDragContext } from '@/store'
import { useCanvasDraggable } from '@/hooks/useDragAndDrop'
import { InlineTextEditor } from './InlineTextEditor'

interface Props {
  component: BaseComponent
  isSelected: boolean
  onSelect: (id: string) => void
}

export const ComponentRenderer = React.memo(
  ({ component, isSelected, onSelect }: Props) => {
    const {
      selectComponent,
      focusComponent,
      resizeComponent,
      reorderComponent,
    } = useComponentActions()
    const dragContext = useDragContext()
    const { id, type, position, dimensions, props } = component
    const [isHovered, setIsHovered] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [isTextEditing, setIsTextEditing] = useState(false)
    const componentRef = useRef<HTMLDivElement>(null)

    const dragHandlers = useCanvasDraggable(component)

    // Resize functionality - only for Image components
    const handleResizeStart = useCallback(
      (e: React.MouseEvent, direction: string) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = dimensions.width
        const startHeight = dimensions.height

        const handleMouseMove = (e: MouseEvent) => {
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY

          let newWidth = startWidth
          let newHeight = startHeight

          switch (direction) {
            case 'se': // Southeast - bottom right
              newWidth = Math.max(50, startWidth + deltaX)
              newHeight = Math.max(30, startHeight + deltaY)
              break
            case 'sw': // Southwest - bottom left
              newWidth = Math.max(50, startWidth - deltaX)
              newHeight = Math.max(30, startHeight + deltaY)
              break
            case 'ne': // Northeast - top right
              newWidth = Math.max(50, startWidth + deltaX)
              newHeight = Math.max(30, startHeight - deltaY)
              break
            case 'nw': // Northwest - top left
              newWidth = Math.max(50, startWidth - deltaX)
              newHeight = Math.max(30, startHeight - deltaY)
              break
            case 'e': // East - right
              newWidth = Math.max(50, startWidth + deltaX)
              break
            case 'w': // West - left
              newWidth = Math.max(50, startWidth - deltaX)
              break
            case 's': // South - bottom
              newHeight = Math.max(30, startHeight + deltaY)
              break
            case 'n': // North - top
              newHeight = Math.max(30, startHeight - deltaY)
              break
          }

          resizeComponent(
            id,
            {
              width: newWidth,
              height: newHeight,
              minWidth: 50,
              minHeight: 30,
            },
            false
          ) // Don't add to history during resize
        }

        const handleMouseUp = () => {
          setIsResizing(false)
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
          // Add final state to history
          resizeComponent(
            id,
            {
              width: dimensions.width,
              height: dimensions.height,
              minWidth: 50,
              minHeight: 30,
            },
            true
          )
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      },
      [id, dimensions, resizeComponent]
    )

    // Layer controls
    const bringToFront = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        // Find max z-index and add 1
        reorderComponent(id, component.zIndex + 1)
      },
      [id, component.zIndex, reorderComponent]
    )

    const sendToBack = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        reorderComponent(id, Math.max(0, component.zIndex - 1))
      },
      [id, component.zIndex, reorderComponent]
    )

    const isDragging =
      dragContext?.state === DragState.DRAGGING_CANVAS_COMPONENT &&
      (dragContext.draggedComponent as BaseComponent)?.id === id

    // Use current drag position if dragging, otherwise use component position
    const displayPosition =
      isDragging && dragContext?.currentPosition
        ? dragContext.currentPosition
        : position

    const style: React.CSSProperties = {
      position: 'absolute',
      left: displayPosition.x,
      top: displayPosition.y,
      width: dimensions.width,
      height: dimensions.height,
      outline: isDragging
        ? '2px solid #3b82f6'
        : isSelected
          ? '2px solid #3b82f6'
          : isHovered
            ? '1px solid #3b82f6'
            : '1px solid #e5e7eb',
      borderRadius: (props as any).borderRadius ?? 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: type === ComponentType.TEXTAREA ? 'flex-start' : 'center',
      padding: type === ComponentType.BUTTON ? (props as any).padding : 0,
      overflow: 'visible', // Changed to show resize handles
      // No background set here - each component type will set its own
      color: (props as any).color || (props as any).textColor || '#000',
      fontSize: (props as any).fontSize || 16,
      fontWeight: (props as any).fontWeight || 400,
      textAlign: (props as any).textAlign || 'left',
      cursor: isDragging
        ? 'grabbing'
        : isResizing
          ? 'resize'
          : isSelected || isHovered
            ? 'grab'
            : 'pointer',
      opacity: isDragging ? 0.8 : 1,
      transform: 'scale(1)', // Keep consistent scale, no rotation
      transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
      zIndex: isDragging
        ? 1000
        : isSelected
          ? component.zIndex + 100
          : component.zIndex,
      userSelect: 'none',
      boxShadow: isDragging
        ? '0 8px 25px rgba(0,0,0,0.25)'
        : isSelected
          ? '0 2px 8px rgba(59, 130, 246, 0.3)'
          : isHovered
            ? '0 2px 4px rgba(59, 130, 246, 0.2)'
            : 'none',
    }

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()

      // Don't handle selection during drag operations or text editing
      if (dragContext.state !== 'idle' || isTextEditing) {
        return
      }

      onSelect(id)
      selectComponent(id)
      focusComponent(id)
    }

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()

        // Only enable text editing for text components when not dragging
        if (
          (type === ComponentType.TEXT || type === ComponentType.TEXTAREA) &&
          dragContext.state === 'idle' &&
          !isResizing
        ) {
          setIsTextEditing(true)
        }
      },
      [type, dragContext.state, isResizing]
    )

    const handleMouseEnter = useCallback(() => {
      if (dragContext.state === 'idle') {
        setIsHovered(true)
      }
    }, [dragContext.state])

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false)
    }, [])

    // Resize handles for Image components
    const resizeHandles =
      isSelected && type === ComponentType.IMAGE && !isDragging ? (
        <>
          {/* Corner handles */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              cursor: 'nw-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={e => handleResizeStart(e, 'nw')}
            title="Resize northwest"
          />
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              cursor: 'ne-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={e => handleResizeStart(e, 'ne')}
            title="Resize northeast"
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              cursor: 'sw-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={e => handleResizeStart(e, 'sw')}
            title="Resize southwest"
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              cursor: 'se-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={e => handleResizeStart(e, 'se')}
            title="Resize southeast"
          />

          {/* Edge handles */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '-4px',
              width: '8px',
              height: '16px',
              backgroundColor: '#3b82f6',
              cursor: 'w-resize',
              borderRadius: '2px',
              border: '1px solid white',
              transform: 'translateY(-50%)',
            }}
            onMouseDown={e => handleResizeStart(e, 'w')}
            title="Resize west"
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '-4px',
              width: '8px',
              height: '16px',
              backgroundColor: '#3b82f6',
              cursor: 'e-resize',
              borderRadius: '2px',
              border: '1px solid white',
              transform: 'translateY(-50%)',
            }}
            onMouseDown={e => handleResizeStart(e, 'e')}
            title="Resize east"
          />
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              width: '16px',
              height: '8px',
              backgroundColor: '#3b82f6',
              cursor: 'n-resize',
              borderRadius: '2px',
              border: '1px solid white',
              transform: 'translateX(-50%)',
            }}
            onMouseDown={e => handleResizeStart(e, 'n')}
            title="Resize north"
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              width: '16px',
              height: '8px',
              backgroundColor: '#3b82f6',
              cursor: 's-resize',
              borderRadius: '2px',
              border: '1px solid white',
              transform: 'translateX(-50%)',
            }}
            onMouseDown={e => handleResizeStart(e, 's')}
            title="Resize south"
          />
        </>
      ) : null

    const baseProps = {
      ...dragHandlers, // Put drag handlers FIRST so they take precedence
      ref: componentRef,
      style,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      'data-testid': `component-${id}`,
      'data-component-id': id,
      'data-draggable': 'canvas',
      'data-hovered': isHovered,
      'data-resizing': isResizing,
      draggable: false, // Disable native browser drag
      onDragStart: (e: React.DragEvent) => e.preventDefault(), // Prevent any native drag
    }

    // Add visual feedback for draggable state
    const draggableIndicator =
      isSelected && !isDragging && dragContext.state === DragState.IDLE ? (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: '18px',
            height: '18px',
            backgroundColor: '#3b82f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            cursor: 'grab',
            userSelect: 'none',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
            border: '2px solid white',
          }}
          title="Click and drag to move component"
        >
          ⋮⋮
        </div>
      ) : null

    // Layer controls for selected components
    const layerControls =
      isSelected && !isDragging && dragContext.state === DragState.IDLE ? (
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-8px',
            display: 'flex',
            gap: '2px',
            zIndex: 1001,
          }}
        >
          <button
            onClick={bringToFront}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#059669',
              border: '1px solid white',
              borderRadius: '4px',
              color: 'white',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            title="Bring to front"
          >
            ↑
          </button>
          <button
            onClick={sendToBack}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#f59e0b',
              border: '1px solid white',
              borderRadius: '4px',
              color: 'white',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            title="Send to back"
          >
            ↓
          </button>
        </div>
      ) : null

    // Component info tooltip (only on hover)
    const infoTooltip =
      isHovered && !isDragging ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            zIndex: 1002,
            marginBottom: '4px',
            pointerEvents: 'none',
          }}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)} • {dimensions.width}×
          {dimensions.height} • z:{component.zIndex}
        </div>
      ) : null

    switch (type) {
      case ComponentType.TEXT:
        return (
          <div
            {...baseProps}
            style={{
              ...baseProps.style,
              fontSize: `${(props as any).fontSize || 16}px`,
              fontWeight: (props as any).fontWeight || 400,
              color: (props as any).color || '#000000',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4',
              padding: '4px 8px',
              boxSizing: 'border-box',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              justifyContent: 'flex-start',
              background: isDragging
                ? 'rgba(59, 130, 246, 0.1)'
                : isHovered
                  ? 'rgba(59, 130, 246, 0.05)'
                  : 'transparent',
            }}
          >
            {infoTooltip}
            {draggableIndicator}
            {layerControls}
            {(props as any).content || 'Text'}

            <InlineTextEditor
              component={component}
              isActive={isTextEditing}
              onActivate={() => setIsTextEditing(true)}
              onDeactivate={() => setIsTextEditing(false)}
            />
          </div>
        )
      case ComponentType.TEXTAREA:
        return (
          <div
            {...baseProps}
            style={{
              ...baseProps.style,
              whiteSpace: 'pre-wrap',
              padding: '8px',
              fontSize: `${(props as any).fontSize || 16}px`,
              color: (props as any).color || '#000000',
              textAlign: (props as any).textAlign || 'left',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4',
              overflow: 'auto',
              boxSizing: 'border-box',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              background: isDragging
                ? 'rgba(59, 130, 246, 0.1)'
                : isHovered
                  ? 'rgba(59, 130, 246, 0.05)'
                  : 'transparent',
            }}
          >
            {infoTooltip}
            {draggableIndicator}
            {layerControls}
            {(props as any).content || 'Multiline text'}

            <InlineTextEditor
              component={component}
              isActive={isTextEditing}
              onActivate={() => setIsTextEditing(true)}
              onDeactivate={() => setIsTextEditing(false)}
            />
          </div>
        )
      case ComponentType.IMAGE:
        return (
          <div
            {...baseProps}
            style={{
              ...baseProps.style,
              borderRadius: `${(props as any).borderRadius || 0}px`,
              // Add overlay for drag/hover states
              boxShadow: isDragging
                ? 'inset 0 0 0 2px rgba(59, 130, 246, 0.8)'
                : isHovered
                  ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.5)'
                  : 'none',
              overflow: 'hidden',
            }}
          >
            <img
              src={(props as any).src || 'https://via.placeholder.com/200'}
              alt={(props as any).alt || 'Image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: (props as any).objectFit || 'cover',
                borderRadius: `${(props as any).borderRadius || 0}px`,
                display: 'block',
              }}
            />
            {infoTooltip}
            {draggableIndicator}
            {layerControls}
            {resizeHandles}
          </div>
        )
      case ComponentType.BUTTON:
        return (
          <div
            {...baseProps}
            style={{
              ...baseProps.style,
              backgroundColor: (props as any).backgroundColor || '#1f2937',
              color: (props as any).textColor || '#ffffff',
              fontSize: `${(props as any).fontSize || 16}px`,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 500,
              borderRadius: `${(props as any).borderRadius || 6}px`,
              border: 'none',
              padding: `${(props as any).padding || 12}px`,
              boxSizing: 'border-box',
              cursor: isDragging ? 'grabbing' : 'pointer',
              textDecoration: 'none',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onClick={e => {
              e.preventDefault()

              // Check if user wants to follow the link (cmd/ctrl + click)
              if (e.metaKey || e.ctrlKey) {
                const url = (props as any).url
                if (url && typeof url === 'string') {
                  // Open link in new tab for external URLs
                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    window.open(url, '_blank', 'noopener,noreferrer')
                  } else {
                    // Handle relative URLs
                    window.open(url, '_blank')
                  }
                }
              } else {
                // Normal click - handle component selection
                e.stopPropagation()

                // Don't handle selection during drag operations
                if (dragContext.state !== DragState.IDLE) {
                  return
                }

                onSelect(id)
                selectComponent(id)
                focusComponent(id)
              }
            }}
          >
            {infoTooltip}
            {draggableIndicator}
            {layerControls}
            {(props as any).label || 'Button'}
          </div>
        )
      default:
        return (
          <div {...baseProps}>
            {infoTooltip}
            {draggableIndicator}
            {layerControls}
            Unsupported
          </div>
        )
    }
  }
)
