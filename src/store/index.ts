// @ts-nocheck - Suppressing complex Zustand middleware typing issues
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'

// Enable Map/Set support for Immer
enableMapSet()
import type {
  StoreState,
  StoreActions,
  LayoutConfig,
  BaseComponent,
  ApplicationState,
  CanvasState,
  UIState,
  HistoryState,
  PersistenceState,
  Position,
  Dimensions,
  CanvasDimensions,
  Viewport,
  GridConfig,
  CanvasBoundaries,
  DragContext,
  PanelVisibility,
  ModalType,
  UIPreferences,
  ToolboxState,
  CanvasSnapshot,
  Project,
  PerformanceMetrics,
} from '@/types'
import { PanelType, PreviewMode, DragState } from '@/types'

// Utility functions for state management
const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const createCanvasSnapshot = (
  canvas: CanvasState,
  description?: string
): CanvasSnapshot => ({
  id: generateId(),
  timestamp: new Date(),
  components: new Map(canvas.components),
  selectedComponentIds: [...canvas.selectedComponentIds],
  canvasDimensions: { ...canvas.dimensions },
  viewport: { ...canvas.viewport },
  zoom: canvas.zoom,
  description,
})

const serializeForStorage = (
  state: Partial<ApplicationState>
): Record<string, unknown> => ({
  canvas: {
    ...state.canvas,
    components: state.canvas
      ? Array.from(state.canvas.components.entries())
      : [],
  },
  ui: state.ui,
  persistence: state.persistence,
})

const deserializeFromStorage = (
  stored: Record<string, unknown>
): Partial<ApplicationState> => {
  let canvas: CanvasState | undefined = undefined

  if (stored.canvas && typeof stored.canvas === 'object') {
    const storedCanvas = stored.canvas as Record<string, unknown>
    const componentsArray =
      (storedCanvas.components as [string, unknown][] | undefined) || []

    // Ensure we create a proper Map instance
    const components = new Map()
    for (const [id, component] of componentsArray) {
      if (id && component) {
        components.set(id, component)
      }
    }

    canvas = {
      ...storedCanvas,
      components,
      // Ensure other required fields have defaults
      selectedComponentIds:
        (storedCanvas.selectedComponentIds as string[]) || [],
      focusedComponentId:
        (storedCanvas.focusedComponentId as string | null) || null,
      boundaries: storedCanvas.boundaries || {
        minX: 0,
        minY: 0,
        maxX: 1200,
        maxY: 800,
      },
      dimensions: storedCanvas.dimensions || { width: 1200, height: 800 },
      viewport: storedCanvas.viewport || {
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
      },
      zoom: (storedCanvas.zoom as number) || 1,
      grid: storedCanvas.grid || {
        enabled: true,
        size: 20,
        snapToGrid: true,
        visible: true,
      },
    } as CanvasState
  }

  return {
    canvas,
    ui: stored.ui as UIState | undefined,
    persistence: stored.persistence as PersistenceState | undefined,
  }
}

// Initial state definitions
const createInitialCanvasState = (): CanvasState => ({
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
})

const createInitialUIState = (): UIState => ({
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
    theme: 'light',
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
})

const createInitialHistoryState = (canvas: CanvasState): HistoryState => ({
  past: [],
  present: createCanvasSnapshot(canvas, 'Initial state'),
  future: [],
  maxHistorySize: 50,
  canUndo: false,
  canRedo: false,
})

const createInitialPersistenceState = (): PersistenceState => ({
  currentProject: null,
  isDirty: false,
  lastSaved: null,
  autoSaveEnabled: true,
  autoSaveInterval: 30000, // 30 seconds
  savingInProgress: false,
  projectList: [],
})

const createInitialApplicationState = (): ApplicationState => {
  const canvas = createInitialCanvasState()
  return {
    canvas,
    ui: createInitialUIState(),
    history: createInitialHistoryState(canvas),
    persistence: createInitialPersistenceState(),
  }
}

// Initial state
const initialState: Omit<StoreState, keyof StoreActions> = {
  isLoading: false,
  error: null,
  layout: {
    leftPanelWidth: 20,
    centerPanelWidth: 60,
    rightPanelWidth: 20,
  },
  application: createInitialApplicationState(),
}

// Performance monitoring
const performanceMetrics: PerformanceMetrics = {
  stateUpdateTime: 0,
  renderTime: 0,
  memoryUsage: 0,
  componentCount: 0,
  historySize: 0,
}

