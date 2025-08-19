# Aura NoCode Editor - Project Structure

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Core Application Structure](#core-application-structure)
4. [Configuration Files](#configuration-files)
5. [Documentation](#documentation)
6. [Testing Architecture](#testing-architecture)
7. [Build and Development](#build-and-development)
8. [File Naming Conventions](#file-naming-conventions)
9. [Import/Export Patterns](#importexport-patterns)

## Overview

The Aura NoCode Editor follows a well-organized, modular structure that promotes maintainability, scalability, and clear separation of concerns. The project is built with modern web technologies and follows industry best practices for React/TypeScript applications.

**Key Organizational Principles:**

- **Feature-based organization** in components
- **Layered architecture** with clear boundaries
- **Consistent naming conventions** throughout
- **Comprehensive testing** alongside source code
- **Centralized configuration** files

## Directory Structure

```
Assignment-2/
├── 📁 src/                          # Source code
│   ├── 📁 components/               # React components organized by type
│   ├── 📁 hooks/                    # Custom React hooks
│   ├── 📁 services/                 # Business logic and data services
│   ├── 📁 store/                    # State management (Zustand)
│   ├── 📁 types/                    # TypeScript type definitions
│   ├── 📁 utils/                    # Utility functions and helpers
│   ├── 📁 styles/                   # Global styles and CSS
│   ├── 📁 assets/                   # Static assets
│   ├── 📁 __tests__/                # Test files organized by feature
│   ├── 📁 __mocks__/                # Mock implementations for testing
│   ├── 📄 App.tsx                   # Main application component
│   ├── 📄 main.tsx                  # Application entry point
│   ├── 📄 setupTests.ts             # Test configuration
│   └── 📄 vite-env.d.ts             # Vite environment types
├── 📁 public/                       # Static public assets
├── 📁 docs/                         # Project documentation
├── 📁 tasks/                        # Task management and tracking
├── 📁 coverage/                     # Test coverage reports
├── 📄 package.json                  # Project dependencies and scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 vite.config.ts                # Vite build configuration
├── 📄 jest.config.js                # Jest testing configuration
├── 📄 .eslintrc.cjs                 # ESLint configuration
├── 📄 postcss.config.js             # PostCSS configuration
├── 📄 README.md                     # Project overview and setup
├── 📄 ARCHITECTURE.md               # Detailed architecture documentation
└── 📄 CHAT_HISTORY_TEMPLATE.md     # Development process documentation
```

## Core Application Structure

### `/src` - Main Source Directory

#### 📁 `/src/components` - React Components

Organized by component type and responsibility:

```
components/
├── 📁 debug/                        # Development and debugging components
│   ├── CanvasDebug.tsx             # Canvas state visualization
│   └── StoreDebug.tsx              # Store state debugging panel
├── 📁 layout/                       # Layout and structural components
│   ├── MainLayout.tsx              # Root layout component
│   ├── MainLayout.module.css       # Layout-specific styles
│   ├── CanvasPanel.tsx             # Main editing canvas
│   ├── CanvasPanel.module.css      # Canvas styling
│   ├── PalettePanel.tsx            # Component palette/library
│   ├── PropertiesPanel.tsx         # Property editing panel
│   └── Panel.module.css            # Shared panel styles
└── 📁 ui/                          # Reusable UI components
    ├── ComponentPaletteItem.tsx    # Individual palette items
    ├── ComponentPreview.tsx        # Component preview functionality
    ├── ComponentRenderer.tsx       # Renders canvas components
    ├── InlineTextEditor.tsx        # In-place text editing
    ├── InlineTextEditor.module.css # Text editor styles
    ├── PaletteCategory.tsx         # Component category grouping
    ├── PaletteState.ts             # Palette state management
    ├── PreviewModal.tsx            # Full preview modal
    ├── PreviewModal.module.css     # Preview modal styles
    ├── ProjectManager.tsx          # Project management interface
    ├── ProjectManager.module.css   # Project manager styles
    ├── PropertiesForm.tsx          # Dynamic property forms
    ├── PropertiesForm.module.css   # Property form styles
    ├── SaveStatusIndicator.tsx     # Save status display
    ├── SaveStatusIndicator.module.css # Save indicator styles
    ├── 📁 controls/                # Form control components
    │   ├── ButtonGroup.tsx         # Button group control
    │   ├── ColorPicker.tsx         # Color selection control
    │   ├── Controls.module.css     # Control styles
    │   ├── Dropdown.tsx            # Dropdown selection control
    │   ├── Slider.tsx              # Range slider control
    │   └── index.ts                # Control exports
    └── index.ts                    # UI component exports
```

**Component Organization Strategy:**

- **`debug/`**: Development-only components for state inspection
- **`layout/`**: Structural components that define the application layout
- **`ui/`**: Reusable, composable UI components
- **`controls/`**: Form controls and input components

#### 📁 `/src/hooks` - Custom React Hooks

Encapsulated logic for reusability:

```
hooks/
├── useDebounce.ts                  # Debouncing utility hook
├── useDragAndDrop.ts               # Drag and drop functionality
├── useKeyboardShortcuts.ts         # Keyboard interaction handling
└── usePaletteAccessibility.ts      # Accessibility features for palette
```

**Hook Categories:**

- **Performance**: `useDebounce` for optimizing rapid updates
- **Interaction**: `useDragAndDrop` for complex drag operations
- **UX**: `useKeyboardShortcuts` and accessibility hooks

#### 📁 `/src/services` - Business Logic Layer

Service-oriented architecture for data and business logic:

```
services/
├── 📁 interfaces/                  # Service interfaces and contracts
│   ├── index.ts                    # Interface exports
│   ├── IPersistenceService.ts      # Persistence service contract
│   ├── IProjectManager.ts          # Project management contract
│   ├── ISerializationService.ts    # Serialization service contract
│   └── IStorageManager.ts          # Storage service contract
└── 📁 storage/                     # Storage implementation
    ├── index.ts                    # Storage service exports
    ├── PersistenceService.ts       # High-level persistence operations
    ├── SerializationService.ts     # Data serialization handling
    └── StorageManager.ts           # Low-level storage operations
```

**Service Layer Benefits:**

- **Interface-based design** for easy testing and mocking
- **Separation of concerns** between data access and business logic
- **Dependency injection** ready for future enhancements

#### 📁 `/src/store` - State Management

Centralized state management with Zustand:

```
store/
├── index.ts                        # Main store implementation
├── index-broken.ts                 # Backup/alternative store version
└── working-index.ts                # Working store backup
```

**Store Architecture:**

- **Single store** with logical state slices
- **Performance-optimized** selectors
- **Type-safe** actions and state access

#### 📁 `/src/types` - Type Definitions

Comprehensive TypeScript type system:

```
types/
├── index.ts                        # Main type exports
├── css-modules.d.ts                # CSS modules type declarations
└── jsx.d.ts                        # JSX type extensions
```

**Type Categories:**

- **Component types**: BaseComponent, ComponentType, Properties
- **State types**: Store state interfaces and slices
- **Service types**: API contracts and data structures

#### 📁 `/src/utils` - Utility Functions

Pure functions and helper utilities:

```
utils/
├── componentFactory.ts             # Component creation utilities
├── componentTemplates.ts           # Default component templates
├── componentUtils.ts               # Component manipulation helpers
├── dragSystem.ts                   # Drag and drop utilities
├── formGeneration.ts               # Dynamic form generation
├── htmlExport.ts                   # HTML export functionality
├── performanceUtils.ts             # Performance monitoring utilities
└── propertyValidation.ts           # Property validation logic
```

**Utility Categories:**

- **Component Management**: Factory, templates, utilities
- **Interaction**: Drag system, form generation
- **Export/Import**: HTML generation, validation
- **Performance**: Monitoring and optimization utilities

## Configuration Files

### Build and Development Configuration

```
├── 📄 vite.config.ts               # Vite bundler configuration
│   ├── React plugin setup
│   ├── TypeScript configuration
│   ├── CSS processing
│   └── Development server settings
├── 📄 tsconfig.json                # TypeScript compiler options
│   ├── Strict type checking
│   ├── Path mapping (@/ alias)
│   ├── ESM module resolution
│   └── React JSX configuration
└── 📄 tsconfig.node.json           # Node.js TypeScript config
```

### Code Quality Configuration

```
├── 📄 .eslintrc.cjs                # ESLint code quality rules
│   ├── TypeScript-specific rules
│   ├── React best practices
│   ├── Performance optimizations
│   └── Code style enforcement
├── 📄 postcss.config.js            # CSS processing pipeline
│   ├── Autoprefixer for browser compatibility
│   ├── CSS optimization
│   └── Modern CSS feature support
└── 📄 package.json                 # Project metadata and scripts
    ├── Development dependencies
    ├── Production dependencies
    ├── Build and test scripts
    └── Lint-staged configuration
```

### Testing Configuration

```
├── 📄 jest.config.js               # Main Jest configuration
│   ├── TypeScript transformation
│   ├── CSS modules handling
│   ├── Coverage reporting
│   └── Test environment setup
└── 📄 jest.drag-drop.config.js     # Specialized drag-drop testing
    ├── Performance testing setup
    ├── Interaction testing
    └── Integration test configuration
```

## Documentation

### Project Documentation Structure

```
├── 📄 README.md                    # Project overview and setup guide
├── 📄 ARCHITECTURE.md              # Detailed architecture documentation
├── 📄 CHAT_HISTORY_TEMPLATE.md     # Development process template
├── 📄 DESIGN_REVIEW.md             # Design decisions and reviews
├── 📄 Technical_PRD_Aura_NoCode_Editor.md # Product requirements
├── 📄 PRD_Aura_NoCode_Editor.md    # Original product specification
└── 📁 docs/                        # Additional documentation
    └── PALETTE_MODULE_GUIDE.md     # Component palette documentation
```

### Task Management

```
📁 tasks/
├── README.md                       # Task management overview
├── TASK_TRACKER.md                 # Progress tracking
├── task-001.md                     # Individual task documentation
├── task-002.md                     # Component system implementation
├── task-003.md                     # Drag and drop system
├── task-004.md                     # Testing implementation
├── task-005.md                     # Property system
├── task-006.md                     # Persistence layer
├── task-007.md                     # UI/UX improvements
├── task-008.md                     # Performance optimization
├── task-009.md                     # Export functionality
├── task-010.md                     # Accessibility features
├── task-011.md                     # Error handling
├── task-012.md                     # Documentation
└── task-013.md                     # Final integration
```

## Testing Architecture

### Test Organization Strategy

```
📁 __tests__/
├── 📁 components/                  # Component testing
│   ├── App.test.tsx               # Main app component tests
│   ├── CanvasPanel.test.tsx       # Canvas functionality tests
│   ├── ComponentRenderer.test.tsx  # Component rendering tests
│   ├── PropertiesForm.test.tsx    # Property form tests
│   └── 📁 layout/                 # Layout component tests
├── 📁 hooks/                      # Custom hook testing
│   └── useDragAndDrop.test.tsx    # Drag and drop hook tests
├── 📁 integration/                # Integration testing
│   ├── drag-drop-integration.test.tsx    # End-to-end drag tests
│   ├── persistence-integration.test.ts   # Storage integration tests
│   └── storage-integration.test.ts       # Data flow tests
├── 📁 services/                   # Service layer testing
├── 📁 store/                      # State management testing
│   ├── store.test.ts              # Store functionality tests
│   └── history-undo-redo.test.ts  # Undo/redo system tests
├── 📁 utils/                      # Utility function testing
└── 📁 performance/                # Performance testing
    └── drag-performance.test.ts   # Drag operation performance
```

### Mock Organization

```
📁 __mocks__/
├── localStorage.ts                 # LocalStorage mock
├── persistenceService.ts          # Service mocking
├── store.ts                       # Store state mocking
└── useDragAndDrop.ts              # Hook mocking
```

## Build and Development

### Scripts and Commands

```json
{
  "scripts": {
    "dev": "vite", // Development server
    "build": "tsc && vite build", // Production build
    "preview": "vite preview", // Preview built app
    "test": "jest", // Run all tests
    "test:watch": "jest --watch", // Watch mode testing
    "test:coverage": "jest --coverage", // Coverage reporting
    "lint": "eslint . --ext ts,tsx", // Code linting
    "lint:fix": "eslint . --ext ts,tsx --fix", // Auto-fix lint issues
    "format": "prettier --write", // Code formatting
    "type-check": "tsc --noEmit" // Type checking only
  }
}
```

### Development Workflow

1. **Development**: `npm run dev` - Hot reload development server
2. **Testing**: `npm run test:watch` - Continuous testing
3. **Code Quality**: `npm run lint` - Code quality checks
4. **Type Safety**: `npm run type-check` - TypeScript validation
5. **Build**: `npm run build` - Production build
6. **Preview**: `npm run preview` - Test production build

## File Naming Conventions

### Component Files

- **React Components**: `PascalCase.tsx` (e.g., `ComponentRenderer.tsx`)
- **CSS Modules**: `PascalCase.module.css` (e.g., `MainLayout.module.css`)
- **Component Tests**: `PascalCase.test.tsx` (e.g., `CanvasPanel.test.tsx`)

### Utility and Service Files

- **Services**: `PascalCase.ts` (e.g., `PersistenceService.ts`)
- **Utilities**: `camelCase.ts` (e.g., `componentFactory.ts`)
- **Types**: `camelCase.ts` or descriptive names (e.g., `index.ts`)
- **Hooks**: `camelCase.ts` starting with 'use' (e.g., `useDragAndDrop.ts`)

### Configuration Files

- **Config files**: `lowercase.config.js` (e.g., `jest.config.js`)
- **TypeScript config**: `tsconfig*.json`
- **Package management**: `package.json`, `package-lock.json`

## Import/Export Patterns

### Centralized Exports

```typescript
// src/components/ui/index.ts - Centralized component exports
export { ComponentRenderer } from './ComponentRenderer'
export { ComponentPreview } from './ComponentPreview'
export { PropertiesForm } from './PropertiesForm'

// src/services/index.ts - Service layer exports
export { PersistenceService } from './storage/PersistenceService'
export { StorageManager } from './storage/StorageManager'
```

### Path Mapping

```typescript
// Using @/ alias for clean imports
import { ComponentFactory } from '@/utils/componentFactory'
import { useComponents } from '@/store'
import { BaseComponent } from '@/types'
```

### Import Organization

```typescript
// 1. External library imports
import React, { useState, useCallback } from 'react'
import { create } from 'zustand'

// 2. Internal imports (services, utilities)
import { PersistenceService } from '@/services'
import { ComponentFactory } from '@/utils/componentFactory'

// 3. Type imports
import type { BaseComponent, ComponentType } from '@/types'

// 4. Relative imports (same directory)
import styles from './Component.module.css'
```

## Key Architectural Benefits

### Maintainability

- **Clear separation of concerns** with distinct directories for different responsibilities
- **Consistent naming conventions** make navigation predictable
- **Comprehensive testing** ensures code reliability

### Scalability

- **Modular component organization** allows easy feature additions
- **Service layer abstraction** enables easy backend integration
- **Type-safe interfaces** prevent integration issues

### Developer Experience

- **Logical file organization** reduces cognitive load
- **Centralized exports** simplify imports
- **Comprehensive configuration** handles all development needs

### Performance

- **Lazy loading ready** structure supports code splitting
- **Optimized build configuration** ensures minimal bundle size
- **Performance testing** built into the testing strategy

---

## Future Enhancements

The current structure is designed to support:

- **Plugin System**: New components can be easily added to the component system
- **Micro-frontend Architecture**: Clear boundaries allow for future splitting
- **Internationalization**: Structure supports i18n file organization
- **Design System**: Component organization ready for design token integration
- **Advanced Testing**: Structure supports visual regression testing and E2E testing

---

_This structure represents a mature, production-ready React application with comprehensive testing, documentation, and development tooling._
