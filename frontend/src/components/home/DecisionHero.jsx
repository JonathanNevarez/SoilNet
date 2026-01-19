export default function DecisionHero({ counts }) {
  // Lógica de decisión para mostrar el estado predominante/prioritario
  // Prioridad: SECO > EXCESO > MEDIO > OPTIMO

  let heroState = "OPTIMO";
  let title = "Todo en orden";
  let message = "Tus cultivos están en condiciones ideales.";
  let bgGradient = "bg-gradient-to-br from-emerald-500 to-green-600";
  let shadowColor = "shadow-emerald-500/30";

  if (counts.SECO > 0) {
    heroState = "SECO";
    title = "Atención Requerida";
    message = `${counts.SECO} ${counts.SECO === 1 ? "zona necesita" : "zonas necesitan"} riego urgente hoy.`;
    bgGradient = "bg-gradient-to-br from-rose-500 to-red-600";
    shadowColor = "shadow-rose-500/30";
  } else if (counts.EXCESO > 0) {
    heroState = "EXCESO";
    title = "Suelo Saturado";
    message = `Detectamos exceso de humedad en ${counts.EXCESO} ${counts.EXCESO === 1 ? "zona" : "zonas"}.`;
    bgGradient = "bg-gradient-to-br from-blue-500 to-sky-600";
    shadowColor = "shadow-blue-500/30";
  } else if (counts.MEDIO > 0) {
    heroState = "MEDIO";
    title = "Vigilar Humedad";
    message = "Algunas zonas están bajando su nivel de humedad.";
    bgGradient = "bg-gradient-to-br from-amber-400 to-orange-500";
    shadowColor = "shadow-orange-500/30";
  }

  return (
    <div className={`relative overflow-hidden rounded-[2rem] ${bgGradient} text-white shadow-xl ${shadowColor} transition-all duration-500 ring-1 ring-white/20`}>
      
      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>

      <div className="relative z-10 p-8 flex flex-col items-center text-center">
        
        {/* Imagen SVG Central */}
        <div className="w-32 h-32 mb-5 drop-shadow-2xl filter animate-in zoom-in duration-700">
          <img 
            src={`/svg/${heroState}.svg`} 
            alt={heroState} 
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
          />
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-2 leading-none drop-shadow-sm">
          {title}
        </h1>
        
        <p className="text-white/90 font-medium text-lg leading-snug max-w-[260px] drop-shadow-sm">
          {message}
        </p>

        {/* Resumen rápido de contadores (Pill) */}
        <div className="mt-8 flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-bold border border-white/10 shadow-inner">
            <span className={counts.SECO > 0 ? "text-white" : "text-white/40"}>
                {counts.SECO} Seco
            </span>
            <span className="text-white/20">|</span>
            <span className={counts.OPTIMO > 0 ? "text-white" : "text-white/40"}>
                {counts.OPTIMO} Óptimo
            </span>
            <span className="text-white/20">|</span>
            <span className={counts.EXCESO > 0 ? "text-white" : "text-white/40"}>
                {counts.EXCESO} Exceso
            </span>
        </div>
      </div>
    </div>
  );
}