// Store type combining state and actions
type Store = StoreState & StoreActions

// Helper function to ensure history is properly initialized
const ensureHistoryInitialized = (state: any) => {
  // First, ensure the history object exists
  if (!state.application.history) {
    console.log('🔧 DEBUG: Initializing missing history object')
    state.application.history = {
      past: [],
      present: createCanvasSnapshot(state.application.canvas, 'Initial state'),
      future: [],
      canUndo: false,
      canRedo: false,
      maxHistorySize: 50,
    }
    return
  }

  // Then ensure the arrays exist
  if (!state.application.history.past) {
    console.log('🔧 DEBUG: Initializing missing history.past array')
    state.application.history.past = []
  }
  if (!state.application.history.future) {
    console.log('🔧 DEBUG: Initializing missing history.future array')
    state.application.history.future = []
  }
  if (!state.application.history.present) {
    console.log('🔧 DEBUG: Initializing missing history.present')
    state.application.history.present = createCanvasSnapshot(
      state.application.canvas,
      'Initial state'
    )
  }
}

// Create the store with comprehensive state management
const storeCreator = (set, get) => {
  // Ensure initial state has proper Map
  const safeInitialState = {
    ...initialState,
    application: {
      ...initialState.application,
      canvas: {
        ...initialState.application.canvas,
        components: new Map(), // Ensure this is always a Map
      },
    },
  }

  return {
    ...safeInitialState,

    // General actions
    setLoading: (loading: boolean) =>
      set(
        state => {
          state.isLoading = loading
        },
        false,
        'setLoading'
      ),

    setError: (error: string | null) =>
      set(
        state => {
          state.error = error
        },
        false,
        'setError'
      ),

    // Layout actions
    updateLayout: (layoutUpdate: Partial<LayoutConfig>) =>
      set(
        state => {
          Object.assign(state.layout, layoutUpdate)
        },
        false,
        'updateLayout'
      ),

    // Component actions
    addComponent: (component: BaseComponent, addToHistory = true) =>
      set(
        state => {
          const startTime = performance.now()

          // Ensure component has required properties
          const fullComponent: BaseComponent = {
            ...component,
            zIndex:
              component.zIndex ??
              Math.max(
                0,
                ...Array.from(state.application.canvas.components.values()).map(
                  c => (c as BaseComponent).zIndex
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

          if (addToHistory) {
            // Add to history - ensure history is properly initialized
            ensureHistoryInitialized(state)

            const snapshot = createCanvasSnapshot(
              state.application.canvas,
              `Added ${component.type} component`
            )
            state.application.history.past.push(
              state.application.history.present
            )
            state.application.history.present = snapshot
            state.application.history.future = []
            state.application.history.canUndo = true
            state.application.history.canRedo = false

            // Limit history size
            if (
              state.application.history.past.length >
              state.application.history.maxHistorySize
            ) {
              state.application.history.past.shift()
            }
          }

          // Update performance metrics
          performanceMetrics.stateUpdateTime = performance.now() - startTime
          performanceMetrics.componentCount =
            state.application.canvas.components.size
        },
        false,
        'addComponent'
      ),

    removeComponent: (id: string, addToHistory = true) =>
      set(
        state => {
          const startTime = performance.now()

          if (state.application.canvas.components.has(id)) {
            state.application.canvas.components.delete(id)

            // Remove from selection if selected
            const selectionIndex =
              state.application.canvas.selectedComponentIds.indexOf(id)
            if (selectionIndex > -1) {
              state.application.canvas.selectedComponentIds.splice(
                selectionIndex,
                1
              )
            }

            // Clear focus if focused
            if (state.application.canvas.focusedComponentId === id) {
              state.application.canvas.focusedComponentId = null
            }

            state.application.persistence.isDirty = true

            if (addToHistory) {
              // Add to history
              ensureHistoryInitialized(state)
              const snapshot = createCanvasSnapshot(
                state.application.canvas,
                `Removed component`
              )
              state.application.history.past.push(
                state.application.history.present
              )
              state.application.history.present = snapshot
              state.application.history.future = []
              state.application.history.canUndo = true
              state.application.history.canRedo = false
            }

            // Update performance metrics
            performanceMetrics.stateUpdateTime = performance.now() - startTime
            performanceMetrics.componentCount =
              state.application.canvas.components.size
          }
        },
        false,
        'removeComponent'
      ),

    updateComponent: (
      id: string,
      updates: Partial<BaseComponent>,
      addToHistory = true
    ) =>
      set(
        state => {
          const startTime = performance.now()
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

            if (addToHistory) {
              // Add to history
              ensureHistoryInitialized(state)
              const snapshot = createCanvasSnapshot(
                state.application.canvas,
                `Updated component properties`
              )
              state.application.history.past.push(
                state.application.history.present
              )
              state.application.history.present = snapshot
              state.application.history.future = []
              state.application.history.canUndo = true
              state.application.history.canRedo = false
            }

            // Update performance metrics
            performanceMetrics.stateUpdateTime = performance.now() - startTime
          }
        },
        false,
        'updateComponent'
      ),

    duplicateComponent: (id: string, addToHistory = true) =>
      set(
        state => {
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

            if (addToHistory) {
              // Add to history
              ensureHistoryInitialized(state)
              const snapshot = createCanvasSnapshot(
                state.application.canvas,
                `Duplicated component`
              )
              state.application.history.past.push(
                state.application.history.present
              )
              state.application.history.present = snapshot
              state.application.history.future = []
              state.application.history.canUndo = true
              state.application.history.canRedo = false
            }
          }
        },
        false,
        'duplicateComponent'
      ),

    selectComponent: (id: string, multiSelect = false) =>
      set(
        state => {
          if (multiSelect) {
            if (!state.application.canvas.selectedComponentIds.includes(id)) {
              state.application.canvas.selectedComponentIds.push(id)
            }
          } else {
            state.application.canvas.selectedComponentIds = [id]
          }
          state.application.canvas.focusedComponentId = id
        },
        false,
        'selectComponent'
      ),

    deselectComponent: (id: string) =>
      set(
        state => {
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
        },
        false,
        'deselectComponent'
      ),

    clearSelection: () =>
      set(
        state => {
          state.application.canvas.selectedComponentIds = []
          state.application.canvas.focusedComponentId = null
        },
        false,
        'clearSelection'
      ),

    // Component getter function
    getComponents: () => get().application.canvas.components,

    focusComponent: (id: string | null) =>
      set(
        state => {
          state.application.canvas.focusedComponentId = id
        },
        false,
        'focusComponent'
      ),

    moveComponent: (id: string, position: Position, addToHistory = true) =>
      set(
        state => {
          const component = state.application.canvas.components.get(id)
          if (component) {
            // Check boundaries
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

            if (addToHistory) {
              // Add to history
              ensureHistoryInitialized(state)
              const snapshot = createCanvasSnapshot(
                state.application.canvas,
                `Moved component`
              )
              state.application.history.past.push(
                state.application.history.present
              )
              state.application.history.present = snapshot
              state.application.history.future = []
              state.application.history.canUndo = true
              state.application.history.canRedo = false
            }
          }
        },
        false,
        'moveComponent'
      ),

    resizeComponent: (
      id: string,
      dimensions: Dimensions,
      addToHistory = true
    ) =>
      set(
        state => {
          const component = state.application.canvas.components.get(id)
          if (component) {
            // Apply constraints
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

            if (addToHistory) {
              // Add to history
              ensureHistoryInitialized(state)
              const snapshot = createCanvasSnapshot(
                state.application.canvas,
                `Resized component`
              )
              state.application.history.past.push(
                state.application.history.present
              )
              state.application.history.present = snapshot
              state.application.history.future = []
              state.application.history.canUndo = true
              state.application.history.canRedo = false
            }
          }
        },
        false,
        'resizeComponent'
      ),

    reorderComponent: (id: string, zIndex: number, addToHistory = true) =>
      set(
        state => {
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

            if (addToHistory) {
              // Add to history
              ensureHistoryInitialized(state)
              const snapshot = createCanvasSnapshot(
                state.application.canvas,
                `Reordered component`
              )
              state.application.history.past.push(
                state.application.history.present
              )
              state.application.history.present = snapshot
              state.application.history.future = []
              state.application.history.canUndo = true
              state.application.history.canRedo = false
            }
          }
        },
        false,
        'reorderComponent'
      ),

    // Canvas actions
    updateCanvasDimensions: (dimensions: CanvasDimensions) =>
      set(
        state => {
          state.application.canvas.dimensions = dimensions
          state.application.canvas.boundaries.maxX = dimensions.width
          state.application.canvas.boundaries.maxY = dimensions.height
          state.application.persistence.isDirty = true
        },
        false,
        'updateCanvasDimensions'
      ),

    updateViewport: (viewport: Partial<Viewport>) =>
      set(
        state => {
          Object.assign(state.application.canvas.viewport, viewport)
        },
        false,
        'updateViewport'
      ),

    setZoom: (zoom: number) =>
      set(
        state => {
          state.application.canvas.zoom = Math.max(0.1, Math.min(5, zoom))
        },
        false,
        'setZoom'
      ),

    updateGrid: (grid: Partial<GridConfig>) =>
      set(
        state => {
          Object.assign(state.application.canvas.grid, grid)
          state.application.persistence.isDirty = true
        },
        false,
        'updateGrid'
      ),

    setBoundaries: (boundaries: CanvasBoundaries) =>
      set(
        state => {
          state.application.canvas.boundaries = boundaries
        },
        false,
        'setBoundaries'
      ),

    // Enhanced UI actions for drag-and-drop
    startDrag: (dragContext: Partial<DragContext>) =>
      set(
        state => {
          const canvas = state.application.canvas
          state.application.ui.dragContext = {
            ...state.application.ui.dragContext,
            ...dragContext,
            constraints: {
              boundaries: canvas.boundaries,
              snapToGrid: canvas.grid.snapToGrid,
              gridSize: canvas.grid.size,
              minDragDistance: 3, // 3px minimum drag distance
              preventOverlap: false,
            },
            performanceData: {
              frameCount: 0,
              averageFrameTime: 0,
              lastFrameTime: performance.now(),
              memoryUsage: 0,
            },
          }
        },
        false,
        'startDrag'
      ),

    updateDrag: (updates: Partial<DragContext>) =>
      set(
        state => {
          const ctx = state.application.ui.dragContext
          Object.assign(ctx, updates)

          // Update performance metrics
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
        },
        false,
        'updateDrag'
      ),

    endDrag: () =>
      set(
        state => {
          state.application.ui.dragContext = {
            state: DragState.IDLE,
            draggedComponent: null,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            targetElement: null,
            dragOffset: { x: 0, y: 0 },
            isDragValid: false,
          }
        },
        false,
        'endDrag'
      ),

    setActivePanel: (panel: PanelType) =>
      set(
        state => {
          state.application.ui.activePanel = panel
        },
        false,
        'setActivePanel'
      ),

    togglePanelVisibility: (panel: keyof PanelVisibility) =>
      set(
        state => {
          state.application.ui.panelVisibility[panel] =
            !state.application.ui.panelVisibility[panel]
        },
        false,
        'togglePanelVisibility'
      ),

    setPreviewMode: (mode: PreviewMode) =>
      set(
        state => {
          state.application.ui.previewMode = mode
        },
        false,
        'setPreviewMode'
      ),

    openModal: (modal: ModalType, data?: Record<string, unknown>) =>
      set(
        state => {
          state.application.ui.modals.activeModal = modal
          state.application.ui.modals.modalData = data
        },
        false,
        'openModal'
      ),

    closeModal: () =>
      set(
        state => {
          state.application.ui.modals.activeModal = null
          state.application.ui.modals.modalData = {}
        },
        false,
        'closeModal'
      ),

    updatePreferences: (preferences: Partial<UIPreferences>) =>
      set(
        state => {
          Object.assign(state.application.ui.preferences, preferences)
        },
        false,
        'updatePreferences'
      ),

    updateToolbox: (toolbox: Partial<ToolboxState>) =>
      set(
        state => {
          Object.assign(state.application.ui.toolbox, toolbox)
        },
        false,
        'updateToolbox'
      ),

    // History actions
    undo: () =>
      set(
        state => {
          ensureHistoryInitialized(state)
          if (state.application.history.past.length > 0) {
            const previous = state.application.history.past.pop()!
            state.application.history.future.unshift(
              state.application.history.present
            )
            state.application.history.present = previous

            // Restore canvas state
            state.application.canvas.components = new Map(previous.components)
            state.application.canvas.selectedComponentIds = [
              ...previous.selectedComponentIds,
            ]
            state.application.canvas.dimensions = {
              ...previous.canvasDimensions,
            }
            state.application.canvas.viewport = { ...previous.viewport }
            state.application.canvas.zoom = previous.zoom

            state.application.history.canUndo =
              state.application.history.past.length > 0
            state.application.history.canRedo = true
            state.application.persistence.isDirty = true
          }
        },
        false,
        'undo'
      ),

    redo: () =>
      set(
        state => {
          ensureHistoryInitialized(state)
          if (state.application.history.future.length > 0) {
            const next = state.application.history.future.shift()!
            state.application.history.past.push(
              state.application.history.present
            )
            state.application.history.present = next

            // Restore canvas state
            state.application.canvas.components = new Map(next.components)
            state.application.canvas.selectedComponentIds = [
              ...next.selectedComponentIds,
            ]
            state.application.canvas.dimensions = {
              ...next.canvasDimensions,
            }
            state.application.canvas.viewport = { ...next.viewport }
            state.application.canvas.zoom = next.zoom

            state.application.history.canUndo = true
            state.application.history.canRedo =
              state.application.history.future.length > 0
            state.application.persistence.isDirty = true
          }
        },
        false,
        'redo'
      ),

    addToHistory: (description?: string) =>
      set(
        state => {
          ensureHistoryInitialized(state)
          const snapshot = createCanvasSnapshot(
            state.application.canvas,
            description
          )
          state.application.history.past.push(state.application.history.present)
          state.application.history.present = snapshot
          state.application.history.future = []
          state.application.history.canUndo = true
          state.application.history.canRedo = false

          // Limit history size
          if (
            state.application.history.past.length >
            state.application.history.maxHistorySize
          ) {
            state.application.history.past.shift()
          }
        },
        false,
        'addToHistory'
      ),

    clearHistory: () =>
      set(
        state => {
          ensureHistoryInitialized(state)
          state.application.history.past = []
          state.application.history.future = []
          state.application.history.canUndo = false
          state.application.history.canRedo = false
        },
        false,
        'clearHistory'
      ),

    setMaxHistorySize: (size: number) =>
      set(
        state => {
          ensureHistoryInitialized(state)
          state.application.history.maxHistorySize = Math.max(1, size)

          // Trim history if necessary
          while (state.application.history.past.length > size) {
            state.application.history.past.shift()
          }
        },
        false,
        'setMaxHistorySize'
      ),

    // Manual snapshot function
    takeSnapshot: (description: string) =>
      set(
        state => {
          ensureHistoryInitialized(state)
          const snapshot = createCanvasSnapshot(
            state.application.canvas,
            description
          )
          state.application.history.past.push(state.application.history.present)
          state.application.history.present = snapshot
          state.application.history.future = []
          state.application.history.canUndo = true
          state.application.history.canRedo = false
        },
        false,
        'takeSnapshot'
      ),

    // Persistence actions
    saveProject: async () => {
      const state = get()
      set(
        draft => {
          draft.application.persistence.savingInProgress = true
        },
        false,
        'saveProject:start'
      )

      try {
        const projectData = {
          ...state.application.persistence.currentProject,
          canvas: state.application.canvas,
          ui: state.application.ui,
          updatedAt: new Date(),
        }

        // Simulate save to localStorage
        localStorage.setItem(
          `aura-project-${projectData?.id || 'current'}`,
          JSON.stringify(serializeForStorage(state.application))
        )

        set(
          draft => {
            draft.application.persistence.isDirty = false
            draft.application.persistence.lastSaved = new Date()
            draft.application.persistence.savingInProgress = false
          },
          false,
          'saveProject:success'
        )
      } catch (error) {
        set(
          draft => {
            draft.application.persistence.savingInProgress = false
            draft.error = `Failed to save project: ${error}`
          },
          false,
          'saveProject:error'
        )
      }
    },

    loadProject: async (projectId: string) => {
      set(
        draft => {
          draft.isLoading = true
        },
        false,
        'loadProject:start'
      )

      try {
        const storedData = localStorage.getItem(`aura-project-${projectId}`)
        if (storedData) {
          const projectData = deserializeFromStorage(JSON.parse(storedData))

          set(
            draft => {
              if (projectData.canvas) {
                draft.application.canvas = projectData.canvas
              }
              if (projectData.ui) {
                draft.application.ui = {
                  ...draft.application.ui,
                  ...projectData.ui,
                }
              }
              if (projectData.persistence) {
                draft.application.persistence = {
                  ...draft.application.persistence,
                  ...projectData.persistence,
                }
              }
              draft.application.persistence.isDirty = false
              draft.isLoading = false
            },
            false,
            'loadProject:success'
          )
        }
      } catch (error) {
        set(
          draft => {
            draft.isLoading = false
            draft.error = `Failed to load project: ${error}`
          },
          false,
          'loadProject:error'
        )
      }
    },

    createProject: async (name: string, description?: string) => {
      const projectId = generateId()
      const project: Project = {
        id: projectId,
        name,
        description,
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        canvas: createInitialCanvasState(),
        ui: createInitialUIState(),
        metadata: {
          id: projectId,
          name,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: 0,
          componentCount: 0,
        },
      }

      set(
        state => {
          state.application.persistence.currentProject = project
          state.application.canvas = project.canvas
          state.application.ui = { ...state.application.ui, ...project.ui }
          state.application.persistence.isDirty = false
          state.application.persistence.projectList.push(project.metadata)
        },
        false,
        'createProject'
      )
    },

    deleteProject: async (projectId: string) => {
      try {
        localStorage.removeItem(`aura-project-${projectId}`)

        set(
          state => {
            state.application.persistence.projectList =
              state.application.persistence.projectList.filter(
                (p: any) => p.id !== projectId
              )
          },
          false,
          'deleteProject'
        )
      } catch (error) {
        set(
          draft => {
            draft.error = `Failed to delete project: ${error}`
          },
          false,
          'deleteProject:error'
        )
      }
    },

    duplicateProject: async (projectId: string, newName: string) => {
      try {
        const storedData = localStorage.getItem(`aura-project-${projectId}`)
        if (storedData) {
          const originalProject = JSON.parse(storedData)
          const newProjectId = generateId()
          const duplicatedProject = {
            ...originalProject,
            id: newProjectId,
            name: newName,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          localStorage.setItem(
            `aura-project-${newProjectId}`,
            JSON.stringify(duplicatedProject)
          )

          set(
            state => {
              state.application.persistence.projectList.push({
                id: newProjectId,
                name: newName,
                description: originalProject.description,
                createdAt: new Date(),
                updatedAt: new Date(),
                size: 0,
                componentCount: originalProject.canvas?.components?.length || 0,
              })
            },
            false,
            'duplicateProject'
          )
        }
      } catch (error) {
        set(
          draft => {
            draft.error = `Failed to duplicate project: ${error}`
          },
          false,
          'duplicateProject:error'
        )
      }
    },

    setAutoSave: (enabled: boolean) =>
      set(
        state => {
          state.application.persistence.autoSaveEnabled = enabled
        },
        false,
        'setAutoSave'
      ),

    setAutoSaveInterval: (interval: number) =>
      set(
        state => {
          state.application.persistence.autoSaveInterval = Math.max(
            5000,
            interval
          ) // Minimum 5 seconds
        },
        false,
        'setAutoSaveInterval'
      ),

    exportProject: async (format: 'json' | 'html' | 'react') => {
      const state = get()

      switch (format) {
        case 'json':
          return JSON.stringify(serializeForStorage(state.application), null, 2)
        case 'html':
          // TODO: Implement HTML export
          return '<html><body>HTML export not implemented yet</body></html>'
        case 'react':
          // TODO: Implement React component export
          return '// React export not implemented yet'
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    },

    importProject: async (data: string, format: 'json') => {
      try {
        if (format === 'json') {
          const projectData = deserializeFromStorage(JSON.parse(data))

          set(
            draft => {
              if (projectData.canvas) {
                draft.application.canvas = projectData.canvas
              }
              if (projectData.ui) {
                draft.application.ui = {
                  ...draft.application.ui,
                  ...projectData.ui,
                }
              }
              draft.application.persistence.isDirty = true
            },
            false,
            'importProject'
          )
        }
      } catch (error) {
        set(
          draft => {
            draft.error = `Failed to import project: ${error}`
          },
          false,
          'importProject:error'
        )
      }
    },

    // Performance monitoring functions
    recordPerformanceMetric: (metric: string, value: number) => {
      if (metric in performanceMetrics) {
        ;(performanceMetrics as any)[metric] = value
      }
    },

    getPerformanceMetrics: () => performanceMetrics,

    // Keyboard event handlers
    handleKeyDown: (event: KeyboardEvent) => {
      // Basic keyboard handling - can be expanded
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const state = get()
        const selectedIds = state.application.canvas.selectedComponentIds
        selectedIds.forEach(id => state.removeComponent(id))
      }
    },

    handleKeyUp: (_event: KeyboardEvent) => {
      // Placeholder for key up handling
    },

    // State validation functions
    validateState: () => {
      const state = get()
      return state.application.canvas.components instanceof Map
    },

    sanitizeState: () => {
      // State sanitization and recovery
      const state = get()
      if (!(state.application.canvas.components instanceof Map)) {
        console.warn('Detected corrupted components state, recovering...')
        set(
          draft => {
            // Try to recover data if it's in array format
            const current = draft.application.canvas.components
            if (Array.isArray(current)) {
              console.log('Attempting to recover components from array format')
              draft.application.canvas.components = new Map(current)
            } else if (current && typeof current === 'object') {
              console.log('Attempting to recover components from object format')
              draft.application.canvas.components = new Map(
                Object.entries(current)
              )
            } else {
              console.log('Initializing empty components Map')
              draft.application.canvas.components = new Map()
            }
          },
          false,
          'sanitizeState:recover'
        )
      }
    },
  }
}

export const useAppStore = create<Store>()(
  devtools(
    persist(immer(storeCreator), {
      name: 'aura-editor-store',
      partialize: state => ({
        layout: state.layout,
        application: serializeForStorage(state.application),
      }),
      onRehydrateStorage: () => (state: Store | undefined) => {
        if (state?.application) {
          // Deserialize stored state
          const deserialized = deserializeFromStorage(
            state.application as unknown as Record<string, unknown>
          )
          if (deserialized.canvas) {
            const current = state.application.canvas
            const incoming = deserialized.canvas
            // Ensure components is always a Map
            if (incoming.components && !(incoming.components instanceof Map)) {
              // Convert stored array back to Map if needed
              const componentsArray = Array.isArray(incoming.components)
                ? incoming.components
                : []
              incoming.components = new Map(componentsArray)
            }
            // Only replace canvas if current has no components to avoid clobbering user actions during hydration
            if (!current || current.components.size === 0) {
              state.application.canvas = {
                ...incoming,
                components: incoming.components || new Map(),
              }
            }
          }
        }
      },
    }),
    {
      name: 'aura-editor',
    }
  )
)

// Performance-optimized selectors
export const useCanvas = () => useAppStore(state => state.application.canvas)
export const useComponents = () =>
  useAppStore(state => {
    const components = state.application.canvas.components
    // Safety check: ensure components is always a Map
    if (!(components instanceof Map)) {
      console.warn('Components is not a Map, initializing new Map')
      return new Map()
    }
    return components
  })
export const useSelectedComponents = () =>
  useAppStore(state => {
    const { components, selectedComponentIds } = state.application.canvas
    // Safety check: ensure components is always a Map
    if (!(components instanceof Map)) {
      console.warn(
        'Components is not a Map in useSelectedComponents, returning empty array'
      )
      return []
    }
    return selectedComponentIds
      .map(id => components.get(id))
      .filter((component): component is BaseComponent => Boolean(component))
  })
export const useFocusedComponent = () =>
  useAppStore(state => {
    const { components, focusedComponentId } = state.application.canvas
    // Safety check: ensure components is always a Map
    if (!(components instanceof Map)) {
      console.warn(
        'Components is not a Map in useFocusedComponent, returning null'
      )
      return null
    }
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

// Action selectors for better performance
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

// Performance monitoring hook
export const usePerformanceMetrics = () => performanceMetrics

// Validation utilities
export const validateComponent = (component: BaseComponent): boolean => {
  return !!(
    component.id &&
    component.type &&
    component.position &&
    component.dimensions &&
    typeof component.zIndex === 'number'
  )
}

// Auto-save functionality
let autoSaveTimer: NodeJS.Timeout | null = null

export const setupAutoSave = () => {
  const state = useAppStore.getState()

  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }

  if (state.application.persistence.autoSaveEnabled) {
    autoSaveTimer = setInterval(() => {
      const currentState = useAppStore.getState()
      if (
        currentState.application.persistence.isDirty &&
        !currentState.application.persistence.savingInProgress
      ) {
        currentState.saveProject()
      }
    }, state.application.persistence.autoSaveInterval)
  }
}

// Initialize auto-save and sanitize state on store creation
setupAutoSave()

// Immediately sanitize state to handle any corruption from localStorage
setTimeout(() => {
  try {
    useAppStore.getState().sanitizeState()
    console.log('✅ Store state sanitized successfully')
  } catch (error) {
    console.error('❌ Error during initial state sanitization:', error)
  }
}, 100)
