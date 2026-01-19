import { useState } from "react";
import { BrainCircuit, ArrowRight, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PredictionStrip({ predictions, loading }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estado de Carga (Skeleton UI)
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-slate-200 rounded-full"></div>
              <div className="h-3 w-32 bg-slate-200 rounded"></div>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
           <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="h-3 w-16 bg-slate-200 rounded"></div>
           </div>
        </div>
      </div>
    );
  }

  if (loading || !predictions || predictions.length === 0) return null;

  // Aseguramos que el índice sea válido (por si la lista cambia)
  const total = predictions.length;
  const safeIndex = currentIndex >= total ? 0 : currentIndex;
  const currentPrediction = predictions[safeIndex];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % total);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + total) % total);

  // Configuración visual según el tipo de alerta
  const styles = {
    danger: {
      bg: "bg-gradient-to-r from-rose-50/80 to-white",
      border: "border-rose-100",
      iconBg: "bg-rose-100 text-rose-600 shadow-sm",
      text: "text-rose-900",
      badge: "bg-rose-100 text-rose-700 border border-rose-200"
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-50/80 to-white",
      border: "border-amber-100",
      iconBg: "bg-amber-100 text-amber-600 shadow-sm",
      text: "text-amber-900",
      badge: "bg-amber-100 text-amber-700 border border-amber-200"
    },
    success: {
      bg: "bg-gradient-to-r from-emerald-50/80 to-white",
      border: "border-emerald-100",
      iconBg: "bg-emerald-100 text-emerald-600 shadow-sm",
      text: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200"
    }
  };

  const theme = styles[currentPrediction.type] || styles.success;

  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700`}>
      
      {/* Header del bloque */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit size={16} className="text-violet-600" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Predicciones SoilNet AI
          </span>
        </div>

        {/* Controles de Carrusel (Solo si hay más de 1) */}
        {total > 1 && (
          <div className="flex items-center gap-1 bg-white/60 rounded-full px-1 py-0.5 border border-slate-100 shadow-sm">
            <button 
              onClick={handlePrev}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              aria-label="Anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-bold text-slate-500 min-w-[24px] text-center select-none">
              {safeIndex + 1} / {total}
            </span>
            <button 
              onClick={handleNext}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              aria-label="Siguiente"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icono de Tendencia */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.iconBg}`}>
            {currentPrediction.trend === 'falling' && <TrendingDown size={24} />}
            {currentPrediction.trend === 'rising' && <TrendingUp size={24} />}
            {currentPrediction.trend === 'stable' && <Minus size={24} />}
          </div>

          <div>
            <h3 className="font-bold text-slate-800 leading-tight text-base">
              {currentPrediction.nodeName}
            </h3>
            <p className={`text-sm font-semibold ${theme.text} mt-0.5`}>
              {currentPrediction.message}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
               <span>Actual: {currentPrediction.currentHumidity.toFixed(0)}%</span>
               <ArrowRight size={10} />
               <span className="font-bold text-slate-600">Futuro: {currentPrediction.predictedHumidity.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm ${theme.badge} text-center min-w-[80px]`}>
          {currentPrediction.action}
        </div>
      </div>
    </div>
  );
}
