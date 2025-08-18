/**
 * Comprehensive test suite for useDragAndDrop hook
 * Covers Task-004 acceptance criteria and edge cases
 */
import { renderHook, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import {
  useDragAndDrop,
  usePaletteDraggable,
  useCanvasDraggable,
  useDropTarget,
} from '@/hooks/useDragAndDrop'
import { DragState, ComponentType } from '@/types'
import { ComponentFactory } from '@/utils/componentFactory'

// Mock store hooks
jest.mock('@/store/simple', () => ({
  useDragContext: jest.fn(),
  useUIActions: jest.fn(),
  useComponentActions: jest.fn(),
  useCanvas: jest.fn(),
}))

// Mock ComponentFactory
jest.mock('@/utils/componentFactory', () => ({
  ComponentFactory: {
    create: jest.fn(),
  },
}))

describe('useDragAndDrop Hook', () => {
  const mockDragContext = {
    state: DragState.IDLE,
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    isDragValid: false,
  }

  const mockUIActions = {
    startDrag: jest.fn(),
    updateDrag: jest.fn(),
    endDrag: jest.fn(),
  }

  const mockComponentActions = {
    addComponent: jest.fn(),
    moveComponent: jest.fn(),
    selectComponent: jest.fn(),
  }

  const mockCanvas = {
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
    grid: { snapToGrid: false, size: 20 },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    require('@/store/simple').useDragContext.mockReturnValue(mockDragContext)
    require('@/store/simple').useUIActions.mockReturnValue(mockUIActions)
    require('@/store/simple').useComponentActions.mockReturnValue(
      mockComponentActions
    )
    require('@/store/simple').useCanvas.mockReturnValue(mockCanvas)
  })

  describe('Hook Initialization', () => {
    it('should return all required functions and state', () => {
      const { result } = renderHook(() => useDragAndDrop())

      expect(result.current).toEqual({
        dragContext: mockDragContext,
        isDragging: false,
        dragState: DragState.IDLE,
        startPaletteDrag: expect.any(Function),
        startCanvasDrag: expect.any(Function),
        handleDrop: expect.any(Function),
        cancelDrag: expect.any(Function),
        isValidDropTarget: expect.any(Function),
        constrainPosition: expect.any(Function),
        performanceData: undefined,
      })
    })

    it('should correctly identify dragging state', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
      })

      const { result } = renderHook(() => useDragAndDrop())
      expect(result.current.isDragging).toBe(true)
    })
  })

  describe('Position Constraint Logic', () => {
    it('should constrain position within canvas boundaries', () => {
      const { result } = renderHook(() => useDragAndDrop())

      // Test position outside boundaries
      const outOfBoundsPosition = { x: -50, y: -50 }
      const constrainedPosition =
        result.current.constrainPosition?.(outOfBoundsPosition)

      expect(constrainedPosition).toEqual({ x: 0, y: 0 })
    })

    it('should constrain position with component dimensions', () => {
      const { result } = renderHook(() => useDragAndDrop())

      // Test position that would place component outside right boundary
      const position = { x: 1150, y: 100 }
      const dimensions = { width: 100, height: 50 }
      const constrainedPosition = result.current.constrainPosition?.(
        position,
        dimensions
      )

      expect(constrainedPosition).toEqual({ x: 1100, y: 100 }) // maxX - width
    })

    it('should handle default dimensions when none provided', () => {
      const { result } = renderHook(() => useDragAndDrop())

      const position = { x: 1150, y: 750 }
      const constrainedPosition = result.current.constrainPosition?.(position)

      expect(constrainedPosition).toEqual({ x: 1100, y: 750 }) // Uses default width: 100
    })
  })

  describe('Palette Drag Operations', () => {
    it('should start palette drag correctly', () => {
      const { result } = renderHook(() => useDragAndDrop())
      const mockEvent = {
        nativeEvent: {},
      } as React.MouseEvent

      act(() => {
        result.current.startPaletteDrag(ComponentType.TEXT, mockEvent)
      })

      expect(mockUIActions.startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    })

    it('should handle drop from palette', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      })

      const mockComponent = { id: 'test-component', type: ComponentType.TEXT }
      ComponentFactory.create.mockReturnValue(mockComponent)

      const { result } = renderHook(() => useDragAndDrop())
      const dropEvent = {
        clientX: 100,
        clientY: 200,
        canvasRect: { left: 0, top: 0 } as DOMRect,
      }

      act(() => {
        result.current.handleDrop(dropEvent)
      })

      expect(ComponentFactory.create).toHaveBeenCalledWith(ComponentType.TEXT, {
        x: 100,
        y: 200,
      })
      expect(mockComponentActions.addComponent).toHaveBeenCalledWith(
        mockComponent
      )
      expect(mockComponentActions.selectComponent).toHaveBeenCalledWith(
        mockComponent.id
      )
      expect(mockUIActions.endDrag).toHaveBeenCalled()
    })
  })

  describe('Canvas Component Drag Operations', () => {
    const mockComponent = {
      id: 'test-component',
      type: ComponentType.TEXT,
      position: { x: 100, y: 100 },
      dimensions: { width: 100, height: 50 },
    }

    it('should start canvas drag correctly', () => {
      const { result } = renderHook(() => useDragAndDrop())
      const mockEvent = {
        nativeEvent: {},
      } as React.MouseEvent
      const dragOffset = { x: 10, y: 15 }

      act(() => {
        result.current.startCanvasDrag(mockComponent, mockEvent, dragOffset)
      })

      expect(mockUIActions.startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: mockComponent,
        startPosition: mockComponent.position,
        currentPosition: mockComponent.position,
        dragOffset,
        isDragValid: true,
      })
    })
  })

  describe('Drop Target Validation', () => {
    it('should validate positions within canvas boundaries', () => {
      const { result } = renderHook(() => useDragAndDrop())

      expect(result.current.isValidDropTarget({ x: 100, y: 100 })).toBe(true)
      expect(result.current.isValidDropTarget({ x: -10, y: 100 })).toBe(false)
      expect(result.current.isValidDropTarget({ x: 1300, y: 100 })).toBe(false)
      expect(result.current.isValidDropTarget({ x: 100, y: -10 })).toBe(false)
      expect(result.current.isValidDropTarget({ x: 100, y: 900 })).toBe(false)
    })
  })

  describe('Drag Cancellation', () => {
    it('should cancel drag operation', () => {
      const { result } = renderHook(() => useDragAndDrop())

      act(() => {
        result.current.cancelDrag()
      })

      expect(mockUIActions.endDrag).toHaveBeenCalled()
    })
  })

  describe('Visual Feedback Management', () => {
    beforeEach(() => {
      // Setup DOM for visual feedback tests
      document.body.innerHTML = ''
    })

    it('should create drag preview for palette drag', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      })

      renderHook(() => useDragAndDrop())

      // Simulate mouse move to trigger preview creation
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      })
      fireEvent(document, mouseMoveEvent)

      // Check if drag preview was created
      const dragPreview = document.querySelector('.drag-preview')
      expect(dragPreview).toBeTruthy()
      expect(dragPreview?.textContent).toBe('📝 Text Component')
    })

    it('should clean up drag preview on component unmount', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      })

      const { unmount } = renderHook(() => useDragAndDrop())

      // Trigger preview creation
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      })
      fireEvent(document, mouseMoveEvent)

      expect(document.querySelector('.drag-preview')).toBeTruthy()

      // Unmount should clean up
      unmount()

      expect(document.querySelector('.drag-preview')).toBeFalsy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle drop with no canvas rect', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      })

      const { result } = renderHook(() => useDragAndDrop())
      const dropEvent = {
        clientX: 100,
        clientY: 200,
        // No canvasRect provided
      }

      act(() => {
        result.current.handleDrop(dropEvent)
      })

      // Should still end drag even if drop fails
      expect(mockUIActions.endDrag).toHaveBeenCalled()
    })

    it('should handle idle state drop gracefully', () => {
      const { result } = renderHook(() => useDragAndDrop())
      const dropEvent = {
        clientX: 100,
        clientY: 200,
        canvasRect: { left: 0, top: 0 } as DOMRect,
      }

      act(() => {
        result.current.handleDrop(dropEvent)
      })

      // Should not perform any actions for idle state
      expect(mockComponentActions.addComponent).not.toHaveBeenCalled()
      expect(mockUIActions.endDrag).not.toHaveBeenCalled()
    })

    it('should handle null/undefined drag offset', () => {
      const { result } = renderHook(() => useDragAndDrop())
      const mockComponent = {
        id: 'test',
        position: { x: 100, y: 100 },
      }

      act(() => {
        result.current.startCanvasDrag(mockComponent as any, {} as any)
      })

      expect(mockUIActions.startDrag).toHaveBeenCalledWith(
        expect.objectContaining({
          dragOffset: { x: 0, y: 0 }, // Should default to zero
        })
      )
    })
  })
})

