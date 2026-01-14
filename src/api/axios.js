import axios from 'axios';

// Detectar automáticamente el entorno
const getBaseURL = () => {
    const protocol = window.location.protocol; // http: o https:
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Si estamos en desarrollo (localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8082';
    }

    // Si estamos en producción (respira.cmp.org.pe)
    if (hostname.includes('cmp.org.pe')) {
        // Usar el mismo protocolo, hostname y puerto que el frontend
        // El alias /api en Apache se encarga de enrutar al backend
        // Si no hay puerto explícito (puerto 443 para HTTPS o 80 para HTTP), no incluirlo en la URL
        const portSuffix = port ? `:${port}` : '';
        return `${protocol}//${hostname}${portSuffix}/api`;
    }

    // Si estamos accediendo por IP directa (172.17.16.16)
    if (hostname.includes('172.17.16.16')) {
        // Usar el mismo protocolo, hostname y puerto que el frontend
        return `${protocol}//${hostname}:${port}/api`;
    }

    // Si estamos en dominio .test (Laragon local en servidor)
    if (hostname.includes('.test')) {
        // Usar el mismo protocolo, hostname y puerto que el frontend
        return `${protocol}//${hostname}:${port}/api`;
    }

    // Fallback a desarrollo
    return 'http://localhost:8082';
};

const baseURL = getBaseURL();

// Logs removidos para producción
// console.log('🌐 [Axios Config] baseURL:', baseURL);
// console.log('🌐 [Axios Config] hostname:', window.location.hostname);
// console.log('🔒 [Axios Config] protocol:', window.location.protocol);

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor para agregar el token a las peticiones
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        // Logs removidos para producción
        // console.log('🔧 [Interceptor Request]', {
        //     url: config.url,
        //     token: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
        //     hasToken: !!token
        // });

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log('✅ Header Authorization agregado');
        }
        // else {
        //     console.warn('⚠️ NO HAY TOKEN EN LOCALSTORAGE');
        // }

        return config;
    },
    (error) => {
        // Log removido para producción
        // console.error('❌ Error en interceptor request:', error);
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token inválido o expirado - responder inmediatamente sin esperar más
            // Log removido para producción
            // console.warn('⚠️ Error 401: Token inválido o expirado');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_menus');

            // Evitar bucle infinito de redirección si ya estamos en login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
