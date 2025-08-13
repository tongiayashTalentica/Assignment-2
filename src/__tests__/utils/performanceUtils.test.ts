import {
  PerformanceMonitor,
  debounce,
  throttle,
  BatchProcessor,
  analyzeComponentPerformance,
  optimizeStateUpdates,
  createMemoryTracker,
  createMemoizedSelector,
  ComponentUpdateBatcher,
  createPerformanceWarningSystem,
  performanceMonitor,
  memoryTracker,
  performanceWarnings,
} from '@/utils/performanceUtils'
import { createComponent } from '@/utils/componentUtils'
import { ComponentType } from '@/types'

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    },
  },
  writable: true,
  configurable: true,
})

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn(cb => setTimeout(cb, 16)),
})

describe('Performance Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor

    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance()
      monitor.reset()
    })

    it('should be a singleton', () => {
      const monitor1 = PerformanceMonitor.getInstance()
      const monitor2 = PerformanceMonitor.getInstance()
      expect(monitor1).toBe(monitor2)
    })

    it('should start and end measurements', () => {
      const mockNow = jest.spyOn(performance, 'now')
      mockNow.mockReturnValueOnce(100).mockReturnValueOnce(200)

      monitor.startMeasurement('test-operation')
      const duration = monitor.endMeasurement('test-operation')

      expect(duration).toBe(100)
    })

    it('should handle missing start measurement', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const duration = monitor.endMeasurement('non-existent')

      expect(duration).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'No start measurement found for key: non-existent'
      )
      consoleSpy.mockRestore()
    })

    it('should update metrics', () => {
      const observer = jest.fn()
      monitor.subscribe(observer)

      monitor.updateMetrics({ stateUpdateTime: 50, componentCount: 10 })

      expect(observer).toHaveBeenCalledWith({
        stateUpdateTime: 50,
        renderTime: 0,
        memoryUsage: 0,
        componentCount: 10,
        historySize: 0,
      })
    })

    it('should unsubscribe observers', () => {
      const observer = jest.fn()
      const unsubscribe = monitor.subscribe(observer)

      monitor.updateMetrics({ stateUpdateTime: 25 })
      expect(observer).toHaveBeenCalledTimes(1)

      unsubscribe()
      monitor.updateMetrics({ stateUpdateTime: 50 })
      expect(observer).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('should measure memory usage', () => {
      const memoryUsage = monitor.measureMemoryUsage()
      expect(memoryUsage).toBe(10) // 10MB as mocked
    })

    it('should handle missing memory API', () => {
      // Create a performance object without memory property
      const performanceWithoutMemory = {
        now: jest.fn(() => Date.now()),
      }

      // Temporarily replace the global performance object
      const originalPerformance = global.performance
      // @ts-expect-error - Testing missing memory API
      global.performance = performanceWithoutMemory

      const memoryUsage = monitor.measureMemoryUsage()
      expect(memoryUsage).toBe(0)

      // Restore original performance
      global.performance = originalPerformance
    })

    it('should reset metrics', () => {
      monitor.updateMetrics({ stateUpdateTime: 100, componentCount: 5 })
      monitor.reset()

      const metrics = monitor.getMetrics()
      expect(metrics).toEqual({
        stateUpdateTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        componentCount: 0,
        historySize: 0,
      })
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', done => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 50)

      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      expect(mockFn).not.toHaveBeenCalled()

      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(mockFn).toHaveBeenCalledWith('arg3')
        done()
      }, 60)
    })

    it('should call immediately when immediate is true', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100, true)

      debouncedFn('arg1')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', done => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 50)

      throttledFn('arg1')
      expect(mockFn).toHaveBeenCalledTimes(1)

      throttledFn('arg2')
      throttledFn('arg3')
      expect(mockFn).toHaveBeenCalledTimes(1) // Should not call again until limit passed

      setTimeout(() => {
        throttledFn('arg4')
        expect(mockFn).toHaveBeenCalledTimes(2)
        done()
      }, 60)
    })
  })

  describe('BatchProcessor', () => {
    it('should process items in batches', done => {
      const mockProcessor = jest.fn().mockResolvedValue(undefined)
      const batchProcessor = new BatchProcessor(mockProcessor, 2, 10)

      batchProcessor.add('item1')
      batchProcessor.add('item2')
      batchProcessor.add('item3')

      setTimeout(async () => {
        expect(mockProcessor).toHaveBeenCalledTimes(1)
        expect(mockProcessor).toHaveBeenCalledWith(['item1', 'item2'])

        setTimeout(async () => {
          expect(mockProcessor).toHaveBeenCalledTimes(2)
          expect(mockProcessor).toHaveBeenLastCalledWith(['item3'])
          done()
        }, 15)
      }, 15)
    })

    it('should handle processing errors', done => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mockProcessor = jest
        .fn()
        .mockRejectedValue(new Error('Processing failed'))
      const batchProcessor = new BatchProcessor(mockProcessor, 1, 10)

      batchProcessor.add('item1')

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Batch processing error:',
          expect.any(Error)
        )
        consoleSpy.mockRestore()
        done()
      }, 15)
    })

    it('should clear queue', () => {
      const mockProcessor = jest.fn()
      const batchProcessor = new BatchProcessor(mockProcessor, 2, 10)

      batchProcessor.add('item1')
      batchProcessor.add('item2')
      expect(batchProcessor.getQueueSize()).toBe(2)

      batchProcessor.clear()
      expect(batchProcessor.getQueueSize()).toBe(0)
    })
  })

  describe('analyzeComponentPerformance', () => {
    it('should analyze component performance', () => {
      const components = new Map([
        [
          'comp1',
          createComponent(
            ComponentType.TEXT,
            { x: 0, y: 0 },
            { width: 100, height: 40 }
          ),
        ],
        [
          'comp2',
          createComponent(
            ComponentType.GRID,
            { x: 0, y: 0 },
            { width: 400, height: 300 },
            {
              columns: 12,
              rows: 6,
              gap: 16,
            },
            { children: ['child1', 'child2'] }
          ),
        ],
      ])

      const analysis = analyzeComponentPerformance(components)

      expect(analysis.totalComponents).toBe(2)
      expect(analysis.averageComplexity).toBeGreaterThan(0)
      expect(analysis.memoryEstimate).toBeGreaterThan(0)
      expect(Array.isArray(analysis.complexComponents)).toBe(true)
    })
  })

  describe('optimizeStateUpdates', () => {
    it('should batch state updates', () => {
      const mockUpdate1 = jest.fn()
      const mockUpdate2 = jest.fn()
      const updates = [mockUpdate1, mockUpdate2]

      optimizeStateUpdates(updates)

      // Should not call immediately
      expect(mockUpdate1).not.toHaveBeenCalled()
      expect(mockUpdate2).not.toHaveBeenCalled()

      // Mock requestAnimationFrame execution
      const rafCallback = (window.requestAnimationFrame as jest.Mock).mock
        .calls[0][0]
      rafCallback()

      expect(mockUpdate1).toHaveBeenCalled()
      expect(mockUpdate2).toHaveBeenCalled()
    })

    it('should handle empty updates array', () => {
      optimizeStateUpdates([])
      expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    })
  })

  describe('createMemoryTracker', () => {
    it('should track memory usage', () => {
      const tracker = createMemoryTracker()
      const result = tracker.track()

      expect(result.current).toBe(10) // 10MB as mocked
      expect(result.delta).toBe(10) // First call, so delta equals current
      expect(result.formatted).toBe('10.00 MB')
    })

    it('should detect memory leaks', () => {
      const tracker = createMemoryTracker()

      expect(tracker.checkForLeaks(5)).toBe(true) // 10MB > 5MB threshold
      expect(tracker.checkForLeaks(15)).toBe(false) // 10MB < 15MB threshold
    })
  })

  describe('createMemoizedSelector', () => {
    it('should memoize selector results', () => {
      const mockSelector = jest.fn(
        (state: { value: number }) => state.value * 2
      )
      const memoizedSelector = createMemoizedSelector(mockSelector)

      const state1 = { value: 5 }
      const result1 = memoizedSelector(state1)
      const result2 = memoizedSelector(state1) // Same state

      expect(result1).toBe(10)
      expect(result2).toBe(10)
      expect(mockSelector).toHaveBeenCalledTimes(1) // Should be memoized
    })

    it('should recompute when state changes', () => {
      const mockSelector = jest.fn(
        (state: { value: number }) => state.value * 2
      )
      const memoizedSelector = createMemoizedSelector(mockSelector)

      const state1 = { value: 5 }
      const state2 = { value: 10 }

      memoizedSelector(state1)
      memoizedSelector(state2)

      expect(mockSelector).toHaveBeenCalledTimes(2)
    })

    it('should use custom equality function', () => {
      const mockSelector = jest.fn((state: { value: number }) => ({
        result: state.value * 2,
      }))
      const equalityFn = jest.fn((a, b) => a.result === b.result)
      const memoizedSelector = createMemoizedSelector(mockSelector, equalityFn)

      const state = { value: 5 }
      memoizedSelector(state)
      memoizedSelector(state)

      expect(equalityFn).toHaveBeenCalled()
    })
  })

  describe('ComponentUpdateBatcher', () => {
    it('should batch component updates', done => {
      const mockUpdateFn = jest.fn()
      const batcher = new ComponentUpdateBatcher(mockUpdateFn, 2, 10)

      batcher.scheduleUpdate('comp1', { position: { x: 10, y: 10 } })
      batcher.scheduleUpdate('comp2', { position: { x: 20, y: 20 } })

      setTimeout(() => {
        expect(mockUpdateFn).toHaveBeenCalledTimes(2)
        done()
      }, 15)
    })

    it('should merge updates for same component', done => {
      const mockUpdateFn = jest.fn()
      const batcher = new ComponentUpdateBatcher(mockUpdateFn, 5, 10)

      batcher.scheduleUpdate('comp1', { position: { x: 10, y: 10 } })
      batcher.scheduleUpdate('comp1', { position: { x: 20, y: 20 } })

      setTimeout(() => {
        expect(mockUpdateFn).toHaveBeenCalledTimes(1)
        expect(mockUpdateFn).toHaveBeenCalledWith('comp1', {
          position: { x: 20, y: 20 },
        })
        done()
      }, 15)
    })

    it('should flush pending updates', () => {
      const mockUpdateFn = jest.fn()
      const batcher = new ComponentUpdateBatcher(mockUpdateFn, 5, 100)

      batcher.scheduleUpdate('comp1', { position: { x: 10, y: 10 } })
      batcher.flush()

      expect(mockUpdateFn).toHaveBeenCalledWith('comp1', {
        position: { x: 10, y: 10 },
      })
    })
  })

  describe('createPerformanceWarningSystem', () => {
    it('should generate warnings for poor performance', () => {
      const warningSystem = createPerformanceWarningSystem()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Trigger warnings by updating metrics with poor performance
      const monitor = PerformanceMonitor.getInstance()
      monitor.updateMetrics({
        stateUpdateTime: 150, // Above 100ms threshold
        renderTime: 20, // Above 16ms threshold
        memoryUsage: 120, // Above 100MB threshold
        componentCount: 1200, // Above 1000 threshold
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Performance warnings:',
        expect.any(Array)
      )

      const warnings = warningSystem.getWarnings()
      expect(warnings.length).toBeGreaterThan(0)

      consoleSpy.mockRestore()
    })

    it('should allow threshold customization', () => {
      const warningSystem = createPerformanceWarningSystem()

      warningSystem.setThresholds({
        stateUpdateTime: 50,
        componentCount: 500,
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const monitor = PerformanceMonitor.getInstance()
      monitor.updateMetrics({
        stateUpdateTime: 75, // Above new 50ms threshold
        componentCount: 600, // Above new 500 threshold
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Singleton Exports', () => {
    it('should export performance monitor singleton', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor)
    })

    it('should export memory tracker', () => {
      expect(typeof memoryTracker.track).toBe('function')
      expect(typeof memoryTracker.checkForLeaks).toBe('function')
    })

    it('should export performance warnings', () => {
      expect(typeof performanceWarnings.getWarnings).toBe('function')
      expect(typeof performanceWarnings.setThresholds).toBe('function')
    })
  })
})
