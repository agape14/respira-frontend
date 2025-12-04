import { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import axios from '../api/axios';
import { Users, FileText, Calendar, ClipboardCheck, AlertTriangle, Clock } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/dashboard-data');
            setDashboardData(response.data);
            setError(null);
        } catch (err) {
            setError('Error al cargar los datos del dashboard');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

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
                {/* Subheader */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Estadísticas Generales del Sistema</h2>
                    <p className="text-gray-500 text-sm">
                        Análisis detallado de evaluaciones, citas y protocolos de atención
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Serumistas */}
                    <div className="bg-[#f3e8ff] rounded-xl p-4 border border-purple-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[#752568] font-medium text-sm">Total Serumistas</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_serumistas || 0}</p>
                                <p className="text-green-600 text-xs mt-1 font-medium">↗ +8%</p>
                            </div>
                            <div className="p-2 bg-[#e9d5ff] rounded-lg">
                                <Users className="w-5 h-5 text-[#752568]" />
                            </div>
                        </div>
                    </div>

                    {/* Evaluaciones Totales */}
                    <div className="bg-[#e0f2fe] rounded-xl p-4 border border-blue-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-600 font-medium text-sm">Evaluaciones Totales</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.evaluaciones_totales || 0}</p>
                                <p className="text-green-600 text-xs mt-1 font-medium">↗ +12%</p>
                            </div>
                            <div className="p-2 bg-[#bae6fd] rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Citas Atendidas */}
                    <div className="bg-[#dcfce7] rounded-xl p-4 border border-green-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-green-600 font-medium text-sm">Citas Atendidas</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.citas_atendidas || 0}</p>
                                <p className="text-green-600 text-xs mt-1 font-medium">☺ 67% del total</p>
                            </div>
                            <div className="p-2 bg-[#bbf7d0] rounded-lg">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Protocolos Activos */}
                    <div className="bg-[#ffedd5] rounded-xl p-4 border border-orange-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-orange-600 font-medium text-sm">Protocolos Activos</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.protocolos_activos || 0}</p>
                                <p className="text-orange-600 text-xs mt-1 font-medium">⚡ En proceso</p>
                            </div>
                            <div className="p-2 bg-[#fed7aa] rounded-lg">
                                <ClipboardCheck className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evaluaciones Realizadas por Tipo */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-5 h-5 text-[#752568]" />
                        <h3 className="text-lg font-bold text-gray-800">Evaluaciones Realizadas por Tipo</h3>
                    </div>
                    <div className="space-y-6">
                        {dashboardData?.evaluaciones_por_tipo && Object.entries(dashboardData.evaluaciones_por_tipo).map(([tipo, datos]) => (
                            <div key={tipo}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold text-gray-700 uppercase">{tipo}</span>
                                    <span className="text-gray-500">{datos.porcentaje}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 min-w-[120px]">
                                        <span className="text-xs font-bold bg-[#752568] text-white px-2 py-0.5 rounded-full">
                                            {datos.total} evaluaciones
                                        </span>
                                    </div>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-[#752568] to-[#f59e0b] h-2 rounded-full"
                                            style={{ width: `${datos.porcentaje}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gráficos de Riesgo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribución de Riesgos - PHQ/GAD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-4">Distribución de Riesgos - PHQ/GAD</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dashboardData?.distribucion_phq_gad || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="nivel" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Legend iconType="circle" />
                                <Bar dataKey="GAD" fill="#f59e0b" name="GAD" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="PHQ" fill="#752568" name="PHQ" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Distribución de Riesgos - MBI (AUDIT) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[#752568] font-bold mb-4">Distribución de Riesgos - MBI (AUDIT)</h3>
                        <div className="flex items-center justify-center h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Riesgo Alto', value: 28, color: '#ef4444' },
                                            { name: 'Riesgo Moderado', value: 45, color: '#f59e0b' },
                                            { name: 'Riesgo Leve', value: 32, color: '#10b981' },
                                            { name: 'Sin Riesgo', value: 13, color: '#6b7280' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={100}
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Riesgo Alto', value: 28, color: '#ef4444' },
                                            { name: 'Riesgo Moderado', value: 45, color: '#f59e0b' },
                                            { name: 'Riesgo Leve', value: 32, color: '#10b981' },
                                            { name: 'Sin Riesgo', value: 13, color: '#6b7280' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Análisis Detallado - ASQ */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-[#752568] font-bold mb-6">Análisis Detallado - ASQ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-red-50 rounded-lg p-6 text-center border-b-4 border-red-400">
                            <p className="text-4xl font-bold text-red-500">45</p>
                            <p className="text-gray-600 text-sm mt-2">RSA: SI</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6 text-center border-b-4 border-green-400">
                            <p className="text-4xl font-bold text-green-500">80</p>
                            <p className="text-gray-600 text-sm mt-2">RSA: No</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-6 text-center border-b-4 border-orange-400">
                            <p className="text-4xl font-bold text-orange-500">38</p>
                            <p className="text-gray-600 text-sm mt-2">RSNA: SI</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 text-center border-b-4 border-gray-400">
                            <p className="text-4xl font-bold text-gray-500">87</p>
                            <p className="text-gray-600 text-sm mt-2">RSNA: Sin Riesgo</p>
                        </div>
                    </div>
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
            </div>
        </MainLayout>
    );
};

export default DashboardPage;
