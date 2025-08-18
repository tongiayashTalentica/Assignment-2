import {
  ComponentFactory,
  getDefaultProperties,
} from '@/utils/componentFactory'
import { ComponentType } from '@/types'

describe('ComponentFactory', () => {
  test('creates text component with defaults', () => {
    const c = ComponentFactory.create(ComponentType.TEXT, { x: 10, y: 20 })
    expect(c.type).toBe(ComponentType.TEXT)
    expect(c.position).toEqual({ x: 10, y: 20 })
    expect(c.dimensions.width).toBeGreaterThan(0)
    const p = c.props as any
    expect(p.kind).toBe('text')
    expect(p.fontSize).toBe(16)
  })

  test('creates textarea, image, and button with defaults', () => {
    const ta = ComponentFactory.create(ComponentType.TEXTAREA, { x: 0, y: 0 })
    const img = ComponentFactory.create(ComponentType.IMAGE, { x: 0, y: 0 })
    const btn = ComponentFactory.create(ComponentType.BUTTON, { x: 0, y: 0 })
    expect((ta.props as any).kind).toBe('textarea')
    expect((img.props as any).kind).toBe('image')
    expect((btn.props as any).kind).toBe('button')
  })

  test('getDefaultProperties returns type-specific defaults', () => {
    expect((getDefaultProperties(ComponentType.TEXT) as any).kind).toBe('text')
    expect((getDefaultProperties(ComponentType.TEXTAREA) as any).kind).toBe(
      'textarea'
    )
    expect((getDefaultProperties(ComponentType.IMAGE) as any).kind).toBe(
      'image'
    )
    expect((getDefaultProperties(ComponentType.BUTTON) as any).kind).toBe(
      'button'
    )
  })

  test('validation: text font size and color rules', () => {
    const base = ComponentFactory.create(ComponentType.TEXT, { x: 0, y: 0 })
    const invalid = {
      ...base,
      props: { ...(base.props as any), fontSize: 100, color: '#GGGGGG' },
    }
    const result = ComponentFactory.validateComponent(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field.includes('fontSize'))).toBe(true)
    expect(result.errors.some(e => e.field.includes('color'))).toBe(true)
  })

  test('validation: image url and radius', () => {
    const base = ComponentFactory.create(ComponentType.IMAGE, { x: 0, y: 0 })
    const invalid = {
      ...base,
      props: { ...(base.props as any), src: 'not-a-url', borderRadius: 60 },
    }
    const result = ComponentFactory.validateComponent(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.find(e => e.field.includes('src'))).toBeTruthy()
    expect(
      result.errors.find(e => e.field.includes('borderRadius'))
    ).toBeTruthy()
  })

  test('validation: button url and colors', () => {
    const base = ComponentFactory.create(ComponentType.BUTTON, { x: 0, y: 0 })
    const invalid = {
      ...base,
      props: {
        ...(base.props as any),
        url: 'invalid',
        backgroundColor: '#xyzxyz',
        textColor: '#000000',
      },
    }
    const result = ComponentFactory.validateComponent(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.find(e => e.field.includes('url'))).toBeTruthy()
    expect(result.errors.find(e => e.field.includes('colors'))).toBeTruthy()
  })
})
