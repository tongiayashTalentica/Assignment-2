import React, { useState, useRef, useEffect } from 'react'
import styles from './Controls.module.css'

interface DropdownOption<T> {
  value: T
  label: string
  description?: string
  disabled?: boolean
}

interface DropdownProps<T> {
  value: T
  onChange: (value: T) => void
  options: DropdownOption<T>[]
  label?: string
  'aria-label'?: string
  disabled?: boolean
  placeholder?: string
  searchable?: boolean
}

export const Dropdown = <T extends string | number>({
  value,
  onChange,
  options,
  label,
  'aria-label': ariaLabel,
  disabled = false,
  placeholder = 'Select an option...',
  searchable = false,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get the selected option
  const selectedOption = options.find(opt => opt.value === value)

  // Filter options based on search query
  const filteredOptions = searchable
    ? options.filter(
        option =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (option.description &&
            option.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      )
    : options

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchQuery('')
      }
    }
  }

  const handleOptionSelect = (optionValue: T) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        handleToggle()
        break
      case 'Escape':
        if (isOpen) {
          setIsOpen(false)
          setSearchQuery('')
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          // Focus first option
          const firstOption = dropdownRef.current?.querySelector(
            '[role="option"]'
          ) as HTMLElement
          firstOption?.focus()
        }
        break
    }
  }

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.dropdownContainer}>
        <button
          type="button"
          className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownTriggerOpen : ''} ${disabled ? styles.dropdownTriggerDisabled : ''}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel || `${label || 'Dropdown'} selection`}
        >
          <span className={styles.dropdownValue}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span
            className={`${styles.dropdownArrow} ${isOpen ? styles.dropdownArrowOpen : ''}`}
          >
            ▼
          </span>
        </button>

        {isOpen && (
          <div className={styles.dropdownMenu} role="listbox">
            {searchable && (
              <div className={styles.dropdownSearch}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.dropdownSearchInput}
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Search dropdown options"
                />
              </div>
            )}
            <div className={styles.dropdownOptions}>
              {filteredOptions.length === 0 ? (
                <div className={styles.dropdownNoOptions}>
                  {searchQuery ? 'No matching options' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option, _index) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.dropdownOption} ${
                      option.value === value
                        ? styles.dropdownOptionSelected
                        : ''
                    } ${option.disabled ? styles.dropdownOptionDisabled : ''}`}
                    onClick={() =>
                      !option.disabled && handleOptionSelect(option.value)
                    }
                    disabled={option.disabled}
                    role="option"
                    aria-selected={option.value === value}
                    aria-label={`Select ${option.label}${option.description ? ` - ${option.description}` : ''}`}
                  >
                    <div className={styles.dropdownOptionContent}>
                      <span className={styles.dropdownOptionLabel}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className={styles.dropdownOptionDescription}>
                          {option.description}
                        </span>
                      )}
                    </div>
                    {option.value === value && (
                      <span className={styles.dropdownOptionCheck}>✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Common font weight options
export const FONT_WEIGHT_OPTIONS: DropdownOption<400 | 700>[] = [
  {
    value: 400,
    label: 'Normal',
    description: 'Regular font weight',
  },
  {
    value: 700,
    label: 'Bold',
    description: 'Bold font weight',
  },
]

// Common object fit options for images
export const OBJECT_FIT_DROPDOWN_OPTIONS: DropdownOption<
  'cover' | 'contain' | 'fill'
>[] = [
  {
    value: 'cover',
    label: 'Cover',
    description: 'Crop to fill container',
  },
  {
    value: 'contain',
    label: 'Contain',
    description: 'Scale to fit container',
  },
  {
    value: 'fill',
    label: 'Fill',
    description: 'Stretch to fill container',
  },
]
