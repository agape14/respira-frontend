import { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import axios from '../api/axios';
import { Users, FileText, Calendar, ClipboardCheck, AlertTriangle, Clock, Building, Activity } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts';

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(false);
    const initialLoadDoneRef = useRef(false);
    const filtersChangeRef = useRef(false);

    const [filters, setFilters] = useState({
        departamento: '',
        institucion: '',
        modalidad: '',
        id_proceso: ''
    });
    const [departamentos, setDepartamentos] = useState([]);
    const [procesos, setProcesos] = useState([]);

    const fetchFiltros = useCallback(async () => {
        try {
            const response = await axios.get('/dashboard-filtros');
            setDepartamentos(response.data?.departamentos || []);
            setProcesos(response.data?.procesos || []);
        } catch (err) {
            console.error('Error al cargar filtros:', err);
        }
    }, []);

    const fetchDashboardData = useCallback(async () => {
        // Verificar token antes de hacer la petición
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
            setLoading(false);
            return;
        }

        // Cancelar petición anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Crear nuevo AbortController para esta petición
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const startTime = performance.now();
        console.log('🔄 [Dashboard] Iniciando petición dashboard-data...', { filters });

        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get('/dashboard-data', { 
                params: filters,
                signal: abortController.signal,
                timeout: 120000 // Timeout de 120 segundos (primera carga puede ser lenta, pero el caché ayudará)
            });
            
            const elapsed = Math.round(performance.now() - startTime);
            console.log(`✅ [Dashboard] Respuesta recibida en ${elapsed}ms`, {
                dataSize: JSON.stringify(response.data).length,
                hasData: !!response.data
            });
            
            // Verificar que el componente aún está montado y no se canceló
            if (!abortController.signal.aborted && isMountedRef.current) {
                setDashboardData(response.data);
                console.log('✅ [Dashboard] Datos actualizados en el estado');
            }
        } catch (err) {
            const elapsed = Math.round(performance.now() - startTime);
            
            // Ignorar errores si la petición fue cancelada
            if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                console.log(`⚠️ [Dashboard] Petición cancelada después de ${elapsed}ms`);
                return;
            }
            
            console.error(`❌ [Dashboard] Error después de ${elapsed}ms:`, err);
            
            if (err.response?.status === 401) {
                setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                // El interceptor de axios ya maneja la redirección a login
            } else if (err.code === 'ECONNABORTED') {
                setError('La solicitud tardó demasiado. Por favor, intenta nuevamente.');
            } else {
                setError('Error al cargar los datos del dashboard: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            // Solo actualizar loading si no fue cancelado y el componente está montado
            if (!abortController.signal.aborted && isMountedRef.current) {
                setLoading(false);
            }
            // Limpiar referencia solo si es la petición actual
            if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null;
            }
        }
    }, [filters]);

    // Efecto para carga inicial (solo una vez)
    useEffect(() => {
        // Verificar que hay un token antes de hacer las peticiones
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
            setLoading(false);
            return;
        }

        // Marcar como montado
        isMountedRef.current = true;

        // Solo hacer la carga inicial una vez (incluye verificación para StrictMode)
        if (!initialLoadDoneRef.current) {
            initialLoadDoneRef.current = true;
            console.log('🔄 [Dashboard] Carga inicial iniciada');
            fetchFiltros();
            fetchDashboardData();
        }

        // Cleanup: cancelar peticiones pendientes al desmontar
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Efecto separado para cambios en filtros (solo después de la carga inicial)
    // Usar useRef para rastrear si ya se ejecutó la carga inicial y evitar doble llamado
    useEffect(() => {
        // Ignorar el primer render (montaje inicial) - solo ejecutar cuando filters realmente cambian
        if (!filtersChangeRef.current) {
            filtersChangeRef.current = true;
            return;
        }
        
        // Solo ejecutar si la carga inicial ya se completó Y los filtros realmente cambiaron
        if (initialLoadDoneRef.current) {
            console.log('🔄 [Dashboard] Filtros cambiaron, recargando datos...', filters);
            fetchDashboardData();
        }
    }, [filters, fetchDashboardData]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#752568]"></div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </MainLayout>
        );
    }

    const stats = dashboardData?.estadisticas_generales || {};

    return (
        <MainLayout>
            <div className="space-y-6 font-sans">
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

                {/* Section Title */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Estadísticas Generales del Sistema</h2>
                    <p className="text-gray-500 text-sm">
                        Análisis detallado de evaluaciones, citas y protocolos de atención
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="space-y-4">
                    {/* Fila 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total de Usuarios */}
                        <div className="bg-[#f3e8ff] rounded-xl p-4 border border-purple-100 relative">
                            <div className="absolute top-4 right-4">
                                <Users className="w-6 h-6 text-[#9333ea]" />
                            </div>
                            <div>
                                <p className="text-[#a855f7] font-medium text-sm mb-1">Total de Usuarios</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.total_serumistas || 0}</p>
                                <div className="mt-3 space-y-0.5">
                                    <p className="text-xs text-gray-700">
                                        Remunerados: <span className="font-bold">{stats.total_remunerados || 0}</span> ({stats.total_serumistas > 0 ? Math.round(((stats.total_remunerados || 0) / stats.total_serumistas) * 100) : 0}% del total)
                                    </p>
                                    <p className="text-xs text-gray-700">
                                        Equivalentes: <span className="font-bold">{stats.total_equivalentes || 0}</span> ({stats.total_serumistas > 0 ? Math.round(((stats.total_equivalentes || 0) / stats.total_serumistas) * 100) : 0}% del total)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Accedieron */}
                        <div className="bg-[#e0f2fe] rounded-xl p-4 border border-blue-100 relative">
                            <div className="absolute top-4 right-4">
                                <ClipboardCheck className="w-6 h-6 text-[#0284c7]" />
                            </div>
                            <div>
                                <p className="text-[#3b82f6] font-medium text-sm mb-1">Accedieron</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.accedieron_total || 0}</p>
                                <div className="mt-3 space-y-0.5">
                                    <p className="text-xs text-gray-700">
                                        Remunerados: <span className="font-bold">{stats.accedieron_remunerados || 0}</span> ({stats.accedieron_total > 0 ? Math.round(((stats.accedieron_remunerados || 0) / stats.accedieron_total) * 100) : 0}% del total)
                                    </p>
                                    <p className="text-xs text-gray-700">
                                        Equivalentes: <span className="font-bold">{stats.accedieron_equivalentes || 0}</span> ({stats.accedieron_total > 0 ? Math.round(((stats.accedieron_equivalentes || 0) / stats.accedieron_total) * 100) : 0}% del total)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tamizados */}
                        <div className="bg-[#dcfce7] rounded-xl p-4 border border-green-100 relative">
                            <div className="absolute top-4 right-4">
                                <Activity className="w-6 h-6 text-[#16a34a]" />
                            </div>
                            <div>
                                <p className="text-[#22c55e] font-medium text-sm mb-1">Tamizados</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.tamizados_total || 0}</p>
                                <div className="mt-3 space-y-0.5">
                                    <p className="text-xs text-gray-700">
                                        Remunerados: <span className="font-bold">{stats.tamizados_remunerados || 0}</span> ({stats.tamizados_total > 0 ? Math.round(((stats.tamizados_remunerados || 0) / stats.tamizados_total) * 100) : 0}% del total)
                                    </p>
                                    <p className="text-xs text-gray-700">
                                        Equivalentes: <span className="font-bold">{stats.tamizados_equivalentes || 0}</span> ({stats.tamizados_total > 0 ? Math.round(((stats.tamizados_equivalentes || 0) / stats.tamizados_total) * 100) : 0}% del total)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Citas registradas */}
                        <div className="bg-[#ffedd5] rounded-xl p-4 border border-orange-100 relative">
                            <div className="absolute top-4 right-4">
                                <Calendar className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-orange-600 font-medium text-sm mb-1">Citas registradas</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.citas_registradas || 0}</p>
                                <div className="mt-3 pt-2 border-t border-orange-200">
                                    <p className="text-orange-500 text-xs font-semibold mb-1">Intervención Breve</p>
                                    <p className="text-sm font-bold text-gray-800">
                                        Atendidas: <span className="text-green-600">{stats.citas_intervencion_breve_atendidas || 0}</span>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {stats.citas_registradas > 0 ? Math.round(((stats.citas_intervencion_breve_atendidas || 0) / stats.citas_registradas) * 100) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fila 2 - Derivaciones */}
                    <div>
                        <h3 className="text-md font-bold text-gray-800 mb-3">Derivaciones</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total de Casos Derivados */}
                            <div className="bg-[#e0e7ff] rounded-xl p-4 border border-indigo-100 relative">
                                <div className="absolute top-4 left-4">
                                    <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="pl-8">
                                    <p className="text-[#6366f1] font-medium text-sm mb-2">Total de Casos Derivados</p>
                                    <p className="text-3xl font-bold text-gray-800 mb-3">{stats.total_casos_derivados || 0}</p>
                                    <div className="border-t border-indigo-200 pt-3 flex gap-4">
                                        <div className="flex-1">
                                            <p className="text-xs text-[#4338ca] font-semibold flex items-center gap-1 mb-1">
                                                <span className="text-[10px]">↗</span> Tamizaje
                                            </p>
                                            <p className="text-xl font-bold text-gray-800">{stats.derivados_tamizaje || 0}</p>
                                            <p className="text-[#6366f1] text-[10px] mt-0.5">
                                                {stats.total_casos_derivados > 0 ? Math.round(((stats.derivados_tamizaje || 0) / stats.total_casos_derivados) * 100) : 0}% del total
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-[#4338ca] font-semibold flex items-center gap-1 mb-1">
                                                <Users className="w-3 h-3" /> Intervención Breve
                                            </p>
                                            <p className="text-xl font-bold text-gray-800">{stats.derivados_intervencion_breve || 0}</p>
                                            <p className="text-[#6366f1] text-[10px] mt-0.5">
                                                {stats.total_casos_derivados > 0 ? Math.round(((stats.derivados_intervencion_breve || 0) / stats.total_casos_derivados) * 100) : 0}% del total
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Derivaciones y Total Atendidos */}
                            <div className="bg-[#f3e8ff] rounded-xl p-4 border border-purple-100 relative">
                                <div className="absolute top-4 left-4">
                                    <ClipboardCheck className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="pl-8">
                                    <p className="text-[#9333ea] font-medium text-sm mb-2">Total Derivaciones</p>
                                    <p className="text-3xl font-bold text-gray-800 mb-3">{stats.total_casos_derivados || 0}</p>
                                    <div className="space-y-1.5 mb-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700">ESSALUD:</span>
                                            <span className="text-sm font-bold text-gray-800">{stats.derivaciones_essalud || 0} Derivaciones</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700">MINSA:</span>
                                            <span className="text-sm font-bold text-gray-800">{stats.derivaciones_minsa || 0} Derivaciones</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-purple-200 pt-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ClipboardCheck className="w-4 h-4 text-green-600" />
                                            <p className="text-[#9333ea] font-medium text-sm">Total Atendidos</p>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-800 mb-1">{stats.derivaciones_atendidas_total || 0}</p>
                                        <p className="text-xs text-gray-600 mb-2">
                                            ({stats.total_casos_derivados > 0 ? Math.round(((stats.derivaciones_atendidas_total || 0) / stats.total_casos_derivados) * 100) : 0}%)
                                        </p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-700">ESSALUD:</span>
                                                <span className="text-sm font-bold text-gray-800">{stats.derivaciones_atendidas_essalud || 0} Atendidos</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-700">MINSA:</span>
                                                <span className="text-sm font-bold text-gray-800">{stats.derivaciones_atendidas_minsa || 0} Atendidos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Derivaciones desde Tamizaje */}
                            <div className="bg-[#e0f2fe] rounded-xl p-4 border border-blue-100 relative">
                                <div className="absolute top-4 left-4">
                                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="pl-8">
                                    <p className="text-[#3b82f6] font-medium text-sm mb-3">Derivaciones desde Tamizaje</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> ASQ:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {stats.derivaciones_tamizaje_asq || 0} ({stats.total_casos_derivados > 0 ? Math.round(((stats.derivaciones_tamizaje_asq || 0) / stats.total_casos_derivados) * 100) : 0}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> PHQ:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {stats.derivaciones_tamizaje_phq || 0} ({stats.total_casos_derivados > 0 ? Math.round(((stats.derivaciones_tamizaje_phq || 0) / stats.total_casos_derivados) * 100) : 0}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> GAD:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {stats.derivaciones_tamizaje_gad || 0} ({stats.total_casos_derivados > 0 ? Math.round(((stats.derivaciones_tamizaje_gad || 0) / stats.total_casos_derivados) * 100) : 0}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> MBI:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {stats.derivaciones_tamizaje_mbi || 0} ({stats.total_casos_derivados > 0 ? Math.round(((stats.derivaciones_tamizaje_mbi || 0) / stats.total_casos_derivados) * 100) : 0}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> AUDIT:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {stats.derivaciones_tamizaje_audit || 0} ({stats.total_casos_derivados > 0 ? Math.round(((stats.derivaciones_tamizaje_audit || 0) / stats.total_casos_derivados) * 100) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="border-t border-blue-200 pt-2 mt-3">
                                        <p className="text-xs font-bold text-gray-800 text-center">
                                            Total {stats.total_casos_derivados || 0} (100%)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Evaluaciones por Tipo (Custom Progress) & Total por Concepto (Risk Chart) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Evaluaciones Realizadas por Tipo */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-6 flex items-center gap-2">
                            <BarChart className="w-4 h-4" /> Evaluaciones Realizadas por Tipo
                        </h3>
                        <div className="space-y-6">
                            {(() => {
                                // Asegurar que evaluaciones_por_tipo sea un array
                                const evaluaciones = dashboardData?.evaluaciones_por_tipo;
                                let evaluacionesArray = [];
                                
                                if (Array.isArray(evaluaciones)) {
                                    evaluacionesArray = evaluaciones;
                                } else if (evaluaciones && typeof evaluaciones === 'object') {
                                    // Si es un objeto, convertirlo a array usando Object.entries
                                    evaluacionesArray = Object.entries(evaluaciones).map(([tipo, datos]) => ({
                                        name: tipo.toUpperCase(),
                                        total: datos?.total || datos || 0,
                                        color: datos?.color || '#8884d8'
                                    }));
                                }
                                
                                return evaluacionesArray.map((item, index) => {
                                    // Calculamos un porcentaje relativo al total de evaluaciones o un maximo arbitrario para visualización
                                    const percentage = dashboardData?.estadisticas_generales?.evaluaciones_totales > 0
                                        ? Math.round((item.total / dashboardData?.estadisticas_generales?.evaluaciones_totales) * 100)
                                        : 0;
                                    // Colores variados para las barras simulando la imagen
                                    const barColors = ['#e11d48', '#d97706', '#7c3aed', '#db2777', '#2563eb'];
                                    const barColor = barColors[index % barColors.length];

                                    return (
                                        <div key={index} className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-700 font-medium w-12">{item.name?.split('-')[0] || item.name || 'N/A'}</span>
                                                    <span className="bg-[#752568] text-white text-xs px-2 py-0.5 rounded-full">
                                                        {item.total} evaluaciones
                                                    </span>
                                                </div>
                                                <span className="text-gray-500 text-sm font-medium">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 relative">
                                                <div
                                                    className="h-2.5 rounded-full"
                                                    style={{ width: `${percentage}%`, background: `linear-gradient(90deg, #752568 0%, ${barColor} 100%)` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Total por Concepto (Simulating Risk Distribution per Image) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-4 flex items-center gap-2">
                            <BarChart className="w-4 h-4" /> Total por Concepto (Tamizados)
                        </h3>
                        {/*
                          Preferimos total_por_concepto (backend) y si no existe usamos un fallback.
                          Nota: en el tablero PowerBI este gráfico suele reflejar el "concepto" (1..5) para Alcoholismo.
                        */}
                        {(() => {
                            const conceptoData = (dashboardData?.total_por_concepto?.length > 0)
                                ? dashboardData.total_por_concepto
                                : [
                                    { nivel: '1.ALTO', cantidad: 4, color: '#ef4444' },
                                    { nivel: '2.MODERADO', cantidad: 30, color: '#f59e0b' },
                                    { nivel: '3.LEVE', cantidad: 293, color: '#10b981' },
                                    { nivel: '4.SIN RIESGO', cantidad: 0, color: '#9ca3af' },
                                    { nivel: '5.SIN REGISTRO', cantidad: 26, color: '#6b7280' },
                                ];

                            return (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                layout="vertical"
                                data={conceptoData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" tickLine={false} axisLine={false} />
                                <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 12, fill: '#4b5563' }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={24}>
                                    {conceptoData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                            );
                        })()}
                    </div>
                </div>

                {/* Row 3: Distribución Sexo & Edad */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sexo */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Distribución por Sexo - Tamizados
                        </h3>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dashboardData?.distribucion_sexo || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0} // Pie completo como en la imagen (o donut si prefieren, imagen es pie solido)
                                        outerRadius={100}
                                        dataKey="value"
                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                                        labelLine={false} // Imagen muestra labels flotantes o externos con linea? Imagen muestra colores solidos y texto
                                    >
                                        {(dashboardData?.distribucion_sexo || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'Masculino' ? '#3b82f6' : '#ec4899'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Grupo Etáreo */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Distribución por Grupo Etáreo
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dashboardData?.distribucion_edad || []} margin={{ top: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="grupo" tick={{ fontSize: 12, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={45}>
                                    <LabelList dataKey="cantidad" position="top" fill="#374151" fontSize={12} fontWeight="bold" />
                                    {(dashboardData?.distribucion_edad || []).map((entry, index) => {
                                        const colors = ['#7e22ce', '#fbbf24', '#3b82f6', '#10b981', '#6b7280'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 4: PHQ & GAD */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-red-600 font-bold mb-4">Depresión (PHQ)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart layout="vertical" data={dashboardData?.distribucion_phq || []} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                                    {(dashboardData?.distribucion_phq || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-orange-500 font-bold mb-4">Ansiedad (GAD)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart layout="vertical" data={dashboardData?.distribucion_gad || []} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                                    {(dashboardData?.distribucion_gad || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 5: AUDIT & MBI */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-yellow-600 font-bold mb-4">Alcoholismo (AUDIT)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart layout="vertical" data={dashboardData?.distribucion_audit || []} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                                    {(dashboardData?.distribucion_audit || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-green-600 font-bold mb-4">Burnout (MBI)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart layout="vertical" data={dashboardData?.distribucion_mbi || []} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                                    {(dashboardData?.distribucion_mbi || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Análisis Detallado - ASQ */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-[#752568] font-bold mb-6">Análisis Detallado - ASQ</h3>
                    {dashboardData?.analisis_asq && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-red-50 rounded-lg p-6 text-center border-b-4 border-red-400">
                                <p className="text-4xl font-bold text-red-500">{dashboardData.analisis_asq.rsa_si}</p>
                                <p className="text-gray-600 text-sm mt-2">RSA: SI</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-6 text-center border-b-4 border-green-400">
                                <p className="text-4xl font-bold text-green-500">{dashboardData.analisis_asq.rsa_no}</p>
                                <p className="text-gray-600 text-sm mt-2">RSA: No</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-6 text-center border-b-4 border-orange-400">
                                <p className="text-4xl font-bold text-orange-500">{dashboardData.analisis_asq.rsna_si}</p>
                                <p className="text-gray-600 text-sm mt-2">RSNA: SI</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-6 text-center border-b-4 border-gray-400">
                                <p className="text-4xl font-bold text-gray-500">{dashboardData.analisis_asq.rsna_sin_riesgo}</p>
                                <p className="text-gray-600 text-sm mt-2">RSNA: Sin Riesgo</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Estado de Citas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-[#752568]" />
                        <h3 className="text-[#752568] font-bold">Estado de Citas</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            layout="vertical"
                            data={dashboardData?.estado_citas || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="estado" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                                {(dashboardData?.estado_citas || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Tendencia Mensual */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-[#752568]" />
                        <h3 className="text-[#752568] font-bold">Tendencia Mensual - Evaluaciones y Citas</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dashboardData?.tendencia_mensual || []}>
                            <defs>
                                <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEvaluaciones" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#752568" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#752568" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="Citas"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorCitas)"
                            />
                            <Area
                                type="monotone"
                                dataKey="Evaluaciones"
                                stroke="#752568"
                                fillOpacity={1}
                                fill="url(#colorEvaluaciones)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Protocolos y Disponibilidad */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Protocolos de Atención */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-6">Protocolos de Atención</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <span className="text-gray-700 font-medium">En Curso</span>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    {dashboardData?.protocolos?.en_curso || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <span className="text-gray-700 font-medium">Completados</span>
                                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    {dashboardData?.protocolos?.completados || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                                <span className="text-gray-700 font-medium">Pendientes</span>
                                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    {dashboardData?.protocolos?.pendientes || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                <span className="text-gray-700 font-medium">Total Intervenciones</span>
                                <span className="bg-[#752568] text-white px-3 py-1 rounded-full text-sm font-bold">
                                    {dashboardData?.protocolos?.total_intervenciones || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                                <span className="text-gray-700 font-medium">Promedio Sesiones/Paciente</span>
                                <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    {dashboardData?.protocolos?.promedio_sesiones_paciente || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Disponibilidad Horaria */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-6">Disponibilidad Horaria</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-gray-700">Horarios Disponibles</span>
                                <span className="text-green-600 font-bold bg-white px-2 py-1 rounded shadow-sm">
                                    {dashboardData?.disponibilidad?.horarios_disponibles || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-gray-700">Horarios Ocupados</span>
                                <span className="text-blue-600 font-bold bg-white px-2 py-1 rounded shadow-sm">
                                    {dashboardData?.disponibilidad?.horarios_ocupados || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <span className="text-gray-700">Terapeutas Activos</span>
                                <span className="text-purple-600 font-bold bg-white px-2 py-1 rounded shadow-sm">
                                    {dashboardData?.disponibilidad?.terapeutas_activos || 0}
                                </span>
                            </div>

                            <div className="mt-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Tasa de Ocupación</span>
                                    <span className="font-bold text-gray-900">{dashboardData?.disponibilidad?.tasa_ocupacion || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#752568] to-[#f59e0b] h-3 rounded-full"
                                        style={{ width: `${dashboardData?.disponibilidad?.tasa_ocupacion || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alertas y Recomendaciones */}
                {dashboardData?.alertas && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h3 className="text-red-800 font-bold">Alertas y Recomendaciones</h3>
                        </div>
                        <div className="space-y-2">
                            {dashboardData.alertas.map((alerta, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>{alerta.mensaje}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cantidad por Instituciones */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Building className="w-5 h-5 text-[#752568]" />
                        <h3 className="text-lg font-bold text-gray-800">Cantidad por Instituciones</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dashboardData?.cantidad_por_instituciones || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#752568" radius={[4, 4, 0, 0]} barSize={40}>
                                {(dashboardData?.cantidad_por_instituciones || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#752568' : '#f59e0b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </MainLayout>
    );
};

export default DashboardPage;
