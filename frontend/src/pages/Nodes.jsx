// src/pages/Nodes.jsx
import { useMemo } from "react";
import NodesListView from "../components/nodes/NodesListView";
import InlineLoader from "../components/ui/InlineLoader";
import SystemLatencyPanel from "../components/nodes/SystemLatencyPanel";
import { Sprout, Activity } from "lucide-react";
import { useNodesDashboard } from "../hooks/useNodesDashboard";
import SoilNetLogo from "../assets/SoilNet.svg";

export default function Nodes() {
  const { nodes, loading } = useNodesDashboard();

  // Cálculos de resumen y ordenamiento
  const { sortedNodes, stats } = useMemo(() => {
    if (!nodes) return { sortedNodes: [], stats: { total: 0, issues: 0, online: 0 } };

    const total = nodes.length;
    const online = nodes.filter(n => n.online).length;
    // Consideramos "problema" si está offline o tiene alertas
    const issues = nodes.filter(n => !n.online || (n.alertsCount && n.alertsCount > 0)).length;

    // Ordenar: Primero offline, luego con alertas, luego el resto
    const sorted = [...nodes].sort((a, b) => {
      if (a.online !== b.online) return a.online ? 1 : -1; // Offline primero
      
      const alertsA = a.alertsCount || 0;
      const alertsB = b.alertsCount || 0;
      return alertsB - alertsA; // Más alertas primero
    });

    return { sortedNodes: sorted, stats: { total, issues, online } };
  }, [nodes]);

  // Fecha para el header
  const today = new Date().toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 flex flex-col items-center justify-center">
      <InlineLoader text="Cargando información del sistema" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-900 selection:bg-green-100">
      
      {/* HEADER UNIFICADO (Igual al Home) */}
      <div className="sticky top-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center transition-all">
        <img
          src={SoilNetLogo}
          alt="SoilNet"
          className="h-12 object-contain block"
        />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {today}
        </span>
      </div>

      <main className="px-5 pt-8 space-y-8 max-w-lg mx-auto">
        
        {/* Lista de Nodos (Ordenada por gravedad) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                <Sprout size={18} className="text-green-600"/>
                Estado de Parcelas
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                {sortedNodes.length} dispositivos
              </span>
           </div>
           <NodesListView nodes={sortedNodes} />
        </div>
        
        {/* Sección de Latencia */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 px-1">
            <Activity size={18} className="text-blue-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Latencia del Sistema</h3>
          </div>
          <SystemLatencyPanel nodes={nodes} />
        </div>
      </main>
    </div>
  );
}
