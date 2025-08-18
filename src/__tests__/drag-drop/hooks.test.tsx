import { renderHook, act } from '@testing-library/react'
import {
  useDragAndDrop,
  usePaletteDraggable,
  useCanvasDraggable,
  useDropTarget,
} from '@/hooks/useDragAndDrop'
import { ComponentType, BaseComponent, DragState } from '@/types'
import * as storeModule from '@/store/simple'

// Mock the store
const mockDragContext = {
  state: DragState.IDLE,
  draggedComponent: null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  targetElement: null,
  dragOffset: { x: 0, y: 0 },
  isDragValid: false,
}

const mockCanvas = {
  boundaries: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
  grid: { snapToGrid: true, size: 20 },
}

const mockActions = {
  startDrag: jest.fn(),
  updateDrag: jest.fn(),
  endDrag: jest.fn(),
  addComponent: jest.fn(),
  moveComponent: jest.fn(),
  selectComponent: jest.fn(),
}

jest.mock('@/store/simple', () => ({
  useDragContext: jest.fn(),
  useUIActions: jest.fn(),
  useComponentActions: jest.fn(),
  useCanvas: jest.fn(),
}))

// Mock the drag system
jest.mock('@/utils/dragSystem', () => ({
  DragSystem: jest.fn().mockImplementation(() => ({
    initializePaletteDrag: jest.fn().mockReturnValue(true),
    initializeCanvasDrag: jest.fn().mockReturnValue(true),
    getEventHandler: jest.fn().mockReturnValue({
      handleDragStart: jest.fn(),
    }),
    cleanup: jest.fn(),
  })),
  DragCalculations: {
    constrainPosition: jest.fn(pos => pos),
  },
}))

// Mock ComponentFactory
jest.mock('@/utils/componentFactory', () => ({
  ComponentFactory: {
    create: jest.fn().mockReturnValue({
      id: 'new-component',
      type: 'TEXT', // Use string to avoid hoisting
      position: { x: 0, y: 0 },
      dimensions: { width: 200, height: 40 },
    }),
  },
}))

