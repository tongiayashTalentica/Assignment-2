// Simple store to fix syntax errors
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'

enableMapSet()

import type {
  StoreActions,
  BaseComponent,
  DragContext,
  Position,
} from '@/types'
import { DragState, PanelType, PreviewMode } from '@/types'

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Simple initial state
const initialState = {
  isLoading: false,
  error: null,
  layout: {
    leftPanelWidth: 20,
    centerPanelWidth: 60,
    rightPanelWidth: 20,
  },
  application: {
    canvas: {
      components: new Map(),
      selectedComponentIds: [],
      focusedComponentId: null,
      dimensions: { width: 1200, height: 800 },
      viewport: { x: 0, y: 0, width: 1200, height: 800 },
      zoom: 1,
      grid: {
        enabled: true,
        size: 20,
        snapToGrid: true,
        visible: true,
      },
      boundaries: {
        minX: 0,
        minY: 0,
        maxX: 1200,
        maxY: 800,
      },
    },
    ui: {
      dragContext: {
        state: DragState.IDLE,
        draggedComponent: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetElement: null,
        dragOffset: { x: 0, y: 0 },
        isDragValid: false,
      },
      activePanel: PanelType.PALETTE,
      panelVisibility: {
        palette: true,
        properties: true,
        layers: false,
        assets: false,
      },
      previewMode: PreviewMode.DESIGN,
      modals: {
        activeModal: null,
      },
      preferences: {
        theme: 'light' as const,
        language: 'en',
        autoSave: true,
        showGrid: true,
        snapToGrid: true,
        showRulers: false,
      },
      toolbox: {
        activeCategory: null,
        searchQuery: '',
        recentComponents: [],
      },
    },
    history: {
      past: [],
      present: {
        id: generateId(),
        timestamp: new Date(),
        components: new Map(),
        selectedComponentIds: [],
        canvasDimensions: { width: 1200, height: 800 },
        viewport: { x: 0, y: 0, width: 1200, height: 800 },
        zoom: 1,
      },
      future: [],
      maxHistorySize: 50,
      canUndo: false,
      canRedo: false,
    },
    persistence: {
      currentProject: null,
      isDirty: false,
      lastSaved: null,
      autoSaveEnabled: true,
      autoSaveInterval: 30000,
      savingInProgress: false,
      projectList: [],
    },
  },
} as const

type Store = typeof initialState & StoreActions

