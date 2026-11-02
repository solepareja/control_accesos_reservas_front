import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ToastContext } from '../context/toast';

export default function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const temporizadores = useRef(new Set());
  const siguienteId = useRef(0);
  const notificar = useCallback(mensaje => {
    if (!mensaje) return;
    const id = ++siguienteId.current;
    setAvisos(actuales => [...actuales, { id, mensaje }]);
    const timer = setTimeout(() => {
      setAvisos(actuales => actuales.filter(aviso => aviso.id !== id));
      temporizadores.current.delete(timer);
    }, 4000);
    temporizadores.current.add(timer);
  }, []);
  useEffect(() => {
    const timers = temporizadores.current;
    return () => { timers.forEach(clearTimeout); timers.clear(); };
  }, []);
  return <ToastContext.Provider value={notificar}>
    {children}
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-4 right-4 left-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-96">
      {avisos.map(aviso => <div key={aviso.id} role="status" className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800 shadow-lg">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" />
        <span>{aviso.mensaje}</span>
      </div>)}
    </div>
  </ToastContext.Provider>;
}
