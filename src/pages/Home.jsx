import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../context/toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  HeartPulse, 
  X, 
  CalendarDays, 
  ArrowLeftRight, 
  LogIn, 
  LogOut, 
  AlertCircle, 
  ArrowLeft,
  Plus,
  Clock
} from 'lucide-react';
import api from '../services/api';
import TrabajadorSelect from '../components/TrabajadorSelect';
import Select from '../components/Select';
import TimePicker from '../components/TimePicker';
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
function obtenerDatosCalendario() {
  return Promise.allSettled([
    api.get('/api/reservas-fisio'), api.get('/api/reservas-salas'),
    api.get('/api/accesos'), api.get('/api/salas'),
    api.get('/api/trabajadores'),
  ]);
}
export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Datos
  const [reservasFisio, setReservasFisio] = useState([]);
  const [reservasSalas, setReservasSalas] = useState([]);
  const [accesos, setAccesos] = useState([]);
  const [salasDisponibles, setSalasDisponibles] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const setFeedbackMsg = useToast();
  
  // Filtro de tipo de evento: 'todos', 'accesos', 'fisio', 'salas'
  const [filtroTipo, setFiltroTipo] = useState('todos');
  // Vista del calendario: 'mes', 'semana', 'dia'
  const [vistaCalendario, setVistaCalendario] = useState('mes');
  // Modal Detalle de Evento
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [eventoDetalle, setEventoDetalle] = useState(null);
  const [enviandoSalida, setEnviandoSalida] = useState(false);
  const [errorSalida, setErrorSalida] = useState(null);
  // Modal Emergente
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalVista, setModalVista] = useState('opciones'); // 'opciones', 'entrada-salida', 'fisio', 'sala'
  const [enviandoForm, setEnviandoForm] = useState(false);
  const [formError, setFormError] = useState(null);
  // Obtener hora actual en formato HH:mm
  const obtenerHoraActualHHMM = () => {
    const ahora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
  };
  // Estados para formularios en modal
  const [formAcceso, setFormAcceso] = useState({
    tipoAccion: 'entrada', // 'entrada' o 'salida'
    nombre: '',
    dni: '',
    hora: obtenerHoraActualHHMM(),
    empresa: '',
    motivoVisita: '',
  });
  const [formFisio, setFormFisio] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    hora: '10:00',
    notas: '',
  });
  const [formSala, setFormSala] = useState({
    salaId: '',
    nombre: '',
    dni: '',
    horaInicio: '11:00',
    duracionMinutos: 60,
    motivo: '',
  });
  const aplicarDatos = useCallback(([resFisio, resSalas, resAccesos, resListaSalas, resTrabajadores]) => {
      setError([resFisio, resSalas, resAccesos, resListaSalas, resTrabajadores].some(r => r && r.status === 'rejected') ? 'No se pudieron cargar todos los datos. Recarga la página para reintentar.' : null);
      if (resFisio && resFisio.status === 'fulfilled' && Array.isArray(resFisio.value.data)) {
        setReservasFisio(resFisio.value.data);
      }
      if (resSalas && resSalas.status === 'fulfilled' && Array.isArray(resSalas.value.data)) {
        setReservasSalas(resSalas.value.data);
      }
      if (resAccesos && resAccesos.status === 'fulfilled' && Array.isArray(resAccesos.value.data)) {
        setAccesos(resAccesos.value.data);
      }
      if (resListaSalas && resListaSalas.status === 'fulfilled' && Array.isArray(resListaSalas.value.data)) {
        setSalasDisponibles(resListaSalas.value.data);
        if (resListaSalas.value.data.length > 0) {
          setFormSala((prev) => prev.salaId ? prev : ({ ...prev, salaId: resListaSalas.value.data[0].id }));
        }
      }
      if (resTrabajadores && resTrabajadores.status === 'fulfilled' && Array.isArray(resTrabajadores.value.data)) {
        setTrabajadores(resTrabajadores.value.data);
      }
    setLoading(false);
  }, []);
  async function cargarDatos() {
    aplicarDatos(await obtenerDatosCalendario());
  }
  useEffect(() => {
    let activo = true;
    obtenerDatosCalendario().then(datos => { if (activo) aplicarDatos(datos); });
    return () => { activo = false; };
  }, [aplicarDatos]);
  // Navegación adaptable según vista (Mes, Semana, Día)
  const navegarAnterior = () => {
    if (vistaCalendario === 'mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (vistaCalendario === 'semana') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
      setSelectedDate(d);
    }
  };
  const navegarSiguiente = () => {
    if (vistaCalendario === 'mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (vistaCalendario === 'semana') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setSelectedDate(d);
    }
  };
  const irAHoy = () => {
    const hoy = new Date();
    setCurrentDate(hoy);
    setSelectedDate(hoy);
  };
  // Cálculo de los días para la vista semanal (Lunes a Domingo)
  const obtenerInicioSemana = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  const diasSemanaActual = Array.from({ length: 7 }, (_, i) => {
    const inicio = obtenerInicioSemana(currentDate);
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
  
  // Cálculo del mes
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  // Título dinámico para la cabecera (Muestra SIEMPRE el mes y año claramente)
  const getTituloCalendario = () => {
    const mesNombre = MESES[month];
    if (vistaCalendario === 'mes') {
      return (
        <span className="flex items-center gap-2">
          <span>{mesNombre}</span>
          <span className="text-gray-400 font-semibold">{year}</span>
        </span>
      );
    }
    if (vistaCalendario === 'semana') {
      const inicio = diasSemanaActual[0];
      const fin = diasSemanaActual[6];
      const mismoMes = inicio.getMonth() === fin.getMonth();
      const mesTexto = mismoMes
        ? MESES[inicio.getMonth()]
        : `${MESES[inicio.getMonth()].slice(0, 3)} / ${MESES[fin.getMonth()].slice(0, 3)}`;
      return (
        <span className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span>{mesTexto}</span>
          <span className="text-gray-400 font-semibold">{fin.getFullYear()}</span>
          <span className="text-xs sm:text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full normal-case">
            Semana: {inicio.getDate()} - {fin.getDate()} {mismoMes ? '' : MESES[fin.getMonth()].slice(0, 3)}
          </span>
        </span>
      );
    }
    // Vista Día: Muestra mes, año y el día de la semana
    return (
      <span className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span>{mesNombre}</span>
        <span className="text-gray-400 font-semibold">{year}</span>
        <span className="text-xs sm:text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full capitalize">
          {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
        </span>
      </span>
    );
  };
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const daysGrid = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    daysGrid.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  const remainingDays = (7 - (daysGrid.length % 7)) % 7;
  for (let i = 1; i <= remainingDays; i++) {
    daysGrid.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }
  const formatIsoDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };
  const hoy = new Date();
  // Obtener eventos para una fecha específica
  const getEventosPorFecha = (date) => {
    const isoFecha = formatIsoDate(date);
    const eventos = [];
    // Accesos (Entradas/Salidas)
    if (filtroTipo === 'todos' || filtroTipo === 'accesos') {
      accesos.forEach((acc) => {
        const fechaRef = acc.fechaHoraEntrada || acc.fechaEntrada;
        if (fechaRef && formatIsoDate(fechaRef) === isoFecha) {
          const tieneSalida = !!(acc.fechaHoraSalida || acc.fechaSalida);
          const horaSalida = (acc.fechaHoraSalida || acc.fechaSalida)
            ? new Date(acc.fechaHoraSalida || acc.fechaSalida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : null;
          eventos.push({
            id: `acceso-${acc.id}`,
            tipo: 'acceso',
            titulo: 'Visita',
            hora: new Date(fechaRef).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            horaSalida,
            tieneSalida,
            trabajador: acc.nombre || acc.trabajadorNombre || `DNI: ${acc.dni || '-'}`,
            detalle: acc.empresa ? `Empresa: ${acc.empresa}` : (acc.motivoVisita || 'Fichaje de acceso'),
            empresa: acc.empresa || '',
            motivoVisita: acc.motivoVisita || '',
            dni: acc.dni || '',
            rawDate: new Date(fechaRef),
          });
        }
      });
    }
    // Reservas de Fisio
    if (filtroTipo === 'todos' || filtroTipo === 'fisio') {
      reservasFisio.forEach((rf) => {
        const fechaEvento = rf.fechaHora || rf.fecha;
        if (fechaEvento && formatIsoDate(fechaEvento) === isoFecha) {
          eventos.push({
            id: `fisio-${rf.id}`,
            tipo: 'fisio',
            titulo: 'Fisioterapia',
            hora: new Date(fechaEvento).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            trabajador: rf.trabajador?.nombreCompleto || rf.trabajador?.nombre || rf.trabajadorNombre || 'Trabajador',
            detalle: rf.notas || rf.observaciones,
            rawDate: new Date(fechaEvento),
          });
        }
      });
    }
    // Reservas de Salas
    if (filtroTipo === 'todos' || filtroTipo === 'salas') {
      reservasSalas.forEach((rs) => {
        const fechaEvento = rs.fechaHoraInicio || rs.fecha;
        if (fechaEvento && formatIsoDate(fechaEvento) === isoFecha) {
          const horaInicio = new Date(fechaEvento).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const horaFin = rs.fechaHoraFin ? new Date(rs.fechaHoraFin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
          eventos.push({
            id: `sala-${rs.id}`,
            tipo: 'sala',
            titulo: rs.sala?.nombre || rs.salaNombre || 'Reserva de Sala',
            hora: horaFin ? `${horaInicio} - ${horaFin}` : horaInicio,
            trabajador: rs.trabajador?.nombreCompleto || rs.trabajador?.nombre || rs.trabajadorNombre || 'Empleado',
            detalle: rs.motivo || 'Reunión / Uso de sala',
            rawDate: new Date(fechaEvento),
          });
        }
      });
    }
    return eventos.sort((a, b) => a.rawDate - b.rawDate);
  };
  // Abrir ventana emergente al hacer clic en un día
  const alHacerClicDia = (date) => {
    setSelectedDate(date);
    setFormError(null);
    setModalVista('opciones');
    setModalAbierto(true);
  };
  // Abrir formulario de entrada/salida cargando la hora actual por defecto
  const abrirFormularioAcceso = (tipo = 'entrada') => {
    const horaActual = obtenerHoraActualHHMM();
    setFormAcceso((prev) => ({
      ...prev,
      tipoAccion: tipo,
      hora: horaActual,
    }));
    setFormError(null);
    setModalVista('entrada-salida');
  };
    const abrirDetalleEvento = (ev) => {
    setEventoDetalle(ev);
    setErrorSalida(null);
    setModalDetalleAbierto(true);
  };
  const ejecutarSalidaDirecta = async (ev) => {
    if (!ev || !ev.dni) {
      setErrorSalida('No se encontró el DNI asociado a este acceso.');
      return;
    }
    setEnviandoSalida(true);
    setErrorSalida(null);
    try {
      const horaActual = obtenerHoraActualHHMM();
      const hoyIso = formatIsoDate(new Date());
      const fechaHoraIso = `${hoyIso}T${horaActual}:00`;
      await api.post('/api/accesos/salida', {
        dni: ev.dni.trim().toUpperCase(),
        fechaHoraSalida: fechaHoraIso,
      });
      setFeedbackMsg(`Salida registrada a las ${horaActual}`);
      setModalDetalleAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error registrando salida:', err);
      const msg = err.response?.data?.message || 'Error al registrar la salida.';
      setErrorSalida(msg);
    } finally {
      setEnviandoSalida(false);
    }
  };
  // Enviar registro de Entrada o Salida
  const guardarAcceso = async (e) => {
    e.preventDefault();
    setFormError(null);
    setEnviandoForm(true);
    try {
      const fechaBase = formatIsoDate(selectedDate);
      const horaSeleccionada = formAcceso.hora || obtenerHoraActualHHMM();
      const fechaHoraIso = `${fechaBase}T${horaSeleccionada.length === 5 ? horaSeleccionada + ':00' : horaSeleccionada}`;
      if (formAcceso.tipoAccion === 'entrada') {
        if (!formAcceso.nombre.trim() || !formAcceso.dni.trim()) {
          setFormError('El nombre y el DNI son obligatorios para registrar la entrada.');
          setEnviandoForm(false);
          return;
        }
        await api.post('/api/accesos/entrada', {
          nombre: formAcceso.nombre,
          dni: formAcceso.dni.trim().toUpperCase(),
          fechaHoraEntrada: fechaHoraIso,
          empresa: formAcceso.empresa || 'Sin definir',
          motivoVisita: formAcceso.motivoVisita || 'Sin especificar',
        });
        setFeedbackMsg(`Entrada registrada a las ${horaSeleccionada}`);
      } else {
        // Salida
        if (!formAcceso.dni.trim()) {
          setFormError('El DNI es obligatorio para registrar la salida.');
          setEnviandoForm(false);
          return;
        }
        await api.post('/api/accesos/salida', {
          dni: formAcceso.dni.trim().toUpperCase(),
          fechaHoraSalida: fechaHoraIso,
        });
        setFeedbackMsg(`Salida registrada a las ${horaSeleccionada}`);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error registrando acceso:', err);
      const msg = err.response?.data?.message || 'Error al procesar el registro de acceso.';
      setFormError(msg);
    } finally {
      setEnviandoForm(false);
    }
  };
  // Enviar formulario de Reserva de Fisio
  const guardarFisio = async (e) => {
    e.preventDefault();
    setFormError(null);
    setEnviandoForm(true);
    try {
      if (!formFisio.trabajadorId) {
        setFormError('Debes seleccionar un trabajador.');
        setEnviandoForm(false);
        return;
      }
      const fechaBase = formatIsoDate(selectedDate);
      const fechaHoraIso = `${fechaBase}T${formFisio.hora}:00`;
      await api.post('/api/reservas-fisio', {
        trabajadorId: Number(formFisio.trabajadorId),
        fechaHora: fechaHoraIso,
        notas: formFisio.notas,
      });
      setFeedbackMsg('Reserva de fisio creada con éxito.');
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error reservando fisio:', err);
      const msg = err.response?.data?.message || 'Error al guardar la cita de fisioterapia.';
      setFormError(msg);
    } finally {
      setEnviandoForm(false);
    }
  };
  // Enviar formulario de Reserva de Sala
  const guardarSala = async (e) => {
    e.preventDefault();
    setFormError(null);
    setEnviandoForm(true);
    try {
      if (!formSala.salaId) {
        setFormError('Debes seleccionar una sala disponible.');
        setEnviandoForm(false);
        return;
      }
      if (!formSala.trabajadorId) {
        setFormError('Debes seleccionar un trabajador.');
        setEnviandoForm(false);
        return;
      }
      const fechaBase = formatIsoDate(selectedDate);
      const fechaHoraInicioIso = `${fechaBase}T${formSala.horaInicio}:00`;
      await api.post('/api/reservas-salas', {
        salaId: parseInt(formSala.salaId, 10),
        trabajadorId: Number(formSala.trabajadorId),
        fechaHoraInicio: fechaHoraInicioIso,
        duracionMinutos: parseInt(formSala.duracionMinutos, 10) || 60,
        motivo: formSala.motivo || 'Reunión de trabajo',
      });
      setFeedbackMsg('Reserva de sala confirmada con éxito.');
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error reservando sala:', err);
      const msg = err.response?.data?.message || 'Error al guardar la reserva de la sala.';
      setFormError(msg);
    } finally {
      setEnviandoForm(false);
    }
  };
  const eventosDiaSeleccionado = getEventosPorFecha(selectedDate);
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {loading && <p role="status" className="text-sm text-gray-500">Cargando calendario...</p>}
      {error && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</p>}
      {/* Alerta de notificación temporal */}
      {/* Barra superior con Controles del Calendario */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Mes/Semana/Día y Título */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs shadow-orange-500/30 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight capitalize">
              {MESES[month]} <span className="text-gray-400 font-semibold">{year}</span>
            </h1>
          </div>
        </div>
        {/* Botones de navegación, Selector de Vista y Filtros */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Selector de Vista: Mes | Semana | Día */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setVistaCalendario('mes')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                vistaCalendario === 'mes'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setVistaCalendario('semana')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                vistaCalendario === 'semana'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setVistaCalendario('dia')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                vistaCalendario === 'dia'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Día
            </button>
          </div>
          {/* Selector de Filtros */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtroTipo === 'todos'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('accesos')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                filtroTipo === 'accesos'
                  ? 'bg-gray-800 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Entradas / Salidas
            </button>
            <button
              onClick={() => setFiltroTipo('fisio')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                filtroTipo === 'fisio'
                  ? 'bg-gray-800 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Fisio
            </button>
            <button
              onClick={() => setFiltroTipo('salas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                filtroTipo === 'salas'
                  ? 'bg-gray-800 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Salas
            </button>
          </div>
          {/* Navegadores Anterior / Hoy / Siguiente */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={navegarAnterior}
              title="Anterior"
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={irAHoy}
              className="px-3 py-1 rounded-lg text-xs font-bold text-orange-500 hover:bg-orange-500/10 transition cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={navegarSiguiente}
              title="Siguiente"
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {/* 1. VISTA MENSUAL */}
      {vistaCalendario === 'mes' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Cabecera de días */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-bold text-gray-600 uppercase py-3 tracking-wider">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia}>{dia}</div>
            ))}
          </div>
          {/* Celdas del mes */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {daysGrid.map((dayItem, index) => {
              const eventosDia = getEventosPorFecha(dayItem.date);
              const esHoy = isSameDay(dayItem.date, hoy);
              return (
                <div
                  key={index}
                  onClick={() => alHacerClicDia(dayItem.date)}
                  className={`min-h-[105px] sm:min-h-[125px] p-2 cursor-pointer transition-all flex flex-col justify-between group ${
                    !dayItem.isCurrentMonth
                      ? 'bg-gray-50/50 text-gray-400'
                      : 'bg-white hover:bg-orange-500/10 text-gray-800'
                  }`}
                >
                  {/* Cabecera de la celda */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors ${
                        esHoy
                          ? 'bg-orange-500 text-white font-extrabold shadow-xs shadow-orange-500/40'
                          : dayItem.isCurrentMonth
                          ? 'text-gray-700 group-hover:text-orange-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>
                    {eventosDia.length > 0 && (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {eventosDia.length}
                      </span>
                    )}
                  </div>
                  {/* Etiquetas de eventos */}
                  <div className="space-y-1 overflow-hidden">
                    {eventosDia.slice(0, 2).map((ev) => {
                      let badgeEstilo = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
                      let dotColor = 'bg-emerald-500';
                      if (ev.tipo === 'fisio') {
                        badgeEstilo = 'bg-orange-500/10 text-orange-600 border-orange-500/20';
                        dotColor = 'bg-orange-500';
                      } else if (ev.tipo === 'sala') {
                        badgeEstilo = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
                        dotColor = 'bg-blue-500';
                      }
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDetalleEvento(ev);
                          }}
                          className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md truncate font-semibold border flex items-center gap-1 cursor-pointer hover:opacity-80 transition ${badgeEstilo}`}
                          title={`${ev.hora} - ${ev.titulo}: ${ev.trabajador}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                          <span className="truncate">
                            {ev.hora} {ev.titulo}{ev.tipo === 'acceso' ? ` · ${ev.trabajador}` : ''}
                          </span>
                        </div>
                      );
                    })}
                    {eventosDia.length > 2 && (
                      <div className="text-[10px] font-bold text-orange-500 pl-1">
                        +{eventosDia.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 2. VISTA SEMANAL */}
      {vistaCalendario === 'semana' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Cabecera de los 7 días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center divide-x divide-gray-200">
            {diasSemanaActual.map((dia, idx) => {
              const esHoy = isSameDay(dia, hoy);
              return (
                <div key={idx} className={`py-3 px-1 sm:px-2 ${esHoy ? 'bg-orange-50/60' : ''}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {DIAS_SEMANA[idx]}
                  </p>
                  <p className={`text-base sm:text-lg font-extrabold mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full ${
                    esHoy ? 'bg-orange-500 text-white shadow-xs' : 'text-gray-900'
                  }`}>
                    {dia.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Columnas de los 7 días */}
          <div className="grid grid-cols-7 divide-x divide-gray-100 min-h-[460px]">
            {diasSemanaActual.map((dia, idx) => {
              const eventosDia = getEventosPorFecha(dia);
              const esHoy = isSameDay(dia, hoy);
              return (
                <div
                  key={idx}
                  className={`p-2 flex flex-col justify-between transition-colors ${
                    esHoy ? 'bg-orange-50/15' : 'bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    {eventosDia.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => alHacerClicDia(dia)}
                        className="w-full text-center py-8 px-1 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition text-[11px] flex flex-col items-center gap-1 group cursor-pointer"
                        title="Añadir reserva"
                      >
                        <Plus className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span className="hidden sm:inline">Disponible</span>
                      </button>
                    ) : (
                      eventosDia.map((ev) => {
                        let colorBorder = 'border-emerald-200 bg-emerald-50 text-emerald-950';
                        let dotColor = 'bg-emerald-500';
                        if (ev.tipo === 'fisio') {
                          colorBorder = 'border-orange-200 bg-orange-50 text-orange-950';
                          dotColor = 'bg-orange-500';
                        } else if (ev.tipo === 'sala') {
                          colorBorder = 'border-blue-200 bg-blue-50 text-blue-950';
                          dotColor = 'bg-blue-500';
                        }
                        return (
                          <div
                            key={ev.id}
                            onClick={() => abrirDetalleEvento(ev)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer shadow-2xs hover:shadow-sm transition ${colorBorder}`}
                            title={`${ev.hora} - ${ev.titulo}: ${ev.trabajador}`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-0.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                              <span className="font-mono text-[11px]">{ev.hora}</span>
                            </div>
                            <p className="font-bold truncate text-[11px]">{ev.titulo}</p>
                            <p className="text-[10px] opacity-75 truncate">{ev.trabajador}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => alHacerClicDia(dia)}
                    className="mt-2 w-full py-1 text-[11px] font-semibold text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Añadir</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 3. VISTA DIARIA */}
      {vistaCalendario === 'dia' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Cabecera del día */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 capitalize">
                  {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                {isSameDay(currentDate, hoy) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                    Hoy
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {getEventosPorFecha(currentDate).length === 0
                  ? 'No hay actividades registradas en esta fecha.'
                  : `${getEventosPorFecha(currentDate).length} actividad(es) programada(s).`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => alHacerClicDia(currentDate)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva reserva o acceso</span>
            </button>
          </div>
          {/* Lista de actividades del día */}
          <div className="p-4 sm:p-6">
            {getEventosPorFecha(currentDate).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-700">Día sin actividad</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                  No hay reservas de sala, sesiones de fisioterapia ni accesos registrados para este día.
                </p>
                <button
                  type="button"
                  onClick={() => alHacerClicDia(currentDate)}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white font-semibold text-xs rounded-xl hover:bg-orange-600 transition cursor-pointer"
                >
                  Registrar para hoy
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {getEventosPorFecha(currentDate).map((ev) => {
                  let badge = 'bg-gray-50 border-gray-200 text-gray-800';
                  let icon = <Clock className="w-5 h-5 text-gray-500" />;
                  if (ev.tipo === 'fisio') {
                    badge = 'bg-orange-50/70 border-orange-200 text-orange-950';
                    icon = <HeartPulse className="w-5 h-5 text-orange-500" />;
                  } else if (ev.tipo === 'sala') {
                    badge = 'bg-blue-50/70 border-blue-200 text-blue-950';
                    icon = <Building2 className="w-5 h-5 text-blue-500" />;
                  } else if (ev.tipo === 'acceso') {
                    badge = 'bg-emerald-50/70 border-emerald-200 text-emerald-950';
                    icon = <LogIn className="w-5 h-5 text-emerald-600" />;
                  }
                  return (
                    <div
                      key={ev.id}
                      onClick={() => abrirDetalleEvento(ev)}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-xs cursor-pointer hover:shadow-md ${badge}`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="p-2.5 bg-white rounded-xl shadow-xs border border-gray-100 shrink-0">
                          {icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                              {ev.hora}
                            </span>
                            <h4 className="font-extrabold text-sm text-gray-900">{ev.titulo}</h4>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-semibold text-gray-700">Persona:</span> {ev.trabajador}
                          </p>
                        </div>
                      </div>
                                            <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirDetalleEvento(ev);
                        }}
                        className="text-xs font-bold text-gray-700 hover:text-orange-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 transition shadow-2xs self-end sm:self-center cursor-pointer"
                      >
                        Ver detalle
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* VENTANA EMERGENTE (MODAL) AL PULSAR UN DÍA                    */}
      {/* ============================================================ */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full animate-in fade-in duration-150 relative">
            
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {modalVista !== 'opciones' && (
                  <button
                    onClick={() => {
                      setFormError(null);
                      setModalVista('opciones');
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition"
                    title="Volver a las opciones"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 capitalize">
                    {selectedDate.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Error dentro del modal */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}
            {/* Contenido según modalVista */}
            <div className="p-6">
              
              {/* VISTA 1: LAS 3 OPCIONES PRINCIPALES */}
              {modalVista === 'opciones' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Selecciona acción:
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Opción 1: Registrar entrada o salida */}
                    <button
                      onClick={() => abrirFormularioAcceso('entrada')}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-800 hover:bg-gray-50 transition text-left shadow-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900 text-sm">
                            Registrar entrada o salida
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Registrar entrada o salida.
                        </p>
                      </div>
                    </button>
                    {/* Opción 2: Reservar fisio */}
                    <button
                      onClick={() => {
                        setFormError(null);
                        setModalVista('fisio');
                      }}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-800 hover:bg-gray-50 transition text-left shadow-xs"
                    >
                       <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900 text-sm">
                            Reservar fisio
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Reservar cita de fisioterapia para un trabajador.
                        </p>
                      </div>
                    </button>
                    {/* Opción 3: Reservar sala */}
                    <button
                      onClick={() => {
                        setFormError(null);
                        setModalVista('sala');
                      }}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-800 hover:bg-gray-50 transition text-left shadow-xs"
                    >
                       <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900 text-sm">
                            Reservar sala
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Reservar una sala de reuniones o formación.
                        </p>
                      </div>
                    </button>
                  </div>
                                    {/* Actividad previa de este día */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                      Actividad registrada en este día
                    </span>
                    {eventosDiaSeleccionado.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">
                        No hay ninguna reserva ni acceso registrado para este día.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {eventosDiaSeleccionado.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => abrirDetalleEvento(ev)}
                            className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100/80 transition cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  ev.tipo === 'fisio'
                                    ? 'bg-orange-500'
                                    : ev.tipo === 'sala'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-800'
                                }`}
                              />
                              <span className="font-bold text-gray-900">{ev.titulo}:</span>
                              <span className="text-gray-600">{ev.trabajador}</span>
                            </div>
                            <span className="text-gray-500 font-mono text-[11px] font-medium">{ev.hora}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* VISTA 2: FORMULARIO ENTRADA / SALIDA (CUADRADO DE HORA MODIFICABLE, PREDEFINIDO CON HORA ACTUAL) */}
              {modalVista === 'entrada-salida' && (
                <form onSubmit={guardarAcceso} className="space-y-4">
                  {/* Selector Entrada o Salida */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormAcceso((prev) => ({ ...prev, tipoAccion: 'entrada' }))}
                      className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                        formAcceso.tipoAccion === 'entrada'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      Registrar Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAcceso((prev) => ({ ...prev, tipoAccion: 'salida' }))}
                      className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                        formAcceso.tipoAccion === 'salida'
                          ? 'bg-white text-orange-500 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Registrar Salida
                    </button>
                  </div>
                  {/* Cuadrado de selección de Hora (predefinido con la hora de pulsación) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Hora de {formAcceso.tipoAccion} *
                    </label>
                    <TimePicker
                      id="home-acceso-hora"
                      name="hora"
                      required
                      value={formAcceso.hora}
                      onChange={(e) => setFormAcceso({ ...formAcceso, hora: e.target.value })}
                    />
                  </div>
                  {formAcceso.tipoAccion === 'entrada' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formAcceso.nombre}
                          onChange={(e) => setFormAcceso({ ...formAcceso, nombre: e.target.value })}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        DNI *
                      </label>
                      <input
                        type="text"
                        required
                        value={formAcceso.dni}
                        onChange={(e) => setFormAcceso({ ...formAcceso, dni: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 uppercase"
                      />
                  </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Empresa
                          </label>
                          <input
                            type="text"
                            value={formAcceso.empresa}
                            onChange={(e) => setFormAcceso({ ...formAcceso, empresa: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Motivo
                          </label>
                          <input
                            type="text"
                            value={formAcceso.motivoVisita}
                            onChange={(e) => setFormAcceso({ ...formAcceso, motivoVisita: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModalVista('opciones')}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={enviandoForm}
                      className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {enviandoForm ? (
                        'Guardando...'
                      ) : (
                        <>
                          {formAcceso.tipoAccion === 'entrada' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                          <span>Confirmar {formAcceso.tipoAccion}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
              {/* VISTA 3: FORMULARIO RESERVA FISIO */}
              {modalVista === 'fisio' && (
                <form onSubmit={guardarFisio} className="space-y-4">
                  <TrabajadorSelect
                    trabajadores={trabajadores}
                    value={formFisio.trabajadorId}
                    onChange={(id) => setFormFisio({ ...formFisio, trabajadorId: id })}
                    required
                    id="fisio-trabajador"
                    label="Trabajador *"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Hora de la cita
                    </label>
                    <TimePicker
                      id="home-fisio-hora"
                      name="hora"
                      required
                      value={formFisio.hora}
                      onChange={(e) => setFormFisio({ ...formFisio, hora: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Notas
                    </label>
                    <textarea
                      rows={2}
                      value={formFisio.notas}
                      onChange={(e) => setFormFisio({ ...formFisio, notas: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModalVista('opciones')}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={enviandoForm}
                      className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-500/90 transition disabled:opacity-50"
                    >
                      {enviandoForm ? 'Guardando...' : 'Confirmar Reserva Fisio'}
                    </button>
                  </div>
                </form>
              )}
              {/* VISTA 4: FORMULARIO RESERVA SALA */}
              {modalVista === 'sala' && (
                <form onSubmit={guardarSala} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Sala a reservar *
                    </label>
                    <Select
                      id="home-sala-select"
                      name="salaId"
                      required
                      value={formSala.salaId}
                      onChange={(e) => setFormSala({ ...formSala, salaId: e.target.value })}
                      placeholder="Selecciona una sala"
                      options={salasDisponibles.map((s) => ({ value: s.id, label: s.nombre }))}
                    />
                  </div>
                  <TrabajadorSelect
                    trabajadores={trabajadores}
                    value={formSala.trabajadorId}
                    onChange={(id) => setFormSala({ ...formSala, trabajadorId: id })}
                    required
                    id="sala-trabajador"
                    label="Trabajador solicitante *"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Hora inicio
                      </label>
                      <TimePicker
                        id="home-sala-hora"
                        name="horaInicio"
                        required
                        value={formSala.horaInicio}
                        onChange={(e) => setFormSala({ ...formSala, horaInicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Duración
                      </label>
                      <Select
                          id="home-duracion-select"
                          name="duracionMinutos"
                          value={formSala.duracionMinutos}
                          onChange={(e) => setFormSala({ ...formSala, duracionMinutos: e.target.value })}
                          options={[
                            { value: 30, label: '30 min' },
                            { value: 45, label: '45 min' },
                            { value: 60, label: '1 hora' },
                            { value: 90, label: '1h 30m' },
                            { value: 120, label: '2 horas' },
                          ]}
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Notas
                    </label>
                    <input
                      type="text"
                      value={formSala.motivo}
                      onChange={(e) => setFormSala({ ...formSala, motivo: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModalVista('opciones')}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={enviandoForm}
                      className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-500 transition disabled:opacity-50"
                    >
                      {enviandoForm ? 'Guardando...' : 'Confirmar Reserva Sala'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* VENTANA EMERGENTE (MODAL) DETALLE DE ACTIVIDAD               */}
      {/* ============================================================ */}
      {modalDetalleAbierto && eventoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full animate-in fade-in duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Detalle de la actividad
              </h3>
              <button
                type="button"
                onClick={() => setModalDetalleAbierto(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="divide-y divide-gray-100 text-sm">
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-gray-500 font-medium">Actividad</span>
                  <div className="flex items-center gap-2 text-right">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        eventoDetalle.tipo === 'fisio'
                          ? 'bg-orange-500'
                          : eventoDetalle.tipo === 'sala'
                          ? 'bg-blue-500'
                          : 'bg-gray-800'
                      }`}
                    />
                    <span className="font-semibold text-gray-900">{eventoDetalle.titulo}</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-gray-500 font-medium">Hora</span>
                  <span className="font-mono text-gray-900 text-right">{eventoDetalle.hora}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-gray-500 font-medium">Persona</span>
                  <span className="font-semibold text-gray-900 text-right">{eventoDetalle.trabajador}</span>
                </div>

                {eventoDetalle.detalle && (
                  <div className="py-2.5 flex items-start justify-between gap-4">
                    <span className="text-gray-500 font-medium shrink-0">Detalle</span>
                    <span className="text-gray-900 text-right">{eventoDetalle.detalle}</span>
                  </div>
                )}

                {eventoDetalle.tipo === 'acceso' && (
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-gray-500 font-medium">Salida</span>
                    {eventoDetalle.tieneSalida ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Registrada a las {eventoDetalle.horaSalida}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Pendiente de registrar
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Botón Registrar salida si es acceso sin salida */}
              {eventoDetalle.tipo === 'acceso' && !eventoDetalle.tieneSalida && (
                <button
                  type="button"
                  onClick={() => ejecutarSalidaDirecta(eventoDetalle)}
                  disabled={enviandoSalida}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{enviandoSalida ? 'Registrando...' : 'Registrar salida'}</span>
                </button>
              )}

              {errorSalida && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorSalida}</span>
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalDetalleAbierto(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