export const useAppStore = create<Store>()(
  devtools(
    immer((set, _get) => ({
      ...initialState,

      // General actions
      setLoading: (loading: boolean) =>
        set(state => {
          state.isLoading = loading
        }),

      setError: (error: string | null) =>
        set(state => {
          state.error = error
        }),

      // Layout actions
      updateLayout: layoutUpdate =>
        set(state => {
          Object.assign(state.layout, layoutUpdate)
        }),

      // Component actions
      addComponent: (component: BaseComponent, _addToHistory = true) =>
        set(state => {
          const fullComponent: BaseComponent = {
            ...component,
            zIndex:
              component.zIndex ??
              Math.max(
                0,
                ...Array.from(state.application.canvas.components.values()).map(
                  (c: any) => c.zIndex
                )
              ) + 1,
            constraints: component.constraints ?? {
              movable: true,
              resizable: true,
              deletable: true,
              copyable: true,
            },
            metadata: component.metadata ?? {
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 1,
            },
          }

          state.application.canvas.components.set(component.id, fullComponent)
          state.application.persistence.isDirty = true
        }),

      removeComponent: (id: string, _addToHistory = true) =>
        set(state => {
          if (state.application.canvas.components.has(id)) {
            state.application.canvas.components.delete(id)

            const selectionIndex =
              state.application.canvas.selectedComponentIds.indexOf(id)
            if (selectionIndex > -1) {
              state.application.canvas.selectedComponentIds.splice(
                selectionIndex,
                1
              )
            }

            if (state.application.canvas.focusedComponentId === id) {
              state.application.canvas.focusedComponentId = null
            }

            state.application.persistence.isDirty = true
          }
        }),

      updateComponent: (id: string, updates, _addToHistory = true) =>
        set(state => {
          const component = state.application.canvas.components.get(id)
          if (component) {
            const updatedComponent = {
              ...component,
              ...updates,
              metadata: {
                createdAt: component.metadata?.createdAt ?? new Date(),
                ...component.metadata,
                updatedAt: new Date(),
                version: (component.metadata?.version ?? 0) + 1,
              },
            }

            state.application.canvas.components.set(id, updatedComponent)
            state.application.persistence.isDirty = true
          }
        }),

      duplicateComponent: (id: string, _addToHistory = true) =>
        set(state => {
          const component = state.application.canvas.components.get(id)
          if (component) {
            const duplicatedComponent: BaseComponent = {
              ...component,
              id: generateId(),
              position: {
                x: component.position.x + 20,
                y: component.position.y + 20,
              },
              metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
              },
            }

            state.application.canvas.components.set(
              duplicatedComponent.id,
              duplicatedComponent
            )
            state.application.persistence.isDirty = true
          }
        }),

      selectComponent: (id: string, multiSelect = false) =>
        set(state => {
          if (multiSelect) {
            if (!state.application.canvas.selectedComponentIds.includes(id)) {
              state.application.canvas.selectedComponentIds.push(id)
            }
          } else {
            state.application.canvas.selectedComponentIds = [id]
          }
          state.application.canvas.focusedComponentId = id
        }),

      deselectComponent: (id: string) =>
        set(state => {
          const index =
            state.application.canvas.selectedComponentIds.indexOf(id)
          if (index > -1) {
            state.application.canvas.selectedComponentIds.splice(index, 1)
          }

          if (state.application.canvas.focusedComponentId === id) {
            state.application.canvas.focusedComponentId =
              state.application.canvas.selectedComponentIds.length > 0
                ? state.application.canvas.selectedComponentIds[0] || null
                : null
          }
        }),

      clearSelection: () =>
        set(state => {
          state.application.canvas.selectedComponentIds = []
          state.application.canvas.focusedComponentId = null
        }),

      focusComponent: (id: string | null) =>
        set(state => {
          state.application.canvas.focusedComponentId = id
        }),

      moveComponent: (id: string, position: Position, _addToHistory = true) =>
        set(state => {
          const component = state.application.canvas.components.get(id)
          if (component) {
            const { boundaries } = state.application.canvas
            const constrainedPosition = {
              x: Math.max(
                boundaries.minX,
                Math.min(
                  boundaries.maxX - component.dimensions.width,
                  position.x
                )
              ),
              y: Math.max(
                boundaries.minY,
                Math.min(
                  boundaries.maxY - component.dimensions.height,
                  position.y
                )
              ),
            }

            const updatedComponent = {
              ...component,
              position: constrainedPosition,
              metadata: {
                createdAt: component.metadata?.createdAt ?? new Date(),
                ...component.metadata,
                updatedAt: new Date(),
                version: (component.metadata?.version ?? 0) + 1,
              },
            }

            state.application.canvas.components.set(id, updatedComponent)
            state.application.persistence.isDirty = true
          }
        }),

      resizeComponent: (id: string, dimensions, _addToHistory = true) =>
        set(state => {
          const component = state.application.canvas.components.get(id)
          if (component) {
            const constrainedDimensions = {
              width: Math.max(
                dimensions.minWidth ?? 10,
                Math.min(dimensions.maxWidth ?? 9999, dimensions.width)
              ),
              height: Math.max(
                dimensions.minHeight ?? 10,
                Math.min(dimensions.maxHeight ?? 9999, dimensions.height)
              ),
              minWidth: dimensions.minWidth,
              minHeight: dimensions.minHeight,
              maxWidth: dimensions.maxWidth,
              maxHeight: dimensions.maxHeight,
            }

            const updatedComponent = {
              ...component,
              dimensions: constrainedDimensions,
              metadata: {
                createdAt: component.metadata?.createdAt ?? new Date(),
                ...component.metadata,
                updatedAt: new Date(),
                version: (component.metadata?.version ?? 0) + 1,
              },
            }

            state.application.canvas.components.set(id, updatedComponent)
            state.application.persistence.isDirty = true
          }
        }),

      reorderComponent: (id: string, zIndex: number, _addToHistory = true) =>
        set(state => {
          const component = state.application.canvas.components.get(id)
          if (component) {
            const updatedComponent = {
              ...component,
              zIndex,
              metadata: {
                createdAt: component.metadata?.createdAt ?? new Date(),
                ...component.metadata,
                updatedAt: new Date(),
                version: (component.metadata?.version ?? 0) + 1,
              },
            }

            state.application.canvas.components.set(id, updatedComponent)
            state.application.persistence.isDirty = true
          }
        }),

      // Canvas actions
      updateCanvasDimensions: dimensions =>
        set(state => {
          state.application.canvas.dimensions = dimensions
          state.application.canvas.boundaries.maxX = dimensions.width
          state.application.canvas.boundaries.maxY = dimensions.height
          state.application.persistence.isDirty = true
        }),

      updateViewport: viewport =>
        set(state => {
          Object.assign(state.application.canvas.viewport, viewport)
        }),

      setZoom: (zoom: number) =>
        set(state => {
          state.application.canvas.zoom = Math.max(0.1, Math.min(5, zoom))
        }),

      updateGrid: grid =>
        set(state => {
          Object.assign(state.application.canvas.grid, grid)
          state.application.persistence.isDirty = true
        }),

      setBoundaries: boundaries =>
        set(state => {
          state.application.canvas.boundaries = boundaries
        }),

      // UI actions
      startDrag: (dragContext: Partial<DragContext>) =>
        set(state => {
          const canvas = state.application.canvas
          state.application.ui.dragContext = {
            ...state.application.ui.dragContext,
            ...dragContext,
            constraints: {
              boundaries: canvas.boundaries,
              snapToGrid: canvas.grid.snapToGrid,
              gridSize: canvas.grid.size,
              minDragDistance: 3,
              preventOverlap: false,
            },
            performanceData: {
              frameCount: 0,
              averageFrameTime: 0,
              lastFrameTime: performance.now(),
              memoryUsage: 0,
            },
          }
        }),

      updateDrag: (updates: Partial<DragContext>) =>
        set(state => {
          const ctx = state.application.ui.dragContext
          Object.assign(ctx, updates)

          if (ctx.performanceData) {
            const now = performance.now()
            const frameTime = now - ctx.performanceData.lastFrameTime
            ctx.performanceData.frameCount++
            ctx.performanceData.averageFrameTime =
              (ctx.performanceData.averageFrameTime *
                (ctx.performanceData.frameCount - 1) +
                frameTime) /
              ctx.performanceData.frameCount
            ctx.performanceData.lastFrameTime = now
          }
        }),

      endDrag: () =>
        set(state => {
          state.application.ui.dragContext = {
            state: DragState.IDLE,
            draggedComponent: null,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            targetElement: null,
            dragOffset: { x: 0, y: 0 },
            isDragValid: false,
          }
        }),

      setActivePanel: panel =>
        set(state => {
          state.application.ui.activePanel = panel
        }),

      togglePanelVisibility: panel =>
        set(state => {
          state.application.ui.panelVisibility[panel] =
            !state.application.ui.panelVisibility[panel]
        }),

      setPreviewMode: mode =>
        set(state => {
          state.application.ui.previewMode = mode
        }),

      openModal: (modal, data) =>
        set(state => {
          state.application.ui.modals.activeModal = modal
          state.application.ui.modals.modalData = data
        }),

      closeModal: () =>
        set(state => {
          state.application.ui.modals.activeModal = null
          state.application.ui.modals.modalData = {}
        }),

      updatePreferences: preferences =>
        set(state => {
          Object.assign(state.application.ui.preferences, preferences)
        }),

      updateToolbox: toolbox =>
        set(state => {
          Object.assign(state.application.ui.toolbox, toolbox)
        }),

      // History actions
      undo: () => set(() => {}),
      redo: () => set(() => {}),
      addToHistory: () => set(() => {}),
      clearHistory: () => set(() => {}),
      setMaxHistorySize: () => set(() => {}),

      // Persistence actions
      saveProject: async () => {},
      loadProject: async () => {},
      createProject: async () => {},
      deleteProject: async () => {},
      duplicateProject: async () => {},
      setAutoSave: () => set(() => {}),
      setAutoSaveInterval: () => set(() => {}),
      exportProject: async () => '',
      importProject: async () => {},
    })),
    { name: 'aura-editor' }
  )
)

