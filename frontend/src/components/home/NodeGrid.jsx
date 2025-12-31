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
        {nodes.map((n) => (
          <Link
            to={`/nodos/${encodeURIComponent(n.nodeId)}`}
            key={n.nodeId}
            className={`block bg-white rounded-2xl shadow-sm p-5 space-y-3 hover:shadow-md transition
              ${
                n.state === "SECO"
                  ? "border-l-4 border-red-500"
                  : n.state === "MEDIO"
                  ? "border-l-4 border-yellow-400"
                  : "border-l-4 border-green-500"
              }
            `}
          >
            <h4 className="font-semibold text-lg text-gray-800">
              {n.name}
            </h4>

            <div className="flex items-center gap-2 text-gray-600">
              <Droplets size={16} />
              <span>Humedad: <strong>{n.humidity}%</strong></span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Activity size={16} />
              <span>Estado: <strong>{n.state}</strong></span>
            </div>

            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                ${n.state === "SECO" && "bg-red-100 text-red-600"}
                ${n.state === "MEDIO" && "bg-yellow-100 text-yellow-700"}
                ${n.state === "OPTIMO" && "bg-green-100 text-green-700"}
              `}
            >
              {n.recommendation}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
