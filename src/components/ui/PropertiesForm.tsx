import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { BaseComponent } from '@/types'
import { useComponentActions } from '@/store'
import {
  ColorPicker,
  Slider,
  ButtonGroup,
  Dropdown,
} from '@/components/ui/controls'
import {
  generatePropertyForm,
  shouldShowField,
  validateFormData,
  PropertyField,
} from '@/utils/formGeneration'
import {
  useBatchedPropertyUpdates,
  usePropertyUpdatePerformance,
} from '@/hooks/useDebounce'
import styles from './PropertiesForm.module.css'

interface Props {
  component: BaseComponent
}

interface FormGroupProps {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

const FormGroup: React.FC<FormGroupProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        {collapsible ? (
          <button
            type="button"
            className={styles.formGroupToggle}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <span
              className={`${styles.formGroupArrow} ${isExpanded ? styles.formGroupArrowExpanded : ''}`}
            >
              ▼
            </span>
            <h3 className={styles.formGroupTitle}>{title}</h3>
          </button>
        ) : (
          <h3 className={styles.formGroupTitle}>{title}</h3>
        )}
      </div>
      {(!collapsible || isExpanded) && (
        <div className={styles.formGroupContent}>{children}</div>
      )}
    </div>
  )
}

interface FieldRendererProps {
  field: PropertyField
  value: unknown
  onChange: (value: unknown) => void
  hasError: boolean
  errorMessage?: string
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  hasError,
  errorMessage,
}) => {
  const commonProps = {
    value,
    onChange,
    label: field.label,
    'aria-label': field.label,
    disabled: false,
    ...field.props,
  }

  const renderField = () => {
    switch (field.type) {
      case 'color':
        return <ColorPicker {...commonProps} value={value as string} />

      case 'slider':
      case 'number':
        return (
          <Slider
            {...commonProps}
            value={value as number}
            min={(field.props?.min as number) || 0}
            max={(field.props?.max as number) || 100}
          />
        )

      case 'dropdown':
        return (
          <Dropdown
            {...commonProps}
            value={value as string | number}
            options={
              (field.options || []) as Array<{
                value: string | number
                label: string
                description?: string
              }>
            }
          />
        )

      case 'buttonGroup':
        return (
          <ButtonGroup
            {...commonProps}
            value={value as string | number}
            options={
              (field.options || []) as Array<{
                value: string | number
                label: string
                icon?: React.ReactNode
                'aria-label'?: string
              }>
            }
          />
        )

      case 'text':
      case 'url':
        return (
          <div className={styles.textInput}>
            <input
              type={field.type === 'url' ? 'url' : 'text'}
              className={`${styles.control} ${hasError ? styles.controlError : ''}`}
              value={(value as string) || ''}
              onChange={e => onChange(e.target.value)}
              placeholder={field.props?.placeholder as string}
              aria-label={field.label}
            />
          </div>
        )

      case 'textarea':
        return (
          <div className={styles.textInput}>
            <textarea
              className={`${styles.control} ${styles.full} ${hasError ? styles.controlError : ''}`}
              value={(value as string) || ''}
              onChange={e => onChange(e.target.value)}
              placeholder={field.props?.placeholder as string}
              rows={(field.props?.rows as number) || 3}
              aria-label={field.label}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`${styles.fieldContainer} ${hasError ? styles.fieldContainerError : ''}`}
    >
      {renderField()}
      {hasError && errorMessage && (
        <div className={styles.fieldError} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export const PropertiesForm: React.FC<Props> = ({ component }) => {
  const { updateComponent } = useComponentActions()
  const { recordUpdate } = usePropertyUpdatePerformance()

  // Generate form configuration for this component type
  const form = useMemo(
    () => generatePropertyForm(component.type),
    [component.type]
  )

  // Property update management with debouncing and optimistic UI
  const {
    props: optimisticProps,
    updateProperty,
    isUpdating,
  } = useBatchedPropertyUpdates(
    component.props as Record<string, unknown>,
    useCallback(
      (updates: Partial<Record<string, unknown>>) => {
        const startTime = performance.now()

        // Update component with validated properties
        updateComponent(component.id, {
          props: { ...component.props, ...updates },
        })

        // Record performance metrics
        recordUpdate(startTime)
      },
      [component.id, component.props, updateComponent, recordUpdate]
    ),
    100 // 100ms debounce delay - much more responsive!
  )

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({})

  // Real-time validation
  useEffect(() => {
    const { errors } = validateFormData(form.fields, optimisticProps)
    setValidationErrors(errors)
  }, [form.fields, optimisticProps])

  // Handle property changes
  const handlePropertyChange = useCallback(
    (fieldName: string, value: unknown) => {
      updateProperty(fieldName, value)
    },
    [updateProperty]
  )

  // Filter visible fields based on conditionals
  const visibleFields = useMemo(() => {
    return form.fields.filter(field => shouldShowField(field, optimisticProps))
  }, [form.fields, optimisticProps])

  // If no form is available for this component type, show a fallback
  if (!form.fields.length) {
    return (
      <div className={styles.form}>
        <div className={styles.noProperties}>
          <p>No properties available for this component type.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.form}>
      {/* Performance indicator */}
      {isUpdating && (
        <div className={styles.updateIndicator}>
          <span className={styles.updateSpinner}>⟳</span>
          Updating properties...
        </div>
      )}

      {/* Render form groups */}
      {form.layout.groups.map(group => {
        const groupFields = group.fields
          .map(fieldId => visibleFields.find(f => f.id === fieldId))
          .filter((field): field is PropertyField => field !== undefined)

        if (groupFields.length === 0) return null

        return (
          <FormGroup
            key={group.id}
            title={group.title}
            collapsible={group.collapsible}
            defaultExpanded={group.defaultExpanded}
          >
            <div className={styles.formGroupFields}>
              {groupFields.map(field => {
                const fieldErrors = validationErrors[field.name] || []
                const hasError = fieldErrors.length > 0
                const errorMessage = hasError ? fieldErrors[0] : undefined

                return (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={optimisticProps[field.name]}
                    onChange={value => handlePropertyChange(field.name, value)}
                    hasError={hasError}
                    errorMessage={errorMessage}
                  />
                )
              })}
            </div>
          </FormGroup>
        )
      })}

      {/* Validation summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className={styles.validationSummary} role="alert">
          <h4 className={styles.validationSummaryTitle}>Validation Errors</h4>
          <ul className={styles.validationSummaryList}>
            {Object.entries(validationErrors).map(([fieldName, errors]) =>
              errors.map((error, index) => (
                <li
                  key={`${fieldName}-${index}`}
                  className={styles.validationSummaryItem}
                >
                  {error}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
