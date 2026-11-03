import React from 'react';

export default function BiomarkerInput({
  label,
  value,
  onChange,
  unit,
  type = "number",
  min,
  max,
  step = "any",
  referenceRange,
  statusType // 'glycemic', 'egfr', 'uacr', 'sbp', 'dbp', 'ldl', 'hdl', 'tg', 'bmi', 'crp'
}) {
  // Determine physiological status
  const getStatus = (val, type) => {
    if (val === undefined || val === null || isNaN(val)) return null;
    const num = parseFloat(val);

    switch (type) {
      case 'hba1c':
        if (num < 5.7) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Normal (<5.7%)' };
        if (num < 6.5) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Pre-Diabetes (5.7–6.4%)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'Diabetes Range (≥6.5%)' };
      
      case 'fasting_glucose':
        if (num < 100) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Normal (<100 mg/dL)' };
        if (num < 126) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Impaired (100–125 mg/dL)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'Elevated (≥126 mg/dL)' };

      case 'egfr':
        if (num >= 90) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Stage G1 Normal (≥90 mL/min)' };
        if (num >= 60) return { color: 'bg-emerald-300', ring: 'border-emerald-500/40', text: 'Stage G2 Mild (60–89 mL/min)' };
        if (num >= 45) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Stage G3a Moderate (45–59 mL/min)' };
        if (num >= 30) return { color: 'bg-orange-400', ring: 'border-orange-500/40', text: 'Stage G3b Severe (30–44 mL/min)' };
        return { color: 'bg-rose-500', ring: 'border-rose-500/40', text: 'Stage G4-5 Failure (<30 mL/min)' };

      case 'uacr':
        if (num < 30) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'A1 Normal (<30 mg/g)' };
        if (num <= 300) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'A2 Microalbuminuria (30–300 mg/g)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'A3 Macroalbuminuria (>300 mg/g)' };

      case 'sbp':
        if (num < 120) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Optimal (<120 mmHg)' };
        if (num < 130) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Elevated (120–129 mmHg)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'Hypertension (≥130 mmHg)' };

      case 'dbp':
        if (num < 80) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Normal (<80 mmHg)' };
        return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Stage 1-2 HTN (≥80 mmHg)' };

      case 'ldl':
        if (num < 100) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Optimal (<100 mg/dL)' };
        if (num < 160) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Borderline (100–159 mg/dL)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'High Risk (≥160 mg/dL)' };

      case 'hdl':
        if (num >= 50) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Protective (≥50 mg/dL)' };
        if (num >= 40) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Borderline (40–49 mg/dL)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'Low / Risk (<40 mg/dL)' };

      case 'tg':
        if (num < 150) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Normal (<150 mg/dL)' };
        if (num < 200) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Borderline (150–199 mg/dL)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'High Risk (≥200 mg/dL)' };

      case 'bmi':
        if (num >= 18.5 && num < 25.0) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Normal (18.5–24.9)' };
        if (num < 30.0) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Overweight (25–29.9)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'Obese (≥30.0)' };

      case 'crp':
        if (num < 1.0) return { color: 'bg-emerald-400', ring: 'border-emerald-500/40', text: 'Low Vascular Risk (<1.0 mg/L)' };
        if (num <= 3.0) return { color: 'bg-amber-400', ring: 'border-amber-500/40', text: 'Moderate Risk (1.0–3.0 mg/L)' };
        return { color: 'bg-rose-400', ring: 'border-rose-500/40', text: 'High Systemic Inflammation (>3.0 mg/L)' };

      default:
        return null;
    }
  };

  const status = getStatus(value, statusType);

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium text-slate-300 flex items-center space-x-1.5">
          <span>{label}</span>
          {status && (
            <span
              className={`inline-block w-2 h-2 rounded-full ${status.color} shadow-sm`}
              title={status.text}
            />
          )}
        </label>
        {referenceRange && (
          <span className="text-[10px] text-slate-500 font-mono tracking-tight">
            {referenceRange}
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type={type}
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          onChange={onChange}
          className={`w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-3 py-2 ${unit ? 'pr-14' : 'pr-3'} text-slate-100 font-mono tabular-nums text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-all placeholder:text-slate-600 hover:border-slate-600 shadow-inner`}
        />
        {unit && (
          <span className="absolute right-2.5 text-[10px] font-semibold text-slate-400 pointer-events-none select-none uppercase tracking-wider">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
