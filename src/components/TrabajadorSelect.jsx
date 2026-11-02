import { useState, useRef, useEffect } from 'react';
import { Search, User, X, ChevronDown, Check } from 'lucide-react';

const nombreTrabajador = (t) => {
  if (!t) return '—';
  return t.nombreCompleto || [t.nombre, t.apellidos].filter(Boolean).join(' ') || '—';
};

export default function TrabajadorSelect({
  trabajadores = [],
  value = '',
  onChange,
  required = false,
  disabled = false,
  id = 'trabajador-select',
  label = 'Trabajador *',
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const seleccionado = trabajadores.find((t) => String(t.id) === String(value));

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trabajadoresFiltrados = trabajadores.filter((t) => {
    const texto = [
      nombreTrabajador(t),
      t.dni,
      t.departamento
    ].filter(Boolean).join(' ').toLowerCase();
    return texto.includes(busqueda.trim().toLowerCase());
  });

  const handleSeleccionar = (t) => {
    onChange(t ? String(t.id) : '');
    setBusqueda('');
    setAbierto(false);
  };

  const handleLimpiar = (e) => {
    e.stopPropagation();
    onChange('');
    setBusqueda('');
    setTimeout(() => {
      inputRef.current?.focus();
      setAbierto(true);
    }, 0);
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase text-gray-600 mb-1">
          {label}
        </label>
      )}

      {/* Input oculto para que el submit del formulario valide el required nativo */}
      <input
        type="text"
        required={required}
        value={value || ''}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {seleccionado ? (
        /* Vista de trabajador seleccionado */
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-orange-200 bg-orange-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-900 truncate">
                  {nombreTrabajador(seleccionado)}
                </span>
                {seleccionado.dni && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-white border border-gray-200 text-gray-600">
                    {seleccionado.dni}
                  </span>
                )}
              </div>
              {seleccionado.departamento && (
                <p className="text-xs text-gray-500 truncate">{seleccionado.departamento}</p>
              )}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-white transition ml-2 shrink-0"
              title="Cambiar trabajador"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Selector / Buscador */
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              id={id}
              type="text"
              disabled={disabled}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setAbierto(true);
              }}
              onFocus={() => setAbierto(true)}
              placeholder={
                trabajadores.length === 0
                  ? 'No hay trabajadores disponibles'
                  : 'Buscar por nombre o DNI...'
              }
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
            />
            <button
              type="button"
              onClick={() => setAbierto(!abierto)}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:text-gray-600"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Menú desplegable */}
          {abierto && !disabled && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-100">
              {trabajadoresFiltrados.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-500">
                  {busqueda ? 'No se encontraron trabajadores con ese criterio.' : 'No hay trabajadores en la lista.'}
                </div>
              ) : (
                trabajadoresFiltrados.map((t) => {
                  const esSeleccionado = String(t.id) === String(value);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSeleccionar(t)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-orange-50 transition ${
                        esSeleccionado ? 'bg-orange-50/80 text-orange-600 font-semibold' : 'text-gray-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="truncate">{nombreTrabajador(t)}</span>
                          {t.dni && (
                            <span className="px-1.5 py-0.2 rounded text-[11px] font-mono bg-gray-100 text-gray-600">
                              {t.dni}
                            </span>
                          )}
                        </div>
                        {t.departamento && (
                          <span className="text-[11px] text-gray-500 block truncate">
                            {t.departamento}
                          </span>
                        )}
                      </div>
                      {esSeleccionado && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
