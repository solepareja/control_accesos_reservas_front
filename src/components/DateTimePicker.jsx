import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X, Check, ChevronUp, ChevronDown } from 'lucide-react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const pad = (n) => String(n).padStart(2, '0');

export default function DateTimePicker({
  value = '',
  onChange,
  required = false,
  disabled = false,
  id,
  name,
  label,
  includeTime = true,
}) {
  const [abierto, setAbierto] = useState(false);
  const [panelTiempo, setPanelTiempo] = useState(null); // 'hora' | 'minutos' | null
  const containerRef = useRef(null);

  // Parsear valor inicial si existe
  const parseValue = () => {
    if (!value) return null;
    const [datePart, timePart] = value.split('T');
    if (!datePart) return null;
    const [y, m, d] = datePart.split('-').map(Number);
    let hh = 10;
    let mm = 0;
    if (timePart) {
      const [h, min] = timePart.split(':').map(Number);
      if (!isNaN(h)) hh = h;
      if (!isNaN(min)) mm = min;
    }
    return {
      year: y,
      month: m - 1, // 0-indexed
      day: d,
      hours: hh,
      minutes: mm,
    };
  };

  const parsed = parseValue();

  // Fecha vista en el calendario
  const hoy = new Date();
  const [viewYear, setViewYear] = useState(() => parsed ? parsed.year : hoy.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed ? parsed.month : hoy.getMonth());

  // Hora y minutos seleccionados
  const [hora, setHora] = useState(() => parsed ? pad(parsed.hours) : '10');
  const [minutos, setMinutos] = useState(() => parsed ? pad(parsed.minutes) : '00');

  // Si cambia el value desde fuera, sincronizar
  useEffect(() => {
    if (value) {
      const p = parseValue();
      if (p) {
        setViewYear(p.year);
        setViewMonth(p.month);
        setHora(pad(p.hours));
        setMinutos(pad(p.minutes));
      }
    }
  }, [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAbierto(false);
        setPanelTiempo(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mesAnterior = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const mesSiguiente = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const irAHoy = (e) => {
    e.stopPropagation();
    const ahora = new Date();
    setViewYear(ahora.getFullYear());
    setViewMonth(ahora.getMonth());
    seleccionarDia(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  };

  const seleccionarDia = (y, m, d) => {
    const formattedDate = `${y}-${pad(m + 1)}-${pad(d)}`;
    const timeStr = includeTime ? `T${pad(hora)}:${pad(minutos)}` : '';
    const fullIso = `${formattedDate}${timeStr}`;
    setPanelTiempo(null);
    onChange({ target: { name, value: fullIso } });
  };

  const handleHoraChange = (nuevaHora) => {
    setHora(nuevaHora);
    if (parsed) {
      const fullIso = `${parsed.year}-${pad(parsed.month + 1)}-${pad(parsed.day)}T${pad(nuevaHora)}:${pad(minutos)}`;
      onChange({ target: { name, value: fullIso } });
    }
  };

  const handleMinutosChange = (nuevosMinutos) => {
    setMinutos(nuevosMinutos);
    if (parsed) {
      const fullIso = `${parsed.year}-${pad(parsed.month + 1)}-${pad(parsed.day)}T${pad(hora)}:${pad(nuevosMinutos)}`;
      onChange({ target: { name, value: fullIso } });
    }
  };

  const ajustarHora = (delta, e) => {
    e.stopPropagation();
    const actual = parseInt(hora, 10);
    const siguiente = (actual + delta + 24) % 24;
    handleHoraChange(pad(siguiente));
  };

  const ajustarMinutos = (delta, e) => {
    e.stopPropagation();
    const actual = parseInt(minutos, 10);
    const siguiente = (actual + delta + 60) % 60;
    handleMinutosChange(pad(siguiente));
  };

  const limpiar = (e) => {
    e.stopPropagation();
    setPanelTiempo(null);
    onChange({ target: { name, value: '' } });
  };

  // Generar cuadrícula de días para el mes visible
  const generarDias = () => {
    const dias = [];
    const primerDiaMes = new Date(viewYear, viewMonth, 1);
    const diasEnMes = new Date(viewYear, viewMonth + 1, 0).getDate();
    const diasEnMesAnterior = new Date(viewYear, viewMonth, 0).getDate();

    // Lunes = 0, Domingo = 6
    const offsetInicio = (primerDiaMes.getDay() + 6) % 7;

    // Días del mes anterior
    for (let i = offsetInicio - 1; i >= 0; i--) {
      dias.push({
        day: diasEnMesAnterior - i,
        month: viewMonth === 0 ? 11 : viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      dias.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
      });
    }

    // Días del siguiente mes
    const celdasRestantes = (7 - (dias.length % 7)) % 7;
    for (let d = 1; d <= celdasRestantes; d++) {
      dias.push({
        day: d,
        month: viewMonth === 11 ? 0 : viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false,
      });
    }

    return dias;
  };

  // Texto amigable para mostrar en el input
  const formatearTextoInput = () => {
    if (!parsed) return '';
    const fechaObj = new Date(parsed.year, parsed.month, parsed.day);
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return includeTime
      ? `${fechaFormateada}, ${pad(parsed.hours)}:${pad(parsed.minutes)}`
      : fechaFormateada;
  };

  const dias = generarDias();

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block mb-1 text-sm font-semibold text-gray-600">
          {label}
        </label>
      )}

      {/* Input nativo oculto para validación de formulario */}
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        value={value || ''}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Input trigger visible */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!disabled) {
            setAbierto(!abierto);
            setPanelTiempo(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) {
              setAbierto(!abierto);
              setPanelTiempo(null);
            }
          }
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-xl border bg-white cursor-pointer transition select-none shadow-xs ${
          abierto
            ? 'border-orange-500 ring-2 ring-orange-500/20'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarDays className={`w-4 h-4 shrink-0 ${parsed ? 'text-orange-500' : 'text-gray-400'}`} />
          <span className={`truncate ${parsed ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
            {parsed ? formatearTextoInput() : (includeTime ? 'Seleccionar fecha y hora...' : 'Seleccionar fecha...')}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {parsed && !disabled && (
            <button
              type="button"
              onClick={limpiar}
              className="p-1 text-gray-400 hover:text-red-500 rounded-md transition"
              title="Borrar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Desplegable del Calendario Corporativo */}
      {abierto && !disabled && (
        <div className="absolute z-50 left-0 mt-1.5 w-76 sm:w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabecera del Mes / Año */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-gray-900 capitalize">
                {MESES[viewMonth]}
              </span>
              <span className="font-bold text-sm sm:text-base text-gray-400">
                {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={irAHoy}
                className="px-2.5 py-1 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-xl transition"
                title="Ir al día de hoy"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={mesAnterior}
                className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={mesSiguiente}
                className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 text-center mb-1">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="text-[11px] font-bold text-gray-400 uppercase py-1">
                {dia}
              </div>
            ))}
          </div>

          {/* Cuadrícula de días */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dias.map((dItem, index) => {
              const esSeleccionado =
                parsed &&
                parsed.year === dItem.year &&
                parsed.month === dItem.month &&
                parsed.day === dItem.day;

              const esHoy =
                hoy.getFullYear() === dItem.year &&
                hoy.getMonth() === dItem.month &&
                hoy.getDate() === dItem.day;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => seleccionarDia(dItem.year, dItem.month, dItem.day)}
                  className={`h-8 w-8 sm:h-8.5 sm:w-8.5 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition ${
                    esSeleccionado
                      ? 'bg-orange-500 text-white font-bold shadow-xs shadow-orange-500/40 ring-2 ring-orange-500/30'
                      : esHoy
                      ? 'text-orange-600 font-bold bg-orange-50 border border-orange-200'
                      : dItem.isCurrentMonth
                      ? 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                      : 'text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {dItem.day}
                </button>
              );
            })}
          </div>

          {/* Selector de Hora y Minutos (Personalizado con bordes redondeados y sin desplegables kilométricos) */}
          {includeTime && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 relative">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Hora:</span>
              </div>

              {/* Botonera de tiempo */}
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 font-mono text-sm shadow-xs">
                {/* Selector Hora */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPanelTiempo(panelTiempo === 'hora' ? null : 'hora');
                    }}
                    className={`px-2 py-1 rounded-lg font-bold text-sm transition ${
                      panelTiempo === 'hora'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-gray-800 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                    title="Click para elegir hora"
                  >
                    {hora}
                  </button>
                  <div className="flex flex-col -space-y-1 ml-0.5">
                    <button
                      type="button"
                      onClick={(e) => ajustarHora(1, e)}
                      className="p-0.5 text-gray-400 hover:text-orange-600 rounded"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => ajustarHora(-1, e)}
                      className="p-0.5 text-gray-400 hover:text-orange-600 rounded"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <span className="font-bold text-gray-400 select-none px-0.5">:</span>

                {/* Selector Minutos */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPanelTiempo(panelTiempo === 'minutos' ? null : 'minutos');
                    }}
                    className={`px-2 py-1 rounded-lg font-bold text-sm transition ${
                      panelTiempo === 'minutos'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-gray-800 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                    title="Click para elegir minutos"
                  >
                    {minutos}
                  </button>
                  <div className="flex flex-col -space-y-1 ml-0.5">
                    <button
                      type="button"
                      onClick={(e) => ajustarMinutos(5, e)}
                      className="p-0.5 text-gray-400 hover:text-orange-600 rounded"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => ajustarMinutos(-5, e)}
                      className="p-0.5 text-gray-400 hover:text-orange-600 rounded"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón rápido Listo */}
              <button
                type="button"
                onClick={() => {
                  setPanelTiempo(null);
                  setAbierto(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition shadow-xs flex items-center gap-1 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Listo</span>
              </button>

              {/* PANEL COMPACTO DE HORAS (altura contenida y bordes redondeados) */}
              {panelTiempo === 'hora' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 w-68 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Hora
                    </span>
                    <button
                      type="button"
                      onClick={() => setPanelTiempo(null)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-0.5">
                    {Array.from({ length: 24 }, (_, i) => pad(i)).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          handleHoraChange(h);
                          setPanelTiempo('minutos');
                        }}
                        className={`py-1.5 rounded-xl font-mono text-xs font-bold transition ${
                          h === hora
                            ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/40 ring-2 ring-orange-500/20'
                            : 'text-gray-700 bg-gray-50 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PANEL COMPACTO DE MINUTOS (altura contenida y bordes redondeados) */}
              {panelTiempo === 'minutos' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 w-68 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Minutos
                    </span>
                    <button
                      type="button"
                      onClick={() => setPanelTiempo(null)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 p-0.5">
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          handleMinutosChange(m);
                          setPanelTiempo(null);
                        }}
                        className={`py-2 rounded-xl font-mono text-xs font-bold transition ${
                          m === minutos
                            ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/40 ring-2 ring-orange-500/20'
                            : 'text-gray-700 bg-gray-50 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acciones inferiores cuando no hay hora */}
          {!includeTime && (
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
