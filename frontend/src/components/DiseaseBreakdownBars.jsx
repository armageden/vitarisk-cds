import React from 'react';
import { Droplet, Activity, Heart, Network } from 'lucide-react';

export default function DiseaseBreakdownBars({ probabilities }) {
  if (!probabilities) return null;

  const diseases = [
    {
      id: 't2d',
      name: 'Type 2 Diabetes',
      prob: probabilities.t2d,
      icon: Droplet,
      color: 'bg-teal-400',
      textColor: 'text-teal-300',
      trackColor: 'bg-teal-950/40',
      description: 'Macrovascular & beta-cell glycemic stress'
    },
    {
      id: 'ckd',
      name: 'Chronic Kidney Disease',
      prob: probabilities.ckd,
      icon: Activity,
      color: 'bg-sky-400',
      textColor: 'text-sky-300',
      trackColor: 'bg-sky-950/40',
      description: 'Glomerular filtration loss (eGFR < 60 or uACR > 30)'
    },
    {
      id: 'cvd',
      name: 'Cardiovascular Disease (MACE)',
      prob: probabilities.cvd,
      icon: Heart,
      color: 'bg-rose-400',
      textColor: 'text-rose-300',
      trackColor: 'bg-rose-950/40',
      description: 'Major adverse cardiac events, CAD, stroke'
    },
    {
      id: 'mm',
      name: 'Joint Multi-Morbid Coupling',
      prob: probabilities.multimorbidity,
      icon: Network,
      color: 'bg-purple-400',
      textColor: 'text-purple-300',
      trackColor: 'bg-purple-950/40',
      description: 'Coherent co-occurrence bounded by Fréchet inequalities'
    }
  ];

  return (
    <div className="space-y-3.5">
      {diseases.map(d => {
        const pct = (d.prob * 100).toFixed(1);
        const Icon = d.icon;
        
        let riskLabel = 'Low Risk';
        let badgeStyle = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (d.prob >= 0.60) {
          riskLabel = 'Critical';
          badgeStyle = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
        } else if (d.prob >= 0.35) {
          riskLabel = 'High';
          badgeStyle = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        } else if (d.prob >= 0.15) {
          riskLabel = 'Moderate';
          badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        }

        return (
          <div key={d.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <Icon className={`w-3.5 h-3.5 ${d.textColor}`} />
                <span className="text-xs font-semibold text-slate-200">{d.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                  {riskLabel}
                </span>
                <span className="text-xs font-bold text-white font-mono tabular-nums">
                  {pct}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden relative">
              <div
                className={`h-full rounded-full ${d.color} transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(100, d.prob * 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
              <span className="truncate max-w-[200px]">{d.description}</span>
              <span className="font-mono text-slate-400">P = {d.prob.toFixed(3)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
