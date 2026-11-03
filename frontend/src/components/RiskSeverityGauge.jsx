import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

export default function RiskSeverityGauge({ compositeScore, tier, urgency, color, ckmStage }) {
  const percentage = Math.min(100, Math.max(0, (compositeScore || 0) * 100));
  
  // Radius and circumference for semi-circle gauge (radius = 90, viewBox 220x130)
  const radius = 80;
  const cx = 110;
  const cy = 105;
  const circumference = Math.PI * radius; // 180 degrees arc
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getTierIcon = () => {
    switch (tier) {
      case 'Low':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'Moderate':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'High':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'Critical':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-56 h-32 flex items-center justify-center">
        <svg className="w-56 h-32 overflow-visible" viewBox="0 0 220 125">
          <defs>
            {/* Background Arc Gradient */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="25%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track */}
          <path
            d="M 30,105 A 80,80 0 0,1 190,105"
            fill="none"
            stroke="#1e293b"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Value arc */}
          <path
            d="M 30,105 A 80,80 0 0,1 190,105"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#gaugeGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Reference Ticks */}
          <text x="24" y="122" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">0%</text>
          <text x="75" y="42" fill="#64748b" fontSize="8" fontWeight="500" textAnchor="middle">15%</text>
          <text x="110" y="20" fill="#64748b" fontSize="8" fontWeight="500" textAnchor="middle">35%</text>
          <text x="150" y="42" fill="#64748b" fontSize="8" fontWeight="500" textAnchor="middle">60%</text>
          <text x="196" y="122" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">100%</text>
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-extrabold tracking-tight text-white font-mono tabular-nums">
              {percentage.toFixed(1)}
            </span>
            <span className="text-lg font-bold text-slate-400">%</span>
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
            5-Year Composite Risk
          </span>
        </div>
      </div>

      {/* Urgency & Tier Pill */}
      <div className="mt-3 flex items-center space-x-2">
        <div
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}40`,
            color: color
          }}
        >
          {getTierIcon()}
          <span>{tier} Risk Tier</span>
        </div>
      </div>

      <div className="mt-2 text-center text-xs text-slate-300 font-medium">
        <span className="text-slate-400">Clinical Protocol: </span>
        <span className="text-slate-100">{urgency}</span>
      </div>
    </div>
  );
}
