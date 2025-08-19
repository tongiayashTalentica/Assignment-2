import React, { useState, useRef, useEffect } from 'react'
import styles from './Controls.module.css'

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  'aria-label'?: string
  disabled?: boolean
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  'aria-label': ariaLabel,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '#000000')
  const colorInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '#000000')
  }, [value])

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    onChange?.(newValue)
  }

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)

    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(newValue) || newValue === '') {
      onChange?.(newValue)
    }
  }

  const handleTextBlur = () => {
    // If invalid hex color, revert to current value
    if (!/^#[0-9A-F]{6}$/i.test(inputValue) && inputValue !== '') {
      setInputValue(value || '#000000')
    }
  }

  const normalizedValue = (value || '#000000').startsWith('#')
    ? value || '#000000'
    : `#${value || '000000'}`

  return (
    <div className={styles.colorPicker} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.colorPickerContent}>
        <button
          type="button"
          className={styles.colorSwatch}
          style={{ backgroundColor: normalizedValue }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label={ariaLabel || `Color picker for ${label || 'color'}`}
        >
          <div className={styles.colorSwatchInner} />
        </button>
        <input
          type="text"
          className={styles.colorInput}
          value={inputValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          placeholder="#000000"
          maxLength={7}
          disabled={disabled}
          aria-label={ariaLabel || `${label || 'Color'} hex value`}
        />
        {isOpen && (
          <div className={styles.colorPickerPopup}>
            <input
              ref={colorInputRef}
              type="color"
              value={normalizedValue}
              onChange={handleColorChange}
              className={styles.colorPickerNative}
              aria-label={ariaLabel || `${label || 'Color'} picker`}
            />
            <div className={styles.colorPresets}>
              {[
                '#000000',
                '#ffffff',
                '#f3f4f6',
                '#6b7280',
                '#3b82f6',
                '#059669',
                '#dc2626',
                '#7c2d12',
              ].map(color => (
                <button
                  key={color}
                  type="button"
                  className={styles.colorPreset}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setInputValue(color)
                    onChange(color)
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
