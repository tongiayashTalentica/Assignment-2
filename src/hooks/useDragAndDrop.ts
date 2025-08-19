import { useEffect, useCallback } from 'react'
import {
  useDragContext,
  useUIActions,
  useComponentActions,
  useCanvas,
} from '@/store'
import { DragState, ComponentType, BaseComponent, Position } from '@/types'
import { ComponentFactory } from '@/utils/componentFactory'

/**
 * Simplified drag-and-drop hook with clean state management
 */
export const useDragAndDrop = () => {
  const dragContext = useDragContext()
  const { startDrag, updateDrag, endDrag } = useUIActions()
  const { addComponent, moveComponent, selectComponent } = useComponentActions()
  const canvas = useCanvas()

  // Constrain position within canvas boundaries
  const constrainPosition = useCallback(
    (
      position: Position,
      componentDimensions?: { width: number; height: number }
    ): Position => {
      const { boundaries } = canvas
      const width = componentDimensions?.width || 100
      const height = componentDimensions?.height || 50

      return {
        x: Math.max(
          boundaries.minX,
          Math.min(boundaries.maxX - width, position.x)
        ),
        y: Math.max(
          boundaries.minY,
          Math.min(boundaries.maxY - height, position.y)
        ),
      }
    },
    [canvas]
  )

  // Palette drag visual feedback
  useEffect(() => {
    if (dragContext.state !== DragState.DRAGGING_FROM_PALETTE) return

    let dragPreview: HTMLElement | null = null

    const createDragPreview = (componentType: ComponentType) => {
      const preview = document.createElement('div')
      preview.className = 'drag-preview'
      preview.style.cssText = `
        position: fixed;
        top: -1000px;
        left: -1000px;
        z-index: 10000;
        pointer-events: none;
        background: rgba(59, 130, 246, 0.95);
        border: 2px solid #2563eb;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 600;
        color: white;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        backdrop-filter: blur(8px);
        user-select: none;
        white-space: nowrap;
      `

      // Add component type label with emojis
      const typeLabels = {
        [ComponentType.TEXT]: '📝 Text Component',
        [ComponentType.TEXTAREA]: '📄 Text Area',
        [ComponentType.IMAGE]: '🖼️ Image Component',
        [ComponentType.BUTTON]: '🔘 Button Component',
      }

      preview.textContent = typeLabels[componentType] || 'Component'
      document.body.appendChild(preview)
      return preview
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragPreview) {
        const componentType = dragContext.draggedComponent as ComponentType
        dragPreview = createDragPreview(componentType)
      }

      // Position preview near cursor with slight offset
      if (dragPreview) {
        dragPreview.style.left = `${event.clientX + 15}px`
        dragPreview.style.top = `${event.clientY - 10}px`
      }
    }

    const handleMouseUp = () => {
      if (dragPreview) {
        dragPreview.remove()
        dragPreview = null
      }
    }

    // Set custom cursor for palette drag
    document.body.style.cursor = 'grabbing'

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })

    return () => {
      document.body.style.cursor = ''

      if (dragPreview) {
        dragPreview.remove()
        dragPreview = null
      }

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragContext.state, dragContext.draggedComponent])

  // Canvas component drag handling
  useEffect(() => {
    if (dragContext.state !== DragState.DRAGGING_CANVAS_COMPONENT) return

    let animationFrameId: number | null = null

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault()

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = requestAnimationFrame(() => {
        const draggedComponent = dragContext.draggedComponent as BaseComponent
        if (!draggedComponent || !dragContext.dragOffset) return

        const canvasElement = document.querySelector(
          '[data-drop-target="true"]'
        ) as HTMLElement
        if (!canvasElement) return

        const canvasRect = canvasElement.getBoundingClientRect()
        const newPosition = {
          x: event.clientX - canvasRect.left - dragContext.dragOffset.x,
          y: event.clientY - canvasRect.top - dragContext.dragOffset.y,
        }

        const constrainedPosition = constrainPosition(
          newPosition,
          draggedComponent.dimensions
        )

        updateDrag({
          currentPosition: constrainedPosition,
          isDragValid: true,
        })
      })
    }

    const handleMouseUp = (event: MouseEvent) => {
      event.preventDefault()

      const draggedComponent = dragContext.draggedComponent as BaseComponent
      if (draggedComponent && dragContext.currentPosition) {
        // Move the component to its final position
        moveComponent(draggedComponent.id, dragContext.currentPosition)
      }

      endDrag()
    }

    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'

    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp, { passive: false })

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    dragContext.state,
    dragContext.draggedComponent,
    dragContext.dragOffset,
    dragContext.currentPosition,
    updateDrag,
    endDrag,
    moveComponent,
    constrainPosition,
  ])

  /**
   * Start palette drag - simple implementation
   */
  const startPaletteDrag = useCallback(
    (
      componentType: ComponentType,
      event: React.MouseEvent | React.TouchEvent
    ) => {
      console.log('🎯 DEBUG: Starting palette drag for', componentType)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _event = event
      startDrag({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: componentType,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
      console.log(
        '🎯 DEBUG: Palette drag started, state should be:',
        DragState.DRAGGING_FROM_PALETTE
      )
    },
    [startDrag]
  )

  /**
   * Start canvas component drag - simple implementation
   */
  const startCanvasDrag = useCallback(
    (
      component: BaseComponent,
      event: React.MouseEvent | React.TouchEvent,
      dragOffset: Position = { x: 0, y: 0 }
    ) => {
      startDrag({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: component,
        startPosition: component.position,
        currentPosition: component.position,
        dragOffset,
        isDragValid: true,
      })
    },
    [startDrag]
  )

  /**
   * Handle drop operations - simple implementation
   */
  const handleDrop = useCallback(
    (dropEvent: { clientX: number; clientY: number; canvasRect?: DOMRect }) => {
      console.log('🎯 DEBUG: handleDrop called', {
        dragState: dragContext.state,
        dropEvent,
        draggedComponent: dragContext.draggedComponent,
      })

      if (dragContext.state === DragState.IDLE) {
        console.log('🎯 DEBUG: Drag state is IDLE, ignoring drop')
        return
      }

      try {
        if (dragContext.state === DragState.DRAGGING_FROM_PALETTE) {
          console.log('🎯 DEBUG: Processing palette drop')
          // Create new component from palette
          const componentType = dragContext.draggedComponent as ComponentType
          if (componentType && dropEvent.canvasRect) {
            const canvasPosition = {
              x: dropEvent.clientX - dropEvent.canvasRect.left,
              y: dropEvent.clientY - dropEvent.canvasRect.top,
            }
            console.log('🎯 DEBUG: Canvas position calculated:', canvasPosition)

            const constrainedPosition = constrainPosition(canvasPosition)
            console.log('🎯 DEBUG: Constrained position:', constrainedPosition)

            const newComponent = ComponentFactory.create(
              componentType,
              constrainedPosition
            )
            console.log('🎯 DEBUG: Created component:', newComponent)

            addComponent(newComponent)
            selectComponent(newComponent.id)
            console.log('🎯 DEBUG: Component added and selected')
          } else {
            console.log('🚨 DEBUG: Missing componentType or canvasRect:', {
              componentType,
              canvasRect: dropEvent.canvasRect,
            })
          }
        }
        // Canvas component drops are handled by the useEffect above
      } catch (error) {
        console.error('🚨 DEBUG: Error in handleDrop:', error)
      } finally {
        if (dragContext.state === DragState.DRAGGING_FROM_PALETTE) {
          console.log('🎯 DEBUG: Ending drag')
          endDrag()
        }
      }
    },
    [dragContext, addComponent, selectComponent, endDrag, constrainPosition]
  )

  /**
   * Cancel current drag operation
   */
  const cancelDrag = useCallback(() => {
    endDrag()
  }, [endDrag])

  /**
   * Check if a position is a valid drop target
   */
  const isValidDropTarget = useCallback(
    (position: Position): boolean => {
      const { boundaries } = canvas
      return (
        position.x >= boundaries.minX &&
        position.x <= boundaries.maxX &&
        position.y >= boundaries.minY &&
        position.y <= boundaries.maxY
      )
    },
    [canvas]
  )

  return {
    // State
    dragContext,
    isDragging: dragContext.state !== DragState.IDLE,
    dragState: dragContext.state,

    // Actions
    startPaletteDrag,
    startCanvasDrag,
    handleDrop,
    cancelDrag,
    isValidDropTarget,
    constrainPosition,

    // Utilities
    performanceData: dragContext.performanceData,
  }
}

/**
 * Simple palette draggable hook
 */
export const usePaletteDraggable = (componentType: ComponentType) => {
  const { startPaletteDrag } = useDragAndDrop()

  return {
    onMouseDown: (event: React.MouseEvent) => {
      console.log(
        '🎯 DEBUG: usePaletteDraggable onMouseDown for',
        componentType
      )
      event.preventDefault()
      event.stopPropagation()
      startPaletteDrag(componentType, event)
    },
    onTouchStart: (event: React.TouchEvent) => {
      console.log(
        '🎯 DEBUG: usePaletteDraggable onTouchStart for',
        componentType
      )
      event.preventDefault()
      event.stopPropagation()
      startPaletteDrag(componentType, event)
    },
    draggable: false,
    onDragStart: (e: React.DragEvent) => {
      console.log('🎯 DEBUG: usePaletteDraggable onDragStart (prevented)')
      e.preventDefault()
    },
    'data-draggable': 'palette',
    'data-component-type': componentType,
  }
}

/**
 * Simple canvas component draggable hook
 */
export const useCanvasDraggable = (component: BaseComponent) => {
  const { startCanvasDrag } = useDragAndDrop()

  return {
    onMouseDown: (event: React.MouseEvent) => {
      if (event.button !== 0) return // Only left mouse button

      event.preventDefault()
      event.stopPropagation()

      // Calculate drag offset
      const componentElement = event.currentTarget as HTMLElement
      const componentRect = componentElement.getBoundingClientRect()
      const canvasElement = componentElement.closest(
        '[data-drop-target="true"]'
      ) as HTMLElement

      if (canvasElement) {
        // const _canvasRect = canvasElement.getBoundingClientRect()
        const dragOffset = {
          x: event.clientX - componentRect.left,
          y: event.clientY - componentRect.top,
        }

        startCanvasDrag(component, event, dragOffset)
      }
    },
    onTouchStart: (event: React.TouchEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const touch = event.touches[0]
      if (touch) {
        const componentElement = event.currentTarget as HTMLElement
        const componentRect = componentElement.getBoundingClientRect()
        const canvasElement = componentElement.closest(
          '[data-drop-target="true"]'
        ) as HTMLElement

        if (canvasElement) {
          const dragOffset = {
            x: touch.clientX - componentRect.left,
            y: touch.clientY - componentRect.top,
          }

          startCanvasDrag(component, event, dragOffset)
        }
      }
    },
    draggable: false,
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    'data-draggable': 'canvas',
    'data-component-id': component.id,
  }
}

/**
 * Simple drop target hook - only handles palette drops
 */
export const useDropTarget = () => {
  const { handleDrop, isValidDropTarget, dragState } = useDragAndDrop()

  return {
    onMouseUp: (event: React.MouseEvent) => {
      console.log('🎯 DEBUG: useDropTarget onMouseUp', { dragState })

      if (dragState !== DragState.DRAGGING_FROM_PALETTE) {
        console.log('🎯 DEBUG: Not in DRAGGING_FROM_PALETTE state, ignoring')
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const canvasElement = event.currentTarget as HTMLElement
      const canvasRect = canvasElement.getBoundingClientRect()

      const dropPosition = {
        x: event.clientX - canvasRect.left,
        y: event.clientY - canvasRect.top,
      }

      console.log('🎯 DEBUG: Drop position calculated:', dropPosition)
      console.log('🎯 DEBUG: Canvas rect:', canvasRect)

      if (isValidDropTarget(dropPosition)) {
        console.log('🎯 DEBUG: Drop position is valid, calling handleDrop')
        handleDrop({
          clientX: event.clientX,
          clientY: event.clientY,
          canvasRect,
        })
      } else {
        console.log('🚨 DEBUG: Drop position is not valid')
      }
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (dragState !== DragState.DRAGGING_FROM_PALETTE) return

      event.preventDefault()
      event.stopPropagation()

      const touch = event.changedTouches[0]
      if (touch) {
        const canvasElement = event.currentTarget as HTMLElement
        const canvasRect = canvasElement.getBoundingClientRect()

        const dropPosition = {
          x: touch.clientX - canvasRect.left,
          y: touch.clientY - canvasRect.top,
        }

        if (isValidDropTarget(dropPosition)) {
          handleDrop({
            clientX: touch.clientX,
            clientY: touch.clientY,
            canvasRect,
          })
        }
      }
    },
    'data-drop-target': true,
    'data-drag-state': dragState,
  }
}
