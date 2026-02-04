import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const Modal = ({
    show,
    onClose,
    title,
    children,
    footer,
    maxWidth = '500px',
    closeOnOverlay = true
}) => {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [show])

    if (!show) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={() => closeOnOverlay && onClose()}
        >
            <div
                className="premium-card"
                style={{
                    width: '100%',
                    maxWidth,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    padding: '2rem',
                    position: 'relative',
                    transform: 'none' // Remove card hover effect inside modal
                }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                {title && (
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', paddingRight: '2rem' }}>
                        {title}
                    </h3>
                )}

                <div style={{ marginBottom: footer ? '2rem' : 0 }}>
                    {children}
                </div>

                {footer && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                        marginTop: '2rem',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '1.5rem'
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal
