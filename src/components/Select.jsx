import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Componente Select personalizado con estilo corporativo:
 * - Bordes redondeados (rounded-xl)
 * - Menú flotante con sombra suave y bordes redondeados (evita el menú nativo cuadrado del SO)
 * - Posicionamiento dinámico (se abre hacia arriba si no cabe abajo)
 * - Indicador visual con icono de check para la opción activa
 * - Accesibilidad completa (cierre al hacer click fuera, tecla escape, soporte keyboard)
 * - Input nativo oculto compatible con validación HTML5 (required)
 */
export default function Select({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  className = '',
  buttonClassName = '',
  'aria-label': ariaLabel,
}) {
  const [abierto, setAbierto] = useState(false);
  const [posicionY, setPosicionY] = useState('abajo'); // 'abajo' | 'arriba'
  const containerRef = useRef(null);

  // Normalizar opciones a formato [{ value, label }]
  const items = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      const val = opt.value !== undefined ? opt.value : opt.id;
      const lab = opt.label !== undefined ? opt.label : opt.nombre || opt.name || String(val);
      return { value: val, label: lab };
    }
    return { value: opt, label: String(opt) };
  });

  // Encontrar opción actualmente seleccionada
  const opcionSeleccionada = items.find(
    (item) => String(item.value) === String(value)
  );

  // Cálculo de posición inteligente (arriba / abajo)
  useEffect(() => {
    if (abierto && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const espacioArriba = rect.top;
      if (espacioAbajo < 220 && espacioArriba > 180) {
        setPosicionY('arriba');
      } else {
        setPosicionY('abajo');
      }
    }
  }, [abierto]);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener('mousedown', handleClickFuera);
      document.addEventListener('touchstart', handleClickFuera);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFuera);
      document.removeEventListener('touchstart', handleClickFuera);
    };
  }, [abierto]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && abierto) {
        setAbierto(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [abierto]);

  const seleccionar = (opcion) => {
    if (disabled) return;
    setAbierto(false);
    if (typeof onChange === 'function') {
      onChange({
        target: {
          id,
          name,
          value: opcion.value,
        },
      });
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input nativo oculto para validación de formulario (ej. required) */}
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        value={value !== undefined && value !== null ? value : ''}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Botón disparador visible */}
      <button
        type="button"
        id={id ? `${id}-btn` : undefined}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        onClick={() => !disabled && setAbierto(!abierto)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl border bg-white text-left transition-all select-none shadow-xs cursor-pointer ${
          abierto
            ? 'border-orange-500 ring-2 ring-orange-500/20'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''} ${buttonClassName}`}
      >
        <span
          className={`truncate ${
            opcionSeleccionada && opcionSeleccionada.value !== ''
              ? 'text-gray-900 font-semibold'
              : 'text-gray-400'
          }`}
        >
          {opcionSeleccionada && opcionSeleccionada.value !== ''
            ? opcionSeleccionada.label
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-2 shrink-0 text-gray-400 transition-transform duration-200 ${
            abierto ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>

      {/* Menú desplegable flotante con bordes redondeados y sombra suave */}
      {abierto && !disabled && (
        <ul
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl focus:outline-hidden ${
            posicionY === 'arriba' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{ minWidth: '100%' }}
        >
          {items.length === 0 ? (
            <li className="px-3.5 py-2 text-xs text-gray-400 text-center italic">
              No hay opciones disponibles
            </li>
          ) : (
            items.map((opcion, idx) => {
              const estaSeleccionado = String(opcion.value) === String(value);
              return (
                <li
                  key={`${opcion.value}-${idx}`}
                  role="option"
                  aria-selected={estaSeleccionado}
                  onClick={() => seleccionar(opcion)}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${
                    estaSeleccionado
                      ? 'bg-orange-50 text-orange-600 font-bold'
                      : 'text-gray-700 hover:bg-orange-50/60 hover:text-orange-600 font-medium'
                  }`}
                >
                  <span className="truncate">{opcion.label}</span>
                  {estaSeleccionado && (
                    <Check className="w-4 h-4 text-orange-500 shrink-0 ml-2" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
