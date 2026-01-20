import { BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Section3_EvaluacionesPorTipo = ({ data }) => {
    // Preparar datos de evaluaciones por tipo
    const evaluaciones = data?.evaluaciones_por_tipo;
    let evaluacionesArray = [];
    
    if (Array.isArray(evaluaciones)) {
        evaluacionesArray = evaluaciones;
    } else if (evaluaciones && typeof evaluaciones === 'object') {
        evaluacionesArray = Object.entries(evaluaciones).map(([tipo, datos]) => ({
            name: tipo.toUpperCase(),
            total: datos?.total || datos || 0,
            color: datos?.color || '#8884d8'
        }));
    }

    const conceptoData = (data?.total_por_concepto?.length > 0)
        ? data.total_por_concepto
        : [
            { nivel: '1.ALTO', cantidad: 4, color: '#ef4444' },
            { nivel: '2.MODERADO', cantidad: 30, color: '#f59e0b' },
            { nivel: '3.LEVE', cantidad: 293, color: '#10b981' },
            { nivel: '4.SIN RIESGO', cantidad: 0, color: '#9ca3af' },
            { nivel: '5.SIN REGISTRO', cantidad: 26, color: '#6b7280' },
        ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evaluaciones Realizadas por Tipo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[#752568] font-bold mb-6 flex items-center gap-2">
                    <BarChartIcon className="w-4 h-4" /> Evaluaciones Realizadas por Tipo
                </h3>
                <div className="space-y-6">
                    {evaluacionesArray.map((item, index) => {
                        const percentage = data?.estadisticas_generales?.evaluaciones_totales > 0
                            ? Math.round((item.total / data?.estadisticas_generales?.evaluaciones_totales) * 100)
                            : 0;
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
                    })}
                </div>
            </div>

            {/* Total por Concepto (Tamizados) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[#752568] font-bold mb-4 flex items-center gap-2">
                    <BarChartIcon className="w-4 h-4" /> Total por Concepto (Tamizados)
                </h3>
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
            </div>
        </div>
    );
};

export default Section3_EvaluacionesPorTipo;
