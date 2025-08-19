import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PropertiesForm } from '@/components/ui/PropertiesForm'
import { ComponentType } from '@/types'

// Mock the store hooks
const mockUpdateComponent = jest.fn()
const mockRecordUpdate = jest.fn()

jest.mock('@/store', () => ({
  useComponentActions: () => ({
    updateComponent: mockUpdateComponent,
  }),
}))

// Mock the debounce hooks
jest.mock('@/hooks/useDebounce', () => ({
  useBatchedPropertyUpdates: (props: any, updateFn: any, _delay: number) => ({
    props,
    updateProperty: (key: string, value: any) => {
      // Immediately call updateFn to simulate the debounced behavior
      updateFn({ [key]: value })
    },
    isUpdating: false,
  }),
  usePropertyUpdatePerformance: () => ({
    averageUpdateTime: 50,
    totalUpdates: 10,
    recordUpdate: mockRecordUpdate,
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

    // Content field
    expect(screen.getByDisplayValue('Test Text')).toBeInTheDocument()

    // Font size - check the number input specifically (our Slider has both range and number)
    const fontSizeNumberInput = screen.getByRole('spinbutton', {
      name: /font size/i,
    })
    expect(fontSizeNumberInput).toHaveValue(16)

    // Color field
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

    // Target the number input specifically from our Slider component
    const fontSizeInput = screen.getByRole('spinbutton', { name: /font size/i })
    fireEvent.change(fontSizeInput, { target: { value: '18' } })

    // Trigger blur to actually call onChange in our Slider component
    fireEvent.blur(fontSizeInput)

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

    // Check font size using the number input from our Slider component
    const fontSizeNumberInput = screen.getByRole('spinbutton', {
      name: /font size/i,
    })
    expect(fontSizeNumberInput).toHaveValue(14)
  })

  it('validates numeric inputs', async () => {
    render(<PropertiesForm component={mockComponent} />)

    // Target the number input specifically from our Slider component
    const fontSizeInput = screen.getByRole('spinbutton', { name: /font size/i })
    fireEvent.change(fontSizeInput, { target: { value: 'invalid' } })

    // Trigger blur to actually call onChange in our Slider component
    fireEvent.blur(fontSizeInput)

    // Invalid input gets constrained to minimum value (8)
    await waitFor(() => {
      expect(mockUpdateComponent).toHaveBeenCalledWith('test-component', {
        props: { ...mockComponent.props, fontSize: 8 },
      })
    })
  })

  it('handles font weight updates for TEXT components', async () => {
    render(<PropertiesForm component={mockComponent} />)

    // Our ButtonGroup component shows "Normal" as one of the button options
    // Find the Normal button (should be active by default since fontWeight is 400)
    const normalButton = screen.getByRole('button', {
      name: /normal font weight/i,
    })
    expect(normalButton).toBeInTheDocument()
    expect(normalButton).toHaveAttribute('aria-pressed', 'true')

    // Find and click "Bold" button (should correspond to 700)
    const boldButton = screen.getByRole('button', { name: /bold font weight/i })
    expect(boldButton).toBeInTheDocument()
    fireEvent.click(boldButton)

    await waitFor(() => {
      expect(mockUpdateComponent).toHaveBeenCalledWith('test-component', {
        props: { ...mockComponent.props, fontWeight: 700 },
      })
    })
  })
})
