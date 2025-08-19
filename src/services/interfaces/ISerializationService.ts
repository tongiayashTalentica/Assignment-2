/**
 * Serialization service interface
 * Handles data serialization, compression, and validation
 */

import { Project, CanvasSnapshot } from '@/types'

export interface ISerializationService {
  // Project Serialization
  serializeProject(project: Project): Promise<string>
  deserializeProject(data: string): Promise<Project>

  // Canvas Serialization
  serializeCanvas(canvas: CanvasSnapshot): Promise<string>
  deserializeCanvas(data: string): Promise<CanvasSnapshot>

  // Generic Serialization
  serialize<T>(data: T): Promise<string>
  deserialize<T>(data: string): Promise<T>

  // Compression
  compress(data: string): Promise<string>
  decompress(data: string): Promise<string>

  // Validation
  validateJson(data: string): boolean
  validateProject(data: string): boolean
  validateCanvas(data: string): boolean

  // Version Handling
  getCurrentVersion(): string
  migrateData(
    data: string,
    fromVersion: string,
    toVersion: string
  ): Promise<string>

  // Size Estimation
  estimateSize(data: any): number
  getCompressionRatio(original: string, compressed: string): number
}
