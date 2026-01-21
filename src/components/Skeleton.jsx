import React from 'react';

/**
 * Skeleton Component
 * Provides a shimmering loading state placeholder.
 */
const Skeleton = ({ className = '', variant = 'rect', ...props }) => {
    const variants = {
        rect: 'rounded-md',
        circle: 'rounded-full',
        text: 'rounded-sm h-4 w-full'
    };

    return (
        <div
            className={`
                bg-gray-200 animate-pulse relative overflow-hidden
                ${variants[variant]} 
                ${className}
            `}
            {...props}
        >
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
    );
};

/**
 * Predefined Skeleton Compositions
 */

// Product Card Skeleton
export const ProductCardSkeleton = () => (
    <div className="flex flex-col gap-4">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/4" />
        </div>
    </div>
);

// Admin Dashboard Stat Skeleton
export const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
        <Skeleton variant="circle" className="w-12 h-12" />
        <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/3 h-6" />
        </div>
    </div>
);

// Order List Row Skeleton
export const OrderRowSkeleton = () => (
    <div className="p-4 bg-white border border-border rounded-xl flex items-center justify-between">
        <div className="flex gap-4 items-center flex-1">
            <Skeleton variant="rect" className="w-12 h-12" />
            <div className="space-y-2 flex-1">
                <Skeleton variant="text" className="w-1/4" />
                <Skeleton variant="text" className="w-1/6" />
            </div>
        </div>
        <Skeleton variant="rect" className="w-24 h-8 rounded-full" />
    </div>
);

export default Skeleton;
