import React from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'

const StatusMessage = ({ type, text, onClose }) => {
    if (!text) return null

    const getStyles = () => {
        switch (type) {
            case 'error':
                return { background: 'var(--danger)', color: 'white' }
            case 'success':
                return { background: '#10b981', color: 'black' }
            default:
                return { background: 'var(--primary)', color: 'black' }
        }
    }

    const Icon = type === 'error' ? XCircle : (type === 'success' ? CheckCircle : Info)

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                zIndex: 1000,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease forwards',
                ...getStyles()
            }}
        >
            <Icon size={20} />
            <span style={{ fontWeight: '500' }}>{text}</span>
        </div>
    )
}

export default StatusMessage
