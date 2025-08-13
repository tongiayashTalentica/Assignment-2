import React from 'react'
import { PanelProps } from '@/types'
import styles from './Panel.module.css'
import canvasStyles from './CanvasPanel.module.css'

interface CanvasPanelProps extends PanelProps {
  style?: React.CSSProperties
}

export const CanvasPanel = ({
  className,
  children,
  style,
}: CanvasPanelProps) => {
  return (
    <div className={`${styles['panel']} ${className || ''}`} style={style}>
      <div className={styles['panelHeader']}>
        <h2 className={styles['panelTitle']}>Canvas</h2>
      </div>
      <div
        className={`${styles['panelContent']} ${canvasStyles['canvasContent']}`}
      >
        {children || (
          <div className={canvasStyles['canvasArea']}>
            <div className={canvasStyles['canvasPlaceholder']}>
              <h3>Design Canvas</h3>
              <p className={styles['placeholderText']}>
                Drop components here to start building your design
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
