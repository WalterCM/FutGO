import React from 'react'
import { CheckCircle, MapPin, Trophy } from 'lucide-react'

const TabsNavigation = ({ activeTab, onTabChange }) => {
    return (
        <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            padding: '0.3rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid var(--border)',
            gap: '0.2rem'
        }}>
            {[
                { id: 'admin', label: 'Admin', icon: CheckCircle },
                { id: 'field', label: 'Equipos', icon: MapPin },
                { id: 'results', label: 'Resultados', icon: Trophy }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className="tab-button"
                    style={{
                        flex: 1,
                        padding: '0.8rem 0.2rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                        color: activeTab === tab.id ? 'black' : 'var(--text-dim)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        minWidth: 0
                    }}
                >
                    <tab.icon size={18} />
                    <span style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    )
}

export default TabsNavigation
