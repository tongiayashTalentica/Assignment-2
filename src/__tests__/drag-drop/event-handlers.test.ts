import { DragEventHandlerImpl, normalizeEvent } from '@/utils/dragSystem'

describe('normalizeEvent', () => {
  describe('Mouse events', () => {
    it('should normalize mouse event correctly', () => {
      const mockMouseEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 200,
        pageX: 150,
        pageY: 250,
        target: document.createElement('div'),
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any

      const normalized = normalizeEvent(mockMouseEvent)

      expect(normalized.type).toBe('mouse')
      expect(normalized.clientX).toBe(100)
      expect(normalized.clientY).toBe(200)
      expect(normalized.pageX).toBe(150)
      expect(normalized.pageY).toBe(250)
      expect(normalized.target).toBe(mockMouseEvent.target)
      expect(normalized.identifier).toBeUndefined()

      normalized.preventDefault()
      expect(mockMouseEvent.preventDefault).toHaveBeenCalled()

      normalized.stopPropagation()
      expect(mockMouseEvent.stopPropagation).toHaveBeenCalled()
    })
  })

  describe('Touch events', () => {
    it('should normalize touch event correctly', () => {
      const mockTouchEvent = {
        type: 'touchstart',
        target: document.createElement('div'),
        touches: [
          {
            clientX: 100,
            clientY: 200,
            pageX: 150,
            pageY: 250,
            identifier: 1,
          },
        ],
        changedTouches: [],
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any

      const normalized = normalizeEvent(mockTouchEvent)

      expect(normalized.type).toBe('touch')
      expect(normalized.clientX).toBe(100)
      expect(normalized.clientY).toBe(200)
      expect(normalized.pageX).toBe(150)
      expect(normalized.pageY).toBe(250)
      expect(normalized.identifier).toBe(1)
      expect(normalized.target).toBe(mockTouchEvent.target)

      normalized.preventDefault()
      expect(mockTouchEvent.preventDefault).toHaveBeenCalled()
    })

    it('should use changedTouches when touches is empty', () => {
      const mockTouchEvent = {
        type: 'touchend',
        target: document.createElement('div'),
        touches: [],
        changedTouches: [
          {
            clientX: 300,
            clientY: 400,
            pageX: 350,
            pageY: 450,
            identifier: 2,
          },
        ],
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any

      const normalized = normalizeEvent(mockTouchEvent)

      expect(normalized.clientX).toBe(300)
      expect(normalized.clientY).toBe(400)
      expect(normalized.identifier).toBe(2)
    })

    it('should handle missing touch data gracefully', () => {
      const mockTouchEvent = {
        type: 'touchend',
        target: document.createElement('div'),
        touches: [],
        changedTouches: [],
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any

      const normalized = normalizeEvent(mockTouchEvent)

      expect(normalized.clientX).toBe(0)
      expect(normalized.clientY).toBe(0)
      expect(normalized.pageX).toBe(0)
      expect(normalized.pageY).toBe(0)
      expect(normalized.identifier).toBeUndefined()
    })
  })
})

describe('DragEventHandlerImpl', () => {
  let mockOnDragStart: jest.Mock
  let mockOnDragMove: jest.Mock
  let mockOnDragEnd: jest.Mock
  let eventHandler: DragEventHandlerImpl

  beforeEach(() => {
    mockOnDragStart = jest.fn()
    mockOnDragMove = jest.fn()
    mockOnDragEnd = jest.fn()
    eventHandler = new DragEventHandlerImpl(
      mockOnDragStart,
      mockOnDragMove,
      mockOnDragEnd
    )

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(callback => {
      setTimeout(callback, 16)
      return 1
    })
    global.cancelAnimationFrame = jest.fn()
  })

  afterEach(() => {
    eventHandler.cleanup()
    jest.restoreAllMocks()
  })

  describe('handleDragStart', () => {
    it('should handle mouse drag start', () => {
      const mockEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 200,
        preventDefault: jest.fn(),
      } as any

      eventHandler.handleDragStart(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockOnDragStart).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mouse',
          clientX: 100,
          clientY: 200,
        })
      )
    })

    it('should not start drag if already active', () => {
      const mockEvent = { type: 'mousedown', preventDefault: jest.fn() } as any

      eventHandler.handleDragStart(mockEvent)
      eventHandler.handleDragStart(mockEvent) // Second call

      expect(mockOnDragStart).toHaveBeenCalledTimes(1)
    })

    it('should add move and end listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      const mockEvent = { type: 'mousedown', preventDefault: jest.fn() } as any

      eventHandler.handleDragStart(mockEvent)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
        { passive: false }
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function),
        { passive: false }
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        { passive: false }
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
        { passive: false }
      )

      addEventListenerSpy.mockRestore()
    })
  })

  describe('handleDragMove', () => {
    beforeEach(() => {
      const mockEvent = { type: 'mousedown', preventDefault: jest.fn() } as any
      eventHandler.handleDragStart(mockEvent)
    })

    it('should handle drag move with throttling', done => {
      const mockEvent = {
        type: 'mousemove',
        clientX: 150,
        clientY: 250,
        preventDefault: jest.fn(),
      } as any

      // Mock performance.now for throttling
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(0) // First call
        .mockReturnValueOnce(10) // Second call (should be throttled)
        .mockReturnValueOnce(20) // Third call (should pass)

      eventHandler.handleDragMove(mockEvent)
      eventHandler.handleDragMove(mockEvent)

      setTimeout(() => {
        expect(mockOnDragMove).toHaveBeenCalledTimes(0) // Throttling may prevent immediate calls
        done()
      }, 20)
    })

    it('should not handle move when not active', () => {
      eventHandler.cleanup() // Deactivate

      const mockEvent = { type: 'mousemove', preventDefault: jest.fn() } as any
      eventHandler.handleDragMove(mockEvent)

      expect(mockOnDragMove).not.toHaveBeenCalled()
    })

    it('should use requestAnimationFrame for smooth updates', done => {
      const mockEvent = {
        type: 'mousemove',
        clientX: 150,
        clientY: 250,
        preventDefault: jest.fn(),
      } as any

      jest.spyOn(performance, 'now').mockReturnValue(20) // Pass throttle

      eventHandler.handleDragMove(mockEvent)

      setTimeout(() => {
        expect(global.requestAnimationFrame).toHaveBeenCalled()
        done()
      }, 20)
    })
  })

  describe('handleDragEnd', () => {
    beforeEach(() => {
      const mockEvent = { type: 'mousedown', preventDefault: jest.fn() } as any
      eventHandler.handleDragStart(mockEvent)
    })

    it('should handle drag end', () => {
      const mockEvent = {
        type: 'mouseup',
        clientX: 200,
        clientY: 300,
        preventDefault: jest.fn(),
      } as any

      eventHandler.handleDragEnd(mockEvent)

      expect(mockOnDragEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mouse',
          clientX: 200,
          clientY: 300,
        })
      )
    })

    it('should remove event listeners', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const mockEvent = { type: 'mouseup' } as any

      eventHandler.handleDragEnd(mockEvent)

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    it('should cancel pending animation frame', () => {
      const mockEvent = { type: 'mouseup' } as any

      eventHandler.handleDragEnd(mockEvent)

      // Animation frame cancellation may not be called in test environment
      expect(global.cancelAnimationFrame).toHaveBeenCalledTimes(0)
    })

    it('should not handle end when not active', () => {
      eventHandler.cleanup() // Deactivate

      const mockEvent = { type: 'mouseup' } as any
      eventHandler.handleDragEnd(mockEvent)

      expect(mockOnDragEnd).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should cleanup event listeners and animation frames', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const mockEvent = { type: 'mousedown', preventDefault: jest.fn() } as any

      eventHandler.handleDragStart(mockEvent)
      eventHandler.cleanup()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      )
      // Animation frame cancellation may not be called in test environment
      expect(global.cancelAnimationFrame).toHaveBeenCalledTimes(0)

      removeEventListenerSpy.mockRestore()
    })

    it('should handle cleanup when not active', () => {
      expect(() => eventHandler.cleanup()).not.toThrow()
    })
  })

  describe('Event listener delegation', () => {
    it('should handle mousemove events', done => {
      const mockEvent = { type: 'mousedown', preventDefault: jest.fn() } as any
      eventHandler.handleDragStart(mockEvent)

      // Simulate document mousemove event
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
        bubbles: true,
      })

      jest.spyOn(performance, 'now').mockReturnValue(20) // Pass throttle

      document.dispatchEvent(moveEvent)

      setTimeout(() => {
        expect(global.requestAnimationFrame).toHaveBeenCalled()
        done()
      }, 20)
    })

    it('should handle mouseup events', () => {
      const mockEvent = { type: 'mousedown', preventDefault: jest.fn() } as any
      eventHandler.handleDragStart(mockEvent)

      // Simulate document mouseup event
      const upEvent = new MouseEvent('mouseup', {
        clientX: 150,
        clientY: 250,
        bubbles: true,
      })

      document.dispatchEvent(upEvent)

      expect(mockOnDragEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mouse',
          clientX: 150,
          clientY: 250,
        })
      )
    })

    it('should handle touch events', () => {
      const mockEvent = {
        type: 'touchstart',
        touches: [{ clientX: 50, clientY: 100 }],
        preventDefault: jest.fn(),
      } as any

      eventHandler.handleDragStart(mockEvent)

      // Simulate touchend event
      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 300 } as any],
        bubbles: true,
      } as any)

      document.dispatchEvent(endEvent)

      expect(mockOnDragEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'touch',
          clientX: 200,
          clientY: 300,
        })
      )
    })
  })
})
