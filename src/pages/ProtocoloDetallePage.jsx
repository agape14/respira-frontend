import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import MainLayout from '../components/layouts/MainLayout';
import Swal from 'sweetalert2';
import {
    ArrowLeft, ChevronDown, ChevronUp, User, Calendar, FileText, Activity,
    Brain, Clipboard, MessageSquare, Save, UserX, CircleCheck, Download, Loader2
} from 'lucide-react';

// Helper para campos con contador de caracteres
const Field = ({ label, name, value, fullWidth = false, readOnly = false, isEditable, formData, onChange, maxLength, hasError }) => {
    const editable = isEditable && !readOnly;
    const currentValue = formData[name] || '';
    const currentLength = currentValue.length;
    const limit = maxLength || 500; // Default 500 si no se especifica
    const isOverLimit = currentLength > limit;
    const isNearLimit = currentLength > limit * 0.9; // 90% del límite

    return (
        <div className={`mb-4 ${fullWidth ? 'col-span-2' : ''}`}>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
            {editable ? (
                <div className="relative">
                    <textarea
                        name={name}
                        value={currentValue}
                        onChange={onChange}
                        className={`w-full p-3 bg-white border rounded-lg text-sm text-gray-900 focus:ring-[#752568] focus:border-[#752568] min-h-[46px] ${
                            isOverLimit || hasError
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                : isNearLimit 
                                    ? 'border-yellow-500' 
                                    : 'border-gray-300'
                        }`}
                        rows={2}
                        placeholder="Escriba su respuesta aquí..."
                    />
                    <div className={`absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded ${
                        isOverLimit 
                            ? 'bg-red-100 text-red-700 font-semibold' 
                            : isNearLimit 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-gray-100 text-gray-500'
                    }`}>
                        {currentLength}/{limit}
                    </div>
                    {isOverLimit && (
                        <p className="text-xs text-red-600 mt-1">
                            Excede el límite por {currentLength - limit} caracteres
                        </p>
                    )}
                </div>
            ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 min-h-[46px] whitespace-pre-wrap">
                    {value || formData[name] || '-'}
                </div>
            )}
        </div>
    );
};

