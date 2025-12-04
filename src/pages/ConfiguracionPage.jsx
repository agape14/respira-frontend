import { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import ModalUsuario from '../components/ModalUsuario';
import ModalToken from '../components/ModalToken';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    Save,
    Eraser,
    Key,
    Copy,
    RefreshCw,
    ExternalLink,
    Calendar,
    Shield,
    AlertTriangle,
    UserCog
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ConfiguracionPage = () => {
    const [activeTab, setActiveTab] = useState('usuarios');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]); // Dynamic roles
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [conformidadText, setConformidadText] = useState('');

    // Tokens externos
    const [tokens, setTokens] = useState([]);
    const [consejosRegionales, setConsejosRegionales] = useState([]);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [currentToken, setCurrentToken] = useState(null);


    // New states for filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('Todos'); // Default to Todos initially

    // Filtered users logic
    const filteredUsers = users.filter(user => {
        const matchesRole = selectedRoleFilter === 'Todos' || user.rol === selectedRoleFilter;
        const matchesSearch =
            user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesRole && matchesSearch;
    });

    // Fetch initial data
    useEffect(() => {
        if (activeTab === 'usuarios') {
            fetchUsers();
            fetchRoles();
        } else if (activeTab === 'conformidad') {
            fetchConformidad();
        } else if (activeTab === 'tokens') {
            fetchTokens();
            fetchConsejosRegionales();
        }
    }, [activeTab]);

    const fetchRoles = async () => {
        try {
            const response = await axios.get('/roles');
            setRoles(response.data);

            // Set default filter if 'Administrador' exists, otherwise keep 'Todos'
            const adminRole = response.data.find(r => r.nombre_perfil.toLowerCase().includes('administrador'));
            if (adminRole) {
                setSelectedRoleFilter(adminRole.nombre_perfil);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchConformidad = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/configuracion/conformidad');
            setConformidadText(response.data.content || '');
        } catch (error) {
            console.error('Error fetching conformidad:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUser = async (formData) => {
        try {
            if (currentUser) {
                await axios.put(`/users/${currentUser.id}`, formData);
                Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
            } else {
                await axios.post('/users', formData);
                Swal.fire('Éxito', 'Usuario creado correctamente', 'success');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            Swal.fire('Error', 'No se pudo guardar el usuario', 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#752568',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/users/${id}`);
                Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
            }
        }
    };

    const handleSaveConformidad = async () => {
        try {
            setLoading(true);
            await axios.post('/configuracion/conformidad', { content: conformidadText });
            Swal.fire('Éxito', 'Documento guardado correctamente', 'success');
        } catch (error) {
            console.error('Error saving conformidad:', error);
            Swal.fire('Error', 'No se pudo guardar el documento', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (user = null) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };


    // ========================================================================
    // FUNCIONES PARA TOKENS EXTERNOS
    // ========================================================================

    const fetchTokens = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/configuracion/tokens');
            setTokens(response.data);
        } catch (error) {
            console.error('Error fetching tokens:', error);
            Swal.fire('Error', 'No se pudieron cargar los tokens', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchConsejosRegionales = async () => {
        try {
            const response = await axios.get('/configuracion/consejos-regionales');
            setConsejosRegionales(response.data);
        } catch (error) {
            console.error('Error fetching consejos regionales:', error);
        }
    };

    const handleSaveToken = async (formData) => {
        try {
            if (currentToken) {
                // Actualizar token existente
                await axios.put(`/configuracion/tokens/${currentToken.id}`, formData);
                Swal.fire('Éxito', 'Token actualizado correctamente', 'success');
            } else {
                // Crear nuevo token
                const response = await axios.post('/configuracion/tokens', formData);
                
                // Mostrar el token generado
                Swal.fire({
                    title: 'Token Generado Exitosamente',
                    html: `
                        <div class="text-left space-y-4">
                            <div>
                                <p class="font-semibold text-gray-700 mb-2">Token:</p>
                                <div class="bg-gray-100 p-3 rounded-lg break-all font-mono text-sm">
                                    ${response.data.token.token}
                                </div>
                            </div>
                            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                <p class="text-sm text-yellow-800">
                                    <strong>⚠️ Importante:</strong> Guarda este token en un lugar seguro. No podrás verlo nuevamente.
                                </p>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-700 mb-2">URL de Ejemplo:</p>
                                <div class="bg-gray-100 p-3 rounded-lg break-all text-xs">
                                    ${window.location.origin}/external/dashboard?token=${response.data.token.token}&id_cr=1
                                </div>
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#752568',
                    confirmButtonText: 'Copiar Token',
                    showCancelButton: true,
                    cancelButtonText: 'Cerrar',
                    width: '600px'
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigator.clipboard.writeText(response.data.token.token);
                        Swal.fire('Copiado', 'Token copiado al portapapeles', 'success');
                    }
                });
            }
            setIsTokenModalOpen(false);
            fetchTokens();
        } catch (error) {
            console.error('Error saving token:', error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo guardar el token', 'error');
        }
    };

    const handleRenovarToken = async (token) => {
        const { value: dias } = await Swal.fire({
            title: 'Renovar Token',
            html: `
                <div class="text-left space-y-4">
                    <p class="text-sm text-gray-600 mb-3">
                        Token: <strong>${token.nombre_aplicacion}</strong>
                    </p>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Duración de renovación (días):
                    </label>
                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <button type="button" class="swal-duration-btn px-3 py-2 bg-gray-100 rounded" data-days="90">3 meses</button>
                        <button type="button" class="swal-duration-btn px-3 py-2 bg-gray-100 rounded" data-days="180">6 meses</button>
                        <button type="button" class="swal-duration-btn px-3 py-2 bg-gray-100 rounded" data-days="365">1 año</button>
                        <button type="button" class="swal-duration-btn px-3 py-2 bg-gray-100 rounded" data-days="730">2 años</button>
                    </div>
                </div>
            `,
            input: 'number',
            inputValue: 365,
            inputPlaceholder: 'Días personalizados',
            inputAttributes: {
                min: 1,
                max: 3650,
                step: 1
            },
            showCancelButton: true,
            confirmButtonColor: '#752568',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Renovar',
            didOpen: () => {
                const buttons = document.querySelectorAll('.swal-duration-btn');
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const input = Swal.getInput();
                        input.value = btn.dataset.days;
                    });
                });
            }
        });

        if (dias) {
            try {
                await axios.post(`/configuracion/tokens/${token.id}/renovar`, {
                    duracion_dias: parseInt(dias)
                });
                Swal.fire('Renovado', 'Token renovado exitosamente', 'success');
                fetchTokens();
            } catch (error) {
                console.error('Error renovando token:', error);
                Swal.fire('Error', 'No se pudo renovar el token', 'error');
            }
        }
    };

    const handleDeleteToken = async (token) => {
        const result = await Swal.fire({
            title: '¿Desactivar Token?',
            html: `
                <p class="text-gray-600 mb-2">
                    ¿Estás seguro de que deseas desactivar el token de:
                </p>
                <p class="font-semibold text-gray-900">${token.nombre_aplicacion}</p>
                <p class="text-sm text-gray-500 mt-3">
                    El token se desactivará pero no se eliminará de la base de datos.
                </p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/configuracion/tokens/${token.id}`);
                Swal.fire('Desactivado', 'El token ha sido desactivado', 'success');
                fetchTokens();
            } catch (error) {
                console.error('Error deleting token:', error);
                Swal.fire('Error', 'No se pudo desactivar el token', 'error');
            }
        }
    };

    const copyToken = (token) => {
        navigator.clipboard.writeText(token);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Token copiado',
            showConfirmButton: false,
            timer: 2000
        });
    };

    const copyDashboardURL = (token, consejoId = 1) => {
        const url = `${window.location.origin}/external/dashboard?token=${token}&id_cr=${consejoId}`;
        navigator.clipboard.writeText(url);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'URL copiada',
            showConfirmButton: false,
            timer: 2000
        });
    };

    const openTokenModal = (token = null) => {
        setCurrentToken(token);
        setIsTokenModalOpen(true);
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
                    <p className="text-gray-500">Gestiona usuarios y documentos de conformidad</p>
                </div>

                {/* Tabs */}
                <div className="bg-gray-100 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'usuarios'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab('tokens')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'tokens'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Key className="w-4 h-4" />
                        Tokens Externos
                    </button>
                    <button
                        onClick={() => setActiveTab('conformidad')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'conformidad'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Conformidad
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                    {activeTab === 'usuarios' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-[#752568]">Gestión de Usuarios</h2>
                                    <p className="text-sm text-gray-500">Administra usuarios internos y externos del sistema</p>
                                </div>
                                <button
                                    onClick={() => openModal()}
                                    className="px-4 py-2 bg-[#752568] hover:bg-[#5e1d53] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear Usuario
                                </button>
                            </div>

                            {/* Filters & Search */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {/* Role Tabs */}
                                <div className="flex flex-wrap gap-2">
                                    {roles.map((role) => {
                                        const count = users.filter(u => u.rol === role.nombre_perfil).length;
                                        const isActive = selectedRoleFilter === role.nombre_perfil;

                                        return (
                                            <button
                                                key={role.id}
                                                onClick={() => setSelectedRoleFilter(role.nombre_perfil)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                                    ? 'bg-[#752568] text-white shadow-sm'
                                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                    }`}
                                            >
                                                {role.nombre_perfil}
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setSelectedRoleFilter('Todos')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedRoleFilter === 'Todos'
                                            ? 'bg-gray-800 text-white shadow-sm'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                    >
                                        Todos
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedRoleFilter === 'Todos' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {users.length}
                                        </span>
                                    </button>
                                </div>

                                {/* Search Input */}
                                <div className="relative w-full md:w-64">
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#752568] focus:ring-2 focus:ring-[#752568]/20 outline-none transition-all"
                                    />
                                    <div className="absolute left-3 top-2.5 text-gray-400">
                                        <Users className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Rol</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Fecha Creación</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4 text-sm text-gray-900 font-medium">{user.nombre_completo}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{user.rol}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.estado === 'Activo'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {user.estado}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500">{user.fecha_creacion}</td>
                                                <td className="py-3 px-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => openModal(user)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-gray-500">
                                                    {users.length > 0
                                                        ? 'No se encontraron usuarios con los filtros seleccionados'
                                                        : 'No hay usuarios registrados'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeTab === 'tokens' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-[#752568] flex items-center gap-2">
                                        <Key className="w-5 h-5" />
                                        Gestión de Tokens Externos
                                    </h2>
                                    <p className="text-sm text-gray-500">Administra tokens de acceso para aplicaciones externas</p>
                                </div>
                                <button
                                    onClick={() => openTokenModal()}
                                    className="px-4 py-2 bg-[#752568] hover:bg-[#5e1d53] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Generar Token
                                </button>
                            </div>

                            {/* Tabla de Tokens */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Aplicación</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Token</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Consejo Regional</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Expira</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700">Último Uso</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {tokens.map((token) => (
                                            <tr key={token.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{token.nombre_aplicacion}</p>
                                                        {token.descripcion && (
                                                            <p className="text-xs text-gray-500 mt-0.5">{token.descripcion}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                                            {token.token.substring(0, 20)}...
                                                        </code>
                                                        <button
                                                            onClick={() => copyToken(token.token)}
                                                            className="p-1 text-gray-400 hover:text-[#752568] transition-colors"
                                                            title="Copiar token"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-gray-600">
                                                        {token.consejo_regional_nombre}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                                                        token.estado === 1
                                                            ? token.esta_expirado
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {token.estado === 1 ? (
                                                            token.esta_expirado ? (
                                                                <>
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    Expirado
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Shield className="w-3 h-3" />
                                                                    Activo
                                                                </>
                                                            )
                                                        ) : (
                                                            'Inactivo'
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm">
                                                        <p className="text-gray-600">
                                                            {new Date(token.fecha_expiracion).toLocaleDateString('es-PE')}
                                                        </p>
                                                        {token.dias_hasta_expiracion !== null && (
                                                            <p className={`text-xs ${
                                                                token.dias_hasta_expiracion < 30
                                                                    ? 'text-red-600'
                                                                    : 'text-gray-500'
                                                            }`}>
                                                                {token.dias_hasta_expiracion > 0
                                                                    ? `${token.dias_hasta_expiracion} días`
                                                                    : 'Expirado'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-gray-500">
                                                        {token.ultimo_uso
                                                            ? new Date(token.ultimo_uso).toLocaleString('es-PE')
                                                            : 'Nunca'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => copyDashboardURL(token.token, token.consejo_regional_id || 1)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Copiar URL del dashboard"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRenovarToken(token)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Renovar token"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openTokenModal(token)}
                                                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteToken(token)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Desactivar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {tokens.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="7" className="py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-4 bg-gray-100 rounded-full">
                                                            <Key className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600 font-medium">No hay tokens creados</p>
                                                            <p className="text-sm text-gray-500">Genera un nuevo token para empezar</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Info adicional */}
                            {tokens.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4" />
                                        Uso de Tokens
                                    </h3>
                                    <p className="text-xs text-blue-800">
                                        Los tokens permiten acceso externo al dashboard. Usa el botón <ExternalLink className="w-3 h-3 inline" /> para copiar la URL completa o 
                                        <Copy className="w-3 h-3 inline mx-1" /> para copiar solo el token.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-[#752568]">Documento de Conformidad</h2>
                                <p className="text-sm text-gray-500">Redacta y gestiona documentos de conformidad con formato enriquecido</p>
                            </div>

                            {/* Editor Container */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                <ReactQuill
                                    theme="snow"
                                    value={conformidadText}
                                    onChange={setConformidadText}
                                    className="h-[350px] mb-12"
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            [{ 'align': [] }],
                                            ['clean']
                                        ]
                                    }}
                                />
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center pt-4">
                                <p className="text-xs text-gray-400">
                                    Tip: Utiliza la barra de herramientas para dar formato al documento.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConformidadText('')}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors border border-gray-200 flex items-center gap-2"
                                    >
                                        <Eraser className="w-4 h-4" />
                                        Limpiar
                                    </button>
                                    <button
                                        onClick={handleSaveConformidad}
                                        className="px-6 py-2 bg-[#752568] hover:bg-[#5e1d53] text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm shadow-[#752568]/20"
                                    >
                                        <Save className="w-4 h-4" />
                                        Guardar Documento
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Usuario */}
            <ModalUsuario
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                userToEdit={currentUser}
                roles={roles}
            />

            {/* Modal Token */}
            <ModalToken
                isOpen={isTokenModalOpen}
                onClose={() => setIsTokenModalOpen(false)}
                onSave={handleSaveToken}
                tokenToEdit={currentToken}
                consejosRegionales={consejosRegionales}
            />
        </MainLayout>
    );
};

export default ConfiguracionPage;
