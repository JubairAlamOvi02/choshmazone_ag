import React from 'react';
import { Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';

const STEPS = [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'processing', label: 'Processing', icon: Package },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'completed', label: 'Delivered', icon: CheckCircle2 },
];

const OrderTimeline = ({ currentStatus }) => {
    if (currentStatus === 'cancelled') {
        return (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                <XCircle size={20} />
                <span className="font-bold text-sm uppercase tracking-widest">This order has been cancelled</span>
            </div>
        );
    }

    // Find the index of the current status
    const currentStepIndex = STEPS.findIndex(s => s.status === currentStatus);

    return (
        <div className="py-8">
            <div className="relative flex justify-between items-center w-full">
                {/* Connector Line */}
                <div
                    className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"
                />

                {/* Active Connector Line */}
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
                    style={{
                        width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
                    }}
                />

                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={step.status} className="relative z-10 flex flex-col items-center gap-3">
                            {/* Icon Circle */}
                            <div
                                className={`
                                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500
                                    ${isActive ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-gray-300 border-2 border-gray-100'}
                                    ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse' : ''}
                                `}
                            >
                                <Icon size={isActive ? 20 : 18} />
                            </div>

                            {/* Label */}
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                                <span
                                    className={`
                                        text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500
                                        ${isActive ? 'text-primary' : 'text-gray-300'}
                                    `}
                                >
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTimeline;
