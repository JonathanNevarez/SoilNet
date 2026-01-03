import { Bell, AlertCircle } from "lucide-react";

/**
 * Panel que muestra las alertas activas del sistema.
 * Renderiza una lista de nodos que requieren atención.
 *
 * @param {object} props - Propiedades del componente.
 * @param {Array} props.alerts - Lista de objetos de alerta/nodo con estado crítico.
 * @returns {JSX.Element|null} El componente de alertas o null si no hay alertas.
 */
export default function AlertsPanel({ alerts }) {
  if (!alerts.length) return null;

  return (
    <div className="rounded-2xl shadow-sm p-5 space-y-4 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-yellow-700">
          <Bell size={18} />
        </div>

        <div>
          <h3 className="font-semibold text-gray-800">
            Alertas
          </h3>
          <p className="text-xs text-gray-500">
            {alerts.length} alerta{alerts.length > 1 && "s"} detectada{alerts.length > 1 && "s"}
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {alerts.map((a, i) => (
          <div key={i} className="flex justify-between items-center py-3">

            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <AlertCircle className="text-red-500" size={18} />
              </div>

              <div>
                <p className="font-medium text-gray-800">
                  {a.name}
                </p>
                <p className="text-sm text-gray-500">
                  Humedad: {a.humidity}%
                </p>
              </div>
            </div>

            <span className={`text-sm font-semibold ${a.soilStatus.color}`}>
              {a.soilStatus.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
