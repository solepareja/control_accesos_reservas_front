import { useToast } from '../context/toast';
import { Link } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';
import { validarDniNie } from '../utils/dniValidator';
import { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  LogIn, 
  LogOut, 
  Search, 
  User, 
  AlertCircle, 
  Edit2,
  Trash2,
  X,
  Tablet,
  Eye,
  Clock,
  Building2,
  ClipboardList,
  CheckCircle2,
  PenTool
} from 'lucide-react';
import api from '../services/api';
import DateTimePicker from '../components/DateTimePicker';
import TimePicker from '../components/TimePicker';

export default function EntradasSalidas() {
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mostrarExito = useToast();
  const [filtro, setFiltro] = useState('');

  // Modal para fichaje rápido
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoAccion, setTipoAccion] = useState('entrada'); // 'entrada' o 'salida'
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editando, setEditando] = useState(null);
  const [formEdicion, setFormEdicion] = useState({});
  const [eliminando, setEliminando] = useState(null);
  const [errorGestion, setErrorGestion] = useState('');
  const [detalleVisita, setDetalleVisita] = useState(null);

  const calcularDuracion = (inicioStr, finStr) => {
    if (!inicioStr) return '-';
    const inicio = new Date(inicioStr);
    const fin = finStr ? new Date(finStr) : new Date();
    const diffMs = fin - inicio;
    if (isNaN(diffMs) || diffMs < 0) return '-';
    const diffMinutos = Math.floor(diffMs / 60000);
    const horas = Math.floor(diffMinutos / 60);
    const minutos = diffMinutos % 60;
    if (horas === 0) return `${minutos} min`;
    return `${horas}h ${minutos > 0 ? `${minutos}min` : ''}`;
  };

  const abrirEdicion = (item) => {
    setEditando(item);
    setFormEdicion({ nombre: item.nombre || '', dni: item.dni || '', empresa: item.empresa || '',
      motivoVisita: item.motivoVisita || '', fechaHoraEntrada: item.fechaHoraEntrada?.slice(0, 16) || '',
      fechaHoraSalida: item.fechaHoraSalida?.slice(0, 16) || '' });
    setErrorGestion('');
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (guardando) return;
    setErrorGestion('');
    if (!formEdicion.nombre.trim() || !formEdicion.dni.trim()) {
      setErrorGestion('El nombre y el DNI son obligatorios.'); return;
    }
    const dniEdicionVal = validarDniNie(formEdicion.dni);
    if (!dniEdicionVal.valido) {
      setErrorGestion(dniEdicionVal.error);
      return;
    }
    if (formEdicion.fechaHoraSalida && new Date(formEdicion.fechaHoraSalida) < new Date(formEdicion.fechaHoraEntrada)) {
      setErrorGestion('La salida no puede ser anterior a la entrada.'); return;
    }
    setGuardando(true);
    try {
      await api.put(`/api/accesos/${editando.id}`, { ...formEdicion, nombre: formEdicion.nombre.trim(),
        dni: dniEdicionVal.dniFormateado, fechaHoraSalida: formEdicion.fechaHoraSalida || null });
      setEditando(null); mostrarExito('Acceso actualizado correctamente.'); await cargarAccesos();
    } catch (err) {
      setErrorGestion(err.response?.data?.errors ? Object.values(err.response.data.errors).join(' ') : err.response?.data?.message || 'No se pudo guardar el acceso.');
    } finally { setGuardando(false); }
  };

  const eliminarAcceso = async () => {
    if (guardando || !eliminando) return;
    setGuardando(true); setErrorGestion('');
    try {
      await api.delete(`/api/accesos/${eliminando.id}`);
      setEliminando(null); mostrarExito('Acceso eliminado correctamente.'); await cargarAccesos();
    } catch (err) { setErrorGestion(err.response?.data?.message || 'No se pudo eliminar el acceso.'); }
    finally { setGuardando(false); }
  };

  const obtenerHoraActualHHMM = () => {
    const ahora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    hora: obtenerHoraActualHHMM(),
    empresa: '',
    motivoVisita: '',
  });

  const cargarAccesos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/accesos');
      setAccesos(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error cargando accesos:', err);
      setError('No se pudo conectar con el servidor para cargar los accesos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAccesos();
  }, []);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    try {
      const date = new Date(fechaStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  const formatIsoDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const abrirModal = (tipo, dniPredef = '', personaPredef = null) => {
    setTipoAccion(tipo);
    setFormError(null);
    setFormData({
      salidaId: personaPredef?.id || null,
      nombre: personaPredef?.nombre || '',
      dni: personaPredef?.dni || dniPredef,
      hora: obtenerHoraActualHHMM(), // Se predefine con la hora al pulsar el botón
      empresa: personaPredef?.empresa || '',
      motivoVisita: personaPredef?.motivoVisita || '',
      firma: '',
    });
    setModalAbierto(true);
  };

  const ejecutarFichaje = async (e) => {
    e.preventDefault();
    setFormError(null);
    setGuardando(true);

    try {
      const hoy = new Date();
      const fechaBase = formatIsoDate(hoy);
      const horaSeleccionada = formData.hora || obtenerHoraActualHHMM();
      const fechaHoraIso = `${fechaBase}T${horaSeleccionada.length === 5 ? horaSeleccionada + ':00' : horaSeleccionada}`;

      if (tipoAccion === 'entrada') {
        if (!formData.nombre.trim() || !formData.dni.trim()) {
          setFormError('El nombre y el DNI son obligatorios.');
          setGuardando(false);
          return;
        }
        const dniEntradaVal = validarDniNie(formData.dni);
        if (!dniEntradaVal.valido) {
          setFormError(dniEntradaVal.error);
          setGuardando(false);
          return;
        }
        await api.post('/api/accesos/entrada', {
          nombre: formData.nombre.trim(),
          dni: dniEntradaVal.dniFormateado,
          fechaHoraEntrada: fechaHoraIso,
          firma: formData.firma || null,
          empresa: formData.empresa || null,
          motivoVisita: formData.motivoVisita || null,
        });
        mostrarExito(`Entrada registrada a las ${horaSeleccionada}`);
      } else {
        // Salida
        if (formData.salidaId) {
          await api.post(`/api/accesos/${formData.salidaId}/salida`, {
            fechaHoraSalida: fechaHoraIso,
          });
        } else {
          if (!formData.dni.trim()) {
            setFormError('El DNI es obligatorio.');
            setGuardando(false);
            return;
          }
          const dniSalidaVal = validarDniNie(formData.dni);
          if (!dniSalidaVal.valido) {
            setFormError(dniSalidaVal.error);
            setGuardando(false);
            return;
          }
          await api.post('/api/accesos/salida', {
            dni: dniSalidaVal.dniFormateado,
            fechaHoraSalida: fechaHoraIso,
          });
        }
        mostrarExito(`Salida registrada a las ${horaSeleccionada}`);
      }

      setModalAbierto(false);
      cargarAccesos();
    } catch (err) {
      console.error('Error al fichar:', err);
      const msg = err.response?.data?.message || 'Error al procesar el registro.';
      setFormError(msg);
    } finally {
      setGuardando(false);
    }
  };

  // Marcar salida rápida para un acceso activo
  const marcarSalidaRapida = async (item) => {
    try {
      const horaActualStr = obtenerHoraActualHHMM();
      const hoy = new Date();
      const fechaHoraIso = `${formatIsoDate(hoy)}T${horaActualStr}:00`;

      if (item.id) {
        await api.post(`/api/accesos/${item.id}/salida`, {
          fechaHoraSalida: fechaHoraIso,
        });
      } else {
        await api.post('/api/accesos/salida', {
          dni: item.dni,
          fechaHoraSalida: fechaHoraIso,
        });
      }

      mostrarExito(`Salida de ${item.nombre || item.dni} registrada a las ${horaActualStr}`);
      cargarAccesos();
    } catch (err) {
      console.error('Error al registrar salida rápida:', err);
      setError(err.response?.data?.message || 'No se pudo registrar la salida.');
    }
  };


  const accesosFiltrados = accesos.filter((acc) => {
    const texto = `${acc.nombre || acc.trabajadorNombre || ''} ${acc.dni || acc.trabajadorDni || ''} ${acc.empresa || ''} ${acc.id || ''}`.toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Entradas / Salidas
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Registro de accesos.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => abrirModal('entrada')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition shadow-xs"
          >
            <LogIn className="w-4 h-4 text-white-400" />
            <span>Registrar Entrada</span>
          </button>

          <button
            onClick={() => abrirModal('salida')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-500/90 transition shadow-xs shadow-orange-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Registrar Salida</span>
          </button>

          <Link
            to="/tablet"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gray-300 hover:bg-gray-200 text-white rounded-xl text-sm font-bold transition shadow-xs"
          >
            <Tablet className="w-4 h-4" />
            <span>Modo Tablet</span>
          </Link>

          
        </div>
      </div>

      {/* Mensaje de éxito */}


      {/* Estado de error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Buscador */}
      <input
        type="text"
        aria-label="Buscar accesos"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Buscar por nombre, DNI, empresa..."
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white transition shadow-xs"
      />

      {/* Tabla de registros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Cargando registros de entradas y salidas...
          </div>
        ) : accesosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {accesos.length === 0
              ? 'No hay registros de entradas y salidas en la base de datos todavía.'
              : 'No se encontraron registros que coincidan con la búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  
                  <th className="px-5 py-3">Persona / Visita</th>
                  <th className="px-5 py-3">DNI</th>
                  <th className="px-5 py-3">Hora Entrada</th>
                  <th className="px-5 py-3">Hora Salida</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accesosFiltrados.map((item) => {
                  const fechaEntrada = item.fechaHoraEntrada || item.fechaEntrada;
                  const fechaSalida = item.fechaHoraSalida || item.fechaSalida;
                  const dentro = !fechaSalida;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {item.nombre || item.trabajadorNombre || 'Sin nombre'}
                          </span>
                        </div>
                        {item.empresa && (
                          <span className="text-[11px] text-gray-400 pl-6 block">
                            {item.empresa}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                        {item.dni || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{formatearFecha(fechaEntrada)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <LogOut className="w-3.5 h-3.5 text-orange-500" />
                          <span>{formatearFecha(fechaSalida)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {dentro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            En planta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Completado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDetalleVisita(item)}
                          aria-label={`Ver detalle del acceso ${item.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Ver detalle de la visita"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => abrirEdicion(item)} aria-label={`Editar acceso ${item.id}`} className="p-2 text-gray-500 hover:text-orange-500 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { setEliminando(item); setErrorGestion(''); }} aria-label={`Eliminar acceso ${item.id}`} className="p-2 text-gray-500 hover:text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        {dentro && (
                          <button
                            onClick={() => marcarSalidaRapida(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/90 hover:text-white rounded-lg text-xs font-semibold transition"
                            title="Registrar salida ahora"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Registrar salida</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle de la Visita (Ojito) */}
      {detalleVisita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Detalle de la Visita
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    Acceso #{detalleVisita.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetalleVisita(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Estado de la visita */}
              {(!detalleVisita.fechaHoraSalida && !detalleVisita.fechaSalida) ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold">Actualmente en instalaciones</span>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    Lleva: {calcularDuracion(detalleVisita.fechaHoraEntrada || detalleVisita.fechaEntrada, null)}
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">Visita completada</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                    Duración: {calcularDuracion(detalleVisita.fechaHoraEntrada || detalleVisita.fechaEntrada, detalleVisita.fechaHoraSalida || detalleVisita.fechaSalida)}
                  </span>
                </div>
              )}

              {/* Ficha de Información Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase text-gray-500 block mb-0.5">
                    Persona / Visitante
                  </span>
                  <div className="font-bold text-gray-900 text-base">
                    {detalleVisita.nombre || detalleVisita.trabajadorNombre || 'Sin nombre'}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-gray-500 block mb-0.5">
                    DNI / Documento
                  </span>
                  <div className="font-mono font-bold text-gray-800 text-base">
                    {detalleVisita.dni || '-'}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-gray-500 block mb-0.5">
                    Empresa
                  </span>
                  <div className="text-gray-800 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>{detalleVisita.empresa || 'Particular / No indicada'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-gray-500 block mb-0.5">
                    Motivo de la Visita
                  </span>
                  <div className="text-gray-800 flex items-center gap-1.5 font-medium">
                    <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                    <span>{detalleVisita.motivoVisita || 'Sin especificar'}</span>
                  </div>
                </div>
              </div>

              {/* Registro de Horas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 mb-1">
                    <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hora de Entrada</span>
                  </div>
                  <div className="font-mono text-sm text-gray-800 font-semibold">
                    {formatearFecha(detalleVisita.fechaHoraEntrada || detalleVisita.fechaEntrada)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-orange-100 bg-orange-50/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-orange-800 mb-1">
                    <LogOut className="w-3.5 h-3.5 text-orange-600" />
                    <span>Hora de Salida</span>
                  </div>
                  <div className="font-mono text-sm text-gray-800 font-semibold">
                    {(detalleVisita.fechaHoraSalida || detalleVisita.fechaSalida)
                      ? formatearFecha(detalleVisita.fechaHoraSalida || detalleVisita.fechaSalida)
                      : <span className="text-orange-600 italic font-sans font-normal">Pendiente de salida</span>}
                  </div>
                </div>
              </div>

              {/* Firma Digital */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-orange-500" />
                  <span>Firma Digital</span>
                </label>
                {detalleVisita.firma ? (
                  <div 
                    className="p-3 border border-gray-200 rounded-xl shadow-xs text-center signature-pad-surface"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <img
                      src={detalleVisita.firma}
                      alt={`Firma de ${detalleVisita.nombre}`}
                      className="max-h-28 mx-auto object-contain"
                    />
                    <span className="text-[10px] text-gray-500 block mt-1.5 font-medium">
                      Firma registrada en el terminal de acceso
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                    No se adjuntó firma digital para este registro.
                  </div>
                )}
              </div>
            </div>

            {/* Pie del modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
              {(!detalleVisita.fechaHoraSalida && !detalleVisita.fechaSalida) ? (
                <button
                  type="button"
                  onClick={() => {
                    const obj = detalleVisita;
                    setDetalleVisita(null);
                    marcarSalidaRapida(obj);
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Registrar salida ahora</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setDetalleVisita(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fichaje Rápido en Entradas/Salidas */}
      {editando && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="acceso-editar-titulo" className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
        <h2 id="acceso-editar-titulo" className="text-lg font-bold text-gray-900">Editar acceso</h2>
        <form onSubmit={guardarEdicion} className="space-y-4">{errorGestion && <p role="alert" className="text-sm text-red-700">{errorGestion}</p>}
          <fieldset disabled={guardando} className="space-y-4">{[['nombre', 'Nombre', 'text', true], ['dni', 'DNI', 'text', true], ['empresa', 'Empresa', 'text', false], ['motivoVisita', 'Motivo', 'text', false], ['fechaHoraEntrada', 'Entrada', 'datetime-local', true], ['fechaHoraSalida', 'Salida (vacía si sigue dentro)', 'datetime-local', false]].map(([key, label, type, required]) => type === 'datetime-local' ? (
            <DateTimePicker
              key={key}
              id={`acceso-${key}`}
              name={key}
              label={label}
              required={required}
              value={formEdicion[key] ? formEdicion[key].slice(0, 16) : ''}
              onChange={e => setFormEdicion({ ...formEdicion, [key]: e.target.value })}
            />
          ) : (
            <div key={key}>
              <label htmlFor={`acceso-${key}`} className="block mb-1 text-sm font-semibold text-gray-600">{label}</label>
              <input id={`acceso-${key}`} type={type} required={required} value={formEdicion[key]} onChange={e => setFormEdicion({ ...formEdicion, [key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500" />
            </div>
          ))}</fieldset>
          <div className="flex justify-end gap-2"><button type="button" disabled={guardando} onClick={() => setEditando(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button><button disabled={guardando} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar acceso'}</button></div>
        </form>
      </section></div>}
      {eliminando && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="acceso-eliminar-titulo" className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4"><h2 id="acceso-eliminar-titulo" className="text-lg font-bold text-gray-900">¿Eliminar acceso?</h2><p className="text-sm text-gray-600">Se eliminará el acceso de <strong>{eliminando.nombre}</strong> del {formatearFecha(eliminando.fechaHoraEntrada)}. Esta acción no se puede deshacer.</p>{errorGestion && <p role="alert" className="text-sm text-red-700">{errorGestion}</p>}<div className="flex justify-end gap-2"><button disabled={guardando} onClick={() => setEliminando(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button><button disabled={guardando} onClick={eliminarAcceso} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">{guardando ? 'Eliminando...' : 'Eliminar'}</button></div></section></div>}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full animate-in fade-in duration-150 relative">
            <div className="px-6 py-4 border-b border-gray-100 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {tipoAccion === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={ejecutarFichaje} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Cuadrado de selección de Hora (predefinido con la hora de pulsación) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Hora de {tipoAccion} *
                </label>
                <TimePicker
                  id="acceso-modal-hora"
                  name="hora"
                  required
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>

              {tipoAccion === 'salida' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-gray-600">
                    Personas dentro (pulsa para autocompletar):
                  </label>
                  {accesos.filter(a => !a.fechaHoraSalida && !a.fechaSalida).length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      No hay personas registradas dentro en este momento.
                    </p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1 p-1 bg-gray-50 rounded-xl border border-gray-200">
                      {accesos.filter(a => !a.fechaHoraSalida && !a.fechaSalida).map((p) => {
                        const seleccionado = formData.salidaId === p.id || formData.dni === p.dni;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                salidaId: p.id,
                                dni: p.dni,
                                nombre: p.nombre,
                              });
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              seleccionado
                                ? 'bg-orange-100 text-orange-900 font-bold border border-orange-200'
                                : 'hover:bg-white text-gray-700'
                            }`}
                          >
                            <span className="font-semibold">{p.nombre} ({p.dni})</span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              Entrada: {formatearFecha(p.fechaHoraEntrada || p.fechaEntrada)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  DNI / Documento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 uppercase font-mono"
                />
              </div>

              {tipoAccion === 'entrada' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.empresa}
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                      Motivo de la visita
                    </label>
                    <input
                      type="text"
                      value={formData.motivoVisita}
                      onChange={(e) => setFormData({ ...formData, motivoVisita: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <SignaturePad
                      value={formData.firma}
                      onChange={(f) => setFormData({ ...formData, firma: f })}
                      label="Firma digital (opcional en panel rápido)"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-500/90 transition disabled:opacity-50"
                >
                  {guardando ? 'Registrando...' : `Confirmar ${tipoAccion}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
