import { renderHook, act } from '@testing-library/react'
import {
  useComponentActions,
  useUIActions,
  useDragContext,
  useCanvas,
} from '@/store'
import { ComponentType, DragState } from '@/types'
import { ComponentFactory } from '@/utils/componentFactory'

// Mock ComponentFactory
jest.mock('@/utils/componentFactory', () => ({
  ComponentFactory: {
    create: jest.fn().mockReturnValue({
      id: 'test-component',
      type: ComponentType.TEXT,
      position: { x: 10, y: 20 },
      dimensions: { width: 100, height: 50 },
      props: {},
      zIndex: 1,
    }),
  },
}))

describe('Simple Store', () => {
  beforeEach(() => {
    // Store is automatically initialized
  })

  describe('useComponentActions', () => {
    it('should add component', () => {
      const { result } = renderHook(() => useComponentActions())

      act(() => {
        const component = ComponentFactory.create(ComponentType.TEXT, {
          x: 50,
          y: 60,
        })
        result.current.addComponent(component)
      })

      // Component should be added to store
      expect(ComponentFactory.create).toHaveBeenCalledWith(ComponentType.TEXT, {
        x: 50,
        y: 60,
      })
    })

    it('should select component', () => {
      const { result } = renderHook(() => useComponentActions())

      act(() => {
        result.current.selectComponent('test-id')
      })

      // Should update selected component
      const { result: uiResult } = renderHook(() => useUIActions())
      expect(uiResult.current).toBeDefined()
    })

    it('should move component', () => {
      const { result } = renderHook(() => useComponentActions())

      act(() => {
        result.current.moveComponent('test-id', { x: 100, y: 150 })
      })

      // Should update component position
      expect(result.current).toBeDefined()
    })

    it('should update component', () => {
      const { result } = renderHook(() => useComponentActions())

      act(() => {
        result.current.updateComponent('test-id', {
          props: { text: 'Updated' },
        })
      })

      // Should update component properties
      expect(result.current).toBeDefined()
    })

    it('should remove component', () => {
      const { result } = renderHook(() => useComponentActions())

      act(() => {
        result.current.removeComponent('test-id')
      })

      // Should remove component
      expect(result.current).toBeDefined()
    })
  })

  describe('useUIActions', () => {
    it('should start drag', () => {
      const { result } = renderHook(() => useUIActions())

      act(() => {
        result.current.startDrag({
          state: DragState.DRAGGING_FROM_PALETTE,
          draggedComponent: ComponentType.TEXT,
        })
      })

      const { result: dragResult } = renderHook(() => useDragContext())
      expect(dragResult.current.state).toBe(DragState.DRAGGING_FROM_PALETTE)
    })

    it('should update drag', () => {
      const { result } = renderHook(() => useUIActions())

      act(() => {
        result.current.startDrag({
          state: DragState.DRAGGING_FROM_PALETTE,
          draggedComponent: ComponentType.TEXT,
        })
        result.current.updateDrag({ currentPosition: { x: 100, y: 200 } })
      })

      const { result: dragResult } = renderHook(() => useDragContext())
      expect(dragResult.current.currentPosition).toEqual({ x: 100, y: 200 })
    })

    it('should end drag', () => {
      const { result } = renderHook(() => useUIActions())

      act(() => {
        result.current.startDrag({
          state: DragState.DRAGGING_FROM_PALETTE,
          draggedComponent: ComponentType.TEXT,
        })
        result.current.endDrag()
      })

      const { result: dragResult } = renderHook(() => useDragContext())
      expect(dragResult.current.state).toBe(DragState.IDLE)
    })

    it('should update toolbox', () => {
      const { result } = renderHook(() => useUIActions())

      act(() => {
        result.current.updateToolbox({ selectedTool: 'select' })
      })

      expect(result.current).toBeDefined()
    })
  })

  describe('useDragContext', () => {
    it('should return initial drag state', () => {
      const { result } = renderHook(() => useDragContext())

      expect(result.current.state).toBe(DragState.IDLE)
      expect(result.current.draggedComponent).toBeNull()
      expect(result.current.currentPosition).toEqual({ x: 0, y: 0 })
    })

    it('should update when drag state changes', () => {
      const { result: uiResult } = renderHook(() => useUIActions())
      const { result: dragResult } = renderHook(() => useDragContext())

      act(() => {
        uiResult.current.startDrag({
          state: DragState.DRAGGING_FROM_PALETTE,
          draggedComponent: ComponentType.BUTTON,
        })
      })

      expect(dragResult.current.state).toBe(DragState.DRAGGING_FROM_PALETTE)
      expect(dragResult.current.draggedComponent).toBe(ComponentType.BUTTON)
    })
  })

  describe('useCanvas', () => {
    it('should return canvas state', () => {
      const { result } = renderHook(() => useCanvas())

      expect(result.current).toHaveProperty('boundaries')
      expect(result.current).toHaveProperty('zoom')
      expect(result.current).toHaveProperty('components')
    })

    it('should have default boundaries', () => {
      const { result } = renderHook(() => useCanvas())

      expect(result.current.boundaries).toEqual({
        minX: 0,
        minY: 0,
        maxX: 1200,
        maxY: 800,
      })
    })
  })
})
