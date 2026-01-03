import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import InlineLoader from "../components/ui/InlineLoader";
import { Sprout } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Droplet, Activity, Cpu, BatteryFull, Radio, AlertTriangle, } from "lucide-react";
import { getLastReadingByNode, getReadingsHistory } from "../services/readings.service";
import { getNodeById } from "../services/nodes.service";
import { computeNodeAlerts } from "../utils/nodeAlerts";
import { getSoilStatus, getSignalStatus, getBatteryStatus, getRecommendedAction } from "../utils/nodeLogic";

/**
 * @file NodeDetail.jsx
 * @brief Página de detalle para un nodo sensor específico.
 * 
 * Muestra la información actual, el historial de lecturas en un gráfico,
 * el estado de salud del sensor y las alertas o acciones recomendadas.
 * @returns {JSX.Element} El componente de la página de detalle del nodo.
 */
export default function NodeDetail() {
  const { nodeId } = useParams();
  const realId = decodeURIComponent(nodeId); // Decodifica el ID por si contiene caracteres especiales.

  const [node, setNode] = useState(null); // Información estática del nodo (nombre, ubicación, etc.).
  const [lastReading, setLastReading] = useState(null); // Última lectura recibida del sensor.
  const [history, setHistory] = useState([]); // Historial de lecturas para el gráfico.
  const [range, setRange] = useState("24h"); // Rango de tiempo seleccionado para el historial ('24h', '7d', '30d').
  const [loading, setLoading] = useState(true); // Estado de carga general de la página.
  
  /**
   * Efecto para cargar los datos iniciales del nodo al montar el componente.
   * Obtiene detalles del nodo, su última lectura y el historial de las últimas 24h.
   */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const nodeData = await getNodeById(realId);
        setNode(nodeData);

        const last = await getLastReadingByNode(realId);
        setLastReading(last);

        await loadHistory("24h");
      } catch (error) {
        console.error("Error cargando datos del nodo:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [realId]);

  /**
   * Carga el historial de lecturas para un rango de tiempo seleccionado.
   * Calcula la fecha 'desde' según el rango y llama al servicio correspondiente.
   * 
   * @param {('24h'|'7d'|'30d')} selectedRange - El rango de tiempo para cargar el historial.
   */
  async function loadHistory(selectedRange) {
    const now = new Date();
    let from;

    if (selectedRange === "24h")
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (selectedRange === "7d")
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (selectedRange === "30d")
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const data = await getReadingsHistory(realId, from, selectedRange);

    // Normaliza el campo `createdAt` a un objeto Date para que Recharts lo pueda interpretar.
    const formatted = data.map(r => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : null
    }));
    
    setHistory(formatted);
    setRange(selectedRange);
  }

  // Muestra un loader mientras se cargan los datos iniciales.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9F7] px-4 py-6">
        <InlineLoader text="Cargando información del sistema" />
      </div>
    );
  }

  // --- Procesamiento de Lógica de Negocio (Centralizada en nodeLogic.js) ---
  const humidity = lastReading?.humidity_percent ?? null;
  const rssi = lastReading?.rssi ?? null;
  const voltage = lastReading?.voltage ?? null;

  // 1. Obtener estados individuales
  const soilStatus = getSoilStatus(humidity, node?.soil_type);
  const signalStatus = getSignalStatus(rssi);
  const batteryStatus = getBatteryStatus(voltage);

  // --- Lógica de Alertas del Nodo (basado en la última lectura) ---
  const alerts = computeNodeAlerts(lastReading, node?.soil_type);
  // Ordena las alertas para mostrar las más peligrosas primero.
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priority = { danger: 0, warning: 1 };
    return priority[a.type] - priority[b.type];
  });

  // Si después de cargar, el nodo no existe, muestra un mensaje.
  if (!node) return <p className="text-center mt-10">Nodo no encontrado</p>;

  // 2. Calcular estado de conexión (Online/Offline)
  const now = Date.now();
  const lastTime = lastReading?.createdAt ? new Date(lastReading.createdAt).getTime() : null;
  const intervalMs = (lastReading?.sampling_interval ?? 5) * 1000;
  const online = lastTime && now - lastTime < intervalMs * 2;

  // 3. Determinar acción recomendada final
  const action = getRecommendedAction(online, batteryStatus.label, soilStatus);

  /**
   * Formatea el tick del eje X del gráfico según el rango de tiempo.
   * Muestra la hora para '24h' y la fecha para rangos más largos.
   * @param {Date} tick - El valor del tick (fecha).
   */
  const formatXAxis = (tick) => {
    if (!tick) return "";
    const date = new Date(tick);

    if (range === '24h') {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  /**
   * Formatea la etiqueta del tooltip del gráfico para mostrar fecha y hora completas.
   * @param {Date} label - El valor de la etiqueta (fecha).
   */
  const formatTooltipLabel = (label) => {
    if (!label) return "";
    const date = new Date(label);
    return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="min-h-screen bg-[#F6F9F7] px-4 py-6 space-y-6">

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

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <Droplet className="mx-auto text-green-600" size={28} />
        <p className="text-sm text-gray-500 mt-1">Humedad del suelo</p>
        <p className="text-4xl font-bold text-green-700">
          {humidity !== null ? `${humidity}%` : "—"}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity size={18} /> Histórico
          </h2>

          <div className="flex gap-2 text-sm">
            {["24h", "7d", "30d"].map(r => (
              <button
                key={r}
                onClick={() => loadHistory(r)}
                className={`px-2 py-1 rounded ${
                  range === r
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="w-full" style={{ height: 220, minHeight: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={formatXAxis}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip labelFormatter={formatTooltipLabel} />
                <Line
                  type="monotone"
                  dataKey="humidity_percent"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {history.length === 0 && (
          <p className="text-xs text-gray-500">Sin datos históricos</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">Salud del sensor</h2>

        <div className="flex items-center gap-2 text-sm">
          <Activity size={16} className={online ? "text-green-600" : "text-red-600"} />
          <span>
            Estado:
            <b className={online ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
              {online ? "Activo" : "Sin comunicación"}
            </b>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Radio size={16} className={signalStatus.color} />
          <span>
            Conexión del sensor:
            <b className={`ml-1 ${signalStatus.color}`}>{signalStatus.label}</b>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <BatteryFull size={16} className={batteryStatus.color} />
          <span>
            Energía del sensor:
            <b className={`ml-1 ${batteryStatus.color}`}>{batteryStatus.label}</b>
          </span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            Alertas del nodo
          </h2>

          {sortedAlerts.map((alert, i) => {
            const Icon = alert.icon;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm
                  ${
                    alert.type === "danger"
                      ? "bg-red-50 text-red-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
              >
                <Icon size={18} />
                <span>{alert.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className={`border-l-4 rounded-xl p-4 shadow ${action.color}`}>
        <h3 className="font-semibold text-sm mb-1">
          Acción recomendada
        </h3>
        <p className="font-bold text-base">{action.title}</p>
        <p className="text-sm mt-1">{action.message}</p>
      </div>

      <details className="bg-white rounded-xl shadow p-4">
        <summary className="font-semibold cursor-pointer">
          Métricas técnicas
        </summary>

        <div className="mt-3 space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Radio size={16} /> RSSI: {lastReading?.rssi ?? "—"} dBm
          </p>
          <p className="flex items-center gap-2">
            <Cpu size={16} /> ADC: {lastReading?.raw_value ?? "—"}
          </p>
          <p className="flex items-center gap-2">
            <BatteryFull size={16} /> Voltaje: {lastReading?.voltage ?? "—"} V
          </p>
        </div>
      </details>

    </div>
  );
}
