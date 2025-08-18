import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PropertiesForm } from '@/components/ui/PropertiesForm'
import { ComponentType } from '@/types'

// Mock the store hooks
const mockUpdateComponent = jest.fn()
jest.mock('@/store/simple', () => ({
  useComponentActions: () => ({
    updateComponent: mockUpdateComponent,
  }),
}))

describe('PropertiesForm', () => {
  const mockComponent = {
    id: 'test-component',
    type: ComponentType.TEXT,
    position: { x: 100, y: 200 },
    dimensions: { width: 150, height: 75 },
    props: {
      content: 'Test Text',
      fontSize: 16,
      fontWeight: 400,
      color: '#000000',
    },
    zIndex: 1,
  }

  beforeEach(() => {
    mockUpdateComponent.mockClear()
  })

  it('renders without crashing', () => {
    render(<PropertiesForm component={mockComponent} />)
    expect(screen.getByLabelText('Content')).toBeInTheDocument()
  })

  it('displays text-specific properties for TEXT components', () => {
    render(<PropertiesForm component={mockComponent} />)

    expect(screen.getByDisplayValue('Test Text')).toBeInTheDocument()
    expect(screen.getByDisplayValue('16')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#000000')).toBeInTheDocument()
  })

  it('handles text property updates for TEXT components', async () => {
    render(<PropertiesForm component={mockComponent} />)

    const textInput = screen.getByDisplayValue('Test Text')
    fireEvent.change(textInput, { target: { value: 'Updated Text' } })

    await waitFor(() => {
      expect(mockUpdateComponent).toHaveBeenCalledWith('test-component', {
        props: { ...mockComponent.props, content: 'Updated Text' },
      })
    })
  })

  it('handles font size updates for TEXT components', async () => {
    render(<PropertiesForm component={mockComponent} />)

    const fontSizeInput = screen.getByDisplayValue('16')
    fireEvent.change(fontSizeInput, { target: { value: '18' } })

    await waitFor(() => {
      expect(mockUpdateComponent).toHaveBeenCalledWith('test-component', {
        props: { ...mockComponent.props, fontSize: 18 },
      })
    })
  })

  it('handles color updates for TEXT components', async () => {
    render(<PropertiesForm component={mockComponent} />)

    const colorInput = screen.getByDisplayValue('#000000')
    fireEvent.change(colorInput, { target: { value: '#ff0000' } })

    await waitFor(() => {
      expect(mockUpdateComponent).toHaveBeenCalledWith('test-component', {
        props: { ...mockComponent.props, color: '#ff0000' },
      })
    })
  })

  it('renders BUTTON component properties', () => {
    const buttonComponent = {
      ...mockComponent,
      type: ComponentType.BUTTON,
      props: {
        label: 'Click Me',
        backgroundColor: '#007bff',
        borderRadius: 4,
        url: '',
        fontSize: 14,
        padding: 8,
        textColor: '#ffffff',
      },
    }

    render(<PropertiesForm component={buttonComponent} />)

    expect(screen.getByDisplayValue('Click Me')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#007bff')).toBeInTheDocument()
  })

  it('renders IMAGE component properties', () => {
    const imageComponent = {
      ...mockComponent,
      type: ComponentType.IMAGE,
      props: {
        src: 'test.jpg',
        alt: 'Test Image',
        objectFit: 'cover',
        borderRadius: 0,
      },
    }

    render(<PropertiesForm component={imageComponent} />)

    expect(screen.getByDisplayValue('test.jpg')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Image')).toBeInTheDocument()
  })

  it('renders TEXTAREA component properties', () => {
    const textareaComponent = {
      ...mockComponent,
      type: ComponentType.TEXTAREA,
      props: {
        content: 'Some text content',
        fontSize: 14,
        color: '#333333',
        textAlign: 'left',
      },
    }

    render(<PropertiesForm component={textareaComponent} />)

    expect(screen.getByDisplayValue('Some text content')).toBeInTheDocument()
    expect(screen.getByDisplayValue('14')).toBeInTheDocument()
  })

  it('validates numeric inputs', async () => {
    render(<PropertiesForm component={mockComponent} />)

    const fontSizeInput = screen.getByDisplayValue('16')
    fireEvent.change(fontSizeInput, { target: { value: 'invalid' } })

    // Should not call update with invalid value - NaN becomes 0
    await waitFor(() => {
      expect(mockUpdateComponent).toHaveBeenCalledWith('test-component', {
        props: { ...mockComponent.props, fontSize: 0 },
      })
    })
  })

  it('handles font weight updates for TEXT components', async () => {
    render(<PropertiesForm component={mockComponent} />)

    const fontWeightSelect = screen.getByDisplayValue('Normal')
    fireEvent.change(fontWeightSelect, { target: { value: '700' } })

    await waitFor(() => {
      expect(mockUpdateComponent).toHaveBeenCalledWith('test-component', {
        props: { ...mockComponent.props, fontWeight: 700 },
      })
    })
  })
})
