/**
 * Manual mock for Zustand store
 */

const mockStore = {
  isLoading: false,
  error: null,
  application: {
    canvas: {
      components: new Map(),
      selectedComponentIds: [],
      focusedComponentId: null,
      boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
      dimensions: { width: 1200, height: 800 },
      viewport: { x: 0, y: 0 },
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      grid: { enabled: true, size: 20, visible: true, snapToGrid: true },
      performanceMode: false,
      backgroundImage: null,
      backgroundColor: '#ffffff',
    },
    ui: {
      panels: {
        left: { visible: true, collapsed: false, width: 300 },
        right: { visible: true, collapsed: false, width: 350 },
        bottom: { visible: false, collapsed: true, height: 200 },
      },
      panelVisibility: {
        palette: true,
        properties: true,
        canvas: true,
      },
      activePanel: 'palette',
      previewMode: 'design',
      modal: { type: null, isOpen: false, data: null },
      modals: {
        activeModal: null,
        modalData: null,
      },
      drag: {
        state: 'idle',
        draggedComponent: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: false,
        performanceData: null,
        targetElement: null,
      },
      dragContext: {
        state: 'idle',
        draggedComponent: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: false,
        performanceData: null,
        targetElement: null,
      },
      preferences: {
        theme: 'light',
        language: 'en',
        autoSave: true,
        autoSaveInterval: 30000,
        showGrid: true,
        showRulers: false,
        showGuides: true,
        snapToGrid: true,
        snapToGuides: true,
      },
      toolbox: { selectedTool: 'select', recentlyUsed: [] },
      notifications: [],
    },
    history: {
      past: [],
      present: null,
      future: [],
      maxHistorySize: 50,
      lastSavePoint: null,
      canUndo: false,
      canRedo: false,
    },
    persistence: {
      autoSave: true,
      autoSaveEnabled: true,
      autoSaveInterval: 30000,
      lastSaved: new Date(),
      hasUnsavedChanges: false,
      projectName: null,
      projectId: null,
      isDirty: false,
      currentProject: null,
    },
    appState: {
      error: null,
      isLoading: false,
      status: 'idle',
    },
  },
  // Actions that actually update the mock store state
  addComponent: jest.fn(component => {
    mockStore.application.canvas.components.set(component.id, component)
    mockStore.application.canvas.selectedComponentIds = [component.id]
    mockStore.application.canvas.focusedComponentId = component.id

    // Update history
    mockStore.application.history.past.push({ action: 'add', component })
    mockStore.application.history.canUndo = true
    mockStore.application.history.future = [] // Clear redo history
    mockStore.application.history.canRedo = false
  }),
  removeComponent: jest.fn(id => {
    mockStore.application.canvas.components.delete(id)
    mockStore.application.canvas.selectedComponentIds =
      mockStore.application.canvas.selectedComponentIds.filter(
        cId => cId !== id
      )
    if (mockStore.application.canvas.focusedComponentId === id) {
      mockStore.application.canvas.focusedComponentId = null
    }
  }),
  updateComponent: jest.fn((id, updates) => {
    const component = mockStore.application.canvas.components.get(id)
    if (component) {
      const updatedComponent = {
        ...component,
        ...updates,
        metadata: {
          ...component.metadata,
          version: (component.metadata?.version || 1) + 1,
        },
      }
      mockStore.application.canvas.components.set(id, updatedComponent)
    }
  }),
  moveComponent: jest.fn((id, position) => {
    const component = mockStore.application.canvas.components.get(id)
    if (component) {
      const constrainedPosition = {
        x: Math.max(
          0,
          Math.min(
            position.x,
            mockStore.application.canvas.boundaries.maxX -
              (component.dimensions?.width || 100)
          )
        ),
        y: Math.max(
          0,
          Math.min(
            position.y,
            mockStore.application.canvas.boundaries.maxY -
              (component.dimensions?.height || 100)
          )
        ),
      }
      const updatedComponent = { ...component, position: constrainedPosition }
      mockStore.application.canvas.components.set(id, updatedComponent)

      // Update history
      mockStore.application.history.past.push({
        action: 'move',
        componentId: id,
        oldPosition: component.position,
        newPosition: constrainedPosition,
      })
      mockStore.application.history.canUndo = true
      mockStore.application.history.future = [] // Clear redo history
      mockStore.application.history.canRedo = false
    }
  }),
  resizeComponent: jest.fn((id, dimensions, constraints) => {
    const component = mockStore.application.canvas.components.get(id)
    if (component) {
      const constrainedDimensions = {
        width: Math.max(constraints?.minWidth || 50, dimensions.width), // Default minimum 50
        height: Math.max(constraints?.minHeight || 20, dimensions.height), // Default minimum 20
      }
      const updatedComponent = {
        ...component,
        dimensions: constrainedDimensions,
      }
      mockStore.application.canvas.components.set(id, updatedComponent)
    }
  }),
  selectComponent: jest.fn((id, multiSelect = false) => {
    if (multiSelect) {
      if (!mockStore.application.canvas.selectedComponentIds.includes(id)) {
        mockStore.application.canvas.selectedComponentIds.push(id)
      }
    } else {
      mockStore.application.canvas.selectedComponentIds = [id]
    }
    mockStore.application.canvas.focusedComponentId = id
  }),
  clearSelection: jest.fn(() => {
    mockStore.application.canvas.selectedComponentIds = []
    mockStore.application.canvas.focusedComponentId = null
  }),
  setZoom: jest.fn(zoom => {
    mockStore.application.canvas.zoom = Math.max(0.1, Math.min(zoom, 5))
  }),
  updateCanvasDimensions: jest.fn(dimensions => {
    Object.assign(mockStore.application.canvas.dimensions, dimensions)
    // Also update boundaries to match new dimensions
    mockStore.application.canvas.boundaries.maxX =
      dimensions.width || mockStore.application.canvas.boundaries.maxX
    mockStore.application.canvas.boundaries.maxY =
      dimensions.height || mockStore.application.canvas.boundaries.maxY
  }),
  updateViewport: jest.fn(viewport => {
    Object.assign(mockStore.application.canvas.viewport, viewport)
  }),
  updateGrid: jest.fn(grid => {
    Object.assign(mockStore.application.canvas.grid, grid)
  }),
  startDrag: jest.fn(dragData => {
    Object.assign(mockStore.application.ui.drag, dragData)
    Object.assign(mockStore.application.ui.dragContext, dragData)
  }),
  updateDrag: jest.fn(dragData => {
    Object.assign(mockStore.application.ui.drag, dragData)
    Object.assign(mockStore.application.ui.dragContext, dragData)
  }),
  endDrag: jest.fn(() => {
    mockStore.application.ui.drag.state = 'idle'
    mockStore.application.ui.drag.draggedComponent = null
    mockStore.application.ui.drag.currentPosition = { x: 0, y: 0 }
    mockStore.application.ui.drag.startPosition = { x: 0, y: 0 }
    mockStore.application.ui.drag.dragOffset = { x: 0, y: 0 }
    mockStore.application.ui.drag.isDragValid = false
    mockStore.application.ui.drag.performanceData = null
    mockStore.application.ui.drag.targetElement = null

    Object.assign(
      mockStore.application.ui.dragContext,
      mockStore.application.ui.drag
    )
  }),
  togglePanelVisibility: jest.fn(panelName => {
    if (!mockStore.application.ui.panelVisibility) {
      mockStore.application.ui.panelVisibility = {
        palette: true,
        properties: true,
        canvas: true,
      }
    }
    mockStore.application.ui.panelVisibility[panelName] =
      !mockStore.application.ui.panelVisibility[panelName]
  }),
  updateToolbox: jest.fn(toolboxData => {
    Object.assign(mockStore.application.ui.toolbox, toolboxData)
  }),
  setState: jest.fn(),
  getState: jest.fn(),
  clearHistory: jest.fn(() => {
    mockStore.application.history.past = []
    mockStore.application.history.future = []
    mockStore.application.history.canUndo = false
    mockStore.application.history.canRedo = false
  }),
  setAutoSaveInterval: jest.fn(interval => {
    const clampedInterval = Math.max(5000, interval) // Minimum 5 seconds
    mockStore.application.persistence.autoSaveInterval = clampedInterval
  }),
  undo: jest.fn(() => {
    if (mockStore.application.history.past.length > 0) {
      const lastAction = mockStore.application.history.past.pop()

      // Move current state to future
      mockStore.application.history.future.push({
        components: new Map(mockStore.application.canvas.components),
        selectedIds: [...mockStore.application.canvas.selectedComponentIds],
        focusedId: mockStore.application.canvas.focusedComponentId,
      })

      // Apply the undo action
      if (lastAction.action === 'add' && lastAction.component) {
        // Remove the component that was added
        mockStore.application.canvas.components.delete(lastAction.component.id)
        mockStore.application.canvas.selectedComponentIds =
          mockStore.application.canvas.selectedComponentIds.filter(
            id => id !== lastAction.component.id
          )
        if (
          mockStore.application.canvas.focusedComponentId ===
          lastAction.component.id
        ) {
          mockStore.application.canvas.focusedComponentId = null
        }
      } else if (
        lastAction.action === 'move' &&
        lastAction.componentId &&
        lastAction.oldPosition
      ) {
        // Revert the move
        const component = mockStore.application.canvas.components.get(
          lastAction.componentId
        )
        if (component) {
          const reverted = { ...component, position: lastAction.oldPosition }
          mockStore.application.canvas.components.set(
            lastAction.componentId,
            reverted
          )
        }
      }

      // Update flags
      mockStore.application.history.canUndo =
        mockStore.application.history.past.length > 0
      mockStore.application.history.canRedo = true
    }
  }),
  redo: jest.fn(() => {
    if (mockStore.application.history.future.length > 0) {
      const futureState = mockStore.application.history.future.pop()

      // Save current state to past
      mockStore.application.history.past.push({
        components: new Map(mockStore.application.canvas.components),
        selectedIds: [...mockStore.application.canvas.selectedComponentIds],
        focusedId: mockStore.application.canvas.focusedComponentId,
      })

      // Restore future state
      if (futureState.components) {
        mockStore.application.canvas.components = futureState.components
      }
      if (futureState.selectedIds) {
        mockStore.application.canvas.selectedComponentIds =
          futureState.selectedIds
      }
      mockStore.application.canvas.focusedComponentId = futureState.focusedId

      // Update flags
      mockStore.application.history.canRedo =
        mockStore.application.history.future.length > 0
      mockStore.application.history.canUndo = true
    }
  }),
  exportProject: jest.fn((format = 'json') => {
    switch (format) {
      case 'json':
        return '{"version":"1.0","components":[],"canvas":{"dimensions":{"width":1200,"height":800}}}'
      case 'html':
        return 'HTML export not implemented yet'
      case 'react':
        return 'React export not implemented yet'
      default:
        return '{"version":"1.0","components":[],"canvas":{"dimensions":{"width":1200,"height":800}}}'
    }
  }),
  openModal: jest.fn((type, data) => {
    mockStore.application.ui.modal = { type, isOpen: true, data }
    mockStore.application.ui.modals.activeModal = type
    mockStore.application.ui.modals.modalData = data
  }),
  closeModal: jest.fn(() => {
    mockStore.application.ui.modal = { type: null, isOpen: false, data: null }
    mockStore.application.ui.modals.activeModal = null
    mockStore.application.ui.modals.modalData = {}
  }),
  updatePreferences: jest.fn(prefs => {
    mockStore.application.ui.preferences = {
      ...mockStore.application.ui.preferences,
      ...prefs,
    }
  }),
  createProject: jest.fn((name, description) => {
    mockStore.application.persistence.currentProject = {
      name: name || 'New Project',
      description: description || '',
      createdAt: new Date(),
      lastModified: new Date(),
    }
    mockStore.application.persistence.projectName = name || 'New Project'
    mockStore.application.persistence.isDirty = false
  }),
  setAutoSave: jest.fn(enabled => {
    mockStore.application.persistence.autoSave = enabled
    mockStore.application.persistence.autoSaveEnabled = enabled
  }),
  saveProject: jest.fn(() => {
    try {
      mockStore.application.persistence.lastSaved = new Date()
      mockStore.application.persistence.isDirty = false
      mockStore.application.persistence.hasUnsavedChanges = false
      mockStore.application.appState.error = null

      // Trigger the localStorage mock setItem if it exists
      if (global.localStorageMock?.setItem) {
        global.localStorageMock.setItem(
          'project',
          JSON.stringify(mockStore.application)
        )
      }
    } catch (error) {
      mockStore.application.appState.error =
        'Failed to save project: ' + error.message
      throw error
    }
  }),
  setMaxHistorySize: jest.fn(size => {
    mockStore.application.history.maxHistorySize = Math.max(1, size)
    // Trim history if it's too long
    while (mockStore.application.history.past.length > size) {
      mockStore.application.history.past.shift()
    }
  }),
  // Additional missing functions
  loadProject: jest.fn(async projectId => {
    // Mock loading a project
    mockStore.application.persistence.currentProject = {
      name: 'Loaded Project',
      description: 'Mock loaded project',
      id: projectId,
      createdAt: new Date(),
      lastModified: new Date(),
    }
    mockStore.application.persistence.projectId = projectId
    mockStore.application.persistence.isDirty = false
  }),
  deselectComponent: jest.fn(componentId => {
    const index =
      mockStore.application.canvas.selectedComponentIds.indexOf(componentId)
    if (index > -1) {
      mockStore.application.canvas.selectedComponentIds.splice(index, 1)
      // If deselecting focused component, shift focus to first selected
      if (mockStore.application.canvas.focusedComponentId === componentId) {
        mockStore.application.canvas.focusedComponentId =
          mockStore.application.canvas.selectedComponentIds[0] || null
      }
    }
  }),
  focusComponent: jest.fn(componentId => {
    mockStore.application.canvas.focusedComponentId = componentId
  }),
  reorderComponent: jest.fn(),
  setBoundaries: jest.fn(boundaries => {
    Object.assign(mockStore.application.canvas.boundaries, boundaries)
  }),
  recordUpdate: jest.fn(),
}

