import { useState, useEffect } from "react";
import { Sprout, AlertTriangle, DropletOff, Droplets } from "lucide-react";
import { getCurrentUser } from "../services/authService";
import { getUserNodes } from "../services/nodes.service";
import { getLastReadingByNode } from "../services/readings.service";
import { getSoilStatus } from "../utils/nodeLogic";
import SummaryPanel from "../components/home/SummaryPanel";
import AlertsPanel from "../components/home/AlertsPanel";
import NodeGrid from "../components/home/NodeGrid";
import InlineLoader from "../components/ui/InlineLoader";

/**
 * @file Home.jsx
 * @brief Página principal (Dashboard) de la aplicación.
 * 
 * Muestra un resumen del estado general del sistema, incluyendo KPIs, alertas
 * y una vista general de todos los nodos del usuario.
 * @returns {JSX.Element} El componente de la página de inicio.
 */
export default function Home() {
  const [user] = useState(getCurrentUser());
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // 1. Obtener nodos del usuario
        const userNodes = await getUserNodes(user.uid);

        // 2. Obtener la última lectura para cada nodo
        const nodesWithReadings = await Promise.all(
          userNodes.map(async (node) => {
            try {
              const lastReading = await getLastReadingByNode(node.nodeId);
              return { ...node, lastReading };
            } catch (err) {
              console.error(`Error cargando lectura para ${node.nodeId}`, err);
              return { ...node, lastReading: null };
            }
          })
        );

        setNodes(nodesWithReadings);
      } catch (error) {
        console.error("Error cargando datos del home:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Muestra un loader mientras se autentica al usuario o se cargan los datos de los nodos.
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F6F9F7] px-4 py-6">
        <InlineLoader text="Cargando información del sistema" />
      </div>
    );
  }

  // Procesa los datos de los nodos para añadir información de estado y recomendación.
  const processedNodes = nodes.map(node => {
    const humidity =
      node.lastReading?.humidity_percent ??
      node.lastReading?.humidity ??
      null;

    // Usamos la lógica centralizada que considera el tipo de suelo
    const soilStatus = getSoilStatus(humidity, node.soil_type);

    return { ...node, humidity, soilStatus };
  });

  // --- Cálculo de KPIs y Estado Global ---
  const total = processedNodes.length;
  const sum = processedNodes.reduce((acc, n) => acc + (n.humidity || 0), 0);
  const averageHumidity = total ? Math.round(sum / total) : 0;
  
  // Contamos como críticos los nodos en estado SECO
  const dryCount = processedNodes.filter(n => n.soilStatus.stateCode === "DRY").length;
  const excessCount = processedNodes.filter(n => n.soilStatus.stateCode === "EXCESS").length;

  // Determina el estado global del sistema basado en los nodos críticos y en estado medio.
  let globalStatus = "ÓPTIMO";
  // let statusColor = "text-green-700"; // (Variable no usada directamente en el renderizado actual, se usa lógica inline abajo)

  if (dryCount > 0) {
    globalStatus = "SECO";
  } else if (excessCount > 0) {
    globalStatus = "EXCESO";
  } else if (processedNodes.some(n => n.soilStatus.stateCode === "MEDIUM")) {
    globalStatus = "MEDIO";
  }

  // Filtramos alertas para el panel (cualquier cosa que no sea ÓPTIMO)
  const alerts = processedNodes.filter(n => n.soilStatus.stateCode !== "OPTIMAL");

  return (
    
    <div className="min-h-screen bg-[#F6F9F7] px-4 py-6 space-y-6">

      <div
        className={`rounded-2xl shadow p-6 flex items-center gap-6
          ${
            globalStatus === "ÓPTIMO"
              ? "bg-green-50/60"
              : globalStatus === "MEDIO"
              ? "bg-yellow-50/60"
              : globalStatus === "EXCESO"
              ? "bg-blue-50/60"
              : "bg-red-50/60"
          }
        `}
      >
        <div
          className={`w-14 h-14 flex items-center justify-center rounded-full
            ${
              globalStatus === "ÓPTIMO"
                ? "bg-green-100 text-green-700"
                : globalStatus === "MEDIO"
                ? "bg-yellow-100 text-yellow-700"
                : globalStatus === "EXCESO"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
            }`}
        >
          {globalStatus === "ÓPTIMO" && <Sprout size={28} />}
          {globalStatus === "MEDIO" && <AlertTriangle size={28} />}
          {globalStatus === "EXCESO" && <Droplets size={28} />}
          {globalStatus === "SECO" && <DropletOff size={28} />}
        </div>

        <div className="flex-1">
          <p className="text-sm text-gray-500">
            Estado general del sistema
          </p>

          <p
            className={`text-3xl font-extrabold mt-1
              ${
                globalStatus === "ÓPTIMO"
                  ? "text-green-700"
                  : globalStatus === "MEDIO"
                  ? "text-yellow-700"
                  : globalStatus === "EXCESO"
                  ? "text-blue-700"
                  : "text-red-700"
              }
            `}
          >
            {globalStatus}
          </p>

          <p className="text-sm text-gray-600 mt-1">
            {globalStatus === "ÓPTIMO" &&
              "Todo está en buen estado, no se requiere acción"}
            {globalStatus === "MEDIO" &&
              "Algunas zonas deben ser vigiladas"}
            {globalStatus === "EXCESO" &&
              "Riesgo de saturación en algunos nodos"}
            {globalStatus === "SECO" &&
              "Se recomienda regar inmediatamente"}
          </p>
        </div>

      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <SummaryPanel
            averageHumidity={averageHumidity}
            criticalCount={dryCount + excessCount}
          />
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      <NodeGrid nodes={processedNodes} />
    </div>
  );
}
