/**
 * localStorage mock for tests
 */

class LocalStorageMock {
  private storage: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.storage.get(key) || null
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value)
  }

  removeItem(key: string): void {
    this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
  }

  get length(): number {
    return this.storage.size
  }

  key(index: number): string | null {
    const keys = Array.from(this.storage.keys())
    return keys[index] || null
  }

  // Additional methods for testing
  getAllKeys(): string[] {
    return Array.from(this.storage.keys())
  }

  getStorageSize(): number {
    let totalSize = 0
    for (const [key, value] of this.storage) {
      totalSize += key.length + value.length
    }
    return totalSize
  }
}

export const localStorageMock = new LocalStorageMock()

// Global mock for localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
