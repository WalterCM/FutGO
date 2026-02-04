import React from 'react'
import Spinner from './Spinner'

const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className = '',
    style = {},
    type = 'button',
    ...props
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                }
            case 'outline':
                return {
                    background: 'transparent',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                }
            case 'outline-danger':
                return {
                    background: 'transparent',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                }
            case 'ghost':
                return {
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    padding: 0,
                }
            case 'success':
                return {
                    background: '#10b981',
                    color: 'black',
                    border: 'none',
                }
            default: // primary
                return {
                    background: 'var(--primary)',
                    color: 'var(--bg-dark)',
                    border: 'none',
                }
        }
    }

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return { padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }
            case 'lg':
                return { padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '14px' }
            default:
                return { padding: '0.8rem 1.5rem', fontSize: '0.9rem', borderRadius: '12px' }
        }
    }

    const baseStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: '600',
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: (disabled || loading) ? 0.6 : 1,
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
    }

    return (
        <button
            className={`btn-${variant} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            style={baseStyles}
            type={type}
            {...props}
        >
            {loading ? (
                <Spinner size={16} color={variant === 'primary' ? 'var(--bg-dark)' : 'currentColor'} />
            ) : Icon && (
                <Icon size={size === 'sm' ? 14 : 18} />
            )}
            {children}
        </button>
    )
}

export default Button
