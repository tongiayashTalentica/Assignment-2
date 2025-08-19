import { ReactNode } from 'react'

// Core application types
export interface AppState {
  isLoading: boolean
  error: string | null
}

// Layout types
export interface PanelProps {
  className?: string
  children?: ReactNode
}

export interface LayoutConfig {
  leftPanelWidth: number
  rightPanelWidth: number
  centerPanelWidth: number
}

// Component types
export interface BaseComponent {
  id: string
  type: ComponentType
  props: Record<string, unknown>
  position: Position
  dimensions: Dimensions
  zIndex: number
  parentId?: string
  children?: string[]
  constraints?: ComponentConstraints
  metadata?: ComponentMetadata
}

// Added: Typed properties for core components
export type ComponentProperties =
  | TextProperties
  | TextAreaProperties
  | ImageProperties
  | ButtonProperties

export interface TextProperties {
  kind: 'text'
  content: string
  fontSize: number // 8-72
  fontWeight: 400 | 700
  color: string // #RRGGBB
}

export interface TextAreaProperties {
  kind: 'textarea'
  content: string
  fontSize: number // 8-72
  color: string // #RRGGBB
  textAlign: 'left' | 'center' | 'right'
}

export interface ImageProperties {
  kind: 'image'
  src: string
  alt?: string
  objectFit: 'cover' | 'contain' | 'fill'
  borderRadius: number // 0-50
}

export interface ButtonProperties {
  kind: 'button'
  url: string
  label: string
  fontSize: number // 8-72
  padding: number
  backgroundColor: string // #RRGGBB
  textColor: string // #RRGGBB
  borderRadius: number // 0-50
}

export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface ComponentConstraints {
  movable: boolean
  resizable: boolean
  deletable: boolean
  copyable: boolean
}

export interface ComponentMetadata {
  createdAt: Date
  updatedAt: Date
  version: number
}

export enum ComponentType {
  TEXT = 'text',
  BUTTON = 'button',
  IMAGE = 'image',
  CONTAINER = 'container',
  INPUT = 'input',
  FORM = 'form',
  GRID = 'grid',
  FLEX = 'flex',
  TEXTAREA = 'textarea',
}

// Canvas state types
export interface CanvasState {
  components: Map<string, BaseComponent>
  selectedComponentIds: string[]
  focusedComponentId: string | null
  dimensions: CanvasDimensions
  viewport: Viewport
  zoom: number
  grid: GridConfig
  boundaries: CanvasBoundaries
}

export interface CanvasDimensions {
  width: number
  height: number
}

export interface Viewport {
  x: number
  y: number
  width: number
  height: number
}

export interface GridConfig {
  enabled: boolean
  size: number
  snapToGrid: boolean
  visible: boolean
}

