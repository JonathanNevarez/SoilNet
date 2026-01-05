// src/pages/NodeDetail.jsx
import { useParams } from "react-router-dom";
import InlineLoader from "../components/ui/InlineLoader";
import { Sprout, Droplet, Activity, Cpu, BatteryFull, Radio, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useNodeDetailRealtime } from "../hooks/useNodeDetailRealtime";
import { computeNodeAlerts } from "../utils/nodeAlerts";
import { getSoilStatus, getSignalStatus, getBatteryStatus, getRecommendedAction } from "../utils/nodeLogic";

export default function NodeDetail() {
  const { nodeId } = useParams();
  const { node, lastReading, history, range, loading, loadHistory } = useNodeDetailRealtime(decodeURIComponent(nodeId));

  if (loading) return <InlineLoader text="Cargando información del nodo" />;
  if (!node) return <p className="text-center mt-10">Nodo no encontrado</p>;

  const humidity = lastReading?.humidity_percent ?? null;
  const rssi = lastReading?.rssi ?? null;
  const voltage = lastReading?.voltage ?? null;

  const soilStatus = getSoilStatus(humidity, node.soil_type);
  const signalStatus = getSignalStatus(rssi);
  const batteryStatus = getBatteryStatus(voltage);
  const alerts = computeNodeAlerts(lastReading, node.soil_type);
  const sortedAlerts = [...alerts].sort((a, b) => ({ danger: 0, warning: 1 }[a.type] - { danger: 0, warning: 1 }[b.type]));

  const now = Date.now();
  const lastTime = lastReading?.createdAt ? new Date(lastReading.createdAt).getTime() : null;
  const intervalMs = (lastReading?.sampling_interval ?? 30) * 1000;
  const online = lastTime && now - lastTime < intervalMs * 2;
  const action = getRecommendedAction(online, batteryStatus.label, soilStatus);

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

  return (
    <div className="min-h-screen bg-[#F6F9F7] px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-gray-700">
          <Sprout size={25} />
          <h1 className="text-2xl font-bold text-gray-700">{node.name}</h1>
        </div>
        <p className="font-semibold">
          <span className="text-gray-600">Estado:</span>{" "}
          <span className={soilStatus.color}>{soilStatus.label}</span>
        </p>
      </div>

      {/* Humedad */}
      <div className="bg-white rounded-xl shadow p-4 text-center">
        <Droplet className="mx-auto text-green-600" size={28} />
        <p className="text-sm text-gray-500 mt-1">Humedad del suelo</p>
        <p className="text-4xl font-bold text-green-700">{humidity !== null ? `${humidity}%` : "—"}</p>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2"><Activity size={18} /> Histórico</h2>
          <div className="flex gap-2 text-sm">
            {["24h","7d","30d"].map(r => (
              <button key={r} onClick={() => loadHistory(r)} className={`px-2 py-1 rounded ${range===r?"bg-green-600 text-white":"bg-green-100 text-green-700"}`}>{r}</button>
            ))}
          </div>
        </div>
        {history.length>0 ? (
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="createdAt" tickFormatter={formatXAxis}/>
                <YAxis domain={[0,100]}/>
                <Tooltip labelFormatter={formatTooltipLabel}/>
                <Line type="monotone" dataKey="humidity_percent" stroke="#16a34a" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-xs text-gray-500">Sin datos históricos</p>}
      </div>

      {/* Salud del sensor */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">Salud del sensor</h2>
        <div className="flex items-center gap-2 text-sm"><Activity size={16} className={online?"text-green-600":"text-red-600"} /><span>Estado: <b className={online?"text-green-600 ml-1":"text-red-600 ml-1"}>{online?"Activo":"Sin comunicación"}</b></span></div>
        <div className="flex items-center gap-2 text-sm"><Radio size={16} className={signalStatus.color} /><span>Conexión del sensor: <b className={`ml-1 ${signalStatus.color}`}>{signalStatus.label}</b></span></div>
        <div className="flex items-center gap-2 text-sm"><BatteryFull size={16} className={batteryStatus.color} /><span>Energía del sensor: <b className={`ml-1 ${batteryStatus.color}`}>{batteryStatus.label}</b></span></div>
      </div>

      {/* Alertas */}
      {alerts.length>0 && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-red-600"><AlertTriangle size={18}/> Alertas del nodo</h2>
          {sortedAlerts.map((alert,i)=> {
            const Icon = alert.icon;
            return <div key={i} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${alert.type==="danger"?"bg-red-50 text-red-700":"bg-yellow-50 text-yellow-700"}`}><Icon size={18}/><span>{alert.text}</span></div>
          })}
        </div>
      )}

      {/* Acción recomendada */}
      <div className={`border-l-4 rounded-xl p-4 shadow ${action.color}`}>
        <h3 className="font-semibold text-sm mb-1">Acción recomendada</h3>
        <p className="font-bold text-base">{action.title}</p>
        <p className="text-sm mt-1">{action.message}</p>
      </div>

      {/* Métricas técnicas */}
      <details className="bg-white rounded-xl shadow p-4">
        <summary className="font-semibold cursor-pointer">Métricas técnicas</summary>
        <div className="mt-3 space-y-2 text-sm">
          <p className="flex items-center gap-2"><Radio size={16}/> RSSI: {lastReading?.rssi ?? "—"} dBm</p>
          <p className="flex items-center gap-2"><Cpu size={16}/> ADC: {lastReading?.raw_value ?? "—"}</p>
          <p className="flex items-center gap-2"><BatteryFull size={16}/> Voltaje: {lastReading?.voltage ?? "—"} V</p>
        </div>
      </details>
    </div>
  );
}
