import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  Shield,
  AlertCircle, 
  CheckCircle2, 
  X,
  Mail,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import api from '../services/api';
import Select from '../components/Select';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null); // null = creando
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasenya: '',
    rol: 'USUARIO',
  });
  const [formError, setFormError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/usuarios');
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('No se pudo conectar con el servidor para obtener los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    setFormData({
      nombre: '',
      correo: '',
      contrasenya: '',
      rol: 'USUARIO',
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nombre: usuario.nombre || '',
      correo: usuario.correo || '',
      contrasenya: '', // Opcional al editar
      rol: usuario.rol || 'USUARIO',
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (!formData.correo.trim()) {
      setFormError('El correo es obligatorio.');
      return;
    }
    if (!usuarioEditando && !formData.contrasenya.trim()) {
      setFormError('La contraseña es obligatoria al crear un nuevo usuario.');
      return;
    }

    setGuardando(true);
    try {
      if (usuarioEditando) {
        // Actualizar
        const payload = {
          nombre: formData.nombre,
          correo: formData.correo,
          contrasenya: formData.contrasenya.trim() ? formData.contrasenya : undefined,
        };
        await api.put(`/api/usuarios/${usuarioEditando.id}`, payload);
        mostrarExito('Usuario actualizado correctamente.');
      } else {
        // Crear
        await api.post('/api/usuarios', formData);
        mostrarExito('Usuario creado con éxito.');
      }
      setModalAbierto(false);
      cargarUsuarios();
    } catch (err) {
      console.error('Error guardando usuario:', err);
      const msg = err.response?.data?.message || 'Error al guardar los datos del usuario.';
      setFormError(msg);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setModalEliminarAbierto(true);
  };

  const ejecutarEliminar = async () => {
    if (!usuarioAEliminar) return;
    try {
      await api.delete(`/api/usuarios/${usuarioAEliminar.id}`);
      mostrarExito(`Usuario "${usuarioAEliminar.nombre}" eliminado correctamente.`);
      setModalEliminarAbierto(false);
      setUsuarioAEliminar(null);
      cargarUsuarios();
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      setError('No se pudo eliminar el usuario seleccionado.');
      setModalEliminarAbierto(false);
    }
  };

  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje);
    setTimeout(() => {
      setMensajeExito(null);
    }, 4000);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = `${u.nombre || ''} ${u.correo || ''}`.toLowerCase();
    const cumpleBusqueda = texto.includes(busqueda.toLowerCase());
    const cumpleRol = filtroRol ? u.rol === filtroRol : true;
    return cumpleBusqueda && cumpleRol;
  });

  const getBadgeRol = (rol) => {
    switch (rol) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Shield className="w-3 h-3 text-orange-600" />
            Administrador
          </span>
        );
      case 'KIOSKO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Kiosko
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            Usuario estándar
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
           Gestión de usuarios en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarUsuarios}
            title="Refrescar datos"
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={abrirModalCrear}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-xs shadow-orange-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo usuario</span>
          </button>
        </div>
      </div>

      {/* Alertas de Éxito o Error */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo electrónico..."
          aria-label="Buscar usuarios"
          className="w-full flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white transition shadow-xs"
        />

        <Select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          aria-label="Filtrar por rol de usuario"
          className="w-full sm:w-48 shrink-0"
          placeholder="Todos los roles"
          options={[
            { value: '', label: 'Todos los roles' },
            { value: 'ADMIN', label: 'Administrador' },
            { value: 'USUARIO', label: 'Usuario estándar' },
            { value: 'KIOSKO', label: 'Kiosko' },
          ]}
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm">
            Cargando lista de usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">
            {usuarios.length === 0
              ? 'No hay usuarios registrados en el sistema.'
              : 'No hay usuarios que coincidan con los criterios de búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Correo electrónico</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuariosFiltrados.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">#{user.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {user.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{user.correo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {getBadgeRol(user.rol)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => abrirModalEditar(user)}
                          title="Editar usuario"
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmarEliminar(user)}
                          title="Eliminar usuario"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full animate-in fade-in duration-150 relative">
            <div className="px-6 py-4 border-b border-gray-100 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarUsuario} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Contraseña {usuarioEditando && <span className="text-gray-400 font-normal lowercase">(dejar en blanco para no cambiar)</span>}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required={!usuarioEditando}
                    value={formData.contrasenya}
                    onChange={(e) => setFormData({ ...formData, contrasenya: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Rol de permisos
                </label>
                <Select
                    id="usuario-rol-select"
                    name="rol"
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    options={[
                      { value: 'USUARIO', label: 'Usuario estándar' },
                      { value: 'ADMIN', label: 'Administrador' },
                      { value: 'KIOSKO', label: 'Kiosko (Tablet)' },
                    ]}
                  />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : usuarioEditando ? 'Actualizar' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {modalEliminarAbierto && usuarioAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-sm w-full p-6 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">
              ¿Eliminar usuario?
            </h3>
            <p className="text-sm text-gray-500 text-center mt-1.5 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a <strong className="text-gray-800">{usuarioAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setModalEliminarAbierto(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarEliminar}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition flex-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
