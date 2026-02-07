import { useRef, useEffect } from 'react'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning' // 'warning', 'danger', 'info', 'success'
}) {
    const modalRef = useRef(null)

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen) return null

    const variantStyles = {
        warning: { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', icon: AlertTriangle, iconColor: '#eab308' },
        danger: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: AlertTriangle, iconColor: '#ef4444' },
        info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: Info, iconColor: '#3b82f6' },
        success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', icon: CheckCircle, iconColor: '#22c55e' }
    }

    const style = variantStyles[variant] || variantStyles.warning
    const IconComponent = style.icon

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                ref={modalRef}
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    maxWidth: '400px',
                    width: '90%',
                    border: `1px solid ${style.border}`,
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            background: style.bg,
                            borderRadius: '50%',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <IconComponent size={24} color={style.iconColor} />
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1.1rem' }}>{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--text-light)',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose() }}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: style.border,
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Alert-only modal (no confirm button, just info/error display)
export function AlertModal({
    isOpen,
    onClose,
    title = 'Aviso',
    message,
    variant = 'info',
    buttonText = 'Entendido'
}) {
    const modalRef = useRef(null)

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen) return null

    const variantStyles = {
        warning: { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', icon: AlertTriangle, iconColor: '#eab308' },
        danger: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: AlertTriangle, iconColor: '#ef4444' },
        info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: Info, iconColor: '#3b82f6' },
        success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', icon: CheckCircle, iconColor: '#22c55e' }
    }

    const style = variantStyles[variant] || variantStyles.info
    const IconComponent = style.icon

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                ref={modalRef}
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    maxWidth: '400px',
                    width: '90%',
                    border: `1px solid ${style.border}`,
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        background: style.bg,
                        borderRadius: '50%',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <IconComponent size={24} color={style.iconColor} />
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1.1rem' }}>{title}</h3>
                </div>

                <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: style.border,
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    )
}
