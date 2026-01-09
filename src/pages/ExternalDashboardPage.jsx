import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { Users, FileText, Calendar, ClipboardCheck, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, Cell
} from 'recharts';

const ExternalDashboardPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);
    const [tokenInfo, setTokenInfo] = useState(null);
    const [consejoRegionalId, setConsejoRegionalId] = useState(null);

    // Obtener parámetros de la URL
    const token = searchParams.get('token');
    const idCr = searchParams.get('id_cr');

    useEffect(() => {
        // Validar que existan los parámetros requeridos
        if (!token || !idCr) {
            setError('Parámetros faltantes: se requiere token e id_cr en la URL');
            setLoading(false);
            return;
        }

        fetchDashboardData();
    }, [token, idCr]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Llamar al endpoint público con token e id_cr
            const response = await axiosInstance.get('/external/dashboard', {
                params: {
                    token: token,
                    id_cr: idCr
                }
            });

            if (response.data.success) {
                setDashboardData(response.data);
                setTokenInfo(response.data.token_info);
                setConsejoRegionalId(response.data.consejo_regional_id);
            } else {
                setError(response.data.message || 'Error al cargar los datos');
            }
        } catch (err) {
            console.error('Error:', err);
            
            if (err.response) {
                // Error de respuesta del servidor
                if (err.response.status === 401) {
                    setError('Token inválido o expirado. Verifique sus credenciales de acceso.');
                } else if (err.response.status === 403) {
                    setError('No tiene permiso para acceder a este consejo regional.');
                } else if (err.response.status === 422) {
                    setError('Parámetros inválidos en la solicitud.');
                } else {
                    setError(err.response.data?.message || 'Error al cargar los datos del dashboard');
                }
            } else if (err.request) {
                setError('No se pudo conectar con el servidor. Verifique su conexión a internet.');
            } else {
                setError('Error inesperado al procesar la solicitud.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#752568] mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-500">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                            Acceso Denegado
                        </h2>
                        <p className="text-gray-600 text-center mb-6">
                            {error}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                            <p className="font-semibold mb-2">Información de la solicitud:</p>
                            <p>• Token: {token ? '✓ Presente' : '✗ Faltante'}</p>
                            <p>• ID Consejo Regional: {idCr ? `✓ ${idCr}` : '✗ Faltante'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const stats = dashboardData?.estadisticas_generales || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            {/* Header con información del consejo regional */}
            <div className="bg-[#752568] text-white shadow-lg">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <ExternalLink className="w-6 h-6" />
                                <h1 className="text-2xl font-bold">Dashboard Externo - Sistema Respira</h1>
                            </div>
                            <p className="text-purple-200 text-sm">
                                Consejo Regional ID: {consejoRegionalId} | 
                                Aplicación: {tokenInfo?.nombre_aplicacion || 'N/A'}
                            </p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="text-purple-200">Vista de solo lectura</p>
                            <p className="text-xs text-purple-300">
                                Último acceso: {tokenInfo?.ultimo_uso ? new Date(tokenInfo.ultimo_uso).toLocaleString('es-PE') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Información del Consejo Regional */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            Estadísticas del Consejo Regional
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Datos actualizados en tiempo real para el consejo regional ID: {consejoRegionalId}
                        </p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Serumistas */}
                        <div className="bg-white rounded-xl p-6 border-l-4 border-[#752568] shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[#752568] font-medium text-sm">Total Serumistas</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_serumistas || 0}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Users className="w-6 h-6 text-[#752568]" />
                                </div>
                            </div>
                        </div>

                        {/* Evaluaciones Totales */}
                        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-600 font-medium text-sm">Evaluaciones Totales</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.evaluaciones_totales || 0}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Citas Atendidas */}
                        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-green-600 font-medium text-sm">Citas Atendidas</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.citas_atendidas || 0}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Calendar className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Protocolos Activos */}
                        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-orange-600 font-medium text-sm">Protocolos Activos</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.protocolos_activos || 0}</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <ClipboardCheck className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Evaluaciones por Tipo */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <FileText className="w-5 h-5 text-[#752568]" />
                            <h3 className="text-lg font-bold text-gray-800">Evaluaciones Realizadas por Tipo</h3>
                        </div>
                        <div className="space-y-4">
                            {dashboardData?.evaluaciones_por_tipo && Object.entries(dashboardData.evaluaciones_por_tipo).map(([tipo, datos]) => (
                                <div key={tipo}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-semibold text-gray-700 uppercase">{tipo}</span>
                                        <span className="text-gray-500">{datos.total} evaluaciones ({datos.porcentaje}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-[#752568] to-[#f59e0b] h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${datos.porcentaje}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Estado de Citas */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                                    <XAxis type="number" />
                                    <YAxis dataKey="estado" type="category" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={25}>
                                        {(dashboardData?.estado_citas || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Tendencia Mensual */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-[#752568]" />
                                <h3 className="text-[#752568] font-bold">Tendencia Mensual</h3>
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
                                    <XAxis dataKey="mes" />
                                    <YAxis />
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
                    </div>

                    {/* Alertas */}
                    {dashboardData?.alertas && dashboardData.alertas.length > 0 && (
                        <div className={`rounded-xl border p-6 ${
                            dashboardData.alertas[0]?.tipo === 'success' 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-orange-50 border-orange-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className={`w-5 h-5 ${
                                    dashboardData.alertas[0]?.tipo === 'success' 
                                        ? 'text-green-600' 
                                        : 'text-orange-600'
                                }`} />
                                <h3 className={`font-bold ${
                                    dashboardData.alertas[0]?.tipo === 'success' 
                                        ? 'text-green-800' 
                                        : 'text-orange-800'
                                }`}>
                                    Alertas y Recomendaciones
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {dashboardData.alertas.map((alerta, index) => (
                                    <div 
                                        key={index} 
                                        className={`flex items-start gap-2 text-sm ${
                                            alerta.tipo === 'danger' ? 'text-red-700' :
                                            alerta.tipo === 'warning' ? 'text-orange-700' :
                                            alerta.tipo === 'success' ? 'text-green-700' :
                                            'text-blue-700'
                                        }`}
                                    >
                                        <span className="mt-0.5">
                                            {alerta.tipo === 'danger' ? '🔴' :
                                             alerta.tipo === 'warning' ? '⚠️' :
                                             alerta.tipo === 'success' ? '✅' :
                                             'ℹ️'}
                                        </span>
                                        <span>{alerta.mensaje}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                        <p className="text-gray-500 text-sm">
                            Sistema de Salud Mental - RESPIRA | Dashboard de solo lectura
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            Los datos mostrados son confidenciales y de uso exclusivo de aplicaciones autorizadas
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExternalDashboardPage;

