import '../setup/drag-drop-setup' // Import DOMRect polyfill
import {
  DragStateMachine,
  DragCalculations,
  DragPreviewManager,
} from '@/utils/dragSystem'
import { DragState, ComponentType, Position, DragConstraints } from '@/types'

describe('DragStateMachine', () => {
  let stateMachine: DragStateMachine

  const mockInitialContext = {
    state: DragState.IDLE,
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    targetElement: null,
    dragOffset: { x: 0, y: 0 },
    isDragValid: false,
  }

  beforeEach(() => {
    stateMachine = new DragStateMachine(mockInitialContext)
  })

  describe('Initial State', () => {
    it('should initialize with IDLE state', () => {
      expect(stateMachine.getCurrentState()).toBe(DragState.IDLE)
    })

    it('should return correct initial context', () => {
      const context = stateMachine.getContext()
      expect(context.state).toBe(DragState.IDLE)
      expect(context.draggedComponent).toBe(null)
      expect(context.isDragValid).toBe(false)
    })
  })

  describe('State Transitions', () => {
    describe('From IDLE state', () => {
      it('should allow transition to DRAGGING_FROM_PALETTE', () => {
        const canTransition = stateMachine.canTransition(
          DragState.DRAGGING_FROM_PALETTE
        )
        expect(canTransition).toBe(true)
      })

      it('should allow transition to DRAGGING_CANVAS_COMPONENT', () => {
        const canTransition = stateMachine.canTransition(
          DragState.DRAGGING_CANVAS_COMPONENT
        )
        expect(canTransition).toBe(true)
      })

      it('should not allow transition to DRAG_ENDING', () => {
        const canTransition = stateMachine.canTransition(DragState.DRAG_ENDING)
        expect(canTransition).toBe(false)
      })

      it('should successfully transition to DRAGGING_FROM_PALETTE', () => {
        const success = stateMachine.transition(
          DragState.DRAGGING_FROM_PALETTE,
          {
            draggedComponent: ComponentType.TEXT,
          }
        )
        expect(success).toBe(true)
        expect(stateMachine.getCurrentState()).toBe(
          DragState.DRAGGING_FROM_PALETTE
        )
        expect(stateMachine.getContext().draggedComponent).toBe(
          ComponentType.TEXT
        )
      })
    })

    describe('From DRAGGING_FROM_PALETTE state', () => {
      beforeEach(() => {
        stateMachine.transition(DragState.DRAGGING_FROM_PALETTE)
      })

      it('should allow transition to DRAG_ENDING', () => {
        const canTransition = stateMachine.canTransition(DragState.DRAG_ENDING)
        expect(canTransition).toBe(true)
      })

      it('should allow transition to IDLE', () => {
        const canTransition = stateMachine.canTransition(DragState.IDLE)
        expect(canTransition).toBe(true)
      })

      it('should not allow transition to DRAGGING_CANVAS_COMPONENT', () => {
        const canTransition = stateMachine.canTransition(
          DragState.DRAGGING_CANVAS_COMPONENT
        )
        expect(canTransition).toBe(false)
      })
    })

    describe('From DRAGGING_CANVAS_COMPONENT state', () => {
      beforeEach(() => {
        stateMachine.transition(DragState.DRAGGING_CANVAS_COMPONENT)
      })

      it('should allow transition to DRAG_ENDING', () => {
        const canTransition = stateMachine.canTransition(DragState.DRAG_ENDING)
        expect(canTransition).toBe(true)
      })

      it('should allow transition to IDLE', () => {
        const canTransition = stateMachine.canTransition(DragState.IDLE)
        expect(canTransition).toBe(true)
      })

      it('should not allow transition to DRAGGING_FROM_PALETTE', () => {
        const canTransition = stateMachine.canTransition(
          DragState.DRAGGING_FROM_PALETTE
        )
        expect(canTransition).toBe(false)
      })
    })

    describe('From DRAG_ENDING state', () => {
      beforeEach(() => {
        stateMachine.transition(DragState.DRAGGING_FROM_PALETTE)
        stateMachine.transition(DragState.DRAG_ENDING)
      })

      it('should only allow transition to IDLE', () => {
        expect(stateMachine.canTransition(DragState.IDLE)).toBe(true)
        expect(
          stateMachine.canTransition(DragState.DRAGGING_FROM_PALETTE)
        ).toBe(false)
        expect(
          stateMachine.canTransition(DragState.DRAGGING_CANVAS_COMPONENT)
        ).toBe(false)
      })
    })
  })

  describe('Invalid Transitions', () => {
    it('should reject invalid transitions and log warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const success = stateMachine.transition(DragState.DRAG_ENDING)
      expect(success).toBe(false)
      expect(stateMachine.getCurrentState()).toBe(DragState.IDLE)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid transition from idle to drag_ending'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Context Updates', () => {
    it('should update context during transition', () => {
      const updates = {
        draggedComponent: ComponentType.BUTTON,
        startPosition: { x: 100, y: 200 },
        isDragValid: true,
      }

      stateMachine.transition(DragState.DRAGGING_FROM_PALETTE, updates)
      const context = stateMachine.getContext()

      expect(context.draggedComponent).toBe(ComponentType.BUTTON)
      expect(context.startPosition).toEqual({ x: 100, y: 200 })
      expect(context.isDragValid).toBe(true)
    })

    it('should preserve existing context when no updates provided', () => {
      const initialContext = stateMachine.getContext()
      stateMachine.transition(DragState.DRAGGING_FROM_PALETTE)
      const newContext = stateMachine.getContext()

      expect(newContext.startPosition).toEqual(initialContext.startPosition)
      expect(newContext.dragOffset).toEqual(initialContext.dragOffset)
    })
  })
})

describe('DragCalculations', () => {
  const mockConstraints: DragConstraints = {
    boundaries: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
    snapToGrid: true,
    gridSize: 20,
    minDragDistance: 3,
    preventOverlap: false,
  }

  describe('constrainPosition', () => {
    it('should constrain position within boundaries', () => {
      const position: Position = { x: -10, y: -10 }
      const constrained = DragCalculations.constrainPosition(
        position,
        mockConstraints
      )

      expect(constrained.x).toBe(0)
      expect(constrained.y).toBe(0)
    })

    it('should constrain position with component dimensions', () => {
      const position: Position = { x: 790, y: 590 }
      const dimensions = { width: 100, height: 50 }
      const constrained = DragCalculations.constrainPosition(
        position,
        mockConstraints,
        dimensions
      )

      expect(constrained.x).toBe(700) // 800 - 100
      expect(constrained.y).toBe(560) // 550 snapped to nearest grid (20)
    })

    it('should snap to grid when enabled', () => {
      const position: Position = { x: 17, y: 23 }
      const constrained = DragCalculations.constrainPosition(
        position,
        mockConstraints
      )

      expect(constrained.x).toBe(20) // Snapped to nearest 20
      expect(constrained.y).toBe(20) // Snapped to nearest 20
    })

    it('should not snap to grid when disabled', () => {
      const position: Position = { x: 17, y: 23 }
      const noSnapConstraints = { ...mockConstraints, snapToGrid: false }
      const constrained = DragCalculations.constrainPosition(
        position,
        noSnapConstraints
      )

      expect(constrained.x).toBe(17)
      expect(constrained.y).toBe(23)
    })

    it('should handle zero grid size', () => {
      const position: Position = { x: 17, y: 23 }
      const zeroGridConstraints = { ...mockConstraints, gridSize: 0 }
      const constrained = DragCalculations.constrainPosition(
        position,
        zeroGridConstraints
      )

      expect(constrained.x).toBe(17)
      expect(constrained.y).toBe(23)
    })
  })

  describe('calculateDragDistance', () => {
    it('should calculate correct distance between two points', () => {
      const start: Position = { x: 0, y: 0 }
      const current: Position = { x: 3, y: 4 }
      const distance = DragCalculations.calculateDragDistance(start, current)

      expect(distance).toBe(5) // 3-4-5 triangle
    })

    it('should calculate zero distance for same points', () => {
      const position: Position = { x: 10, y: 20 }
      const distance = DragCalculations.calculateDragDistance(
        position,
        position
      )

      expect(distance).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const start: Position = { x: -3, y: -4 }
      const current: Position = { x: 0, y: 0 }
      const distance = DragCalculations.calculateDragDistance(start, current)

      expect(distance).toBe(5)
    })
  })

  describe('calculateDropZoneBounds', () => {
    it('should return element getBoundingClientRect', () => {
      const mockElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          left: 10,
          top: 20,
          right: 110,
          bottom: 70,
          width: 100,
          height: 50,
        }),
      } as any

      const bounds = DragCalculations.calculateDropZoneBounds(mockElement)

      expect(mockElement.getBoundingClientRect).toHaveBeenCalled()
      expect(bounds.left).toBe(10)
      expect(bounds.top).toBe(20)
      expect(bounds.width).toBe(100)
      expect(bounds.height).toBe(50)
    })
  })

  describe('isPositionInDropZone', () => {
    const mockDropZone = {
      id: 'test-zone',
      type: 'canvas' as const,
      bounds: new DOMRect(10, 20, 100, 50), // x, y, width, height
      isValid: true,
    }

    it('should return true for position inside drop zone', () => {
      const position: Position = { x: 50, y: 40 }
      const isInside = DragCalculations.isPositionInDropZone(
        position,
        mockDropZone
      )

      expect(isInside).toBe(true)
    })

    it('should return false for position outside drop zone', () => {
      const position: Position = { x: 5, y: 10 }
      const isInside = DragCalculations.isPositionInDropZone(
        position,
        mockDropZone
      )

      expect(isInside).toBe(false)
    })

    it('should return true for position on drop zone boundary', () => {
      const position: Position = { x: 10, y: 20 } // Top-left corner
      const isInside = DragCalculations.isPositionInDropZone(
        position,
        mockDropZone
      )

      expect(isInside).toBe(true)
    })
  })
})

