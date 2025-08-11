import { describe, it, expect, beforeEach } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useAppStore, useLayout, useComponents, useAppState, useAppActions } from '@/store'
import type { BaseComponent, LayoutConfig } from '@/types'

// Mock zustand persist and devtools to avoid localStorage issues
jest.mock('zustand/middleware', () => ({
  devtools: (fn: any) => fn,
  persist: (fn: any) => fn,
}))

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAppStore())
    act(() => {
      // Reset to initial state
      result.current.setLoading(false)
      result.current.setError(null)
      result.current.updateLayout({
        leftPanelWidth: 20,
        centerPanelWidth: 60,
        rightPanelWidth: 20,
      })
      // Clear all components
      result.current.components.forEach(comp => {
        result.current.removeComponent(comp.id)
      })
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAppStore())
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.layout).toEqual({
        leftPanelWidth: 20,
        centerPanelWidth: 60,
        rightPanelWidth: 20,
      })
      expect(result.current.components).toEqual([])
    })
  })

  describe('Loading State Management', () => {
    it('should set loading state to true', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
    })

    it('should set loading state to false', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setLoading(true)
        result.current.setLoading(false)
      })
      
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Error State Management', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAppStore())
      const errorMessage = 'Test error message'
      
      act(() => {
        result.current.setError(errorMessage)
      })
      
      expect(result.current.error).toBe(errorMessage)
    })

    it('should clear error message', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setError('Error')
        result.current.setError(null)
      })
      
      expect(result.current.error).toBe(null)
    })
  })

  describe('Layout Management', () => {
    it('should update layout partially', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.updateLayout({ leftPanelWidth: 25 })
      })
      
      expect(result.current.layout).toEqual({
        leftPanelWidth: 25,
        centerPanelWidth: 60,
        rightPanelWidth: 20,
      })
    })

    it('should update multiple layout properties', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.updateLayout({
          leftPanelWidth: 30,
          rightPanelWidth: 25,
        })
      })
      
      expect(result.current.layout).toEqual({
        leftPanelWidth: 30,
        centerPanelWidth: 60,
        rightPanelWidth: 25,
      })
    })

    it('should update entire layout', () => {
      const { result } = renderHook(() => useAppStore())
      const newLayout: LayoutConfig = {
        leftPanelWidth: 15,
        centerPanelWidth: 70,
        rightPanelWidth: 15,
      }
      
      act(() => {
        result.current.updateLayout(newLayout)
      })
      
      expect(result.current.layout).toEqual(newLayout)
    })
  })

  describe('Component Management', () => {
    const testComponent: BaseComponent = {
      id: 'test-component-1',
      type: 'button',
      props: { text: 'Test Button', color: 'blue' },
    }

    it('should add a component', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.addComponent(testComponent)
      })
      
      expect(result.current.components).toHaveLength(1)
      expect(result.current.components[0]).toEqual(testComponent)
    })

    it('should add multiple components', () => {
      const { result } = renderHook(() => useAppStore())
      const component2: BaseComponent = {
        id: 'test-component-2',
        type: 'text',
        props: { content: 'Hello World' },
      }
      
      act(() => {
        result.current.addComponent(testComponent)
        result.current.addComponent(component2)
      })
      
      expect(result.current.components).toHaveLength(2)
      expect(result.current.components).toContainEqual(testComponent)
      expect(result.current.components).toContainEqual(component2)
    })

    it('should remove a component by id', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.addComponent(testComponent)
        result.current.removeComponent(testComponent.id)
      })
      
      expect(result.current.components).toHaveLength(0)
    })

    it('should remove specific component from multiple components', () => {
      const { result } = renderHook(() => useAppStore())
      const component2: BaseComponent = {
        id: 'test-component-2',
        type: 'text',
        props: { content: 'Hello World' },
      }
      
      act(() => {
        result.current.addComponent(testComponent)
        result.current.addComponent(component2)
        result.current.removeComponent(testComponent.id)
      })
      
      expect(result.current.components).toHaveLength(1)
      expect(result.current.components[0]).toEqual(component2)
    })

    it('should not remove non-existent component', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.addComponent(testComponent)
        result.current.removeComponent('non-existent-id')
      })
      
      expect(result.current.components).toHaveLength(1)
      expect(result.current.components[0]).toEqual(testComponent)
    })
  })

  describe('Store Selectors', () => {
    it('should select layout correctly', () => {
      const { result } = renderHook(() => useLayout())
      
      expect(result.current).toEqual({
        leftPanelWidth: 20,
        centerPanelWidth: 60,
        rightPanelWidth: 20,
      })
    })

    it('should select components correctly', () => {
      const { result: storeResult } = renderHook(() => useAppStore())
      const { result: componentsResult } = renderHook(() => useComponents())
      const testComponent: BaseComponent = {
        id: 'test-1',
        type: 'button',
        props: {},
      }
      
      act(() => {
        storeResult.current.addComponent(testComponent)
      })
      
      expect(componentsResult.current).toHaveLength(1)
      expect(componentsResult.current[0]).toEqual(testComponent)
    })

    it('should select app state correctly', () => {
      const { result: storeResult } = renderHook(() => useAppStore())
      const { result: appStateResult } = renderHook(() => useAppState())
      
      act(() => {
        storeResult.current.setLoading(true)
        storeResult.current.setError('Test error')
      })
      
      expect(appStateResult.current).toEqual({
        isLoading: true,
        error: 'Test error',
      })
    })

    it('should select app actions correctly', () => {
      const { result } = renderHook(() => useAppActions())
      
      expect(typeof result.current.setLoading).toBe('function')
      expect(typeof result.current.setError).toBe('function')
      expect(typeof result.current.updateLayout).toBe('function')
      expect(typeof result.current.addComponent).toBe('function')
      expect(typeof result.current.removeComponent).toBe('function')
    })
  })

  describe('Complex State Updates', () => {
    it('should handle multiple state updates in sequence', () => {
      const { result } = renderHook(() => useAppStore())
      const component: BaseComponent = {
        id: 'complex-test',
        type: 'div',
        props: { className: 'test' },
      }
      
      act(() => {
        result.current.setLoading(true)
        result.current.updateLayout({ leftPanelWidth: 35 })
        result.current.addComponent(component)
        result.current.setError('Processing...')
        result.current.setLoading(false)
        result.current.setError(null)
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.layout.leftPanelWidth).toBe(35)
      expect(result.current.components).toHaveLength(1)
      expect(result.current.components[0]).toEqual(component)
    })
  })
}) 