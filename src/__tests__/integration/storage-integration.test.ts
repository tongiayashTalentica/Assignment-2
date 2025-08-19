import { StorageManager } from '../../services/storage/StorageManager'
import { SerializationService } from '../../services/storage/SerializationService'
import { PersistenceService } from '../../services/storage/PersistenceService'

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

describe('Storage System Integration Tests', () => {
  let storageManager: StorageManager
  let serializationService: SerializationService
  let persistenceService: PersistenceService

  beforeEach(() => {
    storageManager = new StorageManager()
    serializationService = new SerializationService()
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

  describe('Storage Manager + Serialization Service Integration', () => {
    it('should handle complex data serialization and storage', async () => {
      const complexData = {
        maps: new Map([
          ['key1', { nested: 'value1', number: 42 }],
          ['key2', { nested: 'value2', number: 84 }],
        ]),
        sets: new Set(['item1', 'item2', 'item3']),
        arrays: [1, 2, 3, { nested: true }],
        objects: {
          level1: {
            level2: {
              level3: 'deep value',
              timestamp: new Date(),
            },
          },
        },
        primitives: {
          string: 'test',
          number: 123.45,
          boolean: true,
          nullValue: null,
        },
      }

      // Serialize the complex data
      const serialized = await serializationService.serialize(complexData)
      expect(typeof serialized).toBe('string')

      // Store via storage manager
      const storeSuccess = await storageManager.setItem(
        'complex-data',
        serialized
      )
      expect(storeSuccess).toBe(true)

      // Retrieve via storage manager
      const retrieved = await storageManager.getItem('complex-data')
      expect(retrieved).toBe(serialized)

      // Deserialize and verify
      const deserialized = await serializationService.deserialize(retrieved!)
      expect(deserialized.maps).toBeInstanceOf(Map)
      expect(deserialized.maps.size).toBe(2)
      expect(deserialized.maps.get('key1')).toEqual({
        nested: 'value1',
        number: 42,
      })

      expect(deserialized.sets).toBeInstanceOf(Set)
      expect(deserialized.sets.size).toBe(3)
      expect(deserialized.sets.has('item1')).toBe(true)

      expect(deserialized.arrays).toEqual([1, 2, 3, { nested: true }])
      expect(deserialized.objects.level1.level2.level3).toBe('deep value')
    })

    it('should handle batch operations with serialization', async () => {
      const batchData = {
        'item-1': { name: 'First Item', map: new Map([['a', 1]]) },
        'item-2': { name: 'Second Item', set: new Set(['x', 'y']) },
        'item-3': { name: 'Third Item', array: [1, 2, 3] },
      }

      // Serialize all items
      const serializedItems: Record<string, string> = {}
      for (const [key, value] of Object.entries(batchData)) {
        serializedItems[key] = await serializationService.serialize(value)
      }

      // Store all items in batch
      const batchSuccess = await storageManager.setItems(serializedItems)
      expect(batchSuccess).toBe(true)

      // Retrieve all items
      const retrievedItems = await storageManager.getItems(
        Object.keys(batchData)
      )

      // Deserialize and verify
      for (const [key, serializedValue] of Object.entries(retrievedItems)) {
        expect(serializedValue).toBeDefined()
        const deserialized = await serializationService.deserialize(
          serializedValue!
        )

        if (key === 'item-1') {
          expect(deserialized.map).toBeInstanceOf(Map)
          expect(deserialized.map.get('a')).toBe(1)
        } else if (key === 'item-2') {
          expect(deserialized.set).toBeInstanceOf(Set)
          expect(deserialized.set.has('x')).toBe(true)
        } else if (key === 'item-3') {
          expect(deserialized.array).toEqual([1, 2, 3])
        }
      }
    })
  })

  describe('Full Stack Integration (Storage + Serialization + Persistence)', () => {
    it('should handle end-to-end project persistence flow', async () => {
      // Create test project data
      const projectData = {
        id: 'integration-test-project',
        name: 'Integration Test Project',
        description: 'Testing full persistence stack',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        canvas: {
          id: 'test-canvas',
          timestamp: Date.now(),
          components: new Map([
            [
              'comp1',
              {
                id: 'comp1',
                type: 'text',
                props: { content: 'Hello Integration Test' },
                position: { x: 100, y: 100 },
                dimensions: { width: 200, height: 50 },
                zIndex: 1,
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
          id: 'integration-test-project',
          name: 'Integration Test Project',
          createdAt: new Date(),
          updatedAt: new Date(),
          size: 0,
          componentCount: 1,
          tags: ['integration', 'test'],
        },
      }

      // Test direct storage operations
      const serializedProject =
        await serializationService.serializeProject(projectData)
      const projectKey = `projects:${projectData.id}`

      const directStoreSuccess = await storageManager.setItem(
        projectKey,
        serializedProject
      )
      expect(directStoreSuccess).toBe(true)

      const directRetrieved = await storageManager.getItem(projectKey)
      expect(directRetrieved).toBe(serializedProject)

      const deserializedProject = await serializationService.deserializeProject(
        directRetrieved!
      )
      expect(deserializedProject.name).toBe(projectData.name)
      expect(deserializedProject.canvas.components).toBeInstanceOf(Map)

      // Test high-level persistence service operations
      const persistenceSuccess = await persistenceService.saveProject(
        projectData.id,
        projectData
      )
      expect(persistenceSuccess).toBe(true)

      const loadedProject = await persistenceService.loadProject(projectData.id)
      expect(loadedProject).not.toBeNull()
      expect(loadedProject!.name).toBe(projectData.name)
      expect(loadedProject!.canvas.components.size).toBe(1)

      // Test project listing
      const projects = await persistenceService.listProjects()
      expect(projects.length).toBeGreaterThan(0)
      const ourProject = projects.find(p => p.id === projectData.id)
      expect(ourProject).toBeDefined()

      // Clean up
      await persistenceService.deleteProject(projectData.id)
    })

    it('should handle storage errors gracefully across all layers', async () => {
      // Test storage manager error handling
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const storageResult = await storageManager.setItem(
        'test-key',
        'test-value'
      )
      expect(storageResult).toBe(false)

      // Test serialization with storage errors
      const testData = { message: 'test' }
      const serialized = await serializationService.serialize(testData)

      // This should not throw, but return false for storage operation
      const storeResult = await storageManager.setItem(
        'serialized-test',
        serialized
      )
      expect(storeResult).toBe(false)

      // Restore original function
      localStorageMock.setItem = jest.fn((key: string, value: string) => {
        mockStore[key] = value
      })
    })

    it('should maintain data integrity across storage operations', async () => {
      // Create test data with potential edge cases
      const edgeCaseData = {
        emptyString: '',
        emptyArray: [],
        emptyObject: {},
        emptyMap: new Map(),
        emptySet: new Set(),
        specialChars: 'Hello "world" \'with\' <special> & chars',
        unicode: '🚀 Unicode 测试 العربية',
        largeNumber: Number.MAX_SAFE_INTEGER,
        smallNumber: Number.MIN_SAFE_INTEGER,
        floatingPoint: 123.456789,
        scientific: 1.23e-10,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
        nestedStructure: {
          level1: new Map([
            ['key1', new Set(['a', 'b', 'c'])],
            ['key2', { nested: new Map([['deep', 'value']]) }],
          ]),
        },
      }

      // Full persistence cycle
      const serialized = await serializationService.serialize(edgeCaseData)
      await storageManager.setItem('edge-case-test', serialized)

      const retrieved = await storageManager.getItem('edge-case-test')
      const deserialized = await serializationService.deserialize(retrieved!)

      // Verify edge cases
      expect(deserialized.emptyString).toBe('')
      expect(deserialized.emptyArray).toEqual([])
      expect(deserialized.emptyObject).toEqual({})
      expect(deserialized.emptyMap).toBeInstanceOf(Map)
      expect(deserialized.emptyMap.size).toBe(0)
      expect(deserialized.emptySet).toBeInstanceOf(Set)
      expect(deserialized.emptySet.size).toBe(0)
      expect(deserialized.specialChars).toBe(
        'Hello "world" \'with\' <special> & chars'
      )
      expect(deserialized.unicode).toBe('🚀 Unicode 测试 العربية')
      expect(deserialized.largeNumber).toBe(Number.MAX_SAFE_INTEGER)
      expect(deserialized.smallNumber).toBe(Number.MIN_SAFE_INTEGER)
      expect(deserialized.floatingPoint).toBeCloseTo(123.456789)
      expect(deserialized.boolean).toBe(true)
      expect(deserialized.nullValue).toBeNull()
      expect(deserialized.undefinedValue).toBeUndefined()

      // Verify nested structures
      expect(deserialized.nestedStructure.level1).toBeInstanceOf(Map)
      const nestedSet = deserialized.nestedStructure.level1.get('key1')
      expect(nestedSet).toBeInstanceOf(Set)
      expect(nestedSet.has('a')).toBe(true)

      const nestedMap = deserialized.nestedStructure.level1.get('key2').nested
      expect(nestedMap).toBeInstanceOf(Map)
      expect(nestedMap.get('deep')).toBe('value')
    })
  })

  describe('Performance Integration Tests', () => {
    it('should handle large-scale storage operations efficiently', async () => {
      const startTime = Date.now()

      // Create multiple data items
      const items: Record<string, any> = {}
      for (let i = 0; i < 20; i++) {
        items[`large-item-${i}`] = {
          id: `item-${i}`,
          data: new Array(100).fill(0).map((_, j) => ({
            index: j,
            value: `data-${i}-${j}`,
            metadata: new Map([['created', Date.now()]]),
          })),
          map: new Map(
            Array.from({ length: 10 }, (_, k) => [
              `key-${k}`,
              `value-${i}-${k}`,
            ])
          ),
          set: new Set(
            Array.from({ length: 10 }, (_, k) => `set-item-${i}-${k}`)
          ),
        }
      }

      // Serialize and store all items
      for (const [key, value] of Object.entries(items)) {
        const serialized = await serializationService.serialize(value)
        await storageManager.setItem(key, serialized)
      }

      const serializationTime = Date.now() - startTime

      // Retrieve and deserialize all items
      const retrievalStartTime = Date.now()

      const keys = Object.keys(items)
      const retrieved = await storageManager.getItems(keys)

      for (const [, serializedValue] of Object.entries(retrieved)) {
        const deserialized = await serializationService.deserialize(
          serializedValue!
        )
        expect(deserialized.id).toBeDefined()
        expect(deserialized.data).toHaveLength(100)
        expect(deserialized.map).toBeInstanceOf(Map)
        expect(deserialized.set).toBeInstanceOf(Set)
      }

      const retrievalTime = Date.now() - retrievalStartTime

      // Performance assertions (generous limits for CI environments)
      expect(serializationTime).toBeLessThan(10000) // 10 seconds
      expect(retrievalTime).toBeLessThan(8000) // 8 seconds

      console.log(
        `Performance: Serialization: ${serializationTime}ms, Retrieval: ${retrievalTime}ms`
      )

      // Clean up
      for (const key of keys) {
        await storageManager.removeItem(key)
      }
    })
  })

  describe('Error Recovery Integration', () => {
    it('should handle and recover from various error scenarios', async () => {
      // Test 1: Storage failure during save
      const testData = { message: 'test recovery' }

      // Mock temporary storage failure
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Temporary storage failure')
      })

      const result1 = await storageManager.setItem(
        'recovery-test-1',
        JSON.stringify(testData)
      )
      expect(result1).toBe(false)

      // Restore function completely
      localStorageMock.setItem = jest.fn((key: string, value: string) => {
        mockStore[key] = value
      })
      const result2 = await storageManager.setItem(
        'recovery-test-1',
        JSON.stringify(testData)
      )
      expect(result2).toBe(true)

      // Test 2: Corruption during serialization/deserialization
      const complexData = {
        map: new Map([['key', 'value']]),
        set: new Set(['item']),
        circular: null as any,
      }
      complexData.circular = complexData // Create circular reference

      // Should handle circular reference gracefully
      const serialized = await serializationService.serialize(complexData)
      expect(serialized).toContain('[Circular Reference]')

      const deserialized = await serializationService.deserialize(serialized)
      expect(deserialized.map).toBeInstanceOf(Map)
      expect(deserialized.set).toBeInstanceOf(Set)
      expect(deserialized.circular).toBe('[Circular Reference]')

      // Test 3: Storage quota exceeded simulation
      const largeData = { data: 'x'.repeat(1000000) } // 1MB string

      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError')
      })

      const quotaResult = await storageManager.setItem(
        'large-data',
        JSON.stringify(largeData)
      )
      expect(quotaResult).toBe(false)

      // Test 4: Recovery from corrupted stored data
      await storageManager.setItem('corrupted-data', '{"invalid": json syntax')

      const corruptedData = await storageManager.getItem('corrupted-data')
      expect(corruptedData).toBe('{"invalid": json syntax')

      // Serialization service should handle this gracefully
      try {
        await serializationService.deserialize(corruptedData!)
        // If it doesn't throw, that's fine
      } catch (error) {
        expect(error).toBeDefined()
        expect((error as Error).message).toContain('deserialization failed')
      }

      // Restore original function
      localStorageMock.setItem = jest.fn((key: string, value: string) => {
        mockStore[key] = value
      })
    })
  })
})
