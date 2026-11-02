import { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

export default function SignaturePad({ value, onChange, label = "Firma *", labelClass = "" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Inicializar canvas con resolución nítida para pantallas táctiles y retina
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Si ya viene un valor previo en base64, dibujarlo
    if (value && typeof value === 'string' && value.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, []);

  // Limpiar el canvas cuando value esté vacío (por ejemplo, al registrar entrada con éxito)
  useEffect(() => {
    if (!value) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      setHasSignature(false);
    }
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas && onChange) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-bold flex items-center gap-1.5 ${labelClass || 'text-gray-700'}`}>
          <PenTool className="w-4 h-4 text-orange-500" />
          <span>{label}</span>
        </label>
        {hasSignature && (
          <button
            type="button"
            onClick={clearSignature}
            className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar firma</span>
          </button>
        )}
      </div>

      {/* Recuadro de la firma: SIEMPRE fondo blanco en modo claro y en modo oscuro */}
      <div 
        className="relative border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden shadow-inner touch-none signature-pad-surface"
        style={{ backgroundColor: '#ffffff' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 sm:h-48 cursor-crosshair block"
          style={{ touchAction: 'none', backgroundColor: '#ffffff' }}
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-400 select-none">
            <PenTool className="w-8 h-8 mb-1.5 opacity-40 text-gray-500" />
            <p className="text-sm font-medium text-gray-500">Firme aquí con el dedo o lápiz táctil</p>
          </div>
        )}

        <div className="absolute bottom-2 left-3 pointer-events-none">
          <div className="w-32 sm:w-48 border-b-2 border-gray-300" />
        </div>
      </div>
    </div>
  );
}
