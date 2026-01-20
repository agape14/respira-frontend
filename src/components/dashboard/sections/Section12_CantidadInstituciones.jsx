import { Building } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const Section12_CantidadInstituciones = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Building className="w-5 h-5 text-[#752568]" />
                <h3 className="text-lg font-bold text-gray-800">Cantidad por Instituciones</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.cantidad_por_instituciones || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" fill="#752568" radius={[4, 4, 0, 0]} barSize={40}>
                        {(data?.cantidad_por_instituciones || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#752568' : '#f59e0b'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Section12_CantidadInstituciones;
