import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, WifiOff } from "lucide-react";
import { getSoilStatus } from "../../utils/nodeLogic";

/**
 * Tarjeta individual que muestra el resumen de un nodo.
 * Incluye:
 * - Estado online/offline
 * - Última humedad y promedio
 * - Calidad de señal
 * - Número de alertas
 *
 * @param {object} props
 * @param {object} props.node - Nodo enriquecido con última lectura y promedio
 * @returns {JSX.Element}
 */
export default function NodeCard({ node }) {
  const {
    nodeId,
    name,
    online,
    rssi,
    lastHumidity,
    soil_type,
    alertsCount = 0,
  } = node;

  const safeId = encodeURIComponent(nodeId);
  
  // 1. Obtener estado agronómico (Lógica de negocio)
  const soilStatus = getSoilStatus(lastHumidity, soil_type);

  // 2. Seleccionar la imagen SVG correcta según el estado
  let statusImg = "MEDIO";
  if (soilStatus.stateCode === "DRY") statusImg = "SECO";
  else if (soilStatus.stateCode === "EXCESS") statusImg = "EXCESO";
  else if (soilStatus.stateCode === "OPTIMAL") statusImg = "OPTIMO";

  // 3. Estilos de borde suaves según el estado
  const borderClass = {
    SECO: "border-red-100 hover:border-red-200",
    MEDIO: "border-amber-100 hover:border-amber-200",
    OPTIMO: "border-emerald-100 hover:border-emerald-200",
    EXCESO: "border-blue-100 hover:border-blue-200",
  }[statusImg] || "border-slate-100";

  return (
    <Link
      to={`/nodos/${safeId}`}
      className={`group relative flex items-center p-4 bg-white rounded-3xl border-2 shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98] ${borderClass}`}
    >
      {/* IMAGEN VISUAL (SVG) - Foco principal */}
      <div className="w-20 h-20 shrink-0 mr-4">
        <img 
          src={`/svg/${statusImg}.svg`} 
          alt={statusImg}
          className={`w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-110 ${!online ? 'grayscale opacity-50' : ''}`}
        />
      </div>

      {/* INFORMACIÓN */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
              {name}
            </h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${!online ? 'text-slate-400' : soilStatus.color}`}>
              {!online ? "Desconectado" : soilStatus.label}
            </p>
          </div>
          
          <div className="text-right">
             <span className={`text-3xl font-black leading-none ${!online ? 'text-slate-300' : 'text-slate-700'}`}>
               {typeof lastHumidity === 'number' ? lastHumidity.toFixed(0) : "--"}
             </span>
             <span className="text-xs font-bold text-slate-400 block">% Humedad</span>
          </div>
        </div>

        {/* Footer Sutil */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
           {alertsCount > 0 ? (
             <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-bold">
               <AlertTriangle size={12} /> {alertsCount} Alertas
             </div>
           ) : (
             <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
               {online ? (
                 <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Operativo</span>
               ) : (
                 <span className="flex items-center gap-1 text-slate-400"><WifiOff size={12} /> Sin señal</span>
               )}
             </div>
           )}
           
           <div className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors">
             <ChevronRight size={20} />
           </div>
        </div>
      </div>
    </Link>
  );
}
