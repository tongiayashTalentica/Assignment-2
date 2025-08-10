import { PanelProps } from '@/types'
import styles from './Panel.module.css'

interface PropertiesPanelProps extends PanelProps {
  style?: React.CSSProperties
}

export const PropertiesPanel = ({ className, children, style }: PropertiesPanelProps) => {
  return (
    <div className={`${styles.panel} ${className || ''}`} style={style}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Properties</h2>
      </div>
      <div className={styles.panelContent}>
        {children || (
          <div className={styles.placeholder}>
            <p>Component properties will be here</p>
            <p className={styles.placeholderText}>
              Select a component to view and edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 