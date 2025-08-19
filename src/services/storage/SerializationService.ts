/**
 * Serialization Service - Handles data serialization, compression, and validation
 * Includes version control and migration capabilities for TASK-008
 */

import { ISerializationService } from '@/services/interfaces'
import { Project, CanvasSnapshot } from '@/types'

export class SerializationService implements ISerializationService {
  private readonly CURRENT_VERSION = '1.0.0'
  private readonly COMPRESSION_THRESHOLD = 1024 // 1KB - compress larger objects

  /**
   * Project Serialization
   */
  async serializeProject(project: Project): Promise<string> {
    try {
      const serialized = this.serialize(project)
      return await this.compress(await serialized)
    } catch (error) {
      console.error('Failed to serialize project:', error)
      throw new Error('Project serialization failed')
    }
  }

  async deserializeProject(data: string): Promise<Project> {
    try {
      const decompressed = await this.decompress(data)
      return await this.deserialize<Project>(decompressed)
    } catch (error) {
      console.error('Failed to deserialize project:', error)
      throw new Error('Project deserialization failed')
    }
  }

  /**
   * Canvas Serialization
   */
  async serializeCanvas(canvas: CanvasSnapshot): Promise<string> {
    try {
      const serialized = await this.serialize(canvas)
      return await this.compress(serialized)
    } catch (error) {
      console.error('Failed to serialize canvas:', error)
      throw new Error('Canvas serialization failed')
    }
  }

  async deserializeCanvas(data: string): Promise<CanvasSnapshot> {
    try {
      const decompressed = await this.decompress(data)
      return await this.deserialize<CanvasSnapshot>(decompressed)
    } catch (error) {
      console.error('Failed to deserialize canvas:', error)
      throw new Error('Canvas deserialization failed')
    }
  }

  /**
   * Generic Serialization
   */
  async serialize<T>(data: T): Promise<string> {
    try {
      const serializedData = {
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
        data,
      }

      // Create a WeakSet to track visited objects for circular reference detection
      const visited = new WeakSet()

      // Use JSON.stringify with a custom replacer for Maps, Sets, and circular reference detection
      return JSON.stringify(
        serializedData,
        (key, value) => {
          // Handle null and primitive values
          if (value === null || typeof value !== 'object') {
            return value
          }

          // Circular reference detection
          if (visited.has(value)) {
            return '[Circular Reference]'
          }
          visited.add(value)

          // Handle Map objects
          if (value instanceof Map) {
            return {
              __type: 'Map',
              __data: Array.from(value.entries()),
            }
          }

          // Handle Set objects
          if (value instanceof Set) {
            return {
              __type: 'Set',
              __data: Array.from(value.values()),
            }
          }

          return value
        },
        0
      ) // No pretty printing for size
    } catch (error) {
      console.error('Failed to serialize data:', error)
      throw new Error('Data serialization failed')
    }
  }

  async deserialize<T>(data: string): Promise<T> {
    try {
      if (!this.validateJson(data)) {
        throw new Error('Invalid JSON data')
      }

      // Use JSON.parse with a custom reviver for Maps and Sets
      const parsed = JSON.parse(data, (key, value) => {
        if (value && typeof value === 'object') {
          // Restore Map objects
          if (value.__type === 'Map') {
            return new Map(value.__data)
          }

          // Restore Set objects
          if (value.__type === 'Set') {
            return new Set(value.__data)
          }
        }
        return value
      })

      // Check version and migrate if necessary
      if (parsed.version && parsed.version !== this.CURRENT_VERSION) {
        const migrated = await this.migrateData(
          data,
          parsed.version,
          this.CURRENT_VERSION
        )
        return this.deserialize<T>(migrated)
      }

      return (parsed.data || parsed) as T
    } catch (error) {
      console.error('Failed to deserialize data:', error)
      throw new Error('Data deserialization failed')
    }
  }

