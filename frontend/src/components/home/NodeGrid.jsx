import { Link } from "react-router-dom";
import { Droplets, Activity, Sprout } from "lucide-react";

/**
 * Componente que renderiza una cuadrícula de tarjetas de nodos.
 * Muestra información clave como el nombre, humedad, estado y recomendación de cada nodo.
 *
 * @param {object} props - Propiedades del componente.
 * @param {Array} props.nodes - Lista de objetos de nodo con sus datos procesados (humedad, estado, etc.).
 * @returns {JSX.Element} El componente de la cuadrícula de nodos.
 */
export default function NodeGrid({ nodes }) {
  return (
    <div className="space-y-4">
      
      <div className="flex items-center gap-2 text-gray-700">
        <Sprout size={18} />
        <h3 className="font-semibold">Mis nodos</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {nodes.map((n) => {
          // Determinar color del borde basado en el estado
          let borderColor = "border-gray-300";
          if (n.soilStatus.stateCode === "DRY") borderColor = "border-red-500";
          else if (n.soilStatus.stateCode === "MEDIUM") borderColor = "border-yellow-400";
          else if (n.soilStatus.stateCode === "OPTIMAL") borderColor = "border-green-500";
          else if (n.soilStatus.stateCode === "EXCESS") borderColor = "border-blue-500";

          return (
          <Link
            to={`/nodos/${encodeURIComponent(n.nodeId)}`}
            key={n.nodeId}
            className={`block bg-white rounded-2xl shadow-sm p-5 space-y-3 hover:shadow-md transition
              border-l-4 ${borderColor}`}
          >
            <h4 className="font-semibold text-lg text-gray-800">
              {n.name}
            </h4>

            <div className="flex items-center gap-2 text-gray-600">
              <Droplets size={16} />
              <span>Humedad: <strong>{n.humidity !== null ? `${n.humidity}%` : "—"}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Activity size={16} />
              <span>Estado: <strong className={n.soilStatus.color}>{n.soilStatus.label}</strong></span>
            </div>

            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${n.soilStatus.actionColor}`}
            >
              {n.soilStatus.title}
            </div>
          </Link>
        )})}
      </div>
    </div>
  );
}
