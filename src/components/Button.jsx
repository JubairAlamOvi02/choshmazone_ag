import React from 'react';

const Button = ({ variant = 'primary', size = 'medium', className = '', children, ...props }) => {
    const variants = {
        primary: 'bg-primary text-white border-primary hover:enabled:opacity-90 hover:enabled:-translate-y-px',
        secondary: 'bg-secondary text-primary border-secondary hover:enabled:brightness-110 hover:enabled:-translate-y-px',
        outline: 'bg-transparent text-text-main border-border hover:enabled:border-text-main hover:enabled:bg-black/5',
        ghost: 'bg-transparent text-text-main border-transparent hover:enabled:bg-black/5'
    };

    const sizes = {
        small: 'px-4 py-2 text-sm',
        medium: 'px-6 py-3 text-base',
        large: 'px-8 py-4 text-lg'
    };

    const baseClasses = 'inline-flex items-center justify-center gap-2 font-outfit font-medium rounded-sm border transition-all duration-300 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed';

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
