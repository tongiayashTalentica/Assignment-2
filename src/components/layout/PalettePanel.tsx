import React from 'react'
import { PanelProps } from '@/types'
import styles from './Panel.module.css'

interface PalettePanelProps extends PanelProps {
  style?: React.CSSProperties
}

export const PalettePanel = ({
  className,
  children,
  style,
}: PalettePanelProps) => {
  return (
    <div className={`${styles['panel']} ${className || ''}`} style={style}>
      <div className={styles['panelHeader']}>
        <h2 className={styles['panelTitle']}>Components</h2>
      </div>
      <div className={styles['panelContent']}>
        {children || (
          <div className={styles['placeholder']}>
            <p>Component palette will be here</p>
            <p className={styles['placeholderText']}>
              Drag and drop components from here to the canvas
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
