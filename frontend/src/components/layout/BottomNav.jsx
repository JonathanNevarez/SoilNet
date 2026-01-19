import { Home, BarChart3, CloudSun, User } from "lucide-react";
import { NavLink } from "react-router-dom";

/**
 * Componente de navegación inferior para dispositivos móviles.
 * Muestra enlaces a las secciones principales de la aplicación.
 * @returns {JSX.Element} El componente de la barra de navegación.
 */
export default function BottomNav() {
  const base =
    "relative flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition-all duration-300 py-1 px-2 rounded-2xl active:scale-95 h-full";

  const active = "text-green-600 bg-green-50 shadow-sm shadow-green-100 translate-y-[-4px]";
  const inactive = "text-slate-400 hover:text-slate-600 hover:bg-slate-50";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-slate-100 z-50 pb-safe pt-1">
      <div className="grid grid-cols-4 px-4 pb-2 pt-1 gap-2 max-w-lg mx-auto">
        
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <Home size={22} strokeWidth={2.5} />
          <span>Inicio</span>
        </NavLink>

        <NavLink
          to="/nodos"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <BarChart3 size={22} strokeWidth={2.5} />
          <span>Nodos</span>
        </NavLink>

        <NavLink
          to="/prediccion"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <CloudSun size={22} strokeWidth={2.5} />
          <span>Predicción</span>
        </NavLink>

        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <User size={22} strokeWidth={2.5} />
          <span>Perfil</span>
        </NavLink>

      </div>
    </nav>
  );
}