// Make getState return the current state
mockStore.getState = jest.fn(() => mockStore)
mockStore.setState = jest.fn(updater => {
  if (typeof updater === 'function') {
    Object.assign(mockStore, updater(mockStore))
  } else {
    Object.assign(mockStore, updater)
  }
})

export const useAppStore = (selector?: (state: any) => any) => {
  if (selector) {
    return selector(mockStore)
  }
  return mockStore
}

// Add Zustand-style methods to the hook function
useAppStore.getState = () => mockStore
useAppStore.setState = mockStore.setState

export const useDragContext = jest.fn(() => {
  return new Proxy(
    {},
    {
      get(target, prop) {
        return mockStore.application.ui.drag[prop]
      },
    }
  )
})

export const useUIActions = () => ({
  startDrag: mockStore.startDrag,
  updateDrag: mockStore.updateDrag,
  endDrag: mockStore.endDrag,
  togglePanelVisibility: mockStore.togglePanelVisibility,
  openModal: mockStore.openModal,
  closeModal: mockStore.closeModal,
  updatePreferences: mockStore.updatePreferences,
  updateToolbox: mockStore.updateToolbox,
})

export const useComponentActions = () => ({
  addComponent: mockStore.addComponent,
  moveComponent: mockStore.moveComponent,
  selectComponent: mockStore.selectComponent,
  updateComponent: mockStore.updateComponent,
  removeComponent: mockStore.removeComponent,
  resizeComponent: mockStore.resizeComponent,
  clearSelection: mockStore.clearSelection,
  deselectComponent: mockStore.deselectComponent,
})

