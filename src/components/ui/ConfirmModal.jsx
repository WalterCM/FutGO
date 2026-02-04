import React from 'react'
import Modal from './Modal'
import Button from './Button'

const ConfirmModal = ({
    show,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false
}) => {
    return (
        <Modal show={show} onClose={onClose} title={title}>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
                {message}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Button
                    variant="ghost"
                    onClick={onClose}
                    style={{ flex: 1 }}
                    disabled={loading}
                >
                    {cancelText}
                </Button>
                <Button
                    variant={variant}
                    onClick={onConfirm}
                    style={{ flex: 1 }}
                    loading={loading}
                >
                    {confirmText}
                </Button>
            </div>
        </Modal>
    )
}

export default ConfirmModal
