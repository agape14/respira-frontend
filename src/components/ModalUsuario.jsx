import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const ModalUsuario = ({ isOpen, onClose, onSave, userToEdit = null, roles = [] }) => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        perfil_id: '',
        password: ''
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                nombre_completo: userToEdit.nombre_completo || '',
                email: userToEdit.email || '',
                perfil_id: userToEdit.perfil_id || '',
                password: '' // Don't show password on edit
            });
        } else {
            setFormData({
                nombre_completo: '',
                email: '',
                perfil_id: '',
                password: ''
            });
        }
    }, [userToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
                        <h2 className="text-xl font-bold text-[#752568]">
                            {userToEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Complete los datos del {userToEdit ? 'usuario' : 'nuevo usuario'} del sistema
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            name="nombre_completo"
                            value={formData.nombre_completo}
                            onChange={handleChange}
                            placeholder="Ej: Dr. Juan Pérez"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#752568] focus:ring-2 focus:ring-[#752568]/20 outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="correo@ejemplo.com"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#752568] focus:ring-2 focus:ring-[#752568]/20 outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol
                        </label>
                        <select
                            name="perfil_id"
                            value={formData.perfil_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#752568] focus:ring-2 focus:ring-[#752568]/20 outline-none transition-all bg-white"
                            required
                        >
                            <option value="">Seleccione rol</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.nombre_perfil}</option>
                            ))}
                        </select>
                    </div>

                    {/* Password field - required only for new users, optional for edit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {userToEdit ? 'Contraseña (Dejar en blanco para mantener actual)' : 'Contraseña'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#752568] focus:ring-2 focus:ring-[#752568]/20 outline-none transition-all"
                            required={!userToEdit}
                            minLength={6}
                        />
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
                            {userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalUsuario;