export interface CanvasBoundaries {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

// UI state types
export interface UIState {
  dragContext: DragContext
  activePanel: PanelType
  panelVisibility: PanelVisibility
  previewMode: PreviewMode
  modals: ModalState
  preferences: UIPreferences
  toolbox: ToolboxState
}

// Enhanced drag-and-drop system types
export enum DragState {
  IDLE = 'idle',
  DRAGGING_FROM_PALETTE = 'dragging_from_palette',
  DRAGGING_CANVAS_COMPONENT = 'dragging_canvas_component',
  DRAG_ENDING = 'drag_ending',
}

export interface DragContext {
  state: DragState
  draggedComponent: ComponentType | BaseComponent | null
  startPosition: Position
  currentPosition: Position
  targetElement: HTMLElement | null
  dragOffset: Position
  isDragValid: boolean
  dragPreview?: DragPreview
  dropZone?: DropZone
  constraints?: DragConstraints
  performanceData?: DragPerformanceData
}

export enum DragType {
  NONE = 'none',
  COMPONENT = 'component',
  NEW_COMPONENT = 'new_component',
  RESIZE = 'resize',
  MOVE = 'move',
}

export interface DropZone {
  id: string
  type: 'canvas' | 'container'
  bounds: DOMRect
  isValid: boolean
  targetComponent?: BaseComponent
}

export interface DragPreview {
  component: BaseComponent | ComponentType
  element: HTMLElement | null
  offset: Position
  ghostElement?: HTMLElement
}

export interface DragConstraints {
  boundaries: CanvasBoundaries
  snapToGrid: boolean
  gridSize: number
  minDragDistance: number
  preventOverlap: boolean
}

export interface DragPerformanceData {
  frameCount: number
  averageFrameTime: number
  lastFrameTime: number
  memoryUsage: number
}

// Event handling types
export interface NormalizedDragEvent {
  clientX: number
  clientY: number
  pageX: number
  pageY: number
  target: EventTarget | null
  type: 'mouse' | 'touch'
  identifier?: number
  preventDefault: () => void
  stopPropagation: () => void
}

export interface DragEventHandler {
  handleDragStart: (event: MouseEvent | TouchEvent) => void
  handleDragMove: (event: MouseEvent | TouchEvent) => void
  handleDragEnd: (event: MouseEvent | TouchEvent) => void
  normalizeEvent: (event: MouseEvent | TouchEvent) => NormalizedDragEvent
  cleanup: () => void
}

// Performance monitoring
export interface DragPerformanceMonitor {
  startFrameTracking: () => void
  endFrameTracking: () => void
  getMetrics: () => DragPerformanceData
  reset: () => void
}

export enum PanelType {
  PALETTE = 'palette',
  PROPERTIES = 'properties',
  LAYERS = 'layers',
  ASSETS = 'assets',
}

export interface PanelVisibility {
  palette: boolean
  properties: boolean
  layers: boolean
  assets: boolean
}

export enum PreviewMode {
  DESIGN = 'design',
  PREVIEW = 'preview',
  CODE = 'code',
}

export interface ModalState {
  activeModal: ModalType | null
  modalData?: Record<string, unknown>
}

export enum ModalType {
  COMPONENT_PROPERTIES = 'component_properties',
  PROJECT_SETTINGS = 'project_settings',
  EXPORT_OPTIONS = 'export_options',
  IMPORT_COMPONENTS = 'import_components',
}

export interface UIPreferences {
  theme: 'light' | 'dark'
  language: string
  autoSave: boolean
  showGrid: boolean
  snapToGrid: boolean
  showRulers: boolean
}

export interface ToolboxState {
  activeCategory: ComponentType | null
  searchQuery: string
  recentComponents: ComponentType[]
}

// History state types
export interface HistoryState {
  past: CanvasSnapshot[]
  present: CanvasSnapshot
  future: CanvasSnapshot[]
  maxHistorySize: number
  canUndo: boolean
  canRedo: boolean
}

export interface CanvasSnapshot {
  id: string
  timestamp: Date
  components: Map<string, BaseComponent>
  selectedComponentIds: string[]
  canvasDimensions: CanvasDimensions
  viewport: Viewport
  zoom: number
  description?: string
}

// Persistence state types
export interface PersistenceState {
  currentProject: Project | null
  isDirty: boolean
  lastSaved: Date | null
  autoSaveEnabled: boolean
  autoSaveInterval: number
  savingInProgress: boolean
  projectList: ProjectMetadata[]
}

export interface Project {
  id: string
  name: string
  description?: string
  version: string
  createdAt: Date
  updatedAt: Date
  canvas: CanvasState
  ui: Partial<UIState>
  metadata: ProjectMetadata
}

export interface ProjectMetadata {
  id: string
  name: string
  description?: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  size: number
  componentCount: number
  tags?: string[]
}

// Persistence-specific types
export interface UserSettings {
  theme: 'light' | 'dark'
  language: string
  autoSave: boolean
  autoSaveInterval: number
  showGrid: boolean
  snapToGrid: boolean
  showRulers: boolean
  maxHistorySize: number
  defaultCanvasSize: CanvasDimensions
  performanceMode: boolean
}

export interface StorageMetadata {
  version: string
  storageUsage: number
  availableSpace: number
  totalProjects: number
  lastCleanup: Date
  keyCount: number
}

// Main application state interface
export interface ApplicationState {
  canvas: CanvasState
  ui: UIState
  history: HistoryState
  persistence: PersistenceState
}

// Store actions interface
export interface StoreActions {
  // General actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Layout actions
  updateLayout: (layout: Partial<LayoutConfig>) => void

