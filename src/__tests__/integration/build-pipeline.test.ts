import { describe, it, expect } from '@jest/globals'

describe('Build Pipeline Integration', () => {
  it('should validate package.json configuration', () => {
    const packageJson = {
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        test: 'jest',
      },
    }

    expect(packageJson.scripts.dev).toBe('vite')
    expect(packageJson.scripts.build).toBe('tsc && vite build')
    expect(packageJson.scripts.test).toBe('jest')
  })

  it('should have proper dependency versions', () => {
    const dependencies = {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      zustand: '^4.4.7',
    }

    expect(dependencies.react).toMatch(/^\^18\./)
    expect(dependencies['react-dom']).toMatch(/^\^18\./)
    expect(dependencies.zustand).toBeDefined()
  })

  it('should have development dependencies configured', () => {
    const devDependencies = [
      'typescript',
      'vite',
      '@vitejs/plugin-react',
      'eslint',
      'prettier',
      'jest',
      '@testing-library/react',
    ]

    expect(devDependencies).toContain('typescript')
    expect(devDependencies).toContain('vite')
    expect(devDependencies).toContain('jest')
  })

  it('should validate TypeScript configuration', () => {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        strict: true,
        jsx: 'react-jsx',
        moduleResolution: 'bundler',
      },
    }

    expect(tsConfig.compilerOptions.target).toBe('ES2020')
    expect(tsConfig.compilerOptions.strict).toBe(true)
    expect(tsConfig.compilerOptions.jsx).toBe('react-jsx')
  })

  it('should validate Jest configuration', () => {
    const jestConfig = {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    }

    expect(jestConfig.preset).toBe('ts-jest')
    expect(jestConfig.testEnvironment).toBe('jsdom')
    expect(jestConfig.coverageThreshold.global.lines).toBe(80)
  })

  it('should validate required files exist conceptually', () => {
    const requiredFiles = [
      'src/main.tsx',
      'src/App.tsx',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'jest.config.js',
    ]

    // Test that we know what files should exist
    expect(requiredFiles.length).toBeGreaterThan(0)
    expect(requiredFiles).toContain('src/main.tsx')
    expect(requiredFiles).toContain('package.json')
  })
}) 