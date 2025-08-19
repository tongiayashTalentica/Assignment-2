import { SerializationService } from '../../services/storage/SerializationService'
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

describe('Data Recovery System', () => {
  let serializationService: SerializationService
  let persistenceService: PersistenceService

  beforeEach(() => {
    serializationService = new SerializationService()
    persistenceService = new PersistenceService()
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  const createMockProject = () => ({
    id: 'test-project-123',
    name: 'Test Project',
    description: 'A test project for recovery',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    canvas: {
      id: 'canvas-123',
      timestamp: Date.now(),
      components: new Map([
        [
          'comp1',
          {
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
          },
        ],
      ]),
      selectedComponentIds: ['comp1'],
      focusedComponentId: 'comp1',
      dimensions: { width: 1200, height: 800 },
      viewport: { x: 0, y: 0, width: 1200, height: 800 },
      zoom: 1,
      grid: { enabled: true, size: 20, snapToGrid: false, visible: true },
      boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
    },
    ui: {},
    metadata: {
      id: 'test-project-123',
      name: 'Test Project',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 1024,
      componentCount: 1,
      tags: [],
    },
  })

  describe('SerializationService - Integrity Protection', () => {
    it('should serialize data with integrity wrapper', async () => {
      const testData = { message: 'Hello World', number: 42 }

      const serializedWithIntegrity =
        await serializationService.serializeWithIntegrity(testData)

      expect(typeof serializedWithIntegrity).toBe('string')

      const wrapper = JSON.parse(serializedWithIntegrity)
      expect(wrapper).toHaveProperty('version')
      expect(wrapper).toHaveProperty('timestamp')
      expect(wrapper).toHaveProperty('checksum')
      expect(wrapper).toHaveProperty('data')
      expect(wrapper).toHaveProperty('metadata')
    })

    it('should detect data corruption using checksum', async () => {
      const testData = { message: 'Hello World', number: 42 }

      const serializedWithIntegrity =
        await serializationService.serializeWithIntegrity(testData)

      // Corrupt the data by modifying a character
      const corruptedData = serializedWithIntegrity.replace(
        'Hello World',
        'Hello XXXX!'
      )

      const result =
        await serializationService.deserializeWithIntegrity(corruptedData)

      expect(result.success).toBe(false)
      expect(result.corruption).toBe(true)
      expect(result.error).toContain('corruption detected')
    })

    it('should handle legacy data without integrity wrapper', async () => {
      const testData = { message: 'Legacy Data', number: 123 }

      // Serialize without integrity (legacy format)
      const legacyData = await serializationService.serialize(testData)

      // Should still be able to deserialize
      const result =
        await serializationService.deserializeWithIntegrity(legacyData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(testData)
    })

    it('should attempt data recovery for corrupted JSON', async () => {
      // Create corrupted JSON with trailing comma
      const corruptedJson =
        '{"name": "Test Project", "components": [1, 2, 3,], "valid": true}'

      const recovered =
        await serializationService.attemptDataRecovery(corruptedJson)

      expect(recovered).not.toBeNull()
      expect(recovered).toHaveProperty('name', 'Test Project')
      expect(recovered).toHaveProperty('valid', true)
    })

    it('should extract partial data from severely corrupted input', async () => {
      const partiallyCorrupted =
        'garbage_start{"name": "Partial Data", "value": 42}more_garbage'

      const recovered =
        await serializationService.attemptDataRecovery(partiallyCorrupted)

      expect(recovered).not.toBeNull()
      expect(recovered).toHaveProperty('name', 'Partial Data')
      expect(recovered).toHaveProperty('value', 42)
    })
  })

  describe('PersistenceService - Backup System', () => {
    it('should create project backup', async () => {
      const project = createMockProject()
      await persistenceService.saveProject(project.id, project)

      const backupResult = await persistenceService.createBackup(project.id)

      expect(backupResult.success).toBe(true)
      expect(backupResult.backupId).toBeDefined()
      expect(backupResult.message).toContain('Project backup created')
    })

    it('should create full backup of all projects', async () => {
      const project1 = createMockProject()
      const project2 = {
        ...createMockProject(),
        id: 'project-2',
        name: 'Project 2',
      }

      await persistenceService.saveProject(project1.id, project1)
      await persistenceService.saveProject(project2.id, project2)

      const backupResult = await persistenceService.createBackup()

      expect(backupResult.success).toBe(true)
      expect(backupResult.backupId).toBeDefined()
      expect(backupResult.message).toContain('2 projects')
    })

    it('should restore from project backup', async () => {
      const project = createMockProject()
      await persistenceService.saveProject(project.id, project)

      // Create backup
      const backupResult = await persistenceService.createBackup(project.id)
      expect(backupResult.success).toBe(true)

      // Delete original project
      await persistenceService.deleteProject(project.id)

      // Restore from backup
      const restoreResult = await persistenceService.restoreFromBackup(
        backupResult.backupId!
      )

      expect(restoreResult.success).toBe(true)
      expect(restoreResult.restoredProjects).toBe(1)
      expect(restoreResult.message).toContain('Project restored')

      // Verify project was restored
      const restoredProject = await persistenceService.loadProject(project.id)
      expect(restoredProject).not.toBeNull()
      expect(restoredProject!.name).toBe(project.name)
    })

    it('should list available backups', async () => {
      const project = createMockProject()
      await persistenceService.saveProject(project.id, project)

      // Create a couple of backups
      await persistenceService.createBackup(project.id)
      await persistenceService.createBackup() // Full backup

      const backups = await persistenceService.listBackups()

      expect(backups.length).toBe(2)
      expect(backups[0]).toHaveProperty('id')
      expect(backups[0]).toHaveProperty('type')
      expect(backups[0]).toHaveProperty('timestamp')
      expect(backups[0]).toHaveProperty('age')
      expect(backups[0]).toHaveProperty('size')
    })

    it('should delete backup', async () => {
      const project = createMockProject()
      await persistenceService.saveProject(project.id, project)

      const backupResult = await persistenceService.createBackup(project.id)
      expect(backupResult.success).toBe(true)

      const deleteResult = await persistenceService.deleteBackup(
        backupResult.backupId!
      )
      expect(deleteResult).toBe(true)

      // Verify backup is gone
      const backups = await persistenceService.listBackups()
      expect(backups.length).toBe(0)
    })
  })

  describe('PersistenceService - Crash Recovery', () => {
    beforeEach(() => {
      // Mock setInterval for crash recovery heartbeat
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should enable crash recovery system', async () => {
      await persistenceService.enableCrashRecovery()

      // Check that settings were saved
      const settings = localStorageMock.getItem(
        'aura-editor:settings:crash-recovery'
      )
      expect(settings).toBeDefined()

      const parsedSettings = JSON.parse(settings!)
      expect(parsedSettings.enabled).toBe(true)
      expect(parsedSettings.recoveryEnabled).toBe(true)
    })

    it('should detect crash when heartbeat is stale', async () => {
      // Set up old heartbeat (simulating crash)
      const staleHeartbeat = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      localStorageMock.setItem(
        'aura-editor:crash:heartbeat',
        staleHeartbeat.toString()
      )
      localStorageMock.setItem(
        'aura-editor:settings:crash-recovery',
        JSON.stringify({
          enabled: true,
          recoveryEnabled: true,
        })
      )

      // Add some recovery data
      const recoveryData = {
        project: createMockProject(),
        timestamp: staleHeartbeat,
        version: '1.0.0',
      }
      localStorageMock.setItem(
        'aura-editor:recovery:current-project',
        JSON.stringify(recoveryData)
      )

      const crashCheck = await persistenceService.checkForCrashRecovery()

      expect(crashCheck.crashDetected).toBe(true)
      expect(crashCheck.recoveryData).toBeDefined()
      expect(crashCheck.lastSave).toBeInstanceOf(Date)
      expect(crashCheck.message).toContain('Crash detected')
    })

    it('should not detect crash with recent heartbeat', async () => {
      // Set up recent heartbeat
      const recentHeartbeat = Date.now() - 30 * 1000 // 30 seconds ago
      localStorageMock.setItem(
        'aura-editor:crash:heartbeat',
        recentHeartbeat.toString()
      )
      localStorageMock.setItem(
        'aura-editor:settings:crash-recovery',
        JSON.stringify({
          enabled: true,
          recoveryEnabled: true,
        })
      )

      const crashCheck = await persistenceService.checkForCrashRecovery()

      expect(crashCheck.crashDetected).toBe(false)
      expect(crashCheck.message).toBe('No crash detected')
    })

    it('should save and clear recovery data', async () => {
      const project = createMockProject()

      // Save recovery data
      await persistenceService.saveRecoveryData(project)

      const savedData = localStorageMock.getItem(
        'aura-editor:recovery:current-project'
      )
      expect(savedData).toBeDefined()

      const parsed = JSON.parse(savedData!)
      expect(parsed.project).toBeDefined()
      expect(parsed.project.id).toBe(project.id)
      expect(parsed.project.name).toBe(project.name)
      expect(parsed.timestamp).toBeDefined()
      expect(parsed.version).toBeDefined()

      // Clear recovery data
      await persistenceService.clearRecoveryData()

      const clearedData = localStorageMock.getItem(
        'aura-editor:recovery:current-project'
      )
      expect(clearedData).toBeNull()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete recovery workflow', async () => {
      // 1. Enable crash recovery
      await persistenceService.enableCrashRecovery()

      // 2. Create and save a project
      const project = createMockProject()
      await persistenceService.saveProject(project.id, project)
      await persistenceService.saveRecoveryData(project)

      // 3. Create backup
      const backupResult = await persistenceService.createBackup(project.id)
      expect(backupResult.success).toBe(true)

      // 4. Simulate crash (stale heartbeat)
      const staleHeartbeat = Date.now() - 10 * 60 * 1000
      localStorageMock.setItem(
        'aura-editor:crash:heartbeat',
        staleHeartbeat.toString()
      )

      // 5. Check for crash recovery
      const crashCheck = await persistenceService.checkForCrashRecovery()
      expect(crashCheck.crashDetected).toBe(true)

      // 6. Restore from backup if needed
      if (crashCheck.crashDetected && backupResult.backupId) {
        const restoreResult = await persistenceService.restoreFromBackup(
          backupResult.backupId
        )
        expect(restoreResult.success).toBe(true)
      }

      // 7. Verify project integrity
      const restoredProject = await persistenceService.loadProject(project.id)
      expect(restoredProject).not.toBeNull()
      expect(restoredProject!.name).toBe(project.name)
    })
  })
})