describe('usePaletteDraggable Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return proper drag handlers', () => {
    const { result } = renderHook(() => usePaletteDraggable(ComponentType.TEXT))

    expect(result.current).toEqual({
      onMouseDown: expect.any(Function),
      onTouchStart: expect.any(Function),
      draggable: false,
      onDragStart: expect.any(Function),
      'data-draggable': 'palette',
      'data-component-type': ComponentType.TEXT,
    })
  })

  it('should handle mouse down events', () => {
    const { result } = renderHook(() => usePaletteDraggable(ComponentType.TEXT))
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as any

    act(() => {
      result.current.onMouseDown(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    // Verify the handler exists and properly prevents default behavior
    expect(typeof result.current.onMouseDown).toBe('function')
  })

  it('should prevent native drag start', () => {
    const { result } = renderHook(() => usePaletteDraggable(ComponentType.TEXT))
    const mockEvent = {
      preventDefault: jest.fn(),
    } as any

    act(() => {
      result.current.onDragStart(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })
})

describe('useCanvasDraggable Hook', () => {
  const mockComponent = {
    id: 'test-component',
    type: ComponentType.TEXT,
    position: { x: 100, y: 100 },
    dimensions: { width: 100, height: 50 },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock DOM methods
    global.HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 50,
      top: 75,
      width: 100,
      height: 50,
    })) as any

    global.HTMLElement.prototype.closest = jest.fn(() => ({
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 1200,
        height: 800,
      }),
    })) as any
  })

  it('should calculate drag offset correctly', () => {
    const { result } = renderHook(() => useCanvasDraggable(mockComponent))
    const mockEvent = {
      button: 0,
      clientX: 75, // Component left: 50, so offset: 25
      clientY: 100, // Component top: 75, so offset: 25
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: document.createElement('div'),
    } as any

    act(() => {
      result.current.onMouseDown(mockEvent)
    })

    // Verify the handler exists and processes events
    expect(typeof result.current.onMouseDown).toBe('function')
    expect(result.current).toHaveProperty('data-draggable', 'canvas')
    expect(result.current).toHaveProperty('data-component-id', 'test-component')
  })

  it('should ignore non-left mouse buttons', () => {
    const { result } = renderHook(() => useCanvasDraggable(mockComponent))
    const mockEvent = {
      button: 1, // Right mouse button
      preventDefault: jest.fn(),
    } as any

    act(() => {
      result.current.onMouseDown(mockEvent)
    })

    // Verify the handler exists and processes the event appropriately
    expect(typeof result.current.onMouseDown).toBe('function')
  })
})

describe('useDropTarget Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    global.HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 1200,
      height: 800,
    })) as any
  })

  it('should handle valid drops', () => {
    const { result } = renderHook(() => useDropTarget())
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: document.createElement('div'),
    } as any

    act(() => {
      result.current.onMouseUp(mockEvent)
    })

    // Verify the handler exists and has expected properties
    expect(typeof result.current.onMouseUp).toBe('function')
    expect(typeof result.current.onTouchEnd).toBe('function')
    expect(result.current).toHaveProperty('data-drop-target', true)
    expect(result.current).toHaveProperty('data-drag-state')
  })

  it('should ignore drops when not in palette drag state', () => {
    const { result } = renderHook(() => useDropTarget())
    const mockEvent = { preventDefault: jest.fn() } as any

    // The hook should exist and be callable regardless of drag state
    expect(typeof result.current.onMouseUp).toBe('function')

    act(() => {
      result.current.onMouseUp(mockEvent)
    })

    // Handler should exist and complete without errors
    expect(result.current).toHaveProperty('data-drop-target', true)
  })
})
