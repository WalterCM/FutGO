import React, { useState, useMemo } from 'react'
import Modal from '../../components/ui/Modal'
import { KIT_LIBRARY, CATEGORIES } from './constants'

const KitPicker = ({ show, onClose, onSelect, teamId }) => {
    const [activeCategory, setActiveCategory] = useState('color')
    const [searchTerm, setSearchTerm] = useState('')

    const filteredKits = useMemo(() => {
        let kits = activeCategory === 'all' 
            ? KIT_LIBRARY 
            : KIT_LIBRARY.filter(kit => kit.categories?.includes(activeCategory))
        
        if (searchTerm.trim()) {
            kits = kits.filter(kit => 
                kit.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        
        return kits
    }, [activeCategory, searchTerm])

    return (
        <Modal
            show={show}
            onClose={onClose}
            title={`Equipación para Equipo ${teamId}`}
            maxWidth="700px"
        >
            {/* Search Input */}
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Buscar camiseta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-dark)',
                        color: 'white',
                        fontSize: '0.9rem'
                    }}
                />
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: activeCategory === cat.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                            background: activeCategory === cat.id ? 'var(--primary)' : 'transparent',
                            color: activeCategory === cat.id ? 'black' : 'var(--text-dim)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                        }}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Kits Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', maxHeight: '50vh', overflowY: 'auto', padding: '0.5rem' }}>
                {filteredKits.map((kit, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(kit)}
                        style={{
                            background: kit.bg,
                            color: kit.color,
                            border: `2px solid ${kit.border}`,
                            padding: '0.8rem 0.5rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            minHeight: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {kit.name}
                    </button>
                ))}
            </div>

            {filteredKits.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                    No se encontraron camisetas
                </div>
            )}
        </Modal>
    )
}

export default KitPicker