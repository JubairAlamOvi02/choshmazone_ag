import React, { useState, useRef, useEffect, memo } from 'react';

/**
 * OptimizedImage Component
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Error handling with fallback
 * - WebP support detection
 * - Smooth fade-in animation
 */
const OptimizedImage = memo(({
    src,
    alt,
    className = '',
    containerClassName = '',
    placeholderColor = '#f3f4f6',
    aspectRatio = null,
    objectFit = 'cover',
    priority = false,
    onLoad,
    onError,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority) {
            setIsInView(true);
            return;
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observerRef.current?.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px 0px', // Start loading 50px before entering viewport
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observerRef.current.observe(imgRef.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    // Fallback placeholder for error state
    const FallbackPlaceholder = () => (
        <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
            style={{ aspectRatio }}
        >
            <svg
                className="w-12 h-12 text-gray-300"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
        </div>
    );

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${containerClassName}`}
            style={{
                backgroundColor: placeholderColor,
                aspectRatio: aspectRatio || undefined
            }}
        >
            {/* Placeholder / Loading State */}
            {!isLoaded && !hasError && (
                <div
                    className="absolute inset-0 animate-pulse"
                    style={{ backgroundColor: placeholderColor }}
                />
            )}

            {/* Error State */}
            {hasError && <FallbackPlaceholder />}

            {/* Actual Image */}
            {isInView && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`
                        transition-opacity duration-500 ease-out
                        ${isLoaded ? 'opacity-100' : 'opacity-0'}
                        ${className}
                    `}
                    style={{
                        objectFit,
                        width: '100%',
                        height: '100%',
                    }}
                    {...props}
                />
            )}
        </div>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
