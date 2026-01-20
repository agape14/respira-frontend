import { Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const Section8_EstadoCitas = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#752568]" />
                <h3 className="text-[#752568] font-bold">Estado de Citas</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    layout="vertical"
                    data={data?.estado_citas || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="estado" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                        {(data?.estado_citas || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Section8_EstadoCitas;
