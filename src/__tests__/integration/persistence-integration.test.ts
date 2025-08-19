import { PersistenceService } from '../../services/storage/PersistenceService'
import { ComponentType } from '../../types'

// Mock localStorage
let mockStore: Record<string, string> = {}

const localStorageMock = {
  getItem: jest.fn((key: string) => mockStore[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStore[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key]
  }),
  clear: jest.fn(() => {
    mockStore = {}
  }),
  key: jest.fn((index: number) => Object.keys(mockStore)[index] || null),
  get length() {
    return Object.keys(mockStore).length
  },
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Persistence Integration Tests', () => {
  let persistenceService: PersistenceService

  beforeEach(() => {
    persistenceService = new PersistenceService()
    localStorageMock.clear()
    jest.clearAllMocks()

    // Reset localStorage mock to working state
    localStorageMock.setItem = jest.fn((key: string, value: string) => {
      mockStore[key] = value
    })

    localStorageMock.getItem = jest.fn((key: string) => {
      return mockStore[key] || null
    })
  })

  const createComplexCanvas = () => ({
    components: new Map([
      [
        'text-1',
        {
          id: 'text-1',
          type: ComponentType.TEXT,
          props: { content: 'Hello World', fontSize: 16, color: '#000000' },
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
        },
      ],
      [
        'button-1',
        {
          id: 'button-1',
          type: ComponentType.BUTTON,
          props: {
            label: 'Click Me',
            backgroundColor: '#3b82f6',
            textColor: '#ffffff',
            borderRadius: 6,
          },
          position: { x: 150, y: 200 },
          dimensions: { width: 120, height: 40 },
          zIndex: 2,
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
        },
      ],
      [
        'textarea-1',
        {
          id: 'textarea-1',
          type: ComponentType.TEXTAREA,
          props: { content: 'Sample text area content', fontSize: 14, rows: 3 },
          position: { x: 50, y: 300 },
          dimensions: { width: 300, height: 80 },
          zIndex: 3,
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
        },
      ],
      [
        'image-1',
        {
          id: 'image-1',
          type: ComponentType.IMAGE,
          props: {
            src: 'https://example.com/image.jpg',
            alt: 'Sample Image',
            objectFit: 'cover',
          },
          position: { x: 400, y: 150 },
          dimensions: { width: 200, height: 150 },
          zIndex: 4,
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
        },
      ],
    ]),
    selectedComponentIds: ['text-1', 'button-1'],
    focusedComponentId: 'text-1',
    dimensions: { width: 1200, height: 800 },
    viewport: { x: 0, y: 0, width: 1200, height: 800 },
    zoom: 1.5,
    grid: { enabled: true, size: 20, snapToGrid: true, visible: true },
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
  })

  describe('End-to-End Project Lifecycle', () => {
    it('should handle complete project lifecycle with complex data', async () => {
      const canvas = createComplexCanvas()

      // 1. Create project
      const project = await persistenceService.createProject(
        'Complex Test Project',
        'A project with multiple component types and complex state',
        canvas
      )

      expect(project).toBeDefined()
      expect(project.name).toBe('Complex Test Project')
      expect(project.canvas.components.size).toBe(4)
      expect(project.canvas.selectedComponentIds).toEqual([
        'text-1',
        'button-1',
      ])
      expect(project.canvas.zoom).toBe(1.5)

      // 2. Load project and verify integrity
      const loadedProject = await persistenceService.loadProject(project.id)
      expect(loadedProject).not.toBeNull()
      expect(loadedProject!.name).toBe('Complex Test Project')
      expect(loadedProject!.canvas.components.size).toBe(4)
      expect(loadedProject!.canvas.selectedComponentIds).toEqual([
        'text-1',
        'button-1',
      ])
      expect(loadedProject!.canvas.focusedComponentId).toBe('text-1')
      expect(loadedProject!.canvas.zoom).toBe(1.5)

      // 3. Verify component data integrity
      const textComponent = loadedProject!.canvas.components.get('text-1')
      expect(textComponent).toBeDefined()
      expect(textComponent!.type).toBe(ComponentType.TEXT)
      expect(textComponent!.props.content).toBe('Hello World')
      expect(textComponent!.props.fontSize).toBe(16)

      const buttonComponent = loadedProject!.canvas.components.get('button-1')
      expect(buttonComponent).toBeDefined()
      expect(buttonComponent!.type).toBe(ComponentType.BUTTON)
      expect(buttonComponent!.props.label).toBe('Click Me')
      expect(buttonComponent!.props.backgroundColor).toBe('#3b82f6')

      // 4. Update project and save again
      loadedProject!.name = 'Updated Complex Project'
      loadedProject!.canvas.components.delete('textarea-1')
      loadedProject!.canvas.selectedComponentIds = ['text-1']
      loadedProject!.canvas.zoom = 2.0

      const saveSuccess = await persistenceService.saveProject(
        project.id,
        loadedProject!
      )
      expect(saveSuccess).toBe(true)

      // 5. Reload and verify changes
      const reloadedProject = await persistenceService.loadProject(project.id)
      expect(reloadedProject!.name).toBe('Updated Complex Project')
      expect(reloadedProject!.canvas.components.size).toBe(3) // textarea-1 removed
      expect(reloadedProject!.canvas.selectedComponentIds).toEqual(['text-1'])
      expect(reloadedProject!.canvas.zoom).toBe(2.0)
      expect(reloadedProject!.canvas.components.has('textarea-1')).toBe(false)

      // 6. List projects
      const projects = await persistenceService.listProjects()
      expect(projects.length).toBe(1)
      expect(projects[0].name).toBe('Updated Complex Project')

      // 7. Delete project
      const deleteSuccess = await persistenceService.deleteProject(project.id)
      expect(deleteSuccess).toBe(true)

      const deletedProject = await persistenceService.loadProject(project.id)
      expect(deletedProject).toBeNull()
    })

    it('should handle multiple projects simultaneously', async () => {
      const canvas1 = createComplexCanvas()
      const canvas2 = createComplexCanvas()
      canvas2.components.clear()
      canvas2.components.set('solo-text', {
        id: 'solo-text',
        type: ComponentType.TEXT,
        props: { content: 'Solo Text' },
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 30 },
        zIndex: 1,
        constraints: {
          movable: true,
          resizable: true,
          deletable: true,
          copyable: true,
        },
        metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
      })

      // Create multiple projects
      const project1 = await persistenceService.createProject(
        'Project Alpha',
        'First project',
        canvas1
      )
      const project2 = await persistenceService.createProject(
        'Project Beta',
        'Second project',
        canvas2
      )

      // Verify both exist
      const projects = await persistenceService.listProjects()
      expect(projects.length).toBe(2)

      const projectNames = projects.map(p => p.name).sort()
      expect(projectNames).toEqual(['Project Alpha', 'Project Beta'])

      // Load and verify both projects independently
      const loadedProject1 = await persistenceService.loadProject(project1.id)
      const loadedProject2 = await persistenceService.loadProject(project2.id)

      expect(loadedProject1!.canvas.components.size).toBe(4)
      expect(loadedProject2!.canvas.components.size).toBe(1)
      expect(loadedProject2!.canvas.components.has('solo-text')).toBe(true)

      // Clean up
      await persistenceService.deleteProject(project1.id)
      await persistenceService.deleteProject(project2.id)
    })
  })

  describe('Storage Management Integration', () => {
    it('should handle storage capacity monitoring during operations', async () => {
      // Get initial storage info
      const initialInfo = await persistenceService.getDetailedStorageInfo()
      expect(initialInfo.percentage).toBeGreaterThanOrEqual(0)

      // Create several projects to use storage
      const projects = []
      for (let i = 0; i < 5; i++) {
        const canvas = createComplexCanvas()
        const project = await persistenceService.createProject(
          `Storage Test Project ${i}`,
          `Project ${i} for storage testing`,
          canvas
        )
        projects.push(project)
      }

      // Check storage usage increased
      const afterCreationInfo =
        await persistenceService.getDetailedStorageInfo()
      expect(afterCreationInfo.used).toBeGreaterThan(initialInfo.used)
      expect(afterCreationInfo.itemCount).toBeGreaterThan(initialInfo.itemCount)

      // Get storage warnings
      const warnings = await persistenceService.checkStorageWarnings()
      expect(['safe', 'warning', 'critical', 'full']).toContain(warnings.level)
      expect(warnings.message).toBeDefined()
      expect(Array.isArray(warnings.recommendations)).toBe(true)

      // Clean up
      for (const project of projects) {
        await persistenceService.deleteProject(project.id)
      }
    })

    it('should handle backup and restore integration', async () => {
      const canvas = createComplexCanvas()
      const project = await persistenceService.createProject(
        'Backup Test Project',
        'Project for backup testing',
        canvas
      )

      // Create backup
      const backupResult = await persistenceService.createBackup(project.id)
      expect(backupResult.success).toBe(true)
      expect(backupResult.backupId).toBeDefined()

      // Modify original project
      project.name = 'Modified Project'
      project.canvas.components.clear()
      await persistenceService.saveProject(project.id, project)

      // Verify modification
      const modifiedProject = await persistenceService.loadProject(project.id)
      expect(modifiedProject!.name).toBe('Modified Project')
      expect(modifiedProject!.canvas.components.size).toBe(0)

      // Restore from backup
      const restoreResult = await persistenceService.restoreFromBackup(
        backupResult.backupId!
      )
      expect(restoreResult.success).toBe(true)

      // Verify restoration
      const restoredProject = await persistenceService.loadProject(project.id)
      expect(restoredProject!.name).toBe('Backup Test Project') // Original name
      expect(restoredProject!.canvas.components.size).toBe(4) // Original components

      // Clean up
      await persistenceService.deleteProject(project.id)
      await persistenceService.deleteBackup(backupResult.backupId!)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle corrupted project data gracefully', async () => {
      const canvas = createComplexCanvas()
      const project = await persistenceService.createProject(
        'Test Project',
        'Test',
        canvas
      )

      // Manually corrupt the project data in storage
      const projectKey = `aura-editor:projects:${project.id}`
      const validData = localStorageMock.getItem(projectKey)
      expect(validData).toBeDefined()

      // Corrupt the data
      const corruptedData =
        validData!.slice(0, validData!.length / 2) + '{"corrupted": true}'
      localStorageMock.setItem(projectKey, corruptedData)

      // Attempt to load corrupted project
      const loadedProject = await persistenceService.loadProject(project.id)
      // Should either return null or recovered data, but not throw
      if (loadedProject) {
        expect(typeof loadedProject).toBe('object')
      }

      // Clean up
      try {
        await persistenceService.deleteProject(project.id)
      } catch {
        // Expected if project is corrupted
      }
    })

    it('should handle localStorage failures gracefully', async () => {
      const canvas = createComplexCanvas()

      // Mock localStorage to fail
      localStorageMock.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      // Attempt to create project (should handle gracefully)
      try {
        const project = await persistenceService.createProject(
          'Failing Project',
          'Test',
          canvas
        )
        // If it succeeds, that's okay too (error handling worked)
        expect(project).toBeDefined()
      } catch (error) {
        // Should throw a meaningful error
        expect(error).toBeDefined()
        expect((error as Error).message).toContain('Project creation failed')
      }

      // Restore original function completely
      localStorageMock.setItem = jest.fn((key: string, value: string) => {
        mockStore[key] = value
      })
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large projects efficiently', async () => {
      // Create a large canvas with many components
      const largeCanvas = {
        components: new Map(),
        selectedComponentIds: [],
        focusedComponentId: null,
        dimensions: { width: 2000, height: 1500 },
        viewport: { x: 0, y: 0, width: 2000, height: 1500 },
        zoom: 1,
        grid: { enabled: true, size: 20, snapToGrid: false, visible: true },
        boundaries: { minX: 0, minY: 0, maxX: 2000, maxY: 1500 },
      }

      // Add 50 components
      for (let i = 0; i < 50; i++) {
        largeCanvas.components.set(`component-${i}`, {
          id: `component-${i}`,
          type:
            i % 4 === 0
              ? ComponentType.TEXT
              : i % 4 === 1
                ? ComponentType.BUTTON
                : i % 4 === 2
                  ? ComponentType.TEXTAREA
                  : ComponentType.IMAGE,
          props: {
            content: `Content for component ${i}`,
            fontSize: 12 + (i % 8),
            color: `hsl(${i * 7}, 70%, 50%)`,
          },
          position: { x: (i % 10) * 100, y: Math.floor(i / 10) * 100 },
          dimensions: { width: 80, height: 40 },
          zIndex: i,
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
      }

      const startTime = Date.now()

      // Create large project
      const project = await persistenceService.createProject(
        'Large Test Project',
        'Project with 50 components',
        largeCanvas
      )

      const creationTime = Date.now() - startTime

      expect(project).toBeDefined()
      expect(project.canvas.components.size).toBe(50)
      expect(creationTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Test loading performance
      const loadStartTime = Date.now()
      const loadedProject = await persistenceService.loadProject(project.id)
      const loadTime = Date.now() - loadStartTime

      expect(loadedProject).not.toBeNull()
      expect(loadedProject!.canvas.components.size).toBe(50)
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds

      // Clean up
      await persistenceService.deleteProject(project.id)
    })

    it('should provide meaningful storage optimization suggestions', async () => {
      // Create some test data that should trigger suggestions
      const canvas = createComplexCanvas()

      // Create multiple projects
      for (let i = 0; i < 3; i++) {
        await persistenceService.createProject(
          `Project ${i}`,
          `Test project ${i}`,
          canvas
        )
      }

      // Add some autosave data
      for (let i = 0; i < 5; i++) {
        localStorageMock.setItem(
          `aura-editor:autosave:file${i}`,
          JSON.stringify({
            data: 'autosave data',
            timestamp: Date.now() - i * 1000,
          })
        )
      }

      const suggestions =
        await persistenceService.getStorageOptimizationSuggestions()
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)

      // Clean up projects
      const projects = await persistenceService.listProjects()
      for (const project of projects) {
        await persistenceService.deleteProject(project.id)
      }
    })
  })
})
