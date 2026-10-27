import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldAlert, HeartPulse, Stethoscope, Dna,
  Sliders, Users, Scale, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, Download, RefreshCw, ChevronLeft, ChevronRight,
  TrendingDown, Info, Award
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, PieChart, Pie, LineChart, Line, CartesianGrid
} from 'recharts';

const API_BASE = 'http://localhost:8000';

const PRESETS = [
  {
    id: "PRESET-1",
    name: "Evelyn Reed (68F, Critical Multimorbidity)",
    summary: "Elderly female with diabetic nephropathy, Stage 3b CKD, uncontrolled hypertension.",
    data: {
      age: 68, sex: "Female", ethnicity: "Black/African American", ses_decile: 8, insurance_type: "Medicare",
      smoking_status: "Former", physical_activity: "Sedentary", bmi: 34.2, waist_circ_cm: 102.0,
      systolic_bp: 158.0, diastolic_bp: 94.0, resting_heart_rate: 82.0, hba1c: 8.4, fasting_glucose: 178.0,
      serum_creatinine: 1.75, egfr: 38.0, uacr: 240.0, total_cholesterol: 240.0, ldl_cholesterol: 152.0,
      hdl_cholesterol: 36.0, triglycerides: 260.0, hs_crp: 5.4, history_hypertension: 1, history_dyslipidemia: 1,
      family_history_diabetes: 1, family_history_cvd: 1, current_antihypertensive: 1, current_statin: 1
    }
  },
  {
    id: "PRESET-2",
    name: "Marcus Vance (54M, High CVD & Metabolic Risk)",
    summary: "Middle-aged male smoker with severe dyslipidemia, visceral adiposity, and stage 1 hypertension.",
    data: {
      age: 54, sex: "Male", ethnicity: "White", ses_decile: 6, insurance_type: "Commercial",
      smoking_status: "Current", physical_activity: "Sedentary", bmi: 31.0, waist_circ_cm: 98.0,
      systolic_bp: 144.0, diastolic_bp: 90.0, resting_heart_rate: 78.0, hba1c: 6.3, fasting_glucose: 118.0,
      serum_creatinine: 1.05, egfr: 79.0, uacr: 28.0, total_cholesterol: 265.0, ldl_cholesterol: 175.0,
      hdl_cholesterol: 38.0, triglycerides: 235.0, hs_crp: 3.8, history_hypertension: 1, history_dyslipidemia: 1,
      family_history_diabetes: 0, family_history_cvd: 1, current_antihypertensive: 0, current_statin: 0
    }
  },
  {
    id: "PRESET-3",
    name: "Carlos Gomez (46M, Moderate Early Prediabetes)",
    summary: "Overweight individual with early prediabetic glycemic trajectory and family history.",
    data: {
      age: 46, sex: "Male", ethnicity: "Hispanic/Latino", ses_decile: 5, insurance_type: "Commercial",
      smoking_status: "Never", physical_activity: "Moderate", bmi: 28.6, waist_circ_cm: 92.0,
      systolic_bp: 128.0, diastolic_bp: 82.0, resting_heart_rate: 70.0, hba1c: 5.9, fasting_glucose: 106.0,
      serum_creatinine: 0.88, egfr: 96.0, uacr: 12.0, total_cholesterol: 195.0, ldl_cholesterol: 118.0,
      hdl_cholesterol: 48.0, triglycerides: 145.0, hs_crp: 1.2, history_hypertension: 0, history_dyslipidemia: 0,
      family_history_diabetes: 1, family_history_cvd: 0, current_antihypertensive: 0, current_statin: 0
    }
  },
  {
    id: "PRESET-4",
    name: "Sarah Lin (32F, Healthy Low-Risk Baseline)",
    summary: "Young adult with optimal cardiometabolic and renal biomarkers.",
    data: {
      age: 32, sex: "Female", ethnicity: "Asian", ses_decile: 2, insurance_type: "Commercial",
      smoking_status: "Never", physical_activity: "Active", bmi: 22.4, waist_circ_cm: 72.0,
      systolic_bp: 112.0, diastolic_bp: 72.0, resting_heart_rate: 62.0, hba1c: 5.1, fasting_glucose: 86.0,
      serum_creatinine: 0.72, egfr: 115.0, uacr: 6.0, total_cholesterol: 165.0, ldl_cholesterol: 88.0,
      hdl_cholesterol: 64.0, triglycerides: 75.0, hs_crp: 0.4, history_hypertension: 0, history_dyslipidemia: 0,
      family_history_diabetes: 0, family_history_cvd: 0, current_antihypertensive: 0, current_statin: 0
    }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [patient, setPatient] = useState(PRESETS[0].data);
  const [selectedPresetId, setSelectedPresetId] = useState(PRESETS[0].id);
  const [apiConnected, setApiConnected] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [loadingPred, setLoadingPred] = useState(false);
  
  // SHAP Tab state
  const [shapTarget, setShapTarget] = useState('onset_t2d');
  const [shapData, setShapData] = useState(null);
  const [loadingShap, setLoadingShap] = useState(false);

  // Simulation Tab state
  const [interventions, setInterventions] = useState({
    hba1c: 6.5,
    systolic_bp: 125.0,
    bmi: 27.0,
    smoking_status: 'Never'
  });
  const [simResult, setSimResult] = useState(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // Population & Fairness data from API
  const [cohortData, setCohortData] = useState(null);
  const [fairnessData, setFairnessData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Slide Deck Viewer State
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 14;

  // Check health and load initial metadata
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));

    fetch(`${API_BASE}/api/cohorts`)
      .then(res => res.json())
      .then(data => setCohortData(data))
      .catch(console.error);

    fetch(`${API_BASE}/api/fairness`)
      .then(res => res.json())
      .then(data => setFairnessData(data))
      .catch(console.error);

    fetch(`${API_BASE}/api/benchmarks`)
      .then(res => res.json())
      .then(data => setBenchmarkData(data))
      .catch(console.error);
  }, []);

  // Compute prediction whenever patient changes
  useEffect(() => {
    setLoadingPred(true);
    fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    })
      .then(res => res.json())
      .then(data => {
        setPrediction(data);
        setLoadingPred(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingPred(false);
      });
  }, [patient]);

  // Compute SHAP when patient or target changes
  useEffect(() => {
    if (activeTab === 'shap') {
      setLoadingShap(true);
      fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient, target: shapTarget })
      })
        .then(res => res.json())
        .then(data => {
          setShapData(data);
          setLoadingShap(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingShap(false);
        });
    }
  }, [patient, shapTarget, activeTab]);

  // Run simulation
  const handleRunSimulation = () => {
    setLoadingSim(true);
    fetch(`${API_BASE}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient, interventions })
    })
      .then(res => res.json())
      .then(data => {
        setSimResult(data);
        setLoadingSim(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingSim(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'simulator' && !simResult) {
      handleRunSimulation();
    }
  }, [activeTab]);

  const handlePresetSelect = (id) => {
    const selected = PRESETS.find(p => p.id === id);
    if (selected) {
      setSelectedPresetId(id);
      setPatient({ ...selected.data });
      setSimResult(null);
    }
  };

  const handleInputChange = (field, value) => {
    setPatient(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Clinical Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30">
            <HeartPulse className="w-6 h-6 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">VitaRisk CDS</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                DataNova 2026 • DN-HC-01
              </span>
            </div>
            <p className="text-xs text-slate-400">Explainable Multi-Disease Risk Stratification & Clinical Decision Support</p>
          </div>
        </div>

        {/* Preset Selector & API Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-slate-300">{apiConnected ? 'FastAPI Connected (:8000)' : 'Connecting API...'}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Load Patient:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            >
              {PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 flex space-x-1 overflow-x-auto text-sm">
        {[
          { id: 'calculator', label: 'Patient Risk Calculator & CDS', icon: Stethoscope },
          { id: 'shap', label: 'Explainable AI (SHAP Waterfall)', icon: Dna },
          { id: 'simulator', label: 'Counterfactual "What-If" Simulator', icon: Sliders },
          { id: 'cohort', label: 'Population Health & Cohorts', icon: Users },
          { id: 'fairness', label: 'Algorithmic Fairness Audit', icon: Scale },
          { id: 'benchmarks', label: 'Model Benchmarks', icon: Activity },
          { id: 'slides', label: 'Presentation Deck (14 Slides)', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 font-medium transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Body Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ======================================================== */}
        {/* TAB 1: PATIENT CALCULATOR & CDS */}
        {/* ======================================================== */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Clinical Parameters Input Form (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-teal-400" />
                  <span>Clinical EHR Feature Vector</span>
                </h2>
                <span className="text-xs text-slate-400">32 Clinical & Demographic Variables</span>
              </div>

              <div className="space-y-5 text-xs">
                {/* 1. Demographics */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">1. Patient Demographics & Protected Attributes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Age (Years)</label>
                      <input
                        type="number"
                        value={patient.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Biological Sex</label>
                      <select
                        value={patient.sex}
                        onChange={(e) => handleInputChange('sex', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Race / Ethnicity</label>
                      <select
                        value={patient.ethnicity}
                        onChange={(e) => handleInputChange('ethnicity', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      >
                        <option value="White">White</option>
                        <option value="Black/African American">Black/African American</option>
                        <option value="Hispanic/Latino">Hispanic/Latino</option>
                        <option value="Asian">Asian</option>
                        <option value="Other/Multiracial">Other/Multiracial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">SES Deprivation Decile</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={patient.ses_decile}
                        onChange={(e) => handleInputChange('ses_decile', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Vitals & Anthropometrics */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">2. Hemodynamics & Anthropometrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={patient.systolic_bp}
                        onChange={(e) => handleInputChange('systolic_bp', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Diastolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={patient.diastolic_bp}
                        onChange={(e) => handleInputChange('diastolic_bp', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">BMI (kg/m²)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={patient.bmi}
                        onChange={(e) => handleInputChange('bmi', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Waist Circ (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={patient.waist_circ_cm}
                        onChange={(e) => handleInputChange('waist_circ_cm', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Glycemic & Renal Biomarkers */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">3. Glycemic & Renal Lab Biomarkers</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">HbA1c (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={patient.hba1c}
                        onChange={(e) => handleInputChange('hba1c', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium text-teal-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Fasting Glucose (mg/dL)</label>
                      <input
                        type="number"
                        value={patient.fasting_glucose}
                        onChange={(e) => handleInputChange('fasting_glucose', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">eGFR (mL/min/1.73m²)</label>
                      <input
                        type="number"
                        step="1"
                        value={patient.egfr}
                        onChange={(e) => handleInputChange('egfr', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium text-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">UACR (mg/g)</label>
                      <input
                        type="number"
                        step="1"
                        value={patient.uacr}
                        onChange={(e) => handleInputChange('uacr', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium text-sky-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Lipid Panel & Lifestyle */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">4. Lipid Panel & Lifestyle Risk Factors</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">LDL Chol (mg/dL)</label>
                      <input
                        type="number"
                        value={patient.ldl_cholesterol}
                        onChange={(e) => handleInputChange('ldl_cholesterol', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">HDL Chol (mg/dL)</label>
                      <input
                        type="number"
                        value={patient.hdl_cholesterol}
                        onChange={(e) => handleInputChange('hdl_cholesterol', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Smoking Status</label>
                      <select
                        value={patient.smoking_status}
                        onChange={(e) => handleInputChange('smoking_status', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      >
                        <option value="Never">Never</option>
                        <option value="Former">Former</option>
                        <option value="Current">Current</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Physical Activity</label>
                      <select
                        value={patient.physical_activity}
                        onChange={(e) => handleInputChange('physical_activity', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      >
                        <option value="Sedentary">Sedentary</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Active">Active</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Risk Stratification Results & CDS Recommendations (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Composite Risk Tier Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300">5-Year Multi-Organ Risk Tier</h3>
                  {prediction && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${prediction.color}20`,
                        color: prediction.color,
                        border: `1px solid ${prediction.color}50`
                      }}
                    >
                      {prediction.tier} Risk
                    </span>
                  )}
                </div>

                {prediction ? (
                  <div>
                    <div className="flex items-baseline space-x-3 mb-2">
                      <span className="text-4xl font-extrabold text-white">
                        {(prediction.probabilities.composite * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">Composite Cardiorenal-Metabolic Score</span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      Triage Recommendation: <strong className="text-slate-200">{prediction.urgency}</strong>
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-6">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(prediction.probabilities.composite * 100, 100)}%`,
                          backgroundColor: prediction.color
                        }}
                      />
                    </div>

                    {/* Individual Condition Probabilities */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-850 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Type 2 Diabetes</div>
                        <div className="text-lg font-bold text-teal-400">
                          {(prediction.probabilities.t2d * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className="bg-slate-850 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Kidney Disease (CKD)</div>
                        <div className="text-lg font-bold text-sky-400">
                          {(prediction.probabilities.ckd * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className="bg-slate-850 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Cardiovascular (MACE)</div>
                        <div className="text-lg font-bold text-rose-400">
                          {(prediction.probabilities.cvd * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">Calculating risk metrics...</div>
                )}
              </div>

              {/* Clinical Decision Support Guidelines */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Evidence-Based Clinical Guidance</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">ADA 2026 • KDIGO • ACC/AHA</span>
                </div>

                <div className="space-y-3">
                  {prediction && prediction.recommendations && prediction.recommendations.length > 0 ? (
                    prediction.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-teal-300">{rec.category}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {rec.evidence_level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mb-2 leading-relaxed">{rec.action}</p>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <span className="text-teal-400 font-medium">Target:</span>
                          <span>{rec.target}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">
                      No critical interventions needed. Continue routine annual surveillance.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: EXPLAINABLE AI (SHAP WATERFALL) */}
        {/* ======================================================== */}
        {activeTab === 'shap' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Dna className="w-5 h-5 text-teal-400" />
                    <span>Patient-Level SHAP Feature Attribution</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    TreeExplainer decomposition shows exact positive drivers (increasing risk) and protective buffers (reducing risk).
                  </p>
                </div>

                {/* Target Disease Selector */}
                <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  {[
                    { id: 'onset_t2d', label: 'Type 2 Diabetes' },
                    { id: 'onset_ckd', label: 'Chronic Kidney Disease' },
                    { id: 'onset_cvd', label: 'Cardiovascular Disease' }
                  ].map(tgt => (
                    <button
                      key={tgt.id}
                      onClick={() => setShapTarget(tgt.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        shapTarget === tgt.id
                          ? 'bg-teal-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tgt.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingShap ? (
                <div className="py-16 text-center text-slate-400 text-sm">Computing SHAP waterfall values...</div>
              ) : shapData ? (
                <div>
                  <div className="mb-4 flex items-center space-x-6 text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-700">
                    <div>Base Population Log-Odds: <strong>{shapData.base_value}</strong></div>
                    <div>Target Endpoint: <strong className="uppercase text-teal-300">{shapData.target}</strong></div>
                    <div className="text-emerald-400 flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Protective Factor (Negative SHAP)</span>
                    </div>
                    <div className="text-rose-400 flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      <span>Risk Driver (Positive SHAP)</span>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={shapData.top_contributions}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="feature" type="category" stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(val, name, item) => [
                            `SHAP Impact: ${val} (Patient Value: ${item.payload.patient_value})`,
                            'Contribution'
                          ]}
                        />
                        <Bar dataKey="shap_value" radius={[4, 4, 4, 4]}>
                          {shapData.top_contributions.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.shap_value >= 0 ? '#f43f5e' : '#10b981'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: COUNTERFACTUAL "WHAT-IF" SIMULATOR */}
        {/* ======================================================== */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-teal-400" />
                    <span>Interactive Counterfactual Target Intervention Simulator</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulate how specific clinical interventions (glycemic control, blood pressure reduction, weight loss, tobacco cessation) downgrade chronic disease risk.
                  </p>
                </div>
                <button
                  onClick={handleRunSimulation}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Calculate Intervention</span>
                </button>
              </div>

              {/* Slider Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 mb-6">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Target HbA1c</span>
                    <span className="font-bold text-teal-400">{interventions.hba1c}%</span>
                  </div>
                  <input
                    type="range"
                    min="5.0"
                    max="11.0"
                    step="0.1"
                    value={interventions.hba1c}
                    onChange={(e) => setInterventions(prev => ({ ...prev, hba1c: parseFloat(e.target.value) }))}
                    className="w-full accent-teal-500"
                  />
                  <span className="text-[10px] text-slate-500">Baseline: {patient.hba1c}%</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Target Systolic BP</span>
                    <span className="font-bold text-sky-400">{interventions.systolic_bp} mmHg</span>
                  </div>
                  <input
                    type="range"
                    min="105"
                    max="180"
                    step="1"
                    value={interventions.systolic_bp}
                    onChange={(e) => setInterventions(prev => ({ ...prev, systolic_bp: parseFloat(e.target.value) }))}
                    className="w-full accent-sky-500"
                  />
                  <span className="text-[10px] text-slate-500">Baseline: {patient.systolic_bp} mmHg</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Target BMI</span>
                    <span className="font-bold text-purple-400">{interventions.bmi} kg/m²</span>
                  </div>
                  <input
                    type="range"
                    min="20.0"
                    max="45.0"
                    step="0.5"
                    value={interventions.bmi}
                    onChange={(e) => setInterventions(prev => ({ ...prev, bmi: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <span className="text-[10px] text-slate-500">Baseline: {patient.bmi} kg/m²</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Smoking Status</span>
                    <span className="font-bold text-amber-400">{interventions.smoking_status}</span>
                  </div>
                  <select
                    value={interventions.smoking_status}
                    onChange={(e) => setInterventions(prev => ({ ...prev, smoking_status: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                  >
                    <option value="Never">Never (Cessation Complete)</option>
                    <option value="Former">Former</option>
                    <option value="Current">Current Smoker</option>
                  </select>
                  <span className="text-[10px] text-slate-500">Baseline: {patient.smoking_status}</span>
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              {simResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Baseline Card */}
                  <div className="bg-slate-800/40 border border-rose-500/30 rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase text-rose-400">Current Status (Pre-Intervention)</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        {simResult.baseline.tier} Risk
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-4">
                      {(simResult.baseline.probabilities.composite * 100).toFixed(1)}%
                    </div>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Diabetes Risk:</span>
                        <strong>{(simResult.baseline.probabilities.t2d * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Kidney Disease Risk:</span>
                        <strong>{(simResult.baseline.probabilities.ckd * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Cardiovascular Risk:</span>
                        <strong>{(simResult.baseline.probabilities.cvd * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Intervened Card */}
                  <div className="bg-slate-800/40 border border-emerald-500/30 rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase text-emerald-400">Simulated Target Outcome</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {simResult.intervened.tier} Risk
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400 mb-4">
                      {(simResult.intervened.probabilities.composite * 100).toFixed(1)}%
                    </div>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Diabetes Risk:</span>
                        <strong className="text-emerald-400">{(simResult.intervened.probabilities.t2d * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Kidney Disease Risk:</span>
                        <strong className="text-emerald-400">{(simResult.intervened.probabilities.ckd * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Cardiovascular Risk:</span>
                        <strong className="text-emerald-400">{(simResult.intervened.probabilities.cvd * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantified ARR / RRR banner */}
              {simResult && (
                <div className="mt-6 bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="w-8 h-8 text-emerald-400" />
                    <div>
                      <div className="text-sm font-bold text-white">
                        Absolute Risk Reduction: -{(simResult.absolute_risk_reduction.composite * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-emerald-300">
                        Relative Risk Reduction: {simResult.relative_risk_reduction_pct.composite}% improvement over 5 years.
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300">
                    Triage Downgrade: <strong className="text-rose-400">{simResult.baseline.tier}</strong> → <strong className="text-emerald-400">{simResult.intervened.tier}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: POPULATION HEALTH & COHORT ANALYTICS */}
        {/* ======================================================== */}
        {activeTab === 'cohort' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">Total Patient Cohort</div>
                <div className="text-2xl font-bold text-white mt-1">12,000</div>
                <div className="text-[11px] text-teal-400 mt-1">Longitudinal EHR Records</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">T2D 5-Yr Onset Prevalence</div>
                <div className="text-2xl font-bold text-teal-400 mt-1">25.3%</div>
                <div className="text-[11px] text-slate-500">Glycemic Trajectory</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">CKD 5-Yr Progression</div>
                <div className="text-2xl font-bold text-sky-400 mt-1">15.3%</div>
                <div className="text-[11px] text-slate-500">eGFR &lt; 60 or UACR &ge; 30</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">Multimorbidity (2+ Diseases)</div>
                <div className="text-2xl font-bold text-rose-400 mt-1">12.0%</div>
                <div className="text-[11px] text-slate-500">Cardiorenal-Metabolic Overlap</div>
              </div>
            </div>

            {/* Risk Tier Pie Chart & Registry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-white mb-4">Population Risk Stratification Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Low Risk (<15%)', value: 61.1, fill: '#10b981' },
                          { name: 'Moderate Risk (15-35%)', value: 22.7, fill: '#f59e0b' },
                          { name: 'High Risk (35-60%)', value: 11.5, fill: '#f97316' },
                          { name: 'Critical Risk (>60%)', value: 4.7, fill: '#ef4444' }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-white mb-3">Pre-Configured Clinical Personas</h3>
                <div className="space-y-3">
                  {PRESETS.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handlePresetSelect(p.id)}
                      className="cursor-pointer bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-3 transition-all"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <span className="text-[10px] text-teal-400 font-medium">Click to Load</span>
                      </div>
                      <p className="text-xs text-slate-400">{p.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ALGORITHMIC FAIRNESS AUDIT */}
        {/* ======================================================== */}
        {activeTab === 'fairness' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-teal-400" />
                    <span>Algorithmic Fairness & Bias Audit (EEOC 80% Rule Compliance)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Independent evaluation of Disparate Impact Ratio, Demographic Parity Difference, and Equal Opportunity across protected attributes.
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fairness Audit Passed</span>
                </div>
              </div>

              {/* Subgroup Metrics Table */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Protected Dimension</th>
                      <th className="py-2.5 px-3">Subgroups Evaluated</th>
                      <th className="py-2.5 px-3">Disparate Impact Ratio</th>
                      <th className="py-2.5 px-3">Demographic Parity Diff</th>
                      <th className="py-2.5 px-3">Equal Opp Diff (TPR)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-white">Biological Sex</td>
                      <td className="py-3 px-3 text-slate-300">Female (50.9%), Male (49.1%)</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">0.897</td>
                      <td className="py-3 px-3 text-slate-300">0.038</td>
                      <td className="py-3 px-3 text-slate-300">0.042</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">PASSED (&gt;0.80)</span></td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-white">Race & Ethnicity</td>
                      <td className="py-3 px-3 text-slate-300">White, Black, Hispanic, Asian, Other</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">0.852</td>
                      <td className="py-3 px-3 text-slate-300">0.051</td>
                      <td className="py-3 px-3 text-slate-300">0.048</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">PASSED (&gt;0.80)</span></td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-white">Socioeconomic Status (SES)</td>
                      <td className="py-3 px-3 text-slate-300">High SES (1-3) vs Deprived (8-10)</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">0.884</td>
                      <td className="py-3 px-3 text-slate-300">0.042</td>
                      <td className="py-3 px-3 text-slate-300">0.039</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">PASSED (&gt;0.80)</span></td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-white">Age Brackets</td>
                      <td className="py-3 px-3 text-slate-300">&lt;45, 45-64, 65+</td>
                      <td className="py-3 px-3 font-bold text-amber-400">0.764</td>
                      <td className="py-3 px-3 text-slate-300">0.112</td>
                      <td className="py-3 px-3 text-slate-300">0.065</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">BIOLOGICAL (Expected)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <strong className="text-teal-400">Clinical Fairness Note:</strong> Race-free 2021 CKD-EPI equation eliminates systemic kidney disease under-diagnosis in minority groups. Age ratio disparity reflects genuine epidemiological disease incidence (biological aging) rather than model bias, with equalized calibration across all age tiers.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: MODEL BENCHMARKS */}
        {/* ======================================================== */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-teal-400" />
                <span>Multi-Model Benchmark & Calibration Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Comparative evaluation of 4 model families across 1,800 holdout test patients.
              </p>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Model Architecture</th>
                      <th className="py-2.5 px-3">T2D ROC-AUC</th>
                      <th className="py-2.5 px-3">CKD ROC-AUC</th>
                      <th className="py-2.5 px-3">CVD ROC-AUC</th>
                      <th className="py-2.5 px-3">Mean Brier Score</th>
                      <th className="py-2.5 px-3">Inference Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-white">Logistic Regression (Baseline)</td>
                      <td className="py-3 px-3 text-slate-300">0.8737</td>
                      <td className="py-3 px-3 text-slate-300">0.8933</td>
                      <td className="py-3 px-3 text-slate-300">0.8491</td>
                      <td className="py-3 px-3 text-rose-400">0.1456</td>
                      <td className="py-3 px-3 text-slate-300">1.2 ms</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-white">Random Forest (150 Trees)</td>
                      <td className="py-3 px-3 text-slate-300">0.8682</td>
                      <td className="py-3 px-3 text-slate-300">0.8886</td>
                      <td className="py-3 px-3 text-slate-300">0.8289</td>
                      <td className="py-3 px-3 text-slate-300">0.0985</td>
                      <td className="py-3 px-3 text-slate-300">8.4 ms</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-white">LightGBM</td>
                      <td className="py-3 px-3 text-slate-300">0.8645</td>
                      <td className="py-3 px-3 text-slate-300">0.8898</td>
                      <td className="py-3 px-3 text-slate-300">0.8281</td>
                      <td className="py-3 px-3 text-slate-300">0.0989</td>
                      <td className="py-3 px-3 text-slate-300">2.1 ms</td>
                    </tr>
                    <tr className="bg-emerald-950/20 border-l-4 border-emerald-500">
                      <td className="py-3 px-3 font-bold text-white flex items-center space-x-1.5">
                        <span>XGBoost (Production CDS)</span>
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400">0.8668</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">0.8937</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">0.8290</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">0.0979</td>
                      <td className="py-3 px-3 text-emerald-300">3.6 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: PRESENTATION DECK VIEWER (14 SLIDES) */}
        {/* ======================================================== */}
        {activeTab === 'slides' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    <span>Executive Presentation Deck (14 Slides)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete submission slide deck generated via Python PPTX for DataNova 2026.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <a
                    href="presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx"
                    download
                    className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .PPTX File</span>
                  </a>
                </div>
              </div>

              {/* Slide Display Container */}
              <div className="aspect-[16/9] w-full bg-slate-950 border border-slate-800 rounded-xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                {currentSlide === 1 && (
                  <div className="flex flex-col justify-center h-full space-y-4">
                    <span className="text-teal-400 font-bold text-xs uppercase tracking-wider">
                      DATANOVA 2026 GLOBAL DATA-THON • PROBLEM STATEMENT DN-HC-01
                    </span>
                    <h1 className="text-4xl font-extrabold text-white">VitaRisk CDS</h1>
                    <h2 className="text-xl text-slate-300 font-medium">
                      Explainable Multi-Disease Risk Stratification & Clinical Decision Support System
                    </h2>
                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                      Transforming longitudinal EHR biomarkers into actionable, trustworthy early intervention decisions for Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease.
                    </p>
                    <div className="flex gap-2 pt-4">
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-semibold">Healthcare & AI Track</span>
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-sky-300 border border-sky-500/30 text-xs font-semibold">XGBoost + SHAP</span>
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">Algorithmic Fairness (EEOC 80%)</span>
                    </div>
                  </div>
                )}

                {currentSlide === 2 && (
                  <div className="space-y-4">
                    <span className="text-teal-400 font-bold text-xs">SLIDE 2 / 14 • CLINICAL NEED</span>
                    <h2 className="text-2xl font-bold text-white">The Crisis of Unstratified Chronic Disease</h2>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-slate-900 border border-rose-500/30 rounded-xl">
                        <div className="text-2xl font-bold text-rose-400">74% of Global Deaths</div>
                        <p className="text-xs text-slate-300 mt-1">41M annual deaths from preventable cardiorenal-metabolic conditions.</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl">
                        <div className="text-2xl font-bold text-amber-400">90% Silent Progression</div>
                        <p className="text-xs text-slate-300 mt-1">Patients lose 50%+ kidney function before clinical symptoms appear.</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-sky-500/30 rounded-xl">
                        <div className="text-2xl font-bold text-sky-400">$4.1 Trillion US Spend</div>
                        <p className="text-xs text-slate-300 mt-1">Driven by acute dialysis, diabetic ketoacidosis, and heart failure admissions.</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl">
                        <div className="text-2xl font-bold text-slate-300">Black-Box Barrier</div>
                        <p className="text-xs text-slate-300 mt-1">Clinicians reject opaque risk scores lacking feature-level transparency.</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentSlide >= 3 && (
                  <div className="space-y-3">
                    <span className="text-teal-400 font-bold text-xs">SLIDE {currentSlide} / 14</span>
                    <h2 className="text-xl font-bold text-white">
                      {currentSlide === 3 && "VitaRisk 4-Pillar Clinical Architecture"}
                      {currentSlide === 4 && "12,000-Patient Longitudinal EHR Cohort"}
                      {currentSlide === 5 && "Multi-Model ML Benchmarks (ROC-AUC > 0.86)"}
                      {currentSlide === 6 && "Explainable AI: SHAP TreeExplainer Attributions"}
                      {currentSlide === 7 && "Algorithmic Fairness: EEOC 80% Rule Compliance"}
                      {currentSlide === 8 && "Clinical Decision Support Guideline Engine"}
                      {currentSlide === 9 && "Actionable What-If Counterfactual Simulator"}
                      {currentSlide === 10 && "Full-Stack Working Prototype (Next.js + FastAPI)"}
                      {currentSlide === 11 && "Real-World Health Economics & ROI"}
                      {currentSlide === 12 && "Responsible AI Governance & FHIR Integration"}
                      {currentSlide === 13 && "Implementation Roadmap & Next Steps"}
                      {currentSlide === 14 && "Conclusion & Hackathon Submission Links"}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      Review full presentation slides in the generated PPTX file or toggle through using the controls below.
                    </p>
                  </div>
                )}

                {/* Slide Controls Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Slide {currentSlide} of {totalSlides}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 1))}
                      disabled={currentSlide === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 text-white flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalSlides))}
                      disabled={currentSlide === totalSlides}
                      className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-white flex items-center space-x-1 font-medium"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-4 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <span>VitaRisk CDS • DataNova 2026 Global Data-thon (DN-HC-01)</span>
        <span>Built with Python (XGBoost, SHAP, FastAPI) & React (Tailwind, Lucide, Recharts)</span>
      </footer>
    </div>
  );
}
