/**
 * Unit tests for StorageManager
 */

import { StorageManager } from '../../services/storage/StorageManager'

// Mock localStorage for testing
const localStorageMock = {
  store: new Map<string, string>(),
  getItem: jest.fn((key: string) => localStorageMock.store.get(key) || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store.set(key, value)
  }),
  removeItem: jest.fn((key: string) => {
    localStorageMock.store.delete(key)
  }),
  clear: jest.fn(() => {
    localStorageMock.store.clear()
  }),
  get length() {
    return localStorageMock.store.size
  },
  key: jest.fn((index: number) => {
    const keys = Array.from(localStorageMock.store.keys())
    return keys[index] || null
  }),
}

// Mock global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('StorageManager', () => {
  let storageManager: StorageManager

  beforeEach(() => {
    storageManager = new StorageManager()
    localStorageMock.store.clear()
    jest.clearAllMocks()
  })

  describe('Basic Operations', () => {
    it('should set and get items', async () => {
      const result = await storageManager.setItem('test-key', 'test-value')
      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'aura-editor:test-key',
        'test-value'
      )

      const value = await storageManager.getItem('test-key')
      expect(value).toBe('test-value')
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'aura-editor:test-key'
      )
    })

    it('should remove items', async () => {
      await storageManager.setItem('test-key', 'test-value')

      const result = await storageManager.removeItem('test-key')
      expect(result).toBe(true)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'aura-editor:test-key'
      )

      const value = await storageManager.getItem('test-key')
      expect(value).toBe(null)
    })

    it('should clear all items', async () => {
      await storageManager.setItem('key1', 'value1')
      await storageManager.setItem('key2', 'value2')

      const result = await storageManager.clear()
      expect(result).toBe(true)

      const value1 = await storageManager.getItem('key1')
      const value2 = await storageManager.getItem('key2')
      expect(value1).toBe(null)
      expect(value2).toBe(null)
    })
  })

  describe('Batch Operations', () => {
    it('should set multiple items', async () => {
      const items = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      }

      const result = await storageManager.setItems(items)
      expect(result).toBe(true)

      for (const [key, expectedValue] of Object.entries(items)) {
        const actualValue = await storageManager.getItem(key)
        expect(actualValue).toBe(expectedValue)
      }
    })

    it('should get multiple items', async () => {
      await storageManager.setItem('key1', 'value1')
      await storageManager.setItem('key2', 'value2')
      await storageManager.setItem('key3', 'value3')

      const result = await storageManager.getItems([
        'key1',
        'key2',
        'key3',
        'nonexistent',
      ])

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
        nonexistent: null,
      })
    })

    it('should remove multiple items', async () => {
      await storageManager.setItem('key1', 'value1')
      await storageManager.setItem('key2', 'value2')
      await storageManager.setItem('key3', 'value3')

      const result = await storageManager.removeItems(['key1', 'key3'])
      expect(result).toBe(true)

      expect(await storageManager.getItem('key1')).toBe(null)
      expect(await storageManager.getItem('key2')).toBe('value2')
      expect(await storageManager.getItem('key3')).toBe(null)
    })
  })

  describe('Storage Monitoring', () => {
    it('should calculate storage size', async () => {
      await storageManager.setItem('key1', 'value1')
      await storageManager.setItem('key2', 'longer-value-string')

      const size = await storageManager.getStorageSize()
      expect(size).toBeGreaterThan(0)
    })

    it('should get available space', async () => {
      const available = await storageManager.getAvailableSpace()
      expect(available).toBeGreaterThan(0)
      expect(available).toBeLessThanOrEqual(5 * 1024 * 1024) // 5MB limit
    })

    it('should detect when storage is full', async () => {
      const isFull = await storageManager.isStorageFull()
      expect(typeof isFull).toBe('boolean')
    })
  })

  describe('Key Management', () => {
    it('should get all keys with prefix', async () => {
      // Add some non-prefixed keys to localStorage directly
      localStorageMock.store.set('other-key', 'other-value')

      // Add prefixed keys through StorageManager
      await storageManager.setItem('key1', 'value1')
      await storageManager.setItem('key2', 'value2')

      const keys = await storageManager.getAllKeys()
      expect(keys).toEqual(['aura-editor:key1', 'aura-editor:key2'])
    })

    it('should get keys by prefix', async () => {
      await storageManager.setItem('project:1', 'project1')
      await storageManager.setItem('project:2', 'project2')
      await storageManager.setItem('setting:theme', 'dark')

      const projectKeys = await storageManager.getKeysByPrefix('project:')
      expect(projectKeys).toEqual([
        'aura-editor:project:1',
        'aura-editor:project:2',
      ])
    })

    it('should check if key exists', async () => {
      await storageManager.setItem('existing-key', 'value')

      const exists = await storageManager.keyExists('existing-key')
      const notExists = await storageManager.keyExists('nonexistent-key')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })
  })

  describe('Health & Validation', () => {
    it('should validate storage functionality', async () => {
      const isValid = await storageManager.validateStorage()
      expect(isValid).toBe(true)
    })

    it('should get storage info', async () => {
      await storageManager.setItem('key1', 'value1')
      await storageManager.setItem('key2', 'value2')

      const info = await storageManager.getStorageInfo()

      expect(info).toEqual({
        used: expect.any(Number),
        available: expect.any(Number),
        total: 5 * 1024 * 1024, // 5MB
        keys: 2,
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const result = await storageManager.setItem('test', 'value')
      expect(result).toBe(false)

      // Restore original implementation
      localStorageMock.setItem = originalSetItem
    })

    it('should handle get item errors gracefully', async () => {
      const originalGetItem = localStorageMock.getItem
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const value = await storageManager.getItem('test')
      expect(value).toBe(null)

      // Restore original implementation
      localStorageMock.getItem = originalGetItem
    })
  })
})