// Selectors
export const useCanvas = () => useAppStore(state => state.application.canvas)
export const useComponents = () =>
  useAppStore(state => state.application.canvas.components)
export const useSelectedComponents = () =>
  useAppStore(state => {
    const { components, selectedComponentIds } = state.application.canvas
    return selectedComponentIds
      .map(id => components.get(id))
      .filter((component): component is BaseComponent => Boolean(component))
  })
export const useFocusedComponent = () =>
  useAppStore(state => {
    const { components, focusedComponentId } = state.application.canvas
    return focusedComponentId
      ? components.get(focusedComponentId) || null
      : null
  })
export const useUIState = () => useAppStore(state => state.application.ui)
export const useDragContext = () =>
  useAppStore(state => state.application.ui.dragContext)
export const useHistory = () => useAppStore(state => state.application.history)
export const usePersistence = () =>
  useAppStore(state => state.application.persistence)
export const useLayout = () => useAppStore(state => state.layout)
export const useAppState = () =>
  useAppStore(state => ({
    isLoading: state.isLoading,
    error: state.error,
  }))

// Action selectors
export const useAppActions = () =>
  useAppStore(state => ({
    setLoading: state.setLoading,
    setError: state.setError,
    updateLayout: state.updateLayout,
  }))

export const useComponentActions = () =>
  useAppStore(state => ({
    addComponent: state.addComponent,
    removeComponent: state.removeComponent,
    updateComponent: state.updateComponent,
    duplicateComponent: state.duplicateComponent,
    selectComponent: state.selectComponent,
    deselectComponent: state.deselectComponent,
    clearSelection: state.clearSelection,
    focusComponent: state.focusComponent,
    moveComponent: state.moveComponent,
    resizeComponent: state.resizeComponent,
    reorderComponent: state.reorderComponent,
  }))

