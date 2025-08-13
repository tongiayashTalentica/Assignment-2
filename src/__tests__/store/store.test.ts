import { renderHook, act } from '@testing-library/react'
import {
  useAppStore,
  useComponents,
  useCanvas,
  useUIState,
  useHistory,
  usePersistence,
  useComponentActions,
  useCanvasActions,
  useUIActions,
  useHistoryActions,
  usePersistenceActions,
} from '@/store'
import {
  ComponentType,
  DragType,
  PanelType,
  PreviewMode,
  ModalType,
} from '@/types'
import { createComponent } from '@/utils/componentUtils'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    },
  },
})

describe('Store - Main Store Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearHistory()
    useAppStore.setState({
      isLoading: false,
      error: null,
      layout: {
        leftPanelWidth: 20,
        centerPanelWidth: 60,
        rightPanelWidth: 20,
      },
    })

    // Clear localStorage mocks
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAppStore())
      const state = result.current

      expect(state.isLoading).toBe(false)
      expect(state.error).toBe(null)
      expect(state.layout).toEqual({
        leftPanelWidth: 20,
        centerPanelWidth: 60,
        rightPanelWidth: 20,
      })
      expect(state.application.canvas.components.size).toBe(0)
      expect(state.application.canvas.selectedComponentIds).toEqual([])
      expect(state.application.canvas.zoom).toBe(1)
      expect(state.application.ui.dragContext.isDragging).toBe(false)
      expect(state.application.history.canUndo).toBe(false)
      expect(state.application.history.canRedo).toBe(false)
    })

    it('should have correct canvas initial state', () => {
      const { result } = renderHook(() => useCanvas())
      const canvas = result.current

      expect(canvas.components).toBeInstanceOf(Map)
      expect(canvas.selectedComponentIds).toEqual([])
      expect(canvas.focusedComponentId).toBe(null)
      expect(canvas.dimensions).toEqual({ width: 1200, height: 800 })
      expect(canvas.zoom).toBe(1)
      expect(canvas.grid.enabled).toBe(true)
      expect(canvas.grid.size).toBe(20)
    })

    it('should have correct UI initial state', () => {
      const { result } = renderHook(() => useUIState())
      const ui = result.current

      expect(ui.dragContext.isDragging).toBe(false)
      expect(ui.dragContext.dragType).toBe(DragType.NONE)
      expect(ui.activePanel).toBe(PanelType.PALETTE)
      expect(ui.previewMode).toBe(PreviewMode.DESIGN)
      expect(ui.modals.activeModal).toBe(null)
      expect(ui.preferences.theme).toBe('light')
      expect(ui.preferences.autoSave).toBe(true)
    })
  })

  describe('Component Actions', () => {
    it('should add component correctly', () => {
      const { result } = renderHook(() => ({
        components: useComponents(),
        actions: useComponentActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      act(() => {
        result.current.actions.addComponent(testComponent)
      })

      expect(result.current.components.has(testComponent.id)).toBe(true)
      expect(result.current.components.get(testComponent.id)).toEqual(
        testComponent
      )
    })

    it('should remove component correctly', () => {
      const { result } = renderHook(() => ({
        components: useComponents(),
        actions: useComponentActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      act(() => {
        result.current.actions.addComponent(testComponent)
      })

      expect(result.current.components.has(testComponent.id)).toBe(true)

      act(() => {
        result.current.actions.removeComponent(testComponent.id)
      })

      expect(result.current.components.has(testComponent.id)).toBe(false)
    })

    it('should update component correctly', () => {
      const { result } = renderHook(() => ({
        components: useComponents(),
        actions: useComponentActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      act(() => {
        result.current.actions.addComponent(testComponent)
      })

      const updates = {
        position: { x: 150, y: 150 },
        props: { content: 'Updated text' },
      }

      act(() => {
        result.current.actions.updateComponent(testComponent.id, updates)
      })

      const updatedComponent = result.current.components.get(testComponent.id)
      expect(updatedComponent?.position).toEqual({ x: 150, y: 150 })
      expect(updatedComponent?.props.content).toBe('Updated text')
      expect(updatedComponent?.metadata?.version).toBe(2)
    })

    it('should select component correctly', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useComponentActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      act(() => {
        result.current.actions.addComponent(testComponent)
        result.current.actions.selectComponent(testComponent.id)
      })

      expect(result.current.canvas.selectedComponentIds).toContain(
        testComponent.id
      )
      expect(result.current.canvas.focusedComponentId).toBe(testComponent.id)
    })

    it('should handle multi-select correctly', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useComponentActions(),
      }))

      const component1 = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 40 }
      )
      const component2 = createComponent(
        ComponentType.BUTTON,
        { x: 100, y: 0 },
        { width: 100, height: 40 }
      )

      act(() => {
        result.current.actions.addComponent(component1)
        result.current.actions.addComponent(component2)
        result.current.actions.selectComponent(component1.id)
        result.current.actions.selectComponent(component2.id, true) // Multi-select
      })

      expect(result.current.canvas.selectedComponentIds).toHaveLength(2)
      expect(result.current.canvas.selectedComponentIds).toContain(
        component1.id
      )
      expect(result.current.canvas.selectedComponentIds).toContain(
        component2.id
      )
    })

    it('should move component with boundary constraints', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useComponentActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      act(() => {
        result.current.actions.addComponent(testComponent)
      })

      // Try to move outside boundaries
      act(() => {
        result.current.actions.moveComponent(testComponent.id, {
          x: -50,
          y: -50,
        })
      })

      const movedComponent = result.current.canvas.components.get(
        testComponent.id
      )
      expect(movedComponent?.position.x).toBe(0) // Constrained to boundary
      expect(movedComponent?.position.y).toBe(0) // Constrained to boundary
    })

    it('should resize component with dimension constraints', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useComponentActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40, minWidth: 50, minHeight: 20 }
      )

      act(() => {
        result.current.actions.addComponent(testComponent)
      })

      // Try to resize below minimum
      act(() => {
        result.current.actions.resizeComponent(testComponent.id, {
          width: 10, // Below minimum
          height: 10, // Below minimum
          minWidth: 50,
          minHeight: 20,
        })
      })

      const resizedComponent = result.current.canvas.components.get(
        testComponent.id
      )
      expect(resizedComponent?.dimensions.width).toBe(50) // Constrained to minimum
      expect(resizedComponent?.dimensions.height).toBe(20) // Constrained to minimum
    })
  })

  describe('Canvas Actions', () => {
    it('should update canvas dimensions', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useCanvasActions(),
      }))

      act(() => {
        result.current.actions.updateCanvasDimensions({
          width: 1600,
          height: 1200,
        })
      })

      expect(result.current.canvas.dimensions).toEqual({
        width: 1600,
        height: 1200,
      })
      expect(result.current.canvas.boundaries.maxX).toBe(1600)
      expect(result.current.canvas.boundaries.maxY).toBe(1200)
    })

    it('should update viewport', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useCanvasActions(),
      }))

      act(() => {
        result.current.actions.updateViewport({ x: 100, y: 50 })
      })

      expect(result.current.canvas.viewport.x).toBe(100)
      expect(result.current.canvas.viewport.y).toBe(50)
    })

    it('should set zoom with constraints', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useCanvasActions(),
      }))

      // Test minimum zoom constraint
      act(() => {
        result.current.actions.setZoom(0.05) // Below minimum
      })
      expect(result.current.canvas.zoom).toBe(0.1)

      // Test maximum zoom constraint
      act(() => {
        result.current.actions.setZoom(10) // Above maximum
      })
      expect(result.current.canvas.zoom).toBe(5)

      // Test normal zoom
      act(() => {
        result.current.actions.setZoom(1.5)
      })
      expect(result.current.canvas.zoom).toBe(1.5)
    })

    it('should update grid settings', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useCanvasActions(),
      }))

      act(() => {
        result.current.actions.updateGrid({
          enabled: false,
          size: 10,
          snapToGrid: false,
        })
      })

      expect(result.current.canvas.grid.enabled).toBe(false)
      expect(result.current.canvas.grid.size).toBe(10)
      expect(result.current.canvas.grid.snapToGrid).toBe(false)
    })
  })

  describe('UI Actions', () => {
    it('should handle drag operations', () => {
      const { result } = renderHook(() => ({
        ui: useUIState(),
        actions: useUIActions(),
      }))

      act(() => {
        result.current.actions.startDrag({
          dragType: DragType.COMPONENT,
          draggedComponentId: 'test-component',
        })
      })

      expect(result.current.ui.dragContext.isDragging).toBe(true)
      expect(result.current.ui.dragContext.dragType).toBe(DragType.COMPONENT)
      expect(result.current.ui.dragContext.draggedComponentId).toBe(
        'test-component'
      )

      act(() => {
        result.current.actions.updateDrag({
          currentPosition: { x: 100, y: 100 },
        })
      })

      expect(result.current.ui.dragContext.currentPosition).toEqual({
        x: 100,
        y: 100,
      })

      act(() => {
        result.current.actions.endDrag()
      })

      expect(result.current.ui.dragContext.isDragging).toBe(false)
      expect(result.current.ui.dragContext.dragType).toBe(DragType.NONE)
    })

    it('should manage panel visibility', () => {
      const { result } = renderHook(() => ({
        ui: useUIState(),
        actions: useUIActions(),
      }))

      expect(result.current.ui.panelVisibility.properties).toBe(true)

      act(() => {
        result.current.actions.togglePanelVisibility('properties')
      })

      expect(result.current.ui.panelVisibility.properties).toBe(false)

      act(() => {
        result.current.actions.togglePanelVisibility('properties')
      })

      expect(result.current.ui.panelVisibility.properties).toBe(true)
    })

    it('should handle modal operations', () => {
      const { result } = renderHook(() => ({
        ui: useUIState(),
        actions: useUIActions(),
      }))

      const modalData = { componentId: 'test-component' }

      act(() => {
        result.current.actions.openModal(
          ModalType.COMPONENT_PROPERTIES,
          modalData
        )
      })

      expect(result.current.ui.modals.activeModal).toBe(
        ModalType.COMPONENT_PROPERTIES
      )
      expect(result.current.ui.modals.modalData).toEqual(modalData)

      act(() => {
        result.current.actions.closeModal()
      })

      expect(result.current.ui.modals.activeModal).toBe(null)
      expect(result.current.ui.modals.modalData).toEqual({})
    })

    it('should update preferences', () => {
      const { result } = renderHook(() => ({
        ui: useUIState(),
        actions: useUIActions(),
      }))

      act(() => {
        result.current.actions.updatePreferences({
          theme: 'dark',
          autoSave: false,
          showGrid: false,
        })
      })

      expect(result.current.ui.preferences.theme).toBe('dark')
      expect(result.current.ui.preferences.autoSave).toBe(false)
      expect(result.current.ui.preferences.showGrid).toBe(false)
    })
  })

  describe('History Actions', () => {
    it('should handle undo/redo operations', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        history: useHistory(),
        componentActions: useComponentActions(),
        historyActions: useHistoryActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      // Add component (should create history entry)
      act(() => {
        result.current.componentActions.addComponent(testComponent)
      })

      expect(result.current.canvas.components.has(testComponent.id)).toBe(true)
      expect(result.current.history.canUndo).toBe(true)
      expect(result.current.history.canRedo).toBe(false)

      // Undo the addition
      act(() => {
        result.current.historyActions.undo()
      })

      expect(result.current.canvas.components.has(testComponent.id)).toBe(false)
      expect(result.current.history.canUndo).toBe(false)
      expect(result.current.history.canRedo).toBe(true)

      // Redo the addition
      act(() => {
        result.current.historyActions.redo()
      })

      expect(result.current.canvas.components.has(testComponent.id)).toBe(true)
      expect(result.current.history.canUndo).toBe(true)
      expect(result.current.history.canRedo).toBe(false)
    })

    it('should limit history size', () => {
      const { result } = renderHook(() => ({
        history: useHistory(),
        componentActions: useComponentActions(),
        historyActions: useHistoryActions(),
      }))

      // Set small history limit
      act(() => {
        result.current.historyActions.setMaxHistorySize(2)
      })

      // Add multiple components to exceed history limit
      for (let i = 0; i < 5; i++) {
        const component = createComponent(
          ComponentType.TEXT,
          { x: i * 100, y: 100 },
          { width: 200, height: 40 }
        )

        act(() => {
          result.current.componentActions.addComponent(component)
        })
      }

      // History should be limited to max size
      expect(result.current.history.past.length).toBeLessThanOrEqual(2)
    })

    it('should clear history', () => {
      const { result } = renderHook(() => ({
        history: useHistory(),
        componentActions: useComponentActions(),
        historyActions: useHistoryActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      act(() => {
        result.current.componentActions.addComponent(testComponent)
      })

      expect(result.current.history.canUndo).toBe(true)

      act(() => {
        result.current.historyActions.clearHistory()
      })

      expect(result.current.history.canUndo).toBe(false)
      expect(result.current.history.canRedo).toBe(false)
      expect(result.current.history.past).toHaveLength(0)
      expect(result.current.history.future).toHaveLength(0)
    })
  })

  describe('Persistence Actions', () => {
    it('should save project to localStorage', async () => {
      const { result } = renderHook(() => ({
        persistence: usePersistence(),
        actions: usePersistenceActions(),
      }))

      await act(async () => {
        await result.current.actions.saveProject()
      })

      expect(localStorageMock.setItem).toHaveBeenCalled()
      expect(result.current.persistence.isDirty).toBe(false)
      expect(result.current.persistence.lastSaved).toBeDefined()
    })

    it('should create new project', async () => {
      const { result } = renderHook(() => ({
        persistence: usePersistence(),
        actions: usePersistenceActions(),
      }))

      await act(async () => {
        await result.current.actions.createProject(
          'Test Project',
          'Test description'
        )
      })

      expect(result.current.persistence.currentProject).toBeDefined()
      expect(result.current.persistence.currentProject?.name).toBe(
        'Test Project'
      )
      expect(result.current.persistence.currentProject?.description).toBe(
        'Test description'
      )
      expect(result.current.persistence.isDirty).toBe(false)
    })

    it('should handle auto-save settings', () => {
      const { result } = renderHook(() => ({
        persistence: usePersistence(),
        actions: usePersistenceActions(),
      }))

      act(() => {
        result.current.actions.setAutoSave(false)
      })

      expect(result.current.persistence.autoSaveEnabled).toBe(false)

      act(() => {
        result.current.actions.setAutoSaveInterval(60000)
      })

      expect(result.current.persistence.autoSaveInterval).toBe(60000)
    })

    it('should export project as JSON', async () => {
      const { result } = renderHook(() => ({
        actions: usePersistenceActions(),
      }))

      let exportedData: string = ''

      await act(async () => {
        exportedData = await result.current.actions.exportProject('json')
      })

      expect(exportedData).toBeDefined()
      expect(() => JSON.parse(exportedData)).not.toThrow()
    })
  })

  describe('State Immutability', () => {
    it('should maintain immutability in component updates', () => {
      const { result } = renderHook(() => ({
        components: useComponents(),
        actions: useComponentActions(),
      }))

      const testComponent = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      act(() => {
        result.current.actions.addComponent(testComponent)
      })

      const originalComponent = result.current.components.get(testComponent.id)
      const originalPosition = originalComponent?.position

      act(() => {
        result.current.actions.updateComponent(testComponent.id, {
          position: { x: 150, y: 150 },
        })
      })

      const updatedComponent = result.current.components.get(testComponent.id)

      // Original position object should not be mutated
      expect(originalPosition).toEqual({ x: 100, y: 100 })
      expect(updatedComponent?.position).toEqual({ x: 150, y: 150 })
      expect(updatedComponent?.position).not.toBe(originalPosition)
    })

    it('should maintain immutability in canvas state updates', () => {
      const { result } = renderHook(() => ({
        canvas: useCanvas(),
        actions: useCanvasActions(),
      }))

      const originalDimensions = result.current.canvas.dimensions

      act(() => {
        result.current.actions.updateCanvasDimensions({
          width: 1600,
          height: 1200,
        })
      })

      // Original dimensions object should not be mutated
      expect(originalDimensions).toEqual({ width: 1200, height: 800 })
      expect(result.current.canvas.dimensions).toEqual({
        width: 1600,
        height: 1200,
      })
      expect(result.current.canvas.dimensions).not.toBe(originalDimensions)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => ({
        appState: useAppStore(state => ({
          isLoading: state.isLoading,
          error: state.error,
        })),
        actions: usePersistenceActions(),
      }))

      await act(async () => {
        await result.current.actions.saveProject()
      })

      expect(result.current.appState.error).toContain('Failed to save project')
    })

    it('should handle component validation errors', () => {
      const { result } = renderHook(() => ({
        actions: useComponentActions(),
      }))

      // This should not throw, even with invalid component data
      expect(() => {
        act(() => {
          result.current.actions.addComponent({
            id: '',
            type: ComponentType.TEXT,
            position: { x: 0, y: 0 },
            dimensions: { width: 0, height: 0 },
            props: {},
            zIndex: 0,
          } as any)
        })
      }).not.toThrow()
    })
  })
})
