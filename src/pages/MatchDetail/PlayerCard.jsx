import React from 'react'
import Card from '../../components/ui/Card'

const PlayerCard = ({
    registration,
    isSelected,
    onClick,
    onDragStart,
    isBench = false,
    config = {}
}) => {
    const { player } = registration

    return (
        <Card
            draggable={!!onDragStart}
            onDragStart={onDragStart}
            onClick={onClick}
            style={{
                padding: '0.8rem',
                cursor: onDragStart ? 'grab' : 'pointer',
                fontSize: '0.8rem',
                background: isSelected ? 'var(--primary)' : (isBench ? 'var(--bg-card)' : config.bg || 'var(--bg-card)'),
                border: `1px solid ${isSelected ? 'var(--primary)' : (isBench ? 'var(--border)' : config.color || 'var(--border)')}`,
                color: isSelected ? 'black' : (isBench ? 'white' : config.color || 'white'),
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transform: 'none' // Handled by hover prop in Card if needed, but pitch view usually flat
            }}
            hover={!onDragStart} // Only hover if not draggable to avoid weirdness
        >
            <div>
                <div style={{ fontWeight: 'bold' }}>{player?.full_name}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>ELO: {player?.elo_rating}</div>
            </div>
            {isBench && (
                <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 'bold' }}>LISTO</div>
            )}
        </Card>
    )
}

export default PlayerCard
