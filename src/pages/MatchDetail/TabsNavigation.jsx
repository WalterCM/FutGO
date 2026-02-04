import React from 'react'
import { CheckCircle, MapPin } from 'lucide-react'

const TabsNavigation = ({ activeTab, onTabChange }) => {
    return (
        <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            padding: '0.3rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid var(--border)'
        }}>
            <button
                onClick={() => onTabChange('admin')}
                style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'admin' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'admin' ? 'black' : 'var(--text-dim)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}
            >
                <CheckCircle size={18} /> Administración
            </button>
            <button
                onClick={() => onTabChange('field')}
                style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'field' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'field' ? 'black' : 'var(--text-dim)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}
            >
                <MapPin size={18} /> Cancha / Equipos
            </button>
        </div>
    )
}

export default TabsNavigation
