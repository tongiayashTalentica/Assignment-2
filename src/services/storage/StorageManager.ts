/**
 * Storage Manager - Handles localStorage operations with error handling
 * and performance optimizations for TASK-008
 */

import { IStorageManager } from '@/services/interfaces'

export class StorageManager implements IStorageManager {
  private readonly STORAGE_QUOTA = 5 * 1024 * 1024 // 5MB in bytes
  private readonly KEY_PREFIX = 'aura-editor:'

  /**
   * Basic Operations
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      const size = this.calculateSize(fullKey, value)

      // Check if adding this item would exceed quota
      const currentSize = await this.getStorageSize()
      if (currentSize + size > this.STORAGE_QUOTA) {
        console.warn('Storage quota exceeded. Cannot save item:', key)
        return false
      }

      localStorage.setItem(fullKey, value)
      return true
    } catch (error) {
      console.error('Failed to save item to localStorage:', key, error)
      return false
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const fullKey = this.getFullKey(key)
      return localStorage.getItem(fullKey)
    } catch (error) {
      console.error('Failed to get item from localStorage:', key, error)
      return null
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      localStorage.removeItem(fullKey)
      return true
    } catch (error) {
      console.error('Failed to remove item from localStorage:', key, error)
      return false
    }
  }

  async clear(): Promise<boolean> {
    try {
      const keys = await this.getAllKeys()
      for (const key of keys) {
        await this.removeItem(this.stripPrefix(key))
      }
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }

  /**
   * Batch Operations for Performance
   */
  async setItems(items: Record<string, string>): Promise<boolean> {
    try {
      const operations = Object.entries(items)
      const results = await Promise.all(
        operations.map(([key, value]) => this.setItem(key, value))
      )
      return results.every(result => result)
    } catch (error) {
      console.error('Failed to set batch items:', error)
      return false
    }
  }

