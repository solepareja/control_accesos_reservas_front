import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';
import AuthLayout from './layout/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import EntradasSalidas from './pages/EntradasSalidas';
import ReservasFisio from './pages/ReservasFisio';
import ReservasSalas from './pages/ReservasSalas';
import Usuarios from './pages/Usuarios';
import Trabajadores from './pages/Trabajadores';
import Salas from './pages/Salas';
import Login from './pages/Login';
import Registro from './pages/Registro';
import ModoTablet from './pages/ModoTablet';

// Redirecciona al panel o a la tablet si el usuario ya está autenticado
function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    const isKiosko = (user?.rol || '').toUpperCase().includes('KIOSKO');
    return <Navigate to={isKiosko ? "/tablet" : "/"} replace />;
  }

  return children;
}

// Bloquea el panel administrativo para usuarios con rol KIOSKO, forzándolos a permanecer en la tablet
function MainAppRoute({ children }) {
  const { user } = useAuth();
  const isKiosko = (user?.rol || '').toUpperCase().includes('KIOSKO');

  if (isKiosko) {
    return <Navigate to="/tablet" replace />;
  }

  return children ? children : <Outlet />;
}

// Redirección inteligente por defecto según autenticación y rol
function DefaultRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isKiosko = (user?.rol || '').toUpperCase().includes('KIOSKO');
  return <Navigate to={isKiosko ? "/tablet" : "/"} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
          {/* Rutas de autenticación (SIN menú superior) */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/registro"
              element={
                <PublicOnlyRoute>
                  <Registro />
                </PublicOnlyRoute>
              }
            />
          </Route>

          {/* Rutas de la aplicación protegidas */}
          <Route element={<ProtectedRoute />}>
            {/* Modo Tablet / Kiosko (pantalla completa táctil) */}
            <Route path="/tablet" element={<ModoTablet />} />
            <Route path="/kiosko" element={<Navigate to="/tablet" replace />} />

            {/* Vistas administrativas protegidas contra rol KIOSKO (CON menú superior) */}
            <Route element={<MainAppRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                
                {/* Entradas / Salidas */}
                <Route path="/entradas-salidas" element={<EntradasSalidas />} />
                <Route path="/accesos" element={<Navigate to="/entradas-salidas" replace />} />
                
                {/* Reservas Fisio */}
                <Route path="/reservas-fisio" element={<ReservasFisio />} />
                <Route path="/fisio" element={<Navigate to="/reservas-fisio" replace />} />
                
                {/* Reservas Salas */}
                <Route path="/reservas-salas" element={<ReservasSalas />} />
                <Route path="/gestion-salas" element={<Salas />} />
                <Route path="/salas" element={<Navigate to="/reservas-salas" replace />} />

                {/* Gestión de Usuarios */}
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/trabajadores" element={<Trabajadores />} />
                <Route path="/empleados" element={<Navigate to="/trabajadores" replace />} />
                <Route path="/gestion-usuarios" element={<Navigate to="/usuarios" replace />} />
              </Route>
            </Route>
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
}