  /**
   * Compression using simple LZ-like algorithm
   * For production, consider using a library like pako for better compression
   */
  async compress(data: string): Promise<string> {
    try {
      if (data.length < this.COMPRESSION_THRESHOLD) {
        return data // Not worth compressing small data
      }

      // Simple run-length encoding for demonstration
      // In production, use a proper compression library
      return this.simpleCompress(data)
    } catch (error) {
      console.error('Failed to compress data:', error)
      return data // Return original if compression fails
    }
  }

  async decompress(data: string): Promise<string> {
    try {
      // Check if data was compressed (starts with compression marker)
      if (!data.startsWith('COMPRESSED:')) {
        return data // Not compressed
      }

      return this.simpleDecompress(data)
    } catch (error) {
      console.error('Failed to decompress data:', error)
      return data // Return original if decompression fails
    }
  }

  /**
   * Validation
   */
  validateJson(data: string): boolean {
    try {
      JSON.parse(data)
      return true
    } catch {
      return false
    }
  }

  /**
   * Data Integrity & Corruption Detection
   */

  private calculateDataChecksum(data: string): string {
    // Simple checksum using character codes - good enough for corruption detection
    let checksum = 0
    for (let i = 0; i < data.length; i++) {
      checksum = ((checksum << 5) - checksum + data.charCodeAt(i)) & 0xffffffff
    }
    return checksum.toString(36)
  }

  async serializeWithIntegrity<T>(data: T): Promise<string> {
    try {
      const serializedData = await this.serialize(data)
      const checksum = this.calculateDataChecksum(serializedData)

      const integrityWrapper = {
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
        checksum,
        data: serializedData,
        metadata: {
          originalSize: serializedData.length,
          compressionUsed: serializedData.length > this.COMPRESSION_THRESHOLD,
        },
      }

      return JSON.stringify(integrityWrapper)
    } catch (error) {
      console.error('Failed to serialize with integrity:', error)
      throw new Error('Integrity serialization failed')
    }
  }

  async deserializeWithIntegrity<T>(data: string): Promise<{
    success: boolean
    data: T | null
    error?: string
    corruption?: boolean
  }> {
    try {
      if (!this.validateJson(data)) {
        return {
          success: false,
          data: null,
          error: 'Invalid JSON format',
          corruption: true,
        }
      }

      const wrapper = JSON.parse(data)

      // Validate wrapper structure
      if (!wrapper.data || !wrapper.checksum || !wrapper.version) {
        // Try to deserialize as legacy data (without integrity wrapper)
        try {
          const legacyData = await this.deserialize<T>(data)
          return { success: true, data: legacyData }
        } catch {
          return {
            success: false,
            data: null,
            error: 'Invalid data structure',
            corruption: true,
          }
        }
      }

      // Verify checksum
      const expectedChecksum = this.calculateDataChecksum(wrapper.data)
      if (expectedChecksum !== wrapper.checksum) {
        console.warn('Data corruption detected: checksum mismatch')
        return {
          success: false,
          data: null,
          error: 'Data corruption detected',
          corruption: true,
        }
      }

      // Deserialize the actual data
      const deserializedData = await this.deserialize<T>(wrapper.data)

      // Additional integrity checks
      if (this.isDataCorrupted(deserializedData)) {
        return {
          success: false,
          data: null,
          error: 'Data structure corruption detected',
          corruption: true,
        }
      }

      return { success: true, data: deserializedData }
    } catch (error) {
      console.error('Failed to deserialize with integrity:', error)
      return {
        success: false,
        data: null,
        error: `Deserialization failed: ${error}`,
        corruption: true,
      }
    }
  }

  private isDataCorrupted(data: unknown): boolean {
    try {
      // Basic structural validation
      if (data === null || data === undefined) {
        return false // null/undefined are valid
      }

      if (typeof data === 'object') {
        // Check for common corruption patterns
        const jsonStr = JSON.stringify(data)

        // Check for truncated JSON
        if (jsonStr.includes('...')) {
          return true
        }

        // Check for malformed objects
        if (jsonStr.includes('undefined') || jsonStr.includes('NaN')) {
          return true
        }

        // For project data, verify essential structure
        if ((data as any).canvas) {
          const canvas = (data as any).canvas
          if (!canvas.components && canvas.components !== null) {
            return true
          }
        }
      }

      return false
    } catch {
      return true // If we can't even check, it's probably corrupted
    }
  }

