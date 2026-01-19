import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/authService";
import { getUserNodes } from "../services/nodes.service";
import { Server, User, LogOut, ShieldCheck, Activity, Bell, Settings, HelpCircle, ChevronRight } from "lucide-react";
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

  // Fecha para el header
  const today = new Date().toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

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

      <main className="px-5 pt-8 space-y-8 max-w-lg mx-auto">

        {/* SECCIÓN IDENTIDAD */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-100 to-green-50 border-4 border-white shadow-lg flex items-center justify-center text-emerald-600 text-5xl font-black">
              {user.fullName.charAt(0)}
            </div>
            <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full" title="Online"></div>
          </div>

          <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
            {user.fullName}
          </h1>
          <p className="text-sm text-slate-500 font-medium mb-3">
            {user.email}
          </p>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-emerald-700 text-[10px] font-bold uppercase tracking-wide border border-emerald-100 shadow-sm">
            <ShieldCheck size={14} />
            Cuenta Verificada
          </div>
        </div>

        {/* PANEL DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 gap-4">
          
          {/* Card Nodos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <Server size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nodos Asignados</p>
                <p className="text-xs text-slate-400 mt-1">Dispositivos activos en tus parcelas</p>
              </div>
            </div>
            
            {loadingNodes ? (
              <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <div className="text-right">
                <p className="text-5xl font-black text-emerald-600 tracking-tighter leading-none">
                  {nodesCount}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MENÚ DE OPCIONES */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <MenuItem icon={User} label="Editar Perfil" />
            <MenuItem icon={Bell} label="Notificaciones" badge="2" />
            <MenuItem icon={Settings} label="Configuración" />
            <MenuItem icon={HelpCircle} label="Ayuda y Soporte" isLast />
        </div>

        {/* ACCIONES */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm shadow-sm hover:bg-rose-100 hover:border-rose-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Cerrar Sesión
        </button>

        {/* FOOTER MARCA */}
        <div className="pt-4 flex flex-col items-center text-center space-y-3 opacity-40 hover:opacity-100 transition-opacity">
          <img
            src={SoilNetLogo}
            alt="SoilNet"
            className="h-5 grayscale"
          />
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            <p>v1.0.0 • SoilNet Corp</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MenuItem({ icon: Icon, label, isLast, badge }) {
    return (
        <button className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${!isLast ? 'border-b border-slate-50' : ''}`}>
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-slate-50 text-slate-500">
                    <Icon size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700">{label}</span>
            </div>
            <div className="flex items-center gap-3">
                {badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-rose-200">
                        {badge}
                    </span>
                )}
                <ChevronRight size={18} className="text-slate-300" />
            </div>
        </button>
    )
}
