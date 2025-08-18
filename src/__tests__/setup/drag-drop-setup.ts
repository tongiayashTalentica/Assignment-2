/**
 * Test setup for drag-and-drop testing
 * Configures global mocks, utilities, and environment for drag tests
 */

// Extend Jest matchers for drag-and-drop testing
import '@testing-library/jest-dom'

// Mock DOMRect for tests that need it
Object.defineProperty(global, 'DOMRect', {
  value: class DOMRect {
    x: number
    y: number
    width: number
    height: number
    left: number
    top: number
    right: number
    bottom: number

    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = this.left = x
      this.y = this.top = y
      this.width = width
      this.height = height
      this.right = x + width
      this.bottom = y + height
    }

    toJSON() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        left: this.left,
        top: this.top,
        right: this.right,
        bottom: this.bottom,
      }
    }
  },
  writable: true,
})

// Mock requestAnimationFrame and performance APIs for consistent testing
Object.defineProperty(global, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => {
    // Simulate 60 FPS (16.67ms per frame)
    return setTimeout(() => callback(performance.now()), 16.67)
  },
  writable: true,
})

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id),
  writable: true,
})

// Mock performance API with realistic timing
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    getEntriesByName: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
  writable: true,
})

// Mock DOM methods commonly used in drag operations
Object.defineProperty(global.HTMLElement.prototype, 'getBoundingClientRect', {
  value: jest.fn().mockReturnValue({
    left: 0,
    top: 0,
    right: 100,
    bottom: 50,
    width: 100,
    height: 50,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
  writable: true,
})

Object.defineProperty(global.HTMLElement.prototype, 'closest', {
  value: jest.fn((selector: string) => {
    if (selector === '[data-drop-target="true"]') {
      const mockElement = document.createElement('div')
      mockElement.setAttribute('data-drop-target', 'true')
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        right: 1200,
        bottom: 800,
        width: 1200,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })
      return mockElement
    }
    return null
  }),
  writable: true,
})

// Mock window methods
Object.defineProperty(global, 'window', {
  value: {
    ...window,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getComputedStyle: jest.fn().mockReturnValue({
      getPropertyValue: jest.fn(),
    }),
  },
  writable: true,
})

// Drag event simulation utilities
export const simulateDragStart = (
  element: Element,
  options: { clientX: number; clientY: number }
) => {
  const event = new MouseEvent('mousedown', {
    button: 0,
    bubbles: true,
    cancelable: true,
    ...options,
  })

  Object.defineProperty(event, 'currentTarget', {
    value: element,
    writable: false,
  })

  return event
}

export const simulateDragMove = (options: {
  clientX: number
  clientY: number
}) => {
  return new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    ...options,
  })
}

export const simulateDragEnd = (options: {
  clientX: number
  clientY: number
}) => {
  return new MouseEvent('mouseup', {
    button: 0,
    bubbles: true,
    cancelable: true,
    ...options,
  })
}

export const simulateTouchStart = (
  element: Element,
  options: { clientX: number; clientY: number }
) => {
  const touch = {
    identifier: 1,
    target: element,
    ...options,
  }

  return new TouchEvent('touchstart', {
    touches: [touch as Touch],
    changedTouches: [touch as Touch],
    bubbles: true,
    cancelable: true,
  })
}

export const simulateTouchMove = (options: {
  clientX: number
  clientY: number
}) => {
  const touch = {
    identifier: 1,
    ...options,
  }

  return new TouchEvent('touchmove', {
    touches: [touch as Touch],
    changedTouches: [touch as Touch],
    bubbles: true,
    cancelable: true,
  })
}

export const simulateTouchEnd = (options: {
  clientX: number
  clientY: number
}) => {
  const touch = {
    identifier: 1,
    ...options,
  }

  return new TouchEvent('touchend', {
    touches: [],
    changedTouches: [touch as Touch],
    bubbles: true,
    cancelable: true,
  })
}

// Performance testing utilities
export class PerformanceTracker {
  private startTime: number = 0
  private frameCount: number = 0
  private frameTimes: number[] = []

  start() {
    this.startTime = performance.now()
    this.frameCount = 0
    this.frameTimes = []
  }

