import { useAppStore } from '@/store/index'
import { renderHook, act } from '@testing-library/react'
import { ComponentType, DragState } from '@/types'
import { ComponentFactory } from '@/utils/componentFactory'

// Mock ComponentFactory
jest.mock('@/utils/componentFactory', () => ({
  ComponentFactory: {
    create: jest.fn().mockReturnValue({
      id: 'test-component',
      type: ComponentType.TEXT,
      position: { x: 100, y: 100 },
      dimensions: { width: 200, height: 50 },
      props: { text: 'Test Text' },
      zIndex: 1,
      constraints: {
        movable: true,
        resizable: true,
        deletable: true,
        copyable: true,
      },
      metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
    }),
  },
}))

describe('Main Store (index.ts)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      isLoading: false,
      error: null,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAppStore(state => state))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.layout).toBeDefined()
    expect(result.current.application).toBeDefined()
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        isLoading: state.isLoading,
        setLoading: state.setLoading,
      }))
    )

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle error state', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        error: state.error,
        setError: state.setError,
      }))
    )

    act(() => {
      result.current.setError('Test error')
    })

    expect(result.current.error).toBe('Test error')
  })

  it('should handle layout updates', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        layout: state.layout,
        updateLayout: state.updateLayout,
      }))
    )

    act(() => {
      result.current.updateLayout({ leftPanelWidth: 25 })
    })

    expect(result.current.layout.leftPanelWidth).toBe(25)
  })

  it('should handle component operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        addComponent: state.addComponent,
        removeComponent: state.removeComponent,
        getComponents: state.getComponents,
      }))
    )

    act(() => {
      const component = ComponentFactory.create(ComponentType.TEXT, {
        x: 100,
        y: 100,
      })
      result.current.addComponent(component)
    })

    const components = result.current.getComponents()
    expect(components.size).toBeGreaterThan(0)
  })

  it('should handle drag operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        startDrag: state.startDrag,
        updateDrag: state.updateDrag,
        endDrag: state.endDrag,
        application: state.application,
      }))
    )

    act(() => {
      result.current.startDrag({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      })
    })

    expect(result.current.application.ui.dragContext.state).toBe(
      DragState.DRAGGING_FROM_PALETTE
    )
  })

  it('should handle canvas operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        updateCanvasDimensions: state.updateCanvasDimensions,
        setZoom: state.setZoom,
        application: state.application,
      }))
    )

    act(() => {
      result.current.updateCanvasDimensions({ width: 1920, height: 1080 })
      result.current.setZoom(1.5)
    })

    expect(result.current.application.canvas.dimensions.width).toBe(1920)
    expect(result.current.application.canvas.zoom).toBe(1.5)
  })

  it('should handle selection operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        selectComponent: state.selectComponent,
        deselectComponent: state.deselectComponent,
        clearSelection: state.clearSelection,
        application: state.application,
      }))
    )

    act(() => {
      result.current.selectComponent('test-component')
    })

    expect(result.current.application.canvas.selectedComponentIds).toContain(
      'test-component'
    )

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.application.canvas.selectedComponentIds).toHaveLength(
      0
    )
  })

  it('should handle history operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        undo: state.undo,
        redo: state.redo,
        takeSnapshot: state.takeSnapshot,
        application: state.application,
      }))
    )

    act(() => {
      result.current.takeSnapshot('Test snapshot')
    })

    expect(result.current.application.history.past.length).toBeGreaterThan(0)
  })

  it('should handle persistence operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        saveProject: state.saveProject,
        loadProject: state.loadProject,
        exportProject: state.exportProject,
        application: state.application,
      }))
    )

    expect(typeof result.current.saveProject).toBe('function')
    expect(typeof result.current.loadProject).toBe('function')
    expect(typeof result.current.exportProject).toBe('function')
  })

  it('should handle UI state updates', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        setActivePanel: state.setActivePanel,
        togglePanelVisibility: state.togglePanelVisibility,
        updatePreferences: state.updatePreferences,
        application: state.application,
      }))
    )

    act(() => {
      result.current.updatePreferences({ theme: 'dark' })
    })

    expect(result.current.application.ui.preferences.theme).toBe('dark')
  })

  it('should handle performance monitoring', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        recordPerformanceMetric: state.recordPerformanceMetric,
        getPerformanceMetrics: state.getPerformanceMetrics,
      }))
    )

    expect(typeof result.current.recordPerformanceMetric).toBe('function')
    expect(typeof result.current.getPerformanceMetrics).toBe('function')
  })

  it('should handle keyboard operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        handleKeyDown: state.handleKeyDown,
        handleKeyUp: state.handleKeyUp,
      }))
    )

    expect(typeof result.current.handleKeyDown).toBe('function')
    expect(typeof result.current.handleKeyUp).toBe('function')
  })

  it('should handle bulk operations', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        duplicateComponent: state.duplicateComponent,
        moveComponent: state.moveComponent,
        resizeComponent: state.resizeComponent,
      }))
    )

    expect(typeof result.current.duplicateComponent).toBe('function')
    expect(typeof result.current.moveComponent).toBe('function')
    expect(typeof result.current.resizeComponent).toBe('function')
  })

  it('should handle validation', () => {
    const { result } = renderHook(() =>
      useAppStore(state => ({
        validateState: state.validateState,
        sanitizeState: state.sanitizeState,
      }))
    )

    expect(typeof result.current.validateState).toBe('function')
    expect(typeof result.current.sanitizeState).toBe('function')
  })

  describe('Edge cases', () => {
    it('should handle null/undefined operations gracefully', () => {
      const { result } = renderHook(() =>
        useAppStore(state => ({
          addComponent: state.addComponent,
          removeComponent: state.removeComponent,
        }))
      )

      expect(() => {
        act(() => {
          result.current.removeComponent('non-existent-id')
        })
      }).not.toThrow()
    })

    it('should maintain state consistency during rapid updates', () => {
      const { result } = renderHook(() =>
        useAppStore(state => ({
          setLoading: state.setLoading,
          setError: state.setError,
          isLoading: state.isLoading,
          error: state.error,
        }))
      )

      act(() => {
        result.current.setLoading(true)
        result.current.setError('Error 1')
        result.current.setLoading(false)
        result.current.setError(null)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })
})
