import {
  DragState,
  DragContext,
  NormalizedDragEvent,
  DragEventHandler,
  DragPerformanceMonitor,
  DragPerformanceData,
  Position,
  ComponentType,
  BaseComponent,
  DragConstraints,
  DropZone,
  // DragPreview - unused
} from '@/types'

/**
 * Performance-optimized event normalization for drag operations
 * Converts mouse/touch events to a unified format
 */
export const normalizeEvent = (
  event: MouseEvent | TouchEvent
): NormalizedDragEvent => {
  if (event.type.startsWith('mouse')) {
    const mouseEvent = event as MouseEvent
    return {
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY,
      pageX: mouseEvent.pageX,
      pageY: mouseEvent.pageY,
      target: mouseEvent.target,
      type: 'mouse',
      preventDefault: () => mouseEvent.preventDefault(),
      stopPropagation: () => mouseEvent.stopPropagation(),
    }
  } else {
    const touchEvent = event as TouchEvent
    const touch = touchEvent.touches[0] || touchEvent.changedTouches[0]
    return {
      clientX: touch?.clientX || 0,
      clientY: touch?.clientY || 0,
      pageX: touch?.pageX || 0,
      pageY: touch?.pageY || 0,
      target: touchEvent.target,
      type: 'touch',
      identifier: touch?.identifier,
      preventDefault: () => touchEvent.preventDefault(),
      stopPropagation: () => touchEvent.stopPropagation(),
    }
  }
}

/**
 * Performance monitor for drag operations
 * Tracks frame rate and memory usage during drag operations
 */
export class DragPerformanceMonitorImpl implements DragPerformanceMonitor {
  private startTime = 0
  private frameCount = 0
  private frameTimeSum = 0
  private lastFrameTime = 0
  private rafId: number | null = null

  startFrameTracking(): void {
    this.startTime = performance.now()
    this.frameCount = 0
    this.frameTimeSum = 0
    this.lastFrameTime = this.startTime
    this.scheduleFrame()
  }

