import { BaseComponent, PerformanceMetrics } from '@/types'

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {
    stateUpdateTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    historySize: 0,
  }

  private measurements: Map<string, number> = new Map()
  private observers: ((metrics: PerformanceMetrics) => void)[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startMeasurement(key: string): void {
    this.measurements.set(key, performance.now())
  }

  endMeasurement(key: string): number {
    const startTime = this.measurements.get(key)
    if (startTime === undefined) {
      // eslint-disable-next-line no-console
      console.warn(`No start measurement found for key: ${key}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.measurements.delete(key)
    return duration
  }

  updateMetrics(updates: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...updates }
    this.notifyObservers()
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.metrics))
  }

  measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (
        performance as unknown as { memory: { usedJSHeapSize: number } }
      ).memory
      return memInfo.usedJSHeapSize / (1024 * 1024) // Convert to MB
    }
    return 0
  }

  reset(): void {
    this.metrics = {
      stateUpdateTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      componentCount: 0,
      historySize: 0,
    }
    this.measurements.clear()
    this.notifyObservers()
  }
}

// Performance optimization utilities
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Batch update utilities
export class BatchProcessor<T> {
  private queue: T[] = []
  private isProcessing = false
  private processor: (items: T[]) => Promise<void>
  private batchSize: number
  private delay: number

  constructor(
    processor: (items: T[]) => Promise<void>,
    batchSize = 10,
    delay = 16 // ~60fps
  ) {
    this.processor = processor
    this.batchSize = batchSize
    this.delay = delay
  }

  add(item: T): void {
    this.queue.push(item)
    this.scheduleProcess()
  }

  addBatch(items: T[]): void {
    this.queue.push(...items)
    this.scheduleProcess()
  }

  private scheduleProcess(): void {
    if (this.isProcessing) return

    this.isProcessing = true
    setTimeout(() => this.process(), this.delay)
  }

  private async process(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false
      return
    }

    const batch = this.queue.splice(0, this.batchSize)

    try {
      await this.processor(batch)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Batch processing error:', error)
    }

    // Continue processing if there are more items
    if (this.queue.length > 0) {
      setTimeout(() => this.process(), this.delay)
    } else {
      this.isProcessing = false
    }
  }

  clear(): void {
    this.queue = []
    this.isProcessing = false
  }

  getQueueSize(): number {
    return this.queue.length
  }
}

// Component performance analysis
export const analyzeComponentPerformance = (
  components: Map<string, BaseComponent>
): {
  totalComponents: number
  averageComplexity: number
  complexComponents: BaseComponent[]
  memoryEstimate: number
} => {
  const componentArray = Array.from(components.values())
  const complexities = componentArray.map(calculateComponentComplexity)

  const totalComponents = componentArray.length
  const averageComplexity =
    complexities.reduce((sum, c) => sum + c, 0) / totalComponents || 0
  const complexComponents = componentArray
    .filter(component => calculateComponentComplexity(component) > 5)
    .sort(
      (a, b) =>
        calculateComponentComplexity(b) - calculateComponentComplexity(a)
    )

  // Rough memory estimate (bytes per component)
  const baseComponentSize = 1000 // Base size in bytes
  const memoryEstimate = componentArray.reduce((total, component) => {
    const complexity = calculateComponentComplexity(component)
    const propSize = JSON.stringify(component.props).length * 2 // UTF-16
    return total + baseComponentSize + complexity * 100 + propSize
  }, 0)

  return {
    totalComponents,
    averageComplexity: Math.round(averageComplexity * 10) / 10,
    complexComponents,
    memoryEstimate,
  }
}

const calculateComponentComplexity = (component: BaseComponent): number => {
  let complexity = 1

  // Add complexity based on props
  complexity += Object.keys(component.props).length * 0.1

  // Add complexity based on children
  if (component.children) {
    complexity += component.children.length * 0.5
  }

  return Math.round(complexity * 10) / 10
}

// State update optimization
export const optimizeStateUpdates = (updates: Array<() => void>): void => {
  // Batch updates in a single frame
  if (updates.length === 0) return

  requestAnimationFrame(() => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.startMeasurement('batch-update')

    updates.forEach(update => update())

    const duration = monitor.endMeasurement('batch-update')
    monitor.updateMetrics({ stateUpdateTime: duration })
  })
}

// Memory management utilities
export const createMemoryTracker = () => {
  const monitor = PerformanceMonitor.getInstance()
  let lastMemoryUsage = 0

  return {
    track: () => {
      const currentUsage = monitor.measureMemoryUsage()
      const delta = currentUsage - lastMemoryUsage
      lastMemoryUsage = currentUsage

      monitor.updateMetrics({ memoryUsage: currentUsage })

      return {
        current: currentUsage,
        delta,
        formatted: `${currentUsage.toFixed(2)} MB`,
      }
    },

    checkForLeaks: (threshold = 50) => {
      const usage = monitor.measureMemoryUsage()
      return usage > threshold
    },
  }
}

// Performance-aware selectors
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  let lastInput: T
  let lastOutput: R
  let hasResult = false

  return (input: T): R => {
    if (!hasResult || !shallowEqual(input, lastInput)) {
      lastInput = input
      lastOutput = selector(input)
      hasResult = true
    } else if (equalityFn && !equalityFn(lastOutput, selector(input))) {
      lastOutput = selector(input)
    }

    return lastOutput
  }
}

const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false
  }

  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key) || objA[key] !== objB[key]) {
      return false
    }
  }

  return true
}

// Component update batching
export class ComponentUpdateBatcher {
  private pendingUpdates = new Map<string, Partial<BaseComponent>>()
  private batchProcessor: BatchProcessor<{
    id: string
    updates: Partial<BaseComponent>
  }>

  constructor(
    private updateFunction: (
      id: string,
      updates: Partial<BaseComponent>
    ) => void,
    batchSize = 20,
    delay = 16
  ) {
    this.batchProcessor = new BatchProcessor(
      this.processBatch.bind(this),
      batchSize,
      delay
    )
  }

  scheduleUpdate(id: string, updates: Partial<BaseComponent>): void {
    // Merge with any existing pending updates for this component
    const existing = this.pendingUpdates.get(id) || {}
    const merged = { ...existing, ...updates }

    this.pendingUpdates.set(id, merged)
    this.batchProcessor.add({ id, updates: merged })
  }

  private async processBatch(
    batch: Array<{ id: string; updates: Partial<BaseComponent> }>
  ): Promise<void> {
    const monitor = PerformanceMonitor.getInstance()
    monitor.startMeasurement('component-batch-update')

    // Process unique components only (latest updates win)
    const uniqueUpdates = new Map<string, Partial<BaseComponent>>()

    for (const { id, updates } of batch) {
      uniqueUpdates.set(id, updates)
      this.pendingUpdates.delete(id)
    }

    // Apply all updates
    for (const [id, updates] of uniqueUpdates) {
      this.updateFunction(id, updates)
    }

    const duration = monitor.endMeasurement('component-batch-update')
    monitor.updateMetrics({ stateUpdateTime: duration })
  }

  flush(): void {
    // Force immediate processing of all pending updates
    const pending = Array.from(this.pendingUpdates.entries()).map(
      ([id, updates]) => ({
        id,
        updates,
      })
    )

    this.pendingUpdates.clear()
    this.batchProcessor.clear()

    if (pending.length > 0) {
      this.processBatch(pending)
    }
  }
}

// Performance warning system
export const createPerformanceWarningSystem = () => {
  const monitor = PerformanceMonitor.getInstance()
  const thresholds = {
    stateUpdateTime: 100, // ms
    renderTime: 16, // ms (60fps)
    memoryUsage: 100, // MB
    componentCount: 1000,
  }

  const warnings: string[] = []

  monitor.subscribe(metrics => {
    warnings.length = 0 // Clear previous warnings

    if (metrics.stateUpdateTime > thresholds.stateUpdateTime) {
      warnings.push(
        `Slow state update: ${metrics.stateUpdateTime.toFixed(2)}ms (threshold: ${thresholds.stateUpdateTime}ms)`
      )
    }

    if (metrics.renderTime > thresholds.renderTime) {
      warnings.push(
        `Slow render: ${metrics.renderTime.toFixed(2)}ms (threshold: ${thresholds.renderTime}ms)`
      )
    }

    if (metrics.memoryUsage > thresholds.memoryUsage) {
      warnings.push(
        `High memory usage: ${metrics.memoryUsage.toFixed(2)}MB (threshold: ${thresholds.memoryUsage}MB)`
      )
    }

    if (metrics.componentCount > thresholds.componentCount) {
      warnings.push(
        `High component count: ${metrics.componentCount} (threshold: ${thresholds.componentCount})`
      )
    }

    if (warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('Performance warnings:', warnings)
    }
  })

  return {
    getWarnings: () => [...warnings],
    setThresholds: (newThresholds: Partial<typeof thresholds>) => {
      Object.assign(thresholds, newThresholds)
    },
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()
export const memoryTracker = createMemoryTracker()
export const performanceWarnings = createPerformanceWarningSystem()
