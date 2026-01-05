import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useSystemLatency } from "../../hooks/useSystemLatency";

const SystemLatencyPanel = ({ nodes }) => {
  const { period, setPeriod, latencyData, loading, metrics, avgInterval, activeNodesCount } = useSystemLatency(nodes);

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Latencia del sistema</h2>
          <div className="text-sm text-gray-500 mt-1">
            Nodos activos: <span className="font-medium text-gray-900">{activeNodesCount}</span> | 
            Intervalo prom: <span className="font-medium text-gray-900">{avgInterval} s</span>
          </div>
        </div>

        {/* Selector de periodo */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[15, 30, 60].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === p ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {p} min
            </button>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Promedio", value: metrics.avg, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "p95", value: metrics.p95, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Máxima", value: metrics.max, color: "text-red-600", bg: "bg-red-50" },
        ].map(m => (
          <div key={m.label} className={`${m.bg} rounded-lg p-3 text-center`}>
            <div className={`text-xs font-bold uppercase tracking-wider ${m.color} opacity-80`}>{m.label}</div>
            <div className={`text-xl font-bold ${m.color} mt-1`}>{(m.value / 1000).toFixed(2)} s</div>
          </div>
        ))}
      </div>

      {/* Gráfica */}
      <div className="h-64 w-full mb-6">
        {loading && !latencyData.length ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">Cargando datos...</div>
        ) : latencyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">No hay datos en este periodo</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="createdAt" 
                tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                stroke="#9ca3af" tick={{ fontSize: 11 }} minTickGap={30} 
              />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} width={35} />
              <Tooltip labelFormatter={l => new Date(l).toLocaleString()} formatter={val => [`${val} ms`, 'Latencia']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="latency_ms" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SystemLatencyPanel;
