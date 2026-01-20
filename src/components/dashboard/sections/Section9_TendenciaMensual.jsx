import { Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Section9_TendenciaMensual = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#752568]" />
                <h3 className="text-[#752568] font-bold">Tendencia Mensual - Evaluaciones y Citas</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.tendencia_mensual || []}>
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
    );
};

export default Section9_TendenciaMensual;