describe('DragPreviewManager', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = ''
  })

  describe('createGhostElement', () => {
    it('should create ghost element for ComponentType', () => {
      const ghost = DragPreviewManager.createGhostElement(ComponentType.TEXT)

      expect(ghost.className).toBe('drag-preview-ghost')
      expect(ghost.textContent).toBe('New Text')
      expect(ghost.style.position).toBe('fixed')
      expect(ghost.style.opacity).toBe('0.7')
      expect(ghost.style.pointerEvents).toBe('none')
    })

    it('should create ghost element for BaseComponent', () => {
      const mockComponent = {
        id: 'test-1',
        type: ComponentType.BUTTON,
        dimensions: { width: 120, height: 40 },
        position: { x: 0, y: 0 },
        props: {},
        zIndex: 1,
      } as any

      const ghost = DragPreviewManager.createGhostElement(mockComponent)

      expect(ghost.textContent).toBe('button Component')
      expect(ghost.style.width).toBe('120px')
      expect(ghost.style.height).toBe('40px')
    })

    it('should apply correct styling to ghost element', () => {
      const ghost = DragPreviewManager.createGhostElement(ComponentType.IMAGE)

      expect(ghost.style.zIndex).toBe('9999')
      expect(ghost.style.border).toBe('2px dashed #3b82f6')
      expect(ghost.style.borderRadius).toBe('4px')
      expect(ghost.style.background).toBe('rgba(59, 130, 246, 0.1)')
      expect(ghost.style.transform).toBe('translate(-50%, -50%)')
    })
  })

  describe('updateGhostPosition', () => {
    it('should update ghost element position', () => {
      const ghost = DragPreviewManager.createGhostElement(ComponentType.TEXT)
      const position: Position = { x: 150, y: 200 }

      DragPreviewManager.updateGhostPosition(ghost, position)

      expect(ghost.style.left).toBe('150px')
      expect(ghost.style.top).toBe('200px')
    })
  })

  describe('removeGhost', () => {
    it('should remove ghost element from DOM', () => {
      const ghost = DragPreviewManager.createGhostElement(ComponentType.TEXT)
      document.body.appendChild(ghost)

      expect(document.body.contains(ghost)).toBe(true)

      DragPreviewManager.removeGhost(ghost)

      expect(document.body.contains(ghost)).toBe(false)
    })

    it('should handle ghost element not in DOM', () => {
      const ghost = DragPreviewManager.createGhostElement(ComponentType.TEXT)

      // Should not throw error
      expect(() => DragPreviewManager.removeGhost(ghost)).not.toThrow()
    })
  })
})
