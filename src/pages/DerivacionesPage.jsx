import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import {
    Search, Calendar, Download, Phone, AlertTriangle,
    Users, Clock, CheckCircle, AlertCircle, Building2, X
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DerivacionesPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('ESSALUD');
    const [stats, setStats] = useState({
        total: 0,
        pendientes: 0,
        atendidos: 0,
        seleccionados: 0
    });
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        fecha_desde: '',
        fecha_hasta: ''
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [attentionDate, setAttentionDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Contact Popover State
    const [activeContactId, setActiveContactId] = useState(null);

    // Determinar qué tabs mostrar según el perfil del usuario
    const [allowedTabs, setAllowedTabs] = useState(['ESSALUD', 'MINSA']);

    useEffect(() => {
        // Si el perfil es MINSA o ESSALUD, solo mostrar ese tab
        if (user && user.perfil) {
            const nombrePerfil = user.perfil.nombre_perfil?.toUpperCase() || '';
            
            if (nombrePerfil.includes('MINSA')) {
                setAllowedTabs(['MINSA']);
                setActiveTab('MINSA');
            } else if (nombrePerfil.includes('ESSALUD')) {
                setAllowedTabs(['ESSALUD']);
                setActiveTab('ESSALUD');
            } else {
                // Administrador u otros perfiles: ver ambos tabs
                setAllowedTabs(['ESSALUD', 'MINSA']);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [activeTab, pagination.current_page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Stats
            const statsRes = await api.get(`/derivaciones/stats?entidad=${activeTab}`);
            setStats(statsRes.data);

            // Fetch Patients
            const params = {
                entidad: activeTab,
                page: pagination.current_page,
                ...filters
            };
            const patientsRes = await api.get('/derivaciones', { params });
            setPatients(patientsRes.data.data);
            setPagination({
                current_page: patientsRes.data.current_page,
                last_page: patientsRes.data.last_page,
                total: patientsRes.data.total
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchData();
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    // Contact Popover Handler
    const handleContactClick = (id) => {
        setActiveContactId(activeContactId === id ? null : id);
    };

    // Modal Handlers
    const handleAttentionClick = (patient) => {
        setSelectedPatient(patient);
        setAttentionDate(''); // Reset date
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPatient(null);
        setAttentionDate('');
    };

    const handleConfirmAttention = async () => {
        if (!selectedPatient || !attentionDate) return;

        setSubmitting(true);
        try {
            await api.post('/derivaciones', {
                paciente_id: selectedPatient.id,
                fecha: attentionDate
            }, {
                params: {
                    entidad: activeTab
                }
            });

            // Refresh data
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error('Error registering attention:', error);
            alert(error.response?.data?.message || 'Error al registrar la atención');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = {
                entidad: activeTab,
                search: filters.search,
                fecha_desde: filters.fecha_desde,
                fecha_hasta: filters.fecha_hasta
            };
            
            const response = await api.get('/derivaciones/export', {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Derivaciones_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar:', error);
            alert('Error al exportar los datos. Por favor, intenta nuevamente.');
        }
    };

    const getBadgeColor = (type, value) => {
        if (!value) return null;

        switch (type) {
            case 'PHQ':
                if (value.includes('alto')) return 'bg-red-50 text-red-700 border border-red-300';
                if (value.includes('moderado')) return 'bg-orange-50 text-orange-700 border border-orange-300';
                return null;
            case 'GAD':
                if (value.includes('alto')) return 'bg-red-50 text-red-700 border border-red-300';
                if (value.includes('moderado')) return 'bg-orange-50 text-orange-700 border border-orange-300';
                return null;
            case 'MBI':
                return value === 'Presencia de burnout' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-300' 
                    : null;
            case 'AUDIT':
                return ['Consumo problemático', 'Dependencia', 'Riesgo', 'Consumo Peligroso'].includes(value)
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                    : null;
            case 'ASQ':
                return value && value !== 'Sin riesgo' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-300' 
                    : null;
            default:
                return null;
        }
    };

    const renderBadge = (type, value) => {
        if (!value) return <span className="text-gray-400 text-xs">-</span>;

        const colorClass = getBadgeColor(type, value);
        if (!colorClass) return <span className="text-gray-500 text-xs">-</span>;

        // Display text mapping
        let displayText = value;
        if (type === 'MBI' && value === 'Presencia de burnout') {
            displayText = 'Consumo Peligroso';
        }
        if (type === 'AUDIT' && ['Consumo problemático', 'Dependencia', 'Riesgo', 'Consumo Peligroso'].includes(value)) {
            displayText = 'Consumo Peligroso';
        }
        if (type === 'ASQ') {
            displayText = 'Sí';
        }
        if (type === 'PHQ' && value.includes('alto')) {
            displayText = 'Riesgo Alto';
        }
        if (type === 'GAD' && value.includes('alto')) {
            displayText = 'Riesgo Alto';
        }

        return (
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass} whitespace-nowrap`}>
                {displayText}
            </span>
        );
    };

    return (
        <MainLayout>
            <div className="space-y-6 relative">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Derivación - Pacientes de Alto Riesgo</h1>
                    <p className="text-gray-500">Lista de pacientes que requieren derivación inmediata según criterios de alto riesgo</p>
                </div>

                {/* Tabs */}
                <div className="bg-gray-100 p-1 rounded-lg inline-flex w-full max-w-md">
                    {allowedTabs.includes('ESSALUD') && (
                        <button
                            onClick={() => setActiveTab('ESSALUD')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'ESSALUD'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Building2 className="w-4 h-4 inline-block mr-2" />
                            ESSALUD
                        </button>
                    )}
                    {allowedTabs.includes('MINSA') && (
                        <button
                            onClick={() => setActiveTab('MINSA')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'MINSA'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Building2 className="w-4 h-4 inline-block mr-2" />
                            MINSA
                        </button>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-purple-500">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Pacientes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-purple-500">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pendientes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-green-500">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Atendidos</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.atendidos}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-yellow-500">
                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Seleccionados</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.seleccionados}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Buscar por nombre o CMP..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <input
                                    type="date"
                                    name="fecha_desde"
                                    value={filters.fecha_desde}
                                    onChange={handleFilterChange}
                                    className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="date"
                                    name="fecha_hasta"
                                    value={filters.fecha_hasta}
                                    onChange={handleFilterChange}
                                    className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleExport}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Exportar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-3 w-10">
                                        <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                    </th>
                                    <th className="px-3 py-3 text-xs">N°</th>
                                    <th className="px-3 py-3 text-xs">Nombre del Paciente</th>
                                    <th className="px-3 py-3 text-xs">CMP</th>
                                    <th className="px-3 py-3 text-xs">Evaluación</th>
                                    <th className="px-3 py-3 text-center text-xs">ASQ<br/>(RSA)</th>
                                    <th className="px-3 py-3 text-center text-xs">ASQ<br/>(RSNA)</th>
                                    <th className="px-3 py-3 text-center text-xs">PHQ</th>
                                    <th className="px-3 py-3 text-center text-xs">GAD</th>
                                    <th className="px-3 py-3 text-center text-xs">AUDIT</th>
                                    <th className="px-3 py-3 text-center text-xs">Contacto</th>
                                    <th className="px-3 py-3 text-xs">Entidad</th>
                                    <th className="px-3 py-3 text-center text-xs">Tipo</th>
                                    <th className="px-3 py-3 text-xs">Estado</th>
                                    <th className="px-3 py-3 text-xs">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="15" className="px-4 py-8 text-center text-gray-500">
                                            Cargando datos...
                                        </td>
                                    </tr>
                                ) : patients.length === 0 ? (
                                    <tr>
                                        <td colSpan="15" className="px-4 py-8 text-center text-gray-500">
                                            No se encontraron pacientes de alto riesgo.
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((patient, index) => (
                                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                            <td className="px-3 py-3">
                                                <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                            </td>
                                            <td className="px-3 py-3 text-gray-500 text-xs font-medium">
                                                {(pagination.current_page - 1) * 10 + index + 1}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                        {patient.nombre.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900 text-xs">{patient.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-500 text-xs">{patient.cmp}</td>
                                            <td className="px-3 py-3 text-gray-500 text-xs">{patient.fecha_evaluacion}</td>
                                            <td className="px-3 py-3 text-center">{renderBadge('ASQ', patient.asq_rsa)}</td>
                                            <td className="px-3 py-3 text-center">{renderBadge('ASQ', patient.asq_rsna)}</td>
                                            <td className="px-3 py-3 text-center">{renderBadge('PHQ', patient.phq)}</td>
                                            <td className="px-3 py-3 text-center">{renderBadge('GAD', patient.gad)}</td>
                                            <td className="px-3 py-3 text-center">{renderBadge('AUDIT', patient.audit)}</td>
                                            <td className="px-3 py-3 text-center relative">
                                                <button
                                                    onClick={() => handleContactClick(patient.id)}
                                                    className={`p-2 rounded-full transition-colors ${activeContactId === patient.id
                                                        ? 'bg-purple-600 text-white'
                                                        : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                                                        }`}
                                                    title="Ver contacto"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </button>

                                                {/* Contact Popover */}
                                                {activeContactId === patient.id && (
                                                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 text-left">
                                                        {/* Arrow */}
                                                        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-white border-b-8 border-b-transparent"></div>
                                                        <div className="absolute top-1/2 -right-[9px] transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-gray-200 border-b-8 border-b-transparent -z-10"></div>

                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900">Teléfono:</p>
                                                                <p className="text-sm text-gray-600">{patient.contacto?.telefono || 'No registrado'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900">Email:</p>
                                                                <p className="text-sm text-gray-600 break-all">{patient.contacto?.email || 'No registrado'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-gray-500 text-xs max-w-[150px] truncate" title={patient.entidad}>
                                                {patient.entidad}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <div className="relative group inline-block">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${patient.derivacion_tipo === 'A'
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                                                        }`}
                                                        title={patient.derivacion_tipo === 'A' ? 'Automático' : 'Manual'}
                                                    >
                                                        {patient.derivacion_tipo}
                                                    </span>
                                                    {patient.derivacion_observacion && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 whitespace-normal">
                                                            <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
                                                            <p className="font-semibold mb-1">
                                                                {patient.derivacion_tipo === 'A' ? 'Derivación Automática:' : 'Observación del Médico:'}
                                                            </p>
                                                            <p className="text-gray-200">{patient.derivacion_observacion}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.estado === 'Atendido'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {patient.estado}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                {patient.estado === 'Atendido' ? (
                                                    <span className="text-xs text-gray-400 italic flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Ya atendido
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAttentionClick(patient)}
                                                        className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                                                    >
                                                        <Calendar className="w-3 h-3" />
                                                        Atención
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Mostrando {patients.length} de {pagination.total} resultados
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                disabled={pagination.current_page === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>

                {/* Banners */}
                <div className="space-y-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                            Pacientes de <strong>{activeTab}</strong> con criterios de derivación: ASQ (RSA/RSNA: Si), PHQ/GAD (Riesgo Alto), AUDIT (Consumo Peligroso).
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            <strong>Entidades de Atención {activeTab}:</strong> {activeTab === 'ESSALUD' ? 'Hospital Rebagliati, Hospital Almenara' : 'Hospital Loayza, Hospital Arzobispo Loayza'}
                        </p>
                    </div>
                </div>

                {/* Attention Modal */}
                {isModalOpen && selectedPatient && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="absolute inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg leading-6 font-medium text-[#752568] flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            Registrar Atención del Paciente
                                        </h3>
                                        <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-500">Ingrese la fecha en que la entidad atendió al paciente.</p>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-gray-500" />
                                                Entidad de Atención
                                            </label>
                                            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                                                {selectedPatient.entidad || 'No especificada'}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                Fecha de Atención
                                            </label>
                                            <input
                                                type="date"
                                                value={attentionDate}
                                                onChange={(e) => setAttentionDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleConfirmAttention}
                                        disabled={!attentionDate || submitting}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#752568] text-base font-medium text-white hover:bg-[#5a1d4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#752568] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Guardando...' : 'Confirmar Atención'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default DerivacionesPage;
