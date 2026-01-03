import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Modal para crear o editar un nodo sensor.
 * Permite definir el ID, nombre e intervalo de muestreo del nodo.
 *
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal está visible.
 * @param {object} [props.node] - Datos del nodo a editar (null si es creación).
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @param {Function} props.onSave - Función para guardar los cambios (recibe el objeto del nodo).
 * @returns {JSX.Element|null} El componente del modal o null si no está abierto.
 */
export default function NodeModal({ isOpen, node, onClose, onSave }) {
  const [form, setForm] = useState({
    nodeId: "",
    name: "",
    location: "",
    soil_type: "LOAM"
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (node) {
      setForm({
        nodeId: node.nodeId || "",
        name: node.name || "",
        location: node.location || "",
        soil_type: node.soil_type || "LOAM"
      });
    } else {
      setForm({
        nodeId: "",
        name: "",
        location: "",
        soil_type: "LOAM"
      });
    }
  }, [node, isOpen]);

  if (!isOpen) return null;

  const handleChange = e => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg animate-fadeIn">

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {node ? "Editar nodo" : "Nuevo nodo"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID del nodo
            </label>
            <input
              type="text"
              name="nodeId"
              value={form.nodeId}
              onChange={handleChange}
              required
              disabled={!!node}
              className={`w-full rounded-lg border px-3 py-2 text-sm
                ${node
                  ? "bg-gray-100 text-gray-500 border-gray-200"
                  : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del nodo
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación (Opcional)
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Ej. Invernadero 2"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de suelo
            </label>
            <select
              name="soil_type"
              value={form.soil_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="SANDY">Arenoso (Sandy)</option>
              <option value="LOAM">Franco (Loam)</option>
              <option value="CLAY">Arcilloso (Clay)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm
                         border border-gray-300 text-gray-700
                         hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold
                         bg-green-600 text-white
                         hover:bg-green-700"
            >
              {node ? "Guardar cambios" : "Crear nodo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
