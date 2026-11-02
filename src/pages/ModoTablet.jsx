import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  LogOut, 
  User, 
  CreditCard, 
  Building2, 
  ClipboardList, 
  Clock, 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Sun,
  Moon
} from 'lucide-react';
import api from '../services/api';
import SignaturePad from '../components/SignaturePad';
import { validarDniNie } from '../utils/dniValidator';

export default function ModoTablet() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isKiosko = (user?.rol || '').toUpperCase().includes('KIOSKO');

  // Modo oscuro / claro: predeterminado en MODO CLARO (false)
  const [modoOscuro, setModoOscuro] = useState(() => {
    try {
      const guardado = localStorage.getItem('tablet_theme');
      if (guardado) return guardado === 'dark';
      return false; // Predeterminado: Modo Claro
    } catch {
      return false;
    }
  });

  const toggleTema = () => {
    setModoOscuro((prev) => {
      const nuevo = !prev;
      try {
        localStorage.setItem('tablet_theme', nuevo ? 'dark' : 'light');
      } catch {}
      return nuevo;
    });
  };

  const [modo, setModo] = useState('entrada'); // 'entrada' o 'salida'
  const [reloj, setReloj] = useState(new Date());

  const handleCerrarSesionKiosko = () => {
    logout();
    navigate('/login');
  };

  // Estado para Entrada
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [motivoVisita, setMotivoVisita] = useState('');
  const [firma, setFirma] = useState('');
  const [editarFechaHora, setEditarFechaHora] = useState(false);
  const [fechaEntradaCustom, setFechaEntradaCustom] = useState('');
  const [horaEntradaCustom, setHoraEntradaCustom] = useState('');

  // Estado para Salida (personas dentro)
  const [personasDentro, setPersonasDentro] = useState([]);
  const [cargandoDentro, setCargandoDentro] = useState(false);
  const [busquedaSalida, setBusquedaSalida] = useState('');
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [editarHoraSalida, setEditarHoraSalida] = useState(false);
  const [horaSalidaCustom, setHoraSalidaCustom] = useState('');

  // Estados de proceso y feedback
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [pantallaExito, setPantallaExito] = useState(null); // { tipo: 'entrada'|'salida', nombre, hora }

  // Actualizar reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setReloj(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatearHora = (d) => {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatearHoraCorta = (d) => {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatearFechaLarga = (d) => {
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatIsoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Cargar personas actualmente dentro
  const cargarPersonasDentro = async () => {
    setCargandoDentro(true);
    try {
      const res = await api.get('/api/accesos/activos');
      setPersonasDentro(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando activos:', err);
      try {
        const todos = await api.get('/api/accesos');
        const activos = (Array.isArray(todos.data) ? todos.data : []).filter(
          (a) => !a.fechaHoraSalida && !a.fechaSalida
        );
        setPersonasDentro(activos);
      } catch (e) {
        console.error('Error de respaldo:', e);
      }
    } finally {
      setCargandoDentro(false);
    }
  };

  useEffect(() => {
    if (modo === 'salida') {
      cargarPersonasDentro();
    }
  }, [modo]);

  // Manejo de Registro de Entrada
  const handleRegistrarEntrada = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('Por favor, indica tu nombre completo.');
      return;
    }

    if (!dni.trim()) {
      setError('Por favor, indica tu DNI / NIE o documento.');
      return;
    }

    const dniVal = validarDniNie(dni);
    if (!dniVal.valido) {
      setError(dniVal.error);
      return;
    }

    if (!firma) {
      setError('Es obligatorio firmar en el recuadro para registrar la entrada.');
      return;
    }

    setGuardando(true);
    try {
      const ahora = new Date();
      let fechaHoraIso;

      if (editarFechaHora && fechaEntradaCustom && horaEntradaCustom) {
        fechaHoraIso = `${fechaEntradaCustom}T${horaEntradaCustom.length === 5 ? horaEntradaCustom + ':00' : horaEntradaCustom}`;
      } else if (editarFechaHora && horaEntradaCustom) {
        fechaHoraIso = `${formatIsoDate(ahora)}T${horaEntradaCustom.length === 5 ? horaEntradaCustom + ':00' : horaEntradaCustom}`;
      } else {
        const pad = (n) => String(n).padStart(2, '0');
        fechaHoraIso = `${formatIsoDate(ahora)}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
      }

      await api.post('/api/accesos/entrada', {
        nombre: nombre.trim(),
        dni: dniVal.dniFormateado,
        fechaHoraEntrada: fechaHoraIso,
        firma: firma,
        empresa: empresa.trim() || null,
        motivoVisita: motivoVisita.trim() || null,
      });

      setPantallaExito({
        tipo: 'entrada',
        nombre: nombre.trim(),
        hora: formatearHoraCorta(new Date(fechaHoraIso)),
      });

      // Limpiar formulario
      setNombre('');
      setDni('');
      setEmpresa('');
      setMotivoVisita('');
      setFirma('');
      setEditarFechaHora(false);
      setFechaEntradaCustom('');
      setHoraEntradaCustom('');
    } catch (err) {
      console.error('Error registrando entrada:', err);
      setError(err.response?.data?.message || 'No se pudo registrar la entrada. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Abrir modal de salida con persona seleccionada
  const seleccionarParaSalida = (persona) => {
    setPersonaSeleccionada(persona);
    setEditarHoraSalida(false);
    setHoraSalidaCustom(formatearHoraCorta(new Date()));
    setError(null);
  };

  // Confirmar Registro de Salida
  const handleConfirmarSalida = async () => {
    if (!personaSeleccionada) return;
    setGuardando(true);
    setError(null);

    try {
      const ahora = new Date();
      let fechaHoraIso;
      if (editarHoraSalida && horaSalidaCustom) {
        fechaHoraIso = `${formatIsoDate(ahora)}T${horaSalidaCustom.length === 5 ? horaSalidaCustom + ':00' : horaSalidaCustom}`;
      } else {
        const pad = (n) => String(n).padStart(2, '0');
        fechaHoraIso = `${formatIsoDate(ahora)}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
      }

      if (personaSeleccionada.id) {
        await api.post(`/api/accesos/${personaSeleccionada.id}/salida`, {
          fechaHoraSalida: fechaHoraIso,
        });
      } else {
        await api.post('/api/accesos/salida', {
          dni: personaSeleccionada.dni,
          fechaHoraSalida: fechaHoraIso,
        });
      }

      const nombreConfirmado = personaSeleccionada.nombre || personaSeleccionada.dni;
      setPersonaSeleccionada(null);
      setPantallaExito({
        tipo: 'salida',
        nombre: nombreConfirmado,
        hora: formatearHoraCorta(new Date(fechaHoraIso)),
      });

      cargarPersonasDentro();
    } catch (err) {
      console.error('Error registrando salida:', err);
      setError(err.response?.data?.message || 'No se pudo registrar la salida.');
    } finally {
      setGuardando(false);
    }
  };

  // Auto-cierre de pantalla de éxito tras 4 segundos
  useEffect(() => {
    if (pantallaExito) {
      const t = setTimeout(() => {
        setPantallaExito(null);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [pantallaExito]);

  // Filtrado de personas dentro
  const personasFiltradas = personasDentro.filter((p) => {
    const texto = `${p.nombre || ''} ${p.dni || ''} ${p.empresa || ''}`.toLowerCase();
    return texto.includes(busquedaSalida.toLowerCase());
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none transition-colors duration-200 ${
      modoOscuro ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Barra superior de la tablet */}
      <header className={`border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-xs ${
        modoOscuro ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {isKiosko ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kiosko Activo</span>
              </div>
              <button
                type="button"
                onClick={handleCerrarSesionKiosko}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  modoOscuro 
                    ? 'bg-slate-700/80 hover:bg-red-950/80 hover:text-red-300 text-gray-300 border-slate-600'
                    : 'bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 border-gray-200'
                }`}
                title="Cerrar sesión de terminal kiosko"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          ) : (
            <Link
              to="/entradas-salidas"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                modoOscuro
                  ? 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
              }`}
              title="Volver al panel"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Salir de Modo Tablet</span>
            </Link>
          )}
          <div className={`h-6 w-px ${modoOscuro ? 'bg-slate-700' : 'bg-gray-200'} hidden sm:block`} />
          <div className="flex flex-col">
            <span className="text-orange-500 font-extrabold text-lg sm:text-xl leading-tight tracking-tight">
              Sofás Valencia
            </span>
            <span className={`text-xs font-medium ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
              Control de Accesos
            </span>
          </div>
        </div>

        {/* Zona derecha: Alternar Tema Sol/Luna + Reloj y Fecha */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Botón Sol / Luna para alternar modo claro y noche */}
          <button
            type="button"
            onClick={toggleTema}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
              modoOscuro
                ? 'bg-slate-700/80 border-slate-600 text-amber-400 hover:bg-slate-700 hover:text-amber-300'
                : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-indigo-600'
            }`}
            title={modoOscuro ? 'Cambiar a modo claro (día)' : 'Cambiar a modo noche (oscuro)'}
            aria-label={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
          >
            {modoOscuro ? (
              <>
                <Sun className="w-5 h-5 text-amber-400" />
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-indigo-600" />
              </>
            )}
          </button>

          <div className={`h-8 w-px ${modoOscuro ? 'bg-slate-700' : 'bg-gray-200'} hidden sm:block`} />

          {/* Reloj y Fecha */}
          <div className="text-right flex flex-col items-end">
            <span className={`font-mono text-xl sm:text-2xl font-black tracking-wider ${
              modoOscuro ? 'text-white' : 'text-gray-900'
            }`}>
              {formatearHora(reloj)}
            </span>
            <span className={`text-xs capitalize hidden sm:block ${
              modoOscuro ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatearFechaLarga(reloj)}
            </span>
          </div>
        </div>
      </header>

      {/* Pantalla de Éxito Transitoria (overlay táctil grande) */}
      {pantallaExito && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className={`border-2 rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl space-y-6 ${
            modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center ${
              pantallaExito.tipo === 'entrada' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40' : 'bg-orange-500/20 text-orange-500 border border-orange-500/40'
            }`}>
              <CheckCircle2 className="w-14 h-14" />
            </div>

            <div className="space-y-2">
              <h2 className={`text-2xl sm:text-3xl font-extrabold ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>
                {pantallaExito.tipo === 'entrada' ? '¡Entrada Registrada!' : '¡Salida Registrada!'}
              </h2>
              <p className={`text-lg font-medium ${modoOscuro ? 'text-gray-300' : 'text-gray-700'}`}>
                {pantallaExito.nombre}
              </p>
              <p className={`text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
                Hora de {pantallaExito.tipo}: <span className={`font-bold font-mono ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>{pantallaExito.hora}</span>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPantallaExito(null)}
                className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg cursor-pointer transition-all ${
                  pantallaExito.tipo === 'entrada'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-orange-600 hover:bg-orange-500'
                }`}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selector Gigante de Modo: ENTRADA / SALIDA */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6 pb-2">
        <div className={`grid grid-cols-2 gap-3 sm:gap-6 p-2 sm:p-2.5 rounded-3xl border shadow-lg transition-colors ${
          modoOscuro ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-gray-200'
        }`}>
          <button
            type="button"
            onClick={() => { setModo('entrada'); setError(null); }}
            className={`py-4 sm:py-5 px-4 rounded-2xl font-black text-base sm:text-xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
              modo === 'entrada'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.01]'
                : modoOscuro
                  ? 'text-gray-400 hover:text-white hover:bg-slate-700/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
            <span>REGISTRAR ENTRADA</span>
          </button>

          <button
            type="button"
            onClick={() => { setModo('salida'); setError(null); }}
            className={`py-4 sm:py-5 px-4 rounded-2xl font-black text-base sm:text-xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer relative ${
              modo === 'salida'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-[1.01]'
                : modoOscuro
                  ? 'text-gray-400 hover:text-white hover:bg-slate-700/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LogOut className="w-6 h-6 sm:w-7 sm:h-7" />
            <span>REGISTRAR SALIDA</span>
            {personasDentro.length > 0 && (
              <span className={`hidden sm:inline-flex items-center justify-center ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                modo === 'salida'
                  ? 'bg-white text-orange-600'
                  : 'bg-orange-100 text-orange-700 border border-orange-200'
              }`}>
                {personasDentro.length} dentro
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de error si ocurre */}
      {error && (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 mt-4">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:text-red-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-8 flex-1 flex flex-col justify-center">
        {/* =========================================
            MODO ENTRADA: FORMULARIO TÁCTIL
           ========================================= */}
        {modo === 'entrada' && (
          <form onSubmit={handleRegistrarEntrada} className={`rounded-3xl p-6 sm:p-8 border shadow-xl transition-colors ${
            modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`mb-6 pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              modoOscuro ? 'border-slate-700' : 'border-gray-100'
            }`}>
              <div>
                <h2 className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${
                  modoOscuro ? 'text-white' : 'text-gray-900'
                }`}>
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  Nueva Entrada a Instalaciones
                </h2>
                <p className={`text-xs sm:text-sm mt-0.5 ${
                  modoOscuro ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Por favor, rellene los datos y firme en el recuadro digital
                </p>
              </div>

              {/* Indicador de hora automática con opción de editar */}
              <div className="flex items-center gap-2">
                <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                  modoOscuro 
                    ? 'bg-slate-900 border-slate-700 text-emerald-400' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {editarFechaHora && horaEntradaCustom ? horaEntradaCustom : formatearHoraCorta(reloj)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!editarFechaHora) {
                      const ahora = new Date();
                      const pad = (n) => String(n).padStart(2, '0');
                      setFechaEntradaCustom(formatIsoDate(ahora));
                      setHoraEntradaCustom(`${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`);
                    }
                    setEditarFechaHora(!editarFechaHora);
                  }}
                  className="text-xs text-orange-500 hover:text-orange-600 underline font-semibold cursor-pointer"
                >
                  {editarFechaHora ? 'Usar hora actual' : 'Modificar hora/fecha'}
                </button>
              </div>
            </div>

            {/* Selector manual de fecha y hora si el usuario pulsó modificar */}
            {editarFechaHora && (
              <div className={`mb-6 p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                modoOscuro ? 'bg-slate-900/90 border-orange-500/30' : 'bg-orange-50/70 border-orange-200'
              }`}>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 flex items-center gap-1 ${
                    modoOscuro ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    <span>Fecha de entrada</span>
                  </label>
                  <input
                    type="date"
                    value={fechaEntradaCustom}
                    onChange={(e) => setFechaEntradaCustom(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden ${
                      modoOscuro 
                        ? 'bg-slate-800 border-slate-600 text-white focus:border-orange-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 flex items-center gap-1 ${
                    modoOscuro ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Hora de entrada</span>
                  </label>
                  <input
                    type="time"
                    value={horaEntradaCustom}
                    onChange={(e) => setHoraEntradaCustom(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden ${
                      modoOscuro 
                        ? 'bg-slate-800 border-slate-600 text-white focus:border-orange-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Formulario en 2 columnas en tablet */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Columna Izquierda: Datos del visitante */}
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                    modoOscuro ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <User className="w-4 h-4 text-emerald-500" />
                    <span>Nombre completo *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl text-base border focus:outline-hidden transition-colors ${
                      modoOscuro 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>

                {/* DNI */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                    modoOscuro ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>DNI / NIE / Pasaporte *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl text-base font-mono uppercase border focus:outline-hidden transition-colors ${
                      modoOscuro 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>

                {/* Empresa (opcional) */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                    modoOscuro ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>Empresa <span className={`text-xs font-normal ${modoOscuro ? 'text-gray-500' : 'text-gray-400'}`}>(opcional)</span></span>
                  </label>
                  <input
                    type="text"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl text-base border focus:outline-hidden transition-colors ${
                      modoOscuro 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>

                {/* Motivo de visita (opcional) */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                    modoOscuro ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <ClipboardList className="w-4 h-4 text-gray-400" />
                    <span>Motivo de la visita <span className={`text-xs font-normal ${modoOscuro ? 'text-gray-500' : 'text-gray-400'}`}>(opcional)</span></span>
                  </label>
                  <input
                    type="text"
                    value={motivoVisita}
                    onChange={(e) => setMotivoVisita(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl text-base border focus:outline-hidden transition-colors ${
                      modoOscuro 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
              </div>

              {/* Columna Derecha: Firma digital táctil y Botón de envío */}
              <div className="flex flex-col justify-between space-y-6">
                <div>
                  <SignaturePad
                    value={firma}
                    onChange={setFirma}
                    label="Firma de entrada *"
                    labelClass={modoOscuro ? "text-gray-300" : "text-gray-700"}
                  />
                  <p className={`text-xs mt-2 ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
                    Al firmar, confirma su acceso a las instalaciones conforme a la normativa de seguridad de Sofás Valencia.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-lg sm:text-xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {guardando ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registrando entrada...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-6 h-6" />
                      <span>CONFIRMAR Y ENTRAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* =========================================
            MODO SALIDA: SELECCIÓN DE PERSONAS DENTRO
           ========================================= */}
        {modo === 'salida' && (
          <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl flex flex-col space-y-6 transition-colors ${
            modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
              modoOscuro ? 'border-slate-700' : 'border-gray-100'
            }`}>
              <div>
                <h2 className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${
                  modoOscuro ? 'text-white' : 'text-gray-900'
                }`}>
                  <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  Personas actualmente dentro
                </h2>
                <p className={`text-xs sm:text-sm mt-0.5 ${
                  modoOscuro ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Pulsa sobre tu nombre para marcar la salida sin tener que reescribir tus datos
                </p>
              </div>

              <button
                type="button"
                onClick={cargarPersonasDentro}
                disabled={cargandoDentro}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors self-start sm:self-auto cursor-pointer ${
                  modoOscuro
                    ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 border-slate-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cargandoDentro ? 'animate-spin' : ''}`} />
                <span>Actualizar lista</span>
              </button>
            </div>

            {/* Buscador táctil */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={busquedaSalida}
                onChange={(e) => setBusquedaSalida(e.target.value)}
                placeholder="Buscar por nombre, DNI o empresa..."
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl text-base border focus:outline-hidden transition-colors ${
                  modoOscuro 
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                }`}
              />
              {busquedaSalida && (
                <button
                  type="button"
                  onClick={() => setBusquedaSalida('')}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer ${
                    modoOscuro ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Lista / Grid de Personas dentro */}
            {cargandoDentro ? (
              <div className="py-16 text-center text-gray-400 space-y-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium">Consultando personas en instalaciones...</p>
              </div>
            ) : personasFiltradas.length === 0 ? (
              <div className={`py-16 text-center space-y-3 rounded-2xl border p-6 ${
                modoOscuro ? 'bg-slate-900/50 border-slate-700/50 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>
                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto" />
                <p className={`text-base font-bold ${modoOscuro ? 'text-gray-300' : 'text-gray-700'}`}>
                  {personasDentro.length === 0
                    ? 'No hay ninguna persona registrada dentro en este momento.'
                    : 'No se encontraron personas con ese nombre o DNI.'}
                </p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {personasDentro.length === 0
                    ? 'Todos los accesos anteriores ya tienen registrada su salida.'
                    : 'Prueba a buscar con otro término o limpia el buscador.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {personasFiltradas.map((item) => {
                  const horaEntrada = item.fechaHoraEntrada || item.fechaEntrada;
                  const fechaObj = horaEntrada ? new Date(horaEntrada) : null;
                  const horaStr = fechaObj ? formatearHoraCorta(fechaObj) : '-';

                  return (
                    <div
                      key={item.id}
                      onClick={() => seleccionarParaSalida(item)}
                      className={`group border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 cursor-pointer transition-all duration-150 ${
                        modoOscuro 
                          ? 'bg-slate-900 hover:bg-slate-700/80 active:scale-[0.98] border-slate-700 hover:border-orange-500/80 shadow-md'
                          : 'bg-gray-50 hover:bg-white active:scale-[0.98] border-gray-200 hover:border-orange-400 shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-extrabold text-base ${
                            modoOscuro 
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              : 'bg-orange-100 text-orange-600 border-orange-200'
                          }`}>
                            {(item.nombre || item.dni || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`text-base font-black transition-colors ${
                              modoOscuro ? 'text-white group-hover:text-orange-300' : 'text-gray-900 group-hover:text-orange-600'
                            }`}>
                              {item.nombre || 'Sin nombre'}
                            </div>
                            <div className={`text-xs font-mono ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
                              DNI: {item.dni || '-'}
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Dentro
                        </span>
                      </div>

                      <div className={`pt-2 border-t text-xs flex items-center justify-between ${
                        modoOscuro ? 'border-slate-800 text-gray-400' : 'border-gray-200 text-gray-500'
                      }`}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>Entrada: <strong className={`font-mono ${modoOscuro ? 'text-gray-200' : 'text-gray-800'}`}>{horaStr}</strong></span>
                        </div>
                        {item.empresa && (
                          <span className="truncate max-w-[120px] font-medium">
                            {item.empresa}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Marcar Salida</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================
          MODAL DE CONFIRMACIÓN DE SALIDA TÁCTIL
         ========================================= */}
      {personaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 ${
            modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${
              modoOscuro ? 'border-slate-700' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-lg sm:text-xl font-bold ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>
                    Confirmar Salida
                  </h3>
                  <p className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
                    Verifica los datos antes de registrar la salida
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPersonaSeleccionada(null)}
                className={`p-2 rounded-lg cursor-pointer ${modoOscuro ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Ficha de la persona */}
            <div className={`rounded-2xl p-4 sm:p-5 border space-y-3 ${
              modoOscuro ? 'bg-slate-900 border-slate-700/80' : 'bg-gray-50 border-gray-200'
            }`}>
              <div>
                <span className={`text-xs font-semibold uppercase block ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>Nombre:</span>
                <p className={`text-lg font-black ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>{personaSeleccionada.nombre}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className={`text-xs font-semibold uppercase block ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>DNI / Documento:</span>
                  <p className={`font-mono font-bold ${modoOscuro ? 'text-gray-200' : 'text-gray-800'}`}>{personaSeleccionada.dni}</p>
                </div>
                {personaSeleccionada.empresa && (
                  <div>
                    <span className={`text-xs font-semibold uppercase block ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>Empresa:</span>
                    <p className={`font-medium ${modoOscuro ? 'text-gray-200' : 'text-gray-800'}`}>{personaSeleccionada.empresa}</p>
                  </div>
                )}
              </div>

              {personaSeleccionada.fechaHoraEntrada && (
                <div className={`text-xs pt-2 border-t flex items-center justify-between ${
                  modoOscuro ? 'border-slate-800 text-gray-400' : 'border-gray-200 text-gray-500'
                }`}>
                  <span>Entrada registrada:</span>
                  <span className={`font-mono font-bold ${modoOscuro ? 'text-gray-300' : 'text-gray-800'}`}>
                    {new Date(personaSeleccionada.fechaHoraEntrada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Hora de salida automática con opción de modificar */}
            <div className={`rounded-2xl p-4 border space-y-2 ${
              modoOscuro ? 'bg-slate-900/60 border-slate-700' : 'bg-orange-50/60 border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase flex items-center gap-1.5 ${
                  modoOscuro ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>Hora de Salida:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditarHoraSalida(!editarHoraSalida)}
                  className="text-xs text-orange-500 hover:text-orange-600 underline font-semibold cursor-pointer"
                >
                  {editarHoraSalida ? 'Usar hora actual' : 'Modificar hora'}
                </button>
              </div>

              {editarHoraSalida ? (
                <input
                  type="time"
                  value={horaSalidaCustom}
                  onChange={(e) => setHoraSalidaCustom(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-base focus:outline-hidden font-mono border ${
                    modoOscuro 
                      ? 'bg-slate-800 border-slate-600 text-white focus:border-orange-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                  }`}
                />
              ) : (
                <div className="font-mono text-xl font-bold text-orange-500">
                  {formatearHora(reloj)} <span className={`text-xs font-sans font-normal ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>(Momento actual)</span>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPersonaSeleccionada(null)}
                className={`py-3.5 rounded-xl border font-bold text-sm cursor-pointer transition-colors ${
                  modoOscuro 
                    ? 'border-slate-600 text-gray-300 hover:bg-slate-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={handleConfirmarSalida}
                className="py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-base shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>REGISTRAR SALIDA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
