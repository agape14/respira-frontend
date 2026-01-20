import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const Section5_DepresionAnsiedad = ({ data }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Depresión (PHQ) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-red-600 font-bold mb-4">Depresión (PHQ)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart layout="vertical" data={data?.distribucion_phq || []} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                            {(data?.distribucion_phq || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Ansiedad (GAD) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-orange-500 font-bold mb-4">Ansiedad (GAD)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart layout="vertical" data={data?.distribucion_gad || []} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                            {(data?.distribucion_gad || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Section5_DepresionAnsiedad;
