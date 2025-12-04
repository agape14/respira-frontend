import { useState, useEffect } from 'react';
import { X, Key, Calendar, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const ModalToken = ({ isOpen, onClose, onSave, tokenToEdit, consejosRegionales }) => {
    const [formData, setFormData] = useState({
        nombre_aplicacion: '',
        descripcion: '',
        consejo_regional_id: '',
        duracion_dias: 365,
        estado: 1
    });

    useEffect(() => {
        if (tokenToEdit) {
            setFormData({
                nombre_aplicacion: tokenToEdit.nombre_aplicacion || '',
                descripcion: tokenToEdit.descripcion || '',
                consejo_regional_id: tokenToEdit.consejo_regional_id || '',
                duracion_dias: 365,
                estado: tokenToEdit.estado ?? 1
            });
        } else {
            setFormData({
                nombre_aplicacion: '',
                descripcion: '',
                consejo_regional_id: '',
                duracion_dias: 365,
                estado: 1
            });
        }
    }, [tokenToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#752568] to-[#5e1d53] p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Key className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {tokenToEdit ? 'Editar Token Externo' : 'Generar Nuevo Token'}
                                </h2>
                                <p className="text-purple-200 text-sm">
                                    {tokenToEdit ? 'Modifica la configuración del token' : 'Crea un nuevo token de acceso externo'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Alerta informativa para nuevos tokens */}
                    {!tokenToEdit && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Información importante:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>El token se generará automáticamente</li>
                                    <li>Guarda el token en un lugar seguro</li>
                                    <li>Podrás renovar o desactivar el token después</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Nombre de la Aplicación */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre de la Aplicación *
                        </label>
                        <input
                            type="text"
                            name="nombre_aplicacion"
                            value={formData.nombre_aplicacion}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Sistema Regional Lima"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre identificativo de la aplicación que usará este token
                        </p>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Describe el propósito de este token..."
                        />
                    </div>

                    {/* Consejo Regional */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Consejo Regional
                        </label>
                        <select
                            name="consejo_regional_id"
                            value={formData.consejo_regional_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Todos los Consejos Regionales</option>
                            {consejosRegionales.map((consejo) => (
                                <option key={consejo.id} value={consejo.id}>
                                    {consejo.nombre}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Si no seleccionas ninguno, el token tendrá acceso a todos los consejos
                        </p>
                    </div>

                    {/* Duración (solo para nuevos tokens) */}
                    {!tokenToEdit && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Duración (días) *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, duracion_dias: 90 }))}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        formData.duracion_dias === 90
                                            ? 'bg-[#752568] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    3 meses
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, duracion_dias: 180 }))}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        formData.duracion_dias === 180
                                            ? 'bg-[#752568] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    6 meses
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, duracion_dias: 365 }))}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        formData.duracion_dias === 365
                                            ? 'bg-[#752568] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    1 año
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, duracion_dias: 730 }))}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        formData.duracion_dias === 730
                                            ? 'bg-[#752568] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    2 años
                                </button>
                            </div>
                            <div className="mt-3">
                                <input
                                    type="number"
                                    name="duracion_dias"
                                    value={formData.duracion_dias}
                                    onChange={handleChange}
                                    min="1"
                                    max="3650"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#752568] focus:border-transparent outline-none transition-all"
                                    placeholder="O ingresa días personalizados"
                                />
                            </div>
                        </div>
                    )}

                    {/* Estado (solo para edición) */}
                    {tokenToEdit && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Estado
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="estado"
                                        value="1"
                                        checked={formData.estado === 1}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estado: parseInt(e.target.value) }))}
                                        className="w-4 h-4 text-[#752568] focus:ring-[#752568]"
                                    />
                                    <span className="text-sm text-gray-700">Activo</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="estado"
                                        value="0"
                                        checked={formData.estado === 0}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estado: parseInt(e.target.value) }))}
                                        className="w-4 h-4 text-[#752568] focus:ring-[#752568]"
                                    />
                                    <span className="text-sm text-gray-700">Inactivo</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-2.5 bg-[#752568] hover:bg-[#5e1d53] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#752568]/20"
                        >
                            {tokenToEdit ? 'Actualizar Token' : 'Generar Token'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

ModalToken.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    tokenToEdit: PropTypes.object,
    consejosRegionales: PropTypes.array.isRequired,
};

export default ModalToken;

