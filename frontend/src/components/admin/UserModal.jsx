import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Modal para crear o editar un usuario.
 * Permite gestionar nombre, email, contraseña y rol.
 *
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal está visible.
 * @param {object} [props.user] - Datos del usuario a editar (null si es creación).
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @param {Function} props.onSave - Función para guardar los cambios (recibe el objeto del usuario).
 * @returns {JSX.Element|null} El componente del modal o null si no está abierto.
 */
export default function UserModal({ isOpen, user, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user",
    phone: ""
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        password: "",
        role: user.role || "user",
        phone: user.phone || ""
      });
    } else {
      setForm({
        fullName: "",
        email: "",
        password: "",
        role: "user",
        phone: ""
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = e => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = e => {
    e.preventDefault();

    const payload = { ...form };

    // No enviar password vacío en edición
    if (user && !payload.password) {
      delete payload.password;
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg animate-fadeIn">

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {user ? "Editar usuario" : "Nuevo usuario"}
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
              Nombre completo
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={!!user}
              className={`w-full rounded-lg border px-3 py-2 text-sm
                ${user
                  ? "bg-gray-100 text-gray-500 border-gray-200"
                  : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? "Nueva contraseña (opcional)" : "Contraseña"}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!user}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
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
              {user ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
