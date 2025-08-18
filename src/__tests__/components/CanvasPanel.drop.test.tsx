/**
 * CanvasPanel drop target functionality tests
 * Tests canvas drop zone behavior and component rendering
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanvasPanel } from '@/components/layout/CanvasPanel'
import { ComponentType, DragState, BaseComponent } from '@/types'
import { useDropTarget } from '@/hooks/useDragAndDrop'

// Mock ComponentRenderer to avoid complex rendering logic
jest.mock('@/components/ui/ComponentRenderer', () => ({
  ComponentRenderer: ({ component }: { component: BaseComponent }) => (
    <div data-testid={`component-${component.id}`}>
      {component.type} -{' '}
      {component.props?.content || component.props?.label || 'No content'}
    </div>
  ),
}))

// Mock hooks
jest.mock('@/store/simple', () => ({
  useComponents: jest.fn(),
  useSelectedComponents: jest.fn(),
  useComponentActions: jest.fn(),
  useDragContext: jest.fn(),
}))

jest.mock('@/hooks/useDragAndDrop', () => ({
  useDropTarget: jest.fn(),
}))

describe('CanvasPanel Drop Functionality', () => {
  const mockComponents = new Map([
    [
      'comp1',
      {
        id: 'comp1',
        type: ComponentType.TEXT,
        position: { x: 100, y: 100 },
        dimensions: { width: 150, height: 50 },
        props: { content: 'Test Text' },
        zIndex: 1,
      },
    ],
    [
      'comp2',
      {
        id: 'comp2',
        type: ComponentType.BUTTON,
        position: { x: 200, y: 200 },
        dimensions: { width: 100, height: 40 },
        props: { label: 'Click Me' },
        zIndex: 2,
      },
    ],
  ])

  const mockSelectedComponents = [mockComponents.get('comp1')]

  const mockDropHandlers = {
    onMouseUp: jest.fn(),
    onTouchEnd: jest.fn(),
    'data-drop-target': true,
    'data-drag-state': DragState.IDLE,
  }

  const mockDragContext = {
    state: DragState.IDLE,
    draggedComponent: null,
    performanceData: null,
  }

  const mockComponentActions = {
    selectComponent: jest.fn(),
    clearSelection: jest.fn(),
    removeComponent: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    require('@/store/simple').useComponents.mockReturnValue(mockComponents)
    require('@/store/simple').useSelectedComponents.mockReturnValue(
      mockSelectedComponents
    )
    require('@/store/simple').useDragContext.mockReturnValue(mockDragContext)
    require('@/store/simple').useComponentActions.mockReturnValue(
      mockComponentActions
    )
    ;(useDropTarget as jest.Mock).mockReturnValue(mockDropHandlers)
  })

  describe('Drop Target Setup', () => {
    it('should apply drop target handlers to canvas area', () => {
      render(<CanvasPanel />)

      const canvasArea = screen.getByTestId('canvas-area')
      expect(canvasArea).toHaveAttribute('data-drop-target', 'true')
    })

    it('should handle mouse up events for drops', () => {
      render(<CanvasPanel />)

      const canvasArea = screen.getByTestId('canvas-area')
      fireEvent.mouseUp(canvasArea!, { clientX: 100, clientY: 200 })

      expect(mockDropHandlers.onMouseUp).toHaveBeenCalled()
    })

    it('should handle touch end events for drops', () => {
      render(<CanvasPanel />)

      const canvasArea = screen.getByTestId('canvas-area')
      fireEvent.touchEnd(canvasArea!, {
        changedTouches: [{ clientX: 100, clientY: 200 }],
      })

      expect(mockDropHandlers.onTouchEnd).toHaveBeenCalled()
    })
  })

  describe('Drop Zone Visual Feedback', () => {
    it('should show drop zone feedback during palette drag', () => {
      // Clear components and set drag state for empty canvas drag feedback
      require('@/store/simple').useComponents.mockReturnValue(new Map())
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
      })

      render(<CanvasPanel />)

      expect(
        screen.getByText('Release to drop component here')
      ).toBeInTheDocument()
      expect(
        screen.getByText('🎯 Release to place component here')
      ).toBeInTheDocument()
    })

    it('should apply pulse animation class during drag', () => {
      // Clear components and set drag state for empty canvas drag feedback
      require('@/store/simple').useComponents.mockReturnValue(new Map())
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
      })

      render(<CanvasPanel />)

      const dropIndicator = screen.getByText(
        '🎯 Release to place component here'
      )
      expect(dropIndicator).toHaveClass('drop-zone-active')
    })

    it('should not show drop zone feedback when idle', () => {
      // Clear components for empty canvas
      require('@/store/simple').useComponents.mockReturnValue(new Map())
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: 'idle',
      })

      render(<CanvasPanel />)

      expect(
        screen.queryByText('🎯 Release to place component here')
      ).not.toBeInTheDocument()
      expect(
        screen.getByText('Drop components here to start building your design')
      ).toBeInTheDocument()
    })
  })

  describe('Component Rendering', () => {
    it('should render all components when canvas has components', () => {
      render(<CanvasPanel />)

      expect(screen.getByTestId('component-comp1')).toBeInTheDocument()
      expect(screen.getByTestId('component-comp2')).toBeInTheDocument()
      expect(screen.getByText('text - Test Text')).toBeInTheDocument()
      expect(screen.getByText('button - Click Me')).toBeInTheDocument()
    })

    it('should show empty state when no components', () => {
      require('@/store/simple').useComponents.mockReturnValue(new Map())

      render(<CanvasPanel />)

      expect(screen.getByText('Design Canvas')).toBeInTheDocument()
      expect(
        screen.getByText('Drop components here to start building your design')
      ).toBeInTheDocument()
    })

    it('should pass correct props to ComponentRenderer', () => {
      render(<CanvasPanel />)

      // ComponentRenderer should receive the correct component data
      const comp1Element = screen.getByTestId('component-comp1')
      const comp2Element = screen.getByTestId('component-comp2')

      expect(comp1Element).toBeInTheDocument()
      expect(comp2Element).toBeInTheDocument()
    })
  })

  describe('Selection Management', () => {
    it('should clear selection on canvas background click', () => {
      render(<CanvasPanel />)

      const canvasArea = screen.getByTestId('canvas-area')
      fireEvent.click(canvasArea!)

      expect(mockComponentActions.clearSelection).toHaveBeenCalled()
    })

    it('should not clear selection during drag operations', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_CANVAS_COMPONENT,
      })

      render(<CanvasPanel />)

      const canvasArea = screen
        .getByRole('main')
        .querySelector('[data-drop-target="true"]')
      fireEvent.click(canvasArea!)

      expect(mockComponentActions.clearSelection).not.toHaveBeenCalled()
    })
  })

  describe('Clear Canvas Functionality', () => {
    it('should render clear canvas button', () => {
      render(<CanvasPanel />)

      expect(screen.getByText('Clear Canvas')).toBeInTheDocument()
    })

    it('should clear all components when clear button clicked', () => {
      render(<CanvasPanel />)

      const clearButton = screen.getByText('Clear Canvas')
      fireEvent.click(clearButton)

      // Should call removeComponent for each component (with false parameter)
      expect(mockComponentActions.removeComponent).toHaveBeenCalledWith(
        'comp1',
        false
      )
      expect(mockComponentActions.removeComponent).toHaveBeenCalledWith(
        'comp2',
        false
      )
    })
  })

  describe('Performance Monitoring', () => {
    it('should show FPS counter during drag operations', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        performanceData: {
          frameCount: 60,
          averageFrameTime: 16.67,
          lastFrameTime: performance.now(),
          memoryUsage: 1024,
        },
      })

      render(<CanvasPanel />)

      expect(screen.getByText(/FPS:/)).toBeInTheDocument()
    })

    it('should not show FPS counter when not dragging', () => {
      render(<CanvasPanel />)

      expect(screen.queryByText(/FPS:/)).not.toBeInTheDocument()
    })

    it('should calculate FPS correctly from performance data', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_CANVAS_COMPONENT,
        performanceData: {
          frameCount: 60,
          averageFrameTime: 20, // 20ms = 50 FPS
          lastFrameTime: performance.now(),
          memoryUsage: 1024,
        },
      })

      render(<CanvasPanel />)

      expect(screen.getByText('FPS: 50')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should handle custom className and style props', () => {
      render(
        <CanvasPanel
          className="custom-canvas"
          style={{ backgroundColor: 'lightblue' }}
        />
      )

      const panel = screen.getByRole('main')
      expect(panel).toHaveClass('custom-canvas')
      expect(panel).toHaveStyle({ backgroundColor: 'lightblue' })
    })

    it('should render children when provided', () => {
      render(
        <CanvasPanel>
          <div>Custom Canvas Content</div>
        </CanvasPanel>
      )

      expect(screen.getByText('Custom Canvas Content')).toBeInTheDocument()
    })
  })

  describe('Drop Target Data Attributes', () => {
    it('should have correct drag state data attribute', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
      })

      render(<CanvasPanel />)

      // Canvas should show drag active state
      const canvasArea = screen.getByTestId('canvas-area')
      expect(canvasArea).toHaveAttribute(
        'data-drag-state',
        DragState.DRAGGING_FROM_PALETTE
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty component map gracefully', () => {
      require('@/store/simple').useComponents.mockReturnValue(new Map())

      expect(() => {
        render(<CanvasPanel />)
      }).not.toThrow()
    })

    it('should handle missing drag context gracefully', () => {
      require('@/store/simple').useDragContext.mockReturnValue(undefined)

      expect(() => {
        render(<CanvasPanel />)
      }).not.toThrow()
    })

    it('should handle components with missing properties', () => {
      const incompleteComponent = new Map([
        [
          'incomplete',
          {
            id: 'incomplete',
            type: ComponentType.TEXT,
            // Missing position, dimensions, props
          },
        ],
      ])

      require('@/store/simple').useComponents.mockReturnValue(
        incompleteComponent
      )

      expect(() => {
        render(<CanvasPanel />)
      }).not.toThrow()
    })

    it('should handle selection array with undefined components', () => {
      require('@/store/simple').useSelectedComponents.mockReturnValue([
        undefined,
        null,
      ])

      expect(() => {
        render(<CanvasPanel />)
      }).not.toThrow()
    })
  })

  describe('Drop Zone Animation States', () => {
    it('should show different messages based on drag state', () => {
      // Test idle state with empty canvas
      require('@/store/simple').useComponents.mockReturnValue(new Map())
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: 'idle',
      })
      render(<CanvasPanel />)
      expect(
        screen.getByText('Drop components here to start building your design')
      ).toBeInTheDocument()

      // Test dragging state with empty canvas
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
      })

      render(<CanvasPanel />)
      expect(
        screen.getByText('Release to drop component here')
      ).toBeInTheDocument()
    })
  })
})
