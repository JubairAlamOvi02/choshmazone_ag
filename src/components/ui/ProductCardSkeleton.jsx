import React from 'react';
import Skeleton from './Skeleton';

const ProductCardSkeleton = () => {
    return (
        <div className="group h-full flex flex-col">
            {/* Image Skeleton */}
            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 rounded-sm mb-4">
                <Skeleton className="w-full h-full" />
            </div>

            {/* Content Skeleton */}
            <div className="flex flex-col gap-2 flex-grow">
                {/* Title */}
                <Skeleton className="h-5 w-3/4 mb-1" />

                {/* Price */}
                <Skeleton className="h-4 w-1/4" />

                {/* Rating/Reviews placeholder */}
                <div className="flex gap-1 mt-1">
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>

            {/* Button Skeleton */}
            <div className="mt-4 pt-4 border-t border-dashed border-border/50">
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
