import { Link } from "react-router-dom";
import { Droplet, Wifi, AlertTriangle } from "lucide-react";
import { getSignalStatus } from "../../utils/nodeLogic";

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
    avgHumidity,
    alertsCount = 0,
  } = node;

  const safeId = encodeURIComponent(nodeId);

  // --- Estado de conexión ---
  const statusColor = online ? "text-green-600" : "text-red-600";
  const statusText = online ? "Activo" : "Sin señal";

  // --- Calidad de señal ---
  const signalStatus = getSignalStatus(rssi);

  // --- Color de alertas ---
  let alertsColor = "text-yellow-600";
  if (alertsCount >= 3) alertsColor = "text-red-600";

  return (
    <Link
      to={`/nodos/${safeId}`}
      className={`block bg-white rounded-xl shadow p-4 hover:shadow-lg transition space-y-2
        ${!online ? "border-l-4 border-red-500" :
          alertsCount > 0 ? "border-l-4 border-yellow-400" :
          "border-l-4 border-green-500"
        }
      `}
    >
      {/* Nombre y estado */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-800">{name}</h3>
        <span className={`flex items-center gap-1 text-xs font-semibold ${statusColor}`}>
          <span className={`w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-red-500"}`} />
          {statusText}
        </span>
      </div>

      {/* Humedad */}
      <div className="flex flex-col text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Droplet size={16} className="text-gray-400" />
          <span>
            Última: <strong className="text-gray-800">{lastHumidity ?? "—"}%</strong>
          </span>
        </div>
        {avgHumidity !== undefined && (
          <div className="flex items-center gap-2">
            <Droplet size={16} className="text-gray-400" />
            <span>
              Promedio: <strong className="text-gray-800">{avgHumidity.toFixed(1)}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* Señal */}
      <div className={`flex items-center gap-1 ${signalStatus.color}`}>
        <Wifi size={14} />
        {signalStatus.label}
      </div>

      {/* Alertas */}
      {alertsCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className={alertsColor} />
          <span className="text-gray-600">
            Alertas: <strong className={alertsColor}>{alertsCount}</strong>
          </span>
        </div>
      )}
    </Link>
  );
}
