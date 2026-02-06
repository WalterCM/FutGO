import React from 'react'

const TeamBadge = ({ id, teamConfigs, style = {} }) => {
    const config = teamConfigs?.[id]

    return (
        <span style={{
            background: config?.bg || 'rgba(255,255,255,0.05)',
            color: config?.color || 'white',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            border: `1px solid ${config?.color || 'transparent'}`,
            minWidth: '80px',
            textAlign: 'center',
            display: 'inline-block',
            ...style
        }}>
            {config?.name || `Equipo ${id}`}
        </span>
    )
}

export default TeamBadge