// Accordion Item Component
const AccordionItem = ({ id, title, icon: Icon, children, isOpen, onToggle }) => {
    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(id);
    };

    return (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#752568] text-white flex items-center justify-center text-xs font-bold">
                        {id.replace('section', '')}
                    </div>
                    <span className="font-semibold text-[#752568]">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {isOpen && (
                <div className="p-6 border-t border-gray-100 bg-white animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};

const ProtocoloDetallePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('sesion1');
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [fieldLimits, setFieldLimits] = useState({});
    const [fieldErrors, setFieldErrors] = useState([]);

    // Accordion state
    const [expandedSections, setExpandedSections] = useState({
        section1: true,
        section2: false,
        section3: false,
        section4: false,
        section5: false,
        section6: false,
        section7: false
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar datos del protocolo y límites de campos en paralelo
                const [protocoloRes, limitsRes] = await Promise.all([
                    axios.get(`/protocolos/${id}`),
                    axios.get('/protocolos/field-limits')
                ]);

                if (protocoloRes.data.success) {
                    setData(protocoloRes.data.data);

                    // Inicializar formData con datos de la sesión
                    if (protocoloRes.data.data.sesion) {
                        setFormData(protocoloRes.data.data.sesion);
                    }

                    // Establecer tab activo según sesión actual solo al cargar por primera vez
                    const globalNro = protocoloRes.data.data.numero_cita_global || 1;
                    const sesionEnIntervencion = protocoloRes.data.data.cita?.numero_sesion || ((globalNro - 1) % 4) + 1;
                    setActiveTab(`sesion${sesionEnIntervencion}`);
                }

                if (limitsRes.data.success) {
                    setFieldLimits(limitsRes.data.data);
                }
            } catch (error) {
                console.error('Error al cargar detalles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error del campo cuando el usuario lo modifica
        if (fieldErrors.includes(name)) {
            setFieldErrors(prev => prev.filter(f => f !== name));
        }
    };

    // Validar campos antes de enviar
    const validateBeforeSave = () => {
        const errors = [];
        const errorMessages = [];

        for (const [field, maxLength] of Object.entries(fieldLimits)) {
            const value = formData[field];
            if (value && typeof value === 'string' && value.length > maxLength) {
                errors.push(field);
                errorMessages.push(`• ${field}: ${value.length}/${maxLength} caracteres`);
            }
        }

        if (errors.length > 0) {
            setFieldErrors(errors);
            return { valid: false, errors: errorMessages };
        }

        return { valid: true };
    };

    const handleRegistrar = async () => {
        // Validar campos localmente primero
        const validation = validateBeforeSave();
        if (!validation.valid) {
            Swal.fire({
                title: 'Campos exceden el límite',
                html: `<div class="text-left text-sm">Los siguientes campos exceden el límite de caracteres:<br><br>${validation.errors.join('<br>')}</div>`,
                icon: 'warning',
                confirmButtonColor: '#752568'
            });
            return;
        }

        // Mostrar confirmación antes de guardar
        const result = await Swal.fire({
            title: '¿Confirmar registro?',
            text: "¿Está seguro que desea guardar los datos de esta sesión?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#752568',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return; // Usuario canceló
        }

        setSaving(true);
        setFieldErrors([]);
        try {
            const payload = {
                cita_id: data.cita.id,
                ...formData
            };
            const response = await axios.post('/protocolos/save', payload);
            if (response.data.success) {
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Sesión registrada correctamente',
                    icon: 'success',
                    confirmButtonColor: '#752568'
                }).then(() => {
                    navigate('/protocolo');
                });
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            
            // Manejar errores de validación del backend
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const backendErrors = error.response.data.errors;
                const errorFields = error.response.data.field_errors || Object.keys(backendErrors);
                setFieldErrors(errorFields);
                
                const errorMessages = Object.values(backendErrors).join('<br>');
                Swal.fire({
                    title: 'Error de validación',
                    html: `<div class="text-left text-sm">${errorMessages}</div>`,
                    icon: 'error',
                    confirmButtonColor: '#752568'
                });
            } else {
                Swal.fire('Error', 'No se pudo registrar la sesión', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleFinalizarIntervencion = async () => {
        const result = await Swal.fire({
            title: '¿Finalizar Intervención?',
            text: "Esto cerrará la intervención actual. ¿Está seguro?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#752568',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, finalizar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.post('/protocolos/finalizar_intervencion', { cita_id: data.cita.id });
                if (response.data.success) {
                    Swal.fire('Finalizado', 'La intervención ha sido finalizada.', 'success').then(() => {
                        navigate('/protocolo');
                    });
                }
            } catch (error) {
                console.error('Error al finalizar:', error);
                Swal.fire('Error', 'No se pudo finalizar la intervención', 'error');
            }
        }
    };

    // Derivación State
    const [derivarModalOpen, setDerivarModalOpen] = useState(false);
    const [especialistas, setEspecialistas] = useState([]);
    const [derivacionData, setDerivacionData] = useState({
        especialista_id: '',
        observacion: '',
        accion: 'I', // Insert default
        derivacion_id: null
    });
    const [loadingDerivacion, setLoadingDerivacion] = useState(false);

    const [esRemunerado, setEsRemunerado] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        if (derivarModalOpen) {
            loadDerivacionData();
        }
    }, [derivarModalOpen]);

    const loadDerivacionData = async () => {
        setLoadingDerivacion(true);
        try {
            // Cargar especialistas
            const espRes = await axios.get('/protocolos/especialistas-derivacion', {
                params: { cita_id: data.cita.id }
            });
            if (espRes.data.success) {
                setEspecialistas(espRes.data.data);
                setEsRemunerado(espRes.data.es_remunerado);
            }
            // Cargar derivación existente
            const derRes = await axios.get(`/protocolos/derivacion/${data.cita.id}`);
            if (derRes.data.success && derRes.data.data) {
                setDerivacionData({
                    especialista_id: derRes.data.data.cenate_id,
                    observacion: derRes.data.data.observa,
                    accion: 'U',
                    derivacion_id: derRes.data.data.id
                });
            } else {
                // Si no hay derivación previa, pre-seleccionar el médico de la cita actual
                setDerivacionData(prev => ({
                    ...prev,
                    especialista_id: data.cita.medico_id || ''
                }));
            }
        } catch (error) {
            console.error('Error al cargar datos de derivación:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos de derivación', 'error');
        } finally {
            setLoadingDerivacion(false);
        }
    };

    const handleDerivar = () => {
        setDerivarModalOpen(true);
    };

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        try {
            const response = await axios.get(`/protocolos/pdf/${data.cita.paciente_id}`, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
            link.download = `protocolo_intervencion_${paciente.nombre_completo?.replace(/\s+/g, '_') || data.cita.paciente_id}_${timestamp}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            Swal.fire('Error', 'No se pudo descargar el PDF', 'error');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleSubmitDerivacion = async () => {
        if (!derivacionData.especialista_id) {
            Swal.fire('Error', 'Debe seleccionar un especialista', 'warning');
            return;
        }

        setLoadingDerivacion(true);
        try {
            const payload = {
                cita_id: data.cita.id,
                paciente_id: data.cita.paciente_id,
                especialista_id: derivacionData.especialista_id,
                observacion: derivacionData.observacion,
                accion: derivacionData.accion,
                derivacion_id: derivacionData.derivacion_id
            };

            const response = await axios.post('/protocolos/derivar', payload);

            if (response.data.success) {
                Swal.fire({
                    title: '¡Éxito!',
                    text: response.data.message,
                    icon: 'success',
                    confirmButtonColor: '#752568'
                });
                setDerivarModalOpen(false);
            }
        } catch (error) {
            console.error('Error al derivar:', error);
            Swal.fire('Error', 'Ocurrió un error al procesar la derivación', 'error');
        } finally {
            setLoadingDerivacion(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#752568]"></div>
                </div>
            </MainLayout>
        );
    }

    if (!data) {
        return (
            <MainLayout>
                <div className="p-6 text-center text-gray-500">
                    No se encontró la información del protocolo.
                </div>
            </MainLayout>
        );
    }

    const { cita, sesion } = data;
    const paciente = cita.paciente || {};
    const isEditable = parseInt(cita.estado) === 1;

    // Obtener números reales del backend
    const globalNro = data.numero_cita_global || 1;
    const intervencionNro = cita.numero_intervencion ?? Math.ceil(globalNro / 4);
    const sesionEnIntervencion = cita.numero_sesion ?? ((globalNro - 1) % 4) + 1;
    const sesionNro = sesionEnIntervencion; // Alias para compatibilidad visual

    return (
        <MainLayout>
            <div className="space-y-6 font-sans">
                {/* Botón Volver */}
                <div>
                    <button
                        onClick={() => navigate('/protocolo')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#752568] font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                </div>

                {/* Header Banner */}
                <div className="bg-[#5a1d4f] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-xl font-bold">Protocolo de Atención Psicológica</h1>
                                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium backdrop-blur-sm">
                                    {isEditable ? 'En Atención' : 'Solo lectura'}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
                                <span className="flex items-center gap-1">
                                    <span className="opacity-70">Paciente:</span>
                                    <span className="font-semibold">{paciente.nombre_completo}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="opacity-70">Intervención N° (v2)</span>
                                    <span className="font-semibold">{intervencionNro}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="opacity-70">Sesión N°</span>
                                    <span className="font-semibold">{sesionNro}</span>
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#F8AD1D] text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
                            <span>Sesión {sesionEnIntervencion}/4</span>
                        </div>
                    </div>
                </div>

                {/* Log de Derivación (si está derivada) */}
                {data.esta_derivada && (
                    <div data-slot="card" className="text-card-foreground flex flex-col gap-4 rounded-xl border p-4 bg-gradient-to-r from-red-500/5 to-orange-500/5 border-red-500/30">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                                <UserX className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-red-600 mb-1 font-semibold">Paciente Derivado</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>
                                        <span className="font-medium">Fecha:</span>{' '}
                                        {data.derivacion?.fecha ? new Date(data.derivacion.fecha).toLocaleDateString('es-PE', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'No disponible'}
                                    </p>
                                    <p>
                                        <span className="font-medium">Derivado a {data.tipo_derivacion ? `(${data.tipo_derivacion})` : ''}:</span>{' '}
                                        {data.derivacion?.especialista?.nombre_completo || 'No disponible'}
                                    </p>
                                    {data.derivacion?.observa && (
                                        <p>
                                            <span className="font-medium">Observación:</span>{' '}
                                            {data.derivacion.observa}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Card Finalizar Intervención o Log de Finalización */}
                {data.esta_finalizada ? (
                    // Mostrar log de finalización si ya está finalizada
                    <div data-slot="card" className="text-card-foreground flex flex-col gap-4 rounded-xl border p-4 bg-gradient-to-r from-[#752568]/5 to-[#5a1d4f]/5 border-[#752568]/30">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#752568] flex items-center justify-center flex-shrink-0">
                                <CircleCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[#752568] mb-1 font-semibold">Intervención Finalizada</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>
                                        <span className="font-medium">Fecha:</span>{' '}
                                        {data.finalizacion?.fecha ? new Date(data.finalizacion.fecha).toLocaleDateString('es-PE', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'No disponible'}
                                    </p>
                                    <p>
                                        <span className="font-medium">Finalizada por:</span>{' '}
                                        {data.finalizacion?.usuario?.nombre_completo || 'No disponible'}
                                    </p>
                                    {data.finalizacion?.observa && (
                                        <p>
                                            <span className="font-medium">Observación:</span>{' '}
                                            {data.finalizacion.observa}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadPdf}
                                disabled={downloadingPdf}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 bg-[#752568] hover:bg-[#5a1d4f] text-white disabled:opacity-50"
                            >
                                {downloadingPdf ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {downloadingPdf ? 'Descargando...' : 'Descargar PDF'}
                            </button>
                        </div>
                    </div>
                ) : !data.esta_derivada && isEditable && (
                    // Mostrar botón de finalizar si no está finalizada y es editable
                    <div data-slot="card" className="text-card-foreground flex flex-col gap-6 rounded-xl border p-4 bg-gradient-to-r from-[#752568]/5 to-[#5a1d4f]/5 border-[#752568]/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[#752568] mb-1 font-semibold">Finalizar Intervención</h3>
                                <p className="text-sm text-gray-600">Use este botón para cerrar la intervención del paciente en cualquier momento</p>
                            </div>
                            <button
                                onClick={handleFinalizarIntervencion}
                                data-slot="button"
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 px-4 py-2 has-[>svg]:px-3 bg-[#752568] hover:bg-[#5a1d4f] text-white"
                            >
                                <CircleCheck className="h-4 w-4 mr-2" />
                                Finalizar
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs de Sesiones */}
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1 overflow-x-auto">
                    {['sesion1', 'sesion2', 'sesion3', 'sesion4'].map((tab, index) => {
                        const tabNum = index + 1;
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                                    ? 'bg-[#752568] text-white shadow-md'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }`}
                            >
                                Sesión {tabNum}
                            </button>
                        );
                    })}
                </div>

                {/* Contenido de la Sesión */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                    <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h3 className="font-medium text-[#752568] mb-1">
                            {activeTab === 'sesion1' && 'Primera Sesión - Evaluación Inicial'}
                            {activeTab === 'sesion2' && 'Segunda Sesión - Seguimiento'}
                            {activeTab === 'sesion3' && 'Tercera Sesión - Seguimiento'}
                            {activeTab === 'sesion4' && 'Cuarta Sesión - Cierre'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {activeTab === 'sesion1' && 'Complete todas las secciones del protocolo de evaluación inicial.'}
                            {activeTab !== 'sesion1' && 'Revise el progreso y continúe con la intervención.'}
                        </p>
                    </div>

                    {/* Accordions for Session 1 */}
                    {activeTab === 'sesion1' && (
                        <div className="space-y-2">
                            <AccordionItem
                                id="section1"
                                title="Datos Generales y Motivo de Consulta"
                                icon={User}
                                isOpen={expandedSections.section1}
                                onToggle={toggleSection}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="1. Nombre completo del serumista" value={paciente.nombre_completo} fullWidth readOnly isEditable={isEditable} formData={formData} onChange={handleInputChange} />
                                    <Field label="2. Edad y fecha de nacimiento" value={paciente.fecha_nacimiento ? `${paciente.fecha_nacimiento} (Calculada)` : '-'} fullWidth readOnly isEditable={isEditable} formData={formData} onChange={handleInputChange} />
                                    <Field label="3. Estado civil y composición familiar" name="con_quien" value={sesion?.con_quien} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.con_quien} hasError={fieldErrors.includes('con_quien')} />
                                    <Field label="4. Lugar de origen y residencia actual" name="donde_vives" value={sesion?.donde_vives} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.donde_vives} hasError={fieldErrors.includes('donde_vives')} />
                                    <Field label="5. Nivel educativo y formación profesional" name="estudiando" value={sesion?.estudiando} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.estudiando} hasError={fieldErrors.includes('estudiando')} />
                                    <Field label="6. Ocupación actual y lugar de SERUMS" name="comodo_en_trabajo" value={sesion?.comodo_en_trabajo} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.comodo_en_trabajo} hasError={fieldErrors.includes('comodo_en_trabajo')} />
                                    <Field label="7. Motivo principal de consulta" name="problema_motiva" value={sesion?.problema_motiva} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.problema_motiva} hasError={fieldErrors.includes('problema_motiva')} />
                                    <Field label="8. ¿Cuándo comenzaron los síntomas?" name="tiempo_empezo" value={sesion?.tiempo_empezo} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.tiempo_empezo} hasError={fieldErrors.includes('tiempo_empezo')} />
                                    <Field label="9. ¿Qué factores desencadenaron la situación actual?" name="disparadores_existe" value={sesion?.disparadores_existe} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.disparadores_existe} hasError={fieldErrors.includes('disparadores_existe')} />
                                </div>
                            </AccordionItem>

                            <AccordionItem
                                id="section2"
                                title="Historia Personal y Familiar"
                                icon={Activity}
                                isOpen={expandedSections.section2}
                                onToggle={toggleSection}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Relaciones afectuosas" name="relaciones_afectuosas" value={sesion?.relaciones_afectuosas} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.relaciones_afectuosas} hasError={fieldErrors.includes('relaciones_afectuosas')} />
                                    <Field label="Bienestar en casa" name="bien_en_casa" value={sesion?.bien_en_casa} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.bien_en_casa} hasError={fieldErrors.includes('bien_en_casa')} />
                                    <Field label="Tiempo en residencia actual" name="tiempo_en_casa" value={sesion?.tiempo_en_casa} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.tiempo_en_casa} hasError={fieldErrors.includes('tiempo_en_casa')} />
                                </div>
                            </AccordionItem>

                            <AccordionItem
                                id="section3"
                                title="Antecedentes Psicológicos"
                                icon={Brain}
                                isOpen={expandedSections.section3}
                                onToggle={toggleSection}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="¿Ha recibido atención psicológica anteriormente?" value="-" fullWidth readOnly isEditable={isEditable} formData={formData} onChange={handleInputChange} />
                                    <Field label="Intentos de solución previos" name="intentos_solucion" value={sesion?.intentos_solucion} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.intentos_solucion} hasError={fieldErrors.includes('intentos_solucion')} />
                                </div>
                            </AccordionItem>

                            <AccordionItem
                                id="section4"
                                title="Exploración del Estado Mental"
                                icon={Activity}
                                isOpen={expandedSections.section4}
                                onToggle={toggleSection}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Apertura" name="apertura" value={sesion?.apertura} isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.apertura} hasError={fieldErrors.includes('apertura')} />
                                    <Field label="Consciencia" name="consciencia" value={sesion?.consciencia} isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.consciencia} hasError={fieldErrors.includes('consciencia')} />
                                    <Field label="Hacer lo que importa" name="hacer_importa" value={sesion?.hacer_importa} isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.hacer_importa} hasError={fieldErrors.includes('hacer_importa')} />
                                    <Field label="Severidad percibida (1-10)" name="severidad_grande" value={sesion?.severidad_grande} isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.severidad_grande} hasError={fieldErrors.includes('severidad_grande')} />
                                </div>
                            </AccordionItem>

                            <AccordionItem
                                id="section5"
                                title="Hipótesis Diagnóstica"
                                icon={Clipboard}
                                isOpen={expandedSections.section5}
                                onToggle={toggleSection}
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <Field label="Costes y Consecuencias" name="costes_problema" value={sesion?.costes_problema} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.costes_problema} hasError={fieldErrors.includes('costes_problema')} />
                                    <Field label="Funcionamiento a corto plazo" name="costes_funcion" value={sesion?.costes_funcion} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.costes_funcion} hasError={fieldErrors.includes('costes_funcion')} />
                                    <Field label="Funcionamiento a largo plazo" name="costes_plazo" value={sesion?.costes_plazo} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.costes_plazo} hasError={fieldErrors.includes('costes_plazo')} />
                                </div>
                            </AccordionItem>

                            <AccordionItem
                                id="section6"
                                title="Plan de Tratamiento"
                                icon={FileText}
                                isOpen={expandedSections.section6}
                                onToggle={toggleSection}
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <Field label="Establecimiento de Objetivos" name="establecimiento" value={sesion?.establecimiento} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.establecimiento} hasError={fieldErrors.includes('establecimiento')} />
                                    <Field label="Intervención Breve" name="intervencion" value={sesion?.intervencion} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.intervencion} hasError={fieldErrors.includes('intervencion')} />
                                </div>
                            </AccordionItem>

                            <AccordionItem
                                id="section7"
                                title="Observaciones Generales"
                                icon={MessageSquare}
                                isOpen={expandedSections.section7}
                                onToggle={toggleSection}
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <Field label="Recomendaciones" name="recomendacionsesionuno" value={sesion?.recomendacionsesionuno} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.recomendacionsesionuno} hasError={fieldErrors.includes('recomendacionsesionuno')} />
                                </div>
                            </AccordionItem>
                        </div>
                    )}

                    {/* Other Sessions */}
                    {activeTab !== 'sesion1' && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            {activeTab === 'sesion2' && (
                                <div className="space-y-4">
                                    <Field label="Revisión del Plan" name="sesiondos_revision" value={sesion?.sesiondos_revision} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesiondos_revision} hasError={fieldErrors.includes('sesiondos_revision')} />
                                    <Field label="Intervención" name="sesiondos_intervencion" value={sesion?.sesiondos_intervencion} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesiondos_intervencion} hasError={fieldErrors.includes('sesiondos_intervencion')} />
                                    <Field label="Progreso" name="sesiondos_progreso" value={sesion?.sesiondos_progreso} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesiondos_progreso} hasError={fieldErrors.includes('sesiondos_progreso')} />
                                    <Field label="Recomendaciones" name="recomendacionsesiondos" value={sesion?.recomendacionsesiondos} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.recomendacionsesiondos} hasError={fieldErrors.includes('recomendacionsesiondos')} />
                                </div>
                            )}
                            {activeTab === 'sesion3' && (
                                <div className="space-y-4">
                                    <Field label="Revisión del Plan" name="sesiontres_revision" value={sesion?.sesiontres_revision} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesiontres_revision} hasError={fieldErrors.includes('sesiontres_revision')} />
                                    <Field label="Intervención" name="sesiontres_intervencion" value={sesion?.sesiontres_intervencion} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesiontres_intervencion} hasError={fieldErrors.includes('sesiontres_intervencion')} />
                                    <Field label="Progreso" name="sesiontres_progreso" value={sesion?.sesiontres_progreso} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesiontres_progreso} hasError={fieldErrors.includes('sesiontres_progreso')} />
                                    <Field label="Recomendaciones" name="recomendacionsesiontres" value={sesion?.recomendacionsesiontres} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.recomendacionsesiontres} hasError={fieldErrors.includes('recomendacionsesiontres')} />
                                </div>
                            )}
                            {activeTab === 'sesion4' && (
                                <div className="space-y-4">
                                    <Field label="Revisión del Plan" name="sesioncuatro_revision" value={sesion?.sesioncuatro_revision} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesioncuatro_revision} hasError={fieldErrors.includes('sesioncuatro_revision')} />
                                    <Field label="Intervención" name="sesioncuatro_intervencion" value={sesion?.sesioncuatro_intervencion} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesioncuatro_intervencion} hasError={fieldErrors.includes('sesioncuatro_intervencion')} />
                                    <Field label="Progreso" name="sesioncuatro_progreso" value={sesion?.sesioncuatro_progreso} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.sesioncuatro_progreso} hasError={fieldErrors.includes('sesioncuatro_progreso')} />
                                    <Field label="Recomendaciones" name="recomendacionsesioncuatro" value={sesion?.recomendacionsesioncuatro} fullWidth isEditable={isEditable} formData={formData} onChange={handleInputChange} maxLength={fieldLimits.recomendacionsesioncuatro} hasError={fieldErrors.includes('recomendacionsesioncuatro')} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Botones de Acción Inferiores (Solo si es editable y NO está derivada ni finalizada) */}
                {isEditable && !data.esta_derivada && !data.esta_finalizada && (
                    <div data-slot="card" className="text-card-foreground flex flex-col gap-6 rounded-xl border p-6 bg-gray-50 border-[#752568]/20">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">Complete todas las preguntas antes de continuar</div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDerivar}
                                    disabled={!data.es_riesgo_alto}
                                    title={!data.es_riesgo_alto ? 'Solo se puede derivar pacientes con Riesgo Alto' : 'Derivar paciente'}
                                    data-slot="button"
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 border-red-500 text-red-700 hover:bg-red-50"
                                >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Derivar
                                </button>
                                <button
                                    onClick={handleRegistrar}
                                    disabled={saving}
                                    data-slot="button"
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 px-4 py-2 has-[>svg]:px-3 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Derivación */}
            {derivarModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="absolute inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setDerivarModalOpen(false)}></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-[#752568] mb-4">Derivar Paciente</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Terapeuta
                                        </label>
                                        <select
                                            className="w-full border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568] p-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            value={derivacionData.especialista_id}
                                            onChange={(e) => setDerivacionData({ ...derivacionData, especialista_id: e.target.value })}
                                            disabled={derivacionData.accion === 'U'}
                                        >
                                            <option value="">Seleccione un terapeuta</option>
                                            {especialistas.map(esp => (
                                                <option key={esp.id} value={esp.id}>{esp.nombre_completo}</option>
                                            ))}
                                        </select>
                                        {derivacionData.accion === 'U' && (
                                            <p className="text-xs text-gray-500 mt-1">El terapeuta no puede modificarse en derivaciones existentes</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                                        <textarea
                                            className="w-full border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568] p-2"
                                            rows="4"
                                            value={derivacionData.observacion}
                                            onChange={(e) => setDerivacionData({ ...derivacionData, observacion: e.target.value })}
                                            placeholder="Ingrese el motivo de la derivación..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSubmitDerivacion}
                                    disabled={loadingDerivacion}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#752568] text-base font-medium text-white hover:bg-[#5a1d4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#752568] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {loadingDerivacion ? 'Enviando...' : 'Enviar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDerivarModalOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default ProtocoloDetallePage;