describe('useDragAndDrop', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(storeModule.useDragContext as jest.Mock).mockReturnValue(mockDragContext)
    ;(storeModule.useUIActions as jest.Mock).mockReturnValue({
      startDrag: mockActions.startDrag,
      updateDrag: mockActions.updateDrag,
      endDrag: mockActions.endDrag,
    })
    ;(storeModule.useComponentActions as jest.Mock).mockReturnValue({
      addComponent: mockActions.addComponent,
      moveComponent: mockActions.moveComponent,
      selectComponent: mockActions.selectComponent,
    })
    ;(storeModule.useCanvas as jest.Mock).mockReturnValue(mockCanvas)
  })

  describe('Hook State', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useDragAndDrop())

      expect(result.current.dragContext).toEqual(mockDragContext)
      expect(result.current.isDragging).toBe(false)
      expect(result.current.dragState).toBe(DragState.IDLE)
    })

    it('should detect dragging state', () => {
      const draggingContext = {
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
      }

      ;(storeModule.useDragContext as jest.Mock).mockReturnValue(
        draggingContext
      )

      const { result } = renderHook(() => useDragAndDrop())

      expect(result.current.isDragging).toBe(true)
      expect(result.current.dragState).toBe(DragState.DRAGGING_FROM_PALETTE)
    })
  })

  describe('startPaletteDrag', () => {
    it('should start palette drag with mouse event', () => {
      const { result } = renderHook(() => useDragAndDrop())

      const mockMouseEvent = {
        nativeEvent: {
          type: 'mousedown',
          clientX: 100,
          clientY: 200,
        },
      } as any

      act(() => {
        result.current.startPaletteDrag(ComponentType.TEXT, mockMouseEvent)
      })

      expect(mockActions.startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    })

    it('should start palette drag with touch event', () => {
      const { result } = renderHook(() => useDragAndDrop())

      const mockTouchEvent = {
        nativeEvent: {
          type: 'touchstart',
          touches: [{ clientX: 150, clientY: 250 }],
        },
      } as any

      act(() => {
        result.current.startPaletteDrag(ComponentType.BUTTON, mockTouchEvent)
      })

      expect(mockActions.startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.BUTTON,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    })
  })

  describe('startCanvasDrag', () => {
    const mockComponent: BaseComponent = {
      id: 'test-component',
      type: ComponentType.TEXT,
      position: { x: 100, y: 100 },
      dimensions: { width: 200, height: 40 },
      props: {},
      zIndex: 1,
    } as any

    it('should start canvas drag with mouse event', () => {
      const { result } = renderHook(() => useDragAndDrop())

      const mockMouseEvent = {
        nativeEvent: {
          type: 'mousedown',
          clientX: 150,
          clientY: 120,
        },
      } as any

      act(() => {
        result.current.startCanvasDrag(mockComponent, mockMouseEvent)
      })

      expect(mockActions.startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: mockComponent,
        startPosition: { x: 100, y: 100 },
        currentPosition: { x: 100, y: 100 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    })

    it('should start canvas drag with touch event', () => {
      const { result } = renderHook(() => useDragAndDrop())

      const mockTouchEvent = {
        nativeEvent: {
          type: 'touchstart',
          touches: [{ clientX: 180, clientY: 140 }],
        },
      } as any

      act(() => {
        result.current.startCanvasDrag(mockComponent, mockTouchEvent)
      })

      expect(mockActions.startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: mockComponent,
        startPosition: { x: 100, y: 100 },
        currentPosition: { x: 100, y: 100 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    })
  })

  describe('handleDrop', () => {
    it('should handle palette drop', () => {
      const paletteDragContext = {
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.IMAGE,
        constraints: {
          boundaries: mockCanvas.boundaries,
          snapToGrid: mockCanvas.grid.snapToGrid,
          gridSize: mockCanvas.grid.size,
          minDragDistance: 3,
          preventOverlap: false,
        },
      }

      ;(storeModule.useDragContext as jest.Mock).mockReturnValue(
        paletteDragContext
      )

      const { result } = renderHook(() => useDragAndDrop())

      act(() => {
        result.current.handleDrop({
          clientX: 300,
          clientY: 400,
          canvasRect: { left: 0, top: 0, right: 800, bottom: 600 } as DOMRect,
        })
      })

      expect(mockActions.addComponent).toHaveBeenCalled()
      expect(mockActions.selectComponent).toHaveBeenCalledWith('new-component')
      expect(mockActions.endDrag).toHaveBeenCalled()
    })

    it('should handle canvas component drop', () => {
      const mockComponent: BaseComponent = {
        id: 'existing-component',
        type: ComponentType.TEXT,
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 40 },
        props: {},
        zIndex: 1,
      } as any

      const canvasDragContext = {
        ...mockDragContext,
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: mockComponent,
        constraints: {
          boundaries: mockCanvas.boundaries,
          snapToGrid: mockCanvas.grid.snapToGrid,
          gridSize: mockCanvas.grid.size,
          minDragDistance: 3,
          preventOverlap: false,
        },
      }

      ;(storeModule.useDragContext as jest.Mock).mockReturnValue(
        canvasDragContext
      )

      const { result } = renderHook(() => useDragAndDrop())

      act(() => {
        result.current.handleDrop({
          clientX: 250,
          clientY: 350,
          canvasRect: { left: 0, top: 0, right: 800, bottom: 600 } as DOMRect,
        })
      })

      // Canvas drops don't call moveComponent via handleDrop - they use useEffect
      expect(mockActions.moveComponent).not.toHaveBeenCalled()
      expect(mockActions.endDrag).not.toHaveBeenCalled()
    })

    it('should handle drop when not dragging', () => {
      const { result } = renderHook(() => useDragAndDrop())

      act(() => {
        result.current.handleDrop({ x: 100, y: 200 })
      })

      // Should not perform any actions
      expect(mockActions.addComponent).not.toHaveBeenCalled()
      expect(mockActions.moveComponent).not.toHaveBeenCalled()
    })
  })

  describe('cancelDrag', () => {
    it('should cancel current drag operation', () => {
      const { result } = renderHook(() => useDragAndDrop())

      act(() => {
        result.current.cancelDrag()
      })

      expect(mockActions.endDrag).toHaveBeenCalled()
    })
  })

  describe('isValidDropTarget', () => {
    it('should validate drop target position', () => {
      const { result } = renderHook(() => useDragAndDrop())

      const validPosition = { x: 100, y: 200 }
      const invalidPosition = { x: -50, y: -100 }

      expect(result.current.isValidDropTarget(validPosition)).toBe(true)
      expect(result.current.isValidDropTarget(invalidPosition)).toBe(false) // Negative coordinates should be invalid
    })

    it('should respect boundary constraints', () => {
      const constrainedContext = {
        ...mockDragContext,
        constraints: {
          boundaries: { minX: 0, minY: 0, maxX: 500, maxY: 400 },
          snapToGrid: false,
          gridSize: 1,
          minDragDistance: 3,
          preventOverlap: false,
        },
      }

      const constrainedCanvas = {
        boundaries: { minX: 0, minY: 0, maxX: 500, maxY: 400 },
        grid: { snapToGrid: true, size: 20 },
      }

      ;(storeModule.useDragContext as jest.Mock).mockReturnValue(
        constrainedContext
      )
      ;(storeModule.useCanvas as jest.Mock).mockReturnValue(constrainedCanvas)

      const { result } = renderHook(() => useDragAndDrop())

      expect(result.current.isValidDropTarget({ x: 250, y: 200 })).toBe(true)
      expect(result.current.isValidDropTarget({ x: 600, y: 200 })).toBe(false)
      expect(result.current.isValidDropTarget({ x: 250, y: 500 })).toBe(false)
    })
  })
})

describe('usePaletteDraggable', () => {
  it('should return drag handlers for palette items', () => {
    const { result } = renderHook(() => usePaletteDraggable(ComponentType.TEXT))

    expect(result.current).toHaveProperty('onMouseDown')
    expect(result.current).toHaveProperty('onTouchStart')
    expect(result.current['data-draggable']).toBe('palette')
    expect(result.current['data-component-type']).toBe(ComponentType.TEXT)
  })

  it('should handle mouse down event', () => {
    const { result } = renderHook(() =>
      usePaletteDraggable(ComponentType.BUTTON)
    )

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      nativeEvent: { type: 'mousedown' },
    } as any

    act(() => {
      result.current.onMouseDown(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('should handle touch start event', () => {
    const { result } = renderHook(() =>
      usePaletteDraggable(ComponentType.IMAGE)
    )

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      nativeEvent: { type: 'touchstart' },
    } as any

    act(() => {
      result.current.onTouchStart(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })
})

describe('useCanvasDraggable', () => {
  const mockComponent: BaseComponent = {
    id: 'canvas-component',
    type: ComponentType.TEXT,
    position: { x: 100, y: 100 },
    dimensions: { width: 200, height: 40 },
    props: {},
    zIndex: 1,
  } as any

  it('should return drag handlers for canvas components', () => {
    const { result } = renderHook(() => useCanvasDraggable(mockComponent))

    expect(result.current).toHaveProperty('onMouseDown')
    expect(result.current).toHaveProperty('onTouchStart')
    expect(result.current['data-draggable']).toBe('canvas')
    expect(result.current['data-component-id']).toBe('canvas-component')
  })

  it('should handle mouse down event with left button only', () => {
    const { result } = renderHook(() => useCanvasDraggable(mockComponent))

    const leftClickEvent = {
      button: 0,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: {
        getBoundingClientRect: jest.fn(() => ({
          left: 10,
          top: 10,
          width: 100,
          height: 50,
        })),
        closest: jest.fn(() => ({
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
          })),
        })),
      },
      clientX: 50,
      clientY: 30,
      nativeEvent: { type: 'mousedown' },
    } as any

    act(() => {
      result.current.onMouseDown(leftClickEvent)
    })

    expect(leftClickEvent.preventDefault).toHaveBeenCalled()
    expect(leftClickEvent.stopPropagation).toHaveBeenCalled()
  })

  it('should ignore non-left mouse button clicks', () => {
    const { result } = renderHook(() => useCanvasDraggable(mockComponent))

    const rightClickEvent = {
      button: 2,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      nativeEvent: { type: 'mousedown' },
    } as any

    act(() => {
      result.current.onMouseDown(rightClickEvent)
    })

    expect(rightClickEvent.preventDefault).not.toHaveBeenCalled()
  })

  it('should handle touch start event', () => {
    const { result } = renderHook(() => useCanvasDraggable(mockComponent))

    const touchEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: {
        getBoundingClientRect: jest.fn(() => ({
          left: 10,
          top: 10,
          width: 100,
          height: 50,
        })),
        closest: jest.fn(() => ({
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
          })),
        })),
      },
      touches: [{ clientX: 50, clientY: 30 }],
      nativeEvent: { type: 'touchstart' },
    } as any

    act(() => {
      result.current.onTouchStart(touchEvent)
    })

    expect(touchEvent.preventDefault).toHaveBeenCalled()
    expect(touchEvent.stopPropagation).toHaveBeenCalled()
  })
})

describe('useDropTarget', () => {
  beforeEach(() => {
    ;(storeModule.useDragContext as jest.Mock).mockReturnValue({
      ...mockDragContext,
      state: DragState.DRAGGING_FROM_PALETTE,
    })
  })

  it('should return drop handlers', () => {
    const { result } = renderHook(() => useDropTarget())

    expect(result.current).toHaveProperty('onMouseUp')
    expect(result.current).toHaveProperty('onTouchEnd')
    expect(result.current['data-drop-target']).toBe(true)
    expect(result.current['data-drag-state']).toBe(
      DragState.DRAGGING_FROM_PALETTE
    )
  })

  it('should handle mouse up event during drag', () => {
    const { result } = renderHook(() => useDropTarget())

    const mouseUpEvent = {
      clientX: 300,
      clientY: 400,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: {
        getBoundingClientRect: jest.fn().mockReturnValue({
          left: 0,
          top: 0,
          right: 800,
          bottom: 600,
        }),
      },
    } as any

    act(() => {
      result.current.onMouseUp(mouseUpEvent)
    })

    expect(mouseUpEvent.preventDefault).toHaveBeenCalled()
    expect(mouseUpEvent.stopPropagation).toHaveBeenCalled()
  })

  it('should handle touch end event during drag', () => {
    const { result } = renderHook(() => useDropTarget())

    const touchEndEvent = {
      changedTouches: [{ clientX: 350, clientY: 450 }],
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: {
        getBoundingClientRect: jest.fn().mockReturnValue({
          left: 0,
          top: 0,
          right: 800,
          bottom: 600,
        }),
      },
    } as any

    act(() => {
      result.current.onTouchEnd(touchEndEvent)
    })

    expect(touchEndEvent.preventDefault).toHaveBeenCalled()
    expect(touchEndEvent.stopPropagation).toHaveBeenCalled()
  })

  it('should ignore events when not dragging', () => {
    ;(storeModule.useDragContext as jest.Mock).mockReturnValue({
      ...mockDragContext,
      state: DragState.IDLE,
    })

    const { result } = renderHook(() => useDropTarget())

    const mouseUpEvent = {
      clientX: 300,
      clientY: 400,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as any

    act(() => {
      result.current.onMouseUp(mouseUpEvent)
    })

    expect(mouseUpEvent.preventDefault).not.toHaveBeenCalled()
  })

  it('should handle touch end event without touches', () => {
    const { result } = renderHook(() => useDropTarget())

    const touchEndEvent = {
      changedTouches: [],
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as any

    act(() => {
      result.current.onTouchEnd(touchEndEvent)
    })

    expect(touchEndEvent.preventDefault).toHaveBeenCalled()
    // Should not crash when no touches available
  })
})
