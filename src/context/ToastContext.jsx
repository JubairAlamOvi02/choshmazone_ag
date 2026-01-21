import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Types and their configurations
const TOAST_TYPES = {
    success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        iconColor: 'text-green-500',
        progressColor: 'bg-green-500',
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        iconColor: 'text-red-500',
        progressColor: 'bg-red-500',
    },
    warning: {
        icon: AlertCircle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500',
        iconColor: 'text-amber-500',
        progressColor: 'bg-amber-500',
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        iconColor: 'text-blue-500',
        progressColor: 'bg-blue-500',
    },
};

// Individual Toast Component
const Toast = ({ id, type, title, message, duration, onRemove }) => {
    const config = TOAST_TYPES[type] || TOAST_TYPES.info;
    const Icon = config.icon;
    const [progress, setProgress] = useState(100);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                handleClose();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(id), 300);
    };

    return (
        <div
            className={`
                relative overflow-hidden rounded-lg shadow-lg border-l-4 
                ${config.bgColor} ${config.borderColor}
                transform transition-all duration-300 ease-out
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
                min-w-[300px] max-w-[400px]
            `}
        >
            <div className="flex items-start gap-3 p-4">
                <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    {title && (
                        <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    )}
                    {message && (
                        <p className="text-gray-600 text-sm mt-0.5">{message}</p>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
                <div
                    className={`h-full ${config.progressColor} transition-all duration-100 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        {...toast}
                        onRemove={removeToast}
                    />
                </div>
            ))}
        </div>
    );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, type, title, message, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    // Convenience methods
    const success = useCallback((message, title = 'Success') => {
        return addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((message, title = 'Error') => {
        return addToast({ type: 'error', title, message });
    }, [addToast]);

    const warning = useCallback((message, title = 'Warning') => {
        return addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((message, title = 'Info') => {
        return addToast({ type: 'info', title, message });
    }, [addToast]);

    const value = {
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export default ToastProvider;
