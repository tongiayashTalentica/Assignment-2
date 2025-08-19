import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock the CSS import
jest.mock('@/styles/globals.css', () => ({}))

import App from '@/App'

// Mock the store to avoid complex dependencies
jest.mock('@/store', () => ({
  useLayout: jest.fn(() => ({
    leftPanelWidth: 20,
    centerPanelWidth: 60,
    rightPanelWidth: 20,
  })),
  useComponents: jest.fn(() => new Map()),
  useSelectedComponents: jest.fn(() => []),
  useFocusedComponent: jest.fn(() => null),
  useAppState: jest.fn(() => ({
    isLoading: false,
    error: null,
  })),
  useAppActions: jest.fn(() => ({
    setLoading: jest.fn(),
    setError: jest.fn(),
    updateLayout: jest.fn(),
  })),
  useComponentActions: jest.fn(() => ({
    addComponent: jest.fn(),
    removeComponent: jest.fn(),
    updateComponent: jest.fn(),
    duplicateComponent: jest.fn(),
    selectComponent: jest.fn(),
    deselectComponent: jest.fn(),
    clearSelection: jest.fn(),
    focusComponent: jest.fn(),
    moveComponent: jest.fn(),
    resizeComponent: jest.fn(),
    reorderComponent: jest.fn(),
  })),
  useDragContext: jest.fn(() => ({
    state: 'idle',
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    isDragValid: false,
    dragStartPosition: { x: 0, y: 0 },
    performanceData: null,
  })),
  useCanvas: jest.fn(() => ({
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
    grid: { snapToGrid: false, size: 20 },
    dimensions: { width: 1200, height: 800 },
    zoom: 1,
    canUndo: false,
    canRedo: false,
  })),
  useCanvasActions: jest.fn(() => ({
    setZoom: jest.fn(),
    updateGrid: jest.fn(),
    updateCanvasDimensions: jest.fn(),
    updateViewport: jest.fn(),
    setBoundaries: jest.fn(),
  })),
  useUIActions: jest.fn(() => ({
    startDrag: jest.fn(),
    updateDrag: jest.fn(),
    endDrag: jest.fn(),
  })),
}))

describe('App Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />)

    // Verify the app renders
    expect(container).toBeTruthy()
    expect(container.firstChild).toBeTruthy()
  })

  it('should render the MainLayout component', () => {
    render(<App />)

    // Check for main layout elements
    const title = screen.getByText('Aura No-Code Editor')
    expect(title).toBeTruthy()
    expect(title.textContent).toBe('Aura No-Code Editor')
  })

  it('should render all three panels', () => {
    render(<App />)

    // Check for panel titles
    expect(screen.getByText('Components')).toBeTruthy()
    expect(screen.getByText('Canvas')).toBeTruthy()
    expect(screen.getByText('Properties')).toBeTruthy()
  })

  it('should render placeholder content in panels', () => {
    render(<App />)

    // Check for placeholder content
    expect(
      screen.getByText('Drag components to canvas or double-click to add')
    ).toBeTruthy()
    expect(screen.getByText('Design Canvas')).toBeTruthy()
    expect(screen.getByText('Component properties will be here')).toBeTruthy()
  })

  it('should render instructional text', () => {
    render(<App />)

    // Check for instructional text
    expect(
      screen.getByText('Drag components to canvas or double-click to add')
    ).toBeTruthy()
    expect(
      screen.getByText('Drop components here to start building your design')
    ).toBeTruthy()
    expect(
      screen.getByText('Select a component to view and edit its properties')
    ).toBeTruthy()
  })

  it('should apply CSS classes correctly', () => {
    render(<App />)

    const title = screen.getByText('Aura No-Code Editor')
    expect(title.className).toContain('title')
  })

  it('should have proper document structure', () => {
    render(<App />)

    // Check for main layout structure
    const mainLayout = document.querySelector('.mainLayout')
    const header = document.querySelector('.header')
    const content = document.querySelector('.content')

    expect(mainLayout).toBeTruthy()
    expect(header).toBeTruthy()
    expect(content).toBeTruthy()
  })

  it('should render with proper panel layout', () => {
    const { container } = render(<App />)

    // Check that all panels are rendered
    const panels = container.querySelectorAll('.panel')
    expect(panels.length).toBe(3)
  })
})
