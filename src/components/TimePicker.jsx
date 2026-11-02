import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, Check } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

export default function TimePicker({
  id,
  name,
  value = '',
  onChange,
  required = false,
  disabled = false,
  className = '',
  step = 60,
  label,
}) {
  const [abierto, setAbierto] = useState(false);
  const [posicionY, setPosicionY] = useState('abajo'); // 'abajo' | 'arriba'
  const [posicionX, setPosicionX] = useState('izquierda'); // 'izquierda' | 'derecha'
  const containerRef = useRef(null);

  // Extraer hora y minutos
  const parsearHora = (val) => {
    if (!val || typeof val !== 'string') {
      const ahora = new Date();
      return { hora: pad(ahora.getHours()), minutos: pad(ahora.getMinutes()) };
    }
    const partes = val.split(':');
    const h = parseInt(partes[0], 10);
    const m = parseInt(partes[1], 10);
    return {
      hora: isNaN(h) ? '12' : pad(Math.max(0, Math.min(23, h))),
      minutos: isNaN(m) ? '00' : pad(Math.max(0, Math.min(59, m))),
    };
  };

  const parsed = parsearHora(value);
  const horaActual = parsed.hora;
  const minutosActuales = parsed.minutos;

  // Cálculo de posición inteligente para evitar que se corte por abajo o por los laterales
  useEffect(() => {
    if (abierto && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const espacioArriba = rect.top;

      // Si queda poco espacio abajo (< 260px) y hay suficiente arriba, abrir hacia arriba
      if (espacioAbajo < 260 && espacioArriba > 200) {
        setPosicionY('arriba');
      } else {
        setPosicionY('abajo');
      }

      // Si se desborda por la derecha
      if (window.innerWidth - rect.left < 280) {
        setPosicionX('derecha');
      } else {
        setPosicionX('izquierda');
      }
    }
  }, [abierto]);

  const emitirCambio = (nuevaHora, nuevosMinutos) => {
    const formatted = `${pad(nuevaHora)}:${pad(nuevosMinutos)}`;
    if (typeof onChange === 'function') {
      onChange({
        target: {
          id,
          name,
          value: formatted,
        },
      });
    }
  };

  const ajustarHora = (delta, e) => {
    e?.stopPropagation();
    const h = (parseInt(horaActual, 10) + delta + 24) % 24;
    emitirCambio(h, minutosActuales);
  };

  const ajustarMinutos = (delta, e) => {
    e?.stopPropagation();
    const m = (parseInt(minutosActuales, 10) + delta + 60) % 60;
    emitirCambio(horaActual, m);
  };

  const ponerHoraActual = (e) => {
    e?.stopPropagation();
    const ahora = new Date();
    emitirCambio(ahora.getHours(), ahora.getMinutes());
  };

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && abierto) {
        setAbierto(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [abierto]);

  const horas = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutosOpciones = [
    '00', '05', '10', '15', '20', '25',
    '30', '35', '40', '45', '50', '55'
  ];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-600 uppercase mb-1">
          {label}
        </label>
      )}

      {/* Input nativo oculto para validación de formulario */}
      <input
        type="time"
        id={id}
        name={name}
        required={required}
        value={value || ''}
        step={step}
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
        onClick={() => !disabled && setAbierto(!abierto)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl border bg-white text-left transition select-none shadow-xs cursor-pointer ${
          abierto
            ? 'border-orange-500 ring-2 ring-orange-500/20'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-2.5">
          <Clock className={`w-4 h-4 shrink-0 ${value ? 'text-orange-500' : 'text-gray-400'}`} />
          <span className={`font-mono text-base ${value ? 'text-gray-900 font-bold' : 'text-gray-400 font-normal'}`}>
            {value || '--:--'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            abierto ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>

      {/* Popover desplegable flotante con posicionamiento dinámico arriba/abajo */}
      {abierto && !disabled && (
        <div
          className={`absolute z-50 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${
            posicionY === 'arriba' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${posicionX === 'derecha' ? 'right-0' : 'left-0'}`}
          style={{ minWidth: '270px' }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              Seleccionar hora
            </span>
            <button
              type="button"
              onClick={ponerHoraActual}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer transition"
            >
              Ahora
            </button>
          </div>

          {/* Stepper visual */}
          <div className="flex items-center justify-center gap-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100 mb-2">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={(e) => ajustarHora(1, e)}
                className="p-1 text-gray-400 hover:text-orange-600 hover:bg-white rounded transition"
                title="Aumentar hora"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-lg font-mono font-extrabold text-gray-900 px-2 select-none">
                {horaActual}
              </span>
              <button
                type="button"
                onClick={(e) => ajustarHora(-1, e)}
                className="p-1 text-gray-400 hover:text-orange-600 hover:bg-white rounded transition"
                title="Disminuir hora"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <span className="text-lg font-mono font-bold text-gray-400 select-none pb-0.5">:</span>

            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={(e) => ajustarMinutos(1, e)}
                className="p-1 text-gray-400 hover:text-orange-600 hover:bg-white rounded transition"
                title="Aumentar minuto"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-lg font-mono font-extrabold text-gray-900 px-2 select-none">
                {minutosActuales}
              </span>
              <button
                type="button"
                onClick={(e) => ajustarMinutos(-1, e)}
                className="p-1 text-gray-400 hover:text-orange-600 hover:bg-white rounded transition"
                title="Disminuir minuto"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Columnas compactas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1 text-center">
                Horas
              </span>
              <div className="max-h-28 overflow-y-auto rounded-lg border border-gray-100 p-1 space-y-0.5 bg-gray-50/50">
                {horas.map((h) => {
                  const activa = h === horaActual;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => emitirCambio(h, minutosActuales)}
                      className={`w-full py-0.5 text-center font-mono text-xs rounded-md transition cursor-pointer ${
                        activa
                          ? 'bg-orange-500 text-white font-bold shadow-xs'
                          : 'text-gray-700 hover:bg-white hover:text-orange-600'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1 text-center">
                Minutos
              </span>
              <div className="max-h-28 overflow-y-auto rounded-lg border border-gray-100 p-1 space-y-0.5 bg-gray-50/50">
                {minutosOpciones.map((m) => {
                  const activo = m === minutosActuales;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => emitirCambio(horaActual, m)}
                      className={`w-full py-0.5 text-center font-mono text-xs rounded-md transition cursor-pointer ${
                        activo
                          ? 'bg-orange-500 text-white font-bold shadow-xs'
                          : 'text-gray-700 hover:bg-white hover:text-orange-600'
                      }`}
                    >
                      :{m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botón inferior Confirmar */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="w-full py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar hora</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
