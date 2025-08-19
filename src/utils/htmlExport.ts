import { BaseComponent, ComponentType, ComponentProperties } from '@/types'

/**
 * HTML Export Utility
 * Generates clean, semantic HTML from canvas components with proper CSS
 */

interface ExportOptions {
  includeStyles?: boolean
  responsiveBreakpoints?: boolean
  minifyOutput?: boolean
  exportFormat?: 'html' | 'react' | 'vue'
  cssFramework?: 'none' | 'tailwind' | 'bootstrap'
}

interface ExportResult {
  html: string
  css: string
  metadata: {
    componentCount: number
    exportDate: Date
    canvasDimensions: { width: number; height: number }
  }
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeStyles: true,
  responsiveBreakpoints: true,
  minifyOutput: false,
  exportFormat: 'html',
  cssFramework: 'none',
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
const sanitizeHTML = (content: string): string => {
  const div = document.createElement('div')
  div.textContent = content
  return div.innerHTML
}

/**
 * Sanitize CSS values
 */
const sanitizeCSS = (value: string): string => {
  // Remove potentially dangerous CSS content
  return value.replace(/[<>'"]/g, '')
}

/**
 * Sanitize URL values
 */
const sanitizeURL = (url: string): string => {
  try {
    // Only allow http/https URLs or relative URLs
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/') ||
      url.startsWith('./')
    ) {
      return url
    }
    return '#'
  } catch {
    return '#'
  }
}

/**
 * Generate CSS for a component
 */
const generateComponentCSS = (
  component: BaseComponent,
  className: string
): string => {
  const { position, dimensions, type, props } = component
  const properties = props as ComponentProperties

  let css = `
.${className} {
  position: absolute;
  left: ${position.x}px;
  top: ${position.y}px;
  width: ${dimensions.width}px;
  height: ${dimensions.height}px;
  z-index: ${component.zIndex || 1};
`

  switch (type) {
    case ComponentType.TEXT: {
      const textProps = properties as Extract<
        ComponentProperties,
        { kind: 'text' }
      >
      css += `
  font-size: ${sanitizeCSS(textProps.fontSize.toString())}px;
  font-weight: ${sanitizeCSS(textProps.fontWeight.toString())};
  color: ${sanitizeCSS(textProps.color)};
  display: flex;
  align-items: center;
  padding: 4px 8px;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  line-height: 1.4;
`
      break
    }
    case ComponentType.TEXTAREA: {
      const textareaProps = properties as Extract<
        ComponentProperties,
        { kind: 'textarea' }
      >
      css += `
  font-size: ${sanitizeCSS(textareaProps.fontSize.toString())}px;
  color: ${sanitizeCSS(textareaProps.color)};
  text-align: ${sanitizeCSS(textareaProps.textAlign)};
  padding: 8px;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-y: auto;
`
      break
    }
    case ComponentType.IMAGE: {
      const imageProps = properties as Extract<
        ComponentProperties,
        { kind: 'image' }
      >
      css += `
  border-radius: ${sanitizeCSS(imageProps.borderRadius.toString())}px;
  overflow: hidden;
`
      break
    }
    case ComponentType.BUTTON: {
      const buttonProps = properties as Extract<
        ComponentProperties,
        { kind: 'button' }
      >
      css += `
  background-color: ${sanitizeCSS(buttonProps.backgroundColor)};
  color: ${sanitizeCSS(buttonProps.textColor)};
  font-size: ${sanitizeCSS(buttonProps.fontSize.toString())}px;
  border-radius: ${sanitizeCSS(buttonProps.borderRadius.toString())}px;
  padding: ${sanitizeCSS(buttonProps.padding.toString())}px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Arial, sans-serif;
  font-weight: 500;
  box-sizing: border-box;
  transition: opacity 0.2s ease;
`
      break
    }
  }

  css += '}\n'

  // Add hover effects for interactive elements
  if (type === ComponentType.BUTTON) {
    css += `
.${className}:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
`
  }

  return css
}

/**
 * Generate HTML for a component
 */
const generateComponentHTML = (
  component: BaseComponent,
  className: string
): string => {
  const { type, props } = component
  const properties = props as ComponentProperties

  switch (type) {
    case ComponentType.TEXT: {
      const textProps = properties as Extract<
        ComponentProperties,
        { kind: 'text' }
      >
      return `<div class="${className}">${sanitizeHTML(textProps.content || 'Text')}</div>`
    }
    case ComponentType.TEXTAREA: {
      const textareaProps = properties as Extract<
        ComponentProperties,
        { kind: 'textarea' }
      >
      return `<div class="${className}">${sanitizeHTML(textareaProps.content || 'Multiline text')}</div>`
    }
    case ComponentType.IMAGE: {
      const imageProps = properties as Extract<
        ComponentProperties,
        { kind: 'image' }
      >
      const src = sanitizeURL(
        imageProps.src || 'https://via.placeholder.com/200'
      )
      const alt = sanitizeHTML(imageProps.alt || 'Image')
      return `<div class="${className}">
  <img src="${src}" alt="${alt}" style="width: 100%; height: 100%; object-fit: ${sanitizeCSS(imageProps.objectFit)};" />
</div>`
    }
    case ComponentType.BUTTON: {
      const buttonProps = properties as Extract<
        ComponentProperties,
        { kind: 'button' }
      >
      const url = sanitizeURL(buttonProps.url || '#')
      const label = sanitizeHTML(buttonProps.label || 'Button')
      return `<a href="${url}" class="${className}" target="_blank" rel="noopener noreferrer">${label}</a>`
    }
    default:
      return `<div class="${className}">Unsupported component</div>`
  }
}

/**
 * Generate responsive CSS breakpoints
 */
const generateResponsiveCSS = (canvasWidth: number): string => {
  if (canvasWidth <= 768) return ''

  const mobileBreakpoint = Math.min(768, canvasWidth * 0.8)

  return `
/* Responsive Styles */
@media (max-width: ${mobileBreakpoint}px) {
  .aura-container {
    transform: scale(0.8);
    transform-origin: top left;
  }
}

@media (max-width: 480px) {
  .aura-container {
    transform: scale(0.6);
    transform-origin: top left;
  }
}
`
}

/**
 * Minify CSS output
 */
const minifyCSS = (css: string): string => {
  return css
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, '}')
    .replace(/{\s+/g, '{')
    .replace(/;\s+/g, ';')
    .trim()
}

/**
 * Minify HTML output
 */
const minifyHTML = (html: string): string => {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
}

/**
 * Main export function
 */
export const exportToHTML = (
  components: Map<string, BaseComponent>,
  canvasDimensions: { width: number; height: number },
  options: Partial<ExportOptions> = {}
): ExportResult => {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options }

  let css = ''
  let html = ''
  let componentIndex = 0

  // Generate base CSS
  if (opts.includeStyles) {
    css = `/* Generated by Aura No-Code Editor */
/* Export Date: ${new Date().toISOString()} */

.aura-container {
  position: relative;
  width: ${canvasDimensions.width}px;
  height: ${canvasDimensions.height}px;
  margin: 0 auto;
  background: #ffffff;
  font-family: Arial, sans-serif;
  overflow: hidden;
}

`
  }

  // Generate component styles and HTML
  const sortedComponents = Array.from(components.values()).sort(
    (a, b) => (a.zIndex || 1) - (b.zIndex || 1)
  )

  for (const component of sortedComponents) {
    const className = `aura-component-${componentIndex}`

    if (opts.includeStyles) {
      css += generateComponentCSS(component, className)
    }

    html += generateComponentHTML(component, className) + '\n'
    componentIndex++
  }

  // Add responsive styles
  if (opts.responsiveBreakpoints && opts.includeStyles) {
    css += generateResponsiveCSS(canvasDimensions.width)
  }

  // Wrap HTML in container
  html = `<div class="aura-container">\n${html}</div>`

  // Generate complete HTML document
  const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura Export</title>
  ${opts.includeStyles ? `<style>\n${opts.minifyOutput ? minifyCSS(css) : css}\n</style>` : ''}
</head>
<body>
  ${opts.minifyOutput ? minifyHTML(html) : html}
</body>
</html>`

  return {
    html: completeHTML,
    css: opts.includeStyles ? css : '',
    metadata: {
      componentCount: componentIndex,
      exportDate: new Date(),
      canvasDimensions,
    },
  }
}

/**
 * Copy HTML to clipboard
 */
export const copyToClipboard = async (content: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate preview URL for components
 */
export const generatePreviewURL = (
  components: Map<string, BaseComponent>,
  canvasDimensions: { width: number; height: number }
): string => {
  const exportResult = exportToHTML(components, canvasDimensions, {
    includeStyles: true,
    responsiveBreakpoints: true,
    minifyOutput: true,
  })

  const blob = new Blob([exportResult.html], { type: 'text/html' })
  return URL.createObjectURL(blob)
}

/**
 * Download HTML file
 */
export const downloadHTML = (
  components: Map<string, BaseComponent>,
  canvasDimensions: { width: number; height: number },
  filename: string = 'aura-export.html',
  options: Partial<ExportOptions> = {}
): void => {
  const exportResult = exportToHTML(components, canvasDimensions, options)

  const blob = new Blob([exportResult.html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
