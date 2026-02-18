import { Users, ClipboardCheck, Activity, Calendar, Download } from 'lucide-react';
import api from '../../../api/axios';

/** Porcentajes que suman exactamente 100% (el último recibe el ajuste por redondeo) */
const pctSum100 = (values) => {
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return values.map(() => 0);
    const n = values.length;
    const pct = values.map((v) => Math.round((v / total) * 100));
    const sum = pct.reduce((a, b) => a + b, 0);
    const diff = 100 - sum;
    if (diff !== 0 && n > 0) pct[n - 1] += diff;
    return pct;
};

const Section1_EstadisticasGenerales = ({ data }) => {
    const stats = data?.estadisticas_generales || {};
    const noClasificados = Math.max(0, (stats.tamizados_total || 0) - (stats.tamizados_remunerados || 0) - (stats.tamizados_equivalentes || 0));

    const handleDescargarNoClasificados = async () => {
        try {
            const res = await api.get('/dashboard/tamizados-no-clasificados', {
                params: { format: 'xlsx' },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Tamizados_No_Clasificados_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Error al descargar la lista');
        }
    };

    return (
        <div className="space-y-3">
            {/* Section Title */}
            <div>
                <h2 className="text-lg font-bold text-gray-900">Estadísticas Generales del Sistema</h2>
                <p className="text-gray-500 text-sm">
                    Análisis detallado de evaluaciones, citas y protocolos de atención
                </p>
            </div>

            {/* KPI Cards */}
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
                            {(() => {
                                const [pRem, pEquiv, pNoClas] = pctSum100([
                                    stats.total_remunerados || 0,
                                    stats.total_equivalentes || 0,
                                    stats.total_no_clasificados ?? 0,
                                ]);
                                return (
                                    <>
                                        <p className="text-xs text-gray-700">
                                            Remunerados: <span className="font-bold">{stats.total_remunerados || 0}</span> ({pRem}% del total)
                                        </p>
                                        <p className="text-xs text-gray-700">
                                            Equivalentes: <span className="font-bold">{stats.total_equivalentes || 0}</span> ({pEquiv}% del total)
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            No clasificados: <span className="font-bold">{stats.total_no_clasificados ?? 0}</span> ({pNoClas}% del total)
                                        </p>
                                    </>
                                );
                            })()}
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
                            {(() => {
                                const [pRem, pEquiv, pNoClas] = pctSum100([
                                    stats.accedieron_remunerados || 0,
                                    stats.accedieron_equivalentes || 0,
                                    stats.accedieron_no_clasificados ?? 0,
                                ]);
                                return (
                                    <>
                                        <p className="text-xs text-gray-700">
                                            Remunerados: <span className="font-bold">{stats.accedieron_remunerados || 0}</span> ({pRem}% del total)
                                        </p>
                                        <p className="text-xs text-gray-700">
                                            Equivalentes: <span className="font-bold">{stats.accedieron_equivalentes || 0}</span> ({pEquiv}% del total)
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            No clasificados: <span className="font-bold">{stats.accedieron_no_clasificados ?? 0}</span> ({pNoClas}% del total)
                                        </p>
                                    </>
                                );
                            })()}
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
                            {(() => {
                                const [pRem, pEquiv, pNoClas] = pctSum100([
                                    stats.tamizados_remunerados || 0,
                                    stats.tamizados_equivalentes || 0,
                                    noClasificados,
                                ]);
                                return (
                                    <>
                                        <p className="text-xs text-gray-700">
                                            Remunerados: <span className="font-bold">{stats.tamizados_remunerados || 0}</span> ({pRem}% del total)
                                        </p>
                                        <p className="text-xs text-gray-700">
                                            Equivalentes: <span className="font-bold">{stats.tamizados_equivalentes || 0}</span> ({pEquiv}% del total)
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            No clasificados: <span className="font-bold">{noClasificados}</span> ({pNoClas}% del total)
                                        </p>
                                    </>
                                );
                            })()}
                            {noClasificados > 0 && (
                                <button
                                    type="button"
                                    onClick={handleDescargarNoClasificados}
                                    className="mt-2 flex items-center gap-1 text-xs text-green-700 hover:text-green-800 hover:underline"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar lista Excel
                                </button>
                            )}
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
        </div>
    );
};

export default Section1_EstadisticasGenerales;
