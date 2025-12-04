import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExternalDashboardPage from './pages/ExternalDashboardPage';
import TamizajePage from './pages/TamizajePage';
import TamizajeDetallePage from './pages/TamizajeDetallePage';
import CitasPage from './pages/CitasPage';
import CitasRiesgoPage from './pages/CitasRiesgoPage';
import ProtocoloAtencionPage from './pages/ProtocoloAtencionPage';
import ProtocoloDetallePage from './pages/ProtocoloDetallePage';
import DerivacionesPage from './pages/DerivacionesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import PerfilesPage from './pages/PerfilesPage';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
    return (
        <BrowserRouter >
            <AuthProvider>
                <Routes>
                    {/* Ruta por defecto - redirige a login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Rutas públicas */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Dashboard externo (público - requiere token en query params) */}
                    <Route path="/external/dashboard" element={<ExternalDashboardPage />} />

                    {/* Rutas protegidas */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tamizaje"
                        element={
                            <ProtectedRoute>
                                <TamizajePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tamizaje/:dni"
                        element={
                            <ProtectedRoute>
                                <TamizajeDetallePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/citas"
                        element={
                            <ProtectedRoute>
                                <CitasPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/citas-riesgo"
                        element={
                            <ProtectedRoute>
                                <CitasRiesgoPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/protocolo"
                        element={
                            <ProtectedRoute>
                                <ProtocoloAtencionPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/protocolo/:id"
                        element={
                            <ProtectedRoute>
                                <ProtocoloDetallePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/derivaciones"
                        element={
                            <ProtectedRoute>
                                <DerivacionesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/configuracion"
                        element={
                            <ProtectedRoute>
                                <ConfiguracionPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/perfiles"
                        element={
                            <ProtectedRoute>
                                <PerfilesPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Ruta 404 */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

