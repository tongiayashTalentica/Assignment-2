import {
  normalizeEvent,
  DragPerformanceMonitorImpl,
  DragStateMachine,
  DragCalculations,
  // DragPreviewManager - unused
  // DragEventHandlerImpl - unused
  DragSystem,
} from '@/utils/dragSystem'
import { DragState, ComponentType, BaseComponent } from '@/types'

describe('Drag System Utils', () => {
  describe('normalizeEvent', () => {
    it('should normalize mouse events', () => {
      const mockMouseEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 200,
        pageX: 150,
        pageY: 250,
        target: document.body,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as MouseEvent

      const normalized = normalizeEvent(mockMouseEvent)

      expect(normalized.type).toBe('mouse')
      expect(normalized.clientX).toBe(100)
      expect(normalized.clientY).toBe(200)
      expect(normalized.pageX).toBe(150)
      expect(normalized.pageY).toBe(250)
      expect(normalized.target).toBe(document.body)
    })

    it('should normalize touch events', () => {
      const mockTouchEvent = {
        type: 'touchstart',
        touches: [
          {
            clientX: 50,
            clientY: 75,
            pageX: 60,
            pageY: 85,
            identifier: 1,
          },
        ],
        target: document.body,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as TouchEvent

      const normalized = normalizeEvent(mockTouchEvent)

      expect(normalized.type).toBe('touch')
      expect(normalized.clientX).toBe(50)
      expect(normalized.clientY).toBe(75)
      expect(normalized.identifier).toBe(1)
    })

    it('should handle touch events without touches', () => {
      const mockTouchEvent = {
        type: 'touchend',
        touches: [],
        changedTouches: [
          {
            clientX: 25,
            clientY: 30,
            pageX: 35,
            pageY: 40,
            identifier: 2,
          },
        ],
        target: document.body,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as TouchEvent

      const normalized = normalizeEvent(mockTouchEvent)

      expect(normalized.type).toBe('touch')
      expect(normalized.clientX).toBe(25)
      expect(normalized.clientY).toBe(30)
      expect(normalized.identifier).toBe(2)
    })
  })

  describe('DragPerformanceMonitorImpl', () => {
    let monitor: DragPerformanceMonitorImpl

    beforeEach(() => {
      monitor = new DragPerformanceMonitorImpl()
      // Mock performance.now
      jest.spyOn(performance, 'now').mockReturnValue(1000)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should initialize with default values', () => {
      expect(monitor.getMetrics().frameCount).toBe(0)
      expect(monitor.getMetrics().averageFrameTime).toBe(0)
    })

    it('should start frame tracking', () => {
      monitor.startFrameTracking()
      expect(typeof monitor.getMetrics).toBe('function')
    })

    it('should stop frame tracking', () => {
      monitor.startFrameTracking()
      monitor.endFrameTracking()
      expect(typeof monitor.getMetrics).toBe('function')
    })

    it('should provide metrics', () => {
      monitor.startFrameTracking()

      const metrics = monitor.getMetrics()
      expect(metrics).toHaveProperty('frameCount')
      expect(metrics).toHaveProperty('averageFrameTime')
      expect(metrics).toHaveProperty('lastFrameTime')
      expect(metrics).toHaveProperty('memoryUsage')
    })
  })

  describe('DragCalculations', () => {
    it('should calculate drag distance', () => {
      const start = { x: 0, y: 0 }
      const current = { x: 3, y: 4 }

      const distance = DragCalculations.calculateDragDistance(start, current)
      expect(distance).toBe(5) // 3-4-5 triangle
    })

    it('should constrain position to boundaries', () => {
      const position = { x: 1000, y: 700 }
      const constraints = {
        boundaries: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
        snapToGrid: false,
        gridSize: 20,
      }
      const dimensions = { width: 100, height: 50 }

      const constrained = DragCalculations.constrainPosition(
        position,
        constraints,
        dimensions
      )

      expect(constrained.x).toBeLessThanOrEqual(700) // maxX - width
      expect(constrained.y).toBeLessThanOrEqual(550) // maxY - height
    })

    it('should snap to grid', () => {
      const position = { x: 107, y: 193 }
      const constraints = {
        boundaries: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
        snapToGrid: true,
        gridSize: 20,
      }

      const snapped = DragCalculations.constrainPosition(position, constraints)

      expect(snapped.x).toBe(100) // Closest grid point
      expect(snapped.y).toBe(200) // Closest grid point
    })
  })

  describe('DragStateMachine', () => {
    let stateMachine: DragStateMachine

    beforeEach(() => {
      stateMachine = new DragStateMachine()
    })

    it('should initialize in idle state', () => {
      expect(stateMachine.getCurrentState()).toBe(DragState.IDLE)
    })

    it('should transition to dragging state', () => {
      const mockContext = {
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
      }

      stateMachine.transition(DragState.DRAGGING_FROM_PALETTE, mockContext)
      expect(stateMachine.getCurrentState()).toBe(
        DragState.DRAGGING_FROM_PALETTE
      )
    })
  })

  describe('DragSystem', () => {
    let dragSystem: DragSystem

    beforeEach(() => {
      dragSystem = new DragSystem()
    })

    afterEach(() => {
      dragSystem.cleanup()
    })

    it('should initialize drag system', () => {
      expect(dragSystem.getCurrentState()).toBe(DragState.IDLE)
    })

    it('should start palette drag with proper event', () => {
      const mockEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 200,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as MouseEvent

      dragSystem.initializePaletteDrag(ComponentType.TEXT, mockEvent)

      expect(dragSystem.getCurrentState()).toBe(DragState.DRAGGING_FROM_PALETTE)
    })

    it('should start canvas drag with proper event', () => {
      const mockComponent: BaseComponent = {
        id: 'test-component',
        type: ComponentType.BUTTON,
        position: { x: 50, y: 50 },
        dimensions: { width: 100, height: 40 },
        props: {},
        zIndex: 1,
        constraints: {
          movable: true,
          resizable: true,
          deletable: true,
          copyable: true,
        },
        metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
      }

      // Mock the target element with getBoundingClientRect
      const mockTarget = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          left: 50,
          top: 50,
          right: 150,
          bottom: 90,
        }),
      }

      const mockEvent = {
        type: 'mousedown',
        clientX: 75,
        clientY: 70,
        target: mockTarget,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as MouseEvent

      dragSystem.initializeCanvasDrag(mockComponent, mockEvent)

      expect(dragSystem.getCurrentState()).toBe(
        DragState.DRAGGING_CANVAS_COMPONENT
      )
    })

    it('should handle basic operations', () => {
      expect(() => dragSystem.cleanup()).not.toThrow()
      expect(typeof dragSystem.getContext()).toBe('object')
    })
  })
})
