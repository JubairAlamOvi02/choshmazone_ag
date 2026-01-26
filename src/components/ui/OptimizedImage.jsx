import React, { useState, useEffect, useRef } from 'react';

const OptimizedImage = ({
    src,
    alt,
    className = "",
    placeholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=",
    priority = false
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef(null);

    useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading slightly before the image enters viewport
                threshold: 0.1
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        };
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
        >
            {/* Placeholder / Blur effect */}
            <div
                className={`absolute inset-0 bg-gray-100 transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                style={{
                    backgroundImage: `url(${placeholder})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(10px)',
                    transform: 'scale(1.1)'
                }}
            />

            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    className={`block w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ position: 'relative', zIndex: 10 }}
                />
            )}
        </div>
    );
};

export default OptimizedImage;
