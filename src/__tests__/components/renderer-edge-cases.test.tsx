import React from 'react'
import { render, screen } from '@testing-library/react'
import { ComponentRenderer } from '@/components/ui/ComponentRenderer'
import { BaseComponent, ComponentType } from '@/types'

const base = (over: Partial<BaseComponent>): BaseComponent => ({
  id: 'x',
  type: ComponentType.TEXT,
  position: { x: 0, y: 0 },
  dimensions: { width: 100, height: 40 },
  zIndex: 1,
  props: {},
  ...over,
})

describe('ComponentRenderer edge cases', () => {
  test('TextArea uses textAlign style', () => {
    render(
      <ComponentRenderer
        component={base({
          type: ComponentType.TEXTAREA,
          props: {
            textAlign: 'right',
            fontSize: 16,
            color: '#000',
            content: 'a',
          } as any,
        })}
        isSelected={false}
        onSelect={() => {}}
      />
    )
    const node = screen.getByTestId('component-x') as HTMLElement
    expect(node.style.textAlign).toBe('right')
  })

  test('Button applies padding and colors', () => {
    render(
      <ComponentRenderer
        component={base({
          type: ComponentType.BUTTON,
          props: {
            label: 'L',
            padding: 10,
            backgroundColor: '#111111',
            textColor: '#ffffff',
            fontSize: 16,
            borderRadius: 0,
            url: 'https://e.com',
          } as any,
        })}
        isSelected={true}
        onSelect={() => {}}
      />
    )
    const node = screen.getByTestId('component-x') as HTMLElement
    expect(node.style.padding).toBe('10px')
    expect(node.style.background).toBe('rgb(17, 17, 17)')
    expect(node.style.outline).toContain('2px')
  })

  test('Image renders with alt attribute', () => {
    render(
      <ComponentRenderer
        component={base({
          type: ComponentType.IMAGE,
          props: {
            src: 'https://via.placeholder.com/100',
            alt: 'alt',
            objectFit: 'cover',
            borderRadius: 0,
          } as any,
        })}
        isSelected={false}
        onSelect={() => {}}
      />
    )
    const img = screen.getByRole('img') as HTMLImageElement
    expect(img.getAttribute('alt')).toBe('alt')
  })
})
