import { Outlet } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";

/**
 * Layout principal para las páginas de usuario.
 * Incluye la navegación inferior y un contenedor para el contenido de la página.
 * @returns {JSX.Element} El componente de layout de la aplicación.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen pb-16 bg-slate-100">
      <Outlet />
      <BottomNav />
    </div>
  );
}