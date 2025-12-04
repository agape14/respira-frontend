import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import {
    Plus, Edit, Trash2, Shield, Settings, X, Save, AlertCircle
} from 'lucide-react';
import api from '../api/axios';

const PerfilesPage = () => {
    const [perfiles, setPerfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'inactivos'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
    const [editingPerfil, setEditingPerfil] = useState(null);
    const [formData, setFormData] = useState({
        nombre_perfil: '',
        descripcion: ''
    });
    const [menus, setMenus] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [selectedPerfilId, setSelectedPerfilId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Filtrar perfiles por estado
    const perfilesFiltrados = perfiles.filter(perfil => {
        if (activeTab === 'activos') {
            return perfil.estado === 1 || perfil.estado === true;
        } else {
            return perfil.estado === 0 || perfil.estado === false;
        }
    });

    useEffect(() => {
        fetchPerfiles();
    }, []);

    const fetchPerfiles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/perfiles');
            setPerfiles(response.data);
        } catch (error) {
            console.error('Error al cargar perfiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (perfil = null) => {
        if (perfil) {
            setEditingPerfil(perfil);
            setFormData({
                nombre_perfil: perfil.nombre_perfil,
                descripcion: perfil.descripcion || ''
            });
        } else {
            setEditingPerfil(null);
            setFormData({
                nombre_perfil: '',
                descripcion: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPerfil(null);
        setFormData({
            nombre_perfil: '',
            descripcion: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingPerfil) {
                await api.put(`/perfiles/${editingPerfil.id}`, formData);
            } else {
                await api.post('/perfiles', formData);
            }
            
            fetchPerfiles();
            handleCloseModal();
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            alert(error.response?.data?.message || 'Error al guardar el perfil');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este perfil?')) return;

        try {
            await api.delete(`/perfiles/${id}`);
            fetchPerfiles();
        } catch (error) {
            console.error('Error al eliminar perfil:', error);
            alert(error.response?.data?.message || 'Error al eliminar el perfil');
        }
    };

    const handleOpenPermisosModal = async (perfilId) => {
        try {
            setSelectedPerfilId(perfilId);
            
            // Cargar menús y permisos
            const [menusRes, permisosRes] = await Promise.all([
                api.get('/menus'),
                api.get(`/perfiles/${perfilId}/permisos`)
            ]);

            setMenus(menusRes.data);
            
            // Convertir array de permisos a objeto para facilitar el manejo
            const permisosObj = {};
            permisosRes.data.forEach(permiso => {
                permisosObj[permiso.menu_id] = {
                    permiso_ver: permiso.permiso_ver,
                    permiso_editar: permiso.permiso_editar,
                    permiso_eliminar: permiso.permiso_eliminar
                };
            });
            
            setPermisos(permisosObj);
            setIsPermisosModalOpen(true);
        } catch (error) {
            console.error('Error al cargar permisos:', error);
            alert('Error al cargar los permisos');
        }
    };

    const handleClosePermisosModal = () => {
        setIsPermisosModalOpen(false);
        setSelectedPerfilId(null);
        setPermisos({});
        setMenus([]);
    };

    const handlePermisoChange = (menuId, tipo, valor) => {
        setPermisos(prev => ({
            ...prev,
            [menuId]: {
                ...prev[menuId],
                [tipo]: valor
            }
        }));
    };

    const handleSavePermisos = async () => {
        setSubmitting(true);
        
        try {
            // Convertir objeto de permisos a array
            const permisosArray = Object.keys(permisos).map(menuId => ({
                menu_id: parseInt(menuId),
                permiso_ver: permisos[menuId]?.permiso_ver || false,
                permiso_editar: permisos[menuId]?.permiso_editar || false,
                permiso_eliminar: permisos[menuId]?.permiso_eliminar || false
            }));

            await api.post(`/perfiles/${selectedPerfilId}/permisos`, {
                permisos: permisosArray
            });

            alert('Permisos actualizados correctamente');
            handleClosePermisosModal();
        } catch (error) {
            console.error('Error al guardar permisos:', error);
            alert('Error al guardar los permisos');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Perfiles</h1>
                        <p className="text-gray-500">Administra los perfiles y sus permisos de acceso</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#752568] text-white rounded-lg hover:bg-[#5a1d4f] transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Perfil
                    </button>
                </div>

                {/* Tabs Activos/Inactivos */}
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setActiveTab('activos')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'activos'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Perfiles Activos
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            {perfiles.filter(p => p.estado === 1 || p.estado === true).length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('inactivos')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'inactivos'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Perfiles Inactivos
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                            {perfiles.filter(p => p.estado === 0 || p.estado === false).length}
                        </span>
                    </button>
                </div>

                {/* Tabla de Perfiles */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre del Perfil</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        Cargando perfiles...
                                    </td>
                                </tr>
                            ) : perfilesFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No hay perfiles {activeTab === 'activos' ? 'activos' : 'inactivos'}
                                    </td>
                                </tr>
                            ) : (
                                perfilesFiltrados.map((perfil) => (
                                    <tr key={perfil.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{perfil.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-5 h-5 text-[#752568]" />
                                                <span className="text-sm font-medium text-gray-900">{perfil.nombre_perfil}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{perfil.descripcion || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenPermisosModal(perfil.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Configurar permisos"
                                                >
                                                    <Settings className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(perfil)}
                                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                {perfil.id !== 1 && (
                                                    <button
                                                        onClick={() => handleDelete(perfil.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal Crear/Editar Perfil */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                                <form onSubmit={handleSubmit}>
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg leading-6 font-medium text-[#752568]">
                                                {editingPerfil ? 'Editar Perfil' : 'Nuevo Perfil'}
                                            </h3>
                                            <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nombre del Perfil *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.nombre_perfil}
                                                    onChange={(e) => setFormData({ ...formData, nombre_perfil: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Descripción
                                                </label>
                                                <textarea
                                                    value={formData.descripcion}
                                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                    rows="3"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#752568] text-base font-medium text-white hover:bg-[#5a1d4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#752568] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                        >
                                            {submitting ? 'Guardando...' : 'Guardar'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Permisos */}
                {isPermisosModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClosePermisosModal}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full relative">
                                {/* Loading Overlay dentro del modal */}
                                {submitting && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#752568]"></div>
                                            <p className="text-sm text-gray-600 font-medium">Guardando permisos...</p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg leading-6 font-medium text-[#752568]">
                                            Configurar Permisos de Menú
                                        </h3>
                                        <button type="button" onClick={handleClosePermisosModal} className="text-gray-400 hover:text-gray-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Menú</th>
                                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ver</th>
                                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Editar</th>
                                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Eliminar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {menus.map((menu) => (
                                                    <tr key={menu.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">{menu.nombre_menu}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={permisos[menu.id]?.permiso_ver || false}
                                                                onChange={(e) => handlePermisoChange(menu.id, 'permiso_ver', e.target.checked)}
                                                                className="rounded border-gray-300 text-[#752568] focus:ring-[#752568]"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={permisos[menu.id]?.permiso_editar || false}
                                                                onChange={(e) => handlePermisoChange(menu.id, 'permiso_editar', e.target.checked)}
                                                                className="rounded border-gray-300 text-[#752568] focus:ring-[#752568]"
                                                                disabled={!permisos[menu.id]?.permiso_ver}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={permisos[menu.id]?.permiso_eliminar || false}
                                                                onChange={(e) => handlePermisoChange(menu.id, 'permiso_eliminar', e.target.checked)}
                                                                className="rounded border-gray-300 text-[#752568] focus:ring-[#752568]"
                                                                disabled={!permisos[menu.id]?.permiso_ver}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleSavePermisos}
                                        disabled={submitting}
                                        className="w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#752568] text-base font-medium text-white hover:bg-[#5a1d4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#752568] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {submitting ? 'Guardando...' : 'Guardar Permisos'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClosePermisosModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Información sobre perfiles</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>El perfil <strong>Administrador</strong> tiene acceso completo a todo el sistema</li>
                            <li>Los perfiles <strong>MINSA</strong> y <strong>ESSALUD</strong> solo pueden acceder al menú de derivaciones</li>
                            <li>El perfil <strong>Psicólogo</strong> solo puede ver sus propias citas y protocolos</li>
                            <li>El perfil <strong>Enrolador</strong> tiene acceso limitado según los permisos configurados</li>
                        </ul>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PerfilesPage;

