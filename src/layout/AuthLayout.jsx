import ToastProvider from '../components/ToastProvider';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function AuthLayout() {
  const { esOscuro, toggleTheme } = useTheme();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-gray-100 flex flex-col justify-between font-sans transition-colors duration-200 relative">
        {/* Botón flotante para alternar tema en login / registro */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
            aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
          >
            {esOscuro ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>
        </div>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} <span className="font-semibold text-gray-700 dark:text-gray-300">Sofás Valencia</span> — Sistema de Control de Accesos y Reservas
        </footer>
      </div>
    </ToastProvider>
  );
}
