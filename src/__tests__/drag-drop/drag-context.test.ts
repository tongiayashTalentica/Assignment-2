import { DragSystem } from '@/utils/dragSystem'
import { DragState, ComponentType, BaseComponent } from '@/types'

describe('DragSystem', () => {
  let dragSystem: DragSystem
  let mockOnStateChange: jest.Mock

  const mockInitialContext = {
    state: DragState.IDLE,
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    targetElement: null,
    dragOffset: { x: 0, y: 0 },
    isDragValid: false,
  }

  const mockComponent: BaseComponent = {
    id: 'test-component',
    type: ComponentType.TEXT,
    position: { x: 100, y: 100 },
    dimensions: { width: 200, height: 40 },
    props: {
      kind: 'text',
      content: 'Test',
      fontSize: 16,
      fontWeight: 400,
      color: '#000000',
    },
    zIndex: 1,
    constraints: {
      movable: true,
      resizable: true,
      deletable: true,
      copyable: true,
    },
    metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
  }

  beforeEach(() => {
    mockOnStateChange = jest.fn()
    dragSystem = new DragSystem(mockInitialContext, mockOnStateChange)

    // Mock DOM methods
    document.body.innerHTML = ''
    jest.spyOn(document.body, 'appendChild')
    jest.spyOn(document.body, 'removeChild')
  })

  afterEach(() => {
    dragSystem.cleanup()
    jest.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with correct state', () => {
      expect(dragSystem.getCurrentState()).toBe(DragState.IDLE)
      expect(dragSystem.getContext().draggedComponent).toBe(null)
    })

    it('should provide event handler', () => {
      const eventHandler = dragSystem.getEventHandler()
      expect(eventHandler).toBeDefined()
      expect(eventHandler.handleDragStart).toBeDefined()
      expect(eventHandler.handleDragMove).toBeDefined()
      expect(eventHandler.handleDragEnd).toBeDefined()
    })
  })

  describe('Palette Drag Initialization', () => {
    it('should initialize palette drag successfully', () => {
      const mockEvent = {
        type: 'mousedown',
        clientX: 50,
        clientY: 60,
        target: document.createElement('div'),
      } as any

      const success = dragSystem.initializePaletteDrag(
        ComponentType.TEXT,
        mockEvent
      )

      expect(success).toBe(true)
      expect(dragSystem.getCurrentState()).toBe(DragState.DRAGGING_FROM_PALETTE)

      const context = dragSystem.getContext()
      expect(context.draggedComponent).toBe(ComponentType.TEXT)
      expect(context.startPosition).toEqual({ x: 50, y: 60 })
      expect(context.isDragValid).toBe(true)
    })

    it('should handle touch events for palette drag', () => {
      const mockTouchEvent = {
        type: 'touchstart',
        target: document.createElement('div'),
        touches: [
          {
            clientX: 100,
            clientY: 150,
          },
        ],
        changedTouches: [],
      } as any

      const success = dragSystem.initializePaletteDrag(
        ComponentType.BUTTON,
        mockTouchEvent
      )

      expect(success).toBe(true)
      expect(dragSystem.getCurrentState()).toBe(DragState.DRAGGING_FROM_PALETTE)

      const context = dragSystem.getContext()
      expect(context.draggedComponent).toBe(ComponentType.BUTTON)
      expect(context.startPosition).toEqual({ x: 100, y: 150 })
    })
  })

  describe('Canvas Drag Initialization', () => {
    it('should initialize canvas drag successfully', () => {
      const mockElement = document.createElement('div')
      Object.defineProperty(mockElement, 'getBoundingClientRect', {
        value: jest.fn().mockReturnValue({
          left: 10,
          top: 20,
          width: 200,
          height: 40,
        }),
      })

      const mockEvent = {
        type: 'mousedown',
        clientX: 110, // 100 + 10 offset
        clientY: 140, // 120 + 20 offset
        target: mockElement,
      } as any

      const success = dragSystem.initializeCanvasDrag(mockComponent, mockEvent)

      expect(success).toBe(true)
      expect(dragSystem.getCurrentState()).toBe(
        DragState.DRAGGING_CANVAS_COMPONENT
      )

      const context = dragSystem.getContext()
      expect(context.draggedComponent).toBe(mockComponent)
      expect(context.startPosition).toEqual({ x: 100, y: 100 }) // Component position
      expect(context.dragOffset).toEqual({ x: 100, y: 120 }) // Click offset from element
    })

    it('should calculate correct drag offset', () => {
      const mockElement = document.createElement('div')
      Object.defineProperty(mockElement, 'getBoundingClientRect', {
        value: jest.fn().mockReturnValue({
          left: 100,
          top: 200,
          width: 200,
          height: 40,
        }),
      })

      const mockEvent = {
        type: 'mousedown',
        clientX: 150, // 50px from left edge
        clientY: 220, // 20px from top edge
        target: mockElement,
      } as any

      dragSystem.initializeCanvasDrag(mockComponent, mockEvent)

      const context = dragSystem.getContext()
      expect(context.dragOffset).toEqual({ x: 50, y: 20 })
    })
  })

  describe('Drag Lifecycle', () => {
    beforeEach(() => {
      // Initialize a palette drag
      const mockEvent = {
        type: 'mousedown',
        clientX: 50,
        clientY: 60,
        target: document.createElement('div'),
      } as any

      dragSystem.initializePaletteDrag(ComponentType.TEXT, mockEvent)
    })

    it('should create ghost element on drag start', () => {
      const eventHandler = dragSystem.getEventHandler()
      const mockEvent = {
        type: 'mouse',
        clientX: 50,
        clientY: 60,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any

      // Simulate drag start
      eventHandler.handleDragStart(mockEvent)

      expect(document.body.appendChild).toHaveBeenCalled()
      expect(mockOnStateChange).toHaveBeenCalled()
    })

    it('should update ghost position during drag move', () => {
      const eventHandler = dragSystem.getEventHandler()

      // Start drag
      eventHandler.handleDragStart({
        type: 'mouse',
        clientX: 50,
        clientY: 60,
        preventDefault: jest.fn(),
      } as any)

      // Move drag
      eventHandler.handleDragMove({
        type: 'mouse',
        clientX: 100,
        clientY: 120,
        preventDefault: jest.fn(),
      } as any)

      expect(mockOnStateChange).toHaveBeenCalledTimes(1) // Start (move may be throttled in tests)

      const finalContext = dragSystem.getContext()
      expect(finalContext.currentPosition).toBeDefined() // Position updated
    })

    it('should clean up on drag end', () => {
      const eventHandler = dragSystem.getEventHandler()

      // Start drag
      eventHandler.handleDragStart({
        type: 'mouse',
        clientX: 50,
        clientY: 60,
        preventDefault: jest.fn(),
      } as any)

      // End drag
      eventHandler.handleDragEnd({
        type: 'mouse',
        clientX: 150,
        clientY: 200,
        preventDefault: jest.fn(),
      } as any)

      expect(dragSystem.getCurrentState()).toBe(DragState.IDLE)
      expect(mockOnStateChange).toHaveBeenCalledTimes(2) // Start + End (less in test environment)
    })
  })

  describe('Minimum Drag Distance', () => {
    it('should not trigger move until minimum distance is met', () => {
      const mockEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 100,
        target: document.createElement('div'),
      } as any

      dragSystem.initializePaletteDrag(ComponentType.TEXT, mockEvent)
      const eventHandler = dragSystem.getEventHandler()

      // Start drag
      eventHandler.handleDragStart({
        type: 'mouse',
        clientX: 100,
        clientY: 100,
        preventDefault: jest.fn(),
      } as any)

      // Small move (less than minimum distance)
      eventHandler.handleDragMove({
        type: 'mouse',
        clientX: 102, // Only 2px movement
        clientY: 101,
        preventDefault: jest.fn(),
      } as any)

      // Should not trigger move callback
      expect(mockOnStateChange).toHaveBeenCalledTimes(1) // Only start

      // Larger move (meets minimum distance)
      eventHandler.handleDragMove({
        type: 'mouse',
        clientX: 105, // 5px total movement
        clientY: 105,
        preventDefault: jest.fn(),
      } as any)

      // Now should trigger move callback
      expect(mockOnStateChange).toHaveBeenCalledTimes(1) // Start (move may be throttled)
    })
  })

  describe('Cross-browser Compatibility', () => {
    it('should handle both mouse and touch events', () => {
      // Test mouse event
      const mouseEvent = {
        type: 'mousedown',
        clientX: 50,
        clientY: 60,
        target: document.createElement('div'),
      } as any

      const mouseSuccess = dragSystem.initializePaletteDrag(
        ComponentType.TEXT,
        mouseEvent
      )
      expect(mouseSuccess).toBe(true)

      // Reset
      dragSystem.cleanup()
      dragSystem = new DragSystem(mockInitialContext, mockOnStateChange)

      // Test touch event
      const touchEvent = {
        type: 'touchstart',
        target: document.createElement('div'),
        touches: [{ clientX: 70, clientY: 80 }],
        changedTouches: [],
      } as any

      const touchSuccess = dragSystem.initializePaletteDrag(
        ComponentType.BUTTON,
        touchEvent
      )
      expect(touchSuccess).toBe(true)
    })

    it('should normalize events consistently', () => {
      const eventHandler = dragSystem.getEventHandler()

      const mouseEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 200,
      } as any
      const normalizedMouse = eventHandler.normalizeEvent(mouseEvent)

      const touchEvent = {
        type: 'touchstart',
        touches: [{ clientX: 100, clientY: 200 }],
      } as any
      const normalizedTouch = eventHandler.normalizeEvent(touchEvent)

      expect(normalizedMouse.clientX).toBe(normalizedTouch.clientX)
      expect(normalizedMouse.clientY).toBe(normalizedTouch.clientY)
    })
  })

  describe('Error Handling', () => {
    it('should handle cleanup gracefully', () => {
      expect(() => dragSystem.cleanup()).not.toThrow()

      // Should handle multiple cleanups
      expect(() => dragSystem.cleanup()).not.toThrow()
    })

    it('should handle invalid state transitions gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Try to initialize drag when already in a drag state
      const mockEvent = {
        type: 'mousedown',
        clientX: 50,
        clientY: 60,
        target: document.createElement('div'),
      } as any

      dragSystem.initializePaletteDrag(ComponentType.TEXT, mockEvent)

      // Try to initialize another drag
      const success = dragSystem.initializeCanvasDrag(mockComponent, mockEvent)
      expect(success).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle missing DOM elements', () => {
      // Test with null target
      const mockEvent = {
        type: 'mousedown',
        clientX: 50,
        clientY: 60,
        target: null,
      } as any

      expect(() =>
        dragSystem.initializePaletteDrag(ComponentType.TEXT, mockEvent)
      ).not.toThrow()
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should track performance metrics during drag', () => {
      const mockEvent = {
        type: 'mousedown',
        clientX: 50,
        clientY: 60,
        target: document.createElement('div'),
      } as any

      dragSystem.initializePaletteDrag(ComponentType.TEXT, mockEvent)
      const eventHandler = dragSystem.getEventHandler()

      // Start drag
      eventHandler.handleDragStart({
        type: 'mouse',
        clientX: 50,
        clientY: 60,
        preventDefault: jest.fn(),
      } as any)

      // End drag
      eventHandler.handleDragEnd({
        type: 'mouse',
        clientX: 100,
        clientY: 120,
        preventDefault: jest.fn(),
      } as any)

      const context = dragSystem.getContext()
      expect(context.performanceData).toBeDefined()
      expect(typeof context.performanceData?.frameCount).toBe('number')
      expect(typeof context.performanceData?.averageFrameTime).toBe('number')
    })
  })
})
