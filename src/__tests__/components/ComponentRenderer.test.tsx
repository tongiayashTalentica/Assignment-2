import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentRenderer } from '@/components/ui/ComponentRenderer'
import { ComponentType, BaseComponent } from '@/types'

// Mock store hooks
jest.mock('@/store/simple', () => ({
  useComponentActions: () => ({
    selectComponent: jest.fn(),
    focusComponent: jest.fn(),
  }),
  useDragContext: () => ({
    state: 'idle',
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
  }),
}))

// Mock drag hook
jest.mock('@/hooks/useDragAndDrop', () => ({
  useCanvasDraggable: () => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
    'data-draggable': 'canvas',
    'data-component-id': 'test-id',
  }),
}))

describe('ComponentRenderer', () => {
  const mockComponent: BaseComponent = {
    id: 'test-component',
    type: ComponentType.TEXT,
    position: { x: 100, y: 100 },
    dimensions: { width: 200, height: 50 },
    props: { content: 'Test text' },
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

  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders text component correctly', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Test text')).toBeInTheDocument()
  })

  it('renders button component correctly', () => {
    const buttonComponent = {
      ...mockComponent,
      type: ComponentType.BUTTON,
      props: { label: 'Click me' },
    }

    render(
      <ComponentRenderer
        component={buttonComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders image component correctly', () => {
    const imageComponent = {
      ...mockComponent,
      type: ComponentType.IMAGE,
      props: { src: 'test.jpg', alt: 'Test image' },
    }

    render(
      <ComponentRenderer
        component={imageComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByAltText('Test image')).toBeInTheDocument()
  })

  it('renders textarea component correctly', () => {
    const textareaComponent = {
      ...mockComponent,
      type: ComponentType.TEXTAREA,
      props: { content: 'Textarea content', placeholder: 'Enter text' },
    }

    render(
      <ComponentRenderer
        component={textareaComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Textarea content')).toBeInTheDocument()
  })

  it('handles selection on click', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    fireEvent.click(screen.getByText('Test text'))
    expect(mockOnSelect).toHaveBeenCalledWith('test-component')
  })

  it('shows selection indicator when selected', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    )

    expect(
      screen.getByTitle('Click and drag to move component')
    ).toBeInTheDocument()
  })

  it('applies correct positioning and dimensions', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    const element = screen.getByTestId('component-test-component')
    expect(element).toHaveStyle({
      position: 'absolute',
      left: '100px',
      top: '100px',
      width: '200px',
      height: '50px',
    })
  })

  it('handles drag attributes correctly', () => {
    render(
      <ComponentRenderer
        component={mockComponent}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    const element = screen.getByTestId('component-test-component')
    expect(element).toHaveAttribute('data-draggable', 'canvas')
  })
})
