import { StorageManager } from '../../services/storage/StorageManager'

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

describe('Storage Capacity Management', () => {
  let storageManager: StorageManager

  beforeEach(() => {
    storageManager = new StorageManager()
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('getDetailedStorageInfo', () => {
    it('should return empty storage info when no items exist', async () => {
      const info = await storageManager.getDetailedStorageInfo()

      expect(info.used).toBe(0)
      expect(info.available).toBe(10 * 1024 * 1024) // 10MB
      expect(info.total).toBe(10 * 1024 * 1024)
      expect(info.percentage).toBe(0)
      expect(info.itemCount).toBe(0)
      expect(info.items).toEqual([])
    })

    it('should calculate storage usage correctly', async () => {
      // Add some test data
      await storageManager.setItem(
        'projects:test1',
        JSON.stringify({
          name: 'Test Project',
          timestamp: Date.now(),
        })
      )
      await storageManager.setItem(
        'metadata:test1',
        JSON.stringify({
          size: 1024,
          updatedAt: new Date(),
        })
      )

      const info = await storageManager.getDetailedStorageInfo()

      expect(info.used).toBeGreaterThan(0)
      expect(info.itemCount).toBe(2)
      expect(info.items).toHaveLength(2)
      expect(info.available).toBeLessThan(info.total)
      expect(info.percentage).toBeGreaterThanOrEqual(0) // Small files may round to 0%
      expect(info.percentage).toBeLessThan(100)

      // Verify items were found with correct keys
      expect(info.items.some(item => item.key === 'projects:test1')).toBe(true)
      expect(info.items.some(item => item.key === 'metadata:test1')).toBe(true)
    })

    it('should extract timestamps from stored data', async () => {
      const testTimestamp = Date.now()
      await storageManager.setItem(
        'projects:timestamped',
        JSON.stringify({
          name: 'Test',
          timestamp: testTimestamp,
        })
      )

      const info = await storageManager.getDetailedStorageInfo()
      const item = info.items.find(item => item.key === 'projects:timestamped')

      expect(item).toBeDefined()
      expect(item!.timestamp).toBe(testTimestamp)
    })
  })

  describe('checkCapacityWarnings', () => {
    it('should return safe level for low usage', async () => {
      // Add minimal data
      await storageManager.setItem('test', 'small data')

      const warnings = await storageManager.checkCapacityWarnings()

      expect(warnings.level).toBe('safe')
      expect(warnings.message).toContain('within safe limits')
      expect(warnings.recommendations).toContain('Continue regular usage')
    })

    it('should return appropriate warnings for different usage levels', async () => {
      // Mock high usage by overriding the getDetailedStorageInfo method
      const originalMethod = storageManager.getDetailedStorageInfo

      // Test warning level (60-79%)
      storageManager.getDetailedStorageInfo = jest.fn().mockResolvedValue({
        used: 7 * 1024 * 1024,
        available: 3 * 1024 * 1024,
        total: 10 * 1024 * 1024,
        percentage: 70,
        itemCount: 5,
        items: [],
      })

      const warningLevel = await storageManager.checkCapacityWarnings()
      expect(warningLevel.level).toBe('warning')
      expect(warningLevel.message).toContain('getting high')

      // Test critical level (80-94%)
      storageManager.getDetailedStorageInfo = jest.fn().mockResolvedValue({
        used: 9 * 1024 * 1024,
        available: 1 * 1024 * 1024,
        total: 10 * 1024 * 1024,
        percentage: 90,
        itemCount: 10,
        items: [],
      })

      const criticalLevel = await storageManager.checkCapacityWarnings()
      expect(criticalLevel.level).toBe('critical')
      expect(criticalLevel.message).toContain('critically low')

      // Test full level (95%+)
      storageManager.getDetailedStorageInfo = jest.fn().mockResolvedValue({
        used: 9.8 * 1024 * 1024,
        available: 0.2 * 1024 * 1024,
        total: 10 * 1024 * 1024,
        percentage: 98,
        itemCount: 20,
        items: [],
      })

      const fullLevel = await storageManager.checkCapacityWarnings()
      expect(fullLevel.level).toBe('full')
      expect(fullLevel.message).toContain('nearly full')

      // Restore original method
      storageManager.getDetailedStorageInfo = originalMethod
    })
  })

  describe('performAutomaticCleanup', () => {
    it('should not cleanup when usage is below threshold', async () => {
      const result = await storageManager.performAutomaticCleanup(80)

      expect(result.success).toBe(true)
      expect(result.freedSpace).toBe(0)
      expect(result.deletedItems).toBe(0)
      expect(result.message).toContain('No cleanup needed')
    })

    it('should cleanup autosave and temp files', async () => {
      // Add some data that should be cleaned up
      await storageManager.setItem(
        'autosave:old-save',
        JSON.stringify({
          data: 'large autosave data'.repeat(100),
          timestamp: Date.now() - 1000000,
        })
      )
      await storageManager.setItem('temp:cache-file', 'temporary data')
      await storageManager.setItem(
        'projects:important',
        JSON.stringify({
          name: 'Important Project',
          timestamp: Date.now(),
        })
      )

      // Mock high usage to trigger cleanup
      const originalMethod = storageManager.getDetailedStorageInfo
      storageManager.getDetailedStorageInfo = jest
        .fn()
        .mockResolvedValueOnce({
          used: 9 * 1024 * 1024,
          available: 1 * 1024 * 1024,
          total: 10 * 1024 * 1024,
          percentage: 90,
          itemCount: 3,
          items: [
            {
              key: 'autosave:old-save',
              size: 5000,
              timestamp: Date.now() - 1000000,
            },
            {
              key: 'temp:cache-file',
              size: 1000,
              timestamp: Date.now() - 500000,
            },
            { key: 'projects:important', size: 2000, timestamp: Date.now() },
          ],
        })
        .mockResolvedValueOnce({
          used: 2 * 1024 * 1024,
          available: 8 * 1024 * 1024,
          total: 10 * 1024 * 1024,
          percentage: 20,
          itemCount: 1,
          items: [
            { key: 'projects:important', size: 2000, timestamp: Date.now() },
          ],
        })

      const result = await storageManager.performAutomaticCleanup(80)

      expect(result.success).toBe(true)
      expect(result.deletedItems).toBeGreaterThan(0)
      expect(result.freedSpace).toBeGreaterThan(0)
      expect(result.message).toContain('Freed')

      // Restore original method
      storageManager.getDetailedStorageInfo = originalMethod
    })
  })

  describe('getOldestProjects', () => {
    it('should return empty array when no projects exist', async () => {
      const oldestProjects = await storageManager.getOldestProjects()
      expect(oldestProjects).toEqual([])
    })

    it('should return oldest projects sorted by timestamp', async () => {
      const now = Date.now()

      // Add projects with different timestamps
      await storageManager.setItem(
        'projects:new',
        JSON.stringify({
          name: 'New Project',
          timestamp: now,
        })
      )
      await storageManager.setItem(
        'projects:old',
        JSON.stringify({
          name: 'Old Project',
          timestamp: now - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        })
      )
      await storageManager.setItem(
        'projects:ancient',
        JSON.stringify({
          name: 'Ancient Project',
          timestamp: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        })
      )

      const oldestProjects = await storageManager.getOldestProjects(2)

      expect(oldestProjects).toHaveLength(2)
      expect(oldestProjects[0].key).toBe('projects:ancient')
      expect(oldestProjects[0].ageInDays).toBe(30)
      expect(oldestProjects[1].key).toBe('projects:old')
      expect(oldestProjects[1].ageInDays).toBe(7)
    })
  })

  describe('suggestOptimizations', () => {
    it('should return positive message for well-organized storage', async () => {
      // Add minimal, well-organized data
      await storageManager.setItem(
        'projects:small',
        JSON.stringify({
          name: 'Small Project',
          timestamp: Date.now(),
        })
      )

      const suggestions = await storageManager.suggestOptimizations()

      expect(suggestions).toContain('Your storage is well organized!')
    })

    it('should suggest cleanup for excessive autosave files', async () => {
      // Add many autosave files
      for (let i = 0; i < 15; i++) {
        await storageManager.setItem(
          `autosave:file${i}`,
          JSON.stringify({
            data: 'autosave data',
            timestamp: Date.now() - i * 1000,
          })
        )
      }

      const suggestions = await storageManager.suggestOptimizations()

      expect(suggestions.some(s => s.includes('auto-save files'))).toBe(true)
    })

    it('should suggest archiving for many projects', async () => {
      // Add many projects
      for (let i = 0; i < 25; i++) {
        await storageManager.setItem(
          `projects:proj${i}`,
          JSON.stringify({
            name: `Project ${i}`,
            timestamp: Date.now() - i * 1000,
          })
        )
      }

      const suggestions = await storageManager.suggestOptimizations()

      expect(suggestions.some(s => s.includes('archiving some of your'))).toBe(
        true
      )
    })
  })
})
