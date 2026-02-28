import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Home, FileText, Calendar, AlertCircle, ClipboardList,
    Send, Settings, LogOut, Heart, Menu, X, ChevronDown
} from 'lucide-react';

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, userMenus, menusLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Mapeo de iconos según la URL del menú
    const getIconByUrl = (url) => {
        const iconMap = {
            '/dashboard': Home,
            '/tamizaje': FileText,
            '/citas': Calendar,
            '/citas-riesgo': AlertCircle,
            '/protocolo': ClipboardList,
            '/derivaciones': Send,
            '/configuracion': Settings,
            '/perfiles': Settings,
        };
        return iconMap[url] || FileText;
    };

    // Transformar los menús del contexto al formato del frontend
    const menuItems = userMenus.map(menu => ({
        name: menu.nombre_menu,
        path: menu.url,
        icon: getIconByUrl(menu.url),
        permiso_ver: menu.permiso_ver,
        permiso_editar: menu.permiso_editar,
        permiso_eliminar: menu.permiso_eliminar,
    }));

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 
                bg-gradient-to-b from-[#752568] via-[#5a1d4f] to-[#752568]
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#F8AD1D] rounded-lg flex items-center justify-center">
                                <Heart className="w-6 h-6 text-white" fill="currentColor" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg">Sistema de Gestión</h1>
                                <p className="text-[#F8AD1D] text-xs">Colegio Médico</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                        {menusLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : menuItems.length === 0 ? (
                            <div className="text-center text-white/60 text-sm py-8">
                                No hay menús disponibles
                            </div>
                        ) : (
                            menuItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            setSidebarOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                            text-left transition-all duration-200
                                            ${active 
                                                ? 'bg-[#F8AD1D] text-white shadow-lg' 
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                            }
                                        `}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </button>
                                );
                            })
                        )}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                     text-white/80 hover:bg-white/10 hover:text-white
                                     transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay para mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                            >
                                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>

                            {/* Title */}
                            <div className="flex-1 lg:flex-none">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Evaluaciones Psicológicas
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Colegio Médico del Perú - Serumistas
                                </p>
                            </div>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                        {user?.perfil?.nombre_perfil
                                            ? `${user.perfil.nombre_perfil}: ${user?.nombre_completo || 'Usuario'}`
                                            : (user?.nombre_completo || 'Usuario')}
                                    </span>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#752568] to-[#5a1d4f] flex items-center justify-center text-white font-bold">
                                        {user?.nombre_completo?.charAt(0) || 'U'}
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

