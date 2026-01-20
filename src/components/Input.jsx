import React from 'react';

const Input = ({ label, error, className = '', id, ...props }) => {
    const inputId = id || React.useId();

    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
                    w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm
                    ${error ? 'border-red-500 bg-red-50' : 'border-border/50'}
                `}
                {...props}
            />
            {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1 mt-1 font-outfit">{error}</span>}
        </div>
    );
};

export default Input;