export const useCanvasActions = () =>
  useAppStore(state => ({
    updateCanvasDimensions: state.updateCanvasDimensions,
    updateViewport: state.updateViewport,
    setZoom: state.setZoom,
    updateGrid: state.updateGrid,
    setBoundaries: state.setBoundaries,
  }))

export const useUIActions = () =>
  useAppStore(state => ({
    startDrag: state.startDrag,
    updateDrag: state.updateDrag,
    endDrag: state.endDrag,
    setActivePanel: state.setActivePanel,
    togglePanelVisibility: state.togglePanelVisibility,
    setPreviewMode: state.setPreviewMode,
    openModal: state.openModal,
    closeModal: state.closeModal,
    updatePreferences: state.updatePreferences,
    updateToolbox: state.updateToolbox,
  }))

export const useHistoryActions = () =>
  useAppStore(state => ({
    undo: state.undo,
    redo: state.redo,
    addToHistory: state.addToHistory,
    clearHistory: state.clearHistory,
    setMaxHistorySize: state.setMaxHistorySize,
  }))

export const usePersistenceActions = () =>
  useAppStore(state => ({
    saveProject: state.saveProject,
    loadProject: state.loadProject,
    createProject: state.createProject,
    deleteProject: state.deleteProject,
    duplicateProject: state.duplicateProject,
    setAutoSave: state.setAutoSave,
    setAutoSaveInterval: state.setAutoSaveInterval,
    exportProject: state.exportProject,
    importProject: state.importProject,
  }))
