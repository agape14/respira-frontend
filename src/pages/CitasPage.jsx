import { useState, useEffect } from 'react';
import axios from '../api/axios';
import MainLayout from '../components/layouts/MainLayout';
import Swal from 'sweetalert2';
import {
    Calendar,
    Clock,
    User,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Filter,
    Search,
    X,
    Video,
    Edit
} from 'lucide-react';

const CitasPage = () => {
    const [activeTab, setActiveTab] = useState('programar'); // programar, disponibilidad, calendario
    const [loading, setLoading] = useState(false);

    // Estados para Programar Turnos
    const [terapeutas, setTerapeutas] = useState([]);
    const [formData, setFormData] = useState({
        medico_id: '',
        tiempo_sesion: '',
        fecha_inicio: '',
        fecha_fin: '',
        dias_horarios: []
    });

    // Estados para Disponibilidad Horaria
    const [turnos, setTurnos] = useState([]);
    const [filtros, setFiltros] = useState({
        medico_id: '',
        dia: '',
        duracion: '',
        estado: '',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [paginacion, setPaginacion] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0
    });

    // Estados para Calendario
    const [calendarioData, setCalendarioData] = useState({});
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        agendados: 0,
        disponibles: 0
    });
    const [mesActual, setMesActual] = useState(new Date());
    const [terapeutaSeleccionado, setTerapeutaSeleccionado] = useState('todos');
    const [showDetalleDiaModal, setShowDetalleDiaModal] = useState(false);
    const [detalleDia, setDetalleDia] = useState({ fecha: null, turnos: [] });
    const [filtroTerapeutaModal, setFiltroTerapeutaModal] = useState('todos');
    const [coloresAsignados, setColoresAsignados] = useState({});
    
    // Estados para modal de actualizar enlace
    const [showModalActualizarEnlace, setShowModalActualizarEnlace] = useState(false);
    const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
    const [nuevoEnlace, setNuevoEnlace] = useState('');

    // Colores predefinidos para terapeutas
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

    // Días de la semana
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Cargar terapeutas al montar el componente
    useEffect(() => {
        cargarTerapeutas();
    }, []);

    // Cargar datos según la pestaña activa
    useEffect(() => {
        if (activeTab === 'disponibilidad') {
            cargarTurnos();
        } else if (activeTab === 'calendario') {
            cargarCalendario();
        }
    }, [activeTab]);

    // Auto-search when filters change in disponibilidad tab
    useEffect(() => {
        if (activeTab === 'disponibilidad') {
            cargarTurnos(1); // Reset to page 1 when filters change
        }
    }, [filtros.medico_id, filtros.dia, filtros.duracion, filtros.estado, filtros.fecha_inicio, filtros.fecha_fin]);

    const cargarTerapeutas = async () => {
        try {
            const response = await axios.get('/terapeutas');
            if (response.data.success) {
                setTerapeutas(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar terapeutas:', err);
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
                title: 'Error al cargar terapeutas'
            });
        }
    };

    const cargarTurnos = async (pagina = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagina,
                per_page: paginacion.per_page,
                ...Object.fromEntries(
                    Object.entries(filtros).filter(([, v]) => v !== '')
                )
            });

            const response = await axios.get(`/turnos?${params}`);
            if (response.data.success) {
                setTurnos(response.data.data);
                setPaginacion({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total
                });
            }
        } catch (err) {
            console.error(err);
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
                title: 'Error al cargar los turnos'
            });
        } finally {
            setLoading(false);
        }
    };
    const cargarCalendario = async () => {
        setLoading(true);
        try {
            const params = {
                year: mesActual.getFullYear(),
                month: mesActual.getMonth() + 1,
                medico_id: terapeutaSeleccionado
            };

            const response = await axios.get('/turnos/calendario', { params });
            if (response.data.success) {
                setCalendarioData(response.data.data);
                setEstadisticas(response.data.estadisticas);
            }
        } catch (err) {
            console.error(err);
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
    const handleProgramarTurnos = async (e) => {
        e.preventDefault();
        setLoading(true);


        try {
            const response = await axios.post('/turnos/programar', formData);
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
                    title: `Turnos programados exitosamente. Se crearon ${response.data.data.turnos_creados} turnos.`
                });

                // Limpiar formulario
                setFormData({
                    medico_id: '',
                    tiempo_sesion: '',
                    fecha_inicio: '',
                    fecha_fin: '',
                    dias_horarios: []
                });
                // Cambiar a la pestaña de disponibilidad
                setTimeout(() => {
                    setActiveTab('disponibilidad');
                }, 2000);
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
                title: err.response?.data?.message || 'Error al programar turnos'
            });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarTurno = async (turno) => {
        const result = await Swal.fire({
            title: '¿Eliminar turno?',
            html: `
                <p class="mb-4">¿Está seguro de eliminar este turno? Esta acción no se puede deshacer.</p>
                <div class="text-left bg-gray-50 p-4 rounded-lg text-sm border border-gray-200">
                    <p class="mb-1"><strong>Terapeuta:</strong> ${turno.terapeuta}</p>
                    <p class="mb-1"><strong>Fecha:</strong> ${formatearFecha(turno.fecha)}</p>
                    <p class="mb-1"><strong>Día:</strong> ${obtenerNombreDia(turno.dia)}</p>
                    <p class="mb-1"><strong>Hora Inicio:</strong> ${formatearHora(turno.hora_inicio)}</p>
                    <p class="mb-0"><strong>Hora Fin:</strong> ${formatearHora(turno.hora_fin)}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#752568',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            const response = await axios.delete(`/turnos/${turno.id}`);
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
                    title: 'El turno ha sido eliminado exitosamente.'
                });
                cargarTurnos(paginacion.current_page);
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
                title: err.response?.data?.message || 'Error al eliminar el turno'
            });
        }
    };

    const handleEliminarTodasProgramaciones = async () => {
        const result = await Swal.fire({
            title: '¿Eliminar programación del mes?',
            text: "Se eliminarán todos los turnos DISPONIBLES de este mes. Los turnos agendados no se verán afectados.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#752568',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar todo',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        setLoading(true);
        try {
            const params = {
                year: mesActual.getFullYear(),
                month: mesActual.getMonth() + 1,
                medico_id: terapeutaSeleccionado
            };

            const response = await axios.delete('/turnos/eliminar-mes', { params });

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
                    title: response.data.message
                });
                cargarCalendario();
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
                title: err.response?.data?.message || 'Error al eliminar la programación'
            });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const agregarDiaHorario = (dia) => {
        const nuevoDia = {
            dia: dia,
            horarios: [{ hora_inicio: '08:00', hora_fin: '17:00' }]
        };
        setFormData({
            ...formData,
            dias_horarios: [...formData.dias_horarios, nuevoDia]
        });
    };

    const quitarDiaHorario = (index) => {
        const nuevosDias = formData.dias_horarios.filter((_, i) => i !== index);
        setFormData({ ...formData, dias_horarios: nuevosDias });
    };

    const actualizarHorarioDia = (diaIndex, horarioIndex, campo, valor) => {
        const nuevosDias = [...formData.dias_horarios];
        nuevosDias[diaIndex].horarios[horarioIndex][campo] = valor;
        setFormData({ ...formData, dias_horarios: nuevosDias });
    };

    const getDiasDelMes = () => {
        const year = mesActual.getFullYear();
        const month = mesActual.getMonth();
        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);

        const diasArray = [];
        const primerDiaSemana = primerDia.getDay();

        // Agregar días vacíos antes del primer día del mes
        for (let i = 0; i < primerDiaSemana; i++) {
            diasArray.push(null);
        }

        // Agregar los días del mes
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            diasArray.push(new Date(year, month, dia));
        }

        return diasArray;
    };

    const cambiarMes = (direccion) => {
        const nuevaFecha = new Date(mesActual);
        nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
        setMesActual(nuevaFecha);
    };

    const irAHoy = () => {
        setMesActual(new Date());
    };

    // Helper functions to format dates and times without timezone offset
    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return '';
        // Parse as local date to avoid timezone offset
        const [year, month, day] = fechaStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatearHora = (horaStr) => {
        if (!horaStr) return '';
        // Extract HH:mm from time string (handles both HH:mm:ss and HH:mm:ss.0000000 formats)
        return horaStr.substring(0, 5);
    };

    const obtenerNombreDia = (numeroDia) => {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return dias[parseInt(numeroDia)] || numeroDia;
    };

    const obtenerColorTerapeuta = (terapeutaNombre) => {
        if (!terapeutaNombre) return coloresTerapeutas[0];

        if (coloresAsignados[terapeutaNombre]) {
            return coloresAsignados[terapeutaNombre];
        }

        let hash = 0;
        for (let i = 0; i < terapeutaNombre.length; i++) {
            hash = terapeutaNombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % coloresTerapeutas.length;
        const color = coloresTerapeutas[index];

        setColoresAsignados(prev => ({
            ...prev,
            [terapeutaNombre]: color
        }));

        return color;
    };

    const handleVerDetalleDia = (fecha, turnos) => {
        setDetalleDia({ fecha, turnos });
        setFiltroTerapeutaModal('todos');
        setShowDetalleDiaModal(true);
    };

    const handleAbrirModalActualizarEnlace = (turno) => {
        setTurnoSeleccionado(turno);
        setNuevoEnlace(turno.video_enlace || '');
        setShowModalActualizarEnlace(true);
    };

    const handleActualizarEnlace = async () => {
        if (!nuevoEnlace.trim()) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'error',
                title: 'Debe ingresar un enlace válido'
            });
            return;
        }

        // Validar que el turno tenga cita_id
        if (!turnoSeleccionado.cita_id) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'error',
                title: 'No se pudo identificar la cita asociada al turno'
            });
            return;
        }

        try {
            // Actualizar el enlace usando el cita_id que ya viene en la respuesta del turno
            const updateResponse = await axios.put(`/citas/${turnoSeleccionado.cita_id}/video-enlace`, {
                video_enlace: nuevoEnlace
            });

            if (updateResponse.data.success) {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Enlace actualizado exitosamente'
                });

                // Cerrar modal y recargar datos
                setShowModalActualizarEnlace(false);
                setTurnoSeleccionado(null);
                setNuevoEnlace('');
                cargarTurnos(paginacion.current_page);
            }
        } catch (err) {
            console.error('Error al actualizar enlace:', err);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'error',
                title: err.response?.data?.message || 'Error al actualizar el enlace'
            });
        }
    };

    useEffect(() => {
        if (activeTab === 'calendario') {
            cargarCalendario();
        }
    }, [mesActual, terapeutaSeleccionado]);

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Programar Turnos de Atención
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Configure los horarios disponibles para las citas con terapeutas
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center md:justify-start">
                    <div className="bg-gray-100 p-1 rounded-full inline-flex">
                        <button
                            onClick={() => setActiveTab('programar')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'programar'
                                ? 'bg-[#752568] text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Programar Turnos
                        </button>
                        <button
                            onClick={() => setActiveTab('disponibilidad')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'disponibilidad'
                                ? 'bg-[#752568] text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Disponibilidad horaria
                        </button>
                        <button
                            onClick={() => setActiveTab('calendario')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'calendario'
                                ? 'bg-[#752568] text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Vista Calendario
                        </button>
                    </div>
                </div>

                {/* Contenido de las pestañas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* Pestaña 1: Programar Turnos */}
                    {activeTab === 'programar' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <Calendar className="w-6 h-6 text-[#752568]" />
                                <div>
                                    <h2 className="text-xl font-bold text-[#752568]">
                                        Programar Turnos de Terapia
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Configure los horarios disponibles para cada terapeuta
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleProgramarTurnos} className="space-y-8">
                                {/* Fila 1: Terapeuta, Tiempo de Sesión, Rango de Fechas */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Terapeuta <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.medico_id}
                                            onChange={(e) => setFormData({ ...formData, medico_id: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent bg-white"
                                        >
                                            <option value="">Seleccione un terapeuta</option>
                                            {terapeutas.map((terapeuta) => (
                                                <option key={terapeuta.id} value={terapeuta.id}>
                                                    {terapeuta.nombre_completo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tiempo de Sesión <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.tiempo_sesion}
                                            onChange={(e) => setFormData({ ...formData, tiempo_sesion: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent bg-white"
                                        >
                                            <option value="">Seleccione la duración</option>
                                            <option value="30">30 minutos</option>
                                            <option value="60">60 minutos</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rango de Fechas <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                required
                                                value={formData.fecha_inicio}
                                                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent"
                                                placeholder="Desde"
                                            />
                                            <input
                                                type="date"
                                                required
                                                value={formData.fecha_fin}
                                                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent"
                                                placeholder="Hasta"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Días y Horarios */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Días y Horarios <span className="text-red-500">*</span>
                                    </label>

                                    <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                                        {diasSemana.map((dia) => {
                                            const diaSeleccionado = formData.dias_horarios.find(d => d.dia === dia);
                                            const diaIndex = formData.dias_horarios.findIndex(d => d.dia === dia);

                                            return (
                                                <div key={dia} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                    <div className="flex items-center w-40">
                                                        <input
                                                            type="checkbox"
                                                            id={dia}
                                                            checked={!!diaSeleccionado}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    agregarDiaHorario(dia);
                                                                } else {
                                                                    quitarDiaHorario(diaIndex);
                                                                }
                                                            }}
                                                            className="w-5 h-5 text-[#752568] border-gray-300 rounded focus:ring-[#752568]"
                                                        />
                                                        <label htmlFor={dia} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                                            {dia}
                                                        </label>
                                                    </div>

                                                    {diaSeleccionado ? (
                                                        <div className="flex-1 flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-500">Desde:</span>
                                                                <input
                                                                    type="time"
                                                                    value={diaSeleccionado.horarios[0].hora_inicio}
                                                                    onChange={(e) => actualizarHorarioDia(diaIndex, 0, 'hora_inicio', e.target.value)}
                                                                    className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#752568] focus:border-transparent text-sm"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-500">Hasta:</span>
                                                                <input
                                                                    type="time"
                                                                    value={diaSeleccionado.horarios[0].hora_fin}
                                                                    onChange={(e) => actualizarHorarioDia(diaIndex, 0, 'hora_fin', e.target.value)}
                                                                    className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#752568] focus:border-transparent text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 h-8"></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Botón de envío */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 px-8 py-3 bg-[#752568] text-white rounded-lg hover:bg-[#5a1d4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        {loading ? 'Programando...' : 'Programar Turnos'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Pestaña 2: Disponibilidad Horaria */}
                    {activeTab === 'disponibilidad' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-[#752568] mb-2">
                                    Disponibilidad horaria
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Lista de todos los turnos configurados por terapeuta
                                </p>
                            </div>

                            {/* Filtros */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Filter className="w-4 h-4 text-[#752568]" />
                                    <h3 className="font-semibold text-gray-900 text-sm">Filtros</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Terapeuta</label>
                                        <select
                                            value={filtros.medico_id}
                                            onChange={(e) => setFiltros({ ...filtros, medico_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568]"
                                        >
                                            <option value="">Todos</option>
                                            {terapeutas.map((t) => (
                                                <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Día</label>
                                        <select
                                            value={filtros.dia}
                                            onChange={(e) => setFiltros({ ...filtros, dia: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568]"
                                        >
                                            <option value="">Todos</option>
                                            {diasSemana.map((dia) => (
                                                <option key={dia} value={dia}>{dia}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Duración</label>
                                        <select
                                            value={filtros.duracion}
                                            onChange={(e) => setFiltros({ ...filtros, duracion: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568]"
                                        >
                                            <option value="">Todas</option>
                                            <option value="30">30 min</option>
                                            <option value="60">60 min</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                                        <select
                                            value={filtros.estado}
                                            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568]"
                                        >
                                            <option value="">Todos</option>
                                            <option value="disponible">Disponible</option>
                                            <option value="agendado">Agendado</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Inicio</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={filtros.fecha_inicio}
                                                onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Fin</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={filtros.fecha_fin}
                                                onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#752568] focus:border-[#752568]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Información de paginación */}
                            <div className="text-sm text-gray-500 mb-4">
                                Mostrando {((paginacion.current_page - 1) * paginacion.per_page) + 1} - {Math.min(paginacion.current_page * paginacion.per_page, paginacion.total)} de {paginacion.total} turnos
                            </div>

                            {/* Tabla */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#752568]"></div>
                                    <p className="mt-2 text-gray-600">Cargando turnos...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-purple-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Terapeuta
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Fecha
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Día
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Duración
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Horario Inicio
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Horario Fin
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Agendado
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Reunión Virtual
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-[#752568] uppercase tracking-wider">
                                                        Acciones
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {turnos.map((turno) => (
                                                    <tr key={turno.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {turno.terapeuta}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatearFecha(turno.fecha)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-purple-100 text-purple-800">
                                                                {obtenerNombreDia(turno.dia)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-orange-100 text-orange-800">
                                                                {turno.duracion} min
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatearHora(turno.hora_inicio)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatearHora(turno.hora_fin)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="relative group inline-block">
                                                                <span
                                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full cursor-help ${parseInt(turno.agendado) === 1
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-gray-100 text-gray-600'
                                                                        }`}
                                                                >
                                                                    {parseInt(turno.agendado) === 1 ? 'Si' : 'No'}
                                                                </span>

                                                                {parseInt(turno.agendado) === 1 && (
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-max max-w-[200px]">
                                                                        <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl text-center">
                                                                            <div className="font-bold text-purple-200 mb-1 border-b border-gray-600 pb-1">Paciente Agendado</div>
                                                                            <div className="whitespace-normal">{turno.paciente || 'Desconocido'}</div>
                                                                            {/* Arrow */}
                                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {turno.video_enlace ? (
                                                                <a
                                                                    href={turno.video_enlace}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[#6264A7] hover:underline font-medium text-sm"
                                                                >
                                                                    <Video className="w-4 h-4" />
                                                                    Unirse a Teams
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {parseInt(turno.agendado) === 1 && (
                                                                    <button
                                                                        onClick={() => handleAbrirModalActualizarEnlace(turno)}
                                                                        className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                                                        title="Actualizar enlace de reunión virtual"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {parseInt(turno.agendado) === 0 && (
                                                                    <button
                                                                        onClick={() => handleEliminarTurno(turno)}
                                                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                                        title="Eliminar turno"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Paginación */}
                                    {paginacion.last_page > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-6">
                                            <button
                                                onClick={() => cargarTurnos(paginacion.current_page - 1)}
                                                disabled={paginacion.current_page === 1}
                                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                            >
                                                <ChevronLeft className="w-4 h-4" /> Anterior
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {[...Array(paginacion.last_page)].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    if (
                                                        pageNum === 1 ||
                                                        pageNum === paginacion.last_page ||
                                                        (pageNum >= paginacion.current_page - 1 && pageNum <= paginacion.current_page + 1)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => cargarTurnos(pageNum)}
                                                                className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors ${pageNum === paginacion.current_page
                                                                    ? 'bg-white border border-gray-300 font-semibold text-gray-900 shadow-sm'
                                                                    : 'text-gray-600 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    } else if (
                                                        pageNum === paginacion.current_page - 2 ||
                                                        pageNum === paginacion.current_page + 2
                                                    ) {
                                                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                                    }
                                                    return null;
                                                })}
                                            </div>

                                            <button
                                                onClick={() => cargarTurnos(paginacion.current_page + 1)}
                                                disabled={paginacion.current_page === paginacion.last_page}
                                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                            >
                                                Siguiente <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Pestaña 3: Vista Calendario */}
                    {activeTab === 'calendario' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-[#752568] mb-2">
                                    Vista Calendario
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Visualice la disponibilidad horaria en formato de calendario
                                </p>
                            </div>

                            {/* Filtro de terapeuta y controles */}
                            <div className="mb-6 space-y-4">
                                {/* Filtro de terapeuta */}
                                <div className="w-full md:w-64">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Terapeuta:
                                    </label>
                                    <select
                                        value={terapeutaSeleccionado}
                                        onChange={(e) => setTerapeutaSeleccionado(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent bg-gray-50"
                                    >
                                        <option value="todos">Todos</option>
                                        {terapeutas.map((t) => (
                                            <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Controles de navegación del calendario */}
                                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                                    <button
                                        onClick={handleEliminarTodasProgramaciones}
                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 border border-red-200 hidden"
                                        title="Eliminar programación del mes"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="hidden md:inline">Eliminar Mes</span>
                                    </button>
                                    <button
                                        onClick={() => cambiarMes(-1)}
                                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1 border border-gray-200 text-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span className="hidden sm:inline">Anterior</span>
                                    </button>

                                    <div className="px-3 md:px-4 py-2 font-semibold text-gray-900 text-sm md:text-base text-center">
                                        {mesActual.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() +
                                            mesActual.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).slice(1)}
                                    </div>

                                    <button
                                        onClick={() => cambiarMes(1)}
                                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1 border border-gray-200 text-sm"
                                    >
                                        <span className="hidden sm:inline">Siguiente</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={irAHoy}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                                    >
                                        Hoy
                                    </button>
                                </div>
                            </div>

                            {/* Calendario */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#752568]"></div>
                                    <p className="mt-2 text-gray-600">Cargando calendario...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Vista Grid para Desktop */}
                                    <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                                                const turnosDia = calendarioData[fechaStr] || [];
                                                const esHoy = fecha.toDateString() === new Date().toDateString();

                                                return (
                                                    <div
                                                        key={fecha.toString()}
                                                        className={`border-r border-b border-gray-100 h-32 p-2 overflow-y-auto transition-colors hover:bg-gray-50 ${esHoy ? 'bg-purple-50/30' : ''
                                                            }`}
                                                    >
                                                        <div className={`text-xs font-semibold mb-2 ${esHoy ? 'text-[#752568]' : 'text-gray-500'}`}>
                                                            {fecha.getDate()}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {turnosDia.slice(0, 5).map((turno) => {
                                                                const colorTerapeuta = obtenerColorTerapeuta(turno.terapeuta);
                                                                return (
                                                                    <div
                                                                        key={turno.id}
                                                                        className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center justify-between gap-1 ${parseInt(turno.agendado) === 1
                                                                            ? `${colorTerapeuta.bg} ${colorTerapeuta.text} ${colorTerapeuta.border}`
                                                                            : 'bg-orange-50 text-orange-800 border border-orange-100'
                                                                            }`}
                                                                        title={`${turno.terapeuta} - ${formatearHora(turno.hora_inicio)}`}
                                                                    >
                                                                        <span className="truncate">
                                                                            <span className="font-medium">{formatearHora(turno.hora_inicio)}</span> {turno.terapeuta.split(' ')[0]}
                                                                        </span>
                                                                        {turno.video_enlace && (
                                                                            <a
                                                                                href={turno.video_enlace}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="flex-shrink-0 hover:opacity-70"
                                                                                title="Abrir enlace de reunión virtual"
                                                                            >
                                                                                <Video className="w-2.5 h-2.5" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            {turnosDia.length > 5 && (
                                                                <button
                                                                    onClick={() => handleVerDetalleDia(fechaStr, turnosDia)}
                                                                    className="text-[10px] text-[#752568] font-medium text-center w-full hover:underline cursor-pointer"
                                                                >
                                                                    +{turnosDia.length - 5} más
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Vista Vertical para Móviles */}
                                    <div className="md:hidden space-y-3">
                                        {getDiasDelMes().filter(fecha => fecha !== null).map((fecha) => {
                                            const fechaStr = fecha.toISOString().split('T')[0];
                                            const turnosDia = calendarioData[fechaStr] || [];
                                            const esHoy = fecha.toDateString() === new Date().toDateString();
                                            const nombreDia = fecha.toLocaleDateString('es-PE', { weekday: 'short' }).charAt(0).toUpperCase() + 
                                                            fecha.toLocaleDateString('es-PE', { weekday: 'short' }).slice(1);

                                            // Solo mostrar días que tienen turnos o el día actual
                                            if (turnosDia.length === 0 && !esHoy) return null;

                                            return (
                                                <div
                                                    key={fecha.toString()}
                                                    className={`border rounded-lg overflow-hidden shadow-sm ${
                                                        esHoy ? 'border-[#752568] border-2 bg-purple-50/30' : 'border-gray-200 bg-white'
                                                    }`}
                                                >
                                                    {/* Encabezado del día */}
                                                    <div className={`flex items-center justify-between px-4 py-3 border-b ${
                                                        esHoy ? 'bg-purple-100 border-purple-200' : 'bg-gray-50 border-gray-200'
                                                    }`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-2xl font-bold ${esHoy ? 'text-[#752568]' : 'text-gray-700'}`}>
                                                                {fecha.getDate()}
                                                            </div>
                                                            <div>
                                                                <div className={`text-sm font-semibold ${esHoy ? 'text-[#752568]' : 'text-gray-700'}`}>
                                                                    {nombreDia}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`text-xs font-medium px-2 py-1 rounded ${
                                                            esHoy ? 'bg-[#752568] text-white' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                            {turnosDia.length} {turnosDia.length === 1 ? 'turno' : 'turnos'}
                                                        </div>
                                                    </div>

                                                    {/* Lista de turnos */}
                                                    {turnosDia.length > 0 ? (
                                                        <div className="p-3 space-y-2">
                                                            {turnosDia.map((turno) => {
                                                                const colorTerapeuta = obtenerColorTerapeuta(turno.terapeuta);
                                                                const isAgendado = parseInt(turno.agendado) === 1;
                                                                return (
                                                                    <div
                                                                        key={turno.id}
                                                                        className={`p-3 rounded-lg border ${
                                                                            isAgendado
                                                                                ? `${colorTerapeuta.bg} ${colorTerapeuta.border} border-2`
                                                                                : 'bg-orange-50 border border-orange-200'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                <Clock className={`w-4 h-4 flex-shrink-0 ${
                                                                                    isAgendado ? colorTerapeuta.text : 'text-orange-700'
                                                                                }`} />
                                                                                <span className={`font-semibold text-sm ${
                                                                                    isAgendado ? colorTerapeuta.text : 'text-orange-800'
                                                                                }`}>
                                                                                    {formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {turno.video_enlace && (
                                                                                    <a
                                                                                        href={turno.video_enlace}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className={`p-1.5 rounded-full ${
                                                                                            isAgendado ? 'bg-white/80' : 'bg-orange-100'
                                                                                        } hover:opacity-70 transition-opacity`}
                                                                                        title="Abrir enlace de reunión virtual"
                                                                                    >
                                                                                        <Video className="w-4 h-4 text-[#752568]" />
                                                                                    </a>
                                                                                )}
                                                                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                                                                    isAgendado ? 'bg-green-600 text-white' : 'bg-orange-200 text-orange-800'
                                                                                }`}>
                                                                                    {isAgendado ? 'Agendado' : 'Disponible'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-2 flex items-center gap-2">
                                                                            <User className={`w-3.5 h-3.5 ${
                                                                                isAgendado ? colorTerapeuta.text : 'text-orange-700'
                                                                            }`} />
                                                                            <span className={`text-sm ${
                                                                                isAgendado ? colorTerapeuta.text : 'text-orange-800'
                                                                            }`}>
                                                                                {turno.terapeuta}
                                                                            </span>
                                                                        </div>
                                                                        {isAgendado && turno.paciente && (
                                                                            <div className="mt-1 flex items-center gap-2 ml-5">
                                                                                <span className={`text-xs ${colorTerapeuta.text}`}>
                                                                                    Paciente: <span className="font-semibold">{turno.paciente}</span>
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="p-6 text-center text-gray-500 text-sm">
                                                            No hay turnos programados
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Leyenda y Estadísticas */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-[#752568]">{estadisticas.total}</p>
                                            <p className="text-sm text-purple-700">Total de turnos</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-green-600">{estadisticas.agendados}</p>
                                            <p className="text-sm text-green-700">Agendados</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-orange-600">{estadisticas.disponibles}</p>
                                            <p className="text-sm text-orange-700">Disponibles</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-center gap-6 text-sm">
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
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Modal Detalle del Día */}
            {showDetalleDiaModal && detalleDia.fecha && (() => {
                const turnosFiltrados = filtroTerapeutaModal === 'todos'
                    ? detalleDia.turnos
                    : detalleDia.turnos.filter(turno => {
                        if (turno.medico_id) {
                            return turno.medico_id.toString() === filtroTerapeutaModal.toString();
                        }
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
                                            {formatearFecha(detalleDia.fecha)} - {turnosFiltrados.length} {turnosFiltrados.length === 1 ? 'turno' : 'turnos'}
                                            {filtroTerapeutaModal !== 'todos' && (
                                                <span className="text-gray-500"> (de {detalleDia.turnos.length} total)</span>
                                            )}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowDetalleDiaModal(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

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
                                            ? 'No hay turnos para el terapeuta seleccionado en este día.'
                                            : 'No hay turnos programados para este día.'}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {turnosFiltrados
                                            .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                                            .map((turno) => {
                                                const colorTerapeuta = obtenerColorTerapeuta(turno.terapeuta);
                                                const isAgendado = parseInt(turno.agendado) === 1;
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
                                                                {isAgendado && turno.paciente_nombre && (
                                                                    <div className="flex items-center gap-2">
                                                                        <User className={`w-4 h-4 ${colorTerapeuta.text}`} />
                                                                        <div>
                                                                            <span className={`text-xs font-medium ${colorTerapeuta.text}`}>
                                                                                Paciente:
                                                                            </span>
                                                                            <span className={`text-sm ml-1 font-bold ${colorTerapeuta.text}`}>
                                                                                {turno.paciente_nombre}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${isAgendado
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-orange-200 text-orange-800'
                                                                }`}>
                                                                {isAgendado ? 'Agendado' : 'Disponible'}
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

            {/* Modal Actualizar Enlace de Reunión Virtual */}
            {showModalActualizarEnlace && turnoSeleccionado && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-[#752568] flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Actualizar Enlace de Reunión Virtual
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Ingrese el enlace de Teams o Google Meet
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowModalActualizarEnlace(false);
                                        setTurnoSeleccionado(null);
                                        setNuevoEnlace('');
                                    }} 
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Información del turno */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm border border-gray-200">
                                <p className="mb-1"><strong>Terapeuta:</strong> {turnoSeleccionado.terapeuta}</p>
                                <p className="mb-1"><strong>Paciente:</strong> {turnoSeleccionado.paciente || 'N/A'}</p>
                                <p className="mb-1"><strong>Fecha:</strong> {formatearFecha(turnoSeleccionado.fecha)}</p>
                                <p className="mb-0">
                                    <strong>Horario:</strong> {formatearHora(turnoSeleccionado.hora_inicio)} - {formatearHora(turnoSeleccionado.hora_fin)}
                                </p>
                            </div>

                            {/* Campo para ingresar el enlace */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enlace de la Reunión Virtual <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={nuevoEnlace}
                                    onChange={(e) => setNuevoEnlace(e.target.value)}
                                    placeholder="https://teams.microsoft.com/... o https://meet.google.com/..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Puede ingresar un enlace de Microsoft Teams o Google Meet
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowModalActualizarEnlace(false);
                                    setTurnoSeleccionado(null);
                                    setNuevoEnlace('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleActualizarEnlace}
                                className="flex-1 px-4 py-2.5 bg-[#752568] text-white rounded-lg hover:bg-[#5a1d4f] font-medium transition-colors"
                            >
                                Actualizar Enlace
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </MainLayout >
    );
};

export default CitasPage;
