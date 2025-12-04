import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userMenus, setUserMenus] = useState([]);
    const [menusLoading, setMenusLoading] = useState(false);

    useEffect(() => {
        // Verificar si hay un usuario guardado
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('auth_token');
        const savedMenus = localStorage.getItem('user_menus');

        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
            
            // Cargar menús del caché si existen
            if (savedMenus) {
                setUserMenus(JSON.parse(savedMenus));
            }
        }
        setLoading(false);
    }, []);

    // Función para cargar menús del backend
    const loadUserMenus = async () => {
        try {
            setMenusLoading(true);
            const response = await axios.get('/menus/by-profile');
            const menus = response.data;
            
            // Guardar en estado y localStorage
            setUserMenus(menus);
            localStorage.setItem('user_menus', JSON.stringify(menus));
            
            return menus;
        } catch (error) {
            console.error('Error al cargar menús:', error);
            // Si hay error, mantener menús en caché o vacío
            return userMenus;
        } finally {
            setMenusLoading(false);
        }
    };

    const login = async (nombreUsuario, password) => {
        try {
            console.log('🔵 Iniciando login...');

            // Hacer login directamente (sin CSRF cookie ya que usamos Bearer tokens)
            const response = await axios.post('/login', {
                nombre_usuario: nombreUsuario,
                password
            });

            console.log('🟢 Respuesta del login:', response.data);

            const { access_token, user: userData } = response.data;

            console.log('🔑 Token recibido:', access_token ? access_token.substring(0, 20) + '...' : 'NO TOKEN');

            // Guardar token y usuario
            localStorage.setItem('auth_token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            console.log('✅ Token guardado en localStorage');
            console.log('📦 Token almacenado:', localStorage.getItem('auth_token').substring(0, 20) + '...');

            // Cargar menús inmediatamente después del login
            console.log('📋 Cargando menús del usuario...');
            await loadUserMenus();

            return { success: true };
        } catch (error) {
            console.error('🔴 Error en login:', error.response?.data || error.message);
            const message = error.response?.data?.message || 'Error al iniciar sesión';
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            await axios.post('/logout');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_menus');
            setUser(null);
            setUserMenus([]);
        }
    };

    const value = {
        user,
        userMenus,
        menusLoading,
        login,
        logout,
        loading,
        loadUserMenus,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
