import React from 'react';
import { Award, Layers, Shield, HeartPulse } from 'lucide-react';

export default function CkmStageCard({ ckmStage }) {
  if (!ckmStage) return null;

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Stage 0': return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
      case 'Stage 1': return { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' };
      case 'Stage 2': return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'Stage 3': return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
      case 'Stage 4': return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
      default: return { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
    }
  };

  const style = getStageColor(ckmStage.stage);

  return (
    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${style.bg} ${style.border} border ${style.text}`}>
            <Award className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-200">
            AHA 2026 CKM Syndrome
          </span>
        </div>

        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
          {ckmStage.stage}
        </span>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold text-white">
          {ckmStage.label}
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {ckmStage.description}
        </p>
      </div>

      {/* CKM 5-Stage Stepper Ribbon */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 grid grid-cols-5 gap-1.5 text-center text-[9px] font-semibold">
        {['Stage 0', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'].map((s) => {
          const isActive = ckmStage.stage === s;
          return (
            <div
              key={s}
              className={`py-1 rounded-md border transition-all ${
                isActive
                  ? `${style.bg} ${style.border} ${style.text} font-bold shadow-sm`
                  : 'bg-slate-900/40 text-slate-500 border-slate-800/60'
              }`}
            >
              {s.replace('Stage ', 'S')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
