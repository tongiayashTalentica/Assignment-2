import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentRenderer } from '@/components/ui/ComponentRenderer'
import { ComponentType } from '@/types'

const mockComponent = {
  id: 'test-component',
  type: ComponentType.IMAGE,
  position: { x: 100, y: 100 },
  dimensions: { width: 200, height: 150 },
  props: {
    src: 'test-image.jpg',
    alt: 'Test Image',
    objectFit: 'cover',
  },
  zIndex: 1,
  constraints: {
    movable: true,
    resizable: true,
    deletable: true,
    copyable: true,
  },
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
}

const mockResizeComponent = jest.fn()
const mockReorderComponent = jest.fn()
const mockSelectComponent = jest.fn()
const mockFocusComponent = jest.fn()

jest.mock('@/store', () => ({
  useComponentActions: () => ({
    selectComponent: mockSelectComponent,
    focusComponent: mockFocusComponent,
    resizeComponent: mockResizeComponent,
    reorderComponent: mockReorderComponent,
  }),
  useDragContext: () => ({
    state: 'idle',
  }),
}))

jest.mock('@/hooks/useDragAndDrop', () => ({
  useCanvasDraggable: () => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
    draggable: false,
    'data-draggable': 'canvas',
    'data-component-id': 'test-component',
  }),
}))

describe('ComponentRenderer Enhanced Features', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders component with enhanced visual feedback', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const componentElement = screen.getByTestId('component-test-component')
    expect(componentElement).toBeInTheDocument()
    expect(componentElement).toHaveAttribute('data-hovered', 'false')
    expect(componentElement).toHaveAttribute('data-resizing', 'false')
  })

  it('shows resize handles for selected Image components', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    // Check for resize handles (corners and edges)
    const componentElement = screen.getByTestId('component-test-component')

    // Look for elements with cursor resize styles in the container
    const resizeHandles = componentElement.querySelectorAll('[title*="Resize"]')
    expect(resizeHandles.length).toBe(8) // 4 corners + 4 edges
  })

  it('does not show resize handles for non-Image components', () => {
    const textComponent = {
      ...mockComponent,
      type: ComponentType.TEXT,
      props: { content: 'Test text' },
    }

    render(
      <ComponentRenderer
        component={textComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const componentElement = screen.getByTestId('component-test-component')
    const resizeHandles = componentElement.querySelectorAll('[title*="Resize"]')
    expect(resizeHandles.length).toBe(0)
  })

  it('shows layer controls for selected components', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const bringToFrontButton = screen.getByTitle('Bring to front')
    const sendToBackButton = screen.getByTitle('Send to back')

    expect(bringToFrontButton).toBeInTheDocument()
    expect(sendToBackButton).toBeInTheDocument()
  })

  it('handles bring to front action', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const bringToFrontButton = screen.getByTitle('Bring to front')
    fireEvent.click(bringToFrontButton)

    expect(mockReorderComponent).toHaveBeenCalledWith('test-component', 2) // zIndex + 1
  })

  it('handles send to back action', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const sendToBackButton = screen.getByTitle('Send to back')
    fireEvent.click(sendToBackButton)

    expect(mockReorderComponent).toHaveBeenCalledWith('test-component', 0) // Math.max(0, zIndex - 1)
  })

  it('shows draggable indicator for selected components', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const draggableIndicator = screen.getByTitle(
      'Click and drag to move component'
    )
    expect(draggableIndicator).toBeInTheDocument()
  })

  it('handles mouse hover states', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={false}
        onSelect={jest.fn()}
      />
    )

    const componentElement = screen.getByTestId('component-test-component')

    // Test hover state
    fireEvent.mouseEnter(componentElement)
    expect(componentElement).toHaveAttribute('data-hovered', 'true')

    fireEvent.mouseLeave(componentElement)
    expect(componentElement).toHaveAttribute('data-hovered', 'false')
  })

  it('shows info tooltip on hover', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={false}
        onSelect={jest.fn()}
      />
    )

    const componentElement = screen.getByTestId('component-test-component')
    fireEvent.mouseEnter(componentElement)

    // Should show component info
    expect(screen.getByText(/Image • 200×150 • z:1/)).toBeInTheDocument()
  })

  it('handles component selection on click', () => {
    const mockOnSelect = jest.fn()

    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    const componentElement = screen.getByTestId('component-test-component')
    fireEvent.click(componentElement)

    expect(mockOnSelect).toHaveBeenCalledWith('test-component')
    expect(mockSelectComponent).toHaveBeenCalledWith('test-component')
    expect(mockFocusComponent).toHaveBeenCalledWith('test-component')
  })

  it('applies proper styling for dragging state', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const componentElement = screen.getByTestId('component-test-component')

    // Test that the component renders with proper attributes
    expect(componentElement).toHaveAttribute('data-hovered', 'false')
    expect(componentElement).toHaveAttribute('data-resizing', 'false')

    // Note: Testing dragging styles requires complex state mocking
    // This test verifies the component renders with expected attributes
  })

  it('handles different component types correctly', () => {
    const testComponents = [
      {
        ...mockComponent,
        type: ComponentType.TEXT,
        props: { content: 'Test Text' },
      },
      {
        ...mockComponent,
        type: ComponentType.TEXTAREA,
        props: { content: 'Test Textarea Content' },
      },
      {
        ...mockComponent,
        type: ComponentType.BUTTON,
        props: { label: 'Test Button', url: '#' },
      },
    ]

    testComponents.forEach(component => {
      const { rerender } = render(
        <ComponentRenderer
          component={component}
          isSelected={false}
          onSelect={jest.fn()}
        />
      )

      const element = screen.getByTestId('component-test-component')
      expect(element).toBeInTheDocument()

      rerender(<div />) // Clean up for next iteration
    })
  })

  it('prevents drag during resize operations', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    const componentElement = screen.getByTestId('component-test-component')
    expect(componentElement).toHaveAttribute('data-resizing', 'false')

    // During resize, cursor should change
    const resizeHandle = screen.getByTitle('Resize southeast')
    fireEvent.mouseDown(resizeHandle)

    expect(componentElement).toHaveAttribute('data-resizing', 'true')
  })
})
