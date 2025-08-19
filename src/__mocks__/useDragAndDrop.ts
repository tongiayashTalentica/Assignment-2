/**
 * Manual mock for useDragAndDrop hooks
 */

export const useDragAndDrop = jest.fn(() => {
  // Get the mock store and actions
  const mockStore = require('@/store')
  const mockUIActions = mockStore.useUIActions()
  const mockComponentActions = mockStore.useComponentActions()

  return {
    dragContext: {
      state: 'idle',
      draggedComponent: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 },
      isDragValid: false,
      performanceData: null,
      targetElement: null,
    },
    get isDragging() {
      const dragContext = mockStore.useDragContext()
      return dragContext.state !== 'idle'
    },
    get dragState() {
      const dragContext = mockStore.useDragContext()
      return dragContext.state
    },
    startPaletteDrag: jest.fn((componentType, _event) => {
      // Actually call the store action as expected by tests
      mockUIActions.startDrag({
        state: 'dragging_from_palette',
        draggedComponent: componentType,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    }),
    startCanvasDrag: jest.fn((component, _event) => {
      mockUIActions.startDrag({
        state: 'dragging_canvas_component',
        draggedComponent: component,
        startPosition: component.position || { x: 100, y: 100 },
        currentPosition: component.position || { x: 100, y: 100 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    }),
    handleDrop: jest.fn(position => {
      // Mock the drop handling - create component and select it
      const ComponentFactory = require('@/utils/componentFactory')
      const newComponent = ComponentFactory.ComponentFactory.create(
        'TEXT',
        position
      )
      mockComponentActions.addComponent(newComponent)
      mockComponentActions.selectComponent('new-component')
      mockUIActions.endDrag()
    }),
    cancelDrag: jest.fn(() => {
      mockUIActions.endDrag()
    }),
    isValidDropTarget: jest.fn(pos => {
      // Implement basic boundary validation
      const canvas = { boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 } }
      return (
        pos.x >= canvas.boundaries.minX &&
        pos.x <= canvas.boundaries.maxX &&
        pos.y >= canvas.boundaries.minY &&
        pos.y <= canvas.boundaries.maxY
      )
    }),
    constrainPosition: jest.fn(
      (pos, dimensions = { width: 100, height: 100 }) => {
        // Implement basic constraint logic
        const canvas = {
          boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
        }
        return {
          x: Math.max(
            canvas.boundaries.minX,
            Math.min(pos.x, canvas.boundaries.maxX - dimensions.width)
          ),
          y: Math.max(
            canvas.boundaries.minY,
            Math.min(pos.y, canvas.boundaries.maxY - dimensions.height)
          ),
        }
      }
    ),
    performanceData: null,
  }
})

export const usePaletteDraggable = jest.fn(() => ({
  onMouseDown: jest.fn(e => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
  }),
  onTouchStart: jest.fn(e => {
    e?.preventDefault?.()
  }),
  draggable: false,
  onDragStart: jest.fn(e => e.preventDefault()),
  'data-draggable': 'palette',
  'data-component-type': 'text',
}))

export const useCanvasDraggable = jest.fn(
  (componentId = 'canvas-component') => ({
    onMouseDown: jest.fn(e => {
      if (e?.button === 0) {
        // Left button only
        e?.preventDefault?.()
        e?.stopPropagation?.()
      }
    }),
    onTouchStart: jest.fn(e => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
    }),
    draggable: false,
    onDragStart: jest.fn(e => e.preventDefault()),
    'data-draggable': 'canvas',
    'data-component-id':
      typeof componentId === 'string'
        ? componentId
        : componentId.id || 'canvas-component',
  })
)

export const useDropTarget = jest.fn(() => ({
  onMouseUp: jest.fn(e => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
  }),
  onTouchEnd: jest.fn(e => {
    e?.preventDefault?.()
  }),
  'data-drop-target': true,
  'data-drag-state': 'dragging_from_palette',
}))

export default {
  useDragAndDrop,
  usePaletteDraggable,
  useCanvasDraggable,
  useDropTarget,
}
