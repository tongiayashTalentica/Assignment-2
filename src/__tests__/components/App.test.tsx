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
  useComponents: jest.fn(() => []),
  useAppState: jest.fn(() => ({
    isLoading: false,
    error: null,
  })),
  useAppActions: jest.fn(() => ({
    setLoading: jest.fn(),
    setError: jest.fn(),
    updateLayout: jest.fn(),
    addComponent: jest.fn(),
    removeComponent: jest.fn(),
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
    expect(screen.getByText('Component palette will be here')).toBeTruthy()
    expect(screen.getByText('Design Canvas')).toBeTruthy()
    expect(screen.getByText('Component properties will be here')).toBeTruthy()
  })

  it('should render instructional text', () => {
    render(<App />)
    
    // Check for instructional text
    expect(screen.getByText('Drag and drop components from here to the canvas')).toBeTruthy()
    expect(screen.getByText('Drop components here to start building your design')).toBeTruthy()
    expect(screen.getByText('Select a component to view and edit its properties')).toBeTruthy()
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