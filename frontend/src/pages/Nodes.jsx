import { useEffect, useState } from "react";
import { getUserNodes } from "../services/nodes.service";
import { getCurrentUser } from "../services/authService";
import NodesListView from "../components/nodes/NodesListView";
import InlineLoader from "../components/ui/InlineLoader";
import { getLastReadingByNode } from "../services/readings.service";
import { computeNodeAlerts } from "../utils/nodeAlerts";
import SystemLatencyPanel from "../components/nodes/SystemLatencyPanel";
import { Sprout } from "lucide-react";

/**
 * @file Nodes.jsx
 * @brief Página que muestra una lista de todos los nodos asignados al usuario.
 * 
 * Carga los nodos del usuario y, para cada uno, obtiene su última lectura
 * para enriquecer los datos con información de estado (online, alertas, etc.)
 * antes de renderizarlos en una lista.
 * @returns {JSX.Element} El componente de la página de listado de nodos.
 */
export default function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  /**
   * Efecto para cargar los nodos del usuario y enriquecerlos con su estado actual.
   */
  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (!user) return;

      try {
        const data = await getUserNodes(user.uid);

        // Para cada nodo, se obtiene su última lectura de forma concurrente.
        const enrichedNodes = await Promise.all(
          data.map(async (node) => {
            const lastReading = await getLastReadingByNode(node.nodeId);

            if (!lastReading) return node;

            // Calcula alertas y estado de conexión basado en la última lectura.
            const alerts = computeNodeAlerts(lastReading, node.soil_type);

            const lastTime = lastReading.createdAt ? new Date(lastReading.createdAt) : null;
            const intervalMs = (lastReading.sampling_interval ?? 5) * 1000;

            const online =
              lastTime &&
              Date.now() - lastTime.getTime() < intervalMs * 2;

            return {
              ...node,
              lastHumidity: lastReading.humidity_percent,
              rssi: lastReading.rssi,
              online,
              alertsCount: alerts.length
            };
          })
        );

        setNodes(enrichedNodes);
      } catch (err) {
        console.error("Error cargando nodos:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Muestra un indicador de carga mientras se obtienen los datos.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9F7] px-4 py-6">
        <InlineLoader text="Cargando información del sistema" />
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-[#F6F9F7] px-4 py-6 space-y-6">

      <div className="flex items-center gap-2 text-gray-700">
        <Sprout size={18} />
        <h3 className="font-semibold">Mis nodos</h3>
      </div>

      <NodesListView nodes={nodes} />

      <SystemLatencyPanel nodes={nodes} />
    </div>
  );
}
