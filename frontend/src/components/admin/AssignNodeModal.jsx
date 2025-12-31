import { X, Link } from "lucide-react";

/**
 * Modal para asignar un nodo a un usuario específico.
 * Muestra una lista de usuarios disponibles para realizar la asignación.
 *
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal está visible.
 * @param {object} props.node - El objeto del nodo que se va a asignar.
 * @param {Array} props.users - Lista de usuarios disponibles para asignar.
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @param {Function} props.onAssign - Función que se ejecuta al asignar (recibe el UID del usuario).
 * @returns {JSX.Element|null} El componente del modal o null si no está abierto.
 */
export default function AssignNodeModal({
  isOpen,
  node,
  users,
  onClose,
  onAssign
}) {
  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg animate-fadeIn">

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Asignar nodo
            </h2>
            <p className="text-xs text-gray-500">
              Nodo: <span className="font-medium">{node.name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[320px] overflow-y-auto">

          {users.length === 0 && (
            <p className="text-sm text-gray-400 text-center">
              No hay usuarios disponibles
            </p>
          )}

          {users.map(user => (
            <div
              key={user._id}
              className="flex items-center justify-between
                         border rounded-lg px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>

              <button
                onClick={() => onAssign(user._id)}
                className="flex items-center gap-1 px-3 py-1.5
                           text-sm font-semibold rounded-lg
                           bg-green-600 text-white
                           hover:bg-green-700"
              >
                <Link size={14} />
                Asignar
              </button>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm
                       border border-gray-300 text-gray-700
                       hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
