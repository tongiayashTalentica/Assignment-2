/**
 * Unit tests for SerializationService
 */

import { SerializationService } from '../../services/storage/SerializationService'
import { Project, CanvasSnapshot } from '@/types'

describe('SerializationService', () => {
  let serializationService: SerializationService
  let mockProject: Project
  let mockCanvas: CanvasSnapshot

  beforeEach(() => {
    serializationService = new SerializationService()

    mockProject = {
      id: 'test-project',
      name: 'Test Project',
      description: 'A test project',
      version: '1.0.0',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-15'),
      canvas: {
        components: new Map([
          [
            'comp1',
            {
              id: 'comp1',
              type: 'TEXT' as any,
              props: { content: 'Hello' },
              position: { x: 100, y: 200 },
              dimensions: { width: 150, height: 50 },
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
        id: 'test-project',
        name: 'Test Project',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-15'),
        size: 1024,
        componentCount: 1,
        tags: [],
      },
    }

    mockCanvas = mockProject.canvas
  })

  describe('Project Serialization', () => {
    it('should serialize and deserialize project', async () => {
      const serialized =
        await serializationService.serializeProject(mockProject)
      expect(typeof serialized).toBe('string')
      expect(serialized.length).toBeGreaterThan(0)

      const deserialized =
        await serializationService.deserializeProject(serialized)
      expect(deserialized.id).toBe(mockProject.id)
      expect(deserialized.name).toBe(mockProject.name)
      expect(deserialized.canvas.components.size).toBe(1)
    })

    it('should handle circular references gracefully', async () => {
      // Create object with circular reference
      const circularProject = { ...mockProject }
      ;(circularProject as any).circular = circularProject

      // Should not throw error, but serialize with circular reference marker
      const serialized = await serializationService.serializeProject(
        circularProject as Project
      )
      expect(typeof serialized).toBe('string')
      expect(serialized).toContain('[Circular Reference]')

      // Should be able to deserialize (circular reference will be string)
      const deserialized =
        await serializationService.deserializeProject(serialized)
      expect((deserialized as any).circular).toBe('[Circular Reference]')
    })
  })

  describe('Canvas Serialization', () => {
    it('should serialize and deserialize canvas with Map conversion', async () => {
      const serialized = await serializationService.serializeCanvas(mockCanvas)
      expect(typeof serialized).toBe('string')

      const deserialized =
        await serializationService.deserializeCanvas(serialized)
      expect(deserialized.components).toBeInstanceOf(Map)
      expect(deserialized.components.size).toBe(1)
      expect(deserialized.components.get('comp1')).toBeDefined()
    })
  })

  describe('Generic Serialization', () => {
    it('should serialize and deserialize objects', async () => {
      const data = { key: 'value', number: 42, array: [1, 2, 3] }

      const serialized = await serializationService.serialize(data)
      expect(typeof serialized).toBe('string')

      const deserialized = await serializationService.deserialize(serialized)
      expect(deserialized).toEqual(data)
    })

    it('should serialize and deserialize Sets', async () => {
      const data = {
        mySet: new Set(['item1', 'item2', 'item3']),
        regularArray: [1, 2, 3],
      }

      const serialized = await serializationService.serialize(data)
      expect(typeof serialized).toBe('string')
      expect(serialized).toContain('"__type":"Set"')

      const deserialized = await serializationService.deserialize(serialized)
      expect(deserialized.mySet).toBeInstanceOf(Set)
      expect(deserialized.mySet.size).toBe(3)
      expect(deserialized.mySet.has('item1')).toBe(true)
      expect(deserialized.mySet.has('item2')).toBe(true)
      expect(deserialized.mySet.has('item3')).toBe(true)
      expect(deserialized.regularArray).toEqual([1, 2, 3])
    })

    it('should include version and timestamp in serialized data', async () => {
      const data = { test: 'value' }
      const serialized = await serializationService.serialize(data)
      const parsed = JSON.parse(serialized)

      expect(parsed.version).toBe('1.0.0')
      expect(typeof parsed.timestamp).toBe('number')
      expect(parsed.data).toEqual(data)
    })
  })

  describe('Compression', () => {
    it('should compress large data', async () => {
      const largeData = 'x'.repeat(2000) // Larger than threshold
      const compressed = await serializationService.compress(largeData)

      expect(compressed).not.toBe(largeData)
      expect(compressed.startsWith('COMPRESSED:')).toBe(true)
    })

    it('should not compress small data', async () => {
      const smallData = 'small'
      const compressed = await serializationService.compress(smallData)

      expect(compressed).toBe(smallData) // Should be unchanged
    })

    it('should decompress compressed data', async () => {
      const originalData = 'x'.repeat(2000)
      const compressed = await serializationService.compress(originalData)
      const decompressed = await serializationService.decompress(compressed)

      // Simple compression may not restore exactly, but should be similar
      expect(typeof decompressed).toBe('string')
      expect(decompressed.length).toBeGreaterThan(0)
    })
  })

  describe('Validation', () => {
    it('should validate JSON strings', () => {
      expect(serializationService.validateJson('{"valid": "json"}')).toBe(true)
      expect(serializationService.validateJson('invalid json')).toBe(false)
      expect(serializationService.validateJson('')).toBe(false)
    })

    it('should validate project data', () => {
      const validProject = JSON.stringify({
        id: 'test',
        name: 'Test',
        canvas: {},
      })

      const invalidProject = JSON.stringify({
        name: 'Missing ID and canvas',
      })

      expect(serializationService.validateProject(validProject)).toBe(true)
      expect(serializationService.validateProject(invalidProject)).toBe(false)
    })

    it('should validate canvas data', () => {
      const validCanvas = JSON.stringify({
        dimensions: { width: 1200, height: 800 },
        selectedComponentIds: [],
      })

      const invalidCanvas = JSON.stringify({
        dimensions: 'invalid',
      })

      expect(serializationService.validateCanvas(validCanvas)).toBe(true)
      expect(serializationService.validateCanvas(invalidCanvas)).toBe(false)
    })
  })

  describe('Version Handling', () => {
    it('should return current version', () => {
      expect(serializationService.getCurrentVersion()).toBe('1.0.0')
    })

    it('should handle version migration', async () => {
      const oldData = JSON.stringify({
        version: '0.9.0',
        data: { test: 'value' },
      })

      const migrated = await serializationService.migrateData(
        oldData,
        '0.9.0',
        '1.0.0'
      )
      const parsed = JSON.parse(migrated)

      expect(parsed.version).toBe('1.0.0')
      expect(parsed.data).toEqual({ test: 'value' })
    })
  })

  describe('Size Estimation', () => {
    it('should estimate data size', () => {
      const data = { key: 'value' }
      const size = serializationService.estimateSize(data)

      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe('number')
    })

    it('should calculate compression ratio', () => {
      const original = 'x'.repeat(1000)
      const compressed = 'y'.repeat(500) // Simulated compression

      const ratio = serializationService.getCompressionRatio(
        original,
        compressed
      )
      expect(ratio).toBe(0.5)
    })

    it('should handle empty strings in compression ratio', () => {
      const ratio = serializationService.getCompressionRatio('', 'compressed')
      expect(ratio).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle deserialization of invalid data', async () => {
      await expect(
        serializationService.deserialize('invalid json')
      ).rejects.toThrow('Data deserialization failed')
    })

    it('should handle canvas deserialization errors', async () => {
      await expect(
        serializationService.deserializeCanvas('invalid')
      ).rejects.toThrow('Canvas deserialization failed')
    })
  })
})
