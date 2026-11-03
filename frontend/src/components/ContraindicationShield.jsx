import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ContraindicationShield({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => {
        const isCritical = alert.severity === 'CRITICAL';
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl border flex items-start space-x-3.5 shadow-lg transition-all ${
              isCritical
                ? 'bg-rose-950/50 border-rose-500/60 text-rose-100 ring-1 ring-rose-500/30'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-100 ring-1 ring-amber-500/30'
            }`}
          >
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {alert.type} • {alert.severity}
                </span>
                <span className="text-xs font-bold text-white">
                  {alert.medication} Clinical Safety Guardrail
                </span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
