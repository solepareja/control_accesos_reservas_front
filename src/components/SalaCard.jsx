import { Link } from 'react-router-dom';

export default function SalaCard({ sala, onReservar, disabled = false, children }) {
  const contenido = <span className="block text-sm font-semibold text-gray-900 break-words">{sala.nombre}</span>;
  const estilo = 'block w-full px-4 py-3 text-left transition hover:bg-orange-50/40 focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-[-2px] disabled:opacity-50 disabled:cursor-not-allowed';
  return <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs transition hover:border-orange-300">
    {onReservar ? <button type="button" aria-label={`Reservar ${sala.nombre}`} disabled={disabled} onClick={() => onReservar(sala)} className={estilo}>{contenido}</button> : <Link aria-label={`Reservar ${sala.nombre}`} to={`/reservas-salas?sala=${encodeURIComponent(sala.id)}`} className={estilo}>{contenido}</Link>}
    {children && <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-2">{children}</div>}
  </article>;
}