  async getItems(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const results: Record<string, string | null> = {}
      for (const key of keys) {
        results[key] = await this.getItem(key)
      }
      return results
    } catch (error) {
      console.error('Failed to get batch items:', error)
      return {}
    }
  }

  async removeItems(keys: string[]): Promise<boolean> {
    try {
      const results = await Promise.all(keys.map(key => this.removeItem(key)))
      return results.every(result => result)
    } catch (error) {
      console.error('Failed to remove batch items:', error)
      return false
    }
  }

  /**
   * Storage Monitoring
   */
  async getStorageSize(): Promise<number> {
    try {
      let totalSize = 0
      const keys = await this.getAllKeys()

      for (const key of keys) {
        const value = localStorage.getItem(key) || ''
        totalSize += this.calculateSize(key, value)
      }

      return totalSize
    } catch (error) {
      console.error('Failed to calculate storage size:', error)
      return 0
    }
  }

  async getAvailableSpace(): Promise<number> {
    try {
      const usedSize = await this.getStorageSize()
      return Math.max(0, this.STORAGE_QUOTA - usedSize)
    } catch (error) {
      console.error('Failed to get available space:', error)
      return 0
    }
  }

  async isStorageFull(): Promise<boolean> {
    try {
      const availableSpace = await this.getAvailableSpace()
      return availableSpace < 100 * 1024 // Less than 100KB available
    } catch (error) {
      console.error('Failed to check if storage is full:', error)
      return false
    }
  }

  /**
   * Key Management
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.KEY_PREFIX)) {
          keys.push(key)
        }
      }
      return keys
    } catch (error) {
      console.error('Failed to get all keys:', error)
      return []
    }
  }

  async getKeysByPrefix(prefix: string): Promise<string[]> {
    try {
      const allKeys = await this.getAllKeys()
      const fullPrefix = this.getFullKey(prefix)
      return allKeys.filter(key => key.startsWith(fullPrefix))
    } catch (error) {
      console.error('Failed to get keys by prefix:', prefix, error)
      return []
    }
  }

  async keyExists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      return localStorage.getItem(fullKey) !== null
    } catch (error) {
      console.error('Failed to check if key exists:', key, error)
      return false
    }
  }

  /**
   * Health & Validation
   */
  async validateStorage(): Promise<boolean> {
    try {
      const testKey = 'test-validation'
      const testValue = 'test-value'

      // Test write/read/delete cycle
      const writeResult = await this.setItem(testKey, testValue)
      if (!writeResult) return false

      const readResult = await this.getItem(testKey)
      if (readResult !== testValue) return false

      const deleteResult = await this.removeItem(testKey)
      if (!deleteResult) return false

      return true
    } catch (error) {
      console.error('Storage validation failed:', error)
      return false
    }
  }

  async getStorageInfo(): Promise<{
    used: number
    available: number
    total: number
    keys: number
  }> {
    try {
      const used = await this.getStorageSize()
      const available = await this.getAvailableSpace()
      const keys = await this.getAllKeys()

      return {
        used,
        available,
        total: this.STORAGE_QUOTA,
        keys: keys.length,
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return {
        used: 0,
        available: this.STORAGE_QUOTA,
        total: this.STORAGE_QUOTA,
        keys: 0,
      }
    }
  }

  /**
   * Private Helper Methods
   */
  private getFullKey(key: string): string {
    return key.startsWith(this.KEY_PREFIX) ? key : `${this.KEY_PREFIX}${key}`
  }

  private stripPrefix(key: string): string {
    return key.startsWith(this.KEY_PREFIX)
      ? key.slice(this.KEY_PREFIX.length)
      : key
  }

  private calculateSize(key: string, value: string): number {
    // Rough estimation: 2 bytes per character (UTF-16)
    return (key.length + value.length) * 2
  }

  /**
   * Storage Capacity Management
   */

  async getDetailedStorageInfo(): Promise<{
    used: number
    available: number
    total: number
    percentage: number
    itemCount: number
    items: Array<{ key: string; size: number; timestamp?: number }>
  }> {
    try {
      let totalUsed = 0
      let itemCount = 0
      const items: Array<{ key: string; size: number; timestamp?: number }> = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.KEY_PREFIX)) {
          const value = localStorage.getItem(key)
          if (value) {
            const size = this.calculateSize(key, value)
            totalUsed += size
            itemCount++

            // Try to extract timestamp from stored data
            let timestamp: number | undefined
            try {
              const parsed = JSON.parse(value)
              if (parsed.timestamp || parsed.updatedAt || parsed.createdAt) {
                timestamp =
                  parsed.timestamp ||
                  new Date(parsed.updatedAt || parsed.createdAt).getTime()
              }
            } catch {
              // If not JSON or no timestamp, use file modified time approximation
              timestamp = Date.now()
            }

            items.push({ key: this.stripPrefix(key), size, timestamp })
          }
        }
      }

      // Estimate total localStorage capacity (usually 5-10MB)
      const totalCapacity = 10 * 1024 * 1024 // 10MB default
      const available = Math.max(0, totalCapacity - totalUsed)
      const percentage = (totalUsed / totalCapacity) * 100

      return {
        used: totalUsed,
        available,
        total: totalCapacity,
        percentage: Math.round(percentage * 100) / 100,
        itemCount,
        items: items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
      }
    } catch (error) {
      console.error('Failed to get detailed storage info:', error)
      return {
        used: 0,
        available: 10 * 1024 * 1024,
        total: 10 * 1024 * 1024,
        percentage: 0,
        itemCount: 0,
        items: [],
      }
    }
  }

  async checkCapacityWarnings(): Promise<{
    level: 'safe' | 'warning' | 'critical' | 'full'
    message: string
    recommendations: string[]
  }> {
    const info = await this.getDetailedStorageInfo()
    const percentage = info.percentage

    if (percentage >= 95) {
      return {
        level: 'full',
        message: 'Storage is nearly full! Immediate action required.',
        recommendations: [
          'Delete unused projects immediately',
          'Export important projects as backups',
          'Clear browser cache and localStorage',
          'Consider using fewer projects simultaneously',
        ],
      }
    } else if (percentage >= 80) {
      return {
        level: 'critical',
        message: 'Storage is critically low. Clean up recommended.',
        recommendations: [
          'Delete old or unused projects',
          'Export projects you want to keep as backups',
          'Review and remove auto-save data',
          'Optimize project data by removing unused components',
        ],
      }
    } else if (percentage >= 60) {
      return {
        level: 'warning',
        message: 'Storage usage is getting high.',
        recommendations: [
          'Consider deleting old projects',
          'Export projects for backup',
          'Monitor storage usage regularly',
        ],
      }
    } else {
      return {
        level: 'safe',
        message: 'Storage usage is within safe limits.',
        recommendations: [
          'Continue regular usage',
          'Periodic cleanup is still recommended',
        ],
      }
    }
  }

  async performAutomaticCleanup(maxPercentage: number = 80): Promise<{
    success: boolean
    freedSpace: number
    deletedItems: number
    message: string
  }> {
    try {
      const initialInfo = await this.getDetailedStorageInfo()

      if (initialInfo.percentage <= maxPercentage) {
        return {
          success: true,
          freedSpace: 0,
          deletedItems: 0,
          message: 'No cleanup needed - storage usage is within limits',
        }
      }

      // Sort items by timestamp (oldest first) and size (largest first for same timestamp)
      const itemsToDelete = initialInfo.items
        .filter(item => {
          // Only delete certain types of data automatically
          return (
            item.key.includes('autosave:') ||
            item.key.includes('temp:') ||
            item.key.includes('cache:')
          )
        })
        .sort((a, b) => {
          // Prioritize by timestamp (oldest first), then by size (largest first)
          if ((a.timestamp || 0) !== (b.timestamp || 0)) {
            return (a.timestamp || 0) - (b.timestamp || 0)
          }
          return b.size - a.size
        })

      let freedSpace = 0
      let deletedItems = 0

      // Delete items until we're under the target percentage
      for (const item of itemsToDelete) {
        await this.removeItem(item.key)
        freedSpace += item.size
        deletedItems++

        // Check if we've freed enough space
        const currentInfo = await this.getDetailedStorageInfo()
        if (currentInfo.percentage <= maxPercentage) {
          break
        }
      }

      return {
        success: true,
        freedSpace,
        deletedItems,
        message: `Freed ${Math.round(freedSpace / 1024)} KB by deleting ${deletedItems} items`,
      }
    } catch (error) {
      console.error('Automatic cleanup failed:', error)
      return {
        success: false,
        freedSpace: 0,
        deletedItems: 0,
        message: `Cleanup failed: ${error}`,
      }
    }
  }

  async getOldestProjects(count: number = 5): Promise<
    Array<{
      key: string
      size: number
      timestamp: number
      ageInDays: number
    }>
  > {
    try {
      const info = await this.getDetailedStorageInfo()
      const projectItems = info.items
        .filter(item => item.key.startsWith('projects:'))
        .filter(item => item.timestamp)
        .map(item => ({
          ...item,
          timestamp: item.timestamp!,
          ageInDays: Math.floor(
            (Date.now() - item.timestamp!) / (1000 * 60 * 60 * 24)
          ),
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, count)

      return projectItems
    } catch (error) {
      console.error('Failed to get oldest projects:', error)
      return []
    }
  }

  async suggestOptimizations(): Promise<string[]> {
    try {
      const info = await this.getDetailedStorageInfo()
      const suggestions: string[] = []

      // Analyze storage patterns
      const projectItems = info.items.filter(item =>
        item.key.startsWith('projects:')
      )
      const autoSaveItems = info.items.filter(item =>
        item.key.includes('autosave:')
      )
      // const metadataItems = info.items.filter(item => item.key.startsWith('metadata:'))

      if (autoSaveItems.length > 10) {
        suggestions.push(
          `Clean up ${autoSaveItems.length} auto-save files to free space`
        )
      }

      if (projectItems.length > 20) {
        suggestions.push(
          `Consider archiving some of your ${projectItems.length} projects`
        )
      }

      const avgProjectSize =
        projectItems.reduce((sum, item) => sum + item.size, 0) /
        projectItems.length
      const largeProjects = projectItems.filter(
        item => item.size > avgProjectSize * 2
      )

      if (largeProjects.length > 0) {
        suggestions.push(
          `${largeProjects.length} projects are significantly larger than average - review for unused components`
        )
      }

      if (info.percentage > 50) {
        suggestions.push('Enable automatic cleanup for temporary files')
        suggestions.push('Export projects as backups before cleaning up')
      }

      const oldItems = info.items.filter(
        item =>
          item.timestamp &&
          Date.now() - item.timestamp > 30 * 24 * 60 * 60 * 1000
      )

      if (oldItems.length > 0) {
        suggestions.push(
          `${oldItems.length} items are older than 30 days - consider reviewing them`
        )
      }

      return suggestions.length > 0
        ? suggestions
        : ['Your storage is well organized!']
    } catch (error) {
      console.error('Failed to generate optimization suggestions:', error)
      return ['Unable to analyze storage for optimizations']
    }
  }
}
