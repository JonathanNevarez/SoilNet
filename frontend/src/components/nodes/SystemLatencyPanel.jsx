import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const SystemLatencyPanel = ({ nodes }) => {
  const [period, setPeriod] = useState(30); // Periodo por defecto: 30 minutos
  const [latencyData, setLatencyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcular nodos activos basándonos en la prop 'nodes'
  // Asumimos que el componente padre (Nodes.jsx) pasa los nodos con su estado calculado
  const activeNodes = nodes.filter(n => n.status === 'online' || n.online);
  const activeNodesCount = activeNodes.length;

  useEffect(() => {
    const fetchLatency = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/readings/latency?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar datos de latencia');
        }

        const data = await response.json();
        setLatencyData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching latency:", err);
        setError('No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatency();
    // Refrescar datos cada 30 segundos
    const intervalId = setInterval(fetchLatency, 30000);
    return () => clearInterval(intervalId);
  }, [period]);

  // Cálculo de métricas (Promedio, p95, Máximo)
  const metrics = useMemo(() => {
    if (!latencyData.length) return { avg: 0, p95: 0, max: 0 };

    const values = latencyData.map(d => d.latency_ms);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);

    // Percentil 95
    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index];

    return { avg, p95, max };
  }, [latencyData]);

  // Estimación del intervalo de llegada de datos al sistema
  const avgInterval = useMemo(() => {
    if (!latencyData.length) return 0;
    // Periodo en segundos / cantidad de muestras
    return ((period * 60) / latencyData.length).toFixed(1);
  }, [latencyData, period]);

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-100">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Latencia del sistema</h2>
          <div className="text-sm text-gray-500 mt-1">
            Nodos activos: <span className="font-medium text-gray-900">{activeNodesCount}</span> | 
            Intervalo prom: <span className="font-medium text-gray-900">{avgInterval} s</span>
          </div>
        </div>
        
        {/* Selector de Periodo */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[15, 30, 60].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                period === p 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p} min
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Promedio', value: metrics.avg, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'p95', value: metrics.p95, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Máxima', value: metrics.max, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((m) => (
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
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                minTickGap={30}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                width={35}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                labelFormatter={(l) => new Date(l).toLocaleString()}
                formatter={(val) => [`${val} ms`, 'Latencia']}
              />
              <Line 
                type="monotone" 
                dataKey="latency_ms" 
                stroke="#2563eb" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4 }} 
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Lista de Estado de Nodos */}
      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Estado de Nodos</h3>
        <div className="space-y-2">
          {nodes.map((node) => {
            const isOnline = node.status === 'online' || node.online;
            return (
              <div key={node.nodeId || node._id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-700">{node.name || node.nodeId}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            );
          })}
          {nodes.length === 0 && <div className="text-sm text-gray-400 italic">No hay nodos registrados.</div>}
        </div>
      </div>
    </div>
  );
};

export default SystemLatencyPanel;