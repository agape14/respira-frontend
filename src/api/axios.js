import axios from 'axios';

// Detectar automáticamente el entorno
const getBaseURL = () => {
    // Si estamos en desarrollo (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000/api';
    }
    
    // Si estamos en producción con subdominio
    if (window.location.hostname.includes('cmp.org.pe')) {
        return 'http://172.17.16.16:84/respira/backend/public/api';
    }
    
    // Si estamos accediendo por IP directa
    if (window.location.hostname.includes('172.17.16.16')) {
        return 'http://172.17.16.16:84/respira/backend/public/api';
    }
    
    // Fallback a desarrollo
    return 'http://localhost:8000/api';
};

const baseURL = getBaseURL();

console.log('🌐 [Axios Config] baseURL:', baseURL);
console.log('🌐 [Axios Config] hostname:', window.location.hostname);

const axiosInstance = axios.create({
    baseURL: baseURL,
    // withCredentials: true,  // Comentado para usar Bearer tokens en lugar de cookies
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor para agregar el token a las peticiones
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        console.log('🔧 [Interceptor Request]', {
            url: config.url,
            token: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
            hasToken: !!token
        });

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Header Authorization agregado');
        } else {
            console.warn('⚠️ NO HAY TOKEN EN LOCALSTORAGE');
        }

        return config;
    },
    (error) => {
        console.error('❌ Error en interceptor request:', error);
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token inválido o expirado
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');

            // Evitar bucle infinito de redirección si ya estamos en login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
