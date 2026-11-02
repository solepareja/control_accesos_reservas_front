import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasenya, setContrasenya] = useState('');
  const [mostrarContrasenya, setMostrarContrasenya] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!correo.trim() || !contrasenya.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setCargando(true);
    try {
      const data = await login(correo, contrasenya);
      const isKiosko = (data?.rol || '').toUpperCase().includes('KIOSKO');
      if (isKiosko) {
        navigate('/tablet', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 400
          ? 'Correo o contraseña incorrectos.'
          : 'No se pudo conectar con el servidor.');
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  const rellenarAdmin = () => {
    setCorreo('admin@sofavalencia.com');
    setContrasenya('admin123');
    setError(null);
  };

  const rellenarKiosko = () => {
    setCorreo('kiosko@sofavalencia.com');
    setContrasenya('kiosko123');
    setError(null);
  };

  return (
    <div className="w-full max-w-md py-6">
      <div className="w-full">
        {/* Cabecera del logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-4 shadow-xs">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Accede al sistema de reservas y control de accesos de{' '}
            <span className="font-semibold text-orange-600">Sofás Valencia</span>
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Correo */}
            <div>
              <label
                htmlFor="correo"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@sofavalencia.com"
                  autoComplete="email"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="contrasenya"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="contrasenya"
                  type={mostrarContrasenya ? 'text' : 'password'}
                  value={contrasenya}
                  onChange={(e) => setContrasenya(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasenya(!mostrarContrasenya)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={mostrarContrasenya ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarContrasenya ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm tracking-wide shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {cargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Pie del formulario: Crear cuenta */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/registro"
                className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
