const Section7_AnalisisASQ = ({ data }) => {
    const analisis = data?.analisis_asq || {};

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-[#752568] font-bold mb-6">Análisis Detallado - ASQ</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 rounded-lg p-6 text-center border-b-4 border-red-400">
                    <p className="text-4xl font-bold text-red-500">{analisis.rsa_si || 0}</p>
                    <p className="text-gray-600 text-sm mt-2">RSA: SI</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6 text-center border-b-4 border-green-400">
                    <p className="text-4xl font-bold text-green-500">{analisis.rsa_no || 0}</p>
                    <p className="text-gray-600 text-sm mt-2">RSA: No</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-6 text-center border-b-4 border-orange-400">
                    <p className="text-4xl font-bold text-orange-500">{analisis.rsna_si || 0}</p>
                    <p className="text-gray-600 text-sm mt-2">RSNA: SI</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center border-b-4 border-gray-400">
                    <p className="text-4xl font-bold text-gray-500">{analisis.rsna_sin_riesgo || 0}</p>
                    <p className="text-gray-600 text-sm mt-2">RSNA: Sin Riesgo</p>
                </div>
            </div>
        </div>
    );
};

export default Section7_AnalisisASQ;
