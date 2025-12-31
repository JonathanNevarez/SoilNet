import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import SoilNetLogo from "../assets/SoilNet.svg";
import { login, getCurrentUser } from "../services/authService";

/**
 * Página de inicio de sesión.
 * Permite a los usuarios autenticarse y redirige a los usuarios ya autenticados.
 * @returns {JSX.Element} El componente de la página de inicio de sesión.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /**
   * Redirige al usuario a la página de inicio o de administrador si ya existe una sesión activa.
   */
  useEffect(() => {
    const user = getCurrentUser();

    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/home", {
        replace: true,
      });
    }
  }, [navigate]);

  /**
   * Maneja el envío del formulario de inicio de sesión.
   * @param {React.FormEvent<HTMLFormElement>} e - El evento del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      navigate(user.role === "admin" ? "/admin" : "/home");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source
          src="https://cdn.pixabay.com/video/2020/07/15/44765-440000959_large.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-green-900/25"></div>

      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl px-8 py-10">

        <div className="flex justify-center mt-3 mb-3">
          <img
            src={SoilNetLogo}
            alt="SoilNet logo"
            className="w-48 max-w-full mx-auto"
          />
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-gray-500">
            Plataforma IoT de monitoreo de suelo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Correo institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500
                         hover:text-green-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold
                       hover:bg-green-700 transition active:scale-[0.98]
                       disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-red-600 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
