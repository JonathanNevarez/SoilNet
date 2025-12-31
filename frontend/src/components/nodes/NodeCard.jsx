import { Link } from "react-router-dom";
import { Droplet, Wifi, AlertTriangle } from "lucide-react";

/**
 * Tarjeta individual que muestra el resumen de un nodo.
 * Muestra estado de conexión, humedad, calidad de señal y número de alertas.
 *
 * @param {object} props - Propiedades del componente.
 * @param {object} props.node - Datos enriquecidos del nodo (incluye última lectura).
 * @returns {JSX.Element} El componente de la tarjeta del nodo.
 */
export default function NodeCard({ node }) {
  // Desestructuramos las props para un acceso más limpio.
  const { nodeId, name, online, rssi, lastHumidity, alertsCount = 0 } = node;

  const safeId = encodeURIComponent(nodeId);

  // --- Lógica de Estado de Conexión ---
  // Determina el color y texto según si el nodo está en línea.
  const statusColor = online ? "text-green-600" : "text-red-600";
  const statusText = online ? "Activo" : "Sin señal";

  // --- Lógica de Calidad de Señal ---
  // Clasifica la calidad de la señal (RSSI) en tres niveles.
  let signalText = "Buena";
  let signalColor = "text-green-600";

  if (rssi < -85) {
    signalText = "Débil";
    signalColor = "text-red-600";
  } else if (rssi < -70) {
    signalText = "Media";
    signalColor = "text-yellow-600";
  }

  // --- Lógica de Alertas ---
  // Cambia el color del texto si el número de alertas es alto.
  let alertsColor = "text-yellow-600";

  if (alertsCount >= 3) {
    alertsColor = "text-red-600";
  }

  return (
    <Link
      to={`/nodos/${safeId}`}
      // El color del borde prioriza el estado: Sin señal > Alertas > Óptimo.
      className={`block bg-white rounded-xl shadow p-4 hover:shadow-lg transition space-y-2
        ${
          !online
            ? "border-l-4 border-red-500"
            : alertsCount > 0
            ? "border-l-4 border-yellow-400"
            : "border-l-4 border-green-500"
        }
      `}    
    >
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-800">
          {name}
        </h3>

        <span className={`flex items-center gap-1 text-xs font-semibold ${statusColor}`}>
          <span
            className={`w-2 h-2 rounded-full
              ${online ? "bg-green-500" : "bg-red-500"}
            `}
          />
          {statusText}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Droplet size={16} className="text-gray-400" />
        <span>
          Humedad:{" "}
          <strong className="text-gray-800">
            {lastHumidity !== undefined
              ? `${lastHumidity}%`
              : "—"}
          </strong>
        </span>
      </div>

      <div className={`flex items-center gap-1 ${signalColor}`}>
        <Wifi size={14} />
        {signalText}
      </div>

      {alertsCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle
            size={16}
            className={
              alertsCount >= 3
                ? "text-red-600"
                : "text-yellow-600"
            }
          />

          <span className="text-gray-600">
            Alertas:
            <strong
              className={`ml-1 ${
                alertsCount >= 3
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {alertsCount}
            </strong>
          </span>
        </div>
      )}
    </Link>
  );
}
