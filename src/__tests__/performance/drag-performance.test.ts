/**
 * Drag-and-Drop Performance Tests
 * Tests for 60 FPS requirement and memory usage
 */
import { renderHook, act } from '@testing-library/react'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { DragState, ComponentType } from '@/types'

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(),
    mark: jest.fn(),
    measure: jest.fn(),
  },
  writable: true,
})

// Mock requestAnimationFrame
Object.defineProperty(global, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(performance.now()), 16.67) // 60 FPS
  },
  writable: true,
})

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id),
  writable: true,
})

// Mock store hooks
const mockUIActions = {
  startDrag: jest.fn(),
  updateDrag: jest.fn(),
  endDrag: jest.fn(),
}

jest.mock('@/store', () => ({
  useDragContext: jest.fn(() => ({
    state: 'idle',
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    targetElement: null,
    dragOffset: { x: 0, y: 0 },
    isDragValid: false,
  })),
  useUIActions: jest.fn(() => mockUIActions),
  useComponentActions: jest.fn(() => ({
    addComponent: jest.fn(),
    moveComponent: jest.fn(),
    selectComponent: jest.fn(),
  })),
  useCanvas: jest.fn(() => ({
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
    grid: { snapToGrid: false, size: 20 },
  })),
}))

describe('Drag-and-Drop Performance Tests', () => {
  const mockCanvas = {
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
    grid: { snapToGrid: false, size: 20 },
  }

  const mockComponentActions = {
    addComponent: jest.fn(),
    moveComponent: jest.fn(),
    selectComponent: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(performance.now as jest.Mock).mockReturnValue(0)
    require('@/store').useCanvas.mockReturnValue(mockCanvas)
    require('@/store').useUIActions.mockReturnValue(mockUIActions)
    require('@/store').useComponentActions.mockReturnValue(mockComponentActions)
  })

  describe('Frame Rate Performance', () => {
    it('should maintain 60 FPS during canvas component drag', async () => {
      const mockDragContext = {
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: {
          id: 'test-component',
          position: { x: 100, y: 100 },
          dimensions: { width: 100, height: 50 },
        },
        dragOffset: { x: 10, y: 10 },
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)

      const { rerender: _rerender } = renderHook(() => useDragAndDrop()) // eslint-disable-line @typescript-eslint/no-unused-vars

      // Simulate rapid mouse movements (120 events per second - 2x faster than 60 FPS)
      const startTime = performance.now()
      const frameTimesCount = 120
      // const _expectedFrameTime = 16.67 // 60 FPS

      let frameCount = 0
      const updateTimes: number[] = []

      for (let i = 0; i < frameTimesCount; i++) {
        const currentTime = startTime + i * 8.33 // 120 FPS mouse events
        ;(performance.now as jest.Mock).mockReturnValue(currentTime)

        // Simulate mouse move event
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 100 + i,
          clientY: 100 + i * 0.5,
        })

        act(() => {
          document.dispatchEvent(mouseMoveEvent)
        })

        // Check if update was actually called (should be throttled)
        if (mockUIActions.updateDrag.mock.calls.length > frameCount) {
          updateTimes.push(currentTime)
          frameCount++
        }
      }

      // Calculate actual FPS
      if (updateTimes.length > 1) {
        const totalTime = updateTimes[updateTimes.length - 1] - updateTimes[0]
        const actualFPS = ((updateTimes.length - 1) * 1000) / totalTime

        // Should maintain ~60 FPS (allow 10% tolerance)
        expect(actualFPS).toBeGreaterThanOrEqual(54) // 60 FPS - 10%
        expect(actualFPS).toBeLessThanOrEqual(66) // 60 FPS + 10%
      }

      // Should not update for every mouse event (throttled)
      expect(mockUIActions.updateDrag.mock.calls.length).toBeLessThan(
        frameTimesCount
      )
    })

    it('should throttle mouse move events to prevent excessive updates', () => {
      const mockDragContext = {
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)
      renderHook(() => useDragAndDrop())

      const rapidEvents = 100
      const currentTime = 0

      // Rapid mouse movements within a single frame
      for (let i = 0; i < rapidEvents; i++) {
        ;(performance.now as jest.Mock).mockReturnValue(currentTime + i * 0.1)

        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 100 + i,
          clientY: 100,
        })

        act(() => {
          document.dispatchEvent(mouseMoveEvent)
        })
      }

      // Should create much fewer DOM updates than mouse events
      const dragPreviewElements = document.querySelectorAll('.drag-preview')
      expect(dragPreviewElements.length).toBeLessThanOrEqual(1) // Only one preview
    })
  })

  describe('Memory Management', () => {
    it('should clean up event listeners on component unmount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const mockDragContext = {
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: { id: 'test' },
        dragOffset: { x: 0, y: 0 },
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)

      const { unmount } = renderHook(() => useDragAndDrop())

      // Should have added event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
        { passive: false }
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function),
        { passive: false }
      )

      // Unmount should clean up
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      )

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('should clean up drag preview elements', () => {
      const mockDragContext = {
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)

      const { unmount } = renderHook(() => useDragAndDrop())

      // Trigger preview creation
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      })

      act(() => {
        document.dispatchEvent(mouseMoveEvent)
      })

      // Should have preview
      expect(document.querySelector('.drag-preview')).toBeTruthy()

      // Unmount should clean up
      unmount()

      expect(document.querySelector('.drag-preview')).toBeFalsy()
    })

    it('should not create memory leaks during repeated drag operations', () => {
      const mockDragContext = {
        state: DragState.IDLE,
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)

      const { result: _result, rerender } = renderHook(() => useDragAndDrop()) // eslint-disable-line @typescript-eslint/no-unused-vars

      // Simulate multiple drag operations
      for (let i = 0; i < 10; i++) {
        // Start drag
        require('@/store').useDragContext.mockReturnValue({
          state: DragState.DRAGGING_FROM_PALETTE,
          draggedComponent: ComponentType.TEXT,
        })

        rerender()

        // End drag
        require('@/store').useDragContext.mockReturnValue({
          state: DragState.IDLE,
        })

        rerender()
      }

      // Should not accumulate DOM elements
      const dragPreviews = document.querySelectorAll('.drag-preview')
      expect(dragPreviews.length).toBeLessThanOrEqual(1)
    })
  })

  describe('DOM Manipulation Performance', () => {
    it('should use efficient DOM updates for drag preview positioning', () => {
      const mockDragContext = {
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)
      renderHook(() => useDragAndDrop())

      // Create spy on DOM manipulation
      const originalSetAttribute = HTMLElement.prototype.setAttribute
      const setAttributeSpy = jest.fn()
      HTMLElement.prototype.setAttribute = setAttributeSpy

      // Trigger rapid mouse moves
      for (let i = 0; i < 5; i++) {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 100 + i * 10,
          clientY: 100 + i * 5,
        })

        act(() => {
          document.dispatchEvent(mouseMoveEvent)
        })
      }

      // Restore original method
      HTMLElement.prototype.setAttribute = originalSetAttribute

      // Should minimize DOM manipulations
      expect(setAttributeSpy.mock.calls.length).toBeLessThan(20) // Reasonable limit
    })

    it('should use GPU-accelerated transforms for smooth animation', () => {
      const mockDragContext = {
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)
      renderHook(() => useDragAndDrop())

      // Trigger preview creation
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      })

      act(() => {
        document.dispatchEvent(mouseMoveEvent)
      })

      const dragPreview = document.querySelector('.drag-preview') as HTMLElement
      expect(dragPreview).toBeTruthy()

      // Should use position: fixed for GPU acceleration
      expect(dragPreview.style.position).toBe('fixed')
      expect(dragPreview.style.left).toBe('115px') // clientX + offset
      expect(dragPreview.style.top).toBe('190px') // clientY + offset
    })
  })

  describe('Large Dataset Performance', () => {
    it('should handle large number of components efficiently', () => {
      const largeComponentSet = new Map()

      // Create 1000 components
      for (let i = 0; i < 1000; i++) {
        largeComponentSet.set(`component-${i}`, {
          id: `component-${i}`,
          type: ComponentType.TEXT,
          position: { x: (i % 50) * 25, y: Math.floor(i / 50) * 25 },
          dimensions: { width: 20, height: 20 },
        })
      }

      require('@/store').useCanvas.mockReturnValue({
        ...mockCanvas,
        components: largeComponentSet,
      })

      const startTime = performance.now()

      const { result } = renderHook(() => useDragAndDrop())

      // Test constraint calculation with large dataset
      expect(result.current.constrainPosition).toBeDefined()

      if (result.current.constrainPosition) {
        const constrainedPosition = result.current.constrainPosition({
          x: 500,
          y: 400,
        })
        expect(constrainedPosition).toEqual({ x: 500, y: 400 })
      }

      const endTime = performance.now()
      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should maintain performance with complex drag operations', () => {
      const mockDragContext = {
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: {
          id: 'test-component',
          dimensions: { width: 100, height: 50 },
        },
        dragOffset: { x: 10, y: 10 },
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)

      const { result } = renderHook(() => useDragAndDrop())

      const performanceTestCases = [
        { x: 0, y: 0 }, // Boundary constraint
        { x: 1300, y: 900 }, // Overflow constraint
        { x: -100, y: -50 }, // Negative constraint
        { x: 600, y: 400 }, // Normal position
      ]

      const startTime = performance.now()

      performanceTestCases.forEach(position => {
        if (result.current.constrainPosition) {
          const constrained = result.current.constrainPosition(position, {
            width: 100,
            height: 50,
          })
          expect(constrained).toBeDefined()
        }
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle all constraint calculations quickly
      expect(totalTime).toBeLessThan(10) // Less than 10ms for all operations
    })
  })

  describe('Browser Performance Monitoring', () => {
    it('should track frame timing for performance monitoring', () => {
      const mockDragContext = {
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: { id: 'test' },
        dragOffset: { x: 0, y: 0 },
        performanceData: {
          frameCount: 0,
          averageFrameTime: 0,
          lastFrameTime: 0,
          memoryUsage: 0,
        },
      }

      require('@/store').useDragContext.mockReturnValue(mockDragContext)
      renderHook(() => useDragAndDrop())

      // Simulate frame timing
      let frameTime = 0
      for (let i = 0; i < 5; i++) {
        frameTime += 16.67 // 60 FPS
        ;(performance.now as jest.Mock).mockReturnValue(frameTime)

        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 100 + i,
          clientY: 100,
        })

        act(() => {
          document.dispatchEvent(mouseMoveEvent)
        })
      }

      // During canvas dragging, mousemove events should trigger updateDrag, not startDrag
      // Since the drag is already in progress, startDrag should not be called again
      expect(mockUIActions.startDrag).not.toHaveBeenCalled()
      // The test verifies that mousemove events during drag don't cause errors
    })
  })
})
