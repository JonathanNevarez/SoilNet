import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { 
  Sprout, 
  Droplet, 
  Activity, 
  BatteryFull, 
  Radio, 
  ArrowLeft, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNodeDetailRealtime } from "../hooks/useNodeDetailRealtime";
import { computeNodeAlerts } from "../utils/nodeAlerts";
import { getSoilStatus, getSignalStatus, getBatteryStatus, getRecommendedAction } from "../utils/nodeLogic";
import SoilNetLogo from "../assets/SoilNet.svg";

export default function NodeDetail() {
  const { nodeId } = useParams();
  const { node, lastReading, history, range, loading, loadHistory } = useNodeDetailRealtime(decodeURIComponent(nodeId));

  // Date for header
  const today = new Date().toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-sm">
          <Sprout size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Nodo no encontrado</h2>
          <p className="text-slate-500 mb-6">No pudimos localizar la informaciÃ³n de este dispositivo.</p>
          <Link to="/home" className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const humidity = lastReading?.humidity_percent ?? null;
  const rssi = lastReading?.rssi ?? null;
  const voltage = lastReading?.voltage ?? null;

  const soilStatus = getSoilStatus(humidity, node.soil_type);
  const signalStatus = getSignalStatus(rssi);
  const batteryStatus = getBatteryStatus(voltage);
  const alerts = computeNodeAlerts(lastReading, node.soil_type);
  const sortedAlerts = [...alerts].sort((a, b) => ({ danger: 0, warning: 1 }[a.type] - { danger: 0, warning: 1 }[b.type]));

  const now = Date.now();
  // Usar sensor_timestamp preferentemente, fallback a createdAt
  const lastTimeStr = lastReading?.sensor_timestamp || lastReading?.createdAt;
  const lastTime = lastTimeStr ? new Date(lastTimeStr).getTime() : null;
  const intervalMs = (lastReading?.sampling_interval ?? 30) * 1000;
  const online = lastTime && now - lastTime < intervalMs * 2;
  const action = getRecommendedAction(online, batteryStatus.label, soilStatus);

  // Trend Logic (UI Only)
  let trend = "stable";
  if (history && history.length >= 5) {
    const recent = history.slice(-5);
    const first = recent[0].humidity_percent;
    const last = recent[recent.length - 1].humidity_percent;
    if (last > first + 1) trend = "up";
    else if (last < first - 1) trend = "down";
  }

  const formatXAxis = tick => {
    if (!tick) return "";
    const date = new Date(tick);
    if (range === "24h") return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatTooltipLabel = label => {
    if (!label) return "";
    const date = new Date(label);
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  };

  // Status Image Logic (reusing logic from NodeCard if possible, but here we just use SVGs based on status)
  let statusImg = "MEDIO";
  if (soilStatus.stateCode === "DRY") statusImg = "SECO";
  else if (soilStatus.stateCode === "EXCESS") statusImg = "EXCESO";
  else if (soilStatus.stateCode === "OPTIMAL") statusImg = "OPTIMO";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-900 selection:bg-green-100">
      
      {/* HEADER UNIFICADO */}
      <div className="sticky top-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center transition-all">
        <Link to="/nodos" className="flex items-center gap-2 group">
          <div className="p-2 -ml-2 rounded-full text-slate-400 group-hover:bg-slate-50 transition">
            <ArrowLeft size={20} />
          </div>
          <img
            src={SoilNetLogo}
            alt="SoilNet"
            className="h-8 object-contain block"
          />
        </Link>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {today}
        </span>
      </div>

      <main className="px-5 pt-8 space-y-6 max-w-lg mx-auto">
        
        {/* Header del Nodo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 leading-tight">{node.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{node.nodeId}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                online ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-rose-500"}`} />
                {online ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <div className="text-right">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Suelo</span>
             <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-bold text-xs">
                {node.soil_type === 'SANDY' ? 'Arenoso' : node.soil_type === 'CLAY' ? 'Arcilloso' : 'Franco'}
             </span>
          </div>
        </div>

        {/* Tarjeta Hero Humedad */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-full h-1.5 ${soilStatus.color.replace('text-', 'bg-')}`}></div>
           
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Humedad Actual</span>
                 <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black text-slate-800 tracking-tighter">
                      {typeof humidity === 'number' ? humidity.toFixed(0) : "--"}
                    </span>
                    <span className="text-xl font-bold text-slate-400">%</span>
                 </div>
                 <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold w-fit ${soilStatus.color.replace('text-', 'bg-').replace('600', '50').replace('700', '50')} ${soilStatus.color}`}>
                    {soilStatus.label}
                 </div>
              </div>

              <div className="w-28 h-28 shrink-0">
                 <img 
                    src={`/svg/${statusImg}.svg`} 
                    alt={statusImg}
                    className={`w-full h-full object-contain drop-shadow-sm transition-transform duration-700`}
                 />
              </div>
           </div>

           {/* SecciÃ³n Predictiva (UI Only) */}
           {online && humidity !== null && (
             <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="p-2 rounded-full bg-slate-50 text-slate-400">
                      {trend === 'up' && <TrendingUp size={16} className="text-blue-500" />}
                      {trend === 'down' && <TrendingDown size={16} className="text-amber-500" />}
                      {trend === 'stable' && <Minus size={16} />}
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tendencia (1h)</p>
                      <p className="text-sm font-bold text-slate-700">
                        {trend === 'up' ? 'Subiendo' : trend === 'down' ? 'Bajando' : 'Estable'}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ãšltima lectura</p>
                   <p className="text-xs font-medium text-slate-600">
                     {lastTime ? new Date(lastTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                   </p>
                </div>
             </div>
           )}
        </div>

        {/* AcciÃ³n Recomendada */}
        <div className={`rounded-2xl p-5 border shadow-sm flex items-start gap-4 transition-all ${
            action.color.includes('red') ? 'bg-red-50 border-red-100' : 
            action.color.includes('green') ? 'bg-emerald-50 border-emerald-100' : 
            action.color.includes('orange') ? 'bg-amber-50 border-amber-100' :
            'bg-slate-50 border-slate-100'
        }`}>
           <div className={`p-2.5 rounded-xl shrink-0 ${
              action.color.includes('red') ? 'bg-red-100 text-red-600' : 
              action.color.includes('green') ? 'bg-emerald-100 text-emerald-600' : 
              action.color.includes('orange') ? 'bg-amber-100 text-amber-600' :
              'bg-slate-200 text-slate-500'
           }`}>
              <Activity size={20} />
           </div>
           <div>
              <h3 className={`font-bold text-sm uppercase tracking-wider mb-1 ${
                 action.color.includes('red') ? 'text-red-800' : 
                 action.color.includes('green') ? 'text-emerald-800' : 
                 action.color.includes('orange') ? 'text-amber-800' :
                 'text-slate-700'
              }`}>{action.title}</h3>
              <p className={`text-sm font-medium leading-relaxed ${
                 action.color.includes('red') ? 'text-red-700' : 
                 action.color.includes('green') ? 'text-emerald-700' : 
                 action.color.includes('orange') ? 'text-amber-700' :
                 'text-slate-600'
              }`}>{action.message}</p>
           </div>
        </div>

        {/* GrÃ¡fico HistÃ³rico */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                 <Calendar size={16} className="text-slate-400"/> Historial
              </h3>
              <div className="flex bg-slate-50 p-1 rounded-lg">
                 {["24h","7d","30d"].map(r => (
                    <button 
                      key={r} 
                      onClick={() => loadHistory(r)} 
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${range===r ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      {r}
                    </button>
                 ))}
              </div>
           </div>
           <div className="h-[200px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="sensor_timestamp"
                    tickFormatter={formatXAxis} 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis domain={['auto', 'auto']} hide={false} width={30} style={{ fontSize: '10px', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    itemStyle={{ color: '#059669', fontWeight: 'bold', fontSize: '14px' }}
                    labelFormatter={formatTooltipLabel}
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Humedad']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="humidity_percent" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorHumidity)" 
                    dot={{ r: 2, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <Activity size={24} className="opacity-20" />
                <span>Sin datos suficientes</span>
              </div>
            )}
           </div>
        </div>

        {/* MÃ©tricas TÃ©cnicas */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
              <div className="flex items-center gap-2 text-slate-400">
                 <Radio size={16} /> <span className="text-[10px] font-bold uppercase tracking-wider">SeÃ±al</span>
              </div>
              <div>
                 <p className="text-2xl font-black text-slate-700 tracking-tight">{rssi ?? "--"}<span className="text-xs font-bold text-slate-400 ml-1">dBm</span></p>
                 <p className={`text-[10px] font-bold mt-1 uppercase ${signalStatus.color}`}>{signalStatus.label}</p>
              </div>
           </div>
           
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
              <div className="flex items-center gap-2 text-slate-400">
                 <BatteryFull size={16} /> <span className="text-[10px] font-bold uppercase tracking-wider">BaterÃ­a</span>
              </div>
              <div>
                 <p className="text-2xl font-black text-slate-700 tracking-tight">{voltage ?? "--"}<span className="text-xs font-bold text-slate-400 ml-1">V</span></p>
                 <p className={`text-[10px] font-bold mt-1 uppercase ${batteryStatus.color}`}>{batteryStatus.label}</p>
              </div>
           </div>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
           <div className="space-y-3 pt-2">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider px-1 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Alertas Activas
              </h3>
              {sortedAlerts.map((alert, i) => (
                 <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${
                    alert.type==="danger"
                      ? "bg-red-50 border-red-100 text-red-800"
                      : "bg-amber-50 border-amber-100 text-amber-800"
                 }`}>
                    <alert.icon size={18} className="shrink-0 mt-0.5" />
                    <span className="text-xs font-bold leading-relaxed">{alert.text}</span>
                 </div>
              ))}
           </div>
        )}

      </main>
    </div>
  );
}
