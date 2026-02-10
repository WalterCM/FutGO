import React, { memo, useMemo, useCallback } from 'react'

// Performance utilities
export const memoWithComparison = (Component, areEqual) => {
  return memo(Component, areEqual)
}

// Common comparison functions
export const compareProps = (prevProps, nextProps) => {
  const keys = Object.keys(prevProps)
  for (const key of keys) {
    if (prevProps[key] !== nextProps[key]) {
      return false
    }
  }
  return true
}

export const compareShallowProps = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)
  
  if (prevKeys.length !== nextKeys.length) {
    return false
  }
  
  return prevKeys.every(key => prevProps[key] === nextProps[key])
}

// Custom hook for expensive calculations
export const useExpensiveCalculation = (data, calculationFn, deps = []) => {
  return useMemo(() => {
    return calculationFn(data)
  }, [data, calculationFn, ...deps])
}

// Custom hook for debounced callbacks
export const useDebouncedCallback = (callback, delay) => {
  const debouncedRef = React.useRef()

  return useCallback((...args) => {
    if (debouncedRef.current) {
      clearTimeout(debouncedRef.current)
    }
    
    debouncedRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

// Custom hook for stable object references
export const useStableObject = (obj) => {
  const objStr = useMemo(() => JSON.stringify(obj), [obj])
  return useMemo(() => obj, [objStr])
}

// Performance monitoring utilities
export const withPerformanceLogging = (Component, componentName) => {
  const WrappedComponent = memo((props) => {
    const startTime = React.useRef(Date.now())
    
    React.useEffect(() => {
      const endTime = Date.now()
      console.log(`${componentName} render time: ${endTime - startTime.current}ms`)
    })
    
    return <Component {...props} />
  })
  
  WrappedComponent.displayName = `withPerformanceLogging(${componentName})`
  return WrappedComponent
}

// Optimized event handlers
export const createOptimizedHandlers = (handlers) => {
  const optimized = {}
  
  Object.entries(handlers).forEach(([key, handler]) => {
    optimized[key] = useCallback(handler, handler.deps || [])
  })
  
  return optimized
}