  // Component actions
  addComponent: (component: BaseComponent, addToHistory?: boolean) => void
  removeComponent: (id: string, addToHistory?: boolean) => void
  updateComponent: (
    id: string,
    updates: Partial<BaseComponent>,
    addToHistory?: boolean
  ) => void
  duplicateComponent: (id: string, addToHistory?: boolean) => void
  selectComponent: (id: string, multiSelect?: boolean) => void
  deselectComponent: (id: string) => void
  clearSelection: () => void
  focusComponent: (id: string | null) => void
  moveComponent: (
    id: string,
    position: Position,
    addToHistory?: boolean
  ) => void
  resizeComponent: (
    id: string,
    dimensions: Dimensions,
    addToHistory?: boolean
  ) => void
  reorderComponent: (id: string, zIndex: number, addToHistory?: boolean) => void

  // Canvas actions
  updateCanvasDimensions: (dimensions: CanvasDimensions) => void
  updateViewport: (viewport: Partial<Viewport>) => void
  setZoom: (zoom: number) => void
  updateGrid: (grid: Partial<GridConfig>) => void
  setBoundaries: (boundaries: CanvasBoundaries) => void

  // UI actions
  startDrag: (dragContext: Partial<DragContext>) => void
  updateDrag: (updates: Partial<DragContext>) => void
  endDrag: () => void
  setActivePanel: (panel: PanelType) => void
  togglePanelVisibility: (panel: keyof PanelVisibility) => void
  setPreviewMode: (mode: PreviewMode) => void
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void
  closeModal: () => void
  updatePreferences: (preferences: Partial<UIPreferences>) => void
  updateToolbox: (toolbox: Partial<ToolboxState>) => void

  // History actions
  undo: () => void
  redo: () => void
  addToHistory: (description?: string) => void
  clearHistory: () => void
  setMaxHistorySize: (size: number) => void

  // Persistence actions
  saveProject: () => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  createProject: (name: string, description?: string) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  duplicateProject: (projectId: string, newName: string) => Promise<void>
  setAutoSave: (enabled: boolean) => void
  setAutoSaveInterval: (interval: number) => void
  exportProject: (format: 'json' | 'html' | 'react') => Promise<string>
  importProject: (data: string, format: 'json') => Promise<void>
}

// Combined store state interface
export interface StoreState extends AppState {
  layout: LayoutConfig
  application: ApplicationState
}

// Performance monitoring types
export interface PerformanceMetrics {
  stateUpdateTime: number
  renderTime: number
  memoryUsage: number
  componentCount: number
  historySize: number
}

// Validation types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  componentId: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  componentId: string
  field: string
  message: string
  suggestion?: string
}

// Selector types for performance optimization
export interface StateSelectors {
  selectCanvas: (state: ApplicationState) => CanvasState
  selectComponents: (state: ApplicationState) => Map<string, BaseComponent>
  selectSelectedComponents: (state: ApplicationState) => BaseComponent[]
  selectFocusedComponent: (state: ApplicationState) => BaseComponent | null
  selectUI: (state: ApplicationState) => UIState
  selectDragContext: (state: ApplicationState) => DragContext
  selectHistory: (state: ApplicationState) => HistoryState
  selectPersistence: (state: ApplicationState) => PersistenceState
  selectCanUndo: (state: ApplicationState) => boolean
  selectCanRedo: (state: ApplicationState) => boolean
  selectIsDirty: (state: ApplicationState) => boolean
}
