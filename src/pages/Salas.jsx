import { useToast } from '../context/toast';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import SalaCard from '../components/SalaCard';

const input = 'w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:border-orange-500';
const button = 'px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-500/90 disabled:opacity-50';
const secondary = 'px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm disabled:opacity-50';
const mensaje = (err, fallback) => err.response?.data?.errors ? Object.values(err.response.data.errors).join(' ') : err.response?.data?.message || fallback;

export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const setExito = useToast();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '' });
  const [formError, setFormError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let activo = true;
    api.get('/api/salas').then(({ data }) => { if (activo) setSalas(data); })
      .catch(err => { if (activo) setError(mensaje(err, 'No se pudieron cargar las salas. Recarga la página.')); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, []);

  async function cargar() {
    try { const { data } = await api.get('/api/salas'); setSalas(data); setError(''); }
    catch (err) { setError(mensaje(err, 'No se pudo actualizar la lista. Recarga la página.')); }
  }
  function abrir(sala = null) {
    setEditando(sala); setForm({ nombre: sala?.nombre || '' });
    setFormError(''); setModal(true);
  }
  async function guardar(e) {
    e.preventDefault();
    if (ocupado) return;
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    setOcupado(true); setFormError('');
    try {
      const payload = { nombre: form.nombre.trim() };
      if (editando) await api.put(`/api/salas/${editando.id}`, payload);
      else await api.post('/api/salas', payload);
      setModal(false); setExito('Sala guardada correctamente.'); await cargar();
    } catch (err) { setFormError(mensaje(err, 'No se pudo guardar la sala.')); }
    finally { setOcupado(false); }
  }
  async function eliminar() {
    if (ocupado || !eliminando) return;
    setOcupado(true); setDeleteError('');
    try {
      await api.delete(`/api/salas/${eliminando.id}`);
      setEliminando(null); setExito('Sala eliminada correctamente.'); await cargar();
    } catch (err) { setDeleteError(mensaje(err, 'No se pudo eliminar la sala.')); }
    finally { setOcupado(false); }
  }

  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-wrap justify-between items-center gap-4"><div><h1 className="text-3xl font-extrabold text-gray-900">Gestión de Salas</h1><Link to="/reservas-salas" className="text-sm text-orange-500 underline">Ver reservas de salas</Link></div><button onClick={() => abrir()} className={button}><span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" />Nueva sala</span></button></div>
    {error && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</p>}
    {loading ? <p className="p-8 text-center text-gray-500">Cargando salas...</p> : !salas.length ? <p className="p-8 text-center text-gray-500">{error ? 'Listado no disponible.' : 'No hay salas registradas.'}</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{salas.map(s => <SalaCard key={s.id} sala={s}>
      <button onClick={() => abrir(s)} aria-label={`Editar ${s.nombre}`} className="p-2 text-gray-500 hover:text-orange-500"><Edit2 className="w-4 h-4" /></button>
      <button onClick={() => { setEliminando(s); setDeleteError(''); }} aria-label={`Eliminar ${s.nombre}`} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
    </SalaCard>)}</div>}
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="sala-titulo" className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"><h2 id="sala-titulo" className="text-lg font-bold">{editando ? 'Editar sala' : 'Nueva sala'}</h2><form onSubmit={guardar} className="space-y-4">{formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}<fieldset disabled={ocupado} className="space-y-4"><div><label htmlFor="sala-nombre" className="block text-sm mb-1">Nombre *</label><input autoFocus id="sala-nombre" required maxLength={255} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={input} /></div></fieldset><div className="flex justify-end gap-2"><button type="button" disabled={ocupado} onClick={() => setModal(false)} className={secondary}>Cancelar</button><button disabled={ocupado} className={button}>{ocupado ? 'Guardando...' : 'Guardar sala'}</button></div></form></section></div>}
    {eliminando && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="sala-eliminar-titulo" className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4"><h2 id="sala-eliminar-titulo" className="text-lg font-bold">¿Eliminar sala?</h2><p className="text-sm text-gray-600">Se eliminará <strong>{eliminando.nombre}</strong> y todas sus reservas. Esta acción no se puede deshacer.</p>{deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}<div className="flex justify-end gap-2"><button disabled={ocupado} onClick={() => setEliminando(null)} className={secondary}>Cancelar</button><button disabled={ocupado} onClick={eliminar} className="px-4 py-2 bg-red-600 rounded-xl text-white text-sm disabled:opacity-50">{ocupado ? 'Eliminando...' : 'Eliminar'}</button></div></section></div>}
  </div>;
}
