import React from 'react';
import './Button.css';

const Button = ({ variant = 'primary', size = 'medium', className = '', children, ...props }) => {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
