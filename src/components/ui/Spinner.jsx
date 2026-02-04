import React from 'react'

const Spinner = ({ size = 24, color = 'var(--primary)', className = '' }) => {
    return (
        <div
            className={`spin ${className}`}
            style={{
                width: size,
                height: size,
                border: `${size / 8}px solid ${color}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block'
            }}
        />
    )
}

export default Spinner
