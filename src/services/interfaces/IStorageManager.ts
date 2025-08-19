/**
 * Storage manager interface for localStorage operations
 * Handles low-level storage operations with error handling
 */

export interface IStorageManager {
  // Basic Operations
  setItem(key: string, value: string): Promise<boolean>
  getItem(key: string): Promise<string | null>
  removeItem(key: string): Promise<boolean>
  clear(): Promise<boolean>

  // Batch Operations
  setItems(items: Record<string, string>): Promise<boolean>
  getItems(keys: string[]): Promise<Record<string, string | null>>
  removeItems(keys: string[]): Promise<boolean>

  // Storage Monitoring
  getStorageSize(): Promise<number>
  getAvailableSpace(): Promise<number>
  isStorageFull(): Promise<boolean>

  // Key Management
  getAllKeys(): Promise<string[]>
  getKeysByPrefix(prefix: string): Promise<string[]>
  keyExists(key: string): Promise<boolean>

  // Health & Validation
  validateStorage(): Promise<boolean>
  getStorageInfo(): Promise<{
    used: number
    available: number
    total: number
    keys: number
  }>
}
