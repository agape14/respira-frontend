import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    User, Lock, Eye, EyeOff, Heart, Shield, 
    Activity, Users, Stethoscope, Building, BarChart3
} from 'lucide-react';

const LoginPage = () => {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const usuarioInputRef = useRef(null);

    // Enfocar el campo de usuario al montar el componente
    useEffect(() => {
        if (usuarioInputRef.current) {
            usuarioInputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(nombreUsuario, password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Credenciales incorrectas');
        }
        
        setLoading(false);
    };

    const testUsers = [
        {
            icon: User,
            name: 'Admin (Acceso completo)',
            username: 'admin',
            password: 'admin123',
            color: 'text-primary-600',
        },
        {
            icon: Users,
            name: 'Enrolador (Sin configuración)',
            username: 'enrolador',
            password: 'enrolador123',
            color: 'text-primary-600',
        },
        {
            icon: Stethoscope,
            name: 'Maria Gonzales (Solo sus pacientes)',
            username: 'Maria Gonzales',
            password: 'maria123',
            color: 'text-primary-600',
        },
        {
            icon: Building,
            name: 'EsSalud Rebagliati',
            username: 'essalud-rebagliati',
            password: 'essalud123',
            color: 'text-primary-600',
        },
        {
            icon: Building,
            name: 'EsSalud Almenara',
            username: 'essalud-almenara',
            password: 'essalud123',
            color: 'text-primary-600',
        },
        {
            icon: Building,
            name: 'MINSA Loayza',
            username: 'minsa-loayza',
            password: 'minsa123',
            color: 'text-primary-600',
        },
        {
            icon: Building,
            name: 'MINSA Arzobispo',
            username: 'minsa-arzobispo',
            password: 'minsa123',
            color: 'text-primary-600',
        },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sección Izquierda - Información (Diseño de Figma) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#752568] via-[#5a1d4f] to-[#752568] overflow-hidden">
                {/* Overlay con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#752568]/90 via-[#5a1d4f]/80 to-[#752568]/90 z-10"></div>
                
                {/* Imagen de fondo */}
                <img 
                    src="https://images.unsplash.com/photo-1758691462493-120a069304e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwaGVhbHRofGVufDF8fHx8MTc2MjM2MzczOHww&ixlib=rb-4.1.0&q=80&w=1080" 
                    alt="Medical Professional" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Contenido sobre la imagen */}
                <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
                    {/* Header - Logo y Branding */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-14 h-14 bg-[#F8AD1D] rounded-xl flex items-center justify-center shadow-lg">
                                <Heart className="h-8 w-8 text-white" fill="currentColor" strokeWidth={2} />
                            </div>
                            <div>
                                <h1 className="text-white text-2xl font-bold">Sistema de Gestión</h1>
                                <p className="text-[#F8AD1D] text-sm font-medium">Colegio Médico del Perú</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Central */}
                    <div className="space-y-6">
                        <h2 className="text-white text-4xl font-bold leading-tight max-w-lg">
                            Plataforma de Gestión y Acompañamiento del Programa RESPIRA
                        </h2>
                        <p className="text-white/90 text-lg max-w-md leading-relaxed">
                            Sistema integral para la administración de citas, seguimiento profesional, soporte emocional y gestión de intervenciones del Programa RESPIRA dirigido a médicos SERUMS en todo el país.
                        </p>
                        
                        {/* Características */}
                        <div className="space-y-4 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-[#F8AD1D]" strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Seguro y Confidencial</p>
                                    <p className="text-white/70 text-sm">Protección estricta de datos sensibles y manejo profesional de la información.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <Stethoscope className="h-5 w-5 text-[#F8AD1D]" strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Acompañamiento Integral</p>
                                    <p className="text-white/70 text-sm">Herramientas para la coordinación psicológica, legal, emocional y de riesgo del médico SERUMS.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5 text-[#F8AD1D]" strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Gestión Eficiente</p>
                                    <p className="text-white/70 text-sm">Optimiza el flujo de trabajo del equipo RESPIRA y facilita la trazabilidad de casos.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-white/70 text-sm">
                        © 2025 Colegio Médico del Perú
                    </div>
                </div>

                {/* Efectos decorativos animados */}
                <div className="absolute top-20 right-20 w-40 h-40 bg-[#F8AD1D] rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-20 right-40 w-60 h-60 bg-[#F8AD1D] rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Sección Derecha - Formulario */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo Mobile */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="bg-accent-500 p-2 rounded-lg">
                                <Heart className="w-6 h-6 text-white" fill="currentColor" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-primary-900">Sistema de Gestión</h1>
                            </div>
                        </div>
                    </div>

                    {/* Formulario de Login */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
                            <p className="text-gray-600">
                                Ingresa tus credenciales para acceder al sistema
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campo Usuario */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre de Usuario
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        ref={usuarioInputRef}
                                        type="text"
                                        value={nombreUsuario}
                                        onChange={(e) => setNombreUsuario(e.target.value)}
                                        style={{
                                            borderColor: '#d1d5db'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#752568'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                        className="w-full pl-10 pr-4 py-3 
                                                 border rounded-lg 
                                                 outline-none transition-all duration-200
                                                 placeholder:text-gray-400
                                                 bg-white"
                                        placeholder="Ingrese su nombre de usuario"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Campo Contraseña */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{
                                            borderColor: '#d1d5db'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#752568'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                        className="w-full pl-10 pr-12 py-3 
                                                 border rounded-lg 
                                                 outline-none transition-all duration-200
                                                 placeholder:text-gray-400
                                                 bg-white"
                                        placeholder="Ingrese su contraseña"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                                 text-gray-400 hover:text-gray-600 transition-colors
                                                 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Mensaje de Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Botón de Login - Extraído de Figma */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-gradient-to-r from-[#752568] to-[#5a1d4f] 
                                         hover:from-[#5a1d4f] hover:to-[#752568] 
                                         text-white font-semibold rounded-lg 
                                         shadow-lg hover:shadow-xl 
                                         transition-all duration-300 
                                         hover:scale-[1.02] 
                                         disabled:opacity-50 disabled:cursor-not-allowed 
                                         disabled:hover:scale-100
                                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            >
                                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </button>
                        </form>

                        {/* Usuarios de Prueba 
                        <div className="mt-8">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                                <h3 className="text-sm font-semibold text-gray-700">Usuarios de prueba:</h3>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {testUsers.map((user, index) => {
                                    const IconComponent = user.icon;
                                    return (
                                        <div
                                            key={index}
                                            className="bg-gray-50 p-3 rounded-lg text-xs 
                                                     hover:bg-primary-50 hover:border-primary-200 
                                                     transition-all duration-200 border border-transparent
                                                     cursor-default"
                                        >
                                            <div className="flex items-center space-x-2 mb-1">
                                                <IconComponent className={`w-4 h-4 ${user.color}`} />
                                                <span className="font-medium text-gray-700">{user.name}</span>
                                            </div>
                                            <div className="text-gray-600 ml-6">
                                                Usuario: <span className="font-mono font-semibold text-gray-800">{user.username}</span> | 
                                                Contraseña: <span className="font-mono font-semibold text-gray-800">{user.password}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
