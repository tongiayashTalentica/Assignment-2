import React from 'react'
import { render, screen } from '@testing-library/react'
import { ComponentPreview } from '@/components/ui/ComponentPreview'
import { ComponentType } from '@/types'

describe('ComponentPreview', () => {
  describe('Text Component Preview', () => {
    test('renders text preview with correct icon', () => {
      render(<ComponentPreview type={ComponentType.TEXT} />)

      const preview = screen.getByText('Aa')
      expect(preview).toBeInTheDocument()
      expect(preview).toHaveStyle({
        color: '#374151',
        fontWeight: 500,
      })
    })

    test('renders with correct size styles', () => {
      const { rerender } = render(
        <ComponentPreview type={ComponentType.TEXT} size="small" />
      )

      let container = screen.getByText('Aa').parentElement
      expect(container).toHaveStyle({
        width: '32px',
        height: '24px',
        fontSize: '10px',
      })

      rerender(<ComponentPreview type={ComponentType.TEXT} size="medium" />)
      container = screen.getByText('Aa').parentElement
      expect(container).toHaveStyle({
        width: '48px',
        height: '36px',
        fontSize: '12px',
      })

      rerender(<ComponentPreview type={ComponentType.TEXT} size="large" />)
      container = screen.getByText('Aa').parentElement
      expect(container).toHaveStyle({
        width: '64px',
        height: '48px',
        fontSize: '14px',
      })
    })
  })

  describe('TextArea Component Preview', () => {
    test('renders textarea preview with line elements', () => {
      render(<ComponentPreview type={ComponentType.TEXTAREA} />)

      // Find the container with textarea preview styling
      const container = document.querySelector(
        'div[style*="flex-direction: column"]'
      )
      expect(container).toBeInTheDocument()

      const lines = container?.querySelectorAll('div[style*="height: 2px"]')
      expect(lines).toHaveLength(3) // Three horizontal lines

      expect(container).toHaveStyle({
        flexDirection: 'column',
        gap: '2px',
        padding: '3px',
      })
    })

    test('lines have correct styling', () => {
      render(<ComponentPreview type={ComponentType.TEXTAREA} />)

      const container = document.querySelector(
        'div[style*="flex-direction: column"]'
      )
      const lines = container?.querySelectorAll('div[style*="height: 2px"]')

      expect(lines).toHaveLength(3)

      lines?.forEach((line: Element) => {
        const htmlLine = line as HTMLElement
        expect(htmlLine).toHaveStyle({
          height: '2px',
          borderRadius: '1px',
        })
      })

      // Check different widths
      if (lines && lines.length >= 3) {
        expect(lines[0]).toHaveStyle({ width: '90%' })
        expect(lines[1]).toHaveStyle({ width: '70%' })
        expect(lines[2]).toHaveStyle({ width: '85%' })
      }
    })
  })

  describe('Image Component Preview', () => {
    test('renders image preview with SVG icon', () => {
      render(<ComponentPreview type={ComponentType.IMAGE} />)

      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '16')
      expect(svg).toHaveAttribute('height', '16')
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('stroke', '#6b7280')
    })

    test('SVG has correct path elements', () => {
      render(<ComponentPreview type={ComponentType.IMAGE} />)

      const svg = document.querySelector('svg')
      const rect = svg?.querySelector('rect')
      const circle = svg?.querySelector('circle')
      const polyline = svg?.querySelector('polyline')

      expect(rect).toBeInTheDocument()
      expect(circle).toBeInTheDocument()
      expect(polyline).toBeInTheDocument()

      // Check some key attributes
      expect(rect).toHaveAttribute('x', '3')
      expect(rect).toHaveAttribute('y', '3')
      expect(rect).toHaveAttribute('width', '18')
      expect(rect).toHaveAttribute('height', '18')
    })
  })

  describe('Button Component Preview', () => {
    test('renders button preview with correct styling', () => {
      render(<ComponentPreview type={ComponentType.BUTTON} />)

      const buttonPreview = screen.getByText('Btn')
      expect(buttonPreview).toBeInTheDocument()

      expect(buttonPreview).toHaveStyle({
        backgroundColor: 'rgb(31, 41, 55)',
        color: 'rgb(255, 255, 255)',
        borderRadius: '4px',
        fontWeight: '500',
      })
    })

    test('button text is centered', () => {
      render(<ComponentPreview type={ComponentType.BUTTON} />)

      const buttonElement = screen.getByText('Btn')
      expect(buttonElement).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })
    })
  })

  describe('Unknown Component Type', () => {
    test('renders fallback preview for unknown type', () => {
      // Cast to ComponentType to test fallback
      const unknownType = 'unknown' as ComponentType
      render(<ComponentPreview type={unknownType} />)

      const fallback = screen.getByText('?')
      expect(fallback).toBeInTheDocument()
      expect(fallback).toHaveStyle({ color: '#6b7280' })
    })
  })

  describe('Custom Class Names', () => {
    test('applies custom className', () => {
      render(
        <ComponentPreview type={ComponentType.TEXT} className="custom-class" />
      )

      const container = screen.getByText('Aa').closest('.custom-class')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('custom-class')
    })

    test('works without className', () => {
      render(<ComponentPreview type={ComponentType.TEXT} />)

      const preview = screen.getByText('Aa')
      expect(preview).toBeInTheDocument()
    })
  })

  describe('All Component Types', () => {
    test.each([
      [ComponentType.TEXT, 'Aa'],
      [ComponentType.BUTTON, 'Btn'],
    ])('renders %s component with correct content', (type, expectedContent) => {
      render(<ComponentPreview type={type} />)
      expect(screen.getByText(expectedContent)).toBeInTheDocument()
    })

    test('all previews have consistent base styles', () => {
      const types = [
        ComponentType.TEXT,
        ComponentType.TEXTAREA,
        ComponentType.IMAGE,
        ComponentType.BUTTON,
      ]

      types.forEach(type => {
        const { unmount } = render(<ComponentPreview type={type} />)

        // Find the outermost container
        const containers = document.querySelectorAll(
          '[style*="border: 1px solid #e5e7eb"]'
        )
        const container = containers[containers.length - 1] as HTMLElement

        expect(container).toHaveStyle({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: '#f9fafb',
        })

        unmount()
      })
    })
  })

  describe('Size Configurations', () => {
    test('all sizes have correct dimensions', () => {
      const sizes = [
        { size: 'small' as const, width: 32, height: 24, fontSize: 10 },
        { size: 'medium' as const, width: 48, height: 36, fontSize: 12 },
        { size: 'large' as const, width: 64, height: 48, fontSize: 14 },
      ]

      sizes.forEach(({ size, width, height, fontSize }) => {
        const { unmount } = render(
          <ComponentPreview type={ComponentType.TEXT} size={size} />
        )

        const container = screen.getByText('Aa').parentElement
        expect(container).toHaveStyle({
          width: `${width}px`,
          height: `${height}px`,
          fontSize: `${fontSize}px`,
        })

        unmount()
      })
    })

    test('defaults to medium size', () => {
      render(<ComponentPreview type={ComponentType.TEXT} />)

      const container = screen.getByText('Aa').parentElement
      expect(container).toHaveStyle({
        width: '48px',
        height: '36px',
        fontSize: '12px',
      })
    })
  })

  describe('Visual Consistency', () => {
    test('all previews use system font family', () => {
      render(<ComponentPreview type={ComponentType.TEXT} />)

      const container = screen.getByText('Aa').parentElement
      expect(container).toHaveStyle({
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
    })

    test('all previews have consistent border and background', () => {
      const types = [
        ComponentType.TEXT,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]

      types.forEach(type => {
        const { unmount } = render(<ComponentPreview type={type} />)

        const containers = document.querySelectorAll(
          '[style*="border: 1px solid #e5e7eb"]'
        )
        const container = containers[containers.length - 1] as HTMLElement

        expect(container).toHaveStyle({
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: '#f9fafb',
        })

        unmount()
      })
    })
  })
})
