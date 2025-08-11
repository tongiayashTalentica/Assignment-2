import { describe, it, expect } from '@jest/globals'

describe('Environment Setup', () => {
  it('should have Node.js environment available', () => {
    expect(typeof process).toBe('object')
    expect(process.env).toBeDefined()
  })

  it('should have proper Jest environment configured', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })

  it('should have JSDOM environment for React testing', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
    expect(document.createElement).toBeDefined()
  })

  it('should support ES modules', () => {
    // Test that ES module syntax works
    const testModule = { test: 'value' }
    expect(testModule).toEqual({ test: 'value' })
  })

  it('should have proper TypeScript support', () => {
    // Test TypeScript features work
    interface TestInterface {
      value: string
    }
    
    const testObj: TestInterface = { value: 'test' }
    expect(testObj.value).toBe('test')
  })

  it('should have testing utilities available', () => {
    // Verify testing library setup
    expect(typeof global).toBe('object')
    expect(global.ResizeObserver).toBeDefined()
  })

  it('should have proper mock functions available', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('should support async/await in tests', async () => {
    const asyncFunction = async () => {
      return Promise.resolve('test')
    }
    
    const result = await asyncFunction()
    expect(result).toBe('test')
  })

  it('should have proper error handling', () => {
    expect(() => {
      throw new Error('Test error')
    }).toThrow('Test error')
  })

  it('should support modern JavaScript features', () => {
    // Test modern JS features
    const arr = [1, 2, 3]
    const doubled = arr.map(x => x * 2)
    expect(doubled).toEqual([2, 4, 6])
    
    const obj = { a: 1, b: 2 }
    const { a, ...rest } = obj
    expect(a).toBe(1)
    expect(rest).toEqual({ b: 2 })
  })
}) 