import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import MainLayout from '../components/layouts/MainLayout';
import Swal from 'sweetalert2';
import {
    Filter,
    Clock,
    CircleCheck,
    CircleX,
    Ban,
    FileText,
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
    X,
    CircleAlert
} from 'lucide-react';

const ProtocoloAtencionPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Estados con inicialización desde sessionStorage
    const [citas, setCitas] = useState(() => {
        const saved = sessionStorage.getItem('protocolo_citas');
        return saved ? JSON.parse(saved) : [];
    });

    const [stats, setStats] = useState(() => {
        const saved = sessionStorage.getItem('protocolo_stats');
        return saved ? JSON.parse(saved) : {
            por_atender: 0,
            atendidos: 0,
            no_se_presentaron: 0,
            cancelados: 0,
            finalizados: 0,
            derivados: 0
        };
    });

    const [terapeutas, setTerapeutas] = useState([]);
    const [pacientes, setPacientes] = useState([]);

    const [filtros, setFiltros] = useState(() => {
        const saved = sessionStorage.getItem('protocolo_filtros');
        return saved ? JSON.parse(saved) : {
            terapeuta_id: '',
            mes: '',
            estado: '',
            paciente_id: ''
        };
    });

    const [paginacion, setPaginacion] = useState(() => {
        const savedPage = sessionStorage.getItem('protocolo_page');
        const savedTotal = sessionStorage.getItem('protocolo_total');
        const savedLastPage = sessionStorage.getItem('protocolo_last_page');
        return {
            current_page: savedPage ? parseInt(savedPage) : 1,
            last_page: savedLastPage ? parseInt(savedLastPage) : 1,
            per_page: 10,
            total: savedTotal ? parseInt(savedTotal) : 0
        };
    });

    // Modal Agendar/Reprogramar
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('agendar'); // 'agendar' or 'reprogramar'
    const [selectedCita, setSelectedCita] = useState(null);
    const [turnosDisponibles, setTurnosDisponibles] = useState([]);
    const [loadingTurnos, setLoadingTurnos] = useState(false);
    const [selectedTurno, setSelectedTurno] = useState(null);

    // Meses
    const meses = [
        { id: 1, nombre: 'Enero' },
        { id: 2, nombre: 'Febrero' },
        { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' },
        { id: 5, nombre: 'Mayo' },
        { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' },
        { id: 8, nombre: 'Agosto' },
        { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' },
        { id: 11, nombre: 'Noviembre' },
        { id: 12, nombre: 'Diciembre' }
    ];

    // Persistencia de estados
    useEffect(() => {
        sessionStorage.setItem('protocolo_filtros', JSON.stringify(filtros));
    }, [filtros]);

    useEffect(() => {
        sessionStorage.setItem('protocolo_page', paginacion.current_page.toString());
        sessionStorage.setItem('protocolo_total', paginacion.total.toString());
        sessionStorage.setItem('protocolo_last_page', paginacion.last_page.toString());
    }, [paginacion]);

    useEffect(() => {
        if (citas.length > 0) {
            sessionStorage.setItem('protocolo_citas', JSON.stringify(citas));
        }
    }, [citas]);

    useEffect(() => {
        sessionStorage.setItem('protocolo_stats', JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        cargarTerapeutas();
        cargarPacientes();
    }, []);

    // Ref para controlar la carga inicial
    const initialLoadDone = useRef(false);

    useEffect(() => {
        // Lógica para evitar recarga si ya hay datos en memoria (al volver de detalle)
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            if (citas.length > 0) {
                // Si ya tenemos citas cargadas del storage, no hacemos fetch inicial
                return;
            }
        }
        cargarDatos(paginacion.current_page);
    }, [filtros, paginacion.current_page]);

    const cargarTerapeutas = async () => {
        try {
            const response = await axios.get('/terapeutas');
            if (response.data.success) {
                setTerapeutas(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar terapeutas:', error);
        }
    };

    const cargarPacientes = async () => {
        try {
            const response = await axios.get('/protocolos/pacientes');
            if (response.data.success) {
                setPacientes(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
        }
    };

    const cargarDatos = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                per_page: paginacion.per_page,
                ...Object.fromEntries(
                    Object.entries(filtros).filter(([_, v]) => v !== '')
                )
            });

            // Cargar Stats con filtros
            const statsRes = await axios.get(`/protocolos/stats?${params}`);
            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            // Cargar Citas
            const response = await axios.get(`/protocolos?${params}`);
            if (response.data.success) {
                setCitas(response.data.data);
                setPaginacion(prev => ({
                    ...prev,
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    total: response.data.total
                }));
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (key, value) => {
        setFiltros(prev => ({ ...prev, [key]: value }));
        setPaginacion(prev => ({ ...prev, current_page: 1 }));
        // Al cambiar filtro, limpiamos citas guardadas para forzar recarga (manejado por useEffect)
        sessionStorage.removeItem('protocolo_citas');
        setCitas([]);
    };

    const handlePageChange = (newPage) => {
        setPaginacion(prev => ({ ...prev, current_page: newPage }));
        // Al cambiar página, forzamos recarga
        sessionStorage.removeItem('protocolo_citas');
        setCitas([]);
    };

    // Modal Logic
    const openModal = async (cita, type) => {
        setSelectedCita(cita);
        setModalType(type);
        setModalOpen(true);
        setSelectedTurno(null);
        setTurnosDisponibles([]);

        const medicoId = cita.medico_id || cita.medico?.id;

        if (medicoId) {
            setLoadingTurnos(true);
            try {
                const today = new Date();
                const nextYear = new Date();
                nextYear.setFullYear(today.getFullYear() + 1);

                const params = {
                    medico_id: medicoId,
                    fecha_inicio: today.toISOString().split('T')[0],
                    fecha_fin: nextYear.toISOString().split('T')[0],
                    per_page: 500
                };

                const response = await axios.get('/turnos', { params });

                if (response.data.success) {
                    let disponibles = response.data.data.filter(t =>
                        t.agendado === 0 || t.agendado === '0' || t.agendado === false
                    );

                    // Filtrar por duración según la sesión
                    // Sesión 1: 60 minutos
                    // Sesión 2-4: 30 minutos
                    const currentGlobal = cita.numero_cita_global || 1;
                    let targetSession;

                    if (type === 'reprogramar') {
                        targetSession = ((currentGlobal - 1) % 4) + 1;
                    } else if (type === 'agendar') {
                        targetSession = (currentGlobal % 4) + 1;
                    }

                    if (targetSession) {
                        disponibles = disponibles.filter(t => {
                            // Asumimos formato HH:mm:ss
                            const start = new Date(`1970-01-01T${t.hora_inicio}`);
                            const end = new Date(`1970-01-01T${t.hora_fin}`);
                            const durationMinutes = (end - start) / 60000;

                            // Margen de error de 1 minuto por si acaso
                            if (targetSession === 1) {
                                return durationMinutes >= 59 && durationMinutes <= 61;
                            } else {
                                return durationMinutes >= 29 && durationMinutes <= 31;
                            }
                        });
                    }

                    setTurnosDisponibles(disponibles);
                }
            } catch (error) {
                console.error('Error al cargar turnos:', error);
                Swal.fire('Error', 'No se pudieron cargar los horarios disponibles', 'error');
            } finally {
                setLoadingTurnos(false);
            }
        } else {
            Swal.fire('Error', 'No se encontró el ID del terapeuta para buscar horarios.', 'error');
        }
    };

    const handleConfirmarCita = async () => {
        if ((modalType === 'agendar' || modalType === 'reprogramar') && !selectedTurno) return;

        try {
            let endpoint = '';
            let payload = {};

            if (modalType === 'agendar') {
                endpoint = '/protocolos/agendar';
                payload = {
                    turno_id: selectedTurno.id,
                    paciente_id: selectedCita.paciente_id,
                    cita_origen_id: selectedCita.id
                };
            } else if (modalType === 'reprogramar') {
                endpoint = '/protocolos/reprogramar';
                payload = {
                    cita_id: selectedCita.id,
                    nuevo_turno_id: selectedTurno.id
                };
            } else if (modalType === 'no_se_presento') {
                endpoint = '/protocolos/no_presento';
                payload = { cita_id: selectedCita.id };
                // Aquí se podrían agregar motivo y archivo si se implementa en el backend
            } else if (modalType === 'cancelar') {
                endpoint = '/protocolos/cancelar';
                payload = { cita_id: selectedCita.id };
                // Aquí se podrían agregar motivo y archivo si se implementa en el backend
            }

            const response = await axios.post(endpoint, payload);

            if (response.data.success) {
                Swal.fire({
                    title: '¡Éxito!',
                    text: response.data.message,
                    icon: 'success',
                    confirmButtonColor: '#752568'
                });
                setModalOpen(false);
                // Forzar recarga de datos tras acción exitosa
                sessionStorage.removeItem('protocolo_citas');
                setCitas([]);
                cargarDatos(paginacion.current_page);
            }
        } catch (error) {
            console.error('Error al procesar cita:', error);
            Swal.fire('Error', error.response?.data?.message || 'Ocurrió un error', 'error');
        }
    };

    const getEstadoBadge = (estado, cita = null) => {
        // Verificar si está derivada (tiene registro en derivados)
        if (cita && cita.derivado) {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1 w-fit"><CircleAlert className="w-3 h-3" /> Derivado</span>;
        }
        
        // Verificar si está finalizada (tiene registro en finalizado)
        if (cita && cita.finalizado) {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1 w-fit"><CircleCheck className="w-3 h-3" /> Finalizado</span>;
        }
        
        switch (parseInt(estado)) {
            case 2: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CircleCheck className="w-3 h-3" /> Atendido</span>;
            case 3: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1 w-fit"><CircleX className="w-3 h-3" /> No se presentó</span>;
            case 4: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1 w-fit"><Ban className="w-3 h-3" /> Cancelado</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Por Atender</span>;
        }
    };

    const getAtencionBadge = (estado) => {
        switch (parseInt(estado)) {
            case 1: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Agendado</span>;
            case 2: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Agendado</span>;
            case 3: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Reagendado</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Sin agendar</span>;
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        try {
            // Intentar parsear la fecha de diferentes formas
            let date;
            
            // Si la fecha ya incluye 'T', es ISO format
            if (fecha.includes('T')) {
                date = new Date(fecha);
            } else {
                // Si no, agregar T00:00:00 para evitar problemas de zona horaria
                date = new Date(fecha + 'T00:00:00');
            }
            
            // Verificar si la fecha es válida
            if (isNaN(date.getTime())) {
                return '-';
            }
            
            return date.toLocaleDateString('es-PE', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
        } catch (error) {
            console.error('Error formateando fecha:', fecha, error);
            return '-';
        }
    };

    // Calcular total en suma
    const totalEnSuma = stats.por_atender + stats.atendidos + stats.no_se_presentaron + 
                        stats.cancelados + stats.finalizados + stats.derivados;

    return (
        <MainLayout>
            <div className="space-y-6 font-sans">
                {/* Encabezado */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-[#752568]">Protocolo de Atención</h1>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Total en Suma</p>
                            <p className="text-3xl font-bold text-[#752568]">{totalEnSuma}</p>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[#752568]">
                        <Filter className="w-5 h-5" />
                        <h3 className="font-semibold">Filtros de Búsqueda</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Filtrar por Terapeuta
                            </label>
                            <select
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568] py-2.5"
                                value={filtros.terapeuta_id}
                                onChange={(e) => handleFiltroChange('terapeuta_id', e.target.value)}
                            >
                                <option value="">Todos los terapeutas</option>
                                {terapeutas.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Filtrar por Mes
                            </label>
                            <select
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568] py-2.5"
                                value={filtros.mes}
                                onChange={(e) => handleFiltroChange('mes', e.target.value)}
                            >
                                <option value="">Todos los meses</option>
                                {meses.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                <CircleCheck className="w-3 h-3" /> Filtrar por Estado
                            </label>
                            <select
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568] py-2.5"
                                value={filtros.estado}
                                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="1">Por Atender</option>
                                <option value="2">Atendido</option>
                                <option value="3">No se presentó</option>
                                <option value="4">Cancelado</option>
                                <option value="finalizados">Finalizados</option>
                                <option value="derivados">Derivados</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Filtrar por Paciente
                            </label>
                            <select
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568] py-2.5"
                                value={filtros.paciente_id}
                                onChange={(e) => handleFiltroChange('paciente_id', e.target.value)}
                            >
                                <option value="">Todos los pacientes</option>
                                {pacientes.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre_completo}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Por Atender</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.por_atender}</p>
                        </div>
                        <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Atendidos</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.atendidos}</p>
                        </div>
                        <CircleCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Finalizados</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.finalizados}</p>
                        </div>
                        <CircleCheck className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Derivados</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.derivados}</p>
                        </div>
                        <CircleAlert className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">No se Presentaron</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats.no_se_presentaron}</p>
                        </div>
                        <CircleX className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Cancelados</p>
                            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.cancelados}</p>
                        </div>
                        <Ban className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-purple-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">N° Intervención (v2)</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">N° Sesión</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">Horario</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">Terapeuta</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">Atención</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                                            <div className="flex justify-center items-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#752568]"></div>
                                                Cargando datos...
                                            </div>
                                        </td>
                                    </tr>
                                ) : citas.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                                            No se encontraron registros.
                                        </td>
                                    </tr>
                                ) : (
                                    citas.map((cita) => (
                                        <tr key={cita.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {/* Debug: {JSON.stringify(cita)} */}
                                                <div className="w-8 h-8 rounded-full bg-[#5a1d4f] text-white flex items-center justify-center font-bold text-sm" title={`Global: ${cita.numero_cita_global}`}>
                                                    {cita.numero_intervencion ?? Math.ceil((cita.numero_cita_global || 1) / 4)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-8 h-8 rounded-full bg-[#F8AD1D] text-white flex items-center justify-center font-bold text-sm">
                                                    {cita.numero_sesion ?? ((cita.numero_cita_global - 1) % 4) + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{cita.paciente?.nombre_completo || 'Desconocido'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                                {formatearFecha(cita.fecha)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {cita.hora_inicio ? cita.hora_inicio.substring(0, 5) : '--:--'} - {cita.hora_fin ? cita.hora_fin.substring(0, 5) : '--:--'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-purple-50 text-[#752568] rounded text-xs font-medium">
                                                    {cita.medico?.nombre_completo || 'Sin asignar'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getEstadoBadge(cita.estado, cita)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(() => {
                                                    const estado = parseInt(cita.estado);
                                                    const hasNext = !!cita.proxima_cita_id;
                                                    const estaFinalizada = !!cita.finalizado;
                                                    const estaDerivada = !!cita.derivado;

                                                    if (estado === 1) return <span className="text-gray-400">-</span>;

                                                    // Si está derivada, mostrar estado especial
                                                    if (estaDerivada) {
                                                        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Paciente derivado</span>;
                                                    }

                                                    // Si está finalizada, mostrar estado especial
                                                    if (estaFinalizada) {
                                                        return hasNext
                                                            ? <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Nueva interv. agendada</span>
                                                            : <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Intervención cerrada</span>;
                                                    }

                                                    if (estado === 2) { // Atendido
                                                        return hasNext
                                                            ? <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Agendado</span>
                                                            : <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Sin agendar</span>;
                                                    }

                                                    if (estado === 3) { // No se presentó
                                                        return hasNext
                                                            ? <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Agendado</span>
                                                            : <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Sin reagendar</span>;
                                                    }

                                                    if (estado === 4) { // Cancelado
                                                        return hasNext
                                                            ? <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Reagendado</span>
                                                            : <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Sin reagendar</span>;
                                                    }

                                                    return <span className="text-gray-400">-</span>;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {/* Lógica de Botones */}
                                                    {(() => {
                                                        const estado = parseInt(cita.estado);
                                                        const hasNext = !!cita.proxima_cita_id;
                                                        const estaFinalizada = !!cita.finalizado;
                                                        const estaDerivada = !!cita.derivado;

                                                        // Cita Derivada: Solo Ver Protocolo
                                                        if (estaDerivada) {
                                                            return (
                                                                <button
                                                                    onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-green-300 text-green-700 hover:bg-green-50 h-8 w-8"
                                                                    title="Ver protocolo"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                                                </button>
                                                            );
                                                        }

                                                        // Cita Finalizada: Solo Ver Protocolo
                                                        if (estaFinalizada) {
                                                            return (
                                                                <button
                                                                    onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-green-300 text-green-700 hover:bg-green-50 h-8 w-8"
                                                                    title="Ver protocolo"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                                                </button>
                                                            );
                                                        }

                                                        // Estado 1: Por Atender
                                                        if (estado === 1) {
                                                            return (
                                                                <>
                                                                    <button
                                                                        onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-9 rounded-md bg-[#752568] hover:bg-[#5a1d4f] text-white h-8 w-8"
                                                                        title="Atender"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-play h-4 w-4"><path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"></path><circle cx="12" cy="12" r="10"></circle></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openModal(cita, 'no_se_presento')}
                                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-gray-300 text-gray-700 hover:bg-gray-50 h-8 w-8"
                                                                        title="No se presentó"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ban h-4 w-4"><path d="M4.929 4.929 19.07 19.071"></path><circle cx="12" cy="12" r="10"></circle></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openModal(cita, 'cancelar')}
                                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-red-300 text-red-700 hover:bg-red-50 h-8 w-8"
                                                                        title="Cancelar"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x h-4 w-4"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-green-300 text-green-700 hover:bg-green-50 h-8 w-8"
                                                                        title="Ver protocolo"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                                                    </button>
                                                                </>
                                                            );
                                                        }

                                                        // Estado 2: Atendido
                                                        if (estado === 2) {
                                                            return (
                                                                <>
                                                                    <button
                                                                        onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-green-300 text-green-700 hover:bg-green-50 h-8 w-8"
                                                                        title="Ver protocolo"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                                                    </button>
                                                                    {!hasNext && (
                                                                        <button
                                                                            onClick={() => openModal(cita, 'agendar')}
                                                                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-blue-300 text-blue-700 hover:bg-blue-50 h-8 w-8"
                                                                            title="Agendar"
                                                                        >
                                                                            <Calendar className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        }

                                                        // Estado 3: No se presentó
                                                        if (estado === 3) {
                                                            return (
                                                                <>
                                                                    <button
                                                                        onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-green-300 text-green-700 hover:bg-green-50 h-8 w-8"
                                                                        title="Ver protocolo"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                                                    </button>
                                                                    {!hasNext && (
                                                                        <button
                                                                            onClick={() => openModal(cita, 'reprogramar')}
                                                                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-orange-300 text-orange-700 hover:bg-orange-50 h-8 w-8"
                                                                            title="Reprogramar"
                                                                        >
                                                                            <Clock className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        }

                                                        // Estado 4: Cancelado
                                                        if (estado === 4) {
                                                            return (
                                                                <>
                                                                    <button
                                                                        onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-green-300 text-green-700 hover:bg-green-50 h-8 w-8"
                                                                        title="Ver protocolo"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                                                    </button>
                                                                    {!hasNext && (
                                                                        <button
                                                                            onClick={() => openModal(cita, 'reprogramar')}
                                                                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-orange-300 text-orange-700 hover:bg-orange-50 h-8 w-8"
                                                                            title="Reprogramar"
                                                                        >
                                                                            <Clock className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        }

                                                        // Estado 5: Derivado - Solo Ver Protocolo
                                                        if (estado === 5) {
                                                            return (
                                                                <button
                                                                    onClick={() => navigate(`/protocolo/${cita.id}`)}
                                                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-md border-green-300 text-green-700 hover:bg-green-50 h-8 w-8"
                                                                    title="Ver protocolo"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                                                </button>
                                                            );
                                                        }

                                                        return null;
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table >
                    </div >

                    {/* Paginación */}
                    {
                        paginacion.total > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((paginacion.current_page - 1) * paginacion.per_page) + 1} - {Math.min(paginacion.current_page * paginacion.per_page, paginacion.total)} de {paginacion.total} citas
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(paginacion.current_page - 1)}
                                        disabled={paginacion.current_page === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Anterior
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(Math.min(5, paginacion.last_page))].map((_, i) => {
                                            let pageNum = i + 1;
                                            if (paginacion.last_page > 5 && paginacion.current_page > 3) {
                                                pageNum = paginacion.current_page - 2 + i;
                                            }
                                            if (pageNum > paginacion.last_page) return null;

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${paginacion.current_page === pageNum
                                                        ? 'bg-[#752568] text-white'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(paginacion.current_page + 1)}
                                        disabled={paginacion.current_page === paginacion.last_page}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
                                    >
                                        Siguiente <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* Modal Agendar/Reprogramar/Acciones */}
            {
                modalOpen && selectedCita && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="absolute inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setModalOpen(false)}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg leading-6 font-medium text-[#752568] flex items-center gap-2">
                                            {modalType === 'agendar' && <><Calendar className="w-5 h-5" /> Agendar Cita</>}
                                            {modalType === 'reprogramar' && <><Clock className="w-5 h-5" /> Reprogramar Cita</>}
                                            {modalType === 'no_se_presento' && <><CircleX className="w-5 h-5" /> Marcar como No se Presentó</>}
                                            {modalType === 'cancelar' && <><Ban className="w-5 h-5" /> Cancelar Cita</>}
                                        </h3>
                                        <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {(modalType === 'agendar' || modalType === 'reprogramar') ? (
                                        <div className="space-y-4">
                                            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                                                <h4 className="text-sm font-medium text-[#752568] mb-2 flex items-center gap-1">
                                                    <CircleAlert className="w-4 h-4" /> Cita Actual
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 block">Paciente:</span>
                                                        <span className="font-medium">{selectedCita.paciente?.nombre_completo}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Terapeuta:</span>
                                                        <span className="font-medium">{selectedCita.medico?.nombre_completo}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Fecha Original:</span>
                                                        <span className="font-medium">{formatearFecha(selectedCita.fecha)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Horario Original:</span>
                                                        <span className="font-medium">{selectedCita.hora_inicio?.substring(0, 5)} - {selectedCita.hora_fin?.substring(0, 5)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" /> Horarios Disponibles
                                                </h4>
                                                <p className="text-xs text-gray-500 mb-2">Seleccione un nuevo horario disponible para {selectedCita.medico?.nombre_completo}</p>

                                                {loadingTurnos ? (
                                                    <div className="text-center py-4">
                                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#752568]"></div>
                                                    </div>
                                                ) : turnosDisponibles.length === 0 ? (
                                                    <div className="text-center py-4 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
                                                        No hay horarios disponibles próximamente.
                                                    </div>
                                                ) : (
                                                    <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                                                        {turnosDisponibles.map((turno) => (
                                                            <div
                                                                key={turno.id}
                                                                onClick={() => setSelectedTurno(turno)}
                                                                className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${selectedTurno?.id === turno.id
                                                                    ? 'bg-purple-50 border-[#752568] ring-1 ring-[#752568]'
                                                                    : 'border-gray-200 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {formatearFecha(turno.fecha)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {turno.hora_inicio?.substring(0, 5)} - {turno.hora_fin?.substring(0, 5)}
                                                                    </span>
                                                                    {selectedTurno?.id === turno.id && (
                                                                        <span className="ml-2 px-2 py-0.5 bg-[#752568] text-white text-xs rounded">Elegir</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-600">
                                                Por favor, registre el motivo de la {modalType === 'cancelar' ? 'cancelación' : 'inasistencia'}.
                                            </p>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                                                <textarea
                                                    className="w-full border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568] p-2"
                                                    rows="3"
                                                    placeholder="Describa el motivo..."
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Evidencia (Opcional)</label>
                                                <input
                                                    type="file"
                                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-[#752568] hover:file:bg-purple-100"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 italic">
                                                Este campo es obligatorio para proceder con la acción.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleConfirmarCita}
                                        disabled={(modalType === 'agendar' || modalType === 'reprogramar') && !selectedTurno}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#752568] text-base font-medium text-white hover:bg-[#5a1d4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#752568] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirmar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </MainLayout >
    );
};

export default ProtocoloAtencionPage;