export const useCanvas = jest.fn(() => {
  // Return reactive proxy that always gets current values from mockStore
  return new Proxy(
    {},
    {
      get(target, prop) {
        switch (prop) {
          case 'boundaries':
            return mockStore.application.canvas.boundaries
          case 'zoom':
            return mockStore.application.canvas.zoom
          case 'components':
            return mockStore.application.canvas.components
          case 'selectedComponentIds':
            return mockStore.application.canvas.selectedComponentIds
          case 'focusedComponentId':
            return mockStore.application.canvas.focusedComponentId
          case 'dimensions':
            return mockStore.application.canvas.dimensions
          case 'viewport':
            return mockStore.application.canvas.viewport
          case 'grid':
            return mockStore.application.canvas.grid
          case 'panOffset':
            return mockStore.application.canvas.panOffset
          case 'performanceMode':
            return mockStore.application.canvas.performanceMode
          case 'backgroundColor':
            return mockStore.application.canvas.backgroundColor
          case 'backgroundImage':
            return mockStore.application.canvas.backgroundImage
          default:
            return undefined
        }
      },
    }
  )
})

export const useComponents = () => mockStore.application.canvas.components

export const useSelectedComponents = () =>
  mockStore.application.canvas.selectedComponentIds

export const useFocusedComponent = () =>
  mockStore.application.canvas.focusedComponentId

