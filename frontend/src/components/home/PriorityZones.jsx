import NodeStatusCard from "./NodeStatusCard";
import { AlertTriangle, Droplet, ArrowRight } from "lucide-react";

export default function PriorityZones({ dryNodes, excessNodes }) {
  const hasPriorities = dryNodes.length > 0 || excessNodes.length > 0;

  if (!hasPriorities) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sección de Riego Urgente */}
      {dryNodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-rose-700 px-1 mb-1">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Droplet className="fill-rose-700" size={16} /> Prioridad: Riego</h3>
            <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">{dryNodes.length} zonas</span>
          </div>
          <div className="grid gap-3">
            {dryNodes.map((item) => (
              <NodeStatusCard key={item.node.nodeId} node={item.node} statusType="SECO" />
            ))}
          </div>
        </div>
      )}

      {/* Sección de Alerta por Exceso */}
      {excessNodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-blue-700 px-1 mb-1">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><AlertTriangle size={16} /> Atención: Exceso</h3>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">{excessNodes.length} zonas</span>
          </div>
          <div className="grid gap-3">
            {excessNodes.map((item) => (
              <NodeStatusCard key={item.node.nodeId} node={item.node} statusType="EXCESO" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}