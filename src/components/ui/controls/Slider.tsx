import React, { useState, useEffect } from 'react'
import styles from './Controls.module.css'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label?: string
  'aria-label'?: string
  disabled?: boolean
  showNumericInput?: boolean
  unit?: string
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  'aria-label': ariaLabel,
  disabled = false,
  showNumericInput = true,
  unit = '',
}) => {
  const [inputValue, setInputValue] = useState((value ?? 0).toString())

  // Update input value when prop changes
  useEffect(() => {
    setInputValue((value ?? 0).toString())
  }, [value])

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value)
    setInputValue(newValue.toString())
    onChange?.(newValue)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
  }

  const handleInputBlur = () => {
    let numericValue = Number(inputValue)

    // Validate and constrain the value
    if (isNaN(numericValue)) {
      numericValue = value ?? 0 // revert to current value or 0
    } else {
      numericValue = Math.min(max, Math.max(min, numericValue))
    }

    setInputValue(numericValue.toString())
    if (numericValue !== value) {
      onChange?.(numericValue)
    }
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleInputBlur()
    }
  }

  const safeValue = value ?? 0
  const percentage = ((safeValue - min) / (max - min)) * 100

  return (
    <div className={styles.slider}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.sliderContent}>
        <div className={styles.sliderTrack}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeValue}
            onChange={handleSliderChange}
            disabled={disabled}
            className={styles.sliderInput}
            aria-label={ariaLabel || `${label || 'Value'} slider`}
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percentage}%, var(--color-border) ${percentage}%, var(--color-border) 100%)`,
            }}
          />
        </div>
        {showNumericInput && (
          <div className={styles.sliderNumericInput}>
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              disabled={disabled}
              className={styles.numericInput}
              aria-label={ariaLabel || `${label || 'Value'} numeric input`}
            />
            {unit && <span className={styles.unit}>{unit}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
