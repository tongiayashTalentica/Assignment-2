import { useCallback, useEffect, useRef } from 'react'

/**
 * Custom hook for debouncing function calls
 * Ensures that rapid successive calls are batched into a single call
 * after the specified delay
 */
export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay]
  )

  return debouncedCallback
}

/**
 * Hook for debouncing values (useful for search inputs, etc.)
 */
export const useDebounceValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timeout)
    }
  }, [value, delay])

  return debouncedValue
}

// Need to import useState
import { useState } from 'react'

/**
 * Hook for property updates with optimistic UI and debouncing
 * Provides immediate visual feedback while batching actual updates
 */
export const useOptimisticPropertyUpdate = <T>(
  initialValue: T,
  onUpdate: (value: T) => void,
  delay: number = 300
) => {
  const [optimisticValue, setOptimisticValue] = useState(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)

  const debouncedUpdate = useDebounce((value: T) => {
    onUpdate(value)
    setIsUpdating(false)
  }, delay)

  const updateValue = useCallback(
    (newValue: T) => {
      // Immediate UI update (optimistic)
      setOptimisticValue(newValue)
      setIsUpdating(true)

      // Debounced actual update
      debouncedUpdate(newValue)
    },
    [debouncedUpdate]
  )

  // Update optimistic value when initial value changes (from external source)
  useEffect(() => {
    if (!isUpdating) {
      setOptimisticValue(initialValue)
    }
  }, [initialValue, isUpdating])

  return {
    value: optimisticValue,
    updateValue,
    isUpdating,
  }
}

/**
 * Hook for batching multiple property updates
 * Useful when updating multiple related properties
 */
export const useBatchedPropertyUpdates = <T extends Record<string, unknown>>(
  initialProps: T,
  onUpdate: (props: Partial<T>) => void,
  delay: number = 300
) => {
  const [optimisticProps, setOptimisticProps] = useState(initialProps)
  const [pendingUpdates, setPendingUpdates] = useState<Partial<T>>({})
  const [isUpdating, setIsUpdating] = useState(false)

  const debouncedUpdate = useDebounce((updates: Partial<T>) => {
    onUpdate(updates)
    setPendingUpdates({})
    setIsUpdating(false)
  }, delay)

  const updateProperty = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      // Immediate UI update (optimistic)
      setOptimisticProps(prev => ({ ...prev, [key]: value }))

      // Track pending updates
      const newUpdates = { ...pendingUpdates, [key]: value }
      setPendingUpdates(newUpdates)
      setIsUpdating(true)

      // Debounced batch update
      debouncedUpdate(newUpdates)
    },
    [debouncedUpdate, pendingUpdates]
  )

  const updateProperties = useCallback(
    (updates: Partial<T>) => {
      // Immediate UI update (optimistic)
      setOptimisticProps(prev => ({ ...prev, ...updates }))

      // Track pending updates
      const newUpdates = { ...pendingUpdates, ...updates }
      setPendingUpdates(newUpdates)
      setIsUpdating(true)

      // Debounced batch update
      debouncedUpdate(newUpdates)
    },
    [debouncedUpdate, pendingUpdates]
  )

  // Update optimistic props when initial props change (from external source)
  useEffect(() => {
    if (!isUpdating) {
      setOptimisticProps(initialProps)
    }
  }, [initialProps, isUpdating])

  return {
    props: optimisticProps,
    updateProperty,
    updateProperties,
    isUpdating,
    pendingUpdates,
  }
}

/**
 * Performance monitoring hook for property updates
 * Tracks update frequency and performance metrics
 */
export const usePropertyUpdatePerformance = () => {
  const metricsRef = useRef({
    updateCount: 0,
    totalTime: 0,
    maxTime: 0,
    minTime: Infinity,
    lastUpdate: 0,
  })

  const recordUpdate = useCallback((startTime: number) => {
    const endTime = performance.now()
    const duration = endTime - startTime

    const metrics = metricsRef.current
    metrics.updateCount++
    metrics.totalTime += duration
    metrics.maxTime = Math.max(metrics.maxTime, duration)
    metrics.minTime = Math.min(metrics.minTime, duration)
    metrics.lastUpdate = endTime

    // Log performance warning if update takes too long
    if (duration > 100) {
      // 100ms threshold as per requirements
      console.warn(
        `Property update took ${duration.toFixed(2)}ms, exceeding 100ms threshold`
      )
    }
  }, [])

  const getMetrics = useCallback(() => {
    const metrics = metricsRef.current
    return {
      updateCount: metrics.updateCount,
      averageTime:
        metrics.updateCount > 0 ? metrics.totalTime / metrics.updateCount : 0,
      maxTime: metrics.maxTime === 0 ? 0 : metrics.maxTime,
      minTime: metrics.minTime === Infinity ? 0 : metrics.minTime,
      lastUpdate: metrics.lastUpdate,
    }
  }, [])

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      updateCount: 0,
      totalTime: 0,
      maxTime: 0,
      minTime: Infinity,
      lastUpdate: 0,
    }
  }, [])

  return {
    recordUpdate,
    getMetrics,
    resetMetrics,
  }
}
