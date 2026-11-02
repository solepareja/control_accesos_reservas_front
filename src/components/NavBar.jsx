import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X,
  LogOut,
  User as UserIcon,
  LogIn,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function NavBar() {
  const [mobileMenuPath, setMobileMenuPath] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { esOscuro, toggleTheme } = useTheme();

  const mobileMenuOpen = mobileMenuPath === location.pathname;

  const handleLogout = () => {
    logout();
    setMobileMenuPath(null);
    navigate('/login');
  };

  const navLinks = [
    {
      name: 'Inicio',
      to: '/',
      exact: true,
    },
    {
      name: 'Entradas/Salidas',
      to: '/entradas-salidas',
      aliases: ['/accesos'],
    },
    {
      name: 'Fisio',
      shortName: 'Fisio',
      to: '/reservas-fisio',
      aliases: ['/fisio'],
    },
    {
      name: 'Salas',
      shortName: 'Salas',
      to: '/reservas-salas',
      aliases: ['/salas', '/gestion-salas'],
    },
    {
      name: 'Trabajadores',
      to: '/trabajadores',
      aliases: ['/empleados'],
    },
    {
      name: 'Usuarios',
      shortName: 'Usuarios',
      to: '/usuarios',
      aliases: ['/gestion-usuarios'],
    },
  ];

  const isLinkActive = (link) => {
    if (link.exact) {
      return location.pathname === link.to;
    }
    return (
      location.pathname.startsWith(link.to) ||
      (link.aliases && link.aliases.some((alias) => location.pathname.startsWith(alias)))
    );
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Nombre Sofás Valencia */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex flex-col">
                <span className="font-extrabold text-orange-500 text-xl sm:text-2xl leading-none tracking-tight">
                  Sofás Valencia
                </span>
              </div>
            </Link>
          </div>

          {/* Menú de Escritorio (visible en >= lg) */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    active
                      ? 'bg-orange-500/10 text-orange-500 font-bold dark:bg-orange-500/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Separador */}
            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2" />

            {/* Botón Sol / Luna para alternar modo claro y noche en la web */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent dark:border-slate-700/60"
              title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
              aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
            >
              {esOscuro ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>

            {/* Sección Usuario / Auth */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                    {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight max-w-[120px] truncate">
                      {user.nombre}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar sesión</span>
              </Link>
            )}
          </div>

          {/* Zona Móvil */}
          <div className="flex items-center lg:hidden gap-1.5">
            {/* Botón Sol / Luna móvil */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
              aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
            >
              {esOscuro ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>

            {user && (
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-200 dark:border-orange-800">
                {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => setMobileMenuPath(mobileMenuOpen ? null : location.pathname)}
              type="button"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              ) : (
                <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 pt-2 pb-4 space-y-1 shadow-lg">
          {/* Info usuario móvil */}
          {user ? (
            <div className="p-3 mb-2 rounded-xl bg-orange-50/50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                  {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.nombre}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.correo}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <div className="p-2 mb-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuPath(null)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar sesión</span>
              </Link>
            </div>
          )}

          {navLinks.map((link) => {
            const active = isLinkActive(link);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuPath(null)}
                className={`block px-3 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  active
                    ? 'bg-orange-500/10 text-orange-500 font-bold dark:bg-orange-500/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
