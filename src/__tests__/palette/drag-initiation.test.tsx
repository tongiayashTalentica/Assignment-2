import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ComponentPaletteItem } from '@/components/ui/ComponentPaletteItem'
import { ComponentType } from '@/types'

// Mock the drag and drop hook
const mockDragHandlers = {
  onMouseDown: jest.fn(),
  onTouchStart: jest.fn(),
  draggable: false,
  onDragStart: jest.fn(),
  'data-draggable': 'palette',
  'data-component-type': ComponentType.TEXT,
}

jest.mock('@/hooks/useDragAndDrop', () => ({
  usePaletteDraggable: () => mockDragHandlers,
}))

// Mock the drag context
const mockDragContext = {
  state: 'idle',
  draggedComponent: null,
}

jest.mock('@/store/simple', () => ({
  useDragContext: () => mockDragContext,
}))

describe('Drag Initiation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDragContext.state = 'idle'
    mockDragContext.draggedComponent = null
  })

  describe('ComponentPaletteItem Drag Handlers', () => {
    test('applies drag handlers from usePaletteDraggable hook', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      // Check that drag handlers are applied
      expect(item).toHaveAttribute('data-component-type', ComponentType.TEXT)
      expect(item).toHaveAttribute('draggable', 'false')
    })

    test('calls onMouseDown handler when mouse down occurs', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseDown(item)

      expect(mockDragHandlers.onMouseDown).toHaveBeenCalledTimes(1)
      expect(mockDragHandlers.onMouseDown).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mousedown',
        })
      )
    })

    test('calls onTouchStart handler when touch starts', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.touchStart(item)

      expect(mockDragHandlers.onTouchStart).toHaveBeenCalledTimes(1)
      expect(mockDragHandlers.onTouchStart).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'touchstart',
        })
      )
    })

    test('prevents native drag behavior', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      const dragStartEvent = new Event('dragstart', { bubbles: true })
      const preventDefaultSpy = jest.spyOn(dragStartEvent, 'preventDefault')

      fireEvent(item, dragStartEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    test('disables native draggable attribute', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      expect(item).toHaveAttribute('draggable', 'false')
    })
  })

  describe('Drag State Visual Feedback', () => {
    test('shows dragging state when component is being dragged', () => {
      // Mock dragging state
      mockDragContext.state = 'dragging_from_palette'
      mockDragContext.draggedComponent = ComponentType.TEXT

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      // Should have dragging styles
      expect(item).toHaveStyle({
        cursor: 'grabbing',
        border: '2px solid #3b82f6',
        backgroundColor: '#eff6ff',
        opacity: '0.8',
      })
    })

    test('shows normal state when not dragging', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      // Should have normal styles
      expect(item).toHaveStyle({
        cursor: 'grab',
        border: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        opacity: '1',
      })
    })

    test('only shows dragging state for the dragged component', () => {
      // Mock dragging state for TEXT component
      mockDragContext.state = 'dragging_from_palette'
      mockDragContext.draggedComponent = ComponentType.TEXT

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      const { rerender } = render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const textItem = screen.getByRole('button', {
        name: /add text component/i,
      })
      expect(textItem).toHaveStyle({ cursor: 'grabbing' })

      // Render a different component type
      rerender(
        <ComponentPaletteItem
          type={ComponentType.BUTTON}
          label="Button"
          description="Button component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const buttonItem = screen.getByRole('button', {
        name: /add button component/i,
      })
      expect(buttonItem).toHaveStyle({ cursor: 'grab' }) // Not dragging
    })
  })

  describe('Hover State Management', () => {
    test('shows hover state on mouse enter', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseEnter(item)

      // Hover state styling
      expect(item).toHaveStyle({
        border: '1px solid #d1d5db',
        backgroundColor: '#f9fafb',
      })
    })

    test('removes hover state on mouse leave', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseEnter(item)
      fireEvent.mouseLeave(item)

      // Back to normal state
      expect(item).toHaveStyle({
        border: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
      })
    })

    test('hover state does not override dragging state', () => {
      // Mock dragging state
      mockDragContext.state = 'dragging_from_palette'
      mockDragContext.draggedComponent = ComponentType.TEXT

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseEnter(item)

      // Should maintain dragging styles, not hover styles
      expect(item).toHaveStyle({
        cursor: 'grabbing',
        border: '2px solid #3b82f6',
        backgroundColor: '#eff6ff',
      })
    })
  })

  describe('Tooltip Management During Drag', () => {
    test('tooltip appears after hover delay', async () => {
      jest.useFakeTimers()

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          showTooltip={true}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseEnter(item)

      // Fast-forward past the tooltip delay
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(
        screen.getByText(/drag to canvas, double-click to add/i)
      ).toBeInTheDocument()

      jest.useRealTimers()
    })

    test('tooltip disappears on mouse leave', async () => {
      jest.useFakeTimers()

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          showTooltip={true}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseEnter(item)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(
        screen.getByText(/drag to canvas, double-click to add/i)
      ).toBeInTheDocument()

      fireEvent.mouseLeave(item)

      expect(
        screen.queryByText(/drag to canvas, double-click to add/i)
      ).not.toBeInTheDocument()

      jest.useRealTimers()
    })

    test('tooltip does not appear when disabled', async () => {
      jest.useFakeTimers()

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
          showTooltip={true}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseEnter(item)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(
        screen.queryByText(/drag to canvas, double-click to add/i)
      ).not.toBeInTheDocument()

      jest.useRealTimers()
    })
  })

  describe('Disabled State', () => {
    test('disabled items do not respond to drag events', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      fireEvent.mouseDown(item)

      // Should not have called drag handlers for disabled items
      expect(mockDragHandlers.onMouseDown).not.toHaveBeenCalled()
    })

    test('disabled items have appropriate cursor style', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      expect(item).toHaveStyle({ cursor: 'not-allowed' })
    })

    test('disabled items have reduced opacity', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })

      expect(item).toHaveStyle({ opacity: '0.5' })
    })
  })

  describe('Drag Indicator Visual', () => {
    test('shows drag dots with correct styling', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const dragDots = document.querySelectorAll(
        '[style*="width: 3px"][style*="height: 3px"]'
      )
      expect(dragDots).toHaveLength(3) // Three dots

      dragDots.forEach(dot => {
        expect(dot).toHaveStyle({
          width: '3px',
          height: '3px',
          backgroundColor: '#9ca3af',
          borderRadius: '50%',
        })
      })
    })

    test('drag dots become more visible on hover', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button', { name: /add text component/i })
      const dragIndicator = item.querySelector('[style*="gap: 2px"]')

      // Initially semi-transparent
      expect(dragIndicator).toHaveStyle({ opacity: '0.5' })

      fireEvent.mouseEnter(item)

      // More visible on hover
      expect(dragIndicator).toHaveStyle({ opacity: '1' })
    })
  })
})
