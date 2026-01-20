import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const Section6_AlcoholismoBurnout = ({ data }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alcoholismo (AUDIT) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-yellow-600 font-bold mb-4">Alcoholismo (AUDIT)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart layout="vertical" data={data?.distribucion_audit || []} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                            {(data?.distribucion_audit || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Burnout (MBI) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-green-600 font-bold mb-4">Burnout (MBI)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart layout="vertical" data={data?.distribucion_mbi || []} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="nivel" type="category" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                            {(data?.distribucion_mbi || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Section6_AlcoholismoBurnout;
