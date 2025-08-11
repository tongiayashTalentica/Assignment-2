import { describe, it, expect } from '@jest/globals'

describe('Basic Setup Test', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should support TypeScript', () => {
    const message: string = 'Hello, TypeScript!'
    expect(message).toBe('Hello, TypeScript!')
  })

  it('should have Jest globals available', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })
}) 