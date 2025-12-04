import { useState, useEffect } from 'react';
import axios from '../api/axios';
import MainLayout from '../components/layouts/MainLayout';
import Swal from 'sweetalert2';
import {
    Calendar,
    Clock,
    User,
    AlertTriangle,
    FileText,
    ArrowRightCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle,
    Video,
    Trash2,
    AlertCircle
} from 'lucide-react';

const CitasRiesgoPage = () => {
    const [activeTab, setActiveTab] = useState('registrar'); // registrar, calendario
    const [loading, setLoading] = useState(false);

    // Data
    const [pacientes, setPacientes] = useState([]);
    const [terapeutas, setTerapeutas] = useState([]);
    const [turnosDisponibles, setTurnosDisponibles] = useState([]);
    const [citasCalendario, setCitasCalendario] = useState({});

    // Form State
    const [selectedPaciente, setSelectedPaciente] = useState('');
    const [selectedTerapeuta, setSelectedTerapeuta] = useState('');
    const [selectedTurno, setSelectedTurno] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [numeroIntervencion, setNumeroIntervencion] = useState(0);
    const [numeroSesion, setNumeroSesion] = useState(0);
    const [citaPendiente, setCitaPendiente] = useState(null);

    // Calendar State
    const [mesActual, setMesActual] = useState(new Date());
    const [filtroTerapeutaCalendario, setFiltroTerapeutaCalendario] = useState('todos');
    const [filtroPacienteCalendario, setFiltroPacienteCalendario] = useState('todos');
    const [filtroEstadoCalendario, setFiltroEstadoCalendario] = useState('todos'); // 'todos', 'agendados', 'disponibles'
    const [estadisticasCalendario, setEstadisticasCalendario] = useState({
        total: 0,
        agendados: 0,
        disponibles: 0,
        dia_actual: 0,
        dia_actual_agendados: 0,
        dia_actual_disponibles: 0
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [mesEliminar, setMesEliminar] = useState(new Date());
    const [conteoEliminar, setConteoEliminar] = useState(0);
    const [loadingConteo, setLoadingConteo] = useState(false);
    const [showDetalleDiaModal, setShowDetalleDiaModal] = useState(false);
    const [detalleDia, setDetalleDia] = useState({ fecha: null, turnos: [] });
    const [filtroTerapeutaModal, setFiltroTerapeutaModal] = useState('todos');

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setSelectedTurno(null);
            if (selectedPaciente && selectedTerapeuta) {
                const sesionData = await cargarIntervencionSesion(selectedPaciente);
                if (sesionData) {
                    if (sesionData.cita_pendiente) {
                        setTurnosDisponibles([]);
                    } else {
                        await cargarTurnosDisponibles(selectedTerapeuta, sesionData.numero_sesion);
                    }
                }
            } else {
                setTurnosDisponibles([]);
                setNumeroIntervencion(0);
                setNumeroSesion(0);
                setCitaPendiente(null);
            }
        };
        fetchData();
    }, [selectedPaciente, selectedTerapeuta]);

    useEffect(() => {
        if (activeTab === 'calendario') {
            cargarCalendario();
        }
    }, [activeTab, mesActual, filtroTerapeutaCalendario, filtroPacienteCalendario]);

    const cargarDatosIniciales = async () => {
        try {
            const [pacientesRes, terapeutasRes] = await Promise.all([
                axios.get('/pacientes/riesgo-moderado'),
                axios.get('/terapeutas')
            ]);
            setPacientes(pacientesRes.data.data);
            setTerapeutas(terapeutasRes.data.data);
        } catch (err) {
            console.error('Error cargando datos iniciales:', err);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            Toast.fire({
                icon: 'error',
                title: 'Error al cargar datos iniciales'
            });
        }
    };

    const cargarTurnosDisponibles = async (medicoId, sesionNum) => {
        setLoading(true);
        try {
            // Reutilizamos el endpoint de turnos con filtro de estado 'disponible'
            const response = await axios.get(`/turnos?medico_id=${medicoId}&estado=disponible&per_page=100`);
            if (response.data.success) {
                // Filtrar el turno seleccionado si existe
                let turnosFiltrados = response.data.data;
                // Filtrar por fecha (hoy en adelante)
                // Usamos comparación de strings YYYY-MM-DD para evitar problemas de zona horaria
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                turnosFiltrados = turnosFiltrados.filter(t => {
                    // t.fecha viene como YYYY-MM-DD
                    return t.fecha >= todayStr;
                });

                // Filtrar por duración según número de sesión
                if (sesionNum) {
                    const numSesion = parseInt(sesionNum);
                    const duracionRequerida = numSesion === 1 ? 60 : 30;

                    turnosFiltrados = turnosFiltrados.filter(t => {
                        // Asegurar que duracion sea tratado como número
                        const duracionTurno = parseInt(t.duracion);
                        return duracionTurno === duracionRequerida;
                    });
                }

                if (turnosFiltrados.length === 0) {
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer)
                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                        }
                    });
                    Toast.fire({
                        icon: 'info',
                        title: 'No hay horarios disponibles con los criterios requeridos'
                    });
                }

                // Agrupar por fecha
                const turnosAgrupados = turnosFiltrados.reduce((acc, turno) => {
                    const fecha = turno.fecha;
                    if (!acc[fecha]) acc[fecha] = [];
                    acc[fecha].push(turno);
                    return acc;
                }, {});

                // Ordenar las fechas en orden ascendente (corregido)
                const fechasOrdenadas = Object.keys(turnosAgrupados).sort((a, b) => {
                    const dateA = new Date(a);
                    const dateB = new Date(b);
                    return dateA.getTime() - dateB.getTime();
                });

                // Ordenar turnos dentro de cada fecha por hora
                const turnosOrdenados = {};
                fechasOrdenadas.forEach(fecha => {
                    turnosOrdenados[fecha] = turnosAgrupados[fecha].sort((a, b) => {
                        return a.hora_inicio.localeCompare(b.hora_inicio);
                    });
                });

                setTurnosDisponibles(turnosOrdenados);
            }
        } catch (err) {
            console.error('Error cargando turnos:', err);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            Toast.fire({
                icon: 'error',
                title: 'Error al cargar turnos disponibles'
            });
        } finally {
            setLoading(false);
        }
    };

    const cargarIntervencionSesion = async (pacienteId) => {
        setCitaPendiente(null);
        try {
            const response = await axios.get(`/citas/intervencion-sesion/${pacienteId}`);
            if (response.data.success) {
                const data = response.data.data;
                setNumeroIntervencion(data.numero_intervencion);
                setNumeroSesion(data.numero_sesion);

                // Verificar si se alcanzó el límite de 4 sesiones
                if (data.debe_finalizar) {
                    // Si además tiene una cita pendiente, incluir su información
                    if (data.cita_pendiente && data.cita_pendiente_info) {
                        setCitaPendiente({ 
                            ...data.cita_pendiente_info, 
                            mensaje: data.mensaje_validacion, 
                            tipo: 'limite' 
                        });
                    } else {
                        setCitaPendiente({ mensaje: data.mensaje_validacion, tipo: 'limite' });
                    }
                    
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 7000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer)
                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                        }
                    });
                    Toast.fire({
                        icon: 'info',
                        title: data.mensaje_validacion
                    });
                    return data;
                }

                // Verificar si hay cita pendiente
                if (data.cita_pendiente) {
                    setCitaPendiente(data.cita_pendiente_info);
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 5000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer)
                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                        }
                    });
                    Toast.fire({
                        icon: 'warning',
                        title: 'El paciente ya tiene una cita pendiente de atención'
                    });
                }

                return data;
            }
        } catch (err) {
            console.error('Error cargando intervención y sesión:', err);
            // Valores por defecto en caso de error
            setNumeroIntervencion(0);
            setNumeroSesion(0);
            return { numero_intervencion: 0, numero_sesion: 0 };
        }
        return null;
    };

    const cargarCalendario = async () => {
        setLoading(true);
        try {
            const params = {
                year: mesActual.getFullYear(),
                month: mesActual.getMonth() + 1,
                medico_id: filtroTerapeutaCalendario !== 'todos' ? filtroTerapeutaCalendario : undefined,
                paciente_id: filtroPacienteCalendario !== 'todos' ? filtroPacienteCalendario : undefined
            };
            const response = await axios.get('/turnos/calendario', { params });
            if (response.data.success) {
                setCitasCalendario(response.data.data);
                if (response.data.estadisticas) {
                    setEstadisticasCalendario(response.data.estadisticas);
                }
            }
        } catch (err) {
            console.error('Error cargando calendario:', err);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            Toast.fire({
                icon: 'error',
                title: 'Error al cargar el calendario'
            });
        } finally {
            setLoading(false);
        }
    };

    const cargarConteoEliminar = async (year, month, medicoId) => {
        setLoadingConteo(true);
        try {
            const params = {
                year: year,
                month: month,
                medico_id: medicoId !== 'todos' ? medicoId : undefined
            };
            const response = await axios.get('/turnos/contar-disponibles', { params });
            if (response.data.success) {
                setConteoEliminar(response.data.conteo || 0);
            }
        } catch (err) {
            console.error('Error cargando conteo:', err);
            setConteoEliminar(0);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            Toast.fire({
                icon: 'error',
                title: 'Error al cargar conteo de eliminaciones'
            });
        } finally {
            setLoadingConteo(false);
        }
    };

    useEffect(() => {
        if (showDeleteModal) {
            // Inicializar con el mes actual
            setMesEliminar(new Date(mesActual));
            cargarConteoEliminar(
                mesActual.getFullYear(),
                mesActual.getMonth() + 1,
                filtroTerapeutaCalendario
            );
        }
    }, [showDeleteModal]);

    useEffect(() => {
        if (showDeleteModal) {
            cargarConteoEliminar(
                mesEliminar.getFullYear(),
                mesEliminar.getMonth() + 1,
                filtroTerapeutaCalendario
            );
        }
    }, [mesEliminar, filtroTerapeutaCalendario, showDeleteModal]);

    const handleEliminarTodasProgramaciones = async () => {
        setLoading(true);
        try {
            const params = {
                year: mesEliminar.getFullYear(),
                month: mesEliminar.getMonth() + 1,
                medico_id: filtroTerapeutaCalendario !== 'todos' ? filtroTerapeutaCalendario : undefined
            };
            const response = await axios.delete('/turnos/eliminar-todos', { params });
            if (response.data.success) {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                });
                Toast.fire({
                    icon: 'success',
                    title: response.data.message || 'Programaciones eliminadas exitosamente'
                });
                setShowDeleteModal(false);
                // Recargar calendario
                await cargarCalendario();
            }
        } catch (err) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            Toast.fire({
                icon: 'error',
                title: err.response?.data?.message || 'Error al eliminar las programaciones'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTurnoClick = (turno) => {
        setSelectedTurno(turno);
        setShowConfirmModal(true);
    };

    const handleConfirmarCita = async () => {
        if (!selectedPaciente || !selectedTurno) return;

        setLoading(true);
        try {
            const response = await axios.post('/citas/agendar', {
                turno_id: selectedTurno.id,
                paciente_id: selectedPaciente
            });

            if (response.data.success) {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Cita agendada exitosamente'
                });
                setShowConfirmModal(false);
                setSelectedTurno(null);

                // Recargar intervención y sesión primero para obtener los nuevos contadores
                const sesionData = await cargarIntervencionSesion(selectedPaciente);

                // Recargar turnos usando el nuevo número de sesión
                if (sesionData) {
                    await cargarTurnosDisponibles(selectedTerapeuta, sesionData.numero_sesion);
                }
            }
        } catch (err) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            Toast.fire({
                icon: 'error',
                title: err.response?.data?.message || 'Error al agendar la cita'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return '';
        // Asegurar que la fecha se interprete correctamente sin desfase de zona horaria
        const [year, month, day] = fechaStr.split('-');
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatearHora = (hora) => {
        if (!hora) return '';
        return hora.substring(0, 5);
    };

    const getPacienteNombre = (id) => {
        const p = pacientes.find(p => p.id == id);
        return p ? p.nombre_completo : '';
    };

    const getTerapeutaNombre = (id) => {
        const t = terapeutas.find(t => t.id == id);
        return t ? t.nombre_completo : '';
    };

    // Helper para verificar si un turno está agendado (maneja diferentes formatos)
    const estaAgendado = (turno) => {
        const agendado = turno.agendado;
        // Convertir cualquier formato a booleano
        if (agendado === null || agendado === undefined) return false;
        if (typeof agendado === 'boolean') return agendado;
        if (typeof agendado === 'number') return agendado === 1;
        if (typeof agendado === 'string') {
            return agendado === '1' || agendado === 'true' || agendado === 'True';
        }
        return false;
    };

    // Colores predefinidos para terapeutas (similar a la imagen)
    const coloresTerapeutas = [
        { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
        { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' },
        { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800' },
        { bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-800' },
        { bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-800' },
        { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800' },
        { bg: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-800' },
        { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800' },
        { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800' },
        { bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-800' },
    ];

    // Mapa para almacenar el color asignado a cada terapeuta
    const [coloresAsignados, setColoresAsignados] = useState({});

    const obtenerColorTerapeuta = (terapeutaNombre) => {
        if (!terapeutaNombre) return coloresTerapeutas[0];

        // Si ya tiene un color asignado, usarlo
        if (coloresAsignados[terapeutaNombre]) {
            return coloresAsignados[terapeutaNombre];
        }

        // Asignar un color basado en el hash del nombre para consistencia
        let hash = 0;
        for (let i = 0; i < terapeutaNombre.length; i++) {
            hash = terapeutaNombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % coloresTerapeutas.length;
        const color = coloresTerapeutas[index];

        // Guardar el color asignado
        setColoresAsignados(prev => ({
            ...prev,
            [terapeutaNombre]: color
        }));

        return color;
    };

    const handleVerDetalleDia = (fecha, turnos) => {
        setDetalleDia({ fecha, turnos });
        setFiltroTerapeutaModal('todos'); // Resetear filtro al abrir
        setShowDetalleDiaModal(true);
    };

    // Funciones Calendario
    const getDiasDelMes = () => {
        const year = mesActual.getFullYear();
        const month = mesActual.getMonth();
        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);
        const diasArray = [];
        const primerDiaSemana = primerDia.getDay(); // 0 = Domingo

        for (let i = 0; i < primerDiaSemana; i++) diasArray.push(null);
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) diasArray.push(new Date(year, month, dia));
        return diasArray;
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registro de Citas - Riesgo Moderado</h1>
                    <p className="text-gray-600">Agende citas para pacientes con nivel de riesgo moderado</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 bg-gray-100 p-1 rounded-full w-fit">
                    <button
                        onClick={() => setActiveTab('registrar')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'registrar'
                            ? 'bg-[#752568] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Registrar Cita
                    </button>
                    <button
                        onClick={() => setActiveTab('calendario')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'calendario'
                            ? 'bg-[#752568] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Calendario de Citas
                    </button>
                </div>

                {/* Mensajes */}


                {/* Content */}
                {activeTab === 'registrar' ? (
                    <div className="space-y-6">
                        {/* Formulario de Selección */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar className="w-5 h-5 text-[#752568]" />
                                <h2 className="text-lg font-bold text-[#752568]">Registrar Nueva Cita</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Agende una cita para pacientes de riesgo moderado</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Paciente (Serumista) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedPaciente}
                                        onChange={(e) => setSelectedPaciente(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-[#752568]"
                                    >
                                        <option value="">Seleccione paciente</option>
                                        {pacientes.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre_completo} - CMP: {p.cmp}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Terapeuta <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedTerapeuta}
                                        onChange={(e) => setSelectedTerapeuta(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-[#752568]"
                                    >
                                        <option value="">Seleccione terapeuta</option>
                                        {terapeutas.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {numeroIntervencion !== null && numeroSesion !== null ? (
                                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                    <div className="flex gap-8 items-center">
                                        <div className="text-sm text-orange-800">
                                            <span className="font-semibold">Nº Intervención:</span> {numeroIntervencion}
                                        </div>
                                        <div className="text-sm text-orange-800">
                                            <span className="font-semibold">Nº Sesión:</span> {numeroSesion}
                                        </div>
                                        {citaPendiente && citaPendiente.tipo !== 'limite' && (
                                            <div className="ml-auto">
                                                <span className="text-xs bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-medium">
                                                    Cita ya registrada
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                selectedPaciente && selectedTerapeuta && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-800">
                                                    No se puede agendar una nueva cita
                                                </p>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    La intervención actual ya tiene 4 sesiones completas. Debe finalizar la intervención en el <strong>Protocolo de Atención</strong> antes de poder agendar nuevas citas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Horarios Disponibles */}
                        {selectedTerapeuta && (
                            <div className="bg-white p-6 rounded-xl border border-yellow-200 shadow-sm ring-1 ring-yellow-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5 text-[#752568]" />
                                    <h2 className="text-lg font-bold text-[#752568]">
                                        Horarios Disponibles - {getTerapeutaNombre(selectedTerapeuta)}
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">Seleccione un horario disponible para la cita</p>

                                {citaPendiente ? (
                                    citaPendiente.tipo === 'limite' ? (
                                        // Mensaje cuando se alcanzó el límite de 4 sesiones
                                        <>
                                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <h3 className="text-sm font-medium text-blue-800">Intervención Completa</h3>
                                                        <div className="mt-2 text-sm text-blue-700">
                                                            <p>
                                                                {citaPendiente.mensaje}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mostrar la cita registrada si existe */}
                                            {citaPendiente.fecha && citaPendiente.hora_inicio && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h3 className="flex items-center gap-2 text-gray-700 font-medium">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatearFecha(citaPendiente.fecha)}
                                                            </h3>
                                                            <span className="text-xs bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-medium">
                                                                Cita Registrada
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                            <div className="flex flex-col items-center justify-center p-4 border-2 border-blue-400 bg-blue-50 rounded-lg shadow-sm">
                                                                <div className="flex items-center gap-1 mb-1">
                                                                    <Clock className="w-4 h-4 text-blue-700" />
                                                                    <span className="text-sm font-bold text-blue-900">
                                                                        {formatearHora(citaPendiente.hora_inicio)}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-blue-600">-</span>
                                                                <span className="text-xs text-blue-700 font-medium">
                                                                    {formatearHora(citaPendiente.hora_fin)}
                                                                </span>
                                                                <span className="text-xs text-blue-800 mt-2 font-semibold">
                                                                    Por Atender
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // Cuando hay cita pendiente: mostrar mensaje + cita registrada
                                        <>
                                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <h3 className="text-sm font-medium text-yellow-800">Cita Pendiente</h3>
                                                        <div className="mt-2 text-sm text-yellow-700">
                                                            <p>
                                                                El paciente ya tiene una cita programada. No se pueden agendar nuevas citas hasta que se atienda la actual.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mostrar la cita registrada */}
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className="flex items-center gap-2 text-gray-700 font-medium">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatearFecha(citaPendiente.fecha)}
                                                        </h3>
                                                        <span className="text-xs bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-medium">
                                                            Cita Registrada
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                        <div className="flex flex-col items-center justify-center p-4 border-2 border-yellow-400 bg-yellow-50 rounded-lg shadow-sm">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Clock className="w-4 h-4 text-yellow-700" />
                                                                <span className="text-sm font-bold text-yellow-900">
                                                                    {formatearHora(citaPendiente.hora_inicio)}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-yellow-600">-</span>
                                                            <span className="text-xs text-yellow-700 font-medium">
                                                                {formatearHora(citaPendiente.hora_fin)}
                                                            </span>
                                                            <span className="text-xs text-yellow-800 mt-2 font-semibold">
                                                                Por Atender
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )
                                ) : Object.keys(turnosDisponibles).length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No hay horarios disponibles para este terapeuta.</p>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.entries(turnosDisponibles).map(([fecha, turnos]) => (
                                            <div key={fecha}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="flex items-center gap-2 text-gray-700 font-medium">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatearFecha(fecha)}
                                                    </h3>
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                        {turnos.length} disponibles
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                    {turnos.map(turno => {
                                                        const isSelected = selectedTurno && selectedTurno.id === turno.id;
                                                        return (
                                                            <button
                                                                key={turno.id}
                                                                onClick={() => handleTurnoClick(turno)}
                                                                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all group ${isSelected
                                                                    ? 'border-[#752568] bg-[#752568] text-white shadow-md'
                                                                    : 'border-gray-200 bg-white hover:border-[#752568] hover:bg-purple-50'
                                                                    }`}
                                                            >
                                                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-800 group-hover:text-[#752568]'}`}>
                                                                    {turno.hora_inicio.substring(0, 5)}
                                                                </span>
                                                                <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>-</span>
                                                                <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                                                    {turno.hora_fin.substring(0, 5)}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // VISTA CALENDARIO MEJORADA
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-[#752568] flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Calendario de Citas Programadas
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium hidden"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar Todas las Programaciones
                                </button>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setMesActual(new Date(mesActual.setMonth(mesActual.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="font-medium min-w-[150px] text-center capitalize">
                                        {mesActual.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button onClick={() => setMesActual(new Date(mesActual.setMonth(mesActual.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filtros Calendario */}
                        <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Filtrar por Terapeuta</label>
                                <select
                                    value={filtroTerapeutaCalendario}
                                    onChange={(e) => setFiltroTerapeutaCalendario(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md p-2"
                                >
                                    <option value="todos">Todos los terapeutas</option>
                                    {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Filtrar por Paciente</label>
                                <select
                                    value={filtroPacienteCalendario}
                                    onChange={(e) => setFiltroPacienteCalendario(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md p-2"
                                >
                                    <option value="todos">Todos los pacientes</option>
                                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Mostrar Horarios</label>
                                <select
                                    value={filtroEstadoCalendario}
                                    onChange={(e) => setFiltroEstadoCalendario(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md p-2"
                                >
                                    <option value="todos">Todos</option>
                                    <option value="agendados">Solo Agendados</option>
                                    <option value="disponibles">Solo Disponibles</option>
                                </select>
                            </div>
                        </div>

                        {/* Grid Calendario */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Días de la semana */}
                            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                                    <div key={dia} className="px-2 py-4 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                        {dia}
                                    </div>
                                ))}
                            </div>

                            {/* Días del mes */}
                            <div className="grid grid-cols-7 bg-white">
                                {getDiasDelMes().map((fecha, index) => {
                                    if (!fecha) {
                                        return <div key={`empty-${index}`} className="border-r border-b border-gray-100 h-32 bg-gray-50/30"></div>;
                                    }

                                    const fechaStr = fecha.toISOString().split('T')[0];
                                    // Obtener turnos del día y eliminar duplicados por ID
                                    const turnosDiaRaw = citasCalendario[fechaStr] || [];
                                    const turnosDiaUnicos = turnosDiaRaw.filter((turno, index, self) =>
                                        index === self.findIndex(t => t.id === turno.id)
                                    );

                                    // Aplicar filtro de estado (agendados/disponibles)
                                    let turnosDia = turnosDiaUnicos;
                                    if (filtroEstadoCalendario === 'agendados') {
                                        turnosDia = turnosDiaUnicos.filter(t => estaAgendado(t));
                                    } else if (filtroEstadoCalendario === 'disponibles') {
                                        turnosDia = turnosDiaUnicos.filter(t => !estaAgendado(t));
                                    }

                                    const esHoy = fecha.toDateString() === new Date().toDateString();

                                    return (
                                        <div
                                            key={fecha.toString()}
                                            className={`border-r border-b border-gray-100 h-48 p-2 overflow-y-auto transition-colors hover:bg-gray-50 ${esHoy ? 'bg-purple-50/30' : ''}`}
                                        >
                                            <div className={`text-xs font-semibold mb-2 ${esHoy ? 'text-[#752568]' : 'text-gray-500'}`}>
                                                {fecha.getDate()}
                                            </div>
                                            <div className="space-y-1">
                                                {turnosDia.slice(0, 15).map((turno) => {
                                                    const colorTerapeuta = obtenerColorTerapeuta(turno.terapeuta);
                                                    const isAgendado = estaAgendado(turno) && turno.paciente_nombre;
                                                    return (
                                                        <div
                                                            key={turno.id}
                                                            className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${isAgendado
                                                                ? `${colorTerapeuta.bg} ${colorTerapeuta.text} ${colorTerapeuta.border}`
                                                                : 'bg-orange-50 text-orange-800 border border-orange-100'
                                                                }`}
                                                            title={`Hora: ${formatearHora(turno.hora_inicio)} - ${formatearHora(turno.hora_fin)}
Terapeuta: ${turno.terapeuta || 'No asignado'}
Paciente: ${turno.paciente_nombre || 'Sin asignar'}
Estado: ${isAgendado ? 'Agendado' : 'Disponible'}`}
                                                        >
                                                            <span className="font-medium">{formatearHora(turno.hora_inicio)}</span> {turno.terapeuta ? turno.terapeuta.split(' ')[0] : 'Sin terapeuta'}
                                                        </div>
                                                    );
                                                })}
                                                {turnosDia.length > 15 && (
                                                    <button
                                                        onClick={() => handleVerDetalleDia(fechaStr, turnosDia)}
                                                        className="text-[10px] text-[#752568] font-medium text-center w-full hover:underline cursor-pointer"
                                                    >
                                                        +{turnosDia.length - 15} más
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Leyenda y Estadísticas */}
                        <div className="mt-6 space-y-4">
                            {/* Leyenda */}
                            <div className="flex items-center justify-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                                    <span className="text-gray-600">Agendado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-50 border border-orange-100 rounded"></div>
                                    <span className="text-gray-600">Disponible</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border border-[#752568] bg-purple-50/30 rounded"></div>
                                    <span className="text-gray-600">Día actual</span>
                                </div>
                            </div>

                            {/* Estadísticas Totales */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Estadísticas del Mes</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                                            <span className="text-xs font-medium text-gray-600">Agendado</span>
                                        </div>
                                        <div className="text-2xl font-bold text-green-700">{estadisticasCalendario.agendados}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 bg-orange-50 border border-orange-100 rounded"></div>
                                            <span className="text-xs font-medium text-gray-600">Disponible</span>
                                        </div>
                                        <div className="text-2xl font-bold text-orange-700">{estadisticasCalendario.disponibles}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 border border-[#752568] bg-purple-50/30 rounded"></div>
                                            <span className="text-xs font-medium text-gray-600">Día actual</span>
                                        </div>
                                        <div className="text-2xl font-bold text-[#752568]">{estadisticasCalendario.dia_actual}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Agendados: {estadisticasCalendario.dia_actual_agendados} | Disponibles: {estadisticasCalendario.dia_actual_disponibles}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Confirmación */}
                {showConfirmModal && selectedTurno && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-[#752568]">Confirmar Cita</h3>
                                <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 text-sm">Revise los detalles de la cita antes de confirmar</p>

                                <div className="bg-purple-50 rounded-xl p-4 space-y-3 border border-purple-100">
                                    <div className="flex gap-3">
                                        <User className="w-5 h-5 text-[#752568] mt-0.5" />
                                        <div>
                                            <div className="text-xs text-gray-500">Paciente</div>
                                            <div className="font-medium text-gray-900">{getPacienteNombre(selectedPaciente)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <User className="w-5 h-5 text-[#752568] mt-0.5" />
                                        <div>
                                            <div className="text-xs text-gray-500">Terapeuta</div>
                                            <div className="font-medium text-gray-900">{getTerapeutaNombre(selectedTerapeuta)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Calendar className="w-5 h-5 text-[#752568] mt-0.5" />
                                        <div>
                                            <div className="text-xs text-gray-500">Fecha</div>
                                            <div className="font-medium text-gray-900">{formatearFecha(selectedTurno.fecha)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Clock className="w-5 h-5 text-[#752568] mt-0.5" />
                                        <div>
                                            <div className="text-xs text-gray-500">Horario</div>
                                            <div className="font-medium text-gray-900">
                                                {selectedTurno.hora_inicio.substring(0, 5)} - {selectedTurno.hora_fin.substring(0, 5)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-center pt-2 border-t border-purple-200/50">
                                        <Video className="w-4 h-4 text-[#752568]" />
                                        <span className="text-xs text-[#752568] font-medium">Se generará un enlace de Teams automáticamente</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmarCita}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-[#752568] text-white rounded-lg hover:bg-[#5a1d4f] font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Confirmando...' : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Confirmar Cita
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Confirmación Eliminar Programaciones */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Confirmar Eliminación
                                </h3>
                                <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-gray-700">
                                    Seleccione el período y confirme para eliminar <strong>todas las programaciones disponibles</strong>.
                                </p>

                                {/* Selectores de Año y Mes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Año <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={mesEliminar.getFullYear()}
                                            onChange={(e) => {
                                                const nuevoAnio = parseInt(e.target.value);
                                                const nuevaFecha = new Date(mesEliminar);
                                                nuevaFecha.setFullYear(nuevoAnio);
                                                setMesEliminar(nuevaFecha);
                                            }}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        >
                                            {Array.from({ length: 10 }, (_, i) => {
                                                const anio = new Date().getFullYear() - 2 + i;
                                                return (
                                                    <option key={anio} value={anio}>{anio}</option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mes <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={mesEliminar.getMonth()}
                                            onChange={(e) => {
                                                const nuevoMes = parseInt(e.target.value);
                                                const nuevaFecha = new Date(mesEliminar);
                                                nuevaFecha.setMonth(nuevoMes);
                                                setMesEliminar(nuevaFecha);
                                            }}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        >
                                            {[
                                                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                                            ].map((mes, index) => (
                                                <option key={index} value={index}>{mes}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Conteo de Programaciones */}
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">Programaciones disponibles a eliminar:</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                {filtroTerapeutaCalendario !== 'todos' && (
                                                    <>Terapeuta: {getTerapeutaNombre(filtroTerapeutaCalendario)} • </>
                                                )}
                                                {mesEliminar.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        {loadingConteo ? (
                                            <div className="text-blue-600 text-sm">Cargando...</div>
                                        ) : (
                                            <div className="text-3xl font-bold text-blue-700">
                                                {conteoEliminar}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div className="text-sm text-red-800">
                                            <p className="font-semibold mb-1">Advertencia:</p>
                                            <p>Esta acción eliminará únicamente los turnos que <strong>NO</strong> tienen citas agendadas. Las citas ya programadas no se verán afectadas.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEliminarTodasProgramaciones}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Eliminando...' : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Programaciones
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Detalle del Día */}
                {showDetalleDiaModal && detalleDia.fecha && (() => {
                    // Filtrar turnos según el terapeuta seleccionado
                    const turnosFiltrados = filtroTerapeutaModal === 'todos'
                        ? detalleDia.turnos
                        : detalleDia.turnos.filter(turno => {
                            // Buscar por ID del terapeuta o por nombre
                            if (turno.medico_id) {
                                return turno.medico_id.toString() === filtroTerapeutaModal.toString();
                            }
                            // Si no hay ID, buscar por nombre
                            const terapeuta = terapeutas.find(t => t.id.toString() === filtroTerapeutaModal.toString());
                            return terapeuta && turno.terapeuta === terapeuta.nombre_completo;
                        });

                    return (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#752568] flex items-center gap-2">
                                                <Calendar className="w-5 h-5" />
                                                Detalle del Día
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {formatearFecha(detalleDia.fecha)} - {turnosFiltrados.length} {turnosFiltrados.length === 1 ? 'cita' : 'citas'}
                                                {filtroTerapeutaModal !== 'todos' && (
                                                    <span className="text-gray-500"> (de {detalleDia.turnos.length} total)</span>
                                                )}
                                            </p>
                                        </div>
                                        <button onClick={() => setShowDetalleDiaModal(false)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Filtro de Terapeuta */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filtrar por Terapeuta
                                        </label>
                                        <select
                                            value={filtroTerapeutaModal}
                                            onChange={(e) => setFiltroTerapeutaModal(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-[#752568]"
                                        >
                                            <option value="todos">Todos los terapeutas</option>
                                            {terapeutas.map(t => (
                                                <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1">
                                    {turnosFiltrados.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">
                                            {filtroTerapeutaModal !== 'todos'
                                                ? 'No hay citas para el terapeuta seleccionado en este día.'
                                                : 'No hay citas programadas para este día.'}
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {turnosFiltrados
                                                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                                                .map((turno) => {
                                                    const colorTerapeuta = obtenerColorTerapeuta(turno.terapeuta);
                                                    // Fix: Only consider agendado if there is a patient assigned
                                                    const isAgendado = estaAgendado(turno) && turno.paciente_nombre;

                                                    return (
                                                        <div
                                                            key={turno.id}
                                                            className={`p-3 rounded-lg border ${isAgendado
                                                                ? `${colorTerapeuta.bg} ${colorTerapeuta.border} border-2`
                                                                : 'bg-orange-50 border border-orange-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Clock className={`w-4 h-4 ${isAgendado ? colorTerapeuta.text : 'text-orange-700'}`} />
                                                                        <span className={`font-semibold ${isAgendado ? colorTerapeuta.text : 'text-orange-800'}`}>
                                                                            {formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        {turno.terapeuta && (
                                                                            <div className="flex items-center gap-2">
                                                                                <User className={`w-4 h-4 ${isAgendado ? colorTerapeuta.text : 'text-orange-700'}`} />
                                                                                <div>
                                                                                    <span className={`text-xs font-medium ${isAgendado ? colorTerapeuta.text : 'text-orange-700'}`}>
                                                                                        Terapeuta:
                                                                                    </span>
                                                                                    <span className={`text-sm ml-1 ${isAgendado ? colorTerapeuta.text : 'text-orange-800'}`}>
                                                                                        {turno.terapeuta}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {turno.paciente_nombre ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <User className={`w-4 h-4 ${isAgendado ? colorTerapeuta.text : 'text-orange-700'}`} />
                                                                                <div>
                                                                                    <span className={`text-xs font-medium ${isAgendado ? colorTerapeuta.text : 'text-orange-700'}`}>
                                                                                        Paciente:
                                                                                    </span>
                                                                                    <span className={`text-sm ml-1 font-semibold ${isAgendado ? colorTerapeuta.text : 'text-orange-800'}`}>
                                                                                        {turno.paciente_nombre}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`text-xs italic ${isAgendado ? colorTerapeuta.text : 'text-orange-600'}`}>
                                                                                    Sin paciente asignado
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${isAgendado
                                                                        ? 'bg-green-600 text-white'
                                                                        : 'bg-orange-200 text-orange-800'
                                                                        }`}>
                                                                        {isAgendado ? 'Agendado' : 'SIN AGENDAR'}
                                                                    </div>
                                                                    {isAgendado && turno.video_enlace && (
                                                                        <a
                                                                            href={turno.video_enlace}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                                                                            title="Unirse a reunión de Teams"
                                                                        >
                                                                            <Video className="w-4 h-4 text-[#6264A7]" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-gray-50 border-t border-gray-200">
                                    <button
                                        onClick={() => setShowDetalleDiaModal(false)}
                                        className="w-full px-4 py-2.5 bg-[#752568] text-white rounded-lg hover:bg-[#5a1d4f] font-medium transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </MainLayout >
    );
};

export default CitasRiesgoPage;
