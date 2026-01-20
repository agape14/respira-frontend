import { Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

const Section4_DistribucionSexoEdad = ({ data }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por Sexo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[#752568] font-bold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Distribución por Sexo - Tamizados
                </h3>
                <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data?.distribucion_sexo || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                                labelLine={false}
                            >
                                {(data?.distribucion_sexo || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'Masculino' ? '#3b82f6' : '#ec4899'} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribución por Grupo Etáreo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[#752568] font-bold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Distribución por Grupo Etáreo
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.distribucion_edad || []} margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="grupo" tick={{ fontSize: 12, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={45}>
                            <LabelList dataKey="cantidad" position="top" fill="#374151" fontSize={12} fontWeight="bold" />
                            {(data?.distribucion_edad || []).map((entry, index) => {
                                const colors = ['#7e22ce', '#fbbf24', '#3b82f6', '#10b981', '#6b7280'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Section4_DistribucionSexoEdad;
