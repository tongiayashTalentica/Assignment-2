import React from 'react'
import { BaseComponent, ComponentType, DragState } from '@/types'
import { useComponentActions, useDragContext } from '@/store/simple'
import { useCanvasDraggable } from '@/hooks/useDragAndDrop'

interface Props {
  component: BaseComponent
  isSelected: boolean
  onSelect: (id: string) => void
}

export const ComponentRenderer = ({
  component,
  isSelected,
  onSelect,
}: Props) => {
  const { selectComponent, focusComponent } = useComponentActions()
  const dragContext = useDragContext()
  const { id, type, position, dimensions, props } = component

  const dragHandlers = useCanvasDraggable(component)

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
        : '1px solid #e5e7eb',
    borderRadius: (props as any).borderRadius ?? 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: type === ComponentType.TEXTAREA ? 'flex-start' : 'center',
    padding: type === ComponentType.BUTTON ? (props as any).padding : 0,
    overflow: 'hidden',
    background:
      type === ComponentType.BUTTON
        ? (props as any).backgroundColor
        : isDragging
          ? 'rgba(59, 130, 246, 0.1)'
          : 'transparent',
    color: (props as any).color || (props as any).textColor || '#000',
    fontSize: (props as any).fontSize || 16,
    fontWeight: (props as any).fontWeight || 400,
    textAlign: (props as any).textAlign || 'left',
    cursor: isDragging ? 'grabbing' : isSelected ? 'grab' : 'pointer',
    opacity: isDragging ? 0.8 : 1,
    transform: 'scale(1)', // Keep consistent scale, no rotation
    transition: isDragging ? 'none' : 'all 0.2s ease',
    zIndex: isDragging ? 1000 : component.zIndex,
    userSelect: 'none',
    boxShadow: isDragging
      ? '0 8px 25px rgba(0,0,0,0.25)'
      : isSelected
        ? '0 2px 8px rgba(59, 130, 246, 0.3)'
        : 'none',
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Don't handle selection during drag operations
    if (dragContext.state !== 'idle') {
      return
    }

    onSelect(id)
    selectComponent(id)
    focusComponent(id)
  }

  const baseProps = {
    ...dragHandlers, // Put drag handlers FIRST so they take precedence
    style,
    onClick: handleClick,
    'data-testid': `component-${id}`,
    'data-component-id': id,
    'data-draggable': 'canvas',
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
          fontSize: '12px',
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

  // Add drag status indicator - simplified and less intrusive
  const dragStatusIndicator = null // Removed for cleaner experience

  switch (type) {
    case ComponentType.TEXT:
      return (
        <div {...baseProps}>
          {dragStatusIndicator}
          {draggableIndicator}
          {(props as any).content}
        </div>
      )
    case ComponentType.TEXTAREA:
      return (
        <div {...baseProps}>
          {dragStatusIndicator}
          {draggableIndicator}
          <div style={{ whiteSpace: 'pre-wrap', padding: 8, width: '100%' }}>
            {(props as any).content}
          </div>
        </div>
      )
    case ComponentType.IMAGE:
      return (
        <div {...baseProps}>
          {dragStatusIndicator}
          {draggableIndicator}
          <img
            src={(props as any).src}
            alt={(props as any).alt || ''}
            draggable={false} // Explicitly disable native drag
            onDragStart={e => e.preventDefault()} // Prevent any drag events
            style={{
              width: '100%',
              height: '100%',
              objectFit: (props as any).objectFit,
              pointerEvents: 'none', // Prevent image drag interference
              userSelect: 'none', // Prevent selection
            }}
          />
        </div>
      )
    case ComponentType.BUTTON:
      return (
        <div {...baseProps}>
          {dragStatusIndicator}
          {draggableIndicator}
          <a
            href={(props as any).url}
            draggable={false} // Disable native drag
            onDragStart={e => e.preventDefault()} // Prevent drag events
            style={{
              textDecoration: 'none',
              color: 'inherit',
              pointerEvents: isDragging ? 'none' : 'auto',
              userSelect: 'none', // Prevent text selection
            }}
            onClick={e => e.preventDefault()}
          >
            {(props as any).label}
          </a>
        </div>
      )
    default:
      return (
        <div {...baseProps}>
          {dragStatusIndicator}
          {draggableIndicator}
          Unsupported
        </div>
      )
  }
}