  endFrameTracking(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  getMetrics(): DragPerformanceData {
    const now = performance.now()
    return {
      frameCount: this.frameCount,
      averageFrameTime:
        this.frameCount > 0 ? this.frameTimeSum / this.frameCount : 0,
      lastFrameTime: now - this.lastFrameTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    }
  }

  reset(): void {
    this.startTime = 0
    this.frameCount = 0
    this.frameTimeSum = 0
    this.lastFrameTime = 0
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private scheduleFrame = (): void => {
    this.rafId = requestAnimationFrame(() => {
      const now = performance.now()
      const frameTime = now - this.lastFrameTime
      this.frameCount++
      this.frameTimeSum += frameTime
      this.lastFrameTime = now

      // Continue tracking until explicitly stopped
      this.scheduleFrame()
    })
  }
}

/**
 * State machine for drag operations
 * Manages transitions between different drag states
 */
export class DragStateMachine {
  private currentState: DragState = DragState.IDLE
  private context: DragContext
  private performanceMonitor = new DragPerformanceMonitorImpl()

  constructor(initialContext: DragContext) {
    this.context = initialContext
  }

  getCurrentState(): DragState {
    return this.currentState
  }

  getContext(): DragContext {
    return { ...this.context }
  }

  canTransition(toState: DragState): boolean {
    switch (this.currentState) {
      case DragState.IDLE:
        return (
          toState === DragState.DRAGGING_FROM_PALETTE ||
          toState === DragState.DRAGGING_CANVAS_COMPONENT
        )

      case DragState.DRAGGING_FROM_PALETTE:
        return toState === DragState.DRAG_ENDING || toState === DragState.IDLE

      case DragState.DRAGGING_CANVAS_COMPONENT:
        return toState === DragState.DRAG_ENDING || toState === DragState.IDLE

      case DragState.DRAG_ENDING:
        return toState === DragState.IDLE

      default:
        return false
    }
  }

  transition(toState: DragState, updates: Partial<DragContext> = {}): boolean {
    if (!this.canTransition(toState)) {
      // console.warn(`Invalid transition from ${this.currentState} to ${toState}`)
      return false
    }

    const previousState = this.currentState
    this.currentState = toState
    this.context = { ...this.context, ...updates, state: toState }

    // Handle state-specific logic
    this.onStateChange(previousState, toState)
    return true
  }

  private onStateChange(from: DragState, to: DragState): void {
    // Start performance monitoring on drag start
    if (
      from === DragState.IDLE &&
      (to === DragState.DRAGGING_FROM_PALETTE ||
        to === DragState.DRAGGING_CANVAS_COMPONENT)
    ) {
      this.performanceMonitor.startFrameTracking()
    }

    // End performance monitoring on drag end
    if (to === DragState.IDLE && from !== DragState.IDLE) {
      this.performanceMonitor.endFrameTracking()
      this.context.performanceData = this.performanceMonitor.getMetrics()
      this.performanceMonitor.reset()
    }
  }
}

/**
 * Utilities for position calculations and constraints
 */
export const DragCalculations = {
  /**
   * Apply constraints to a position based on boundaries and grid snapping
   */
  constrainPosition(
    position: Position,
    constraints: DragConstraints,
    componentDimensions?: { width: number; height: number }
  ): Position {
    let { x, y } = position
    const { boundaries, snapToGrid, gridSize } = constraints

    // Apply boundary constraints
    if (componentDimensions) {
      x = Math.max(
        boundaries.minX,
        Math.min(boundaries.maxX - componentDimensions.width, x)
      )
      y = Math.max(
        boundaries.minY,
        Math.min(boundaries.maxY - componentDimensions.height, y)
      )
    } else {
      x = Math.max(boundaries.minX, Math.min(boundaries.maxX, x))
      y = Math.max(boundaries.minY, Math.min(boundaries.maxY, y))
    }

    // Apply grid snapping
    if (snapToGrid && gridSize > 0) {
      x = Math.round(x / gridSize) * gridSize
      y = Math.round(y / gridSize) * gridSize
    }

    return { x, y }
  },

  /**
   * Calculate drag distance to determine if minimum threshold is met
   */
  calculateDragDistance(start: Position, current: Position): number {
    const dx = current.x - start.x
    const dy = current.y - start.y
    return Math.sqrt(dx * dx + dy * dy)
  },

  /**
   * Calculate drop zone bounds for canvas elements
   */
  calculateDropZoneBounds(element: HTMLElement): DOMRect {
    return element.getBoundingClientRect()
  },

  /**
   * Check if position is within drop zone
   */
  isPositionInDropZone(position: Position, dropZone: DropZone): boolean {
    const { bounds } = dropZone
    return (
      position.x >= bounds.left &&
      position.x <= bounds.right &&
      position.y >= bounds.top &&
      position.y <= bounds.bottom
    )
  },
}

/**
 * Ghost element creation and management for drag preview
 */
export const DragPreviewManager = {
  /**
   * Create a ghost element for drag preview
   */
  createGhostElement(component: BaseComponent | ComponentType): HTMLElement {
    const ghost = document.createElement('div')
    ghost.className = 'drag-preview-ghost'

    // Style the ghost element
    Object.assign(ghost.style, {
      position: 'fixed',
      pointerEvents: 'none',
      opacity: '0.7',
      zIndex: '9999',
      border: '2px dashed #3b82f6',
      borderRadius: '4px',
      background: 'rgba(59, 130, 246, 0.1)',
      padding: '8px',
      fontSize: '14px',
      color: '#1f2937',
      whiteSpace: 'nowrap',
      transform: 'translate(-50%, -50%)',
    })

    // Set content based on component type
    if (typeof component === 'string') {
      ghost.textContent = `New ${component.charAt(0).toUpperCase() + component.slice(1)}`
      ghost.style.width = '120px'
      ghost.style.height = '40px'
    } else {
      ghost.textContent = `${component.type} Component`
      ghost.style.width = `${component.dimensions.width}px`
      ghost.style.height = `${component.dimensions.height}px`
    }

    return ghost
  },

  /**
   * Update ghost element position
   */
  updateGhostPosition(ghost: HTMLElement, position: Position): void {
    ghost.style.left = `${position.x}px`
    ghost.style.top = `${position.y}px`
  },

  /**
   * Remove ghost element from DOM
   */
  removeGhost(ghost: HTMLElement): void {
    if (ghost.parentElement) {
      ghost.parentElement.removeChild(ghost)
    }
  },
}

/**
 * Cross-browser event handler implementation with performance optimizations
 */
export class DragEventHandlerImpl implements DragEventHandler {
  private isActive = false
  private throttleMs = 16 // ~60fps
  private lastCallTime = 0
  private rafId: number | null = null

  constructor(
    private onDragStart: (event: NormalizedDragEvent) => void,
    private onDragMove: (event: NormalizedDragEvent) => void,
    private onDragEnd: (event: NormalizedDragEvent) => void
  ) {}

  handleDragStart(event: MouseEvent | TouchEvent): void {
    if (this.isActive) return

    this.isActive = true
    const normalizedEvent = this.normalizeEvent(event)
    normalizedEvent.preventDefault()

    this.onDragStart(normalizedEvent)
    this.addMoveAndEndListeners()
  }

  handleDragMove = (event: MouseEvent | TouchEvent): void => {
    if (!this.isActive) return

    // Throttle move events for performance
    const now = performance.now()
    if (now - this.lastCallTime < this.throttleMs) return

    this.lastCallTime = now

    // Use requestAnimationFrame for smooth updates
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }

    this.rafId = requestAnimationFrame(() => {
      const normalizedEvent = this.normalizeEvent(event)
      normalizedEvent.preventDefault()
      this.onDragMove(normalizedEvent)
    })
  }

  handleDragEnd = (event: MouseEvent | TouchEvent): void => {
    if (!this.isActive) return

    this.isActive = false
    this.removeMoveAndEndListeners()

    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    const normalizedEvent = this.normalizeEvent(event)
    this.onDragEnd(normalizedEvent)
  }

  normalizeEvent(event: MouseEvent | TouchEvent): NormalizedDragEvent {
    return normalizeEvent(event)
  }

  cleanup(): void {
    this.isActive = false
    this.removeMoveAndEndListeners()
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private addMoveAndEndListeners(): void {
    // Use passive listeners where appropriate for better performance
    document.addEventListener('mousemove', this.handleDragMove, {
      passive: false,
    })
    document.addEventListener('mouseup', this.handleDragEnd, { passive: false })
    document.addEventListener('touchmove', this.handleDragMove, {
      passive: false,
    })
    document.addEventListener('touchend', this.handleDragEnd, {
      passive: false,
    })
    document.addEventListener('touchcancel', this.handleDragEnd, {
      passive: false,
    })
  }

  private removeMoveAndEndListeners(): void {
    document.removeEventListener('mousemove', this.handleDragMove)
    document.removeEventListener('mouseup', this.handleDragEnd)
    document.removeEventListener('touchmove', this.handleDragMove)
    document.removeEventListener('touchend', this.handleDragEnd)
    document.removeEventListener('touchcancel', this.handleDragEnd)
  }
}

/**
 * Main drag system coordinator
 * Combines all drag components into a unified system
 */
export class DragSystem {
  private stateMachine: DragStateMachine
  private eventHandler: DragEventHandlerImpl
  private performanceMonitor = new DragPerformanceMonitorImpl()
  private currentGhost: HTMLElement | null = null

  constructor(
    initialContext: DragContext,
    private onStateChange: (context: DragContext) => void
  ) {
    this.stateMachine = new DragStateMachine(initialContext)
    this.eventHandler = new DragEventHandlerImpl(
      this.handleStart.bind(this),
      this.handleMove.bind(this),
      this.handleEnd.bind(this)
    )
  }

  /**
   * Initialize drag for a palette component
   */
  initializePaletteDrag(
    componentType: ComponentType,
    startEvent: MouseEvent | TouchEvent
  ): boolean {
    const normalizedEvent = normalizeEvent(startEvent)

    return this.stateMachine.transition(DragState.DRAGGING_FROM_PALETTE, {
      draggedComponent: componentType,
      startPosition: { x: normalizedEvent.clientX, y: normalizedEvent.clientY },
      currentPosition: {
        x: normalizedEvent.clientX,
        y: normalizedEvent.clientY,
      },
      targetElement: startEvent.target as HTMLElement,
      dragOffset: { x: 0, y: 0 },
      isDragValid: true,
    })
  }

  /**
   * Initialize drag for a canvas component
   */
  initializeCanvasDrag(
    component: BaseComponent,
    startEvent: MouseEvent | TouchEvent
  ): boolean {
    const normalizedEvent = normalizeEvent(startEvent)
    const element = startEvent.target as HTMLElement
    const rect = element.getBoundingClientRect()

    const dragOffset = {
      x: normalizedEvent.clientX - rect.left,
      y: normalizedEvent.clientY - rect.top,
    }

    return this.stateMachine.transition(DragState.DRAGGING_CANVAS_COMPONENT, {
      draggedComponent: component,
      startPosition: { x: component.position.x, y: component.position.y },
      currentPosition: { x: component.position.x, y: component.position.y },
      targetElement: element,
      dragOffset,
      isDragValid: true,
    })
  }

  private handleStart(event: NormalizedDragEvent): void {
    const context = this.stateMachine.getContext()

    // Create and show ghost element
    if (context.draggedComponent) {
      this.currentGhost = DragPreviewManager.createGhostElement(
        context.draggedComponent
      )
      document.body.appendChild(this.currentGhost)
      DragPreviewManager.updateGhostPosition(this.currentGhost, {
        x: event.clientX,
        y: event.clientY,
      })
    }

    this.onStateChange(context)
  }

  private handleMove(event: NormalizedDragEvent): void {
    const context = this.stateMachine.getContext()
    const newPosition = { x: event.clientX, y: event.clientY }

    // Check if minimum drag distance is met
    const dragDistance = DragCalculations.calculateDragDistance(
      context.startPosition,
      newPosition
    )

    if (dragDistance < (context.constraints?.minDragDistance || 3)) {
      return
    }

    // Update ghost position
    if (this.currentGhost) {
      DragPreviewManager.updateGhostPosition(this.currentGhost, newPosition)
    }

    // Update drag context
    this.stateMachine.transition(context.state, {
      currentPosition: newPosition,
      isDragValid: this.isValidDropLocation(newPosition),
    })

    this.onStateChange(this.stateMachine.getContext())
  }

  private handleEnd(event: NormalizedDragEvent): void {
    // const _context = this.stateMachine.getContext()

    // Clean up ghost element
    if (this.currentGhost) {
      DragPreviewManager.removeGhost(this.currentGhost)
      this.currentGhost = null
    }

    // Transition to end state
    this.stateMachine.transition(DragState.DRAG_ENDING, {
      currentPosition: { x: event.clientX, y: event.clientY },
    })

    // Immediately transition to idle
    this.stateMachine.transition(DragState.IDLE)

    this.onStateChange(this.stateMachine.getContext())
  }

  private isValidDropLocation(_position: Position): boolean {
    // Simple validation - can be enhanced with more complex logic
    return true
  }

  getCurrentState(): DragState {
    return this.stateMachine.getCurrentState()
  }

  getContext(): DragContext {
    return this.stateMachine.getContext()
  }

  getEventHandler(): DragEventHandler {
    return this.eventHandler
  }

  cleanup(): void {
    this.eventHandler.cleanup()
    this.performanceMonitor.reset()

    if (this.currentGhost) {
      DragPreviewManager.removeGhost(this.currentGhost)
      this.currentGhost = null
    }
  }
}
