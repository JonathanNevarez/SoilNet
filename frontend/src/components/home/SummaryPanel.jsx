import { Droplets, AlertTriangle } from "lucide-react";

export default function SummaryPanel({ averageHumidity, criticalCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      
      {/* Humedad promedio */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-full shrink-0">
          <Droplets className="text-blue-500" size={22} />
        </div>

        <div>
          <p className="text-sm text-gray-500">Humedad promedio</p>
          <p className="text-2xl font-semibold text-gray-800">
            {averageHumidity}%
          </p>
        </div>
      </div>

      {/* Zonas críticas */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
        <div className="bg-red-100 p-3 rounded-full shrink-0">
          <AlertTriangle className="text-red-500" size={22} />
        </div>

        <div>
          <p className="text-sm text-gray-500">Zonas críticas</p>
          <p className="text-2xl font-semibold text-red-600">
            {criticalCount}
          </p>
        </div>
      </div>

    </div>
  );
}
