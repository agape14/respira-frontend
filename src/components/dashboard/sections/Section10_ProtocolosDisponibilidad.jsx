const Section10_ProtocolosDisponibilidad = ({ data }) => {
    const protocolos = data?.protocolos || {};
    const disponibilidad = data?.disponibilidad || {};

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Protocolos de Atención */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[#752568] font-bold mb-6">Protocolos de Atención</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <span className="text-gray-700 font-medium">En Curso</span>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {protocolos.en_curso || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Completados</span>
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {protocolos.completados || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Pendientes</span>
                        <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {protocolos.pendientes || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Total Intervenciones</span>
                        <span className="bg-[#752568] text-white px-3 py-1 rounded-full text-sm font-bold">
                            {protocolos.total_intervenciones || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Promedio Sesiones/Paciente</span>
                        <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {protocolos.promedio_sesiones_paciente || 0}
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
                            {disponibilidad.horarios_disponibles || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-700">Horarios Ocupados</span>
                        <span className="text-blue-600 font-bold bg-white px-2 py-1 rounded shadow-sm">
                            {disponibilidad.horarios_ocupados || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-gray-700">Terapeutas Activos</span>
                        <span className="text-purple-600 font-bold bg-white px-2 py-1 rounded shadow-sm">
                            {disponibilidad.terapeutas_activos || 0}
                        </span>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Tasa de Ocupación</span>
                            <span className="font-bold text-gray-900">{disponibilidad.tasa_ocupacion || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-[#752568] to-[#f59e0b] h-3 rounded-full"
                                style={{ width: `${disponibilidad.tasa_ocupacion || 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Section10_ProtocolosDisponibilidad;