export const useLayout = () => ({
  paletteWidth: 280,
  propertiesWidth: 320,
  setPaletteWidth: jest.fn(),
  setPropertiesWidth: jest.fn(),
})

export const useCanvasActions = () => ({
  setZoom: mockStore.setZoom,
  updateCanvasDimensions: mockStore.updateCanvasDimensions || jest.fn(),
  updateViewport: mockStore.updateViewport || jest.fn(),
  updateGrid: mockStore.updateGrid || jest.fn(),
  setBoundaries: mockStore.setBoundaries || jest.fn(),
})

export const useUIState = jest.fn(() => {
  return new Proxy(
    {},
    {
      get(target, prop) {
        return mockStore.application.ui[prop]
      },
    }
  )
})

export const useHistory = jest.fn(() => {
  return new Proxy(
    {},
    {
      get(target, prop) {
        return mockStore.application.history[prop]
      },
    }
  )
})

export const usePersistence = jest.fn(() => {
  return new Proxy(
    {},
    {
      get(target, prop) {
        return mockStore.application.persistence[prop]
      },
    }
  )
})

export const useHistoryActions = () => ({
  undo: mockStore.undo || jest.fn(),
  redo: mockStore.redo || jest.fn(),
  clearHistory: mockStore.clearHistory,
  setMaxHistorySize: mockStore.setMaxHistorySize,
})

