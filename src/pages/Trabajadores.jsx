import { useToast } from '../context/toast';
import { useEffect, useState } from 'react';
import { Edit2, Trash2, UserPlus, X } from 'lucide-react';
import api from '../services/api';
import { validarDniNie } from '../utils/dniValidator';
const vacio = { nombre: '', apellidos: '', dni: '', correo: '', departamento: '' };
const campos = [
  ['nombre', 'Nombre'], ['apellidos', 'Apellidos'], ['dni', 'DNI'],
  ['correo', 'Correo electrónico'], ['departamento', 'Departamento'],
];
const inputClass = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500';
const secondaryClass = 'px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50';
function mensajeError(err, fallback) {
  const data = err.response?.data;
  return data?.errors ? Object.values(data.errors).join(' ') : data?.message || fallback;
}
export default function Trabajadores() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const setExito = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(vacio);
  const [formError, setFormError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [guardando, setGuardando] = useState(false);
  async function cargar() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/trabajadores');
      setTrabajadores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los trabajadores. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let activo = true;
    api.get('/api/trabajadores').then(({ data }) => {
      if (activo) setTrabajadores(Array.isArray(data) ? data : []);
    }).catch(err => {
      if (activo) setError(mensajeError(err, 'No se pudieron cargar los trabajadores. Inténtalo de nuevo.'));
    }).finally(() => {
      if (activo) setLoading(false);
    });
    return () => { activo = false; };
  }, []);
  function abrir(trabajador = null) {
    setEditando(trabajador);
    setForm(Object.fromEntries(campos.map(([key]) => [key, trabajador?.[key] || ''])));
    setFormError('');
    setModal(true);
  }
  async function guardar(event) {
    event.preventDefault();
    if (guardando) return;
    const payload = Object.fromEntries(campos.map(([key]) => [key, form[key].trim()]));
    if (campos.some(([key]) => key !== 'departamento' && !payload[key])) {
      setFormError('Completa los campos obligatorios.');
      return;
    }
    const dniVal = validarDniNie(payload.dni);
    if (!dniVal.valido) {
      setFormError(dniVal.error);
      return;
    }
    payload.dni = dniVal.dniFormateado;
    payload.correo = payload.correo.toLowerCase();
    setGuardando(true);
    setFormError('');
    try {
      if (editando) await api.put(`/api/trabajadores/${editando.id}`, payload);
      else await api.post('/api/trabajadores', payload);
      setModal(false);
      setExito(editando ? 'Trabajador actualizado correctamente.' : 'Trabajador creado correctamente.');
      await cargar();
    } catch (err) {
      setFormError(mensajeError(err, 'No se pudo guardar el trabajador.'));
    } finally {
      setGuardando(false);
    }
  }
  async function eliminar() {
    if (!eliminando || guardando) return;
    setGuardando(true);
    setDeleteError('');
    try {
      await api.delete(`/api/trabajadores/${eliminando.id}`);
      setEliminando(null);
      setExito('Trabajador eliminado correctamente.');
      await cargar();
    } catch (err) {
      setDeleteError(mensajeError(err, 'No se pudo eliminar el trabajador. Inténtalo de nuevo.'));
    } finally {
      setGuardando(false);
    }
  }
  const filtrados = trabajadores.filter(t => campos.map(([key]) => t[key] || '').join(' ').toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es')));
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Trabajadores</h1>
          <p className="text-sm text-gray-500 mt-1">Consulta y administra los empleados de la empresa.</p>
        </div>
        <div className="flex items-center gap-2">
          
          <button onClick={() => abrir()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-500"><UserPlus className="w-4 h-4" />Nuevo trabajador</button>
        </div>
      </div>
      {error && <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">{error}</div>}
      <input aria-label="Buscar trabajadores" className={inputClass} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, apellidos, DNI, correo o departamento..." />
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? <p className="p-10 text-center text-gray-500">Cargando trabajadores...</p>
          : filtrados.length === 0 ? <p className="p-10 text-center text-gray-500">{error ? 'La lista no está disponible. Recarga la página para reintentar.' : trabajadores.length ? 'No hay trabajadores que coincidan con la búsqueda.' : 'No hay trabajadores registrados.'}</p>
            : <div className="overflow-x-auto"><table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Nombre completo</th><th className="px-5 py-3">DNI</th><th className="px-5 py-3">Correo</th><th className="px-5 py-3">Departamento</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{filtrados.map(t => <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-semibold text-gray-900">{t.nombre} {t.apellidos}</td><td className="px-5 py-3.5">{t.dni}</td><td className="px-5 py-3.5">{t.correo}</td><td className="px-5 py-3.5">{t.departamento || '—'}</td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap"><button onClick={() => abrir(t)} aria-label={`Editar a ${t.nombre} ${t.apellidos}`} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl"><Edit2 className="w-4 h-4" /></button><button onClick={() => { setEliminando(t); setDeleteError(''); }} aria-label={`Eliminar a ${t.nombre} ${t.apellidos}`} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button></td>
              </tr>)}</tbody>
            </table></div>}
      </div>
      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs">
        <section role="dialog" aria-modal="true" aria-labelledby="trabajador-titulo" className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h2 id="trabajador-titulo" className="text-lg font-bold text-gray-900">{editando ? 'Editar trabajador' : 'Nuevo trabajador'}</h2><button disabled={guardando} aria-label="Cerrar formulario" onClick={() => setModal(false)}><X className="w-5 h-5" /></button></div>
          <form onSubmit={guardar} className="p-6 space-y-4">
            {formError && <p role="alert" className="p-3 bg-red-50 rounded-xl text-sm text-red-700">{formError}</p>}
            {campos.map(([key, label], index) => <div key={key}><label htmlFor={`trabajador-${key}`} className="block text-sm font-semibold text-gray-600 mb-1">{label}{key === 'departamento' ? '' : ' *'}</label><input id={`trabajador-${key}`} autoFocus={index === 0} type={key === 'correo' ? 'email' : 'text'} required={key !== 'departamento'} maxLength={255} disabled={guardando} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className={inputClass} /></div>)}
            <div className="flex justify-end gap-2 pt-3"><button type="button" disabled={guardando} onClick={() => setModal(false)} className={secondaryClass}>Cancelar</button><button disabled={guardando} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-500/90 disabled:opacity-50">{guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear trabajador'}</button></div>
          </form>
        </section>
      </div>}
      {eliminando && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs"><section role="dialog" aria-modal="true" aria-labelledby="eliminar-titulo" className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h2 id="eliminar-titulo" className="text-lg font-bold text-gray-900">¿Eliminar trabajador?</h2><p className="text-sm text-gray-600">Vas a eliminar a <strong>{eliminando.nombre} {eliminando.apellidos}</strong> y todas sus reservas de salas y fisioterapia. Esta acción no se puede deshacer.</p>
        {deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}
        <div className="flex justify-end gap-2"><button disabled={guardando} onClick={() => setEliminando(null)} className={secondaryClass}>Cancelar</button><button disabled={guardando} onClick={eliminar} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">{guardando ? 'Eliminando...' : 'Eliminar'}</button></div>
      </section></div>}
    </div>
  );
}
