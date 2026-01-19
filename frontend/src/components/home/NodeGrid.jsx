import NodeStatusCard from "./NodeStatusCard";

export default function NodeGrid({ nodes }) {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-1 mb-2">
        Todas las Parcelas ({nodes.length})
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {nodes.map((item) => (
          <NodeStatusCard key={item.node.nodeId} node={item.node} statusType={item.statusType} />
        ))}
      </div>
    </div>
  );
}