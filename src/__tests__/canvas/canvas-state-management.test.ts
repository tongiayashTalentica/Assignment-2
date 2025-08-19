import { renderHook, act } from '@testing-library/react'
import { useCanvas, useCanvasActions } from '@/store'

// Note: Since we're testing store hooks, we need to test the actual behavior
// These tests verify that canvas state management works correctly

describe('Canvas State Management', () => {
  beforeEach(() => {
    // Reset store state before each test
    jest.clearAllMocks()
  })

  it('initializes with default canvas state', () => {
    const { result } = renderHook(() => useCanvas())

    expect(result.current.zoom).toBe(1)
    expect(result.current.dimensions).toEqual({ width: 1200, height: 800 })
    expect(result.current.grid.visible).toBe(true)
    expect(result.current.grid.snapToGrid).toBe(true)
    expect(result.current.boundaries).toEqual({
      minX: 0,
      minY: 0,
      maxX: 1200,
      maxY: 800,
    })
  })

  it('handles zoom changes correctly', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    act(() => {
      actionsResult.current.setZoom(1.5)
    })

    expect(canvasResult.current.zoom).toBe(1.5)
  })

  it('constrains zoom within valid range', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    // Test minimum zoom constraint
    act(() => {
      actionsResult.current.setZoom(0.1)
    })
    expect(canvasResult.current.zoom).toBe(0.1)

    // Test maximum zoom constraint
    act(() => {
      actionsResult.current.setZoom(5)
    })
    expect(canvasResult.current.zoom).toBe(5)

    // Test values outside range
    act(() => {
      actionsResult.current.setZoom(0.05) // Below minimum
    })
    expect(canvasResult.current.zoom).toBe(0.1)

    act(() => {
      actionsResult.current.setZoom(10) // Above maximum
    })
    expect(canvasResult.current.zoom).toBe(5)
  })

  it('handles grid configuration updates', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    // Toggle grid visibility
    act(() => {
      actionsResult.current.updateGrid({ visible: false })
    })
    expect(canvasResult.current.grid.visible).toBe(false)

    // Toggle snap to grid
    act(() => {
      actionsResult.current.updateGrid({ snapToGrid: false })
    })
    expect(canvasResult.current.grid.snapToGrid).toBe(false)

    // Update grid size
    act(() => {
      actionsResult.current.updateGrid({ size: 10 })
    })
    expect(canvasResult.current.grid.size).toBe(10)
  })

  it('handles canvas dimension changes', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    act(() => {
      actionsResult.current.updateCanvasDimensions({
        width: 1600,
        height: 1200,
      })
    })

    expect(canvasResult.current.dimensions).toEqual({
      width: 1600,
      height: 1200,
    })
    // Boundaries should also update
    expect(canvasResult.current.boundaries.maxX).toBe(1600)
    expect(canvasResult.current.boundaries.maxY).toBe(1200)
  })

  it('handles viewport updates', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    act(() => {
      actionsResult.current.updateViewport({ x: 100, y: 50 })
    })

    expect(canvasResult.current.viewport.x).toBe(100)
    expect(canvasResult.current.viewport.y).toBe(50)
  })

  it('handles boundary updates', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    const newBoundaries = {
      minX: 10,
      minY: 10,
      maxX: 1000,
      maxY: 600,
    }

    act(() => {
      actionsResult.current.setBoundaries(newBoundaries)
    })

    expect(canvasResult.current.boundaries).toEqual(newBoundaries)
  })

  it('maintains canvas state consistency', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    // Perform multiple state changes
    act(() => {
      actionsResult.current.setZoom(2)
      actionsResult.current.updateGrid({ visible: false, size: 25 })
      actionsResult.current.updateCanvasDimensions({ width: 800, height: 600 })
    })

    // Verify all changes are applied correctly
    expect(canvasResult.current.zoom).toBe(2)
    expect(canvasResult.current.grid.visible).toBe(false)
    expect(canvasResult.current.grid.size).toBe(25)
    expect(canvasResult.current.dimensions).toEqual({ width: 800, height: 600 })
    expect(canvasResult.current.boundaries.maxX).toBe(800)
    expect(canvasResult.current.boundaries.maxY).toBe(600)
  })

  it('preserves other grid settings during partial updates', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    // Get initial grid state
    const initialGrid = canvasResult.current.grid

    // Update only visibility
    act(() => {
      actionsResult.current.updateGrid({ visible: false })
    })

    // Other properties should remain unchanged
    expect(canvasResult.current.grid.snapToGrid).toBe(initialGrid.snapToGrid)
    expect(canvasResult.current.grid.size).toBe(initialGrid.size)
    expect(canvasResult.current.grid.enabled).toBe(initialGrid.enabled)
    expect(canvasResult.current.grid.visible).toBe(false)
  })

  it('handles viewport partial updates correctly', () => {
    const { result: canvasResult } = renderHook(() => useCanvas())
    const { result: actionsResult } = renderHook(() => useCanvasActions())

    // Get initial viewport
    const initialViewport = canvasResult.current.viewport

    // Update only x coordinate
    act(() => {
      actionsResult.current.updateViewport({ x: 200 })
    })

    // Other viewport properties should remain unchanged
    expect(canvasResult.current.viewport.x).toBe(200)
    expect(canvasResult.current.viewport.y).toBe(initialViewport.y)
    expect(canvasResult.current.viewport.width).toBe(initialViewport.width)
    expect(canvasResult.current.viewport.height).toBe(initialViewport.height)
  })
})
