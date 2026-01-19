import { useSystemLatency } from "../../hooks/useSystemLatency";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";

export default function SystemLatencyPanel({ nodes }) {
  const { latencyData, metrics, loading } = useSystemLatency(nodes);

  // Cálculos derivados en frontend (Min y Total)
  const minLatency = latencyData.length > 0
    ? Math.min(...latencyData.map((d) => d.latency_ms))
    : 0;
  const totalSamples = latencyData.length;

  // Formateo inteligente de unidades (ms vs s)
  const formatValue = (ms) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
    return `${Math.round(ms)} ms`;
  };

  // Determinación de estado de red y colores semánticos
  const getNetworkStatus = (avg) => {
    if (avg === 0 && totalSamples === 0) return {
        label: "Esperando datos...",
        color: "text-slate-400",
        bg: "bg-slate-50",
        border: "border-slate-200",
        icon: Wifi
    };
    if (avg < 800)
      return {
        label: "Red estable",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: CheckCircle2,
      };
    if (avg < 2000)
      return {
        label: "Posible congestión",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: AlertTriangle,
      };
    return {
      label: "Retrasos críticos",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      icon: XCircle,
    };
  };

  const status = getNetworkStatus(metrics.avg);
  const StatusIcon = status.icon;

  if (loading && totalSamples === 0) {
    return (
      <div className="p-6 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 animate-pulse">
        Calculando métricas de latencia...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Panel de Estado Principal */}
      <div className={`flex items-center justify-between p-5 rounded-2xl border ${status.bg} ${status.border} transition-all duration-500`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-white shadow-sm ${status.color}`}>
            <StatusIcon size={28} />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${status.color}`}>
              {status.label}
            </h3>
            <p className="text-sm text-slate-500 font-medium opacity-80">
              Diagnóstico en tiempo real
            </p>
          </div>
        </div>
        <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latencia Media</span>
            <p className={`text-3xl font-black ${status.color} leading-none mt-1`}>
              {formatValue(metrics.avg)}
            </p>
        </div>
      </div>

      {/* 2. Tarjetas KPI (Grid 4 columnas) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Promedio" value={formatValue(metrics.avg)} icon={Activity} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
        <KpiCard title="Mínima" value={formatValue(minLatency)} icon={ArrowDown} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
        <KpiCard title="Máxima" value={formatValue(metrics.max)} icon={ArrowUp} color="text-red-600" bg="bg-red-50" border="border-red-100" />
        <KpiCard title="Muestras" value={totalSamples} icon={Clock} color="text-purple-600" bg="bg-purple-50" border="border-purple-100" />
      </div>

      {/* 3. Gráfica de Latencia */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-slate-700 flex items-center gap-2">
              <Activity size={18} className="text-slate-400" />
              Comportamiento de la Red
          </h4>
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
            Últimos 100 paquetes
          </span>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="createdAt" tickFormatter={(val) => new Date(val).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} minTickGap={40} dy={10} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}s` : val} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }} labelFormatter={(label) => new Date(label).toLocaleTimeString()} formatter={(value) => [<span className="font-bold text-blue-600">{formatValue(value)}</span>, <span className="text-slate-500 text-sm">Latencia</span>]} />
              <Area type="monotone" dataKey="latency_ms" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg, border }) {
  return (
    <div className={`p-4 rounded-2xl border ${bg} ${border} flex flex-col justify-between h-24 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span><Icon size={16} className={`opacity-80 ${color}`} /></div>
      <span className={`text-2xl font-black ${color} tracking-tight`}>{value}</span>
    </div>
  );
}
