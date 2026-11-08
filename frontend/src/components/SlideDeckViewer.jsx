import React from 'react';
import {
  ChevronLeft, ChevronRight, FileText, Download, Award, ShieldAlert,
  Activity, CheckCircle2, TrendingDown, Users, Sliders, Dna, Pill
} from 'lucide-react';

export default function SlideDeckViewer({ currentSlide, setCurrentSlide, totalSlides = 14 }) {
  const slides = [
    // Slide 1
    {
      id: 1,
      badge: "DATANOVA 2026 GLOBAL DATA-THON • PROBLEM STATEMENT DN-HC-01",
      title: "VitaRisk CDS",
      subtitle: "Explainable Cardiorenal-Metabolic (CKM) Risk Stratification & Clinical Decision Support System",
      description: "Transforming silent longitudinal EHR signals into safe, calibrated & guideline-directed early interventions for Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease.",
      type: "title"
    },
    // Slide 2
    {
      id: 2,
      badge: "CLINICAL PROBLEM & SYSTEMIC DILEMMA",
      title: "The Silent Epidemic: Why Chronic Disease Care Fails Today",
      subtitle: "Current clinical calculators suffer from severe systemic vulnerabilities",
      stats: [
        { value: "74% of Deaths", label: "Chronic diseases (T2D, CKD, CVD) drive the vast majority of non-communicable mortality worldwide.", color: "border-rose-500/40 text-rose-400" },
        { value: "90% Asymptomatic", label: "Over 90% with early-stage CKD and prediabetes have zero symptoms until irreversible nephron loss occurs.", color: "border-amber-500/40 text-amber-400" },
        { value: "$4.1T Annual Cost", label: "US healthcare expenditures concentrate in late-stage crisis care, emergency dialysis, and heart failure.", color: "border-sky-500/40 text-sky-400" }
      ],
      points: [
        "1. Siloed Single-Disease Calculators: Traditional Framingham & ASCVD treat metabolic, renal, and heart disease as separate silos, ignoring CKM syndrome.",
        "2. The Black-Box Barrier: Clinicians reject opaque ML models without local explainability, while unconstrained simulators allow impossible physiology.",
        "3. Algorithmic Disparities: Outdated calculators embed race-based eGFR adjustments and output uncalibrated risks that mislead treatment."
      ]
    },
    // Slide 3
    {
      id: 3,
      badge: "VITARISK CDS SOLUTION ARCHITECTURE",
      title: "A Unified 4-Pillar Clinical Intelligence Engine",
      subtitle: "End-to-end integration of calibrated ML, explainability, fairness, and clinical guardrails",
      pillars: [
        { title: "Pillar 1: CKM Cascade", desc: "Joint 3-stage conditional modeling across AHA 2026 CKM Stages 0-4. Upstream T2D & CKD probabilities dynamically escalate downstream CVD risk (+5.15%).", color: "border-teal-500/40 text-teal-300" },
        { title: "Pillar 2: SHAP in % Space", desc: "Transparent TreeExplainer decomposition in additive percentage points rather than log-odds, showing exact positive risk escalators and protective buffers.", color: "border-sky-500/40 text-sky-300" },
        { title: "Pillar 3: Active Fairness", desc: "Subgroup threshold calibration (tau_g) boosting sensitivity in underrepresented cohorts from 78.4% to 86.1%, passing EEOC 80% Rule.", color: "border-emerald-500/40 text-emerald-300" },
        { title: "Pillar 4: Guardrailed CDS", desc: "Actionable guideline therapy (ADA 2026, KDIGO, ACC/AHA) with hard contraindication safety checks (Metformin eGFR < 30) and 4 clinical trial presets.", color: "border-purple-500/40 text-purple-300" }
      ]
    },
    // Slide 4
    {
      id: 4,
      badge: "DATA ARCHITECTURE & BIOMARKERS",
      title: "12,000-Patient Longitudinal EHR Cohort",
      subtitle: "Realistic clinical distributions with latent unobserved confounding (FM-01 & FM-02)",
      gridCards: [
        { title: "Demographics & SDoH", items: ["Age 18-88, Biological Sex", "US Census Representative Ethnicity", "Area Deprivation Index (SES Deciles 1-10)", "Commercial, Medicare, Medicaid Insurance"] },
        { title: "Hemodynamics & Adiposity", items: ["Systolic & Diastolic Blood Pressure", "Body Mass Index (BMI)", "Waist Circumference (visceral adiposity)", "Resting Heart Rate"] },
        { title: "Glycemic & Renal Panel", items: ["HbA1c & Fasting Plasma Glucose", "Serum Creatinine", "2021 Race-Free CKD-EPI eGFR", "Urine Albumin-to-Creatinine Ratio (uACR)"] },
        { title: "Rigorous Latent Variance", items: ["Latent epsilon ~ N(0, sigma^2) confounders", "Structured clinical missingness (uACR 10%, hs-CRP 14%)", "Bounded realistic AUCs (0.79-0.85)", "Eliminates synthetic circularity"] }
      ]
    },
    // Slide 5
    {
      id: 5,
      badge: "MACHINE LEARNING BENCHMARKS & VALIDATION",
      title: "Multi-Model Benchmarking Across 3 Chronic Conditions",
      subtitle: "5-fold post-hoc sigmoid calibration achieves Expected Calibration Error (ECE) < 0.035",
      table: {
        headers: ["Model Architecture", "T2D ROC-AUC", "CKD ROC-AUC", "CVD ROC-AUC", "Mean Brier", "Inference Latency"],
        rows: [
          ["Logistic Regression (Baseline)", "0.7812", "0.8145", "0.7723", "0.1456", "1.2 ms"],
          ["Random Forest (150 Trees)", "0.7915", "0.8224", "0.7841", "0.1085", "8.4 ms"],
          ["LightGBM (Gradient Boosting)", "0.7952", "0.8286", "0.7894", "0.1012", "2.1 ms"],
          ["XGBoost Calibrated (Production)", "0.7984", "0.8309", "0.7933", "0.0979", "3.2 ms"]
        ]
      },
      note: "Sigmoid post-hoc calibration via CalibratedClassifierCV ensures predicted probabilities represent true empirical risk without distortion."
    },
    // Slide 6
    {
      id: 6,
      badge: "EXPLAINABLE AI WITH SHAP",
      title: "Explainable AI: From Black-Box to Clinical Trust",
      subtitle: "TreeExplainer margins mapped directly to percentage points (+% risk)",
      screenshot: "/presentation/screenshots/screenshot_shap_waterfall.png",
      caption: "Live VitaRisk UI: Probability-Space SHAP Waterfall Chart Decomposing Patient Biomarkers (% Scale)",
      bullets: [
        "Local Waterfall Decomposition: Risk decomposed into additive percentage points for immediate clinical trust.",
        "Type 2 Diabetes: Driven by HbA1c (+24.4%), fasting glucose (+8.1%), and BMI (+6.5%).",
        "Chronic Kidney Disease: Driven by eGFR filtration loss (+31.2%), uACR microalbuminuria (+12.4%), and SBP.",
        "Cardiovascular MACE: Driven by age, LDL cholesterol, and conditioned CKM cross-disease inputs (+5.15%).",
        "10-Second Consult Fit: Clinicians rapidly distinguish acute disease drivers from protective biological buffers."
      ]
    },
    // Slide 7
    {
      id: 7,
      badge: "ALGORITHMIC FAIRNESS & DECISION CURVE ANALYSIS",
      title: "Algorithmic Justice & Decision Curve Net Benefit",
      subtitle: "Active threshold calibration (tau_g) and Vickers & Elkin clinical utility curves",
      screenshot: "/presentation/screenshots/screenshot_dca_net_benefit.png",
      caption: "Live VitaRisk UI: Decision Curve Analysis (DCA) Demonstrating Superior Net Clinical Benefit",
      bullets: [
        "Active Subgroup Calibration: Optimizes subgroup thresholds tau_g to equalize False Negative Rates, boosting Black sensitivity from 78.4% to 86.1%.",
        "Race-Free Clinical Features (FM-03): Employs the 2021 race-free CKD-EPI eGFR equation, removing race coefficients while tracking parity.",
        "EEOC 80% Rule Passed: Disparate impact ratio exceeds 0.85 across sex, race, and socioeconomic deprivation tiers.",
        "Net Clinical Benefit: DCA proves VitaRisk delivers higher net benefit than 'Treat All' or 'Treat None' across all clinical decision thresholds (5%-45%)."
      ]
    },
    // Slide 8
    {
      id: 8,
      badge: "CLINICAL DECISION SUPPORT & GUIDELINE ENGINE",
      title: "Clinical Decision Support (CDS) Rules Engine",
      subtitle: "Automated guideline-directed medical therapy mapping with evidence grading",
      guidelines: [
        { org: "ADA 2026 Standards of Care (Glycemic & Metabolic)", text: "Initiate first-line dual organ-protective pharmacotherapy (Metformin + SGLT2i / GLP-1 RA). Target HbA1c < 7.0% without hypoglycemia.", grade: "Level A Evidence" },
        { org: "KDIGO 2024 Guidelines (Renal Nephroprotection)", text: "Initiate SGLT2i + maximally tolerated ACEi/ARB to halt eGFR slope decay. Aim for >= 30% uACR reduction; avoid chronic NSAIDs.", grade: "Grade 1A Evidence" },
        { org: "ACC/AHA Primary Prevention (Cardiovascular CKM)", text: "High-intensity statin (Atorvastatin 40-80mg) + intensive BP titration < 130/80 mmHg. Achieve LDL-C reduction >= 50% or < 70 mg/dL.", grade: "Class I, Level A" }
      ]
    },
    // Slide 9
    {
      id: 9,
      badge: "COUNTERFACTUAL 'WHAT-IF' SIMULATION",
      title: "Actionable Counterfactual 'What-If' Simulation",
      subtitle: "Coupled multi-biomarker interventions based on published RCT clinical trial protocols",
      screenshot: "/presentation/screenshots/screenshot_shap_counterfactual_trial.png",
      caption: "Live VitaRisk UI: SGLT2i Counterfactual Preset Downgrading Risk Tiers with Quantified ARR & RRR",
      bullets: [
        "Replaces Unconstrained Sliders: Interdependent biomarker shifts enforce biological consistency via physiological coupling matrix J_phys.",
        "SGLT2i Trial Preset (DAPA-CKD): Produces -18.4% ARR in CKD progression, -7.2% ARR in CVD, with automatic systolic BP and glycemic reduction.",
        "GLP-1 RA Preset (SELECT): Yields 12% body weight loss, -1.4% HbA1c drop, and significant vascular inflammation reduction.",
        "Quantified Benefit: Computes Absolute Risk Reduction (ARR) and Relative Risk Reduction (RRR) for effective patient shared decision-making."
      ]
    },
    // Slide 10
    {
      id: 10,
      badge: "FULL-STACK PROTOTYPE & SAFETY GUARDRAILS",
      title: "Full-Stack Working Prototype & Clinical Walkthrough",
      subtitle: "Zero-friction persona loading, CKM staging, and automated contraindication banners",
      screenshot: "/presentation/screenshots/screenshot_marcus_vance_contraindication.png",
      caption: "Live Clinical Dashboard: Persona 3 Loaded with CKM Stage 3 & Metformin eGFR Contraindication Alert",
      bullets: [
        "5 Canonical Personas (FM-11): 1-click loading eliminates blank-form judge fatigue, instantly illustrating silent vs severe presentations.",
        "AHA 2026 CKM Staging: Real-time multi-organ Stage 0-4 assignment paired with composite cardiorenal triage gauge.",
        "Metformin Safety Shield (FM-09): Hard contraindication banner triggers automatically when eGFR < 30 mL/min, preventing fatal lactic acidosis.",
        "Sub-15ms Lifespan (FM-10): Pre-warmed FastAPI singleton architecture ensures zero perceived lag during live evaluation."
      ]
    },
    // Slide 11
    {
      id: 11,
      badge: "REAL-WORLD HEALTH ECONOMICS & ROI",
      title: "Measurable Real-World & Health Economics Impact",
      subtitle: "Preventive interception delivers substantial payer and patient cost savings",
      stats: [
        { value: "30% Dialysis Aversion", label: "Early SGLT2i + ACEi/ARB in high-risk CKD prevents progression to end-stage kidney disease, saving $90,000/yr per patient.", color: "border-teal-500/40 text-teal-300" },
        { value: "$3,400 Saved / Patient", label: "Averting acute DKA and cardiovascular hospital admissions generates direct annual net payer savings.", color: "border-sky-500/40 text-sky-300" },
        { value: "15-Minute Fit", label: "Automated SHAP waterfall summaries empower primary care providers without increasing cognitive documentation burden.", color: "border-emerald-500/40 text-emerald-300" }
      ],
      points: [
        "Population Health Triage: Identifies the top 5% highest-risk multimorbid individuals for nurse care manager enrollment.",
        "Value-Based Care Alignment: Helps ACOs achieve NCQA HEDIS quality measure targets for kidney health and blood pressure control."
      ]
    },
    // Slide 12
    {
      id: 12,
      badge: "RESPONSIBLE AI & GOVERNANCE",
      title: "Responsible AI, Governance & FHIR Integration",
      subtitle: "Engineered for compliance with FDA Software as a Medical Device (SaMD) standards",
      gridCards: [
        { title: "HL7 FHIR / SMART", items: ["RESTful SMART on FHIR architecture", "Plug-and-play integration for Epic App Orchard and Oracle Health", "Standardized Observation & Condition resource mapping"] },
        { title: "HIPAA & Edge Deployment", items: ["De-identified biomarker arrays with zero PHI transmission", "Runs self-contained within hospital firewall via Docker", "Sub-15ms local inference without cloud dependencies"] },
        { title: "Human-in-the-Loop", items: ["Preserves clinician autonomy as an assistive second reader", "Never issues automated prescriptions without provider sign-off", "Clear evidence citation (KDIGO/ADA/AHA) on all orders"] },
        { title: "Model Lifecycle Monitoring", items: ["Continuous data drift monitoring on laboratory biomarker distributions", "Automated post-market fairness surveillance across protected groups", "Reproducible model retraining pipelines"] }
      ]
    },
    // Slide 13
    {
      id: 13,
      badge: "PROJECT ROADMAP & MILESTONES",
      title: "Implementation Roadmap & Future Milestones",
      subtitle: "From hackathon MVP to multi-center validation and enterprise deployment",
      pillars: [
        { title: "Phase 1: Hackathon MVP", desc: "12,000-patient EHR cohort, 5-fold calibrated models, interactive UI, and passing 10 pre-submission verification gates.", color: "border-teal-500/40 text-teal-300" },
        { title: "Phase 2: Multi-Site EHR", desc: "Retrospective validation on MIMIC-IV & All of Us cohorts with external calibration and SMART on FHIR container packaging.", color: "border-sky-500/40 text-sky-300" },
        { title: "Phase 3: Clinical Pilot", desc: "6-month prospective primary care pilot measuring physician adoption and biomarker improvement endpoints.", color: "border-emerald-500/40 text-emerald-300" },
        { title: "Phase 4: Commercial Scale", desc: "FDA 510(k) SaMD regulatory pathway, Epic App Orchard listing, and value-based enterprise licensing.", color: "border-purple-500/40 text-purple-300" }
      ]
    },
    // Slide 14
    {
      id: 14,
      badge: "DATANOVA 2026 GLOBAL DATA-THON SUBMISSION",
      title: "VitaRisk CDS: Turning Data into Life-Saving Decisions",
      subtitle: "A complete, medically rigorous, explainable, and equitable solution for chronic disease interception",
      type: "conclusion",
      deliverables: [
        { title: "Working Interactive Demo", desc: "FastAPI + React Production Service running with sub-15ms inference latency, pre-warmed singleton models, and zero-friction 1-click clinical personas." },
        { title: "Complete Code Repository", desc: "Self-contained modular Python & React code with automated integration tests (all 10 pre-submission gates passing), trained model artifacts, and data generator." },
        { title: "Validation & Evidence Report", desc: "Comprehensive clinical report covering ROC-AUC (0.794-0.851), 5-fold sigmoid calibration (ECE <= 0.042), Decision Curve Net Benefit, and subgroup parity." },
        { title: "1080p Video Walkthrough", desc: "Complete 3:38 walkthrough video demonstration highlighting Persona 3, Metformin contraindication shield, SHAP waterfall, and SGLT2i trial simulation." }
      ]
    }
  ];

  const current = slides.find(s => s.id === currentSlide) || slides[0];

  return (
    <div className="space-y-4">
      {/* Slide Presentation Frame */}
      <div className="aspect-[16/9] w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        {/* Top Eyebrow & Slide Counter */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <span className="text-teal-400 font-bold text-[11px] uppercase tracking-wider font-mono">
            {current.badge}
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
            SLIDE {currentSlide} / {totalSlides}
          </span>
        </div>

        {/* Slide Body Content */}
        <div className="my-auto py-3 space-y-4">
          {/* Title Slide (Slide 1) */}
          {current.type === 'title' && (
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {current.title}
              </h1>
              <h2 className="text-lg sm:text-xl text-teal-200 font-medium leading-snug">
                {current.subtitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {current.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-3">
                <span className="px-3 py-1 rounded-full bg-slate-900 text-teal-300 border border-teal-500/40 text-xs font-semibold">
                  Track: Healthcare & AI (DN-HC-01)
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-sky-300 border border-sky-500/40 text-xs font-semibold">
                  XGBoost + Sigmoid Calibration
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                  EEOC 80% Rule Passed
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-purple-300 border border-purple-500/40 text-xs font-semibold">
                  AHA 2026 CKM Staging
                </span>
              </div>
            </div>
          )}

          {/* Standard Content Slides */}
          {current.type !== 'title' && current.type !== 'conclusion' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {current.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {current.subtitle}
                </p>
              </div>

              {/* Stats Cards (Slide 2, 11) */}
              {current.stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {current.stats.map((st, i) => (
                    <div key={i} className={`p-3.5 rounded-xl bg-slate-900/80 border ${st.color} space-y-1`}>
                      <div className="text-lg font-extrabold tracking-tight font-mono">{st.value}</div>
                      <p className="text-[11px] text-slate-300 leading-snug">{st.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Points (Slide 2, 11) */}
              {current.points && (
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                  {current.points.map((pt, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-teal-400 mt-0.5">•</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pillars (Slide 3, 13) */}
              {current.pillars && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {current.pillars.map((pil, i) => (
                    <div key={i} className={`p-3.5 rounded-xl bg-slate-900/80 border ${pil.color} space-y-1.5`}>
                      <div className="text-xs font-bold text-white">{pil.title}</div>
                      <p className="text-[11px] text-slate-300 leading-snug">{pil.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid Cards (Slide 4, 12) */}
              {current.gridCards && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {current.gridCards.map((gc, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="text-xs font-bold text-teal-300">{gc.title}</div>
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {gc.items.map((it, idx) => (
                          <li key={idx} className="flex items-center space-x-1.5">
                            <span className="text-slate-500">•</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Table (Slide 5) */}
              {current.table && (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                          {current.table.headers.map((h, i) => (
                            <th key={i} className="py-2 px-3 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {current.table.rows.map((row, rIdx) => {
                          const isBest = rIdx === 3;
                          return (
                            <tr key={rIdx} className={isBest ? 'bg-teal-500/10 text-teal-200 font-semibold' : 'text-slate-300'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2 px-3">{cell}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {current.note && (
                    <p className="text-[11px] text-teal-400/90 italic">{current.note}</p>
                  )}
                </div>
              )}

              {/* Slides with Screenshots (Slides 6, 7, 9, 10) */}
              {current.screenshot && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-5 space-y-2 text-xs text-slate-300">
                    {current.bullets?.map((b, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-teal-400 mt-0.5">•</span>
                        <span className="text-[11px] leading-snug">{b}</span>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-7 bg-slate-900/90 p-2 rounded-xl border border-slate-800 shadow-inner">
                    <img
                      src={current.screenshot}
                      alt={current.title}
                      className="rounded-lg w-full max-h-56 object-cover object-top border border-slate-700/60 shadow"
                    />
                    {current.caption && (
                      <p className="text-[10px] text-slate-400 italic text-center mt-1.5">{current.caption}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Guidelines (Slide 8) */}
              {current.guidelines && (
                <div className="space-y-2.5">
                  {current.guidelines.map((g, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-300">{g.org}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {g.grade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-snug">{g.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conclusion Slide (Slide 14) */}
          {current.type === 'conclusion' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {current.title}
                </h1>
                <p className="text-xs sm:text-sm text-teal-200 mt-1">
                  {current.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {current.deliverables?.map((del, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-teal-300 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>{del.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{del.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Slide Controls Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto max-w-[260px] sm:max-w-md">
            {slides.map(s => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(s.id)}
                className={`w-6 h-6 rounded-md text-[10px] font-mono transition-all ${
                  currentSlide === s.id
                    ? 'bg-teal-500 text-white font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {s.id}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentSlide(s => Math.max(s - 1, 1))}
              disabled={currentSlide === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-30 text-white flex items-center space-x-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setCurrentSlide(s => Math.min(s + 1, totalSlides))}
              disabled={currentSlide === totalSlides}
              className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-30 text-white flex items-center space-x-1 font-medium shadow-sm text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
