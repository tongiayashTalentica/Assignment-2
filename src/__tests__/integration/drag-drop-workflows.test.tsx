import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PalettePanel } from '@/components/layout/PalettePanel'
import { CanvasPanel } from '@/components/layout/CanvasPanel'
import { ComponentRenderer } from '@/components/ui/ComponentRenderer'
import { ComponentType, DragState } from '@/types'
import { useAppStore } from '@/store/simple'

// Mock drag-drop hooks
jest.mock('@/hooks/useDragAndDrop', () => ({
  usePaletteDraggable: jest.fn(type => ({
    onMouseDown: jest.fn(_e => {
      const store = useAppStore()
      store.startDrag({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: type,
      })
    }),
    onTouchStart: jest.fn(_e => {
      const store = useAppStore()
      store.startDrag({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: type,
      })
    }),
    draggable: false,
    onDragStart: jest.fn(_e => _e.preventDefault()),
    'data-draggable': 'palette',
    'data-component-type': type,
    onDoubleClick: jest.fn(() => {
      // Mock double-click to add component directly
      const store = useAppStore()
      const component = {
        id: `new-component-${Date.now()}`,
        type: type,
        position: { x: 40, y: 40 },
        dimensions: { width: 200, height: 40 },
        props: {},
        zIndex: 1,
        constraints: {},
        metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
      }
      store.addComponent(component)
      store.selectComponent(component.id)
    }),
  })),
  useCanvasDraggable: jest.fn(component => ({
    onMouseDown: jest.fn(_e => {
      // Only handle left-click (button 0), ignore right-click
      if (e.button !== 0) return

      const store = useAppStore()
      store.startDrag({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: component,
      })
    }),
    onTouchStart: jest.fn(_e => {
      const store = useAppStore()
      store.startDrag({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: component,
      })
    }),
    draggable: false,
    onDragStart: jest.fn(_e => _e.preventDefault()),
    'data-draggable': 'canvas',
    'data-component-id': component?.id,
  })),
  useDropTarget: jest.fn(() => ({
    onMouseUp: jest.fn(e => {
      const store = useAppStore()
      const dragContext = store.application.ui.dragContext
      if (dragContext.state === DragState.DRAGGING_FROM_PALETTE) {
        store.addComponent({
          id: `new-component-${Date.now()}`,
          type: dragContext.draggedComponent,
          position: { x: e.clientX || 100, y: e.clientY || 100 },
          dimensions: { width: 200, height: 40 },
          props: {},
          zIndex: 1,
          constraints: {},
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
          },
        })
      }
      store.endDrag()
    }),
    onTouchEnd: jest.fn(),
  })),
}))

// Mock store for integration tests
jest.mock('@/store/simple', () => {
  const mockStore = {
    application: {
      canvas: {
        components: new Map(),
        selectedComponentIds: [],
        boundaries: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
        grid: { snapToGrid: true, size: 20 },
      },
      ui: {
        dragContext: {
          state: 'idle',
          draggedComponent: null,
          startPosition: { x: 0, y: 0 },
          currentPosition: { x: 0, y: 0 },
          targetElement: null,
          dragOffset: { x: 0, y: 0 },
          isDragValid: false,
          performanceData: null,
        },
      },
    },
    addComponent: jest.fn(),
    selectComponent: jest.fn(),
    removeComponent: jest.fn(),
    clearSelection: jest.fn(),
    moveComponent: jest.fn(),
    startDrag: jest.fn(),
    updateDrag: jest.fn(),
    endDrag: jest.fn(),
  }

  return {
    useAppStore: jest.fn(() => mockStore),
    useComponents: jest.fn(() => new Map()),
    useSelectedComponents: jest.fn(() => []),
    useComponentActions: jest.fn(() => ({
      addComponent: mockStore.addComponent,
      selectComponent: mockStore.selectComponent,
      removeComponent: mockStore.removeComponent,
      clearSelection: mockStore.clearSelection,
      moveComponent: mockStore.moveComponent,
    })),
    useDragContext: jest.fn(() => mockStore.application.ui.dragContext),
    useUIActions: jest.fn(() => ({
      startDrag: mockStore.startDrag,
      updateDrag: mockStore.updateDrag,
      endDrag: mockStore.endDrag,
    })),
    useCanvas: jest.fn(() => mockStore.application.canvas),
  }
})

