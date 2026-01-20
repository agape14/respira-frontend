import { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import axios from '../api/axios';
import LazySection from '../components/dashboard/LazySection';

// Importar componentes de secciones
import Section1_EstadisticasGenerales from '../components/dashboard/sections/Section1_EstadisticasGenerales';
import Section2_Derivaciones from '../components/dashboard/sections/Section2_Derivaciones';
import Section3_EvaluacionesPorTipo from '../components/dashboard/sections/Section3_EvaluacionesPorTipo';
import Section4_DistribucionSexoEdad from '../components/dashboard/sections/Section4_DistribucionSexoEdad';
import Section5_DepresionAnsiedad from '../components/dashboard/sections/Section5_DepresionAnsiedad';
import Section6_AlcoholismoBurnout from '../components/dashboard/sections/Section6_AlcoholismoBurnout';
import Section7_AnalisisASQ from '../components/dashboard/sections/Section7_AnalisisASQ';
import Section8_EstadoCitas from '../components/dashboard/sections/Section8_EstadoCitas';
import Section9_TendenciaMensual from '../components/dashboard/sections/Section9_TendenciaMensual';
import Section10_ProtocolosDisponibilidad from '../components/dashboard/sections/Section10_ProtocolosDisponibilidad';
import Section11_Alertas from '../components/dashboard/sections/Section11_Alertas';
import Section12_CantidadInstituciones from '../components/dashboard/sections/Section12_CantidadInstituciones';

const DashboardPage = () => {
    const [filters, setFilters] = useState({
        departamento: '',
        institucion: '',
        modalidad: '',
        id_proceso: ''
    });
    const [departamentos, setDepartamentos] = useState([]);
    const [procesos, setProcesos] = useState([]);
    const [error, setError] = useState(null);
    const [initialData, setInitialData] = useState(null); // Datos compartidos para secciones 1 y 2
    const [loadingInitial, setLoadingInitial] = useState(true); // Loading de secciones 1 y 2
    
    const isMountedRef = useRef(false);
    const initialLoadDoneRef = useRef(false);
    const filtersKey = useRef(0); // Para forzar recarga cuando cambien filtros
    const isFirstRenderRef = useRef(true); // Para evitar doble carga inicial

    // Función genérica para cargar datos de secciones
    const loadSectionData = useCallback(async (sectionName) => {
        try {
            const response = await axios.get('/dashboard-data', { 
                params: {
                    ...filters,
                    // El backend puede usar este parámetro para optimizar y devolver solo los datos necesarios
                    // Por ahora devuelve todo, pero está preparado para optimización futura
                },
                timeout: 30000
            });
            return response.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || err.message);
        }
    }, [filters]);

    const fetchFiltros = useCallback(async () => {
        try {
            const response = await axios.get('/dashboard-filtros');
            setDepartamentos(response.data?.departamentos || []);
            setProcesos(response.data?.procesos || []);
        } catch (err) {
            console.error('Error al cargar filtros:', err);
        }
    }, []);

    // Cargar datos iniciales para secciones 1 y 2 (UNA SOLA PETICIÓN)
    const fetchInitialData = useCallback(async () => {
        try {
            setLoadingInitial(true);
            const response = await axios.get('/dashboard-data', { 
                params: filters,
                timeout: 30000
            });
            setInitialData(response.data);
        } catch (err) {
            console.error('Error al cargar datos iniciales:', err);
            setError('Error al cargar los datos del dashboard: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoadingInitial(false);
        }
    }, [filters]);

    // Carga inicial
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
            setLoadingInitial(false);
            return;
        }

        isMountedRef.current = true;

        if (!initialLoadDoneRef.current) {
            initialLoadDoneRef.current = true;
            fetchFiltros();
            fetchInitialData(); // Cargar datos para secciones 1 y 2
        }

        return () => {
            isMountedRef.current = false;
        };
    }, [fetchFiltros, fetchInitialData]);

    // Efecto para detectar cambios en filtros y forzar recarga de secciones
    useEffect(() => {
        // Ignorar el primer render (montaje inicial)
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }
        
        // Solo ejecutar cuando realmente cambien los filtros después del montaje
        if (initialLoadDoneRef.current) {
            // Recargar datos iniciales y incrementar key para secciones lazy
            fetchInitialData();
            filtersKey.current += 1;
        }
    }, [filters, fetchInitialData]);

    if (error && !loadingInitial) {
        return (
            <MainLayout>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </MainLayout>
        );
    }

    if (loadingInitial) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#752568] mx-auto"></div>
                        <p className="text-gray-500 mt-4 text-sm">Cargando dashboard...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-4 font-sans">
                {/* Header & Filters */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <span className="text-xs font-bold tracking-wider text-[#752568] uppercase">Sistema de Gestión</span>
                            <h1 className="text-2xl font-bold text-gray-900 mt-1">Evaluaciones Psicológicas</h1>
                            <p className="text-gray-500 text-sm">Colegio Médico del Perú - Salud Mental</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Sistema Activo
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 ml-1">Consejo Regional</label>
                            <select
                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#752568]/20 focus:border-[#752568] transition-all"
                                value={filters.departamento}
                                onChange={(e) => setFilters(prev => ({ ...prev, departamento: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                {departamentos.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 ml-1">Tipo de Institución</label>
                            <select
                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#752568]/20 focus:border-[#752568] transition-all"
                                value={filters.institucion}
                                onChange={(e) => setFilters(prev => ({ ...prev, institucion: e.target.value }))}
                            >
                                <option value="">Todas las Instituciones</option>
                                <option value="MINSA">MINSA</option>
                                <option value="ESSALUD">ESSALUD</option>
                                <option value="GOBIERNO REGIONAL">GOBIERNO REGIONAL</option>
                                <option value="SANIDAD FFAA">SANIDAD FFAA</option>
                                <option value="SANIDAD PNP">SANIDAD PNP</option>
                                <option value="PRIVADO">PRIVADO</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 ml-1">Modalidad</label>
                            <select
                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#752568]/20 focus:border-[#752568] transition-all"
                                value={filters.modalidad}
                                onChange={(e) => setFilters(prev => ({ ...prev, modalidad: e.target.value }))}
                            >
                                <option value="">Todas las Modalidades</option>
                                <option value="REMUNERADO">SERUM REMUNERADO</option>
                                <option value="EQUIVALENTE">SERUM EQUIVALENTE</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 ml-1">CORTE</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#752568] focus:border-transparent"
                                value={filters.id_proceso}
                                onChange={(e) => setFilters(prev => ({ ...prev, id_proceso: e.target.value }))}
                            >
                                <option value="">Todos los cortes</option>
                                {procesos.map(p => (
                                    <option key={p.id_proceso} value={p.id_proceso}>{p.etiqueta}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 1: Estadísticas Generales del Sistema - USA DATOS INICIALES */}
                <LazySection
                    key={`section-1-${filtersKey.current}`}
                    sectionId="section-1"
                    initialData={initialData}
                    loadImmediately={true}
                    minHeight={100}
                >
                    {(data) => <Section1_EstadisticasGenerales data={data} />}
                </LazySection>

                {/* SECCIÓN 2: Derivaciones - USA DATOS INICIALES */}
                <LazySection
                    key={`section-2-${filtersKey.current}`}
                    sectionId="section-2"
                    initialData={initialData}
                    loadImmediately={true}
                    minHeight={300}
                >
                    {(data) => <Section2_Derivaciones data={data} />}
                </LazySection>

                {/* SECCIÓN 3: Evaluaciones por Tipo - LAZY LOADING */}
                <LazySection
                    key={`section-3-${filtersKey.current}`}
                    sectionId="section-3"
                    loadData={() => loadSectionData('evaluaciones_por_tipo')}
                    loadImmediately={false}
                    minHeight={400}
                >
                    {(data) => <Section3_EvaluacionesPorTipo data={data} />}
                </LazySection>

                {/* SECCIÓN 4: Distribución Sexo y Edad - LAZY LOADING */}
                <LazySection
                    key={`section-4-${filtersKey.current}`}
                    sectionId="section-4"
                    loadData={() => loadSectionData('distribucion_demografica')}
                    loadImmediately={false}
                    minHeight={350}
                >
                    {(data) => <Section4_DistribucionSexoEdad data={data} />}
                </LazySection>

                {/* SECCIÓN 5: Depresión y Ansiedad - LAZY LOADING */}
                <LazySection
                    key={`section-5-${filtersKey.current}`}
                    sectionId="section-5"
                    loadData={() => loadSectionData('depresion_ansiedad')}
                    loadImmediately={false}
                    minHeight={300}
                >
                    {(data) => <Section5_DepresionAnsiedad data={data} />}
                </LazySection>

                {/* SECCIÓN 6: Alcoholismo y Burnout - LAZY LOADING */}
                <LazySection
                    key={`section-6-${filtersKey.current}`}
                    sectionId="section-6"
                    loadData={() => loadSectionData('alcoholismo_burnout')}
                    loadImmediately={false}
                    minHeight={300}
                >
                    {(data) => <Section6_AlcoholismoBurnout data={data} />}
                </LazySection>

                {/* SECCIÓN 7: Análisis ASQ - LAZY LOADING */}
                <LazySection
                    key={`section-7-${filtersKey.current}`}
                    sectionId="section-7"
                    loadData={() => loadSectionData('analisis_asq')}
                    loadImmediately={false}
                    minHeight={250}
                >
                    {(data) => <Section7_AnalisisASQ data={data} />}
                </LazySection>

                {/* SECCIÓN 8: Estado de Citas - LAZY LOADING */}
                <LazySection
                    key={`section-8-${filtersKey.current}`}
                    sectionId="section-8"
                    loadData={() => loadSectionData('estado_citas')}
                    loadImmediately={false}
                    minHeight={350}
                >
                    {(data) => <Section8_EstadoCitas data={data} />}
                </LazySection>

                {/* SECCIÓN 9: Tendencia Mensual - LAZY LOADING */}
                <LazySection
                    key={`section-9-${filtersKey.current}`}
                    sectionId="section-9"
                    loadData={() => loadSectionData('tendencia_mensual')}
                    loadImmediately={false}
                    minHeight={350}
                >
                    {(data) => <Section9_TendenciaMensual data={data} />}
                </LazySection>

                {/* SECCIÓN 10: Protocolos y Disponibilidad - LAZY LOADING */}
                <LazySection
                    key={`section-10-${filtersKey.current}`}
                    sectionId="section-10"
                    loadData={() => loadSectionData('protocolos_disponibilidad')}
                    loadImmediately={false}
                    minHeight={350}
                >
                    {(data) => <Section10_ProtocolosDisponibilidad data={data} />}
                </LazySection>

                {/* SECCIÓN 11: Alertas y Recomendaciones - LAZY LOADING */}
                <LazySection
                    key={`section-11-${filtersKey.current}`}
                    sectionId="section-11"
                    loadData={() => loadSectionData('alertas')}
                    loadImmediately={false}
                    minHeight={200}
                >
                    {(data) => <Section11_Alertas data={data} />}
                </LazySection>

                {/* SECCIÓN 12: Cantidad por Instituciones - LAZY LOADING */}
                <LazySection
                    key={`section-12-${filtersKey.current}`}
                    sectionId="section-12"
                    loadData={() => loadSectionData('cantidad_instituciones')}
                    loadImmediately={false}
                    minHeight={350}
                >
                    {(data) => <Section12_CantidadInstituciones data={data} />}
                </LazySection>
            </div>
        </MainLayout>
    );
};

export default DashboardPage;
