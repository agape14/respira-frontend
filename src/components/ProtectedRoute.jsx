import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import useSessionMonitor from '../hooks/useSessionMonitor';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    // Monitorear la expiración de la sesión (DESHABILITADO TEMPORALMENTE)
    // useSessionMonitor();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;

