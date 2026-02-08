import React from 'react'
import Card from '../../components/ui/Card'
import { getDisplayName } from '../../lib/utils'

const PlayerCard = ({
    registration,
    isSelected,
    onClick,
    onDragStart,
    isBench = false,
    config = {},
    arrivalOrder = null
}) => {
    const { player } = registration

    // Format arrival order with ordinal suffix
    const getOrdinal = (n) => {
        if (n === 1) return '1º'
        if (n === 2) return '2º'
        if (n === 3) return '3º'
        return `${n}º`
    }

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
                <div style={{ fontWeight: 'bold' }}>{getDisplayName(player)}</div>
            </div>
            {isBench && arrivalOrder && (
                <div style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-dim)',
                    fontWeight: 'bold',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                }}>
                    {getOrdinal(arrivalOrder)}
                </div>
            )}
        </Card>
    )
}

export default PlayerCard

