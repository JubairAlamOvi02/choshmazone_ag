
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

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ message, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <AlertCircle className="text-red-500" size={20} />,
        warning: <AlertTriangle className="text-amber-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const bgColors = {
        success: 'border-green-100 bg-green-50/90',
        error: 'border-red-100 bg-red-50/90',
        warning: 'border-amber-100 bg-amber-50/90',
        info: 'border-blue-100 bg-blue-50/90'
    };

    return (
        <div className={`
            pointer-events-auto flex items-center gap-3 p-4 pr-12 rounded-xl border shadow-xl backdrop-blur-md
            animate-in slide-in-from-right-full fade-in duration-300
            ${bgColors[type] || bgColors.success}
        `}>
            <div className="shrink-0">{icons[type]}</div>
            <p className="text-sm font-bold font-outfit text-text-main whitespace-nowrap">{message}</p>
            <button
                onClick={onClose}
                className="absolute right-3 p-1 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Close"
            >
                <X size={14} className="text-text-muted" />
            </button>
        </div>
    );
};
