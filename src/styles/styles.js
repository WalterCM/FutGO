// CSS-in-JS utility functions for consistent styling
export const createStyleVariants = (base, variants) => {
  return (variant = 'default', overrides = {}) => ({
    ...base,
    ...variants[variant],
    ...overrides
  })
}

// Common style patterns
export const styles = {
  // Card styles
  card: {
    base: {
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    premium: {
      background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--card-hover) 100%)',
      border: '1px solid var(--primary)',
      boxShadow: '0 4px 16px rgba(var(--primary-rgb), 0.2)'
    },
    compact: {
      padding: '1rem',
      borderRadius: '8px'
    }
  },

  // Button styles
  button: {
    base: {
      border: 'none',
      borderRadius: '8px',
      padding: '0.75rem 1.5rem',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      textDecoration: 'none'
    },
    primary: {
      background: 'var(--primary)',
      color: 'white'
    },
    secondary: {
      background: 'var(--secondary)',
      color: 'white'
    },
    danger: {
      background: 'var(--danger)',
      color: 'white'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text)',
      border: '1px solid var(--border)'
    }
  },

  // Form styles
  form: {
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      fontSize: '0.9rem',
      background: 'var(--input-bg)',
      color: 'var(--text)',
      transition: 'border-color 0.2s ease'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.85rem',
      fontWeight: '500',
      color: 'var(--text-dim)'
    },
    error: {
      color: 'var(--danger)',
      fontSize: '0.8rem',
      marginTop: '0.25rem'
    }
  },

  // Layout styles
  layout: {
    flex: {
      display: 'flex',
      alignItems: 'center'
    },
    flexBetween: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    flexCenter: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    grid: {
      display: 'grid',
      gap: '1rem'
    }
  },

  // Text styles
  text: {
    title: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: 'var(--text)',
      marginBottom: '1rem'
    },
    subtitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: 'var(--text)',
      marginBottom: '0.5rem'
    },
    body: {
      fontSize: '0.9rem',
      color: 'var(--text)',
      lineHeight: '1.5'
    },
    muted: {
      fontSize: '0.8rem',
      color: 'var(--text-dim)'
    }
  }
}

// Style utility functions
export const css = (styleObject) => styleObject

export const getStyle = (group, variant = 'default') => {
  const styleGroup = styles[group]
  if (!styleGroup) return {}
  
  if (styleGroup.base) {
    return {
      ...styleGroup.base,
      ...styleGroup[variant]
    }
  }
  
  return styleGroup[variant] || {}
}

// Responsive utilities
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1200px'
}

export const media = {
  mobile: (styles) => `@media (max-width: ${breakpoints.mobile}) { ${styles} }`,
  tablet: (styles) => `@media (max-width: ${breakpoints.tablet}) { ${styles} }`,
  desktop: (styles) => `@media (min-width: ${breakpoints.desktop}) { ${styles} }`,
  wide: (styles) => `@media (min-width: ${breakpoints.wide}) { ${styles} }`
}