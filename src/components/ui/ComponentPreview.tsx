import React from 'react'
import { ComponentType } from '@/types'

interface ComponentPreviewProps {
  type: ComponentType
  className?: string
  size?: 'small' | 'medium' | 'large'
}

const previewStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  backgroundColor: '#f9fafb',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const getPreviewContent = (
  type: ComponentType,
  size: 'small' | 'medium' | 'large'
) => {
  const sizeConfig = {
    small: { width: 32, height: 24, fontSize: 10 },
    medium: { width: 48, height: 36, fontSize: 12 },
    large: { width: 64, height: 48, fontSize: 14 },
  }

  const { width, height, fontSize } = sizeConfig[size]

  const baseStyle: React.CSSProperties = {
    ...previewStyles,
    width,
    height,
    fontSize,
  }

  switch (type) {
    case ComponentType.TEXT:
      return (
        <div style={baseStyle}>
          <span style={{ color: '#374151', fontWeight: 500 }}>Aa</span>
        </div>
      )

    case ComponentType.TEXTAREA:
      return (
        <div
          style={{
            ...baseStyle,
            flexDirection: 'column',
            gap: '2px',
            padding: '3px',
          }}
        >
          <div
            style={{
              width: '90%',
              height: '2px',
              backgroundColor: '#9ca3af',
              borderRadius: '1px',
            }}
          />
          <div
            style={{
              width: '70%',
              height: '2px',
              backgroundColor: '#9ca3af',
              borderRadius: '1px',
            }}
          />
          <div
            style={{
              width: '85%',
              height: '2px',
              backgroundColor: '#9ca3af',
              borderRadius: '1px',
            }}
          />
        </div>
      )

    case ComponentType.IMAGE:
      return (
        <div style={baseStyle}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
        </div>
      )

    case ComponentType.BUTTON:
      return (
        <div style={baseStyle}>
          <div
            style={{
              backgroundColor: '#1f2937',
              color: '#ffffff',
              borderRadius: '4px',
              fontWeight: 500,
              padding: '2px 6px',
              fontSize: fontSize - 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Btn
          </div>
        </div>
      )

    default:
      return (
        <div style={baseStyle}>
          <span style={{ color: '#6b7280' }}>?</span>
        </div>
      )
  }
}

export const ComponentPreview: React.FC<ComponentPreviewProps> = ({
  type,
  className = '',
  size = 'medium',
}) => {
  return <div className={className}>{getPreviewContent(type, size)}</div>
}
