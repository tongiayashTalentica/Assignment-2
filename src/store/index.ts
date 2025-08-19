// Simplified working store to fix useAppStore export issues
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
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
} from '@/types'
import { PanelType, PreviewMode, DragState } from '@/types'

// Utility functions
const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper function to create proper history snapshots
const createSnapshot = (canvasState: CanvasState, description: string) => {
  // Create a deep clone of components Map for reliable history
  const componentsClone = new Map()
  canvasState.components.forEach((component, id) => {
    componentsClone.set(id, {
      ...component,
      // Ensure props are also deep cloned
      props: { ...component.props },
    })
  })

  return {
    id: generateId(),
    timestamp: new Date(),
    components: componentsClone,
    selectedComponentIds: [...canvasState.selectedComponentIds],
    canvasDimensions: { ...canvasState.dimensions },
    viewport: { ...canvasState.viewport },
    zoom: canvasState.zoom,
    description,
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

const createInitialHistoryState = (): HistoryState => ({
  past: [],
  present: {
    id: generateId(),
    timestamp: new Date(),
    components: new Map(),
    selectedComponentIds: [],
    canvasDimensions: { width: 1200, height: 800 },
    viewport: { x: 0, y: 0, width: 1200, height: 800 },
    zoom: 1,
    description: 'Initial state',
  },
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
  autoSaveInterval: 30000,
  savingInProgress: false,
  projectList: [],
})

const createInitialApplicationState = (): ApplicationState => ({
  canvas: createInitialCanvasState(),
  ui: createInitialUIState(),
  history: createInitialHistoryState(),
  persistence: createInitialPersistenceState(),
})

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

// Store type combining state and actions
type Store = StoreState & StoreActions

// Create the store with simplified actions
const storeCreator = (set: any, get: any) => ({
  ...initialState,

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
        // Take snapshot of current state BEFORE making changes (for undo)
        if (addToHistory) {
          const beforeSnapshot = createSnapshot(
            state.application.canvas,
            'Before adding component'
          )
          state.application.history.past.push(state.application.history.present)
          state.application.history.present = beforeSnapshot
          state.application.history.future = []
        }

        const fullComponent: BaseComponent = {
          ...component,
          zIndex: component.zIndex ?? 1,
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
          // Update present state to reflect the new changes
          const afterSnapshot = createSnapshot(
            state.application.canvas,
            `Added ${component.type} component`
          )
          state.application.history.present = afterSnapshot
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
      },
      false,
      'addComponent'
    ),

  removeComponent: (id: string, _addToHistory = true) =>
    set(
      state => {
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
        const component = state.application.canvas.components.get(id)
        if (component) {
          // Take snapshot of current state BEFORE making changes (for undo)
          if (addToHistory) {
            const beforeSnapshot = createSnapshot(
              state.application.canvas,
              'Before updating component'
            )
            state.application.history.past.push(
              state.application.history.present
            )
            state.application.history.present = beforeSnapshot
            state.application.history.future = []
          }

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
            // Update present state to reflect the new changes
            const afterSnapshot = createSnapshot(
              state.application.canvas,
              `Updated component`
            )
            state.application.history.present = afterSnapshot
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
        }
      },
      false,
      'updateComponent'
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
        const index = state.application.canvas.selectedComponentIds.indexOf(id)
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

  getComponents: () => get().application.canvas.components,

  focusComponent: (id: string | null) =>
    set(
      state => {
        state.application.canvas.focusedComponentId = id
      },
      false,
      'focusComponent'
    ),

  moveComponent: (id: string, position: Position, _addToHistory = true) =>
    set(
      state => {
        const component = state.application.canvas.components.get(id)
        if (component) {
          const { boundaries } = state.application.canvas
          const constrainedPosition = {
            x: Math.max(
              boundaries.minX,
              Math.min(boundaries.maxX - component.dimensions.width, position.x)
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
          }
          state.application.canvas.components.set(id, updatedComponent)
          state.application.persistence.isDirty = true
        }
      },
      false,
      'moveComponent'
    ),

  resizeComponent: (id: string, dimensions: Dimensions, _addToHistory = true) =>
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
        }
      },
      false,
      'resizeComponent'
    ),

  duplicateComponent: (id: string, _addToHistory = true) =>
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
          }
          state.application.canvas.components.set(
            duplicatedComponent.id,
            duplicatedComponent
          )
          state.application.persistence.isDirty = true
        }
      },
      false,
      'duplicateComponent'
    ),

  reorderComponent: (id: string, zIndex: number, _addToHistory = true) =>
    set(
      state => {
        const component = state.application.canvas.components.get(id)
        if (component) {
          const updatedComponent = { ...component, zIndex }
          state.application.canvas.components.set(id, updatedComponent)
          state.application.persistence.isDirty = true
        }
      },
      false,
      'reorderComponent'
    ),

  // Canvas actions
  updateCanvasDimensions: (dimensions: CanvasDimensions) =>
    set(
      state => {
        state.application.canvas.dimensions = { ...dimensions }
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

  // UI actions
  startDrag: (dragContext: Partial<DragContext>) =>
    set(
      state => {
        Object.assign(state.application.ui.dragContext, dragContext)
      },
      false,
      'startDrag'
    ),

  updateDrag: (updates: Partial<DragContext>) =>
    set(
      state => {
        Object.assign(state.application.ui.dragContext, updates)
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

  // History actions with proper Map handling
  undo: () =>
    set(
      state => {
        if (state.application.history.past.length > 0) {
          const previous = state.application.history.past.pop()!
          state.application.history.future.unshift(
            state.application.history.present
          )

          // Restore the snapshot to the current state
          if (previous && previous.components) {
            // Handle Map reconstruction properly
            if (previous.components instanceof Map) {
              state.application.canvas.components = new Map(previous.components)
            } else {
              // Convert from stored object back to Map
              state.application.canvas.components = new Map(
                Object.entries(previous.components)
              )
            }
            state.application.canvas.selectedComponentIds = [
              ...(previous.selectedComponentIds || []),
            ]
            state.application.canvas.dimensions = {
              ...previous.canvasDimensions,
            }
            state.application.canvas.viewport = { ...previous.viewport }
            state.application.canvas.zoom = previous.zoom
          }

          state.application.history.present = previous
          state.application.history.canUndo =
            state.application.history.past.length > 0
          state.application.history.canRedo = true
        }
      },
      false,
      'undo'
    ),
  redo: () =>
    set(
      state => {
        if (state.application.history.future.length > 0) {
          const next = state.application.history.future.shift()!
          state.application.history.past.push(state.application.history.present)

          // Restore the snapshot to the current state
          if (next && next.components) {
            // Handle Map reconstruction properly
            if (next.components instanceof Map) {
              state.application.canvas.components = new Map(next.components)
            } else {
              // Convert from stored object back to Map
              state.application.canvas.components = new Map(
                Object.entries(next.components)
              )
            }
            state.application.canvas.selectedComponentIds = [
              ...(next.selectedComponentIds || []),
            ]
            state.application.canvas.dimensions = { ...next.canvasDimensions }
            state.application.canvas.viewport = { ...next.viewport }
            state.application.canvas.zoom = next.zoom
          }

          state.application.history.present = next
          state.application.history.canRedo =
            state.application.history.future.length > 0
          state.application.history.canUndo = true
        }
      },
      false,
      'redo'
    ),
  addToHistory: (description?: string) =>
    set(
      state => {
        const snapshot = createSnapshot(
          state.application.canvas,
          description || 'Action'
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
        state.application.history.maxHistorySize = Math.max(1, size)
        while (state.application.history.past.length > size) {
          state.application.history.past.shift()
        }
      },
      false,
      'setMaxHistorySize'
    ),
  takeSnapshot: (description: string) =>
    set(
      state => {
        const snapshot = createSnapshot(state.application.canvas, description)
        state.application.history.past.push(state.application.history.present)
        state.application.history.present = snapshot
        state.application.history.future = []
        state.application.history.canUndo = true
        state.application.history.canRedo = false
      },
      false,
      'takeSnapshot'
    ),

  // Simplified persistence actions
  saveProject: async () => {
    const state = get()
    // Convert Map to serializable object format
    const canvasData = {
      ...state.application.canvas,
      components: Object.fromEntries(
        state.application.canvas.components.entries()
      ),
    }

    // Ensure we have a current project
    let currentProject = state.application.persistence.currentProject
    if (!currentProject) {
      // Create a default project if none exists
      currentProject = {
        id: 'default-project',
        name: 'My Project',
        description: 'Default project',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvas: canvasData,
        ui: state.application.ui,
      }
    } else {
      // Update the existing project with current data
      currentProject = {
        ...currentProject,
        canvas: canvasData,
        updatedAt: new Date().toISOString(),
      }
    }

    const projectData = {
      ...currentProject, // Include all project metadata at root level
      canvas: canvasData,
      persistence: {
        ...state.application.persistence,
        currentProject: currentProject,
        lastSaved: new Date().toISOString(), // Serialize date
      },
      ui: state.application.ui,
    }

    try {
      localStorage.setItem('project', JSON.stringify(projectData))
      set(
        state => {
          state.application.persistence.currentProject = currentProject
          state.application.persistence.projectName = currentProject.name
          state.application.persistence.isDirty = false
          state.application.persistence.lastSaved = new Date()
        },
        false,
        'saveProject'
      )
      console.log(
        '💾 Project saved successfully:',
        currentProject.name,
        'with',
        state.application.canvas.components.size,
        'components'
      )
      return Promise.resolve()
    } catch (error) {
      console.error('❌ Failed to save project:', error)
      set(
        state => {
          state.error = `Failed to save project: ${(error as Error).message}`
        },
        false,
        'saveProjectError'
      )
      return Promise.resolve()
    }
  },
  loadProject: async (_projectId?: string) => {
    try {
      const projectData = localStorage.getItem('project')
      if (!projectData) {
        console.log('📝 No saved project found - creating default project')
        // Create a default project
        const defaultProject = {
          id: 'default-project',
          name: 'My Project',
          description: 'Default project',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canvas: get().application.canvas,
          ui: get().application.ui,
        }

        set(
          state => {
            state.application.persistence.currentProject = defaultProject
            state.application.persistence.projectName = defaultProject.name
            state.application.persistence.isDirty = false
            console.log('✅ Default project created:', defaultProject.name)
          },
          false,
          'createDefaultProject'
        )

        return Promise.resolve()
      }

      const parsedProject = JSON.parse(projectData)

      set(
        state => {
          // Restore canvas data
          if (parsedProject.canvas) {
            if (parsedProject.canvas.components instanceof Map) {
              state.application.canvas.components =
                parsedProject.canvas.components
            } else if (parsedProject.canvas.components) {
              // Handle serialized Map
              state.application.canvas.components = new Map(
                Object.entries(parsedProject.canvas.components)
              )
            }

            if (parsedProject.canvas.selectedComponentIds) {
              state.application.canvas.selectedComponentIds =
                parsedProject.canvas.selectedComponentIds
            }

            if (parsedProject.canvas.dimensions) {
              state.application.canvas.dimensions =
                parsedProject.canvas.dimensions
              state.application.canvas.boundaries.maxX =
                parsedProject.canvas.dimensions.width
              state.application.canvas.boundaries.maxY =
                parsedProject.canvas.dimensions.height
            }

            if (parsedProject.canvas.viewport) {
              state.application.canvas.viewport = parsedProject.canvas.viewport
            }

            if (parsedProject.canvas.zoom !== undefined) {
              state.application.canvas.zoom = parsedProject.canvas.zoom
            }
          }

          // Restore persistence metadata - look for currentProject first
          if (parsedProject.persistence?.currentProject) {
            state.application.persistence.currentProject =
              parsedProject.persistence.currentProject
            state.application.persistence.projectName =
              parsedProject.persistence.currentProject.name
          } else {
            // Create project from loaded data if no currentProject exists
            const loadedProject = {
              id: parsedProject.id || 'loaded-project',
              name: parsedProject.name || 'My Project',
              description: parsedProject.description || 'Loaded project',
              version: parsedProject.version || '1.0.0',
              createdAt: parsedProject.createdAt || new Date().toISOString(),
              updatedAt: parsedProject.updatedAt || new Date().toISOString(),
              canvas: parsedProject.canvas || state.application.canvas,
              ui: parsedProject.ui || state.application.ui,
            }
            state.application.persistence.currentProject = loadedProject
            state.application.persistence.projectName = loadedProject.name
          }

          state.application.persistence.isDirty = false
          state.application.persistence.lastSaved = parsedProject.persistence
            ?.lastSaved
            ? new Date(parsedProject.persistence.lastSaved)
            : new Date()
          console.log(
            '✅ Project loaded successfully with',
            state.application.canvas.components.size,
            'components'
          )
        },
        false,
        'loadProject'
      )

      return Promise.resolve()
    } catch (error) {
      set(
        state => {
          state.error = `Failed to load project: ${(error as Error).message}`
        },
        false,
        'loadProjectError'
      )
      return Promise.resolve()
    }
  },
  createProject: async (name: string, description?: string) => {
    const state = get()
    const project = {
      id: generateId(),
      name,
      description: description || '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvas: {
        ...state.application.canvas,
        components: Object.fromEntries(
          state.application.canvas.components.entries()
        ),
      },
      ui: state.application.ui,
    }

    set(
      state => {
        state.application.persistence.currentProject = project
        state.application.persistence.projectName = name
        state.application.persistence.isDirty = true // Mark as dirty to trigger save
      },
      false,
      'createProject'
    )

    console.log('📂 New project created:', name)
    return Promise.resolve(project)
  },
  deleteProject: async (_projectId: string) => Promise.resolve(),
  duplicateProject: async (_projectId: string, _newName?: string) =>
    Promise.resolve(null),
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
        )
      },
      false,
      'setAutoSaveInterval'
    ),
  exportProject: async (format: 'json' | 'html' | 'react') => {
    const state = get()
    switch (format) {
      case 'json':
        return JSON.stringify(state.application, null, 2)
      default:
        return 'Export not implemented yet'
    }
  },
  importProject: async (_data: string, _format: 'json') => Promise.resolve(),

  // Utility functions
  recordPerformanceMetric: (_metric: string, _value: number) => {},
  getPerformanceMetrics: () => ({
    stateUpdateTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    historySize: 0,
  }),
  handleKeyDown: (_event: KeyboardEvent) => {},
  handleKeyUp: (_event: KeyboardEvent) => {},
  validateState: () => true,
  sanitizeState: () => {},
})

export const useAppStore = create<Store>()(
  devtools(immer(storeCreator), { name: 'aura-editor' })
)

// Performance-optimized selectors
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

// Mock persistence service for tests
export const usePersistenceService = () => ({
  saveProject: async () => true,
  loadProject: async () => null,
  createProject: async () => null,
  deleteProject: async () => true,
  duplicateProject: async () => null,
  listProjects: async () => [],
  getStorageInfo: async () => ({ used: 0, available: 100000, total: 100000 }),
  checkStorageWarnings: async () => [],
})
