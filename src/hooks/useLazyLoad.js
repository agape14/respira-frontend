import { useEffect, useRef, useState } from 'react';

/**
 * Hook personalizado para implementar lazy loading con Intersection Observer
 * @param {Object} options - Opciones para el Intersection Observer
 * @returns {[React.RefObject, boolean]} - [ref del elemento, si está visible]
 */
const useLazyLoad = (options = {}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element || hasLoaded) return;

        const defaultOptions = {
            root: null,
            rootMargin: '200px', // Cargar cuando esté 200px antes de entrar al viewport
            threshold: 0.01,
            ...options
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true); // Una vez cargado, no volver a cargar
                }
            });
        }, defaultOptions);

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [hasLoaded, options]);

    return [elementRef, isVisible];
};

export default useLazyLoad;
