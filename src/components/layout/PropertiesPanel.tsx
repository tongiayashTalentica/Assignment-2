import React from 'react'
import { PanelProps } from '@/types'
import styles from './Panel.module.css'
import { useFocusedComponent, useSelectedComponents } from '@/store/simple'
import { PropertiesForm } from '@/components/ui/PropertiesForm'

interface PropertiesPanelProps extends PanelProps {
  style?: React.CSSProperties
}

export const PropertiesPanel = ({
  className,
  children,
  style,
}: PropertiesPanelProps) => {
  const focused = useFocusedComponent()
  const selected = useSelectedComponents()
  const activeComponent = focused || selected[0] || null

  return (
    <div className={`${styles['panel']} ${className || ''}`} style={style}>
      <div className={styles['panelHeader']}>
        <h2 className={styles['panelTitle']}>Properties</h2>
      </div>
      <div className={styles['panelContent']}>
        {children ? (
          children
        ) : activeComponent ? (
          <PropertiesForm component={activeComponent} />
        ) : (
          <div className={styles['placeholder']}>
            <p>Component properties will be here</p>
            <p className={styles['placeholderText']}>
              Select a component to view and edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
