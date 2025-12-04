import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import axios from '../api/axios';
import { ArrowLeft, Download, Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const TamizajeDetallePage = () => {
    const { dni } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tipo = searchParams.get('tipo'); // 'asq', 'phq9', 'gad', 'mbi', 'audit'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        asq: [],
        phq9: [],
        gad: [],
        mbi: [],
        audit: []
    });

    // Referencias para hacer scroll a la evaluación específica
    const asqRef = useRef(null);
    const phq9Ref = useRef(null);
    const gadRef = useRef(null);
    const mbiRef = useRef(null);
    const auditRef = useRef(null);

    useEffect(() => {
        fetchDetalle();
    }, [dni]);

    const fetchDetalle = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/tamizajes/${dni}`);
            if (response.data.success) {
                setData(response.data);

                // Si hay un tipo específico en la URL, expandir solo ese tipo
                if (tipo) {
                    setExpandedSections({
                        asq: tipo === 'asq' && response.data.evaluaciones.asq.length > 0 ? [0] : [],
                        phq9: tipo === 'phq9' && response.data.evaluaciones.phq9.length > 0 ? [0] : [],
                        gad: tipo === 'gad' && response.data.evaluaciones.gad.length > 0 ? [0] : [],
                        mbi: tipo === 'mbi' && response.data.evaluaciones.mbi.length > 0 ? [0] : [],
                        audit: tipo === 'audit' && response.data.evaluaciones.audit.length > 0 ? [0] : []
                    });

                    // Hacer scroll a la evaluación específica después de un pequeño delay
                    setTimeout(() => {
                        const refs = {
                            asq: asqRef,
                            phq9: phq9Ref,
                            gad: gadRef,
                            mbi: mbiRef,
                            audit: auditRef
                        };
                        refs[tipo]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                } else {
                    // Sin tipo específico, expandir la primera evaluación de cada tipo por defecto
                    setExpandedSections({
                        asq: response.data.evaluaciones.asq.length > 0 ? [0] : [],
                        phq9: response.data.evaluaciones.phq9.length > 0 ? [0] : [],
                        gad: response.data.evaluaciones.gad.length > 0 ? [0] : [],
                        mbi: response.data.evaluaciones.mbi.length > 0 ? [0] : [],
                        audit: response.data.evaluaciones.audit.length > 0 ? [0] : []
                    });
                }
            }
        } catch (error) {
            console.error('Error al obtener detalle:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (type, index) => {
        setExpandedSections(prev => {
            const current = prev[type] || [];
            const isExpanded = current.includes(index);
            return {
                ...prev,
                [type]: isExpanded
                    ? current.filter(i => i !== index)
                    : [...current, index]
            };
        });
    };

    const getRiesgoBadgeColor = (riesgo) => {
        if (!riesgo) return 'bg-gray-100 text-gray-600';

        const riesgoLower = riesgo.toLowerCase();
        if (riesgoLower.includes('alto') || riesgoLower.includes('problemático')) {
            return 'bg-red-100 text-red-700';
        } else if (riesgoLower.includes('moderado') || riesgoLower.includes('riesgoso')) {
            return 'bg-yellow-100 text-yellow-700';
        } else if (riesgoLower.includes('leve') || riesgoLower.includes('bajo')) {
            return 'bg-green-100 text-green-700';
        }
        return 'bg-gray-100 text-gray-600';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await axios.get(`/tamizajes/exportar/${dni}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Resultados_Evaluacion_${dni}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error al descargar:', error);
        } finally {
            setDownloading(false);
        }
    };

    // Componente para ASQ
    const renderASQ = (evaluacion, index) => {
        const isExpanded = expandedSections.asq.includes(index);
        const preguntas = [
            { num: 1, texto: 'En las últimas semanas, ¿ha deseado estar muerto?', campo: 'pregunta1' },
            { num: 2, texto: 'En las últimas semanas, ¿ha sentido que usted o su familia estarían mejor si estuviera muerto?', campo: 'pregunta2' },
            { num: 3, texto: 'En la última semana, ¿ha estado pensando en suicidarse?', campo: 'pregunta3' },
            { num: 4, texto: '¿Alguna vez ha intentado suicidarse?', campo: 'pregunta4' },
            { num: 5, texto: '¿Está pensando en suicidarse en este momento?', campo: 'pregunta5' }
        ];

        // Obtener puntuación e interpretación (calculadas en el backend)
        const puntuacion = evaluacion.puntaje ?? 0;
        const interpretacion = evaluacion.interpretacion || '';
        const resultado = evaluacion.resultado || 'Sin resultado';

        // Determinar color del badge según el riesgo
        const getRiesgoColor = (riesgo) => {
            if (!riesgo) return 'bg-gray-200 text-gray-700';
            const riesgoLower = riesgo.toLowerCase();
            if (riesgoLower.includes('agudo') || riesgoLower.includes('inminente')) {
                return 'bg-red-600 text-white';
            } else if (riesgoLower.includes('no agudo') || riesgoLower.includes('moderado')) {
                return 'bg-yellow-400 text-gray-900';
            } else if (riesgoLower.includes('sin riesgo') || riesgoLower.includes('bajo')) {
                return 'bg-green-500 text-white';
            } else if (riesgoLower.includes('leve')) {
                return 'bg-green-500 text-white';
            }
            return 'bg-gray-200 text-gray-700';
        };

        return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                {/* Header */}
                <div
                    className="bg-[#752568] text-white p-4 cursor-pointer hover:bg-[#5a1d4f] transition-colors"
                    onClick={() => toggleSection('asq', index)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="font-semibold text-lg text-white">Adult Self-Report Questionnaire (ASQ)</h3>
                                {data?.serumista?.nombre_completo && (
                                    <>
                                        <span className="text-sm text-white/90">-</span>
                                        <span className="font-medium text-white">{data.serumista.nombre_completo}</span>
                                        {data?.serumista?.cmp && (
                                            <span className="text-sm text-white/90">- CMP: {data.serumista.cmp}</span>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiesgoColor(resultado)}`}>
                                    {resultado}
                                </span>
                                <span className="text-sm text-white font-medium">Puntuación: {puntuacion}</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-white" />
                                    <span className="text-sm text-white">{formatDate(evaluacion.fecha_registro)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-4">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-6">
                        {/* Preguntas y Respuestas */}
                        <div className="space-y-6 mb-8">
                            {preguntas.map((pregunta) => {
                                const respuesta = evaluacion[pregunta.campo] || '-';

                                return (
                                    <div key={pregunta.num} className="mb-2">
                                        <div className="flex gap-4 items-start mb-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#752568] rounded-full flex items-center justify-center mt-1">
                                                <span className="text-sm font-semibold text-white">{pregunta.num}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-base">
                                                    {pregunta.texto}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-12">
                                            <div className="bg-[#FFFBF7] rounded-lg p-4 border-l-4 border-[#752568]">
                                                <p className="text-gray-700">{respuesta}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resultado de la Evaluación */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-[#D97706] rounded-full"></div>
                                <h4 className="font-bold text-gray-900 text-lg">Resultado de la Evaluación</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Puntuación Total</p>
                                        <p className="text-3xl font-bold text-gray-900">{puntuacion}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Nivel de Riesgo</p>
                                        <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold ${resultado === 'Moderado' ? 'bg-[#FEF3C7] text-[#D97706]' : getRiesgoColor(resultado)
                                            }`}>
                                            {resultado}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Interpretación</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                                        {interpretacion || 'Evaluación completada. Se recomienda seguimiento según protocolo.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Componente para PHQ-9
    const renderPHQ9 = (evaluacion, index) => {
        const isExpanded = expandedSections.phq9.includes(index);
        const preguntas = [
            'Poco interés o placer en hacer las cosas',
            'Sentirse desanimado/a, deprimido/a o sin esperanza',
            'Problemas para dormir o dormir demasiado',
            'Sentirse cansado/a o con poca energía',
            'Poco apetito o comer en exceso',
            'Sentirse mal consigo mismo/a',
            'Problemas para concentrarse',
            'Moverse o hablar tan lento que otras personas lo notarían',
            'Pensamientos de que estaría mejor muerto/a'
        ];

        const respuestas = evaluacion.respuestas ? JSON.parse(evaluacion.respuestas) : {};
        const opcionesRespuestas = {
            '0': 'Ningún día',
            '1': 'Varios días',
            '2': 'Más de la mitad de los días',
            '3': 'Casi todos los días'
        };

        const riesgo = evaluacion.riesgo || 'Sin resultado';
        const puntuacion = evaluacion.puntaje || 0;

        // Determinar color del badge según el riesgo
        const getRiesgoColor = (riesgo) => {
            if (!riesgo) return 'bg-gray-200 text-gray-700';
            const riesgoLower = riesgo.toLowerCase();
            if (riesgoLower.includes('alto') || riesgoLower.includes('problemático')) {
                return 'bg-red-600 text-white';
            } else if (riesgoLower.includes('moderado') || riesgoLower.includes('riesgoso')) {
                return 'bg-yellow-400 text-gray-900';
            } else if (riesgoLower.includes('leve') || riesgoLower.includes('bajo')) {
                return 'bg-green-500 text-white';
            } else if (riesgoLower.includes('sin riesgo')) {
                return 'bg-green-500 text-white';
            }
            return 'bg-gray-200 text-gray-700';
        };

        return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                {/* Header */}
                <div
                    className="bg-[#752568] text-white p-4 cursor-pointer hover:bg-[#5a1d4f] transition-colors"
                    onClick={() => toggleSection('phq9', index)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="font-semibold text-lg text-white">Patient Health Questionnaire (PHQ-9)</h3>
                                {data?.serumista?.nombre_completo && (
                                    <>
                                        <span className="text-sm text-white/90">-</span>
                                        <span className="font-medium text-white">{data.serumista.nombre_completo}</span>
                                        {data?.serumista?.cmp && (
                                            <span className="text-sm text-white/90">- CMP: {data.serumista.cmp}</span>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiesgoColor(riesgo)}`}>
                                    {riesgo}
                                </span>
                                <span className="text-sm text-white font-medium">Puntuación: {puntuacion}</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-white" />
                                    <span className="text-sm text-white">{formatDate(evaluacion.fecha)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-4">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-6">
                        {/* Preguntas y Respuestas */}
                        <div className="space-y-6 mb-8">
                            {preguntas.map((pregunta, idx) => {
                                const respuesta = opcionesRespuestas[respuestas[String(idx + 1)]] || '-';
                                return (
                                    <div key={idx} className="mb-2">
                                        <div className="flex gap-4 items-start mb-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#752568] rounded-full flex items-center justify-center mt-1">
                                                <span className="text-sm font-semibold text-white">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-base">
                                                    {pregunta}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-12">
                                            <div className="bg-[#FFFBF7] rounded-lg p-4 border-l-4 border-[#752568]">
                                                <p className="text-gray-700">{respuesta}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resultado de la Evaluación */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-[#D97706] rounded-full"></div>
                                <h4 className="font-bold text-gray-900 text-lg">Resultado de la Evaluación</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Puntuación Total</p>
                                        <p className="text-3xl font-bold text-gray-900">{puntuacion}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Nivel de Riesgo</p>
                                        <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold ${riesgo?.toLowerCase().includes('moderado') ? 'bg-[#FEF3C7] text-[#D97706]' : getRiesgoColor(riesgo)
                                            }`}>
                                            {riesgo}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Interpretación</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                                        {riesgo?.toLowerCase().includes('moderado')
                                            ? 'Depresión moderada. Se sugiere intervención profesional'
                                            : riesgo?.toLowerCase().includes('leve')
                                                ? 'Depresión leve. Se recomienda seguimiento regular'
                                                : 'Sin síntomas significativos'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Componente para GAD-7
    const renderGAD = (evaluacion, index) => {
        const isExpanded = expandedSections.gad.includes(index);
        const preguntas = [
            'Sentirse nervioso/a, ansioso/a o muy tenso/a',
            'No poder parar o controlar las preocupaciones',
            'Preocuparse demasiado por diferentes cosas',
            'Dificultad para relajarse',
            'Estar tan inquieto/a que no puede quedarse quieto/a',
            'Molestarse o irritarse fácilmente',
            'Sentir miedo de que algo terrible pueda pasar'
        ];

        const respuestas = evaluacion.respuestas ? JSON.parse(evaluacion.respuestas) : {};
        const opcionesRespuestas = {
            '0': 'Nunca',
            '1': 'Varios días',
            '2': 'Más de la mitad de los días',
            '3': 'Casi todos los días'
        };

        const riesgo = evaluacion.riesgo || 'Sin resultado';
        const puntuacion = evaluacion.puntaje || 0;

        // Determinar color del badge según el riesgo
        const getRiesgoColor = (riesgo) => {
            if (!riesgo) return 'bg-gray-200 text-gray-700';
            const riesgoLower = riesgo.toLowerCase();
            if (riesgoLower.includes('alto') || riesgoLower.includes('problemático')) {
                return 'bg-red-600 text-white';
            } else if (riesgoLower.includes('moderado') || riesgoLower.includes('riesgoso')) {
                return 'bg-yellow-400 text-gray-900';
            } else if (riesgoLower.includes('leve') || riesgoLower.includes('bajo')) {
                return 'bg-green-500 text-white';
            } else if (riesgoLower.includes('sin riesgo')) {
                return 'bg-green-500 text-white';
            }
            return 'bg-gray-200 text-gray-700';
        };

        return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                {/* Header */}
                <div
                    className="bg-[#752568] text-white p-4 cursor-pointer hover:bg-[#5a1d4f] transition-colors"
                    onClick={() => toggleSection('gad', index)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="font-semibold text-lg text-white">Cuestionario de Ansiedad Generalizada (GAD-7)</h3>
                                {data?.serumista?.nombre_completo && (
                                    <>
                                        <span className="text-sm text-white/90">-</span>
                                        <span className="font-medium text-white">{data.serumista.nombre_completo}</span>
                                        {data?.serumista?.cmp && (
                                            <span className="text-sm text-white/90">- CMP: {data.serumista.cmp}</span>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiesgoColor(riesgo)}`}>
                                    {riesgo}
                                </span>
                                <span className="text-sm text-white font-medium">Puntuación: {puntuacion}</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-white" />
                                    <span className="text-sm text-white">{formatDate(evaluacion.fecha)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-4">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-6">
                        {/* Preguntas y Respuestas */}
                        <div className="space-y-6 mb-8">
                            {preguntas.map((pregunta, idx) => {
                                const respuesta = opcionesRespuestas[respuestas[String(idx + 1)]] || '-';
                                return (
                                    <div key={idx} className="mb-2">
                                        <div className="flex gap-4 items-start mb-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#752568] rounded-full flex items-center justify-center mt-1">
                                                <span className="text-sm font-semibold text-white">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-base">
                                                    {pregunta}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-12">
                                            <div className="bg-[#FFFBF7] rounded-lg p-4 border-l-4 border-[#752568]">
                                                <p className="text-gray-700">{respuesta}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resultado de la Evaluación */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-[#D97706] rounded-full"></div>
                                <h4 className="font-bold text-gray-900 text-lg">Resultado de la Evaluación</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Puntuación Total</p>
                                        <p className="text-3xl font-bold text-gray-900">{puntuacion}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Nivel de Riesgo</p>
                                        <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold ${riesgo?.toLowerCase().includes('moderado') ? 'bg-[#FEF3C7] text-[#D97706]' : getRiesgoColor(riesgo)
                                            }`}>
                                            {riesgo}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Interpretación</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                                        {riesgo?.toLowerCase().includes('moderado')
                                            ? 'Ansiedad moderada. Se recomienda evaluación adicional'
                                            : riesgo?.toLowerCase().includes('leve')
                                                ? 'Ansiedad leve. Se recomienda seguimiento regular'
                                                : 'Sin síntomas significativos'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Componente para MBI
    const renderMBI = (evaluacion, index) => {
        const isExpanded = expandedSections.mbi.includes(index);
        const preguntas = [
            'Me siento emocionalmente agotado por mi trabajo',
            'Me siento cansado al final de la jornada de trabajo',
            'Me siento fatigado cuando me levanto por la mañana',
            'Trabajar todo el día es una tensión para mí',
            'Puedo resolver de manera eficaz los problemas en mi trabajo',
            'Me siento "quemado" por mi trabajo',
            'Creo que estoy influyendo positivamente en la vida de otros',
            'Me he vuelto más insensible con la gente',
            'Siento que el trabajo me está endureciendo emocionalmente',
            'Me siento con mucha energía en mi trabajo'
        ];

        const respuestas = evaluacion.respuestas ? JSON.parse(evaluacion.respuestas) : {};
        const opcionesRespuestas = {
            '0': 'Nunca',
            '1': 'Pocas veces al año',
            '2': 'Algunas veces al mes',
            '3': 'Una vez a la semana',
            '4': 'Varias veces a la semana',
            '5': 'Todos los días'
        };

        const riesgo = evaluacion.riesgoCE || evaluacion.riesgoDP || evaluacion.riesgoRP || 'Sin evaluar';
        const puntuacion = evaluacion.puntajeCE || 0;

        // Determinar color del badge según el riesgo
        const getRiesgoColor = (riesgo) => {
            if (!riesgo) return 'bg-gray-200 text-gray-700';
            const riesgoLower = riesgo.toLowerCase();
            if (riesgoLower.includes('alto') || riesgoLower.includes('problemático')) {
                return 'bg-red-600 text-white';
            } else if (riesgoLower.includes('moderado') || riesgoLower.includes('riesgoso')) {
                return 'bg-yellow-400 text-gray-900';
            } else if (riesgoLower.includes('leve') || riesgoLower.includes('bajo') || riesgoLower.includes('ausencia')) {
                return 'bg-green-500 text-white';
            } else if (riesgoLower.includes('sin riesgo')) {
                return 'bg-green-500 text-white';
            }
            return 'bg-gray-200 text-gray-700';
        };

        return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                {/* Header */}
                <div
                    className="bg-[#752568] text-white p-4 cursor-pointer hover:bg-[#5a1d4f] transition-colors"
                    onClick={() => toggleSection('mbi', index)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="font-semibold text-lg text-white">Cuestionario de Burnout (MBI-GS)</h3>
                                {data?.serumista?.nombre_completo && (
                                    <>
                                        <span className="text-sm text-white/90">-</span>
                                        <span className="font-medium text-white">{data.serumista.nombre_completo}</span>
                                        {data?.serumista?.cmp && (
                                            <span className="text-sm text-white/90">- CMP: {data.serumista.cmp}</span>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiesgoColor(riesgo)}`}>
                                    {riesgo}
                                </span>
                                <span className="text-sm text-white font-medium">Puntuación: {puntuacion}</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-white" />
                                    <span className="text-sm text-white">{formatDate(evaluacion.fecha)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-4">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-6">
                        {/* Preguntas y Respuestas */}
                        <div className="space-y-6 mb-8">
                            {preguntas.map((pregunta, idx) => {
                                const respuesta = opcionesRespuestas[respuestas[String(idx + 1)]] || '-';
                                return (
                                    <div key={idx} className="mb-2">
                                        <div className="flex gap-4 items-start mb-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#752568] rounded-full flex items-center justify-center mt-1">
                                                <span className="text-sm font-semibold text-white">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-base">
                                                    {pregunta}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-12">
                                            <div className="bg-[#FFFBF7] rounded-lg p-4 border-l-4 border-[#752568]">
                                                <p className="text-gray-700">{respuesta}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resultado de la Evaluación */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-[#D97706] rounded-full"></div>
                                <h4 className="font-bold text-gray-900 text-lg">Resultado de la Evaluación</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Puntuación Total</p>
                                        <p className="text-3xl font-bold text-gray-900">{puntuacion}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Nivel de Riesgo</p>
                                        <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold ${riesgo?.toLowerCase().includes('moderado') ? 'bg-[#FEF3C7] text-[#D97706]' : getRiesgoColor(riesgo)
                                            }`}>
                                            {riesgo}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Interpretación</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                                        {riesgo?.toLowerCase().includes('alto')
                                            ? 'Nivel alto de burnout. Requiere intervención y apoyo profesional'
                                            : riesgo?.toLowerCase().includes('moderado')
                                                ? 'Nivel moderado de burnout. Se sugiere balance vida-trabajo'
                                                : 'Sin síntomas significativos de burnout'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Componente para AUDIT
    const renderAUDIT = (evaluacion, index) => {
        const isExpanded = expandedSections.audit.includes(index);
        const preguntas = [
            '¿Con qué frecuencia consume alguna bebida alcohólica?',
            '¿Cuántas copas/tragos bebe en un día normal cuando bebe?',
            '¿Con qué frecuencia toma 6 o más bebidas alcohólicas en una sola ocasión?',
            'Durante el último año, ¿con qué frecuencia no pudo parar de beber?',
            '¿Con qué frecuencia no pudo hacer lo que se esperaba de usted porque había bebido?',
            '¿Con qué frecuencia ha necesitado beber por la mañana para recuperarse?',
            '¿Con qué frecuencia ha tenido remordimientos o sentimientos de culpa después de haber bebido?',
            '¿Con qué frecuencia no ha podido recordar lo que sucedió la noche anterior?',
            '¿Usted o alguna otra persona ha resultado herido porque usted había bebido?',
            '¿Algún familiar, médico o profesional ha mostrado preocupación por su consumo?'
        ];

        const respuestas = evaluacion.respuestas ? JSON.parse(evaluacion.respuestas) : {};
        const riesgo = evaluacion.riesgo || 'Sin resultado';
        const puntuacion = evaluacion.puntaje || 0;

        // Determinar color del badge según el riesgo
        const getRiesgoColor = (riesgo) => {
            if (!riesgo) return 'bg-gray-200 text-gray-700';
            const riesgoLower = riesgo.toLowerCase();
            if (riesgoLower.includes('alto') || riesgoLower.includes('problemático')) {
                return 'bg-red-600 text-white';
            } else if (riesgoLower.includes('moderado') || riesgoLower.includes('riesgoso')) {
                return 'bg-yellow-400 text-gray-900';
            } else if (riesgoLower.includes('leve') || riesgoLower.includes('bajo')) {
                return 'bg-green-500 text-white';
            } else if (riesgoLower.includes('sin riesgo')) {
                return 'bg-green-500 text-white';
            }
            return 'bg-gray-200 text-gray-700';
        };

        return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                {/* Header */}
                <div
                    className="bg-[#752568] text-white p-4 cursor-pointer hover:bg-[#5a1d4f] transition-colors"
                    onClick={() => toggleSection('audit', index)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="font-semibold text-lg text-white">Cuestionario de Consumo de Alcohol (AUDIT)</h3>
                                {data?.serumista?.nombre_completo && (
                                    <>
                                        <span className="text-sm text-white/90">-</span>
                                        <span className="font-medium text-white">{data.serumista.nombre_completo}</span>
                                        {data?.serumista?.cmp && (
                                            <span className="text-sm text-white/90">- CMP: {data.serumista.cmp}</span>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiesgoColor(riesgo)}`}>
                                    {riesgo}
                                </span>
                                <span className="text-sm text-white font-medium">Puntuación: {puntuacion}</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-white" />
                                    <span className="text-sm text-white">{formatDate(evaluacion.fecha)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-4">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-6">
                        {/* Preguntas y Respuestas */}
                        <div className="space-y-6 mb-8">
                            {preguntas.map((pregunta, idx) => {
                                const respuesta = respuestas[String(idx + 1)] || '-';
                                return (
                                    <div key={idx} className="mb-2">
                                        <div className="flex gap-4 items-start mb-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#752568] rounded-full flex items-center justify-center mt-1">
                                                <span className="text-sm font-semibold text-white">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-base">
                                                    {pregunta}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-12">
                                            <div className="bg-[#FFFBF7] rounded-lg p-4 border-l-4 border-[#752568]">
                                                <p className="text-gray-700">{respuesta}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resultado de la Evaluación */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-[#D97706] rounded-full"></div>
                                <h4 className="font-bold text-gray-900 text-lg">Resultado de la Evaluación</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Puntuación Total</p>
                                        <p className="text-3xl font-bold text-gray-900">{puntuacion}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Nivel de Riesgo</p>
                                        <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold ${riesgo?.toLowerCase().includes('moderado') ? 'bg-[#FEF3C7] text-[#D97706]' : getRiesgoColor(riesgo)
                                            }`}>
                                            {riesgo}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Interpretación</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                                        {riesgo?.toLowerCase().includes('riesgoso') || riesgo?.toLowerCase().includes('problemático')
                                            ? 'Consumo de riesgo. Se recomienda evaluación y apoyo profesional'
                                            : riesgo?.toLowerCase().includes('bajo')
                                                ? 'Consumo de bajo riesgo. Mantener hábitos actuales'
                                                : 'Sin consumo significativo'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Cargando detalles...</div>
                </div>
            </MainLayout>
        );
    }

    if (!data) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-gray-500 text-lg">No se encontraron datos para este serumista</div>
                    <button
                        onClick={() => navigate('/tamizaje')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a la lista
                    </button>
                </div>
            </MainLayout>
        );
    }

    // Verificar si hay evaluaciones
    const hasEvaluaciones =
        (data.evaluaciones?.asq && data.evaluaciones.asq.length > 0) ||
        (data.evaluaciones?.phq9 && data.evaluaciones.phq9.length > 0) ||
        (data.evaluaciones?.gad && data.evaluaciones.gad.length > 0) ||
        (data.evaluaciones?.mbi && data.evaluaciones.mbi.length > 0) ||
        (data.evaluaciones?.audit && data.evaluaciones.audit.length > 0);

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Evaluaciones Psicológicas</h1>
                        <p className="mt-2 text-gray-600">Colegio Médico del Perú - Serumistas</p>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {downloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {downloading ? 'Descargando...' : 'Descargar Resultados'}
                    </button>
                </div>

                {/* Información del Serumista */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Información del Serumista</h2>
                            <p className="text-sm text-gray-600 mt-1">{data.serumista?.nombre_completo || 'Sin nombre'}</p>
                        </div>
                        <button
                            onClick={() => navigate('/tamizaje')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver
                        </button>
                    </div>

                    {/* Datos básicos del serumista */}
                    <div className="grid grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">DNI</p>
                            <p className="text-base font-semibold text-gray-900">{data.serumista?.dni || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">CMP</p>
                            <p className="text-base font-semibold text-gray-900">{data.serumista?.cmp || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Email</p>
                            <p className="text-base font-semibold text-gray-900">{data.serumista?.email || '-'}</p>
                        </div>
                    </div>

                    {!hasEvaluaciones && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <div className="text-yellow-600 mb-2">
                                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Evaluaciones Registradas</h3>
                            <p className="text-gray-600 mb-4">
                                Este serumista aún no tiene evaluaciones psicológicas registradas en el sistema.
                            </p>
                            <p className="text-sm text-gray-500">
                                Una vez que complete las evaluaciones, los resultados aparecerán aquí.
                            </p>
                        </div>
                    )}
                </div>

                {/* Detalles de las evaluaciones (solo si existen) */}
                {hasEvaluaciones && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Detalles de las Evaluaciones</h2>
                            <p className="text-sm text-gray-600 mt-1">Revisa las respuestas y resultados de cada evaluación</p>
                        </div>

                        {/* Evaluaciones - Mostrar solo el tipo seleccionado si hay tipo en la URL */}
                        <div className="space-y-6">
                            {/* Si hay tipo específico, mostrar solo ese tipo */}
                            {tipo === 'asq' && data.evaluaciones.asq && data.evaluaciones.asq.length > 0 && (
                                <div ref={asqRef}>
                                    {data.evaluaciones.asq.map((evaluacion, index) => renderASQ(evaluacion, index))}
                                </div>
                            )}

                            {tipo === 'phq9' && data.evaluaciones.phq9 && data.evaluaciones.phq9.length > 0 && (
                                <div ref={phq9Ref}>
                                    {data.evaluaciones.phq9.map((evaluacion, index) => renderPHQ9(evaluacion, index))}
                                </div>
                            )}

                            {tipo === 'gad' && data.evaluaciones.gad && data.evaluaciones.gad.length > 0 && (
                                <div ref={gadRef}>
                                    {data.evaluaciones.gad.map((evaluacion, index) => renderGAD(evaluacion, index))}
                                </div>
                            )}

                            {tipo === 'mbi' && data.evaluaciones.mbi && data.evaluaciones.mbi.length > 0 && (
                                <div ref={mbiRef}>
                                    {data.evaluaciones.mbi.map((evaluacion, index) => renderMBI(evaluacion, index))}
                                </div>
                            )}

                            {tipo === 'audit' && data.evaluaciones.audit && data.evaluaciones.audit.length > 0 && (
                                <div ref={auditRef}>
                                    {data.evaluaciones.audit.map((evaluacion, index) => renderAUDIT(evaluacion, index))}
                                </div>
                            )}

                            {/* Si no hay tipo específico, mostrar todas las evaluaciones */}
                            {!tipo && (
                                <>
                                    {/* ASQ */}
                                    {data.evaluaciones.asq && data.evaluaciones.asq.length > 0 && (
                                        <div ref={asqRef}>
                                            {data.evaluaciones.asq.map((evaluacion, index) => renderASQ(evaluacion, index))}
                                        </div>
                                    )}

                                    {/* PHQ-9 */}
                                    {data.evaluaciones.phq9 && data.evaluaciones.phq9.length > 0 && (
                                        <div ref={phq9Ref}>
                                            {data.evaluaciones.phq9.map((evaluacion, index) => renderPHQ9(evaluacion, index))}
                                        </div>
                                    )}

                                    {/* GAD-7 */}
                                    {data.evaluaciones.gad && data.evaluaciones.gad.length > 0 && (
                                        <div ref={gadRef}>
                                            {data.evaluaciones.gad.map((evaluacion, index) => renderGAD(evaluacion, index))}
                                        </div>
                                    )}

                                    {/* MBI */}
                                    {data.evaluaciones.mbi && data.evaluaciones.mbi.length > 0 && (
                                        <div ref={mbiRef}>
                                            {data.evaluaciones.mbi.map((evaluacion, index) => renderMBI(evaluacion, index))}
                                        </div>
                                    )}

                                    {/* AUDIT */}
                                    {data.evaluaciones.audit && data.evaluaciones.audit.length > 0 && (
                                        <div ref={auditRef}>
                                            {data.evaluaciones.audit.map((evaluacion, index) => renderAUDIT(evaluacion, index))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default TamizajeDetallePage;
