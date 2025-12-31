import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/authService";
import { getUserNodes } from "../services/nodes.service";
import { Server } from "lucide-react";
import InlineLoader from "../components/ui/InlineLoader";
import SoilNetLogo from "../assets/SoilNet.svg";

/**
 * Página de perfil de usuario.
 * Muestra la información del usuario, un conteo de sus nodos y la opción de cerrar sesión.
 * @returns {JSX.Element | null} El componente de perfil o null si no hay usuario.
 */
export default function Profile() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [nodesCount, setNodesCount] = useState(0);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  /**
   * Efecto para redirigir al login si no hay un usuario autenticado.
   */
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  /**
   * Carga la cantidad de nodos asignados al usuario.
   */
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;

      try {
        const nodes = await getUserNodes(user.id);
        setNodesCount(nodes.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNodes(false);
        setLoadingProfile(false);
      }
    }

    loadData();
  }, [user]);

  /**
   * Maneja el cierre de sesión del usuario y lo redirige a la página de login.
   */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // No renderiza nada si no hay un usuario.
  if (!user) return null;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#F6F9F7] px-4 py-6">
        <InlineLoader text="Cargando perfil" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9F7] px-4 py-6 space-y-6">

      <div className="flex flex-col items-center text-center mt-6 space-y-2">
        <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold shadow">
          {user.fullName.charAt(0)}
        </div>

        <p className="text-xl font-semibold text-gray-900">
          {user.fullName}
        </p>

        <p className="text-sm text-gray-500">
          {user.email}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center mt-10">
        <div>
          <p className="text-sm text-gray-500">Nodos asignados</p>

          {loadingNodes ? (
            <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse mt-2" />
          ) : (
            <p className="text-4xl font-bold text-green-700">
              {nodesCount}
            </p>
          )}
        </div>

        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <Server className="text-green-600" />
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full mt-10 py-3 rounded-xl
                   border border-red-200 text-red-600
                   font-medium hover:bg-red-50 transition"
      >
        Cerrar sesión
      </button>

      <div className="pt-10 flex flex-col items-center text-center space-y-2 opacity-70">
        <img
          src={SoilNetLogo}
          alt="SoilNet"
          className="h-6"
        />
        <p className="text-xs text-gray-400">
          Monitoreo IoT de Humedad del Suelo
        </p>
        <p className="text-xs text-gray-400">
          SoilNet · v1.0.0
        </p>
      </div>

    </div>
  );
}
