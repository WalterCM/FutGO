import React from 'react'

const Card = ({ children, className = '', style = {}, hover = true, ...props }) => {
    // Destructure hover to prevent it from reaching the DOM
    const { ...rest } = props;
    return (
        <div
            className={`premium-card ${className}`}
            style={{
                ...style,
                ...(hover ? {} : { transform: 'none' })
            }}
            {...props}
        >
            {children}
        </div>
    )
}

export default Card
