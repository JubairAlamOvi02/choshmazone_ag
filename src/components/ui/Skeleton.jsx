import React from 'react';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse bg-neutral-200/50 rounded-sm ${className}`}
            {...props}
        />
    );
};

export default Skeleton;
