import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenya, setContrasenya] = useState('');
  const [confirmarContrasenya, setConfirmarContrasenya] = useState('');
  const [mostrarContrasenya, setMostrarContrasenya] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const { registro } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !correo.trim() || !contrasenya.trim()) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (contrasenya.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (contrasenya !== confirmarContrasenya) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await registro({
        nombre,
        correo,
        contrasenya,
        rol: 'USUARIO',
      });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 400
          ? 'Los datos ingresados no son válidos o el correo ya está en uso.'
          : 'No se pudo conectar con el servidor.');
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-md py-6">
      <div className="w-full">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-4 shadow-xs">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Crear Cuenta
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Regístrate para acceder al sistema de{' '}
            <span className="font-semibold text-orange-600">Sofás Valencia</span>
          </p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

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
                  placeholder="juan@sofavalencia.com"
                  autoComplete="email"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                htmlFor="contrasenya"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="contrasenya"
                  type={mostrarContrasenya ? 'text' : 'password'}
                  value={contrasenya}
                  onChange={(e) => setContrasenya(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                  minLength={6}
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

            {/* Repetir Contraseña */}
            <div>
              <label
                htmlFor="confirmarContrasenya"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirmarContrasenya"
                  type={mostrarContrasenya ? 'text' : 'password'}
                  value={confirmarContrasenya}
                  onChange={(e) => setConfirmarContrasenya(e.target.value)}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
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
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Crear cuenta</span>
                </>
              )}
            </button>
          </form>

          {/* Pie del formulario: Iniciar sesión */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
