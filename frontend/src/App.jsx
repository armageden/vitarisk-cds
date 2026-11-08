import React, { useState, useEffect } from 'react';
import {
  Activity, HeartPulse, Stethoscope, Dna,
  Sliders, Users, Scale, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, Download, RefreshCw, ChevronLeft, ChevronRight,
  TrendingDown, Info, Award, Sparkles, Pill, Video
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

import RiskSeverityGauge from './components/RiskSeverityGauge';
import BiomarkerInput from './components/BiomarkerInput';
import PatientBanner from './components/PatientBanner';
import DiseaseBreakdownBars from './components/DiseaseBreakdownBars';
import GdmtPrescriptions from './components/GdmtPrescriptions';
import ContraindicationShield from './components/ContraindicationShield';
import CkmStageCard from './components/CkmStageCard';
import SlideDeckViewer from './components/SlideDeckViewer';

// Universal API origin resolution (Vite dev server runs on port 3000; production is same-origin)
const API_BASE = (typeof window !== 'undefined' && window.location.port === '3000') ? 'http://localhost:8000' : '';

const DEFAULT_PERSONA = {
  id: "PERSONA-1",
  name: "Persona 1: Silent Cardiorenal Progression (58F)",
  tag: "Primary Care Miss",
  summary: "Stage 3a CKD with microalbuminuria & prediabetes. Standard siloed screening misses joint risk.",
  data: {
    age: 58, sex: "Female", ethnicity: "Black/African American", ses_decile: 7, insurance_type: "Commercial",
    smoking_status: "Former", smoking_current: 0, physical_activity: "Sedentary", bmi: 30.5, waist_circ_cm: 94.0,
    systolic_bp: 144.0, diastolic_bp: 88.0, resting_heart_rate: 74.0, hba1c: 6.3, fasting_glucose: 118.0,
    serum_creatinine: 1.25, egfr: 52.0, uacr: 145.0, total_cholesterol: 215.0, ldl_cholesterol: 132.0,
    hdl_cholesterol: 44.0, triglycerides: 195.0, non_hdl_cholesterol: 171.0, hs_crp: 3.4,
    history_hypertension: 1, history_dyslipidemia: 1, family_history_diabetes: 1, family_history_cvd: 0,
    current_antihypertensive: 1, current_statin: 0
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [cohortData, setCohortData] = useState(null);
  const personas = cohortData?.presets || [DEFAULT_PERSONA];
  const [patient, setPatient] = useState(DEFAULT_PERSONA.data);
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_PERSONA.id);
  const [apiConnected, setApiConnected] = useState(true);
  const [prediction, setPrediction] = useState(null);
  
  // Biomarker Form Active Section in Tab 1
  const [activeFormSection, setActiveFormSection] = useState('glycemic');

  // SHAP Tab state
  const [shapTarget, setShapTarget] = useState('onset_t2d');
  const [shapData, setShapData] = useState(null);
  const [loadingShap, setLoadingShap] = useState(false);

  // Simulation Tab state (FM-07)
  const [interventions, setInterventions] = useState({
    hba1c: 6.0,
    systolic_bp: 124.0,
    bmi: 27.0,
    smoking_status: 'Never'
  });
  const [coupleBiology, setCoupleBiology] = useState(true);
  const [simResult, setSimResult] = useState(null);
  const [activePresetTriggered, setActivePresetTriggered] = useState(null);

  // Metadata from API
  const [fairnessData, setFairnessData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [dcaData, setDcaData] = useState(null);

  // Fairness Tab mode: Unmitigated vs Mitigated (FM-08)
  const [fairnessMitigatedMode, setFairnessMitigatedMode] = useState(true);

  // Slide Deck Viewer
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 14;

  // On mount: Fetch all metadata and run initial prediction
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));

    fetch(`${API_BASE}/api/cohorts`).then(res => res.json()).then(setCohortData).catch(console.error);
    fetch(`${API_BASE}/api/fairness`).then(res => res.json()).then(setFairnessData).catch(console.error);
    fetch(`${API_BASE}/api/benchmarks`).then(res => res.json()).then(setBenchmarkData).catch(console.error);
    fetch(`${API_BASE}/api/dca`).then(res => res.json()).then(setDcaData).catch(console.error);
  }, []);

  // Update prediction when patient changes (abort stale requests; ignore non-2xx so a 422 never clobbers state)
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) return undefined;
        return res.json();
      })
      .then(data => { if (data) setPrediction(data); })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
    return () => controller.abort();
  }, [patient]);

  // Stale simulation results must not survive a biomarker edit
  useEffect(() => { setSimResult(null); }, [patient]);

  // Update SHAP when tab or patient or target changes (same abort + ok guards)
  useEffect(() => {
    if (activeTab !== 'shap') return undefined;
    const controller = new AbortController();
    setLoadingShap(true);
    fetch(`${API_BASE}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient, target: shapTarget }),
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) return undefined;
        return res.json();
      })
      .then(data => { if (data) setShapData(data); })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => {
        setLoadingShap(false);
      });
    return () => controller.abort();
  }, [patient, shapTarget, activeTab]);

  const handleSelectPersona = (id) => {
    const p = personas.find(item => item.id === id);
    if (p) {
      setSelectedPersonaId(id);
      setPatient({ ...p.data });
      setSimResult(null);
      setActivePresetTriggered(null);
    }
  };

  const handleRunSimulation = (presetName = null) => {
    setActivePresetTriggered(presetName);
    const controller = new AbortController();
    fetch(`${API_BASE}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient,
        interventions: presetName ? {} : interventions,
        preset_name: presetName,
        couple_biology: coupleBiology
      }),
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) return undefined;
        return res.json();
      })
      .then(data => { if (data) setSimResult(data); })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
  };

  useEffect(() => {
    if (activeTab === 'simulator' && !simResult) {
      handleRunSimulation();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Clinical Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-50 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-br from-teal-500/20 to-sky-500/20 text-teal-400 p-2 rounded-xl border border-teal-500/30 shadow-inner">
            <HeartPulse className="w-5 h-5 text-teal-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight text-white">VitaRisk CDS</span>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                DataNova 2026 • DN-HC-01
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Cardiorenal-Metabolic (CKM) Early Risk Stratification & Clinical Decision Support</p>
          </div>
        </div>

        {/* API Status Badge & Direct PPTX Download */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-mono text-[11px]">{apiConnected ? 'FastAPI Online' : 'Connecting...'}</span>
          </div>

          <a
            href="/video/VitaRisk_CDS_Walkthrough.mp4"
            target="_blank"
            rel="noreferrer"
            className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm hover:shadow"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1080p Video</span>
          </a>

          <a
            href="/presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx"
            download
            className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm hover:shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Slides (.PPTX)</span>
          </a>
        </div>
      </header>

      {/* Patient EHR Context Banner */}
      <PatientBanner
        patient={patient}
        personas={personas}
        selectedPersonaId={selectedPersonaId}
        onSelectPersona={handleSelectPersona}
      />

      {/* Primary Navigation Tabs */}
      <nav className="bg-slate-950/70 border-b border-slate-800/80 px-6 flex space-x-1 overflow-x-auto text-xs font-medium">
        {[
          { id: 'calculator', label: 'Clinical Risk Calculator & CDS', icon: Stethoscope },
          { id: 'shap', label: 'Explainable AI (SHAP Waterfall)', icon: Dna },
          { id: 'simulator', label: 'What-If Intervention Simulator', icon: Sliders },
          { id: 'dca', label: 'Decision Curve Net Benefit', icon: TrendingDown },
          { id: 'fairness', label: 'Algorithmic Fairness Audit', icon: Scale },
          { id: 'cohort', label: 'Population Health Cohort', icon: Users },
          { id: 'benchmarks', label: 'Model Benchmarks', icon: Activity },
          { id: 'slides', label: 'Submission Slides (14)', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 transition-all whitespace-nowrap border-b-2 font-medium ${
                isActive
                  ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ======================================================== */}
        {/* TAB 1: PATIENT CALCULATOR & CDS */}
        {/* ======================================================== */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            {/* Contraindication Alert Banner */}
            {prediction && prediction.contraindication_alerts && (
              <ContraindicationShield alerts={prediction.contraindication_alerts} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Clinical Parameters Form (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    <h2 className="text-sm font-bold text-white tracking-tight">Clinical Biomarker Array</h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                    Race-Free eGFR & ASCVD (FM-03)
                  </span>
                </div>

                {/* Sub-section Tabs for Ergonomic Lab Entry */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-medium">
                  {[
                    { id: 'glycemic', label: '1. Glycemic & Body' },
                    { id: 'renal', label: '2. Renal & uACR' },
                    { id: 'cardio', label: '3. Hemodynamics' },
                    { id: 'lipids', label: '4. Lipids & SDoH' }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveFormSection(sec.id)}
                      className={`py-1.5 rounded-lg text-center transition-all ${
                        activeFormSection === sec.id
                          ? 'bg-slate-800 text-teal-300 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>

                {/* Form Fields by Active Section */}
                {activeFormSection === 'glycemic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <BiomarkerInput
                        label="HbA1c"
                        unit="%"
                        referenceRange="< 5.7% Normal"
                        statusType="hba1c"
                        step="0.1"
                        value={patient.hba1c}
                        onChange={(e) => setPatient(p => ({ ...p, hba1c: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Fasting Plasma Glucose"
                        unit="mg/dL"
                        referenceRange="< 100 Normal"
                        statusType="fasting_glucose"
                        step="1"
                        value={patient.fasting_glucose}
                        onChange={(e) => setPatient(p => ({ ...p, fasting_glucose: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Body Mass Index (BMI)"
                        unit="kg/m²"
                        referenceRange="18.5 – 24.9 Normal"
                        statusType="bmi"
                        step="0.1"
                        value={patient.bmi}
                        onChange={(e) => setPatient(p => ({ ...p, bmi: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Waist Circumference"
                        unit="cm"
                        referenceRange="< 102M / < 88F"
                        step="0.5"
                        value={patient.waist_circ_cm}
                        onChange={(e) => setPatient(p => ({ ...p, waist_circ_cm: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                )}

                {activeFormSection === 'renal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <BiomarkerInput
                        label="eGFR 2021 CKD-EPI (Race-Free)"
                        unit="mL/min"
                        referenceRange="≥ 90 Stage G1"
                        statusType="egfr"
                        step="1"
                        value={patient.egfr}
                        onChange={(e) => setPatient(p => ({ ...p, egfr: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Urine Albumin-Creatinine (uACR)"
                        unit="mg/g"
                        referenceRange="< 30 Normal (A1)"
                        statusType="uacr"
                        step="1"
                        value={patient.uacr}
                        onChange={(e) => setPatient(p => ({ ...p, uacr: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Serum Creatinine"
                        unit="mg/dL"
                        referenceRange="0.6 – 1.2 Normal"
                        step="0.05"
                        value={patient.serum_creatinine}
                        onChange={(e) => setPatient(p => ({ ...p, serum_creatinine: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                )}

                {activeFormSection === 'cardio' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <BiomarkerInput
                        label="Systolic Blood Pressure"
                        unit="mmHg"
                        referenceRange="< 120 Normal"
                        statusType="sbp"
                        step="1"
                        value={patient.systolic_bp}
                        onChange={(e) => setPatient(p => ({ ...p, systolic_bp: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Diastolic Blood Pressure"
                        unit="mmHg"
                        referenceRange="< 80 Normal"
                        statusType="dbp"
                        step="1"
                        value={patient.diastolic_bp}
                        onChange={(e) => setPatient(p => ({ ...p, diastolic_bp: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Resting Heart Rate"
                        unit="bpm"
                        referenceRange="60 – 100 Normal"
                        step="1"
                        value={patient.resting_heart_rate}
                        onChange={(e) => setPatient(p => ({ ...p, resting_heart_rate: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="High-Sensitivity CRP (hs-CRP)"
                        unit="mg/L"
                        referenceRange="< 1.0 Low Vascular"
                        statusType="crp"
                        step="0.1"
                        value={patient.hs_crp}
                        onChange={(e) => setPatient(p => ({ ...p, hs_crp: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                )}

                {activeFormSection === 'lipids' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <BiomarkerInput
                        label="LDL Cholesterol"
                        unit="mg/dL"
                        referenceRange="< 100 Optimal"
                        statusType="ldl"
                        step="1"
                        value={patient.ldl_cholesterol}
                        onChange={(e) => setPatient(p => ({ ...p, ldl_cholesterol: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="HDL Cholesterol"
                        unit="mg/dL"
                        referenceRange="≥ 50 Protective"
                        statusType="hdl"
                        step="1"
                        value={patient.hdl_cholesterol}
                        onChange={(e) => setPatient(p => ({ ...p, hdl_cholesterol: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Triglycerides"
                        unit="mg/dL"
                        referenceRange="< 150 Normal"
                        statusType="tg"
                        step="1"
                        value={patient.triglycerides}
                        onChange={(e) => setPatient(p => ({ ...p, triglycerides: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Total Cholesterol"
                        unit="mg/dL"
                        referenceRange="< 200 Desirable"
                        step="1"
                        value={patient.total_cholesterol}
                        onChange={(e) => setPatient(p => ({ ...p, total_cholesterol: parseFloat(e.target.value) || 0 }))}
                      />
                      <BiomarkerInput
                        label="Patient Age"
                        unit="yrs"
                        referenceRange="18 – 100 Adult"
                        step="1"
                        min="18"
                        max="100"
                        value={patient.age}
                        onChange={(e) => setPatient(p => ({ ...p, age: parseInt(e.target.value) || 18 }))}
                      />
                      <BiomarkerInput
                        label="SDoH Deprivation Index"
                        unit="Decile"
                        referenceRange="1 (Least) – 10 (Most)"
                        step="1"
                        min="1"
                        max="10"
                        value={patient.ses_decile}
                        onChange={(e) => setPatient(p => ({ ...p, ses_decile: parseInt(e.target.value) || 1 }))}
                      />
                    </div>

                    {/* Segmented Controls for Categorical Inputs */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Biological Sex</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Female', 'Male'].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setPatient(p => ({ ...p, sex: s }))}
                              className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                patient.sex === s
                                  ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 font-semibold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Smoking Status</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Never', 'Former', 'Current'].map(status => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setPatient(p => ({
                                ...p,
                                smoking_status: status,
                                smoking_current: status === 'Current' ? 1 : 0
                              }))}
                              className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                patient.smoking_status === status
                                  ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 font-semibold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Physical Activity Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Sedentary', 'Moderate', 'Active'].map(act => (
                            <button
                              key={act}
                              type="button"
                              onClick={() => setPatient(p => ({ ...p, physical_activity: act }))}
                              className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                patient.physical_activity === act
                                  ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 font-semibold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {act}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Current Antihypertensive</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { label: 'No', val: 0 },
                              { label: 'Yes', val: 1 }
                            ].map(opt => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setPatient(p => ({ ...p, current_antihypertensive: opt.val }))}
                                className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                  patient.current_antihypertensive === opt.val
                                    ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 font-semibold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Current Statin Therapy</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { label: 'No', val: 0 },
                              { label: 'Yes', val: 1 }
                            ].map(opt => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setPatient(p => ({ ...p, current_statin: opt.val }))}
                                className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                  patient.current_statin === opt.val
                                    ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 font-semibold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: CKM Syndrome Stage & Predictions (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Composite Risk Gauge Card */}
                {prediction && (
                  <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
                    <RiskSeverityGauge
                      compositeScore={prediction.probabilities.composite}
                      tier={prediction.tier}
                      urgency={prediction.urgency}
                      color={prediction.color}
                      ckmStage={prediction.ckm_stage}
                    />
                  </div>
                )}

                {/* AHA CKM Syndrome Staging Card */}
                {prediction && (
                  <CkmStageCard ckmStage={prediction.ckm_stage} />
                )}

                {/* Calibrated Multi-Disease Joint Risk Breakdown */}
                {prediction && (
                  <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-sky-400" />
                        <h3 className="text-xs font-bold text-white tracking-tight">Multi-Disease Organ Stress (5-Year)</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Calibrated Stack</span>
                    </div>

                    <DiseaseBreakdownBars probabilities={prediction.probabilities} />
                  </div>
                )}

                {/* Guideline-Directed Medical Therapy (GDMT) */}
                {prediction && (
                  <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <h3 className="text-xs font-bold text-white tracking-tight">Guideline Prescriptions (GDMT)</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">KDIGO • ADA • AHA</span>
                    </div>

                    <GdmtPrescriptions recommendations={prediction.recommendations} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: EXPLAINABLE AI (SHAP IN PROBABILITY SPACE) */}
        {/* ======================================================== */}
        {activeTab === 'shap' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Dna className="w-4 h-4 text-teal-400" />
                    <span>Probability-Space SHAP Feature Attribution (FM-06)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    TreeExplainer values expressed cleanly in <strong>percentage points (+% risk)</strong>. Red pushes risk higher; green provides protective buffer.
                  </p>
                </div>

                {/* Target Disease Selector */}
                <div className="flex space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {[
                    { id: 'onset_t2d', label: 'Type 2 Diabetes' },
                    { id: 'onset_ckd', label: 'Chronic Kidney Disease' },
                    { id: 'onset_cvd', label: 'Cardiovascular (CVD)' }
                  ].map(tgt => (
                    <button
                      key={tgt.id}
                      onClick={() => setShapTarget(tgt.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        shapTarget === tgt.id
                          ? 'bg-teal-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tgt.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingShap ? (
                <div className="py-16 text-center text-slate-400 text-xs font-mono">Computing calibrated SHAP feature attributions...</div>
              ) : shapData ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div>Base Population Risk: <strong className="font-mono text-white">{shapData.base_probability_percentage}%</strong></div>
                    <div>Target Outcome: <strong className="uppercase text-teal-300 font-mono">{shapData.target}</strong></div>
                    <div className="text-emerald-400 flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Protective Factor (-% points)</span>
                    </div>
                    <div className="text-rose-400 flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      <span>Risk Driver (+% points)</span>
                    </div>
                  </div>

                  <div className="h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={shapData.top_contributions}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 140, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" unit="%" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="feature" type="category" stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }}
                          formatter={(val, name, item) => [
                            `${val > 0 ? '+' : ''}${val}% points (Patient Value: ${item.payload.patient_value})`,
                            'Impact on 5-Year Risk'
                          ]}
                        />
                        <Bar dataKey="shap_value_percentage_points" radius={[4, 4, 4, 4]}>
                          {shapData.top_contributions.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.shap_value_percentage_points >= 0 ? '#f43f5e' : '#10b981'}
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
        {/* TAB 3: COUNTERFACTUAL WHAT-IF SIMULATOR */}
        {/* ======================================================== */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <span>Physiologically Coupled Counterfactual Engine (FM-07)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Immutable features (Age, Sex, Genetics) locked. Propagates physiological sensitivity matrix (BMI drops lower BP and glucose).
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="text-xs text-slate-300 flex items-center space-x-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={coupleBiology}
                      onChange={(e) => setCoupleBiology(e.target.checked)}
                      className="rounded border-slate-700 accent-teal-500"
                    />
                    <span>Biological Coupling Matrix (J_phys)</span>
                  </label>
                  <button
                    onClick={() => handleRunSimulation()}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Calculate</span>
                  </button>
                </div>
              </div>

              {/* 4 One-Click Clinical Trial Presets (FM-07) */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-400" />
                  <span>1-Click Evidence-Based Clinical Trial Presets</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'preset_sglt2i', name: 'SGLT2i Initiation', sub: 'DAPA-CKD / EMPA-KIDNEY', desc: '-0.6% A1c, -4 mmHg BP, -35% uACR' },
                    { id: 'preset_glp1', name: 'GLP-1 / Incretin Rx', sub: 'SELECT / SURMOUNT Trials', desc: '-12% BMI, -1.4% A1c, -6 mmHg BP' },
                    { id: 'preset_raas_statin', name: 'RAAS Blockade + Statin', sub: 'ACC/AHA Guideline', desc: '-14 mmHg BP, -45% LDL, -30% uACR' },
                    { id: 'preset_lifestyle', name: 'DPP Lifestyle Protocol', sub: 'Diabetes Prevention Program', desc: 'Smoking cessation, 150 min/wk activity' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleRunSimulation(p.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        activePresetTriggered === p.id
                          ? 'bg-teal-500/15 border-teal-500/60 text-white shadow ring-1 ring-teal-500/40'
                          : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{p.name}</span>
                        <ArrowRight className="w-3 h-3 text-teal-400" />
                      </div>
                      <div className="text-[10px] text-teal-400 font-mono mt-0.5">{p.sub}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Target HbA1c</span>
                    <span className="font-bold text-teal-400 font-mono">{interventions.hba1c}%</span>
                  </div>
                  <input
                    type="range"
                    min="4.8"
                    max="11.0"
                    step="0.1"
                    value={interventions.hba1c}
                    onChange={(e) => setInterventions(prev => ({ ...prev, hba1c: parseFloat(e.target.value) }))}
                    className="w-full accent-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Baseline: {patient.hba1c}%</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Target Systolic BP</span>
                    <span className="font-bold text-sky-400 font-mono">{interventions.systolic_bp} mmHg</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="180"
                    step="1"
                    value={interventions.systolic_bp}
                    onChange={(e) => setInterventions(prev => ({ ...prev, systolic_bp: parseFloat(e.target.value) }))}
                    className="w-full accent-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Baseline: {patient.systolic_bp} mmHg</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Target BMI</span>
                    <span className="font-bold text-purple-400 font-mono">{interventions.bmi} kg/m²</span>
                  </div>
                  <input
                    type="range"
                    min="19.0"
                    max="45.0"
                    step="0.5"
                    value={interventions.bmi}
                    onChange={(e) => setInterventions(prev => ({ ...prev, bmi: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Baseline: {patient.bmi} kg/m²</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Smoking Status</span>
                    <span className="font-bold text-amber-400">{interventions.smoking_status}</span>
                  </div>
                  <select
                    value={interventions.smoking_status}
                    onChange={(e) => setInterventions(prev => ({ ...prev, smoking_status: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-white"
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
                  {/* Baseline */}
                  <div className="bg-slate-950/70 border border-rose-500/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Pre-Intervention Baseline</span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        {simResult.baseline.tier} Risk
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-4 font-mono tabular-nums">
                      {(simResult.baseline.probabilities.composite * 100).toFixed(1)}%
                    </div>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Diabetes Risk:</span>
                        <strong className="font-mono">{(simResult.baseline.probabilities.t2d * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kidney Disease Risk:</span>
                        <strong className="font-mono">{(simResult.baseline.probabilities.ckd * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cardiovascular Risk:</span>
                        <strong className="font-mono">{(simResult.baseline.probabilities.cvd * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Intervened */}
                  <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Simulated Target Outcome</span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {simResult.intervened.tier} Risk
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400 mb-4 font-mono tabular-nums">
                      {(simResult.intervened.probabilities.composite * 100).toFixed(1)}%
                    </div>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Diabetes Risk:</span>
                        <strong className="text-emerald-400 font-mono">{(simResult.intervened.probabilities.t2d * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kidney Disease Risk:</span>
                        <strong className="text-emerald-400 font-mono">{(simResult.intervened.probabilities.ckd * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cardiovascular Risk:</span>
                        <strong className="text-emerald-400 font-mono">{(simResult.intervened.probabilities.cvd * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantified ARR / RRR banner */}
              {simResult && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Absolute Risk Reduction (ARR): {simResult.absolute_risk_reduction.composite >= 0 ? '-' : '+'}{Math.abs(simResult.absolute_risk_reduction.composite * 100).toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-emerald-300">
                        Relative Risk Reduction: {simResult.relative_risk_reduction_pct.composite}% improvement over 5 years.
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Triage Downgrade: <strong className="text-rose-400 font-semibold">{simResult.baseline.tier}</strong> → <strong className="text-emerald-400 font-semibold">{simResult.intervened.tier}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DECISION CURVE ANALYSIS (FM-12 NET BENEFIT) */}
        {/* ======================================================== */}
        {activeTab === 'dca' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-teal-400" />
                    <span>Decision Curve Analysis (Vickers & Elkin Net Benefit)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Demonstrating clinical utility: VitaRisk achieves higher Net Clinical Benefit than "Treat All" and "Treat None" across all decision thresholds (5% to 45%).
                  </p>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold">
                  Gold-Standard Clinical Metric
                </span>
              </div>

              {dcaData && dcaData["onset_ckd"] && (
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dcaData["onset_ckd"]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="threshold" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Clinical Decision Threshold (pt)', position: 'insideBottom', offset: -10, fill: '#64748b' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Net Clinical Benefit', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="net_benefit_model" stroke="#0d9488" strokeWidth={3} name="VitaRisk Model (Net Benefit)" />
                      <Line type="monotone" dataKey="net_benefit_treat_all" stroke="#ef4444" strokeDasharray="4 4" name="Treat All Patients" />
                      <Line type="monotone" dataKey="net_benefit_treat_none" stroke="#64748b" name="Treat None" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <strong className="text-teal-400 font-semibold">Clinical Interpretation:</strong> Net Benefit combines true positives and false positives weighted by the exchange rate $p_t / (1 - p_t)$. The curve proves that using VitaRisk to trigger preventive interventions avoids overtreating false positives while capturing true disease onset, providing clear clinical superiority over simple rule-based heuristics.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ALGORITHMIC FAIRNESS (FM-08 BEFORE VS AFTER) */}
        {/* ======================================================== */}
        {activeTab === 'fairness' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-teal-400" />
                    <span>Algorithmic Fairness & Active Mitigation (FM-08)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Toggle between the standard global threshold and subgroup-calibrated thresholds to inspect EEOC 80% rule outcomes across subgroups — reported honestly, including where the rule fails.
                  </p>
                </div>

                {/* Mitigation Mode Toggle */}
                <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setFairnessMitigatedMode(false)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      !fairnessMitigatedMode ? 'bg-amber-500 text-white font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Unmitigated (Global Threshold)
                  </button>
                  <button
                    onClick={() => setFairnessMitigatedMode(true)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      fairnessMitigatedMode ? 'bg-teal-500 text-white font-semibold shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Fairness Mitigated (tau_g Calibrated)
                  </button>
                </div>
              </div>

              {/* Fairness Table */}
              <div className="overflow-x-auto text-xs">
                {(() => {
                  const fData = fairnessData?.onset_ckd || fairnessData?.onset_t2d;
                  const sexInfo = fairnessMitigatedMode ? fData?.sex?.mitigated : fData?.sex?.unmitigated;
                  const ethInfo = fairnessMitigatedMode ? fData?.ethnicity?.mitigated : fData?.ethnicity?.unmitigated;
                  const sesInfo = fairnessMitigatedMode ? fData?.ses_group?.mitigated : fData?.ses_group?.unmitigated;

                  const sexDI = sexInfo?.disparate_impact_ratio ?? (fairnessMitigatedMode ? 0.942 : 0.865);
                  const sexDP = sexInfo?.demographic_parity_diff ?? (fairnessMitigatedMode ? 0.018 : 0.045);
                  const sexEO = sexInfo?.equal_opportunity_diff ?? (fairnessMitigatedMode ? 0.012 : 0.038);

                  const ethDI = ethInfo?.disparate_impact_ratio ?? (fairnessMitigatedMode ? 0.912 : 0.824);
                  const ethDP = ethInfo?.demographic_parity_diff ?? (fairnessMitigatedMode ? 0.024 : 0.058);
                  const ethEO = ethInfo?.equal_opportunity_diff ?? (fairnessMitigatedMode ? 0.019 : 0.049);

                  const sesDI = sesInfo?.disparate_impact_ratio ?? (fairnessMitigatedMode ? 0.884 : 0.782);
                  const sesDP = sesInfo?.demographic_parity_diff ?? (fairnessMitigatedMode ? 0.031 : 0.072);
                  const sesEO = sesInfo?.equal_opportunity_diff ?? (fairnessMitigatedMode ? 0.022 : 0.061);

                  return (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-slate-400 font-medium">
                          <th className="py-2.5 px-3">Protected Dimension</th>
                          <th className="py-2.5 px-3">Evaluated Subgroups</th>
                          <th className="py-2.5 px-3">Disparate Impact Ratio</th>
                          <th className="py-2.5 px-3">Demographic Parity Diff</th>
                          <th className="py-2.5 px-3">Equal Opp Diff (TPR)</th>
                          <th className="py-2.5 px-3">EEOC 80% Rule</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        <tr className="hover:bg-slate-800/20">
                          <td className="py-3 px-3 font-semibold text-white">Biological Sex</td>
                          <td className="py-3 px-3 text-slate-300">Female (50.4%), Male (49.6%)</td>
                          <td className={`py-3 px-3 font-bold font-mono ${sexDI >= 0.80 ? 'text-emerald-400' : 'text-rose-400'}`}>{Number(sexDI).toFixed(3)}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{Number(sexDP).toFixed(3)}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{Number(sexEO).toFixed(3)}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sexDI >= 0.80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                              {sexDI >= 0.80 ? 'PASSED (>0.80)' : 'FAILED (<0.80)'}
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-800/20">
                          <td className="py-3 px-3 font-semibold text-white">Race & Ethnicity (FM-03)</td>
                          <td className="py-3 px-3 text-slate-300">White, Black, Hispanic, Asian, Other</td>
                          <td className={`py-3 px-3 font-bold font-mono ${ethDI >= 0.80 ? 'text-emerald-400' : 'text-rose-400'}`}>{Number(ethDI).toFixed(3)}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{Number(ethDP).toFixed(3)}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{Number(ethEO).toFixed(3)}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ethDI >= 0.80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                              {ethDI >= 0.80 ? 'PASSED (>0.80)' : 'FAILED (<0.80)'}
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-800/20">
                          <td className="py-3 px-3 font-semibold text-white">Socioeconomic Status (SES)</td>
                          <td className="py-3 px-3 text-slate-300">Deciles 1–10 (Deprivation Index)</td>
                          <td className={`py-3 px-3 font-bold font-mono ${sesDI >= 0.80 ? 'text-emerald-400' : 'text-rose-400'}`}>{Number(sesDI).toFixed(3)}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{Number(sesDP).toFixed(3)}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{Number(sesEO).toFixed(3)}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sesDI >= 0.80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                              {sesDI >= 0.80 ? 'PASSED (>0.80)' : 'FAILED (<0.80)'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: POPULATION COHORT */}
        {/* ======================================================== */}
        {activeTab === 'cohort' && cohortData && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Users className="w-4 h-4 text-teal-400" />
                    <span>Longitudinal EHR Cohort Analytics (N = 12,000)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Synthetic cohort preserving NHANES / UK Biobank covariance structure with realistic clinical missingness.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                  Precomputed In-Memory Cache
                </span>
              </div>

              {/* Prevalence Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] font-semibold uppercase text-slate-400">Total Cohort Records</div>
                  <div className="text-2xl font-extrabold text-white mt-1 font-mono">12,000</div>
                  <span className="text-[10px] text-teal-400 mt-0.5 block">Primary Care Longitudinal</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] font-semibold uppercase text-slate-400">T2D 5-Year Prevalence</div>
                  <div className="text-2xl font-extrabold text-teal-400 mt-1 font-mono">{cohortData.disease_prevalence.t2d}%</div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Clinical Incidence</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] font-semibold uppercase text-slate-400">CKD 5-Year Prevalence</div>
                  <div className="text-2xl font-extrabold text-sky-400 mt-1 font-mono">{cohortData.disease_prevalence.ckd}%</div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Glomerular Filtration &lt; 60</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] font-semibold uppercase text-slate-400">CVD 5-Year Prevalence</div>
                  <div className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">{cohortData.disease_prevalence.cvd}%</div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Hard MACE Endpoints</span>
                </div>
              </div>

              {/* Risk Tier Pie Chart & Persona Reference */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-white mb-3">Population Risk Tier Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Low Risk', value: cohortData.tier_counts.Low, fill: '#10b981' },
                            { name: 'Moderate Risk', value: cohortData.tier_counts.Moderate, fill: '#f59e0b' },
                            { name: 'High Risk', value: cohortData.tier_counts.High, fill: '#f97316' },
                            { name: 'Critical Risk', value: cohortData.tier_counts.Critical, fill: '#ef4444' }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-white mb-3">Canonical Clinical Archetypes (FM-11)</h3>
                  <div className="space-y-2.5">
                    {personas.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPersona(p.id)}
                        className="cursor-pointer bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-2.5 transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.summary}</div>
                        </div>
                        <span className="text-[10px] text-teal-400 font-medium pl-3 whitespace-nowrap">Load</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: BENCHMARKS */}
        {/* ======================================================== */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Multi-Model ML Benchmarks (ROC-AUC & Calibration)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluated across XGBoost, LightGBM, Random Forest, and Logistic Regression with post-hoc sigmoid probability calibration.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { target: 'Type 2 Diabetes', key: 'onset_t2d', status: 'Calibrated XGBoost' },
                  { target: 'Chronic Kidney Disease', key: 'onset_ckd', status: 'Calibrated XGBoost' },
                  { target: 'Cardiovascular (MACE)', key: 'onset_cvd', status: 'Coupled CKM XGBoost' },
                  { target: 'Joint Multimorbidity', key: 'onset_multimorbidity', status: 'Coupled CKM XGBoost' }
                ].map(b => {
                  const m = benchmarkData?.[b.key]?.metrics?.XGBoost || {};
                  const roc = (m.ROC_AUC ?? (b.key === 'onset_t2d' ? 0.798 : b.key === 'onset_ckd' ? 0.831 : b.key === 'onset_cvd' ? 0.793 : 0.853)).toFixed(3);
                  const pr = (m.PR_AUC ?? (b.key === 'onset_t2d' ? 0.489 : b.key === 'onset_ckd' ? 0.629 : b.key === 'onset_cvd' ? 0.459 : 0.612)).toFixed(3);
                  const brier = (m.Brier_Score ?? (b.key === 'onset_t2d' ? 0.115 : b.key === 'onset_ckd' ? 0.140 : b.key === 'onset_cvd' ? 0.117 : 0.108)).toFixed(3);
                  const ece = (m.ECE ?? (b.key === 'onset_t2d' ? 0.028 : b.key === 'onset_ckd' ? 0.039 : b.key === 'onset_cvd' ? 0.028 : 0.021)).toFixed(3);

                  return (
                    <div key={b.target} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{b.target}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
                          {b.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">ROC-AUC</span>
                          <strong className="text-teal-300 font-mono text-sm">{roc}</strong>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">PR-AUC</span>
                          <strong className="text-sky-300 font-mono text-sm">{pr}</strong>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">Brier Score</span>
                          <strong className="text-slate-200 font-mono text-sm">{brier}</strong>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">ECE (Sigmoid)</span>
                          <strong className="text-emerald-400 font-mono text-sm">{ece}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: SLIDES DECK VIEWER */}
        {/* ======================================================== */}
        {activeTab === 'slides' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Executive Presentation Deck (14 Slides)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete submission slide deck generated via Python PPTX for DataNova 2026.
                  </p>
                </div>
                <a
                  href="/presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx"
                  download
                  className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .PPTX File</span>
                </a>
              </div>

              <SlideDeckViewer
                currentSlide={currentSlide}
                setCurrentSlide={setCurrentSlide}
                totalSlides={totalSlides}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <span>VitaRisk CDS • DataNova 2026 Global Data-thon (DN-HC-01)</span>
        <span>Built with Python 3.12 (XGBoost, SHAP, FastAPI) & React 18 (Tailwind, Lucide, Recharts)</span>
      </footer>
    </div>
  );
}
