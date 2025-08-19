import React, { useState, useEffect, useRef } from 'react'
import { useComponents, useCanvas } from '@/store'
import { exportToHTML, copyToClipboard, downloadHTML } from '@/utils/htmlExport'
import { PreviewMode } from '@/types'
import styles from './PreviewModal.module.css'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

const VIEWPORT_SIZES = {
  desktop: { width: 1200, height: 800, label: 'Desktop (1200px)' },
  tablet: { width: 768, height: 1024, label: 'Tablet (768px)' },
  mobile: { width: 375, height: 667, label: 'Mobile (375px)' },
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const components = useComponents()
  const canvas = useCanvas()

  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [previewMode, setPreviewMode] = useState<PreviewMode>(
    PreviewMode.PREVIEW
  )
  const [exportedHTML, setExportedHTML] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const previewRef = useRef<HTMLIFrameElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Generate preview content when modal opens or components change
  useEffect(() => {
    if (isOpen && components.size > 0) {
      const exportResult = exportToHTML(components, canvas.dimensions, {
        includeStyles: true,
        responsiveBreakpoints: true,
        minifyOutput: false,
      })
      setExportedHTML(exportResult.html)

      // Update iframe content
      if (previewRef.current) {
        const iframe = previewRef.current
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc) {
          doc.open()
          doc.write(exportResult.html)
          doc.close()
        }
      }
    }
  }, [isOpen, components, canvas.dimensions])

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleCopyHTML = async () => {
    if (!exportedHTML) return

    setIsExporting(true)
    const success = await copyToClipboard(exportedHTML)

    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } else {
      alert('Failed to copy HTML to clipboard. Please try again.')
    }

    setIsExporting(false)
  }

  const handleDownloadHTML = () => {
    if (components.size === 0) return

    setIsExporting(true)
    downloadHTML(components, canvas.dimensions, 'aura-design.html', {
      includeStyles: true,
      responsiveBreakpoints: true,
      minifyOutput: false,
    })
    setIsExporting(false)
  }

  const currentViewport = VIEWPORT_SIZES[viewportMode]

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div className={styles.modal} ref={modalRef}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="preview-title" className={styles.title}>
            Preview & Export
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close preview modal"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>View Mode:</label>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${previewMode === PreviewMode.PREVIEW ? styles.buttonActive : ''}`}
                onClick={() => setPreviewMode(PreviewMode.PREVIEW)}
              >
                Preview
              </button>
              <button
                className={`${styles.button} ${previewMode === PreviewMode.CODE ? styles.buttonActive : ''}`}
                onClick={() => setPreviewMode(PreviewMode.CODE)}
              >
                HTML Code
              </button>
            </div>
          </div>

          {previewMode === PreviewMode.PREVIEW && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Viewport:</label>
              <div className={styles.buttonGroup}>
                {(
                  Object.entries(VIEWPORT_SIZES) as [
                    ViewportMode,
                    (typeof VIEWPORT_SIZES)[ViewportMode],
                  ][]
                ).map(([mode, viewport]) => (
                  <button
                    key={mode}
                    className={`${styles.button} ${viewportMode === mode ? styles.buttonActive : ''}`}
                    onClick={() => setViewportMode(mode)}
                    title={viewport.label}
                  >
                    {mode === 'desktop' && '🖥️'}
                    {mode === 'tablet' && '📱'}
                    {mode === 'mobile' && '📱'}
                    <span className={styles.viewportLabel}>
                      {viewport.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Export:</label>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleCopyHTML}
                disabled={isExporting || components.size === 0}
                title="Copy HTML to clipboard"
              >
                {copySuccess ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="m5 15-2 2 2 2" />
                      <path d="m5 9-2-2 2-2" />
                    </svg>
                    Copy HTML
                  </>
                )}
              </button>
              <button
                className={styles.button}
                onClick={handleDownloadHTML}
                disabled={isExporting || components.size === 0}
                title="Download HTML file"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {components.size === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎨</div>
              <h3 className={styles.emptyTitle}>No Components to Preview</h3>
              <p className={styles.emptyText}>
                Add some components to the canvas to see the preview and
                generate HTML export.
              </p>
            </div>
          ) : previewMode === PreviewMode.PREVIEW ? (
            <div className={styles.previewContainer}>
              <div className={styles.viewportInfo}>
                <span className={styles.viewportSize}>
                  {currentViewport.width} × {currentViewport.height}
                </span>
                <span className={styles.componentCount}>
                  {components.size} component{components.size === 1 ? '' : 's'}
                </span>
              </div>
              <div
                className={styles.previewViewport}
                style={{
                  width: currentViewport.width,
                  height: currentViewport.height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              >
                <iframe
                  ref={previewRef}
                  className={styles.previewFrame}
                  title="Component Preview"
                  sandbox="allow-same-origin"
                  style={{
                    width: currentViewport.width,
                    height: currentViewport.height,
                    transform:
                      currentViewport.width > 800 ? 'scale(0.8)' : 'scale(1)',
                    transformOrigin: 'top left',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.codeContainer}>
              <div className={styles.codeHeader}>
                <span className={styles.codeTitle}>Generated HTML</span>
                <span className={styles.codeSize}>
                  {exportedHTML.length} characters
                </span>
              </div>
              <pre className={styles.codeContent}>
                <code>{exportedHTML}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            Export includes semantic HTML with embedded CSS for maximum
            compatibility
          </div>
          <div className={styles.footerActions}>
            <button className={styles.buttonSecondary} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
