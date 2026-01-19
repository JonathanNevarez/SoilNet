import { useState, useEffect } from "react";
import { getUserNodes } from "../services/nodes.service";
import { getLastReadingByNode } from "../services/readings.service";
import { getCurrentUser } from "../services/authService";
import InlineLoader from "../components/ui/InlineLoader";
import { 
  Sprout, 
  Calculator, 
  ArrowRight, 
  Droplet, 
  Activity, 
  Zap, 
  Signal, 
  Clock, 
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import SoilNetLogo from "../assets/SoilNet.svg";

/**
 * @file Prediction.jsx
 * @brief Página del simulador predictivo de humedad del suelo.
 * 
 * Permite a los usuarios estimar la humedad futura del suelo. Pueden introducir
 * manualmente los parámetros o cargar los datos más recientes de uno de sus
 * nodos para autocompletar el formulario.
 */

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Prediction() {
  const [nodes, setNodes] = useState([]); // Lista de nodos del usuario para el selector.
  const [loadingNodes, setLoadingNodes] = useState(true); // Estado de carga para los nodos.
  const [selectedNodeId, setSelectedNodeId] = useState(""); // ID del nodo seleccionado en el dropdown.
  
  // Estado del formulario con valores iniciales por defecto.
  const [formData, setFormData] = useState({
    humidity_percent: 50,
    raw_value: 2500,
    rssi: -60,
    voltage: 3.3,
    sampling_interval: 5,
    hour: new Date().getHours(),
    // El modelo de Python espera: Lunes=0 ... Domingo=6.
    // JS getDay() devuelve: Domingo=0 ... Sábado=6. Se necesita ajustar.
    day_of_week: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 
  });

  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");

  // Fecha para el header
  const today = new Date().toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  /**
   * Efecto para cargar los nodos del usuario al montar el componente.
   */
  useEffect(() => {
    async function loadNodes() {
      const user = getCurrentUser();
      if (!user) return;
      try {
        const data = await getUserNodes(user.uid);
        setNodes(data);
      } catch (err) {
        console.error("Error cargando nodos", err);
      } finally {
        setLoadingNodes(false);
      }
    }
    loadNodes();
  }, []);

  /**
   * Maneja la selección de un nodo del dropdown.
   * Obtiene la última lectura de ese nodo y actualiza el formulario con sus datos.
   * @param {React.ChangeEvent<HTMLSelectElement>} e - El evento de cambio del selector.
   */
  const handleNodeSelect = async (e) => {
    const nodeId = e.target.value;
    setSelectedNodeId(nodeId);
    
    if (!nodeId) return;

    try {
      // Activa el feedback visual de carga.
      setPredicting(true);
      const lastReading = await getLastReadingByNode(nodeId);
      
      if (lastReading) {
        setFormData(prev => ({
          ...prev,
          humidity_percent: lastReading.humidity_percent ?? 0,
          raw_value: lastReading.raw_value ?? 0,
          rssi: lastReading.rssi ?? -60,
          voltage: lastReading.voltage ?? 3.3,
          sampling_interval: lastReading.sampling_interval ?? 5,
          // Se mantiene la hora actual para simular una predicción desde "ahora".
        }));
        setError("");
      } else {
        setError("El nodo seleccionado no tiene lecturas recientes.");
      }
    } catch (err) {
      console.error(err);
      setError("Error obteniendo datos del nodo.");
    } finally {
      setPredicting(false);
    }
  };

  /**
   * Maneja los cambios en los inputs del formulario.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - El evento de cambio.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  /**
   * Maneja el envío del formulario para generar una predicción.
   * Llama al endpoint `/api/predict` del backend.
   * @param {React.FormEvent<HTMLFormElement>} e - El evento de envío del formulario.
   */
  const handlePredict = async (e) => {
    e.preventDefault();
    setPredicting(true);
    setPrediction(null);
    setError("");

    try {
      const res = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error en la predicción");
      }

      setPrediction(data.humidity_future_prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setPredicting(false);
    }
  };

  // Muestra un loader mientras se cargan los nodos del usuario.
  if (loadingNodes) {
    return (
      <div className="min-h-screen bg-[#F6F9F7] px-4 py-6">
        <InlineLoader text="Cargando módulo de predicción" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-900 selection:bg-green-100">
      
      {/* HEADER UNIFICADO */}
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

      <main className="px-5 pt-8 space-y-6 max-w-lg mx-auto">

        {/* TÍTULO DISCRETO */}
        <div className="flex items-center gap-3 text-slate-700">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Calculator size={20} />
          </div>
          <h2 className="font-bold text-lg">Simulador Predictivo</h2>
        </div>

      {/* Selector de Nodo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Search size={14} /> Cargar datos reales
        </label>
        <select
          value={selectedNodeId}
          onChange={handleNodeSelect}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
        >
          <option value="">-- Selección manual --</option>
          {nodes.map(node => (
            <option key={node.nodeId} value={node.nodeId}>
              {node.name} ({node.nodeId})
            </option>
          ))}
        </select>
        {selectedNodeId && !error && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Datos desde nodo
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Última lectura utilizada</span>
          </div>
        )}
      </div>

      <form onSubmit={handlePredict} className="space-y-6">
        
        <div className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            
            {/* Inputs del formulario */}
            {[
              { label: "Humedad Actual (%)", name: "humidity_percent", icon: Droplet, step: "0.1" },
              { label: "Sensor Raw (ADC)", name: "raw_value", icon: Activity, step: "1" },
              { label: "Voltaje (V)", name: "voltage", icon: Zap, step: "0.01" },
              { label: "Señal RSSI (dBm)", name: "rssi", icon: Signal, step: "1" },
              { label: "Hora del día (0-23)", name: "hour", icon: Clock, step: "1", max: 23 },
            ].map((field) => (
              <div key={field.name} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors group">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2 group-hover:text-emerald-600 transition-colors">
                  <field.icon size={14} /> {field.label}
                </label>
                <input
                  type="number"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full bg-transparent font-black text-slate-700 text-xl outline-none placeholder:text-slate-300"
                  step={field.step}
                  max={field.max}
                />
              </div>
            ))}

            {/* Selector de Día */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors group">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2 group-hover:text-emerald-600 transition-colors">
                <Calendar size={14} /> Día Semana
              </label>
              <select
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                className="w-full bg-transparent font-bold text-slate-700 text-base outline-none cursor-pointer"
              >
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={predicting}
          className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {predicting ? (
            <>Calculando...</>
          ) : (
            <>
              <Sprout size={20} /> Generar Predicción
            </>
          )}
        </button>

      </form>

      {/* Resultado */}
      {prediction !== null && (
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-6 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1.5 ${
            prediction > formData.humidity_percent ? "bg-blue-500" : 
            prediction < formData.humidity_percent ? "bg-amber-500" : "bg-slate-300"
          }`}></div>
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Resultado del Modelo</h3>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
              prediction > formData.humidity_percent ? "bg-blue-50 text-blue-700" : 
              prediction < formData.humidity_percent ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}>
              {prediction > formData.humidity_percent ? "Aumento" : prediction < formData.humidity_percent ? "Descenso" : "Estable"}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Actual</p>
              <p className="text-2xl font-bold text-slate-500 tracking-tight">{formData.humidity_percent}%</p>
            </div>
            
            <div className="flex-1 flex justify-center text-slate-300">
              <ArrowRight size={24} />
            </div>
            
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Predicción</p>
              <div className="flex items-center justify-end gap-2">
                {prediction > formData.humidity_percent && <TrendingUp size={20} className="text-blue-500" />}
                {prediction < formData.humidity_percent && <TrendingDown size={20} className="text-amber-500" />}
                {prediction === formData.humidity_percent && <Minus size={20} className="text-slate-400" />}
                <p className="text-4xl font-black text-slate-800 tracking-tighter">
                  {prediction.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-center">
             <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
               <Activity size={12} />
            Basado en modelo Random Forest (v1.0)
             </span>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
