# Component Palette Module - Usage Guide

## Overview

The Component Palette Module is a comprehensive, accessible, and performant interface for browsing and adding components to the canvas. It provides an intuitive drag-and-drop experience with full keyboard navigation support and screen reader compatibility.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Usage](#usage)
- [Components](#components)
- [Accessibility](#accessibility)
- [Customization](#customization)
- [Testing](#testing)
- [Performance](#performance)
- [API Reference](#api-reference)

## Features

### Core Functionality

- **Drag-and-Drop**: Native browser event-based drag system
- **Component Categories**: Organized into logical groups (Basic, Input, Media)
- **Search & Filter**: Real-time component search with fuzzy matching
- **Recent Components**: Quick access to frequently used components
- **Visual Previews**: Rich component thumbnails with hover states
- **Templates**: Pre-configured component templates and variants

### Accessibility Features

- **Full Keyboard Navigation**: Arrow keys, Tab, Enter/Space activation
- **Screen Reader Support**: Proper ARIA labels, live regions, announcements
- **Keyboard Drag Mode**: Alternative to mouse drag for keyboard users
- **Focus Management**: Logical focus flow and visual indicators
- **High Contrast**: Sufficient color contrast for all states

### Performance Features

- **60 FPS Drag Operations**: Smooth, performant drag interactions
- **Debounced Search**: Optimized search with minimal re-renders
- **Virtual Scrolling**: Efficient rendering for large component lists
- **Lazy Loading**: Progressive enhancement of component previews

## Architecture

### Component Hierarchy

```
PalettePanel
├── Search Input
├── PaletteCategory[]
│   └── ComponentPaletteItem[]
│       └── ComponentPreview
└── Recent Components
```

### Key Files

- `PalettePanel.tsx` - Main container component
- `ComponentPaletteItem.tsx` - Individual draggable component items
- `ComponentPreview.tsx` - Visual preview generator
- `PaletteCategory.tsx` - Collapsible category sections
- `PaletteState.ts` - State management and utilities
- `componentTemplates.ts` - Template system and defaults
- `usePaletteAccessibility.ts` - Accessibility features
- `useDragAndDrop.ts` - Drag-and-drop functionality

## Usage

### Basic Implementation

```tsx
import { PalettePanel } from '@/components/layout/PalettePanel'

function App() {
  return (
    <div className="app-layout">
      <PalettePanel className="sidebar-palette" />
      {/* Other components */}
    </div>
  )
}
```

### With Custom Styling

```tsx
<PalettePanel
  className="custom-palette"
  style={{ width: '280px', backgroundColor: '#f8f9fa' }}
/>
```

### Accessing Palette State

```tsx
import { useAppStore } from '@/store'

function MyComponent() {
  const { addComponent, selectComponent } = useAppStore()

  // Components are automatically added when dragged from palette
  // Custom handling can be implemented via store actions
}
```

## Components

### PalettePanel

The main container component that orchestrates all palette functionality.

**Props:**

- `className?: string` - Additional CSS classes
- `style?: React.CSSProperties` - Inline styles
- `children?: ReactNode` - Custom content (replaces default)

**Features:**

- Responsive layout within 20% width constraint
- Search functionality with real-time filtering
- Category management with collapse/expand
- Recent components tracking
- Performance monitoring display

### ComponentPaletteItem

Individual component items that can be dragged to the canvas.

**Props:**

- `type: ComponentType` - The component type (TEXT, BUTTON, etc.)
- `label: string` - Display name
- `description: string` - Component description
- `onAdd: () => void` - Callback when component is added
- `onSelect?: () => void` - Callback when component is selected
- `isSelected?: boolean` - Whether item is currently selected
- `disabled?: boolean` - Whether item is disabled
- `showTooltip?: boolean` - Whether to show tooltip on hover

**States:**

- Normal, Hover, Selected, Disabled, Dragging

### ComponentPreview

Generates visual previews for different component types.

**Props:**

- `type: ComponentType` - Component type to preview
- `size?: 'small' | 'medium' | 'large'` - Preview size
- `className?: string` - Additional CSS classes

**Preview Types:**

- **Text**: Typography icon (Aa)
- **TextArea**: Horizontal lines representing text
- **Image**: SVG image placeholder icon
- **Button**: Mini button with label

### PaletteCategory

Collapsible sections that group related components.

**Props:**

- `category: PaletteCategory` - Category configuration
- `selectedComponentType?: ComponentType` - Currently selected component
- `searchQuery?: string` - Active search query
- `onComponentAdd: (type: ComponentType) => void` - Add component callback
- `onComponentSelect: (type: ComponentType) => void` - Select component callback
- `onToggleCollapse: (categoryId: string) => void` - Collapse toggle callback
- `showDescriptions?: boolean` - Whether to show component descriptions

## Accessibility

### Keyboard Navigation

**Global Shortcuts:**

- `Ctrl+K` / `Ctrl+F` - Focus search input
- `Escape` - Clear search, exit keyboard drag mode

**Component Navigation:**

- `Arrow Up/Down` - Navigate between components
- `Home/End` - Jump to first/last component
- `Enter/Space` - Add component to canvas
- `Shift+Enter` - Select component (don't add)
- `Shift+D` - Enter keyboard drag mode

**Category Navigation:**

- `Enter/Space` - Toggle category collapse
- `Arrow Keys` - Navigate between categories

### Screen Reader Support

All components include:

- Proper ARIA labels and descriptions
- Live regions for dynamic content updates
- Role and state information
- Relationship indicators (aria-controls, aria-describedby)

### Keyboard Drag Mode

For users who cannot use mouse drag:

1. Navigate to desired component
2. Press `Shift+D` to enter drag mode
3. Use arrow keys to position (visual feedback provided)
4. Press `Enter` to place component
5. Press `Escape` to cancel

## Customization

### Adding New Component Types

1. **Update Types:**

```tsx
// types/index.ts
export enum ComponentType {
  // ... existing types
  NEW_COMPONENT = 'new-component',
}
```

2. **Add Metadata:**

```tsx
// components/ui/PaletteState.ts
export const COMPONENT_METADATA: Record<ComponentType, ComponentMetadata> = {
  // ... existing metadata
  [ComponentType.NEW_COMPONENT]: {
    type: ComponentType.NEW_COMPONENT,
    label: 'New Component',
    description: 'Description of new component',
    category: 'basic',
    tags: ['new', 'component'],
    usageFrequency: 50,
    difficulty: 'beginner',
  },
}
```

3. **Add to Category:**

```tsx
// components/ui/PaletteState.ts
export const DEFAULT_CATEGORIES: PaletteCategory[] = [
  {
    id: 'basic',
    // ... existing config
    components: [
      ComponentType.TEXT,
      ComponentType.BUTTON,
      ComponentType.NEW_COMPONENT,
    ],
  },
  // ... other categories
]
```

4. **Create Preview:**

```tsx
// components/ui/ComponentPreview.tsx
const getPreviewContent = (type: ComponentType, size: PreviewSize) => {
  // ... existing cases
  case ComponentType.NEW_COMPONENT:
    return (
      <div style={baseStyle}>
        <span>New</span>
      </div>
    )
}
```

### Custom Templates

```tsx
import { templateManager } from '@/utils/componentTemplates'

// Create custom template
const customTemplate = templateManager.createCustomTemplate(
  'My Custom Button',
  'A button with custom styling',
  ComponentType.BUTTON,
  {
    kind: 'button',
    url: 'https://example.com',
    label: 'Custom Button',
    fontSize: 18,
    padding: 16,
    backgroundColor: '#ff6b6b',
    textColor: '#ffffff',
    borderRadius: 10,
  },
  { width: 200, height: 50 },
  'custom',
  ['custom', 'red', 'rounded']
)

// Use template
const component = createComponentFromTemplate(customTemplate, {
  x: 100,
  y: 100,
})
```

### Theme Customization

Override CSS custom properties:

```css
.palette-panel {
  --palette-bg: #ffffff;
  --palette-border: #e5e7eb;
  --palette-text: #374151;
  --palette-text-muted: #6b7280;
  --palette-hover: #f9fafb;
  --palette-selected: #ecfdf5;
  --palette-selected-border: #059669;
  --palette-disabled: #f3f4f6;
  --palette-disabled-text: #9ca3af;
}
```

## Testing

### Unit Tests

The palette system includes comprehensive unit tests covering:

- Component rendering and behavior
- Drag-and-drop functionality
- Search and filtering
- Accessibility features
- Template system
- State management

**Running Tests:**

```bash
npm test src/__tests__/palette/
```

### Coverage Target

The test suite achieves **80%+ line coverage** across all palette components.

**Coverage Report:**

```bash
npm run test:coverage
```

### Test Structure

```
src/__tests__/palette/
├── palette-layout.test.tsx          # Layout and responsive design
├── component-preview.test.tsx       # Preview generation
├── drag-initiation.test.tsx         # Drag-and-drop functionality
├── default-properties.test.ts       # Template and property system
├── accessibility.test.tsx           # Accessibility features
├── palette-state.test.ts           # State management
└── responsive.test.tsx              # Responsive behavior
```

## Performance

### Optimization Strategies

1. **Debounced Search**: 300ms delay to prevent excessive filtering
2. **Memoized Components**: React.memo for expensive components
3. **Virtualized Scrolling**: Only render visible components
4. **Efficient State Updates**: Immutable updates with minimal re-renders
5. **Event Delegation**: Single event listener for drag operations

### Performance Monitoring

The palette includes built-in performance monitoring:

```tsx
// Performance data available during drag operations
interface DragPerformanceData {
  frameCount: number
  averageFrameTime: number
  lastFrameTime: number
  memoryUsage: number
}
```

### Best Practices

- Use `React.memo` for custom component items
- Implement proper cleanup in useEffect hooks
- Avoid unnecessary re-renders with proper dependency arrays
- Use requestAnimationFrame for smooth animations

## API Reference

### Hooks

#### usePaletteAccessibility

Provides comprehensive accessibility features for the palette.

```tsx
const accessibility = usePaletteAccessibility({
  containerId: 'palette-panel',
  onComponentAdd: handleAdd,
  onComponentSelect: handleSelect,
  onCategoryToggle: handleToggle,
  enableKeyboardDrag: true,
  enableScreenReader: true,
  enableFocusTrapping: false,
})
```

#### usePaletteDraggable

Provides drag handlers for palette components.

```tsx
const dragHandlers = usePaletteDraggable(ComponentType.TEXT)

// Returns:
// {
//   onMouseDown: (event) => void
//   onTouchStart: (event) => void
//   draggable: false
//   onDragStart: (event) => void
//   'data-draggable': 'palette'
//   'data-component-type': ComponentType
// }
```

### Utility Functions

#### filterComponentsBySearch

```tsx
const filtered = filterComponentsBySearch(components, 'button')
// Returns components matching the search query
```

#### sortComponents

```tsx
const sorted = sortComponents(components, 'alphabetical', recentComponents)
// Returns components sorted by specified order
```

#### addToRecentComponents

```tsx
const updated = addToRecentComponents(recent, ComponentType.TEXT, 10)
// Returns updated recent components list
```

#### createPaletteInteraction

```tsx
const interaction = createPaletteInteraction('drag', {
  componentType: ComponentType.TEXT,
  metadata: { position: { x: 10, y: 20 } },
})
// Returns interaction record for history tracking
```

### Template Manager

```tsx
import { templateManager } from '@/utils/componentTemplates'

// Get templates
const templates = templateManager.getAllTemplates()
const textTemplates = templateManager.getTemplatesByType(ComponentType.TEXT)
const searchResults = templateManager.searchTemplates('button')

// Create custom template
const template = templateManager.createCustomTemplate(...)

// Usage tracking
templateManager.incrementUsage(templateId)
const mostUsed = templateManager.getMostUsedTemplates(5)
```

## Error Handling

### Common Issues

1. **Drag Not Working**: Ensure proper event handlers and state management
2. **Search Not Filtering**: Check component metadata and search implementation
3. **Accessibility Issues**: Verify ARIA attributes and keyboard navigation
4. **Performance Problems**: Check for unnecessary re-renders and heavy computations

### Debug Mode

Enable debug information by setting performance monitoring in drag context:

```tsx
// Displays performance metrics during drag operations
dragContext.performanceData && (
  <div className="debug-info">
    <div>Frames: {dragContext.performanceData.frameCount}</div>
    <div>
      Avg Frame: {dragContext.performanceData.averageFrameTime.toFixed(2)}ms
    </div>
    <div>
      Memory:{' '}
      {(dragContext.performanceData.memoryUsage / 1024 / 1024).toFixed(2)}MB
    </div>
  </div>
)
```

## Browser Support

The palette system supports:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills Required

- None (uses only modern browser APIs with graceful fallbacks)

## Migration Guide

### From Previous Versions

If upgrading from a previous palette implementation:

1. Update imports to new component locations
2. Replace old drag handlers with new `usePaletteDraggable` hook
3. Update component metadata format
4. Add accessibility attributes to custom components
5. Update test files to use new testing utilities

### Breaking Changes

- Component structure has changed (requires layout updates)
- Drag event handling is now hook-based
- State management is centralized in store
- CSS class names have been updated

---

## Conclusion

The Component Palette Module provides a comprehensive, accessible, and performant solution for component selection and canvas interaction. Its modular architecture allows for easy customization while maintaining consistency and usability across the application.

For additional support or questions, refer to the test files for usage examples and implementation details.
