import { Settings } from "lucide-react";

/**
 * Componente de carga que se muestra a pantalla completa.
 * Ideal para indicar procesos de carga iniciales o bloqueantes.
 *
 * @param {object} props - Propiedades del componente.
 * @param {string} [props.text="Cargando..."] - El texto a mostrar debajo del icono de carga.
 * @returns {JSX.Element} El componente de carga en línea.
 */
export default function InlineLoader({ text = "Cargando..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F6F9F7]">
      <div className="flex flex-col items-center gap-5">

        <Settings
          size={72}
          className="text-green-600 animate-spin-slow"
        />

        <p className="text-sm font-medium text-gray-500 tracking-wide">
          {text}
        </p>

        <p className="text-xs text-gray-400">
          SoilNet · monitoreo agrícola
        </p>
      </div>
    </div>
  );
}
