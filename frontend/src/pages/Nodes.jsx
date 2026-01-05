// src/pages/Nodes.jsx
import NodesListView from "../components/nodes/NodesListView";
import InlineLoader from "../components/ui/InlineLoader";
import SystemLatencyPanel from "../components/nodes/SystemLatencyPanel";
import { Sprout } from "lucide-react";
import { useNodesDashboard } from "../hooks/useNodesDashboard";

export default function Nodes() {
  const { nodes, loading } = useNodesDashboard();

  if (loading) return (
    <div className="min-h-screen bg-[#F6F9F7] px-4 py-6">
      <InlineLoader text="Cargando información del sistema" />
    </div>
  );

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
