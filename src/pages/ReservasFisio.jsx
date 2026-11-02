import { useToast } from '../context/toast';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../services/api';
import TrabajadorSelect from '../components/TrabajadorSelect';
import DateTimePicker from '../components/DateTimePicker';

const inputClass = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white transition shadow-xs';
const buttonClass = 'rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500/90 disabled:opacity-50';
const secondaryClass = 'rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50';
const nombre = t => t?.nombreCompleto || [t?.nombre, t?.apellidos].filter(Boolean).join(' ') || '—';
const fecha = v => v ? new Date(v).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const mensaje = (err, fallback) => err.response?.data?.errors ? Object.values(err.response.data.errors).join(' ') : err.response?.data?.message || fallback;
const columnas = [['trabajador', 'Trabajador'], ['fechaHora', 'Fecha y hora'], ['notas', 'Notas']];

export default function ReservasFisio() {
  const [reservas, setReservas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const setExito = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState('proximas');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([api.get('/api/reservas-fisio'), api.get('/api/trabajadores')])
      .then(([reservasRes, trabajadoresRes]) => {
        if (!activo) return;
        setReservas(reservasRes.data);
        setTrabajadores(trabajadoresRes.data);
        
      }).catch(err => { if (activo) setError(mensaje(err, 'No se pudieron cargar los datos. Recarga la página para reintentar.')); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, []);

  async function cargarReservas() {
    try { const { data } = await api.get('/api/reservas-fisio'); setReservas(data); setError(''); }
    catch (err) { setError(mensaje(err, 'No se pudo actualizar el listado. Recarga la página.')); }
  }

  function abrir(r = null) {
    setEditando(r);
    setForm({ trabajadorId: r?.trabajador?.id?.toString() || '', fechaHora: r?.fechaHora?.slice(0, 16) || '', notas: r?.notas || '' });
    setFormError(''); setModal(true);
  }

  async function guardar(e) {
    e.preventDefault();
    if (ocupado) return;
    setFormError('');
    
    const payload = { trabajadorId: Number(form.trabajadorId), fechaHora: form.fechaHora, notas: form.notas.trim() };
    setOcupado(true);
    try {
      if (editando) await api.put(`/api/reservas-fisio/${editando.id}`, payload);
      else await api.post('/api/reservas-fisio', payload);
      setModal(false); setExito(editando ? 'Reserva actualizada correctamente.' : 'Reserva creada correctamente.');
      await cargarReservas();
    } catch (err) { setFormError(mensaje(err, 'No se pudo guardar la reserva.')); }
    finally { setOcupado(false); }
  }

  async function eliminar() {
    if (ocupado || !eliminando) return;
    setOcupado(true); setDeleteError('');
    try {
      await api.delete(`/api/reservas-fisio/${eliminando.id}`);
      setEliminando(null); setExito('Reserva eliminada correctamente.'); await cargarReservas();
    } catch (err) { setDeleteError(mensaje(err, 'No se pudo eliminar la reserva.')); }
    finally { setOcupado(false); }
  }

  const esFinalizada = (r) => {
    if (!r.fechaHora) return false;
    const finMs = new Date(r.fechaHora).getTime() + 45 * 60 * 1000;
    return finMs < Date.now();
  };

  const totalProximas = reservas.filter(r => !esFinalizada(r)).length;
  const totalPasadas = reservas.filter(r => esFinalizada(r)).length;

  const filtradas = reservas
    .filter(r => {
      const texto = [nombre(r.trabajador), r.trabajador?.dni, r.notas, r.fechaHora]
        .join(' ')
        .toLocaleLowerCase('es');
      if (!texto.includes(busqueda.trim().toLocaleLowerCase('es'))) return false;

      const finalizada = esFinalizada(r);
      if (filtroTiempo === 'proximas') return !finalizada;
      if (filtroTiempo === 'pasadas') return finalizada;
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.fechaHora).getTime();
      const timeB = new Date(b.fechaHora).getTime();
      return filtroTiempo === 'proximas' ? timeA - timeB : timeB - timeA;
    });
  const cambiar = e => setForm({ ...form, [e.target.name]: e.target.value });
  
  function celda(r, key) {
    if (key === 'trabajador') return nombre(r.trabajador);
    if (key === 'sala') return r.sala?.nombre || '—';
    if (key.startsWith('fechaHora')) return fecha(r[key]);
    return r[key] ?? '—';
  }

  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Reservas Fisio</h1><p className="mt-1 text-sm text-gray-500">Gestiona las citas de fisioterapia.</p></div>
      <div className="flex gap-2"><button disabled={loading || Boolean(error) || !trabajadores.length} onClick={() => abrir()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-500/90 transition shadow-xs shadow-orange-500/20 disabled:opacity-50"><Plus className="w-4 h-4" /><span>Nueva reserva</span></button></div>
    </div>
    {error && <p role="alert" className="p-4 bg-red-50 rounded-xl text-sm text-red-800">{error}</p>}
    {!loading && !error && !trabajadores.length && <p className="text-sm text-gray-600">Para crear reservas, <Link className="text-orange-500 underline" to="/trabajadores">registra primero un trabajador</Link>.</p>}
    
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
      <div className="flex-1">
        <input aria-label="Buscar reservas" placeholder="Buscar por trabajador, DNI, fecha o descripción..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className={inputClass} />
      </div>
      <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-semibold shrink-0 shadow-2xs self-start sm:self-auto">
        <button
          type="button"
          onClick={() => setFiltroTiempo('proximas')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            filtroTiempo === 'proximas'
              ? 'bg-white text-gray-900 shadow-xs font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Próximas {reservas.length > 0 && `(${totalProximas})`}
        </button>
        <button
          type="button"
          onClick={() => setFiltroTiempo('pasadas')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            filtroTiempo === 'pasadas'
              ? 'bg-white text-gray-900 shadow-xs font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pasadas {reservas.length > 0 && `(${totalPasadas})`}
        </button>
        <button
          type="button"
          onClick={() => setFiltroTiempo('todas')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            filtroTiempo === 'todas'
              ? 'bg-white text-gray-900 shadow-xs font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Todas
        </button>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {loading ? <p className="p-8 text-center text-gray-500">Cargando reservas...</p> : error && !reservas.length ? <p className="p-8 text-center text-gray-500">Listado no disponible.</p> : !filtradas.length ? <div className="p-8 text-center text-gray-500"><p>{busqueda ? 'No hay coincidencias con la búsqueda.' : filtroTiempo === 'proximas' ? 'No hay reservas próximas.' : filtroTiempo === 'pasadas' ? 'No hay reservas pasadas.' : 'No hay reservas registradas.'}</p>{!busqueda && filtroTiempo === 'proximas' && totalPasadas > 0 && <button type="button" onClick={() => setFiltroTiempo('pasadas')} className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700 underline cursor-pointer">Ver las {totalPasadas} reservas pasadas en el historial</button>}</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm text-gray-700">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{columnas.map(([key, label]) => <th className="px-5 py-3" key={key}>{label}</th>)}<th className="px-5 py-3 text-right">Acciones</th></tr></thead>
        <tbody className="divide-y divide-gray-100">{filtradas.map(r => <tr key={r.id} className="hover:bg-gray-50">{columnas.map(([key]) => <td key={key} className="px-5 py-3.5 whitespace-pre-wrap">{celda(r, key)}</td>)}<td className="px-5 py-3.5 text-right whitespace-nowrap"><button aria-label={`Editar reserva ${r.id}`} onClick={() => abrir(r)} className="p-2 text-gray-500 hover:text-orange-500"><Edit2 className="w-4 h-4" /></button><button aria-label={`Eliminar reserva ${r.id}`} onClick={() => { setEliminando(r); setDeleteError(''); }} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
      </table></div>}
    </div>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="reserva-titulo" className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h2 id="reserva-titulo" className="text-lg font-bold text-gray-900">{editando ? 'Editar reserva' : 'Nueva reserva'}</h2><button disabled={ocupado} aria-label="Cerrar formulario" onClick={() => setModal(false)}><X className="w-5 h-5" /></button></div>
      <form onSubmit={guardar} className="p-6 space-y-4">
        {formError && <p role="alert" className="p-3 bg-red-50 rounded-lg text-sm text-red-700">{formError}</p>}
        <fieldset disabled={ocupado} className="space-y-4">
          <TrabajadorSelect trabajadores={trabajadores} value={form.trabajadorId} onChange={id => setForm({ ...form, trabajadorId: id })} required id="reserva-trabajador" label="Trabajador *" />
          <DateTimePicker id="reserva-fechaHora" name="fechaHora" label="Fecha y hora de la cita *" required value={form.fechaHora} onChange={cambiar} disabled={ocupado} />
          <div><label htmlFor="reserva-notas" className="block mb-1 text-sm font-semibold text-gray-600">Notas</label><input id="reserva-notas" name="notas" type="text" maxLength={255} value={form.notas} onChange={cambiar} className={inputClass} /></div>
        </fieldset>
        <div className="flex justify-end gap-2 pt-3"><button type="button" disabled={ocupado} onClick={() => setModal(false)} className={secondaryClass}>Cancelar</button><button disabled={ocupado} className={buttonClass}>{ocupado ? 'Guardando...' : 'Guardar reserva'}</button></div>
      </form>
    </section></div>}
    {eliminando && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="eliminar-titulo" className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"><h2 id="eliminar-titulo" className="text-lg font-bold text-gray-900">¿Eliminar reserva?</h2><p className="text-sm text-gray-600">Vas a eliminar la reserva #{eliminando.id} de <strong>{nombre(eliminando.trabajador)}</strong> del {fecha(eliminando.fechaHora)}. Esta acción no se puede deshacer.</p>{deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}<div className="flex justify-end gap-2"><button disabled={ocupado} onClick={() => setEliminando(null)} className={secondaryClass}>Cancelar</button><button disabled={ocupado} onClick={eliminar} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">{ocupado ? 'Eliminando...' : 'Eliminar'}</button></div></section></div>}
  </div>;
}
