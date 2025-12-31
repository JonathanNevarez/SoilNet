import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

/**
 * Componente de orden superior para proteger rutas.
 * Verifica si hay un usuario autenticado y si su rol coincide con el requerido.
 *
 * @param {object} props - Propiedades del componente.
 * @param {JSX.Element} props.children - El componente hijo a renderizar si la protección se cumple.
 * @param {string} [props.role] - El rol requerido para acceder a la ruta.
 * @returns {JSX.Element} El componente hijo o una redirección a /login.
 */
export default function ProtectedRoute({ children, role }) {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
