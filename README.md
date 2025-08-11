# Aura No-Code Editor

A modern drag-and-drop visual content editor built with React 18+, TypeScript, and Vite.

## 🚀 Features

- **Modern Tech Stack**: React 18+ with TypeScript for type safety
- **Fast Development**: Vite for lightning-fast HMR and builds
- **State Management**: Zustand for lightweight, scalable state management
- **Styling**: CSS Modules with PostCSS for scoped, maintainable styles
- **Testing**: Jest with React Testing Library for comprehensive testing
- **Code Quality**: ESLint, Prettier, and Husky for consistent code standards
- **Three-Panel Layout**: Professional editor interface with component palette, canvas, and properties panels

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Assignment-2
```

2. Install dependencies:
```bash
npm install
```

## 🎯 Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check with TypeScript

## 🏗️ Project Structure

```
src/
├── components/
│   └── layout/
│       ├── MainLayout.tsx         # Main three-panel layout
│       ├── PalettePanel.tsx       # Left panel - component palette
│       ├── CanvasPanel.tsx        # Center panel - design canvas
│       ├── PropertiesPanel.tsx    # Right panel - component properties
│       └── *.module.css           # Component-scoped styles
├── store/
│   └── index.ts                   # Zustand store configuration
├── types/
│   ├── index.ts                   # Core TypeScript interfaces
│   └── css-modules.d.ts           # CSS modules type declarations
├── styles/
│   └── globals.css                # Global styles and CSS variables
├── __tests__/
│   ├── setup/                     # Setup and configuration tests
│   └── integration/               # Integration tests
├── App.tsx                        # Main app component
└── main.tsx                       # Application entry point
```

## 🎨 Architecture

### Three-Panel Layout
- **Left Panel (20%)**: Component palette for drag-and-drop components
- **Center Panel (60%)**: Main design canvas
- **Right Panel (20%)**: Properties editor for selected components

### State Management
- Zustand for lightweight state management
- Redux DevTools integration for debugging
- Persistent state for layout preferences and components

### Styling System
- CSS Modules for component-scoped styles
- CSS custom properties for design tokens
- PostCSS with Autoprefixer for cross-browser compatibility
- Dark mode support with CSS media queries

## 🧪 Testing

The project includes comprehensive testing with:
- **Unit Tests**: Component rendering, state management, utilities
- **Integration Tests**: Build pipeline, development server
- **Coverage Target**: 80% line coverage
- **Test Files**: Located in `src/__tests__/`

Run tests:
```bash
npm test                 # Run all tests
npm run test:coverage    # Run with coverage report
npm run test:watch       # Watch mode for development
```

## 🔧 Development Workflow

1. **Code Standards**: Pre-commit hooks ensure code quality
2. **Type Safety**: Strict TypeScript configuration
3. **Hot Reloading**: Instant feedback during development
4. **Path Aliases**: Clean imports with `@/` prefix
5. **CSS Modules**: Scoped styling prevents conflicts

## 📱 Responsive Design

The layout adapts to different screen sizes:
- **Desktop**: Three-panel horizontal layout
- **Tablet**: Stacked panels with adjusted proportions
- **Mobile**: Vertical stacking with touch-friendly controls

## 🚀 Production Build

Create optimized production build:
```bash
npm run build
```

Features:
- Tree shaking for minimal bundle size
- Code splitting for better performance
- Source maps for debugging
- Asset optimization and compression

## 🎯 Task Completion Status

✅ **TASK-001 COMPLETED**: Project Foundation & Development Environment Setup

- [x] React 18+ TypeScript project initialization
- [x] Vite build system configuration with HMR
- [x] Zustand state management setup
- [x] CSS Modules and PostCSS configuration
- [x] Development tooling (ESLint, Prettier, Husky)
- [x] Testing framework (Jest, React Testing Library)
- [x] Three-panel layout shell implementation
- [x] Comprehensive test suite structure

## 🔮 Next Steps

This foundation is ready for implementing:
- Drag-and-drop functionality
- Component library integration
- Visual property editors
- Canvas interaction system
- Export/import capabilities

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for the Aura No-Code Editor project. 