import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import axios from '../api/axios';
import { FileText, Download, Calendar, Search, ChevronLeft, ChevronRight, ChevronDown, Loader2, X } from 'lucide-react';

const TamizajePage = () => {
    const [tamizajes, setTamizajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [downloadingDni, setDownloadingDni] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0
    });
    const [search, setSearch] = useState('');
    const [searchTipo, setSearchTipo] = useState('nombres'); // 'cmp' | 'nombres' | 'celular' | 'diresa_geresa_diris' | 'institucion' | 'departamento_provincia_distrito'
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [idProceso, setIdProceso] = useState('');
    const [procesos, setProcesos] = useState([]);
    const [showFiltroDropdown, setShowFiltroDropdown] = useState(false);
    const [filtroDiresa, setFiltroDiresa] = useState('');
    const [filtroInstitucion, setFiltroInstitucion] = useState('');
    const [filtroDepartamento, setFiltroDepartamento] = useState('');
    const [filtroProvincia, setFiltroProvincia] = useState('');
    const [filtroDistrito, setFiltroDistrito] = useState('');
    const [diresas, setDiresas] = useState([]);
    const [instituciones, setInstituciones] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/dashboard-filtros').then(res => {
            setProcesos(res.data?.procesos || []);
        }).catch(() => setProcesos([]));
    }, []);

    useEffect(() => {
        axios.get('/tamizajes-filtros').then(res => {
            setDiresas(res.data?.diresas || []);
            setInstituciones(res.data?.instituciones || []);
            setDepartamentos(res.data?.departamentos || []);
        }).catch(() => {
            setDiresas([]);
            setInstituciones([]);
            setDepartamentos([]);
        });
    }, []);

    useEffect(() => {
        if (!filtroDepartamento) {
            setProvincias([]);
            setFiltroProvincia('');
            setDistritos([]);
            setFiltroDistrito('');
            return;
        }
        axios.get('/tamizajes-filtros/provincias', { params: { departamento: filtroDepartamento } })
            .then(res => {
                setProvincias(res.data?.provincias || []);
                setFiltroProvincia('');
                setDistritos([]);
                setFiltroDistrito('');
            })
            .catch(() => setProvincias([]));
    }, [filtroDepartamento]);

    useEffect(() => {
        if (!filtroDepartamento || !filtroProvincia) {
            setDistritos([]);
            setFiltroDistrito('');
            return;
        }
        axios.get('/tamizajes-filtros/distritos', { params: { departamento: filtroDepartamento, provincia: filtroProvincia } })
            .then(res => {
                setDistritos(res.data?.distritos || []);
                setFiltroDistrito('');
            })
            .catch(() => setDistritos([]));
    }, [filtroDepartamento, filtroProvincia]);

    // Valor que realmente se envía al API: solo si cumple mínimo de caracteres por tipo (para nombres/cmp/celular)
    const searchVal = search.trim();
    const minLen = searchTipo === 'cmp' ? 5 : searchTipo === 'celular' ? 8 : 4;
    const effectiveSearch = (searchTipo === 'nombres' || searchTipo === 'cmp' || searchTipo === 'celular') && searchVal.length >= minLen ? searchVal : '';

    useEffect(() => {
        fetchTamizajes();
    }, [pagination.current_page, effectiveSearch, searchTipo, filtroTipo, fechaInicio, fechaFin, idProceso, filtroDiresa, filtroInstitucion, filtroDepartamento, filtroProvincia, filtroDistrito]);

    const fetchTamizajes = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: effectiveSearch,
                search_tipo: searchTipo,
                tipo: filtroTipo !== 'todos' ? filtroTipo : null,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                id_proceso: idProceso || undefined
            };
            if (searchTipo === 'diresa_geresa_diris' && filtroDiresa) params.filtro_diresa_geresa_diris = filtroDiresa;
            if (searchTipo === 'institucion' && filtroInstitucion) params.filtro_institucion = filtroInstitucion;
            if (searchTipo === 'departamento_provincia_distrito') {
                if (filtroDepartamento) params.filtro_departamento = filtroDepartamento;
                if (filtroProvincia) params.filtro_provincia = filtroProvincia;
                if (filtroDistrito) params.filtro_distrito = filtroDistrito;
            }
            const response = await axios.get('/tamizajes', { params });

            if (response.data.success) {
                setTamizajes(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error al obtener tamizajes:', error);
            const msg = error.response?.data?.message || error.response?.data?.error || error.message;
            if (msg) console.error('Detalle del servidor:', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        // Solo resetear página cuando el valor cumple el mínimo y se disparará la búsqueda
        const minLen = searchTipo === 'cmp' ? 5 : searchTipo === 'celular' ? 8 : 4;
        if (value.trim().length >= minLen) {
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }
    };

    const handleSearchTipoChange = (e) => {
        const value = e.target.value;
        setSearchTipo(value);
        setFiltroDiresa('');
        setFiltroInstitucion('');
        setFiltroDepartamento('');
        setFiltroProvincia('');
        setFiltroDistrito('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const getSearchPlaceholder = () => {
        switch (searchTipo) {
            case 'cmp': return 'Ingrese CMP...';
            case 'celular': return 'Ingrese celular (9 dígitos)...';
            case 'diresa_geresa_diris': return 'Seleccione DIRESA/GERESA/DIRIS';
            case 'institucion': return 'Seleccione institución';
            case 'departamento_provincia_distrito': return 'Seleccione departamento, provincia y distrito';
            default: return 'Ingrese nombres o apellidos...';
        }
    };

    const getSearchMinLength = () => {
        switch (searchTipo) {
            case 'cmp': return 5;
            case 'celular': return 8;
            default: return 4; // nombres y apellidos
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            setPagination(prev => ({ ...prev, current_page: newPage }));
        }
    };

    const handleFiltroChange = (tipo) => {
        setFiltroTipo(tipo);
        setShowFiltroDropdown(false);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleFechaInicioChange = (e) => {
        setFechaInicio(e.target.value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleFechaFinChange = (e) => {
        setFechaFin(e.target.value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleCorteChange = (e) => {
        setIdProceso(e.target.value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const getFiltroLabel = () => {
        const labels = {
            'todos': 'Todos',
            'asq': 'ASQ',
            'phq': 'PHQ',
            'gad': 'GAD',
            'mbi': 'MBI',
            'audit': 'AUDIT'
        };
        return labels[filtroTipo] || 'Todos';
    };

    // Función para obtener el color del badge según el riesgo (estilo Figma)
    // Función para obtener el color del badge según el riesgo (estilo Figma)
    const getRiesgoBadgeColor = (riesgo) => {
        if (!riesgo) return 'bg-gray-100 text-gray-600';

        const riesgoLower = riesgo.toLowerCase();
        if (riesgoLower.includes('alto') || riesgoLower.includes('problemático')) {
            return 'bg-red-600 text-white';
        } else if (riesgoLower.includes('moderado') || riesgoLower.includes('riesgoso')) {
            return 'bg-yellow-400 text-gray-900';
        } else if (riesgoLower.includes('leve') || riesgoLower.includes('bajo')) {
            return 'bg-green-500 text-white';
        } else if (riesgoLower.includes('sin riesgo') || riesgoLower.includes('ausencia')) {
            return 'bg-gray-100 text-gray-600';
        } else if (riesgoLower.includes('presencia')) {
            return 'bg-yellow-400 text-gray-900';
        }
        return 'bg-gray-100 text-gray-600';
    };

    // Función para obtener el color del badge de ASQ
    // Función para obtener el color del badge de ASQ
    const getAsqBadgeColor = (respuesta) => {
        if (!respuesta) return 'bg-gray-100 text-gray-600';

        const respuestaLower = respuesta.toLowerCase();
        if (respuestaLower === 'si') {
            return 'bg-red-600 text-white';
        } else if (respuestaLower === 'no') {
            return 'bg-yellow-500 text-white';
        } else if (respuestaLower === 'sin riesgo') {
            return 'bg-gray-100 text-gray-600';
        }
        return 'bg-gray-100 text-gray-600';
    };

    // Función para obtener el color del badge de completado (estilo Figma)
    // Función para obtener el color del badge de completado (estilo Figma)
    const getCompletadoBadgeColor = (completadas, total) => {
        if (completadas === total) {
            // 5/5 - Morado/Primary
            return 'bg-[#752568] text-white';
        }
        // Menos de 5/5 - Naranja
        return 'bg-orange-400 text-white';
    };

    // Función para parsear el resultado de ASQ (puede venir como "RSA: Si - RSNA: No")
    const parseAsqResult = (asqResultado) => {
        if (!asqResultado) return { rsa: null, rsna: null };

        // Si el resultado viene en formato "RSA: X - RSNA: Y"
        const parts = asqResultado.split('-');
        let rsa = null, rsna = null;

        parts.forEach(part => {
            if (part.includes('RSA:')) {
                rsa = part.split(':')[1]?.trim();
            } else if (part.includes('RSNA:')) {
                rsna = part.split(':')[1]?.trim();
            }
        });

        return { rsa, rsna };
    };

    // Función para formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const handleDownload = async (dni, cmp) => {
        setDownloadingDni(dni);
        try {
            const response = await axios.get(`/tamizajes/exportar/${dni}`, {
                params: { cmp: cmp || undefined },
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
            setDownloadingDni(null);
        }
    };

    const handleDownloadAll = async () => {
        setDownloadingAll(true);
        try {
            const searchVal = search.trim();
            const minLen = (searchTipo === 'nombres' || searchTipo === 'cmp' || searchTipo === 'celular') ? getSearchMinLength() : 0;
            const searchActive = searchVal.length >= minLen;
            const params = {
                search: searchActive ? searchVal : '',
                search_tipo: searchTipo,
                id_proceso: idProceso || undefined
            };
            if (searchTipo === 'diresa_geresa_diris' && filtroDiresa) params.filtro_diresa_geresa_diris = filtroDiresa;
            if (searchTipo === 'institucion' && filtroInstitucion) params.filtro_institucion = filtroInstitucion;
            if (searchTipo === 'departamento_provincia_distrito') {
                if (filtroDepartamento) params.filtro_departamento = filtroDepartamento;
                if (filtroProvincia) params.filtro_provincia = filtroProvincia;
                if (filtroDistrito) params.filtro_distrito = filtroDistrito;
            }
            const response = await axios.get('/tamizajes/exportar-todo', {
                params,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Resultados_Evaluaciones_Todos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error al descargar todo:', error);
        } finally {
            setDownloadingAll(false);
        }
    };

    const handleVerDetalle = (dni, tipo = null) => {
        if (tipo) {
            navigate(`/tamizaje/${dni}?tipo=${tipo}`);
        } else {
            navigate(`/tamizaje/${dni}`);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Encabezado */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Evaluaciones Psicológicas</h1>
                    <p className="mt-2 text-gray-600">Colegio Médico del Perú - Serumistas</p>
                </div>

                {/* Card principal */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Header del card */}
                    <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Lista de Serumistas</h2>
                            <p className="text-sm text-gray-600 mt-1">Gestiona y revisa las evaluaciones de los serumistas</p>
                        </div>
                        <button
                            onClick={() => handleDownloadAll()}
                            disabled={downloadingAll}
                            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors shadow-sm text-sm font-medium gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {downloadingAll ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {downloadingAll ? 'Generando Excel...' : 'Descargar Resultados de Evaluaciones'}
                        </button>
                    </div>

                    {/* Barra de filtros */}
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Búsqueda: tipo + valor o selects de filtro */}
                            <div className="flex flex-col sm:flex-row gap-2 flex-1 flex-wrap">
                                <select
                                    value={searchTipo}
                                    onChange={handleSearchTipoChange}
                                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[160px]"
                                >
                                    <option value="nombres">Nombres y apellidos</option>
                                    <option value="cmp">CMP</option>
                                    <option value="celular">Celular</option>
                                    <option value="diresa_geresa_diris">DIRESA / GERESA / DIRIS</option>
                                    <option value="institucion">Institución</option>
                                    <option value="departamento_provincia_distrito">Departamento / Provincia / Distrito</option>
                                </select>

                                {searchTipo === 'nombres' || searchTipo === 'cmp' || searchTipo === 'celular' ? (
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={handleSearch}
                                            placeholder={getSearchPlaceholder()}
                                            className={`w-full pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${search ? 'pr-10' : 'pr-4'}`}
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={handleClearSearch}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                                title="Borrar búsqueda"
                                                aria-label="Borrar búsqueda"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ) : searchTipo === 'diresa_geresa_diris' ? (
                                    <select
                                        value={filtroDiresa}
                                        onChange={(e) => { setFiltroDiresa(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[200px] flex-1"
                                    >
                                        <option value="">Todos</option>
                                        {diresas.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                ) : searchTipo === 'institucion' ? (
                                    <select
                                        value={filtroInstitucion}
                                        onChange={(e) => { setFiltroInstitucion(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[200px] flex-1"
                                    >
                                        <option value="">Todos</option>
                                        {instituciones.map((inst) => (
                                            <option key={inst} value={inst}>{inst}</option>
                                        ))}
                                    </select>
                                ) : searchTipo === 'departamento_provincia_distrito' ? (
                                    <div className="flex gap-2 flex-1 flex-wrap items-center">
                                        <select
                                            value={filtroDepartamento}
                                            onChange={(e) => { setFiltroDepartamento(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[140px]"
                                            title="Departamento"
                                        >
                                            <option value="">Departamento</option>
                                            {departamentos.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={filtroProvincia}
                                            onChange={(e) => { setFiltroProvincia(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[140px]"
                                            title="Provincia"
                                            disabled={!filtroDepartamento}
                                        >
                                            <option value="">Provincia</option>
                                            {provincias.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={filtroDistrito}
                                            onChange={(e) => { setFiltroDistrito(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[140px]"
                                            title="Distrito"
                                            disabled={!filtroProvincia}
                                        >
                                            <option value="">Distrito</option>
                                            {distritos.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}
                            </div>

                            {/* Filtros adicionales */}
                            <div className="flex gap-2">
                                {/* Filtro por tipo de evaluación */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFiltroDropdown(!showFiltroDropdown)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 min-w-[120px] justify-between"
                                    >
                                        <span>{getFiltroLabel()}</span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showFiltroDropdown && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                            <button
                                                onClick={() => handleFiltroChange('todos')}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${filtroTipo === 'todos' ? 'bg-purple-50 text-primary-900 font-medium' : 'text-gray-700'}`}
                                            >
                                                <span>Todos</span>
                                                {filtroTipo === 'todos' && <span className="text-primary-900">✓</span>}
                                            </button>
                                            <button
                                                onClick={() => handleFiltroChange('asq')}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${filtroTipo === 'asq' ? 'bg-purple-50 text-primary-900 font-medium' : 'text-gray-700'}`}
                                            >
                                                <span>ASQ</span>
                                                {filtroTipo === 'asq' && <span className="text-primary-900">✓</span>}
                                            </button>
                                            <button
                                                onClick={() => handleFiltroChange('phq')}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${filtroTipo === 'phq' ? 'bg-purple-50 text-primary-900 font-medium' : 'text-gray-700'}`}
                                            >
                                                <span>PHQ</span>
                                                {filtroTipo === 'phq' && <span className="text-primary-900">✓</span>}
                                            </button>
                                            <button
                                                onClick={() => handleFiltroChange('gad')}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${filtroTipo === 'gad' ? 'bg-purple-50 text-primary-900 font-medium' : 'text-gray-700'}`}
                                            >
                                                <span>GAD</span>
                                                {filtroTipo === 'gad' && <span className="text-primary-900">✓</span>}
                                            </button>
                                            <button
                                                onClick={() => handleFiltroChange('mbi')}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${filtroTipo === 'mbi' ? 'bg-purple-50 text-primary-900 font-medium' : 'text-gray-700'}`}
                                            >
                                                <span>MBI</span>
                                                {filtroTipo === 'mbi' && <span className="text-primary-900">✓</span>}
                                            </button>
                                            <button
                                                onClick={() => handleFiltroChange('audit')}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between rounded-b-lg ${filtroTipo === 'audit' ? 'bg-purple-50 text-primary-900 font-medium' : 'text-gray-700'}`}
                                            >
                                                <span>AUDIT</span>
                                                {filtroTipo === 'audit' && <span className="text-primary-900">✓</span>}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap items-center">
                                    <div className="space-y-1">
                                        <select
                                            value={idProceso}
                                            onChange={handleCorteChange}
                                            className="w-full min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#752568] focus:border-transparent text-sm"
                                        >
                                            <option value="">Todos los cortes</option>
                                            {procesos.map(p => (
                                                <option key={p.id_proceso} value={p.id_proceso}>{p.etiqueta}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={handleFechaInicioChange}
                                            placeholder="Desde"
                                            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={fechaFin}
                                            onChange={handleFechaFinChange}
                                            placeholder="Hasta"
                                            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider w-[100px]">CMP</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider w-[80px]">Corte</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider min-w-[200px]">Nombre del Serumista</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Completado</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">ASQ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">PHQ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">GAD</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">MBI</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">AUDIT</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Resultados</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                                            Cargando...
                                        </td>
                                    </tr>
                                ) : tamizajes.length === 0 ? (
                                    <tr>
                                        <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                                            No se encontraron resultados
                                        </td>
                                    </tr>
                                ) : (
                                    tamizajes.map((tamizaje, index) => {
                                        const asqParsed = parseAsqResult(tamizaje.asq);

                                        return (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                                {/* CMP */}
                                                <td className="px-4 py-4 text-sm text-gray-600">
                                                    {tamizaje.cmp || '-'}
                                                </td>

                                                {/* Corte */}
                                                <td className="px-4 py-4 text-sm text-gray-600">
                                                    {tamizaje.corte_etiqueta || '-'}
                                                </td>

                                                {/* Nombre */}
                                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                    {tamizaje.nombre_completo || '-'}
                                                </td>

                                                {/* Completado */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-sm font-bold ${getCompletadoBadgeColor(tamizaje.completadas, tamizaje.total_evaluaciones)}`}>
                                                        {tamizaje.completadas}/{tamizaje.total_evaluaciones}
                                                    </span>
                                                </td>

                                                {/* ASQ */}
                                                <td className="px-2 py-4 text-center">
                                                    {tamizaje.asq ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="flex flex-col gap-1">
                                                                {asqParsed.rsa && (
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <span className="text-xs font-semibold text-gray-600">RSA:</span>
                                                                        <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 ${getAsqBadgeColor(asqParsed.rsa)}`}>
                                                                            {asqParsed.rsa}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {asqParsed.rsna && (
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <span className="text-xs font-semibold text-gray-600">RSNA:</span>
                                                                        <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 ${getAsqBadgeColor(asqParsed.rsna)}`}>
                                                                            {asqParsed.rsna}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleVerDetalle(tamizaje.dni, 'asq')}
                                                                className="inline-flex items-center justify-center text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1 gap-1 transition-colors"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                Ver
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>

                                                {/* Fecha ASQ */}
                                                <td className="px-2 py-4 text-center text-gray-500 text-xs">
                                                    {formatDate(tamizaje.asq_fecha)}
                                                </td>

                                                {/* PHQ */}
                                                <td className="px-2 py-4 text-center">
                                                    {tamizaje.phq ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-3 py-1 ${getRiesgoBadgeColor(tamizaje.phq)}`}>
                                                                {tamizaje.phq}
                                                            </span>
                                                            <button
                                                                onClick={() => handleVerDetalle(tamizaje.dni, 'phq9')}
                                                                className="inline-flex items-center justify-center text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1 gap-1 transition-colors"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                Ver
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>

                                                {/* GAD */}
                                                <td className="px-2 py-4 text-center">
                                                    {tamizaje.gad ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-3 py-1 ${getRiesgoBadgeColor(tamizaje.gad)}`}>
                                                                {tamizaje.gad}
                                                            </span>
                                                            <button
                                                                onClick={() => handleVerDetalle(tamizaje.dni, 'gad')}
                                                                className="inline-flex items-center justify-center text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1 gap-1 transition-colors"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                Ver
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>

                                                {/* MBI */}
                                                <td className="px-2 py-4 text-center">
                                                    {tamizaje.mbi ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-3 py-1 ${getRiesgoBadgeColor(tamizaje.mbi.split('-')[0])}`}>
                                                                {tamizaje.mbi.split('-')[0]}
                                                            </span>
                                                            <button
                                                                onClick={() => handleVerDetalle(tamizaje.dni, 'mbi')}
                                                                className="inline-flex items-center justify-center text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1 gap-1 transition-colors"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                Ver
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>

                                                {/* AUDIT */}
                                                <td className="px-2 py-4 text-center">
                                                    {tamizaje.audit ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-3 py-1 ${getRiesgoBadgeColor(tamizaje.audit)}`}>
                                                                {tamizaje.audit}
                                                            </span>
                                                            <button
                                                                onClick={() => handleVerDetalle(tamizaje.dni, 'audit')}
                                                                className="inline-flex items-center justify-center text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1 gap-1 transition-colors"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                Ver
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>

                                                {/* Fecha última evaluación */}
                                                <td className="px-2 py-4 text-center text-gray-500 text-xs">
                                                    {formatDate(tamizaje.fecha_ultima_evaluacion)}
                                                </td>

                                                {/* Resultados (Download) */}
                                                <td className="px-2 py-4 text-center">
                                                    <button
                                                        onClick={() => handleDownload(tamizaje.dni, tamizaje.cmp)}
                                                        disabled={downloadingDni === tamizaje.dni}
                                                        className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {downloadingDni === tamizaje.dni ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Mostrando {pagination.from}-{pagination.to} de {pagination.total} serumistas
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                                    Anterior
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-700">
                                    Página {pagination.current_page} de {pagination.last_page}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Siguiente
                                    <ChevronRight className="w-4 h-4 inline ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </MainLayout >
    );
};

export default TamizajePage;