  recordFrame() {
    const currentTime = performance.now()
    if (this.startTime > 0) {
      const frameTime =
        currentTime -
        (this.frameTimes[this.frameTimes.length - 1] || this.startTime)
      this.frameTimes.push(frameTime)
      this.frameCount++
    }
  }

  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 0
    const averageFrameTime =
      this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length
    return 1000 / averageFrameTime
  }

  getTotalTime(): number {
    return performance.now() - this.startTime
  }

  getFrameCount(): number {
    return this.frameCount
  }

  reset() {
    this.startTime = 0
    this.frameCount = 0
    this.frameTimes = []
  }
}

// Memory leak detection utilities
export class MemoryTracker {
  private initialListenerCount: number = 0
  private initialElementCount: number = 0

  captureInitialState() {
    // Count event listeners (simplified)
    this.initialListenerCount = document.querySelectorAll(
      '[data-has-listeners="true"]'
    ).length

    // Count DOM elements with drag classes
    this.initialElementCount = document.querySelectorAll(
      '.drag-preview, [data-draggable]'
    ).length
  }

  checkForLeaks(): { listenerLeak: boolean; elementLeak: boolean } {
    const currentListenerCount = document.querySelectorAll(
      '[data-has-listeners="true"]'
    ).length
    const currentElementCount = document.querySelectorAll(
      '.drag-preview, [data-draggable]'
    ).length

    return {
      listenerLeak: currentListenerCount > this.initialListenerCount,
      elementLeak: currentElementCount > this.initialElementCount,
    }
  }

  cleanup() {
    // Clean up any test artifacts
    document.querySelectorAll('.drag-preview').forEach(el => el.remove())
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }
}

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toMaintain60FPS(): R
      toHaveNoDragLeaks(): R
      toBeDraggableElement(): R
      toBeDropTarget(): R
    }
  }
}

// Custom Jest matchers for drag-and-drop testing
expect.extend({
  toMaintain60FPS(received: PerformanceTracker) {
    const averageFPS = received.getAverageFPS()
    const pass = averageFPS >= 54 && averageFPS <= 66 // 60 FPS ±10%

    return {
      message: () =>
        `expected average FPS to be around 60 (±10%), but got ${averageFPS.toFixed(2)}`,
      pass,
    }
  },

  toHaveNoDragLeaks(received: MemoryTracker) {
    const leaks = received.checkForLeaks()
    const pass = !leaks.listenerLeak && !leaks.elementLeak

    return {
      message: () => {
        const issues = []
        if (leaks.listenerLeak) issues.push('event listener leak detected')
        if (leaks.elementLeak) issues.push('DOM element leak detected')
        return `expected no memory leaks, but found: ${issues.join(', ')}`
      },
      pass,
    }
  },

  toBeDraggableElement(received: Element) {
    const pass =
      received.hasAttribute('data-draggable') ||
      received.getAttribute('draggable') === 'false'

    return {
      message: () =>
        `expected element to be draggable, but it was not configured for drag operations`,
      pass,
    }
  },

  toBeDropTarget(received: Element) {
    const pass = received.hasAttribute('data-drop-target')

    return {
      message: () =>
        `expected element to be a drop target, but it was missing data-drop-target attribute`,
      pass,
    }
  },
})

// Cleanup after each test
afterEach(() => {
  // Clean up DOM
  document.querySelectorAll('.drag-preview').forEach(el => el.remove())

  // Reset document styles
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.body.style.webkitUserSelect = ''

  // Reset performance mocks
  ;(performance.now as jest.Mock).mockClear()

  // Clear timers
  jest.clearAllTimers()
})

// Global error handler for unhandled drag operations
global.addEventListener?.('error', event => {
  if (event.message?.includes('drag') || event.message?.includes('drop')) {
    // console.warn('Drag-and-drop related error in test:', event.message)
  }
})

// console.log('🧪 Drag-and-Drop test environment initialized')

// This is a setup file, not a test file
// It provides utilities and global setup for drag-and-drop tests

// Dummy test to satisfy Jest requirement
it('setup file loaded', () => {
  expect(true).toBe(true)
})
