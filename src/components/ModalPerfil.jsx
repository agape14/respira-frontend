import { useState, useEffect } from 'react';
import { X, Save, Shield } from 'lucide-react';

const ModalPerfil = ({ isOpen, onClose, onSave, perfilToEdit = null }) => {
    const [formData, setFormData] = useState({
        nombre_perfil: '',
        permiso_ver: false,
        permiso_editar: false,
        permiso_eliminar: false
    });

    useEffect(() => {
        if (perfilToEdit) {
            setFormData({
                nombre_perfil: perfilToEdit.nombre_perfil || '',
                permiso_ver: Boolean(perfilToEdit.permiso_ver),
                permiso_editar: Boolean(perfilToEdit.permiso_editar),
                permiso_eliminar: Boolean(perfilToEdit.permiso_eliminar)
            });
        } else {
            setFormData({
                nombre_perfil: '',
                permiso_ver: false,
                permiso_editar: false,
                permiso_eliminar: false
            });
        }
    }, [perfilToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-[#752568] flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            {perfilToEdit ? 'Editar Perfil' : 'Crear Nuevo Perfil'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Configure los permisos del {perfilToEdit ? 'perfil' : 'nuevo perfil'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Perfil <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nombre_perfil"
                            value={formData.nombre_perfil}
                            onChange={handleChange}
                            placeholder="Ej: Administrador, Terapeuta, etc."
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#752568] focus:ring-2 focus:ring-[#752568]/20 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Permisos Section */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Permisos</h3>
                        
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="permiso_ver"
                                checked={formData.permiso_ver}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-300 text-[#752568] focus:ring-[#752568]/20 cursor-pointer"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-[#752568] transition-colors">
                                    Permiso de Ver
                                </span>
                                <p className="text-xs text-gray-500">
                                    Puede visualizar información del sistema
                                </p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="permiso_editar"
                                checked={formData.permiso_editar}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-300 text-[#752568] focus:ring-[#752568]/20 cursor-pointer"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-[#752568] transition-colors">
                                    Permiso de Editar
                                </span>
                                <p className="text-xs text-gray-500">
                                    Puede modificar información existente
                                </p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="permiso_eliminar"
                                checked={formData.permiso_eliminar}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-300 text-[#752568] focus:ring-[#752568]/20 cursor-pointer"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-[#752568] transition-colors">
                                    Permiso de Eliminar
                                </span>
                                <p className="text-xs text-gray-500">
                                    Puede eliminar registros del sistema
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#752568] hover:bg-[#5e1d53] text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm shadow-[#752568]/20"
                        >
                            <Save className="w-4 h-4" />
                            {perfilToEdit ? 'Guardar Cambios' : 'Crear Perfil'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalPerfil;

