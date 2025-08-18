import { ComponentFactory, validateProperties } from '@/utils/componentFactory'
import { ComponentType } from '@/types'

describe('Factory validation boundary values', () => {
  test('Text fontSize at boundaries 8 and 72 valid', () => {
    const base = ComponentFactory.create(ComponentType.TEXT, { x: 0, y: 0 })
    let r = validateProperties(ComponentType.TEXT, {
      ...(base.props as any),
      fontSize: 8,
    })
    expect(r.isValid).toBe(true)
    r = validateProperties(ComponentType.TEXT, {
      ...(base.props as any),
      fontSize: 72,
    })
    expect(r.isValid).toBe(true)
  })

  test('Button borderRadius 0 and 50 valid, 51 invalid', () => {
    const base = ComponentFactory.create(ComponentType.BUTTON, { x: 0, y: 0 })
    let r = validateProperties(ComponentType.BUTTON, {
      ...(base.props as any),
      borderRadius: 0,
    })
    expect(r.isValid).toBe(true)
    r = validateProperties(ComponentType.BUTTON, {
      ...(base.props as any),
      borderRadius: 50,
    })
    expect(r.isValid).toBe(true)
    r = validateProperties(ComponentType.BUTTON, {
      ...(base.props as any),
      borderRadius: 51,
    })
    expect(r.isValid).toBe(false)
  })

  test('Reject shorthand hex colors for Text (#fff)', () => {
    const base = ComponentFactory.create(ComponentType.TEXT, { x: 0, y: 0 })
    const r = validateProperties(ComponentType.TEXT, {
      ...(base.props as any),
      color: '#fff',
    })
    expect(r.isValid).toBe(false)
  })
})
