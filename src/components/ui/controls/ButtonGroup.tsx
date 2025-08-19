import React from 'react'
import styles from './Controls.module.css'

interface ButtonGroupOption<T> {
  value: T
  label: string
  icon?: React.ReactNode
  'aria-label'?: string
}

interface ButtonGroupProps<T> {
  value: T
  onChange: (value: T) => void
  options: ButtonGroupOption<T>[]
  label?: string
  'aria-label'?: string
  disabled?: boolean
  variant?: 'default' | 'compact'
}

export const ButtonGroup = <T extends string | number>({
  value,
  onChange,
  options,
  label,
  'aria-label': ariaLabel,
  disabled = false,
  variant = 'default',
}: ButtonGroupProps<T>) => {
  return (
    <div className={styles.buttonGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <div
        className={`${styles.buttonGroupContent} ${styles[`buttonGroup${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}
        role="group"
        aria-label={ariaLabel || `${label || 'Options'} button group`}
      >
        {options.map((option, _index) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.buttonGroupOption} ${
              value === option.value ? styles.buttonGroupOptionActive : ''
            }`}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            aria-label={option['aria-label'] || `Select ${option.label}`}
            aria-pressed={value === option.value}
          >
            {option.icon && (
              <span className={styles.buttonGroupIcon}>{option.icon}</span>
            )}
            <span className={styles.buttonGroupLabel}>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Common alignment options for text components
export const ALIGNMENT_OPTIONS: ButtonGroupOption<
  'left' | 'center' | 'right'
>[] = [
  {
    value: 'left',
    label: 'Left',
    icon: '⌞',
    'aria-label': 'Align left',
  },
  {
    value: 'center',
    label: 'Center',
    icon: '≡',
    'aria-label': 'Align center',
  },
  {
    value: 'right',
    label: 'Right',
    icon: '⌟',
    'aria-label': 'Align right',
  },
]

// Font weight options for typography
export const FONT_WEIGHT_BUTTON_OPTIONS: ButtonGroupOption<400 | 700>[] = [
  {
    value: 400,
    label: 'Normal',
    'aria-label': 'Normal font weight',
  },
  {
    value: 700,
    label: 'Bold',
    icon: '𝐁',
    'aria-label': 'Bold font weight',
  },
]

// Object fit options for images
export const OBJECT_FIT_OPTIONS: ButtonGroupOption<
  'cover' | 'contain' | 'fill'
>[] = [
  {
    value: 'cover',
    label: 'Cover',
    'aria-label': 'Fit cover - crop to fill',
  },
  {
    value: 'contain',
    label: 'Contain',
    'aria-label': 'Fit contain - scale to fit',
  },
  {
    value: 'fill',
    label: 'Fill',
    'aria-label': 'Fit fill - stretch to fill',
  },
]
