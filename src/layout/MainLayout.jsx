import ToastProvider from '../components/ToastProvider';
import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function MainLayout() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
        <NavBar />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet /> 
        </main>
        <footer className="py-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 transition-colors">
          © {new Date().getFullYear()} <span className="font-semibold text-gray-700 dark:text-gray-300">Sofás Valencia</span> — Sistema de Control de Accesos y Reservas
        </footer>
      </div>
    </ToastProvider>
  );
}