// Mock drag system
jest.mock('@/utils/dragSystem', () => ({
  DragSystem: jest.fn().mockImplementation(() => ({
    initializePaletteDrag: jest.fn().mockReturnValue(true),
    initializeCanvasDrag: jest.fn().mockReturnValue(true),
    getEventHandler: jest.fn().mockReturnValue({
      handleDragStart: jest.fn(),
      handleDragMove: jest.fn(),
      handleDragEnd: jest.fn(),
    }),
    getCurrentState: jest.fn().mockReturnValue('idle'),
    getContext: jest.fn().mockReturnValue({
      state: 'idle',
      draggedComponent: null,
    }),
    cleanup: jest.fn(),
  })),
  DragCalculations: {
    constrainPosition: jest.fn(pos => pos),
    calculateDragDistance: jest.fn(() => 10),
  },
  DragPreviewManager: {
    createGhostElement: jest.fn(() => document.createElement('div')),
    updateGhostPosition: jest.fn(),
    removeGhost: jest.fn(),
  },
}))

// Mock ComponentFactory
jest.mock('@/utils/componentFactory', () => ({
  ComponentFactory: {
    create: jest.fn().mockImplementation((type, position) => ({
      id: `mock-${type}-${Date.now()}`,
      type,
      position,
      dimensions: { width: 200, height: 40 },
      props: {
        kind: 'text',
        content: 'Mock Component',
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
    })),
  },
}))

describe('Drag and Drop Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset DOM
    document.body.innerHTML = ''
  })

  describe('Palette to Canvas Drag Workflow', () => {
    it('should render palette with draggable components', () => {
      render(<PalettePanel />)

      expect(screen.getByText('Text')).toBeInTheDocument()
      expect(screen.getByText('Text Area')).toBeInTheDocument()
      expect(screen.getByText('Image')).toBeInTheDocument()
      expect(screen.getByText('Button')).toBeInTheDocument()
    })

    it('should handle mouse drag from palette', async () => {
      render(<PalettePanel />)

      const textComponent = screen.getByText('Text').closest('div')
      expect(textComponent).toBeInTheDocument()

      // Start drag
      fireEvent.mouseDown(textComponent!, { clientX: 50, clientY: 60 })

      // Verify drag started
      expect(useAppStore().startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      })
    })

    it('should handle touch drag from palette', async () => {
      render(<PalettePanel />)

      const buttonComponent = screen.getByText('Button').closest('div')
      expect(buttonComponent).toBeInTheDocument()

      // Start touch drag
      fireEvent.touchStart(buttonComponent!, {
        touches: [{ clientX: 100, clientY: 120 }],
      })

      expect(useAppStore().startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.BUTTON,
      })
    })

    it('should show drag feedback in palette during drag', () => {
      // Mock dragging state BEFORE rendering
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext = {
        state: 'dragging_from_palette', // Use string instead of enum
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetElement: null,
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
        performanceData: null,
      }

      render(<PalettePanel />)

      expect(screen.getByText('Dragging...')).toBeInTheDocument()
    })

    it('should double-click to add component directly', () => {
      render(<PalettePanel />)

      const imageComponent = screen.getByText('Image').closest('div')
      fireEvent.doubleClick(imageComponent!)

      expect(useAppStore().addComponent).toHaveBeenCalled()
      expect(useAppStore().selectComponent).toHaveBeenCalled()
    })
  })

  describe('Canvas Drop Zone', () => {
    it('should render empty canvas with placeholder', () => {
      // Clear mock store for empty canvas test
      const mockStore = useAppStore() as any
      mockStore.application.canvas.components = new Map()
      mockStore.application.ui.dragContext.state = 'idle'

      render(<CanvasPanel />)

      expect(screen.getByText('Design Canvas')).toBeInTheDocument()
      expect(
        screen.getByText('Drop components here to start building your design')
      ).toBeInTheDocument()
    })

    it('should show drop zone feedback during drag', () => {
      // Mock dragging state BEFORE rendering
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext = {
        state: 'dragging_from_palette', // Use string instead of enum
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetElement: null,
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
        performanceData: null,
      }

      render(<CanvasPanel />)

      expect(
        screen.getByText('Release to drop component here')
      ).toBeInTheDocument()
      expect(
        screen.getByText('🎯 Release to place component here')
      ).toBeInTheDocument()
    })

    it('should handle drop on canvas', async () => {
      // Mock dragging state
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext.state =
        DragState.DRAGGING_FROM_PALETTE
      mockStore.application.ui.dragContext.draggedComponent = ComponentType.TEXT

      render(<CanvasPanel />)

      const canvasArea = screen.getByTestId('canvas-area')

      // Simulate drop
      fireEvent.mouseUp(canvasArea!, { clientX: 300, clientY: 400 })

      await waitFor(() => {
        expect(useAppStore().addComponent).toHaveBeenCalled()
      })
    })

    it('should clear selection on background click when not dragging', () => {
      // Ensure drag context is idle for this test
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext.state = 'idle'

      render(<CanvasPanel />)

      const canvasArea = screen.getByTestId('canvas-area')
      fireEvent.click(canvasArea!)

      expect(useAppStore().clearSelection).toHaveBeenCalled()
    })

    it('should not clear selection on background click when dragging', () => {
      // Mock dragging state
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext.state =
        DragState.DRAGGING_FROM_PALETTE

      const { rerender } = render(<CanvasPanel />)
      rerender(<CanvasPanel />)

      const canvasArea = screen.getByTestId('canvas-area')
      fireEvent.click(canvasArea!)

      expect(useAppStore().clearSelection).not.toHaveBeenCalled()
    })
  })

  describe('Canvas Component Movement', () => {
    const mockComponent = {
      id: 'test-component',
      type: ComponentType.TEXT,
      position: { x: 100, y: 100 },
      dimensions: { width: 200, height: 40 },
      props: {
        kind: 'text',
        content: 'Test Component',
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

    it('should render canvas component', () => {
      render(
        <ComponentRenderer
          component={mockComponent}
          isSelected={false}
          onSelect={jest.fn()}
        />
      )

      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('should show draggable indicator when component is selected', () => {
      render(
        <ComponentRenderer
          component={mockComponent}
          isSelected={true}
          onSelect={jest.fn()}
        />
      )

      const component = screen.getByTestId('component-test-component')
      expect(component).toHaveStyle('outline: 2px solid #3b82f6') // Selected style
      expect(component).toBeInTheDocument()
    })

    it('should handle canvas component drag start', () => {
      const mockOnSelect = jest.fn()

      render(
        <ComponentRenderer
          component={mockComponent}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      )

      const component = screen.getByTestId('component-test-component')

      // Start drag with left mouse button
      fireEvent.mouseDown(component, { button: 0, clientX: 150, clientY: 120 })

      expect(useAppStore().startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: mockComponent,
      })
    })

    it('should ignore right-click on canvas component', () => {
      render(
        <ComponentRenderer
          component={mockComponent}
          isSelected={true}
          onSelect={jest.fn()}
        />
      )

      const component = screen.getByTestId('component-test-component')

      // Right-click should not start drag
      fireEvent.mouseDown(component, { button: 2, clientX: 150, clientY: 120 })

      expect(useAppStore().startDrag).not.toHaveBeenCalled()
    })

    it('should handle touch drag on canvas component', () => {
      render(
        <ComponentRenderer
          component={mockComponent}
          isSelected={true}
          onSelect={jest.fn()}
        />
      )

      const component = screen.getByTestId('component-test-component')

      // Touch drag
      fireEvent.touchStart(component, {
        touches: [{ clientX: 150, clientY: 120 }],
      })

      expect(useAppStore().startDrag).toHaveBeenCalledWith({
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        draggedComponent: mockComponent,
      })
    })

    it('should show drag styling when component is being dragged', () => {
      // Mock dragging state
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext.state =
        DragState.DRAGGING_CANVAS_COMPONENT
      mockStore.application.ui.dragContext.draggedComponent = mockComponent

      const { rerender } = render(
        <ComponentRenderer
          component={mockComponent}
          isSelected={true}
          onSelect={jest.fn()}
        />
      )
      rerender(
        <ComponentRenderer
          component={mockComponent}
          isSelected={true}
          onSelect={jest.fn()}
        />
      )

      const component = screen.getByTestId('component-test-component')
      expect(component).toHaveStyle('opacity: 0.8')
      expect(component).toHaveStyle('cursor: grabbing')
    })

    it('should not handle selection during drag operations', () => {
      // Mock dragging state
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext.state =
        DragState.DRAGGING_FROM_PALETTE

      const mockOnSelect = jest.fn()

      const { rerender } = render(
        <ComponentRenderer
          component={mockComponent}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      )
      rerender(
        <ComponentRenderer
          component={mockComponent}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      )

      const component = screen.getByTestId('component-test-component')
      fireEvent.click(component)

      expect(mockOnSelect).not.toHaveBeenCalled()
    })
  })

  describe('Performance Monitoring', () => {
    it('should show FPS indicator during drag', () => {
      const mockStore = useAppStore() as any
      // Update the mock store directly to ensure the change is reflected
      mockStore.application.ui.dragContext = {
        state: 'dragging_from_palette', // Use string to avoid enum issues in tests
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetElement: null,
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
        performanceData: {
          frameCount: 60,
          averageFrameTime: 16.67,
          lastFrameTime: performance.now(),
          memoryUsage: 1024000,
        },
      }

      const { rerender } = render(<CanvasPanel />)
      rerender(<CanvasPanel />)

      expect(screen.getByText(/FPS:/)).toBeInTheDocument()
    })

    it('should show performance data in palette during drag', () => {
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext = {
        state: 'dragging_from_palette',
        draggedComponent: ComponentType.TEXT,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetElement: null,
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
        performanceData: {
          frameCount: 45,
          averageFrameTime: 22.2,
          lastFrameTime: performance.now(),
          memoryUsage: 2048000,
        },
      }

      const { rerender } = render(<PalettePanel />)
      rerender(<PalettePanel />)

      expect(screen.getByText(/Frames:/)).toBeInTheDocument()
      expect(screen.getByText(/Avg Frame:/)).toBeInTheDocument()
    })
  })

  describe('Cross-Component Integration', () => {
    it('should integrate palette and canvas drag-drop workflow', async () => {
      const { rerender } = render(
        <div>
          <PalettePanel />
          <CanvasPanel />
        </div>
      )

      // Step 1: Start drag from palette
      const textComponent = screen.getByText('Text').closest('div')
      fireEvent.mouseDown(textComponent!, { clientX: 50, clientY: 60 })

      // Step 2: Update store state to simulate drag in progress
      const mockStore = useAppStore() as any
      mockStore.application.ui.dragContext.state =
        DragState.DRAGGING_FROM_PALETTE
      mockStore.application.ui.dragContext.draggedComponent = ComponentType.TEXT

      rerender(
        <div>
          <PalettePanel />
          <CanvasPanel />
        </div>
      )

      // Step 3: Verify both components show drag feedback
      expect(screen.getByText('Dragging...')).toBeInTheDocument()
      expect(
        screen.getByText('Release to drop component here')
      ).toBeInTheDocument()

      // Step 4: Drop on canvas
      const dropZone = screen
        .getByText('Release to drop component here')
        .closest('div')
      fireEvent.mouseUp(dropZone!, { clientX: 300, clientY: 400 })

      await waitFor(() => {
        expect(useAppStore().addComponent).toHaveBeenCalled()
      })
    })

    it('should maintain state consistency across component updates', () => {
      const mockStore = useAppStore() as any

      // Initial render
      const { rerender } = render(<PalettePanel />)

      // Update drag state
      mockStore.application.ui.dragContext = {
        state: 'dragging_from_palette',
        draggedComponent: ComponentType.IMAGE,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetElement: null,
        dragOffset: { x: 0, y: 0 },
        isDragValid: true,
        performanceData: null,
      }

      // Rerender with new state
      rerender(<PalettePanel />)

      expect(screen.getByText('Dragging...')).toBeInTheDocument()

      // End drag
      mockStore.application.ui.dragContext = {
        state: 'idle',
        draggedComponent: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetElement: null,
        dragOffset: { x: 0, y: 0 },
        isDragValid: false,
        performanceData: null,
      }

      rerender(<PalettePanel />)

      // Reset drag state in mock
      const store = (useAppStore as jest.Mock).mock.results[0].value
      store.application.ui.dragContext.state = 'idle'
      store.application.ui.dragContext.draggedComponent = null

      rerender(<PalettePanel />)
      expect(screen.queryByText('Dragging...')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing event targets gracefully', () => {
      render(<PalettePanel />)

      const textComponent = screen.getByText('Text').closest('div')

      // Create event with null target
      const mockEvent = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 60,
        bubbles: true,
      })
      Object.defineProperty(mockEvent, 'target', { value: null })

      expect(() => {
        fireEvent(textComponent!, mockEvent)
      }).not.toThrow()
    })

    it('should handle rapid state changes', async () => {
      const mockStore = useAppStore() as any
      const { rerender } = render(<CanvasPanel />)

      // Rapid state changes
      mockStore.application.ui.dragContext.state =
        DragState.DRAGGING_FROM_PALETTE
      rerender(<CanvasPanel />)

      mockStore.application.ui.dragContext.state = DragState.DRAG_ENDING
      rerender(<CanvasPanel />)

      mockStore.application.ui.dragContext.state = DragState.IDLE
      rerender(<CanvasPanel />)

      // Should not crash - check for canvas panel instead
      expect(screen.getByText('Canvas')).toBeInTheDocument()
    })

    it('should handle cleanup on unmount', () => {
      const { unmount } = render(
        <div>
          <PalettePanel />
          <CanvasPanel />
        </div>
      )

      expect(() => unmount()).not.toThrow()
    })
  })
})
