import { useMemo, useState, useEffect } from "react";
import InlineLoader from "../components/ui/InlineLoader";
import { getSoilStatus } from "../utils/nodeLogic";
import { useNodesRealtime } from "../hooks/useNodesRealtime";

// Componentes de la nueva arquitectura
import DecisionHero from "../components/home/DecisionHero";
import PriorityZones from "../components/home/PriorityZones";
import NodeGrid from "../components/home/NodeGrid";
import InsightStrip from "../components/home/InsightStrip";

// 👇 NUEVO: Import de tu logo
import SoilNetLogo from "../assets/SoilNet.svg";

/**
 * @file Home.jsx
 * @brief Centro de decisiones de riego para agricultores.
 * Elimina promedios globales y se enfoca en la clasificación por estado de cada parcela.
 */

export default function Home() {
  const { nodes, loading } = useNodesRealtime();
  
  // Estado para forzar la actualización de la interfaz cada cierto tiempo
  // y recalcular si los nodos siguen "online" o ya caducaron.
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000); // Actualizar cada 10s
    return () => clearInterval(timer);
  }, []);


  // Fecha formateada
  const today = new Date().toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  // --- Lógica de Clasificación y Procesamiento ---
  const dashboardData = useMemo(() => {
    if (!nodes) return { 
      allNodes: [], 
      dryNodes: [], 
      excessNodes: [], 
      counts: { SECO: 0, MEDIO: 0, OPTIMO: 0, EXCESO: 0 },
      onlineCount: 0,
      lowBatteryCount: 0,
      insights: []
    };

    const processed = nodes.map(node => {
      const humidity = node.lastReading?.humidity_percent ?? null;
      const soilStatus = getSoilStatus(humidity, node.soil_type);
      
      let statusType = "MEDIO";
      
      if (soilStatus.stateCode === "DRY") statusType = "SECO";
      else if (soilStatus.stateCode === "EXCESS" || soilStatus.stateCode === "WET") statusType = "EXCESO";
      else if (soilStatus.stateCode === "OPTIMAL") statusType = "OPTIMO";

      const lastTime = node.lastReading?.createdAt
        ? new Date(node.lastReading.createdAt).getTime()
        : 0;

      // Tolerancia: 35 segundos
      const isOnline = (now - lastTime) < 35000;
      const isLowBattery = (node.lastReading?.voltage ?? 4.0) < 3.3;

      return { node, statusType, isOnline, isLowBattery };
    }); // Se recalcula cuando cambian los nodos O cuando cambia 'now'

    const dryNodes = processed.filter(n => n.statusType === "SECO");
    const excessNodes = processed.filter(n => n.statusType === "EXCESO");

    const counts = {
      SECO: dryNodes.length,
      EXCESO: excessNodes.length,
      MEDIO: processed.filter(n => n.statusType === "MEDIO").length,
      OPTIMO: processed.filter(n => n.statusType === "OPTIMO").length,
    };

    const onlineCount = processed.filter(n => n.isOnline).length;
    const lowBatteryCount = processed.filter(n => n.isLowBattery).length;

    const insights = [];
    if (counts.SECO > 0) {
      insights.push(
        `${counts.SECO} ${counts.SECO === 1 ? "zona requiere" : "zonas requieren"} riego en las próximas horas.`
      );
    }

    if (counts.EXCESO > 0) {
      insights.push(
        `Detectado exceso de humedad en ${counts.EXCESO} ${counts.EXCESO === 1 ? "zona" : "zonas"}. Revisar drenaje.`
      );
    }

    return {
      allNodes: processed,
      dryNodes,
      excessNodes,
      counts,
      onlineCount,
      lowBatteryCount,
      insights
    };

  }, [nodes, now]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 flex flex-col items-center justify-center">
        <InlineLoader text="Cargando parcelas..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-900 selection:bg-green-100">
      
      {/* HEADER */}

      <div className="sticky top-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center transition-all">

        {/* Logo a la izquierda – más grande y sin márgenes Y */}
        <img
          src={SoilNetLogo}
          alt="SoilNet"
          className="h-12 object-contain block"
        />

        {/* Fecha a la derecha */}
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {today}
        </span>

      </div>

      <main className="px-5 pt-8 space-y-8 max-w-lg mx-auto">
        
        <DecisionHero counts={dashboardData.counts} />

        <PriorityZones 
          dryNodes={dashboardData.dryNodes} 
          excessNodes={dashboardData.excessNodes} 
        />

        {/* Módulo de Predicciones (Ubicación solicitada) */}

        <InsightStrip insights={dashboardData.insights} />

        <NodeGrid nodes={dashboardData.allNodes} />
        
      </main>
    </div>
  );
}
