import { PersistenceService } from '../../services/storage/PersistenceService'
import { ComponentType } from '../../types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Project Management', () => {
  let persistenceService: PersistenceService

  beforeEach(() => {
    persistenceService = new PersistenceService()
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  const createMockCanvas = () => ({
    components: new Map(),
    selectedComponentIds: [],
    focusedComponentId: null,
    dimensions: { width: 1200, height: 800 },
    viewport: { x: 0, y: 0, width: 1200, height: 800 },
    zoom: 1,
    grid: { enabled: true, size: 20, snapToGrid: false, visible: true },
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
  })

  describe('createProject', () => {
    it('should create a new project with correct metadata', async () => {
      const canvas = createMockCanvas()
      const project = await persistenceService.createProject(
        'Test Project',
        'A test project description',
        canvas
      )

      expect(project).toBeDefined()
      expect(project.name).toBe('Test Project')
      expect(project.description).toBe('A test project description')
      expect(project.id).toBeDefined()
      expect(project.createdAt).toBeInstanceOf(Date)
      expect(project.updatedAt).toBeInstanceOf(Date)
      expect(project.canvas).toBeDefined()
      expect(project.metadata).toBeDefined()
      expect(project.metadata.componentCount).toBe(0)
    })

    it('should save the created project to storage', async () => {
      const canvas = createMockCanvas()
      await persistenceService.createProject(
        'Test Project',
        'Description',
        canvas
      )

      // Check that localStorage was called to save the project
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('listProjects', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await persistenceService.listProjects()
      expect(projects).toEqual([])
    })

    it('should return list of projects', async () => {
      const canvas = createMockCanvas()

      // Create projects
      await persistenceService.createProject('Project 1', 'First', canvas)
      await persistenceService.createProject('Project 2', 'Second', canvas)

      const projects = await persistenceService.listProjects()

      expect(projects).toHaveLength(2)
      // Check that both projects exist
      const projectNames = projects.map(p => p.name)
      expect(projectNames).toContain('Project 1')
      expect(projectNames).toContain('Project 2')
    })
  })

  describe('loadProject', () => {
    it('should load existing project', async () => {
      const canvas = createMockCanvas()
      const createdProject = await persistenceService.createProject(
        'Test',
        'Description',
        canvas
      )

      const loadedProject = await persistenceService.loadProject(
        createdProject.id
      )

      expect(loadedProject).toBeDefined()
      expect(loadedProject!.name).toBe('Test')
      expect(loadedProject!.description).toBe('Description')
    })

    it('should return null for non-existent project', async () => {
      const project = await persistenceService.loadProject('non-existent-id')
      expect(project).toBeNull()
    })
  })

  describe('duplicateProject', () => {
    it('should create copy of existing project', async () => {
      const canvas = createMockCanvas()
      // Add a component to the canvas to test duplication
      canvas.components.set('comp1', {
        id: 'comp1',
        type: ComponentType.TEXT,
        props: { content: 'Hello World' },
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 50 },
        zIndex: 1,
        constraints: {
          movable: true,
          resizable: true,
          deletable: true,
          copyable: true,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      })

      const original = await persistenceService.createProject(
        'Original',
        'Original desc',
        canvas
      )
      const duplicate = await persistenceService.duplicateProject(
        original.id,
        'Copy of Original'
      )

      expect(duplicate).toBeDefined()
      expect(duplicate.id).not.toBe(original.id)
      expect(duplicate.name).toBe('Copy of Original')
      expect(duplicate.description).toBe(original.description)
      expect(duplicate.canvas.components.size).toBe(1)
      expect(duplicate.canvas.components.get('comp1')).toBeDefined()
    })

    it('should use default name if not provided', async () => {
      const canvas = createMockCanvas()
      const original = await persistenceService.createProject(
        'Original Project',
        'Desc',
        canvas
      )
      const duplicate = await persistenceService.duplicateProject(original.id)

      expect(duplicate.name).toBe('Original Project (Copy)')
    })

    it('should throw error for non-existent project', async () => {
      await expect(
        persistenceService.duplicateProject('non-existent-id')
      ).rejects.toThrow('Project duplication failed')
    })
  })

  describe('deleteProject', () => {
    it('should delete project and its metadata', async () => {
      const canvas = createMockCanvas()
      const project = await persistenceService.createProject(
        'To Delete',
        'Will be deleted',
        canvas
      )

      const success = await persistenceService.deleteProject(project.id)

      expect(success).toBe(true)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `aura-editor:projects:${project.id}`
      )
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `aura-editor:metadata:${project.id}`
      )
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `aura-editor:thumbnails:${project.id}`
      )
    })

    it('should return true even for non-existent project', async () => {
      const success = await persistenceService.deleteProject('non-existent')
      expect(success).toBe(true)
    })
  })
})
