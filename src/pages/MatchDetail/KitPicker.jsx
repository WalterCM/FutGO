import React from 'react'
import Modal from '../../components/ui/Modal'
import { KIT_LIBRARY } from './constants'

const KitPicker = ({ show, onClose, onSelect, teamId }) => {
    return (
        <Modal
            show={show}
            onClose={onClose}
            title={`Equipación para Equipo ${teamId}`}
            maxWidth="600px"
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}>
                {KIT_LIBRARY.map((kit, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(kit)}
                        style={{
                            background: kit.bg,
                            color: kit.color,
                            border: `2px solid ${kit.border}`,
                            padding: '1rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            fontWeight: 'bold'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {kit.name}
                    </button>
                ))}
            </div>
        </Modal>
    )
}

export default KitPicker