  async attemptDataRecovery<T>(corruptedData: string): Promise<T | null> {
    try {
      console.log('🔧 Attempting data recovery for corrupted data...')

      // Recovery strategy 1: Try to parse as legacy format
      try {
        return await this.deserialize<T>(corruptedData)
      } catch {
        // Continue to next strategy
      }

      // Recovery strategy 2: Try to extract partial data
      try {
        const partialData = this.extractPartialData(corruptedData)
        if (partialData) {
          console.log('✅ Partial data recovery successful')
          return partialData as T
        }
      } catch {
        // Continue to next strategy
      }

      // Recovery strategy 3: Try to repair JSON syntax
      try {
        const repairedJson = this.repairJsonSyntax(corruptedData)
        if (repairedJson) {
          return await this.deserialize<T>(repairedJson)
        }
      } catch {
        // All recovery strategies failed
      }

      console.error('❌ All data recovery strategies failed')
      return null
    } catch (error) {
      console.error('Data recovery failed:', error)
      return null
    }
  }

  private extractPartialData(data: string): unknown | null {
    try {
      // Try to find complete JSON objects within the corrupted data
      const matches = data.match(/\{[^}]*\}/g)
      if (matches && matches.length > 0) {
        // Try to parse each potential object
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match)
            if (parsed && typeof parsed === 'object') {
              return parsed
            }
          } catch {
            continue
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  private repairJsonSyntax(data: string): string | null {
    try {
      let repaired = data

      // Common JSON repairs
      repaired = repaired
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ':"$1"') // Convert single quotes to double
        .replace(/undefined/g, 'null') // Replace undefined with null
        .replace(/NaN/g, '0') // Replace NaN with 0

      // Try to parse the repaired JSON
      JSON.parse(repaired)
      return repaired
    } catch {
      return null
    }
  }

  validateProject(data: string): boolean {
    try {
      const project = JSON.parse(data)
      return (
        typeof project === 'object' &&
        typeof project.id === 'string' &&
        typeof project.name === 'string' &&
        typeof project.canvas === 'object'
      )
    } catch {
      return false
    }
  }

  validateCanvas(data: string): boolean {
    try {
      const canvas = JSON.parse(data)
      return (
        typeof canvas === 'object' &&
        typeof canvas.dimensions === 'object' &&
        Array.isArray(canvas.selectedComponentIds)
      )
    } catch {
      return false
    }
  }

  /**
   * Version Handling
   */
  getCurrentVersion(): string {
    return this.CURRENT_VERSION
  }

  async migrateData(
    data: string,
    fromVersion: string,
    toVersion: string
  ): Promise<string> {
    try {
      console.log(`Migrating data from version ${fromVersion} to ${toVersion}`)

      // For now, just return the original data
      // In future versions, implement actual migration logic
      const parsed = JSON.parse(data)
      parsed.version = toVersion

      return JSON.stringify(parsed)
    } catch (error) {
      console.error('Failed to migrate data:', error)
      throw new Error('Data migration failed')
    }
  }

  /**
   * Size Estimation
   */
  estimateSize(data: any): number {
    try {
      const serialized = JSON.stringify(data)
      return serialized.length * 2 // Approximate size in bytes (UTF-16)
    } catch {
      return 0
    }
  }

  getCompressionRatio(original: string, compressed: string): number {
    if (original.length === 0) return 0
    return compressed.length / original.length
  }

  /**
   * Private Helper Methods
   */

  private simpleCompress(data: string): string {
    // Very simple compression - just remove extra whitespace
    // In production, use a proper compression library
    const compressed = data
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}[\]:,])\s*/g, '$1')
      .trim()

    return `COMPRESSED:${compressed}`
  }

  private simpleDecompress(data: string): string {
    return data.replace('COMPRESSED:', '')
  }
}
