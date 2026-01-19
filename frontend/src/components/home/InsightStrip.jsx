import { Lightbulb, ArrowRight } from "lucide-react";

export default function InsightStrip({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-2">
      {insights.map((msg, idx) => (
        <div key={idx} className="bg-white border border-blue-100 p-4 rounded-2xl flex gap-3 items-start shadow-sm">
          <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 shrink-0"><Lightbulb size={16} /></div>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {msg}
          </p>
        </div>
      ))}
    </div>
  );
}
