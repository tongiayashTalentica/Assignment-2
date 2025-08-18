import { validateProperties } from '@/utils/componentFactory'
import { ComponentType } from '@/types'

describe('Property Validation Rules', () => {
  test('text: invalid font size and color', () => {
    const result = validateProperties(ComponentType.TEXT, {
      kind: 'text',
      content: 'A',
      fontSize: 100,
      fontWeight: 400,
      color: '#GGGGGG',
    } as any)
    expect(result.isValid).toBe(false)
  })

  test('textarea: invalid hex and align', () => {
    const result = validateProperties(ComponentType.TEXTAREA, {
      kind: 'textarea',
      content: 'multi',
      fontSize: 7,
      color: 'red',
      textAlign: 'justify',
    } as any)
    expect(result.isValid).toBe(false)
  })

  test('image: invalid url and radius', () => {
    const result = validateProperties(ComponentType.IMAGE, {
      kind: 'image',
      src: 'not-url',
      alt: 'x',
      objectFit: 'cover',
      borderRadius: 55,
    } as any)
    expect(result.isValid).toBe(false)
  })

  test('button: invalid url and colors', () => {
    const result = validateProperties(ComponentType.BUTTON, {
      kind: 'button',
      url: 'missing-scheme',
      label: 'Go',
      fontSize: 6,
      padding: 12,
      backgroundColor: '#nothex',
      textColor: '#000000',
      borderRadius: 51,
    } as any)
    expect(result.isValid).toBe(false)
  })
})
