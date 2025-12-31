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
  Search
} from "lucide-react";

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
    <div className="min-h-screen bg-[#F6F9F7] px-4 py-6 space-y-6">
      
      <div className="flex items-center gap-2 text-gray-700">
        <Calculator size={24} className="text-green-600" />
        <h1 className="text-2xl font-bold">Simulador Predictivo</h1>
      </div>

      <p className="text-gray-500 text-sm">
        Estime la humedad futura del suelo basándose en las condiciones actuales de los sensores.
      </p>

      {/* Selector de Nodo */}
      <div className="bg-white rounded-xl shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Search size={16} /> Cargar datos desde un nodo
        </label>
        <select
          value={selectedNodeId}
          onChange={handleNodeSelect}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">-- Selección manual --</option>
          {nodes.map(node => (
            <option key={node.nodeId} value={node.nodeId}>
              {node.name} ({node.nodeId})
            </option>
          ))}
        </select>
        {selectedNodeId && !error && (
          <p className="text-xs text-green-600 mt-2">
            Datos cargados de la última lectura disponible.
          </p>
        )}
      </div>

      <form onSubmit={handlePredict} className="space-y-6">
        
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Variables de Entrada</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Inputs del formulario */}
            {[
              { label: "Humedad Actual (%)", name: "humidity_percent", icon: Droplet, step: "0.1" },
              { label: "Sensor Raw (ADC)", name: "raw_value", icon: Activity, step: "1" },
              { label: "Voltaje (V)", name: "voltage", icon: Zap, step: "0.01" },
              { label: "Señal RSSI (dBm)", name: "rssi", icon: Signal, step: "1" },
              { label: "Hora del día (0-23)", name: "hour", icon: Clock, step: "1", max: 23 },
            ].map((field) => (
              <div key={field.name}>
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-1">
                  <field.icon size={14} /> {field.label}
                </label>
                <input
                  type="number"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                  step={field.step}
                  max={field.max}
                />
              </div>
            ))}

            {/* Selector de Día */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-1">
                <Calendar size={14} /> Día Semana
              </label>
              <select
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition bg-white"
              >
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={predicting}
          className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-green-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-center text-gray-500 text-sm uppercase tracking-wide font-semibold">
            Humedad Futura Estimada
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Actual</p>
              <p className="text-2xl font-bold text-gray-600">{formData.humidity_percent}%</p>
            </div>
            
            <ArrowRight className="text-green-500" size={32} />
            
            <div className="text-left">
              <p className="text-sm text-green-600 font-semibold">Predicción</p>
              <p className="text-5xl font-extrabold text-green-700">
                {prediction.toFixed(1)}%
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Basado en modelo Random Forest (v1.0)
          </p>
        </div>
      )}

    </div>
  );
}
