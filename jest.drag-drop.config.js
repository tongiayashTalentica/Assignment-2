/**
 * Jest Configuration for Task-004 Drag-and-Drop Testing
 * Focused coverage and performance monitoring for drag-drop functionality
 */

module.exports = {
  // Extend base Jest configuration
  ...require('./jest.config.js'),

  // Test match patterns for drag-and-drop specific tests
  testMatch: [
    '<rootDir>/src/__tests__/hooks/useDragAndDrop.test.tsx',
    '<rootDir>/src/__tests__/components/ComponentRenderer.drag.test.tsx',
    '<rootDir>/src/__tests__/components/PalettePanel.drag.test.tsx',
    '<rootDir>/src/__tests__/components/CanvasPanel.drop.test.tsx',
    '<rootDir>/src/__tests__/integration/drag-drop-integration.test.tsx',
    '<rootDir>/src/__tests__/performance/drag-performance.test.ts',
  ],

  // Coverage collection for drag-drop components only
  collectCoverageFrom: [
    'src/hooks/useDragAndDrop.ts',
    'src/components/ui/ComponentRenderer.tsx',
    'src/components/layout/PalettePanel.tsx',
    'src/components/layout/CanvasPanel.tsx',
    'src/store/simple.ts', // Include store drag actions
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__mocks__/**',
  ],

  // Strict coverage thresholds for Task-004
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical drag-drop files
    'src/hooks/useDragAndDrop.ts': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    'src/components/ui/ComponentRenderer.tsx': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test environment setup for drag-drop testing
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/drag-drop-setup.ts',
  ],

  // Performance testing configuration
  testTimeout: 10000, // Allow up to 10s for performance tests

  // Coverage reporting
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage/drag-drop',

  // Collect coverage
  collectCoverage: true,

  // Verbose output for debugging
  verbose: true,

  // Test result processor for performance metrics
  testResultsProcessor: '<rootDir>/src/__tests__/utils/performance-processor.js',
}
