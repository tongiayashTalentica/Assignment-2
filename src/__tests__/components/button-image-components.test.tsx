import React from 'react'
import { render, screen } from '@testing-library/react'
import { CanvasPanel } from '@/components/layout/CanvasPanel'
// Imports removed - not used in this test

// Mock store (create components after imports to avoid hoisting)
jest.mock('@/store/simple', () => {
  const mockStore = new Map()
  // Use string types to avoid circular dependency during Jest hoisting
  const imgComponent = {
    id: 'test-img',
    type: 'image', // Use lowercase to match ComponentType.IMAGE enum value
    position: { x: 0, y: 0 },
    dimensions: { width: 200, height: 100 },
    props: { src: 'placeholder.jpg', alt: 'Test' },
    zIndex: 1,
    constraints: {},
    metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
  }
  const btnComponent = {
    id: 'test-btn',
    type: 'button', // Use lowercase to match ComponentType.BUTTON enum value
    position: { x: 0, y: 0 },
    dimensions: { width: 100, height: 40 },
    props: { label: 'Click Me' },
    zIndex: 1,
    constraints: {},
    metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
  }
  mockStore.set(imgComponent.id, imgComponent)
  mockStore.set(btnComponent.id, btnComponent)

  return {
    useComponents: jest.fn(() => mockStore),
    useSelectedComponents: jest.fn(() => []),
    useComponentActions: jest.fn(() => ({
      selectComponent: jest.fn(),
      clearSelection: jest.fn(),
      removeComponent: jest.fn(),
      focusComponent: jest.fn(),
    })),
    useDragContext: jest.fn(() => ({
      state: 'idle',
      draggedComponent: null,
    })),
  }
})

// Mock the drag hooks
jest.mock('@/hooks/useDragAndDrop', () => ({
  useDropTarget: jest.fn(() => ({})),
  useCanvasDraggable: jest.fn(() => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
  })),
}))

describe('Image and Button Rendering', () => {
  test('renders image with src and alt', () => {
    render(<CanvasPanel />)
    const image = screen.getByRole('img') as HTMLImageElement
    expect(image).toBeInTheDocument()
    expect(image.src).toContain('placeholder')
  })

  test('renders button label', () => {
    render(<CanvasPanel />)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })
})
