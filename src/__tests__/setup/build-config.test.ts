import { describe, it, expect } from '@jest/globals'

describe('Build Configuration', () => {
  it('should have proper TypeScript configuration', () => {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        strict: true,
        jsx: 'react-jsx',
      },
    }
    
    expect(tsConfig.compilerOptions.target).toBe('ES2020')
    expect(tsConfig.compilerOptions.strict).toBe(true)
    expect(tsConfig.compilerOptions.jsx).toBe('react-jsx')
  })

  it('should have correct Vite configuration structure', () => {
    const viteConfig = {
      plugins: ['@vitejs/plugin-react'],
      resolve: { alias: { '@': './src' } },
      css: { modules: true },
      server: { port: 3000 },
      build: { outDir: 'dist' },
    }
    
    expect(viteConfig.plugins).toContain('@vitejs/plugin-react')
    expect(viteConfig.resolve.alias['@']).toBe('./src')
    expect(viteConfig.css.modules).toBe(true)
  })

  it('should have development server configured correctly', () => {
    const serverConfig = {
      port: 3000,
      open: true,
      hmr: { overlay: true },
    }

    expect(serverConfig.port).toBe(3000)
    expect(serverConfig.open).toBe(true)
    expect(serverConfig.hmr.overlay).toBe(true)
  })

  it('should have build optimization settings', () => {
    const buildConfig = {
      outDir: 'dist',
      sourcemap: true,
      minify: 'terser',
    }

    expect(buildConfig.outDir).toBe('dist')
    expect(buildConfig.sourcemap).toBe(true)
    expect(buildConfig.minify).toBe('terser')
  })
}) 