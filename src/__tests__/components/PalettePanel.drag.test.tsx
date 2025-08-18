/**
 * PalettePanel drag source functionality tests
 * Tests palette item dragging behavior
 */

// Create mock functions that can be accessed from tests
const mockAddComponent = jest.fn()
const mockSelectComponent = jest.fn()

// Mock hooks BEFORE importing components to avoid hoisting issues
jest.mock('@/store/simple', () => ({
  useComponentActions: () => ({
    addComponent: mockAddComponent,
    selectComponent: mockSelectComponent,
  }),
  useDragContext: jest.fn(),
}))

jest.mock('@/hooks/useDragAndDrop', () => ({
  usePaletteDraggable: jest.fn(),
}))

jest.mock('@/utils/componentFactory', () => ({
  ComponentFactory: {
    create: jest.fn().mockReturnValue({
      id: 'mock-component',
      type: 'TEXT', // Use string literal to avoid circular dependency
      position: { x: 40, y: 40 },
    }),
  },
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PalettePanel } from '@/components/layout/PalettePanel'
import { ComponentType, DragState } from '@/types'
import { usePaletteDraggable } from '@/hooks/useDragAndDrop'

describe('PalettePanel Drag Functionality', () => {
  const mockDragHandlers = {
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
    draggable: false,
    onDragStart: jest.fn(),
    'data-draggable': 'palette',
    'data-component-type': ComponentType.TEXT,
  }

  const mockDragContext = {
    state: DragState.IDLE,
    draggedComponent: null,
    performanceData: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePaletteDraggable as jest.Mock).mockReturnValue(mockDragHandlers)
    require('@/store/simple').useDragContext.mockReturnValue(mockDragContext)
  })

  describe('Component Rendering', () => {
    it('should render all draggable component types', () => {
      render(<PalettePanel />)

      expect(screen.getByText('Text')).toBeInTheDocument()
      expect(screen.getByText('Text Area')).toBeInTheDocument()
      expect(screen.getByText('Image')).toBeInTheDocument()
      expect(screen.getByText('Button')).toBeInTheDocument()
    })

    it('should show drag instructions', () => {
      render(<PalettePanel />)

      expect(
        screen.getByText('Drag components to canvas or double-click to add')
      ).toBeInTheDocument()
    })
  })

  describe('Drag Handler Integration', () => {
    it('should apply drag handlers to each component item', () => {
      render(<PalettePanel />)

      const textComponent = screen.getByTestId('palette-item-text')
      expect(textComponent).toHaveAttribute('data-draggable', 'palette')
    })

    it('should call usePaletteDraggable for each component type', () => {
      render(<PalettePanel />)

      expect(usePaletteDraggable).toHaveBeenCalledWith(ComponentType.TEXT)
      expect(usePaletteDraggable).toHaveBeenCalledWith(ComponentType.TEXTAREA)
      expect(usePaletteDraggable).toHaveBeenCalledWith(ComponentType.IMAGE)
      expect(usePaletteDraggable).toHaveBeenCalledWith(ComponentType.BUTTON)
    })

    it('should handle mouse down events on palette items', () => {
      render(<PalettePanel />)

      const textComponent = screen.getByTestId('palette-item-text')
      fireEvent.mouseDown(textComponent!, { button: 0 })

      expect(mockDragHandlers.onMouseDown).toHaveBeenCalled()
    })
  })

  describe('Visual Feedback During Drag', () => {
    it('should show dragging state visual feedback', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      })

      render(<PalettePanel />)

      expect(screen.getByText('Dragging...')).toBeInTheDocument()
    })

    it('should highlight dragged component item', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        draggedComponent: ComponentType.TEXT,
      })

      render(<PalettePanel />)

      const textComponent = screen.getByTestId('palette-item-text')

      // Should have dragging styles applied
      expect(textComponent).toHaveStyle({
        opacity: '0.8',
        transform: 'scale(0.95)',
        border: '2px solid #3b82f6',
      })
    })

    it('should not show dragging feedback when idle', () => {
      render(<PalettePanel />)

      expect(screen.queryByText('Dragging...')).not.toBeInTheDocument()

      const textComponent = screen.getByTestId('palette-item-text')
      expect(textComponent).toHaveStyle({
        opacity: '1',
        transform: 'scale(1)',
      })
    })
  })

  describe('Double-Click Functionality', () => {
    beforeEach(() => {
      // Clear mock history
      mockAddComponent.mockClear()
      mockSelectComponent.mockClear()
    })

    it('should add component on double-click', () => {
      render(<PalettePanel />)

      const textComponent = screen.getByText('Text').closest('div')
      fireEvent.doubleClick(textComponent!)

      expect(mockAddComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mock-component',
          type: 'TEXT',
        })
      )
      expect(mockSelectComponent).toHaveBeenCalledWith('mock-component')
    })
  })

  describe('Performance Data Display', () => {
    it('should show performance data during drag operations', () => {
      require('@/store/simple').useDragContext.mockReturnValue({
        ...mockDragContext,
        state: DragState.DRAGGING_FROM_PALETTE,
        performanceData: {
          frameCount: 60,
          averageFrameTime: 16.67,
          lastFrameTime: performance.now(),
          memoryUsage: 1024,
        },
      })

      render(<PalettePanel />)

      // Should display some performance metrics (check by frames/avg frame time)
      expect(screen.getByText(/Frames:/)).toBeInTheDocument()
      expect(screen.getByText(/Avg Frame:/)).toBeInTheDocument()
    })

    it('should hide performance data when not dragging', () => {
      render(<PalettePanel />)

      expect(screen.queryByText(/FPS:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Memory:/)).not.toBeInTheDocument()
    })
  })

  describe('Native Drag Prevention', () => {
    it('should prevent native drag on all palette items', () => {
      render(<PalettePanel />)

      const componentItems = screen.getAllByRole('button', {
        name: /Add.*component/,
      })
      componentItems.forEach(item => {
        const parentDiv = item.closest('div')
        expect(parentDiv).toHaveAttribute('draggable', 'false')
      })
    })

    it('should prevent native drag start events', () => {
      render(<PalettePanel />)

      const textComponent = screen.getByText('Text').closest('div')

      // Use fireEvent.dragStart to properly trigger the React onDragStart handler
      const dragStartSpy = jest.fn()
      const originalPreventDefault = Event.prototype.preventDefault
      Event.prototype.preventDefault = dragStartSpy

      fireEvent.dragStart(textComponent!)

      // Restore original preventDefault
      Event.prototype.preventDefault = originalPreventDefault

      expect(dragStartSpy).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for drag functionality', () => {
      render(<PalettePanel />)

      const textComponent = screen.getByRole('button', {
        name: /Add Text component/,
      })
      expect(textComponent).toHaveAttribute('data-draggable', 'palette')
      expect(textComponent).toHaveAttribute(
        'data-component-type',
        ComponentType.TEXT
      )
    })

    it('should provide drag instructions to screen readers', () => {
      render(<PalettePanel />)

      expect(
        screen.getByText('Drag components to canvas or double-click to add')
      ).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing drag context gracefully', () => {
      require('@/store/simple').useDragContext.mockReturnValue(undefined)

      expect(() => {
        render(<PalettePanel />)
      }).not.toThrow()
    })

    it('should handle undefined drag handlers', () => {
      ;(usePaletteDraggable as jest.Mock).mockReturnValue(undefined)

      expect(() => {
        render(<PalettePanel />)
      }).not.toThrow()
    })

    it('should handle custom className and style props', () => {
      render(
        <PalettePanel
          className="custom-class"
          style={{ backgroundColor: 'red' }}
        />
      )

      const panel = screen.getByText('Components').closest('.panel')
      expect(panel).toHaveClass('custom-class')
      expect(panel).toHaveStyle({ backgroundColor: 'red' })
    })
  })
})
