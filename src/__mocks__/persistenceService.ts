/**
 * Mock implementation for persistence services
 */

import { Project, UserSettings, StorageMetadata } from '@/types'

// Mock data
export const mockProject: Project = {
  id: 'mock-project-1',
  name: 'Mock Project',
  description: 'A test project',
  version: '1.0.0',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-15'),
  canvas: {
    components: new Map(),
    selectedComponentIds: [],
    focusedComponentId: null,
    dimensions: { width: 1200, height: 800 },
    viewport: { x: 0, y: 0, width: 1200, height: 800 },
    zoom: 1,
    grid: { enabled: true, size: 20, snapToGrid: false, visible: true },
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
  },
  ui: {},
  metadata: {
    id: 'mock-project-1',
    name: 'Mock Project',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-15'),
    size: 1024,
    componentCount: 0,
    tags: [],
  },
}

export const mockProjects: Project[] = [mockProject]

export const mockUserSettings: UserSettings = {
  theme: 'light',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 30000,
  showGrid: true,
  snapToGrid: false,
  showRulers: true,
  maxHistorySize: 50,
  defaultCanvasSize: { width: 1200, height: 800 },
  performanceMode: false,
}

export const mockStorageMetadata: StorageMetadata = {
  version: '1.0.0',
  storageUsage: 1024,
  availableSpace: 4194304, // ~4MB
  totalProjects: 1,
  lastCleanup: new Date(),
  keyCount: 5,
}

// Persistence Service Mock
export const mockPersistenceService = {
  // Project Operations
  saveProject: jest.fn().mockResolvedValue(true),
  loadProject: jest.fn().mockResolvedValue(mockProject),
  deleteProject: jest.fn().mockResolvedValue(true),
  listProjects: jest.fn().mockResolvedValue(mockProjects),

  // Auto-Save Operations
  enableAutoSave: jest.fn(),
  disableAutoSave: jest.fn(),
  isAutoSaveEnabled: jest.fn().mockReturnValue(true),
  getLastSaveTime: jest.fn().mockReturnValue(new Date()),

  // Settings & Metadata
  saveSettings: jest.fn().mockResolvedValue(true),
  loadSettings: jest.fn().mockResolvedValue(mockUserSettings),
  getStorageInfo: jest.fn().mockResolvedValue(mockStorageMetadata),

  // Backup & Export
  exportProject: jest.fn().mockResolvedValue('{"project":"mock-data"}'),
  importProject: jest.fn().mockResolvedValue(mockProject),

  // Recovery & Validation
  validateData: jest.fn().mockResolvedValue(true),
  recoverFromCrash: jest.fn().mockResolvedValue(mockProject),
  cleanup: jest.fn().mockResolvedValue(undefined),
}

// Storage Manager Mock
export const mockStorageManager = {
  // Basic Operations
  setItem: jest.fn().mockResolvedValue(true),
  getItem: jest.fn().mockResolvedValue('mock-value'),
  removeItem: jest.fn().mockResolvedValue(true),
  clear: jest.fn().mockResolvedValue(true),

  // Batch Operations
  setItems: jest.fn().mockResolvedValue(true),
  getItems: jest.fn().mockResolvedValue({ key1: 'value1' }),
  removeItems: jest.fn().mockResolvedValue(true),

  // Storage Monitoring
  getStorageSize: jest.fn().mockResolvedValue(1024),
  getAvailableSpace: jest.fn().mockResolvedValue(4194304),
  isStorageFull: jest.fn().mockResolvedValue(false),

  // Key Management
  getAllKeys: jest.fn().mockResolvedValue(['key1', 'key2']),
  getKeysByPrefix: jest.fn().mockResolvedValue(['projects:key1']),
  keyExists: jest.fn().mockResolvedValue(true),

  // Health & Validation
  validateStorage: jest.fn().mockResolvedValue(true),
  getStorageInfo: jest.fn().mockResolvedValue({
    used: 1024,
    available: 4194304,
    total: 5242880,
    keys: 2,
  }),
}

// Serialization Service Mock
export const mockSerializationService = {
  // Project Serialization
  serializeProject: jest.fn().mockResolvedValue('{"serialized":"project"}'),
  deserializeProject: jest.fn().mockResolvedValue(mockProject),

  // Canvas Serialization
  serializeCanvas: jest.fn().mockResolvedValue('{"serialized":"canvas"}'),
  deserializeCanvas: jest.fn().mockResolvedValue(mockProject.canvas),

  // Generic Serialization
  serialize: jest.fn().mockResolvedValue('{"serialized":"data"}'),
  deserialize: jest.fn().mockResolvedValue({ deserialized: 'data' }),

  // Compression
  compress: jest.fn().mockResolvedValue('compressed-data'),
  decompress: jest.fn().mockResolvedValue('decompressed-data'),

  // Validation
  validateJson: jest.fn().mockReturnValue(true),
  validateProject: jest.fn().mockReturnValue(true),
  validateCanvas: jest.fn().mockReturnValue(true),

  // Version Handling
  getCurrentVersion: jest.fn().mockReturnValue('1.0.0'),
  migrateData: jest.fn().mockResolvedValue('{"migrated":"data"}'),

  // Size Estimation
  estimateSize: jest.fn().mockReturnValue(1024),
  getCompressionRatio: jest.fn().mockReturnValue(0.6),
}

// Project Manager Mock
export const mockProjectManager = {
  // Project CRUD
  createProject: jest.fn().mockResolvedValue(mockProject),
  getProject: jest.fn().mockResolvedValue(mockProject),
  updateProject: jest.fn().mockResolvedValue(true),
  deleteProject: jest.fn().mockResolvedValue(true),
  duplicateProject: jest
    .fn()
    .mockResolvedValue({ ...mockProject, id: 'duplicated-project' }),

  // Project Listing & Search
  getAllProjects: jest.fn().mockResolvedValue(mockProjects),
  getRecentProjects: jest.fn().mockResolvedValue(mockProjects),
  searchProjects: jest.fn().mockResolvedValue(mockProjects),
  getProjectsByTag: jest.fn().mockResolvedValue(mockProjects),

  // Metadata Management
  getProjectMetadata: jest.fn().mockResolvedValue(mockProject.metadata),
  updateProjectMetadata: jest.fn().mockResolvedValue(true),

  // Thumbnail Management
  generateThumbnail: jest
    .fn()
    .mockResolvedValue('data:image/png;base64,mock-thumbnail'),
  updateThumbnail: jest.fn().mockResolvedValue(true),
  getThumbnail: jest
    .fn()
    .mockResolvedValue('data:image/png;base64,mock-thumbnail'),

  // Project Organization
  addProjectTag: jest.fn().mockResolvedValue(true),
  removeProjectTag: jest.fn().mockResolvedValue(true),
  getProjectTags: jest.fn().mockResolvedValue(['tag1', 'tag2']),

  // Validation & Cleanup
  validateProject: jest.fn().mockReturnValue(true),
  cleanupOrphanedProjects: jest.fn().mockResolvedValue(2),
  repairProject: jest.fn().mockResolvedValue(true),
}

// Export everything as default mock
export default {
  PersistenceService: mockPersistenceService,
  StorageManager: mockStorageManager,
  SerializationService: mockSerializationService,
  ProjectManager: mockProjectManager,
}
