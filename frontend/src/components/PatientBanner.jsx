import React from 'react';
import { User, Activity, Sparkles, ChevronRight, ShieldCheck, HeartPulse, Droplets } from 'lucide-react';

export default function PatientBanner({
  patient,
  personas,
  selectedPersonaId,
  onSelectPersona
}) {
  const activePersona = personas.find(p => p.id === selectedPersonaId) || personas[0];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-3.5 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Patient Avatar & Demographics */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-sky-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-teal-400 font-bold text-sm shadow-inner">
            {patient.sex === 'Female' ? 'F' : 'M'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                {activePersona.name}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-teal-400 font-medium">
                MRN-{patient.age * 137}-{selectedPersonaId}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 mt-0.5">
              <span>{patient.age} yrs • {patient.sex}</span>
              <span className="text-slate-600">•</span>
              <span>{patient.ethnicity}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">SDoH Decile {patient.ses_decile}/10</span>
              <span className="text-slate-600">•</span>
              <span className="text-teal-400/90 font-medium">{patient.insurance_type}</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Live Vitals Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] text-slate-400">BP:</span>
            <span className="font-mono tabular-nums font-semibold text-white">
              {patient.systolic_bp}/{patient.diastolic_bp}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] text-slate-400">eGFR:</span>
            <span className={`font-mono tabular-nums font-semibold ${patient.egfr < 60 ? 'text-amber-400' : 'text-white'}`}>
              {patient.egfr}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px] text-slate-400">HbA1c:</span>
            <span className={`font-mono tabular-nums font-semibold ${patient.hba1c >= 6.5 ? 'text-rose-400' : 'text-white'}`}>
              {patient.hba1c}%
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <span className="text-[11px] text-slate-400">uACR:</span>
            <span className={`font-mono tabular-nums font-semibold ${patient.uacr > 30 ? 'text-amber-400' : 'text-white'}`}>
              {patient.uacr} mg/g
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <span className="text-[11px] text-slate-400">BMI:</span>
            <span className="font-mono tabular-nums font-semibold text-white">
              {patient.bmi}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Personas Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap flex items-center space-x-1 mr-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Clinical Cohort Cases:</span>
        </span>
        {personas.map(p => {
          const isSelected = selectedPersonaId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 border text-xs ${
                isSelected
                  ? 'bg-teal-500/15 text-teal-200 border-teal-500/50 font-semibold shadow-sm ring-1 ring-teal-500/30'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span>{p.name.split(':')[0]}</span>
              {p.tag && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isSelected ? 'bg-teal-500/25 text-teal-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  {p.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
