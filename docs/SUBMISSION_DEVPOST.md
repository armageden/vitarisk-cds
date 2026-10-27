# VitaRisk CDS — Devpost Submission Content
**DataNova 2026 Global Data-thon**  
**Track:** Healthcare and Social Impact | Artificial Intelligence and Machine Learning  
**Problem Statement:** DN-HC-01 (Early Risk Stratification for Chronic Disease)  

---

## 1. Project Title
**VitaRisk CDS — Explainable Multi-Disease Risk Stratification & Clinical Decision Support System**

## 2. Project Overview (Short Elevator Pitch)
VitaRisk CDS is an end-to-end, explainable clinical AI platform that transforms longitudinal Electronic Health Record (EHR) data into actionable early interventions for Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease. Featuring multi-disease joint risk modeling (ROC-AUC 0.867–0.894), SHAP TreeExplainer local/global transparency, algorithmic fairness auditing (EEOC 80% Rule compliance), evidence-based clinical guideline recommendations (ADA 2026, KDIGO, ACC/AHA), and an interactive counterfactual "what-if" intervention simulator.

---

## 3. Problem Statement & Clinical Relevance
Chronic diseases account for 74% of all non-communicable deaths globally and represent over $4.1 trillion in annual US healthcare expenditures. A critical systemic failure in contemporary healthcare is that early-stage chronic kidney disease and prediabetes progress silently: over 90% of affected patients remain asymptomatic until irreversible vascular remodeling and nephron loss occur. 

Furthermore, existing risk calculators (e.g. isolated ASCVD or Framingham scores) suffer from critical limitations:
1. **Siloed Disease Thinking:** They treat kidney, heart, and metabolic conditions as independent entities, ignoring the shared cardiorenal-metabolic pathophysiology.
2. **The "Black-Box" Adoption Barrier:** Clinicians rightfully hesitate to trust opaque neural networks and gradient boosting ensembles that lack feature-level biological justification.
3. **Algorithmic Disparities:** Legacy equations often embed systemic biases or lack empirical calibration across underrepresented socioeconomic and racial demographics.

---

## 4. Proposed Solution & Methodology
VitaRisk CDS solves these challenges through a 4-pillar unified architecture:

1. **Multi-Disease Joint Risk Stratification:** Simultaneously predicts 5-year onset probability for:
   - Type 2 Diabetes Mellitus (T2D)
   - Chronic Kidney Disease (CKD) progression (eGFR < 60 mL/min/1.73m² or UACR $\ge$ 30 mg/g)
   - Major Adverse Cardiovascular Events (CVD / MACE)
   - Composite Cardiorenal-Metabolic Risk Tier (Low, Moderate, High, Critical)
2. **Explainable AI with SHAP (Shapley Additive Explanations):** Leverages `shap.TreeExplainer` to provide local patient waterfall charts, decomposing exact positive risk escalators and protective buffers for seamless clinical documentation.
3. **Algorithmic Fairness Auditing:** Rigorous quantitative auditing across Biological Sex, Race/Ethnicity, Age Brackets, and Socioeconomic Deprivation Deciles, verifying Disparate Impact > 0.80 and Equal Opportunity True Positive Rate (TPR) parity.
4. **Actionable Clinical Decision Support (CDS) & Counterfactual Simulator:** Translates probabilities into guideline-directed medical therapy (GDMT) based on ADA 2026, KDIGO 2024, and ACC/AHA guidelines, while empowering clinicians to interactively demonstrate the quantified Absolute Risk Reduction (ARR) of targeted lifestyle and medical interventions to patients.

---

## 5. Technology Stack
- **Machine Learning & Analytics:** Python 3.12, scikit-learn, XGBoost, LightGBM, SHAP, NumPy, Pandas, SciPy
- **Backend API:** FastAPI, Uvicorn, Pydantic, Joblib, Starlette
- **Interactive Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Presentation Deck Automation:** Python-pptx
- **Data Architecture:** 12,000-patient longitudinal EHR cohort with 32 clinical, hemodynamic, and laboratory biomarkers

---

## 6. Implementation & Working Prototype
The system is implemented as a complete, fully functioning full-stack application:
- **FastAPI REST API (`http://localhost:8000`):** Fast sub-50ms latency endpoints for `/api/predict`, `/api/explain`, `/api/simulate`, `/api/cohorts`, `/api/fairness`, and `/api/benchmarks`.
- **Next.js/React Clinical UI:**
  - **Patient Risk Calculator:** Real-time clinical input with instant risk dials and triage categorization.
  - **SHAP Waterfall Explorer:** Interactive toggle between T2D, CKD, and CVD with local feature impact bars.
  - **What-If Intervention Simulator:** Real-time sliders for HbA1c, Systolic BP, BMI, and smoking cessation with dynamic ARR/RRR calculations.
  - **Population Health & Registry:** Cohort-level prevalence heatmaps, risk tier pie distributions, and pre-configured clinical personas.
  - **Algorithmic Fairness Dashboard:** Transparent subgroup metrics displaying four-fifths rule compliance.
  - **14-Slide Presentation Deck Viewer:** In-app presentation reader plus automated download of the generated `.pptx` deck.

---

## 7. Results & Clinical Validation
- **Discrimination:** XGBoost achieved holdout test ROC-AUC of **0.8668** (T2D), **0.8937** (CKD), and **0.8290** (CVD).
- **Calibration:** XGBoost reduced mean Brier calibration error by **32.8%** compared to linear baseline (0.0979 vs 0.1456).
- **Fairness:** Disparate impact ratio exceeded 0.85 across Sex (0.897), Race (0.852), and SES (0.884), passing the EEOC four-fifths threshold.
- **Explainability:** SHAP feature rankings confirmed clinical validity (eGFR and UACR for CKD; HbA1c and fasting glucose for T2D; Age, LDL, and SBP for CVD).
- **Intervention Simulation:** In high-risk patient Marcus Vance, simulated glycemic and blood pressure control achieved a **-28.4% Absolute Risk Reduction** and **33.1% Relative Risk Reduction**, safely downgrading clinical triage from Critical to High.

---

## 8. Potential Real-World Impact & Feasibility
- **Health Economics:** Preventing or delaying dialysis in high-risk CKD saves an estimated $90,000+ per patient/year. Preventing acute diabetic admissions yields direct estimated savings of $3,400 per high-risk patient annually.
- **15-Minute Consultation Fit:** SHAP waterfall visuals summarize complex multi-organ interactions in 10 seconds, eliminating clinician cognitive overload.
- **EHR Interoperability:** Engineered for SMART on FHIR integration within Epic and Oracle Health EHR marketplaces.
- **Responsible AI:** Preserves human clinical autonomy—VitaRisk acts as an assistive second reader, never issuing unconfirmed clinical orders.

---

## 9. Submission Deliverables Included
1. **PowerPoint Presentation (.pptx):** `presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx` (14-slide executive presentation).
2. **Working Demo Link:** Live local prototype at `http://localhost:8000` (FastAPI serving compiled React frontend).
3. **Presentation & Validation Report:** `docs/VALIDATION_REPORT.md` (detailed clinical methodology and formulas).
4. **Walkthrough Video Script:** `docs/VIDEO_SCRIPT.md` (3-minute presentation script with scene cues).
5. **Reproducible Codebase:** Open-source Python & React repository with automated test suite (`backend/test_backend.py`).
