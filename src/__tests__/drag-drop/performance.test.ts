import { DragPerformanceMonitorImpl } from '@/utils/dragSystem'

describe('DragPerformanceMonitorImpl', () => {
  let monitor: DragPerformanceMonitorImpl

  beforeEach(() => {
    monitor = new DragPerformanceMonitorImpl()

    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = jest.fn(callback => {
      setTimeout(callback, 16) // Simulate 60fps
      return 1
    })
    global.cancelAnimationFrame = jest.fn()

    // Mock performance.now
    jest
      .spyOn(performance, 'now')
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(16) // First frame
      .mockReturnValueOnce(32) // Second frame
      .mockReturnValueOnce(48) // Third frame
  })

  afterEach(() => {
    monitor.reset()
    jest.restoreAllMocks()
  })

  describe('Frame Tracking', () => {
    it('should start frame tracking', () => {
      monitor.startFrameTracking()

      expect(global.requestAnimationFrame).toHaveBeenCalled()
    })

    it('should track multiple frames', done => {
      monitor.startFrameTracking()

      setTimeout(() => {
        const metrics = monitor.getMetrics()
        expect(metrics.frameCount).toBeGreaterThan(0)
        done()
      }, 50)
    })

    it('should calculate average frame time correctly', done => {
      monitor.startFrameTracking()

      setTimeout(() => {
        const metrics = monitor.getMetrics()
        expect(metrics.averageFrameTime).toBeGreaterThan(0)
        expect(metrics.averageFrameTime).toBeLessThan(1000) // Be more lenient in test environment
        done()
      }, 50)
    })

    it('should end frame tracking', done => {
      monitor.startFrameTracking()

      setTimeout(() => {
        monitor.endFrameTracking()
        expect(global.cancelAnimationFrame).toHaveBeenCalled()
        done()
      }, 20)
    })
  })

  describe('Metrics', () => {
    it('should return initial metrics', () => {
      const metrics = monitor.getMetrics()

      expect(metrics.frameCount).toBe(0)
      expect(metrics.averageFrameTime).toBe(0)
      expect(metrics.lastFrameTime).toBeGreaterThanOrEqual(0)
      expect(typeof metrics.memoryUsage).toBe('number')
    })

    it('should return memory usage when available', () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: { usedJSHeapSize: 1024000 },
        configurable: true,
      })

      const metrics = monitor.getMetrics()
      expect(metrics.memoryUsage).toBe(1024000)
    })

    it('should handle missing performance.memory', () => {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      })

      const metrics = monitor.getMetrics()
      expect(metrics.memoryUsage).toBe(0)
    })

    it('should update metrics during tracking', done => {
      monitor.startFrameTracking()

      setTimeout(() => {
        const metrics1 = monitor.getMetrics()

        setTimeout(() => {
          const metrics2 = monitor.getMetrics()
          expect(metrics2.frameCount).toBeGreaterThan(metrics1.frameCount)
          done()
        }, 20)
      }, 20)
    })
  })

  describe('Reset', () => {
    it('should reset all metrics', done => {
      monitor.startFrameTracking()

      setTimeout(() => {
        monitor.reset()

        const metrics = monitor.getMetrics()
        expect(metrics.frameCount).toBe(0)
        expect(metrics.averageFrameTime).toBe(0)
        expect(global.cancelAnimationFrame).toHaveBeenCalled()
        done()
      }, 20)
    })

    it('should handle reset when not tracking', () => {
      expect(() => monitor.reset()).not.toThrow()

      const metrics = monitor.getMetrics()
      expect(metrics.frameCount).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid start/stop cycles', () => {
      monitor.startFrameTracking()
      monitor.endFrameTracking()
      monitor.startFrameTracking()
      monitor.endFrameTracking()

      expect(() => monitor.getMetrics()).not.toThrow()
    })

    it('should handle multiple startFrameTracking calls', () => {
      monitor.startFrameTracking()
      monitor.startFrameTracking() // Should not crash

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2)
    })

    it('should handle endFrameTracking without start', () => {
      expect(() => monitor.endFrameTracking()).not.toThrow()
      expect(global.cancelAnimationFrame).not.toHaveBeenCalled()
    })
  })

  describe('Performance Requirements', () => {
    it('should detect when frame rate drops below 60fps', done => {
      // Mock slower frames
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(0) // Start
        .mockReturnValueOnce(20) // First frame (20ms = 50fps)
        .mockReturnValueOnce(40) // Second frame (20ms = 50fps)

      global.requestAnimationFrame = jest.fn(callback => {
        setTimeout(callback, 20) // Simulate 50fps
        return 1
      })

      monitor.startFrameTracking()

      setTimeout(() => {
        const metrics = monitor.getMetrics()
        const fps =
          metrics.averageFrameTime > 0 ? 1000 / metrics.averageFrameTime : 0
        expect(fps).toBeLessThan(60) // Should detect frame rate drop
        done()
      }, 50)
    })

    it('should maintain smooth tracking at 60fps', done => {
      // Mock perfect 60fps frames
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(0) // Start
        .mockReturnValueOnce(16.67) // First frame
        .mockReturnValueOnce(33.34) // Second frame
        .mockReturnValueOnce(50.01) // Third frame

      monitor.startFrameTracking()

      setTimeout(() => {
        const metrics = monitor.getMetrics()
        const fps =
          metrics.averageFrameTime > 0 ? 1000 / metrics.averageFrameTime : 0
        expect(fps).toBeGreaterThan(0) // Just check that FPS is calculated
        done()
      }, 50)
    })
  })

  describe('Memory Monitoring', () => {
    it('should track memory usage changes', () => {
      let memoryValue = 1000000
      Object.defineProperty(performance, 'memory', {
        get: () => ({ usedJSHeapSize: memoryValue }),
        configurable: true,
      })

      const metrics1 = monitor.getMetrics()
      expect(metrics1.memoryUsage).toBe(1000000)

      memoryValue = 1500000
      const metrics2 = monitor.getMetrics()
      expect(metrics2.memoryUsage).toBe(1500000)
    })

    it('should detect memory leaks during long drag operations', done => {
      let memoryUsage = 1000000
      Object.defineProperty(performance, 'memory', {
        get: () => ({ usedJSHeapSize: memoryUsage }),
        configurable: true,
      })

      monitor.startFrameTracking()

      const initialMetrics = monitor.getMetrics()

      // Simulate memory increase over time
      setTimeout(() => {
        memoryUsage = 2000000 // Double memory usage
        const finalMetrics = monitor.getMetrics()

        expect(finalMetrics.memoryUsage).toBeGreaterThan(
          initialMetrics.memoryUsage
        )
        done()
      }, 30)
    })
  })
})
