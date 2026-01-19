import { Link } from "react-router-dom";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BatteryWarning, 
  WifiOff,
  Wifi
} from "lucide-react";

// Función auxiliar para tiempo relativo (simple para no depender de librerías externas aquí)
function getTimeAgo(dateString) {
  if (!dateString) return "Sin datos";
  const diff = (new Date() - new Date(dateString)) / 1000; // segundos
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} d`;
}

// Traducción de tipos de suelo
function getSoilLabel(type) {
  const map = {
    SANDY: "Arenoso",
    CLAY: "Arcilloso",
    LOAM: "Franco",
    SILT: "Limoso"
  };
  return map[type] || "Suelo";
}

export default function NodeStatusCard({ node, statusType, isOnline: propIsOnline, isLowBattery: propIsLowBattery }) {
  const { name, nodeId, lastReading, soil_type } = node;
  // Usar props si existen, sino buscar en el objeto node (fallback)
  const isOnline = propIsOnline !== undefined ? propIsOnline : (node.isOnline || node.online);
  const isLowBattery = propIsLowBattery !== undefined ? propIsLowBattery : node.isLowBattery;
  const humidity = lastReading?.humidity_percent ?? "--";
  const timeAgo = getTimeAgo(lastReading?.createdAt);
  
  // Simulación de tendencia (en producción vendría del backend)
  // Lógica simple: si la humedad es muy baja, probablemente esté bajando (secándose)
  // Si es muy alta, quizás subiendo (riego/lluvia) o estable.
  // Esto es visual para el ejemplo.
  const trend = "stable"; 

  const statusConfig = {
    SECO: {
      border: "border-rose-100",
      bgIcon: "bg-rose-50",
      text: "text-rose-700",
      action: "Riego necesario",
      actionStyle: "bg-rose-100 text-rose-700"
    },
    MEDIO: {
      border: "border-amber-200",
      bgIcon: "bg-amber-50",
      text: "text-amber-700",
      action: "Monitorear",
      actionStyle: "bg-amber-100 text-amber-700"
    },
    OPTIMO: {
      border: "border-emerald-100",
      bgIcon: "bg-emerald-50",
      text: "text-emerald-700",
      action: "Mantener",
      actionStyle: "bg-emerald-100 text-emerald-700"
    },
    EXCESO: {
      border: "border-blue-100",
      bgIcon: "bg-blue-50",
      text: "text-blue-700",
      action: "Suspender riego",
      actionStyle: "bg-blue-100 text-blue-700"
    }
  };

  const config = statusConfig[statusType] || statusConfig.MEDIO;

  return (
    <Link 
      to={`/node/${encodeURIComponent(nodeId)}`}
      className={`block relative bg-white rounded-2xl border ${config.border} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] overflow-hidden group`}
    >
      <div className="p-5 flex items-center justify-between gap-4">
        
        {/* Izquierda: Icono e Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-14 h-14 shrink-0 rounded-2xl ${config.bgIcon} p-2 flex items-center justify-center transition-transform group-hover:scale-110`}>
            <img src={`/svg/${statusType}.svg`} alt={statusType} className="w-full h-full object-contain drop-shadow-sm" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-bold text-slate-800 text-lg truncate leading-tight">{name}</h3>
              {/* Indicadores de estado técnico */}
              <div className="flex gap-1">
                {isOnline ? (
                  <Wifi size={14} className="text-emerald-500" />
                ) : (
                  <WifiOff size={14} className="text-slate-400" />
                )}
                {isLowBattery && <BatteryWarning size={14} className="text-rose-500" />}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                {getSoilLabel(soil_type)}
              </span>
              <span className="flex items-center gap-1 opacity-75">
                <Clock size={10} /> {timeAgo}
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Métricas y Acción */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1">
            <span className={`text-4xl font-black leading-none tracking-tight ${config.text}`}>
              {typeof humidity === 'number' ? humidity.toFixed(0) : "--"}
            </span>
            <span className={`text-sm font-bold mt-2 ${config.text} opacity-60`}>%</span>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
             {/* Icono de tendencia (placeholder) */}
             {trend === 'up' && <TrendingUp size={14} className="text-blue-500" />}
             {trend === 'down' && <TrendingDown size={14} className="text-amber-500" />}
             {trend === 'stable' && <Minus size={14} className="text-slate-300" />}

             <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${config.actionStyle}`}>
               {config.action}
             </span>
          </div>
        </div>

      </div>
    </Link>
  );
}