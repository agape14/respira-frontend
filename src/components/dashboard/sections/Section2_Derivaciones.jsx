import { ClipboardCheck, Users } from 'lucide-react';

const Section2_Derivaciones = ({ data }) => {
    const stats = data?.estadisticas_generales || {};

    return (
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
                        {(() => {
                            const asq = stats.derivaciones_tamizaje_asq || 0;
                            const phq = stats.derivaciones_tamizaje_phq || 0;
                            const gad = stats.derivaciones_tamizaje_gad || 0;
                            const mbi = stats.derivaciones_tamizaje_mbi || 0;
                            const audit = stats.derivaciones_tamizaje_audit || 0;
                            const totalEvaluaciones = asq + phq + gad + mbi + audit;
                            const totalTamizados = stats.total_casos_derivados || 0;
                            const pct = (n) => totalEvaluaciones > 0 ? Math.round((n / totalEvaluaciones) * 100) : 0;
                            return (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> ASQ:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {asq} ({pct(asq)}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> PHQ:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {phq} ({pct(phq)}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> GAD:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {gad} ({pct(gad)}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> MBI:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {mbi} ({pct(mbi)}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-700 flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> AUDIT:
                                            </span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {audit} ({pct(audit)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="border-t border-blue-200 pt-2 mt-3 space-y-0.5">
                                        <p className="text-xs font-bold text-gray-800 text-center">
                                            Total {totalEvaluaciones} derivaciones (100%)
                                        </p>
                                        <p className="text-xs text-gray-600 text-center">
                                            {totalTamizados} tamizados únicos
                                        </p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Section2_Derivaciones;
