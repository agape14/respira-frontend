import { useEffect, useState } from 'react';
import useLazyLoad from '../../hooks/useLazyLoad';

/**
 * Componente wrapper para secciones del dashboard con lazy loading
 * @param {Object} props
 * @param {Function} props.loadData - Función para cargar los datos de la sección
 * @param {React.ReactNode} props.children - Función o componente hijo que recibe los datos
 * @param {string} props.sectionId - ID único de la sección para identificación
 * @param {number} props.minHeight - Altura mínima mientras carga (px)
 * @param {Object} props.initialData - Datos iniciales para evitar carga (opcional)
 */
const LazySection = ({ 
    loadData, 
    children, 
    sectionId, 
    minHeight = 300,
    loadImmediately = false,
    initialData = null
}) => {
    const [sectionRef, isVisible] = useLazyLoad();
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Si se proveen datos iniciales, usarlos directamente
    useEffect(() => {
        if (initialData) {
            setData(initialData);
        }
    }, [initialData]);

    useEffect(() => {
        // Si ya hay datos iniciales, no cargar
        if (initialData) return;
        
        // Si debe cargarse inmediatamente (secciones 1 y 2) o si se hace visible
        if (loadImmediately || isVisible) {
            if (!data && !loading) {
                fetchData();
            }
        }
    }, [isVisible, loadImmediately, initialData]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await loadData();
            setData(result);
        } catch (err) {
            console.error(`Error cargando sección ${sectionId}:`, err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={sectionRef} style={{ minHeight: `${minHeight}px` }}>
            {loading && (
                <div className="flex items-center justify-center" style={{ height: `${minHeight}px` }}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#752568] mx-auto"></div>
                        <p className="text-gray-500 mt-4 text-sm">Cargando sección...</p>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    Error: {error}
                </div>
            )}
            
            {!loading && !error && data && (
                typeof children === 'function' ? children(data) : children
            )}
            
            {!loading && !error && !data && !loadImmediately && (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height: `${minHeight}px` }}>
                    <p className="text-gray-400 text-sm">Esperando carga...</p>
                </div>
            )}
        </div>
    );
};

export default LazySection;
