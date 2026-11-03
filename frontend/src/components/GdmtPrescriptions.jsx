import React from 'react';
import { Pill, CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';

export default function GdmtPrescriptions({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
        <h4 className="text-sm font-semibold text-white">Optimal Cardiorenal Health</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No guideline-directed pharmacotherapy indicated. Annual routine preventive metabolic surveillance recommended.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all shadow-sm group"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0 text-teal-400">
                <Pill className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-teal-200 tracking-tight">
                {rec.category}
              </span>
            </div>

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
              {rec.evidence_level}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed pl-8 mb-2 font-normal">
            {rec.action}
          </p>

          <div className="pl-8 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60 text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-teal-400">Clinical Target:</span>
              <span className="text-slate-300">{rec.target}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Order Ready</span>
          </div>
        </div>
      ))}
    </div>
  );
}
