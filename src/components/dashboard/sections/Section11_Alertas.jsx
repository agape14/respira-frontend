import { AlertTriangle } from 'lucide-react';

const Section11_Alertas = ({ data }) => {
    const alertas = data?.alertas || [];

    if (!alertas || alertas.length === 0) {
        return null;
    }

    return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-red-800 font-bold">Alertas y Recomendaciones</h3>
            </div>
            <div className="space-y-2">
                {alertas.map((alerta, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{alerta.mensaje || alerta}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Section11_Alertas;
