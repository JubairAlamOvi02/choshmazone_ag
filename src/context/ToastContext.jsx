
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        
        // Defer toast state update to prevent setState-in-render warnings across providers
        setTimeout(() => {
            setToasts(prev => [...prev, { id, message, type }]);
        }, 0);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration + 10);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[2000] flex flex-col gap-2.5 pointer-events-none items-end">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ message, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="text-green-500 shrink-0" size={20} />,
        error: <AlertCircle className="text-red-500 shrink-0" size={20} />,
        warning: <AlertTriangle className="text-amber-500 shrink-0" size={20} />,
        info: <Info className="text-blue-500 shrink-0" size={20} />
    };

    const bgColors = {
        success: 'border-green-200 bg-white/95 shadow-green-900/10',
        error: 'border-red-200 bg-white/95 shadow-red-900/10',
        warning: 'border-amber-200 bg-white/95 shadow-amber-900/10',
        info: 'border-blue-200 bg-white/95 shadow-blue-900/10'
    };

    return (
        <div className={`
            pointer-events-auto w-full sm:w-auto max-w-full flex items-center gap-3 p-4 pr-11 rounded-2xl border shadow-2xl backdrop-blur-md
            animate-in slide-in-from-bottom-4 sm:slide-in-from-right-full fade-in duration-300 relative
            ${bgColors[type] || bgColors.success}
        `}>
            <div className="shrink-0">{icons[type] || icons.success}</div>
            <p className="text-xs sm:text-sm font-semibold font-outfit text-text-main leading-snug break-words flex-1">{message}</p>
            <button
                onClick={onClose}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
            >
                <X size={15} className="text-text-muted hover:text-text-main" />
            </button>
        </div>
    );
};