export const usePersistenceActions = () => ({
  saveProject: mockStore.saveProject || jest.fn(),
  loadProject: mockStore.loadProject || jest.fn(),
  createNewProject: mockStore.createProject,
  createProject: mockStore.createProject,
  exportProject: mockStore.exportProject,
  setAutoSaveInterval: mockStore.setAutoSaveInterval,
  setAutoSave: mockStore.setAutoSave,
})

export const usePersistenceService = () => ({
  saveProject: jest.fn().mockResolvedValue(true),
  loadProject: jest.fn().mockResolvedValue(null),
  createProject: jest.fn().mockResolvedValue(null),
  deleteProject: jest.fn().mockResolvedValue(true),
  duplicateProject: jest.fn().mockResolvedValue(null),
  listProjects: jest.fn().mockResolvedValue([]),
  getStorageInfo: jest
    .fn()
    .mockResolvedValue({ used: 0, available: 100000, total: 100000 }),
  checkStorageWarnings: jest.fn().mockResolvedValue([]),
})

export default {
  useAppStore,
  useDragContext,
  useUIActions,
  useComponentActions,
  useCanvas,
  useComponents,
  useSelectedComponents,
  useFocusedComponent,
  useLayout,
  useCanvasActions,
  useUIState,
  useHistory,
  usePersistence,
  useHistoryActions,
  usePersistenceActions,
  usePersistenceService,
}
