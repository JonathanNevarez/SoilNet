import { Home, BarChart3, CloudSun, User } from "lucide-react";
import { NavLink } from "react-router-dom";

/**
 * Componente de navegación inferior para dispositivos móviles.
 * Muestra enlaces a las secciones principales de la aplicación.
 * @returns {JSX.Element} El componente de la barra de navegación.
 */
export default function BottomNav() {
  const base =
    "flex flex-col items-center justify-center gap-1 text-xs font-medium transition";

  const active = "text-white";
  const inactive = "text-green-200";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-green-700 shadow-xl border-t border-green-600">
      <div className="grid grid-cols-4 py-2">
        
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <Home size={20} />
          Inicio
        </NavLink>

        <NavLink
          to="/nodos"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <BarChart3 size={20} />
          Nodos
        </NavLink>

        <NavLink
          to="/prediccion"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <CloudSun size={20} />
          Predicción
        </NavLink>

        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <User size={20} />
          Perfil
        </NavLink>

      </div>
    </nav>
  );
}
