# VitaRisk CDS — Devpost Submission Content
**DataNova 2026 Global Data-thon**  
**Track:** Healthcare and Social Impact | Artificial Intelligence and Machine Learning  
**Problem Statement:** DN-HC-01 (Early Risk Stratification for Chronic Disease)  

---

## 1. Project Title
**VitaRisk CDS — Cardiorenal-Metabolic (CKM) Risk Stratification, Calibrated SHAP Transparency & Guardrailed Decision Support**

## 2. Project Overview (Elevator Pitch)
VitaRisk CDS is an end-to-end clinical AI and decision support platform that operationalizes the American Heart Association (AHA) 2026 Cardiorenal-Metabolic (CKM) Syndrome staging consensus. Trained on a 12,000-patient longitudinal EHR cohort with realistic clinical missingness and unobserved latent confounders (preventing toy generator-overfitting), VitaRisk predicts 5-year onset for Type 2 Diabetes (ROC-AUC 0.798), Chronic Kidney Disease (ROC-AUC 0.830), Cardiovascular Disease (ROC-AUC 0.794), and Multimorbidity (ROC-AUC 0.851). 

Featuring **5-fold post-hoc sigmoid probability calibration (ECE ≤ 0.042)**, **probability-space SHAP TreeExplainer decompositions (% points)**, **Decision Curve Analysis (DCA)** proving net clinical benefit, **active subgroup threshold optimization ($\tau_g$)** for algorithmic justice, **physiologically coupled counterfactual trial presets (SGLT2i, GLP-1 RA, RAAS)**, and **hard drug contraindication safety alerts** (e.g. Metformin in severe renal impairment), VitaRisk empowers primary care clinicians to detect and reverse silent disease trajectories during standard 15-minute consultations.

---

## 3. Problem Statement & Clinical Relevance
Chronic diseases account for 74% of all non-communicable deaths globally and represent over $4.1 trillion in annual US healthcare expenditures. Over 90% of patients with early-stage chronic kidney disease and prediabetes remain entirely asymptomatic until irreversible microvascular destruction and nephron loss occur. 

Current clinical risk assessment models suffer from critical systemic vulnerabilities:
1. **Siloed Disease Thinking:** Isolated calculators (e.g., standard ASCVD or Framingham) treat metabolic, renal, and cardiac organs independently, ignoring the interconnected pathophysiology of CKM syndrome.
2. **Synthetic Data Circularity & Overfitting:** Many hackathon ML models learn deterministic formulas from their own generators, producing artificial 0.99 AUCs that fail immediately in messy real-world EHR environments.
3. **Uncalibrated Output Probabilities:** Raw boosted tree margins frequently produce distorted probabilities that lead to overtreatment or undertreatment.
4. **Biologically Impossible Counterfactuals:** Free-slider simulators let users decouple interdependent biomarkers (e.g. dropping BMI by 10 points while systolic blood pressure remains unchanged).
5. **Unsafe CDS Alerts:** Recommending first-line therapies (like Metformin) without screening for renal failure contraindications risks fatal lactic acidosis.

---

## 4. Proposed Solution & Architecture
VitaRisk CDS solves these challenges through a 6-pillar unified clinical intelligence engine:

1. **Cardiorenal-Metabolic (CKM) Syndrome Joint Modeling:** Implements a 3-stage conditional cascade mirroring AHA 2026 CKM Stages (0: None, 1: Excess Adiposity, 2: Metabolic/Renal Risk, 3: Subclinical CVD, 4: Clinical CVD). The upstream predicted probabilities for T2D and CKD dynamically feed as input features into the downstream CVD and Multimorbidity models (+4.91-pp mean |SHAP| coupling escalation).
2. **5-Fold Sigmoid Probability Calibration:** Eliminates probability distortion via `CalibratedClassifierCV(method='sigmoid', cv=5)`, achieving Expected Calibration Error (ECE) ≤ 0.042 and Brier score ≤ 0.141 across all production endpoints.
3. **Decision Curve Analysis (DCA) Net Clinical Benefit:** Quantifies clinical utility using Vickers & Elkin decision curves, proving VitaRisk delivers superior net benefit over "Treat All" and "Treat None" strategies across the decision threshold spectrum (5%–40%).
4. **Probability-Space SHAP TreeExplainer:** Decomposes risk into additive percentage points ($\Delta p_i$) rather than unintuitive log-odds margins, enabling clinicians to immediately see which biomarkers elevate or protect the patient.
5. **Physiologically Coupled Counterfactual Presets:** Replaces unconstrained sliders with validated clinical trial regimens (SGLT2 inhibitors [EMPA-REG/DAPA-CKD], GLP-1 receptor agonists [LEADER/SELECT], RAAS blockade + High-Intensity Statin, Intensive Lifestyle Intervention) that automatically adjust co-dependent biomarkers.
6. **Active Fairness Mitigation & Safety Guardrails:** Implements active group-specific threshold calibration ($\tau_g$) to equalize False Negative Rates across demographic subgroups, paired with hard contraindication alerts (e.g. Metformin dose halving at eGFR 30–44 and complete cessation at eGFR < 30 per KDIGO).

---

## 5. Technology Stack
- **Machine Learning & Fairness:** Python 3.12, scikit-learn, XGBoost, LightGBM, SHAP (TreeExplainer), NumPy, Pandas, SciPy
- **EHR Interoperability Standards:** HL7 FHIR R4 (Collection Bundles, LOINC Lab Observations), HL7 CDS Hooks 1.0 (`patient-view` & `order-select` services)
- **Clinical Risk Baselines:** Tangri 4-Variable KFRE (JAMA 2016), AHA PREVENT™ 2024 Base Model (Circulation 2024), 2021 Race-Free CKD-EPI Equation
- **Backend Service:** FastAPI, Uvicorn, Pydantic v2, Joblib (sub-15ms inference latency, pre-warmed singleton lifespan)
- **Clinical Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts (Decision Curve Analysis, SHAP waterfalls, CKM triage badges, Interactive EHR CDS Hook Simulator)
- **Slide Deck Automation:** Python-pptx (14-slide executive presentation)
- **Data Engineering:** 12,000-patient longitudinal EHR cohort incorporating 33 clinical variables, unobserved latent confounders ($\epsilon \sim \mathcal{N}(0, \sigma^2)$), structured missingness (uACR 10%, hs-CRP 14%), and race-free clinical feature sets calibrated to CDC NHANES distributions.

---

## 6. Implementation & Working Prototype
The system is fully implemented and running live:
- **FastAPI Backend:** Pre-warmed singleton architecture serving:
  - `/cds-services` & `/cds-services/vitarisk-ckm-advisor`: Official HL7 CDS Hooks 1.0 discovery and execution endpoints returning native EHR alert cards with 1-click medication orders.
  - `/api/fhir/patient-bundle` & `/api/fhir/sample-bundle/{id}`: Full HL7 FHIR R4 Bundle processor mapping LOINC-coded laboratory observations directly into risk predictions.
  - `/api/predict`: Joint CKM risk scores, disease tiers, AHA CKM stage assignment, operationalized subgroup fairness decisions, and comparative baselines (KFRE vs PREVENT).
  - `/api/explain`: Probability-space SHAP Waterfall attributions in percentage points.
  - `/api/simulate`: Physiologically coupled clinical trial interventions with absolute and relative risk reduction (ARR/RRR).
  - `/api/dca`: Net clinical benefit curves across threshold probabilities (Vickers & Elkin).
  - `/api/fairness`: Unmitigated vs mitigated demographic parity and equal opportunity metrics.
  - `/api/cohorts`: 5 pre-configured canonical personas for 1-click evaluation (eliminating blank-form fatigue).
  - `/presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx`: Direct executive presentation download.
  - `/video/VitaRisk_CDS_Walkthrough.mp4`: HD demonstration video streaming.
- **Interactive Web Interface:** Single-page clinical dashboard featuring:
  - 5 canonical persona presets (eliminating blank-form fatigue).
  - Dedicated **EHR & CDS Hooks (FHIR R4)** tab with live CDS Card simulation, LOINC observation mapper, and JSON bundle inspector.
  - Live calibrated risk severity gauge & AHA CKM Stage card.
  - Siloed vs Unified CKM comparative table (Tangri KFRE vs AHA PREVENT vs VitaRisk).
  - Additive probability-space SHAP waterfall charts.
  - Guideline-Directed Medical Therapy (GDMT) prescription cards & Metformin contraindication banners.
  - Interactive clinical trial simulation dials (SGLT2i, GLP-1 RA, RAAS+Statin, Lifestyle).

---

## 7. Results & Clinical Validation
- **Discrimination:** Holds robust, realistic test ROC-AUCs bounded by latent epidemiological variance:
  - T2D: **0.798** | CKD: **0.830** | CVD: **0.794** | Multimorbidity: **0.851**
- **Calibration:** 5-fold sigmoid calibration keeps ECE ≤ **0.042** and Brier ≤ **0.141** across all production endpoints, ensuring probabilities reflect true empirical incidence.
- **Fairness Mitigation:** Validation-fitted subgroup thresholds ($\tau_g$) shrink Equal-Opportunity sensitivity gaps on held-out test data — e.g., T2D sex gap **0.077 → 0.007**, CKD age gap **0.44 → 0.13**, CVD age gap **0.65 → 0.33** — with the full 16-combination before/after audit published (including axes where demographic parity still fails and is structurally unattainable, such as age).
- **Decision Curve Utility:** At a 15% intervention threshold for CKD, VitaRisk net benefit is **0.177** vs **0.123** for Treat-All (equivalent to finding ~5 additional true high-risk progressors per 100 patients versus screening everyone, without extra follow-up burden).
- **Clinical Persona Verification:** On Persona 1 (58F, Silent Cardiorenal Progression), applying the SGLT2i trial preset reduces composite 5-year risk from 47.5% to 37.8% — a **9.7-point ARR** (T2D −13.7 pp, CVD −10.0 pp) — while on Persona 3 (67M, eGFR 36) the engine triggers mandatory Metformin dose guidance at reduced eGFR.

---

## 8. Potential Real-World Impact & Feasibility
- **Economic Value:** Preventing 10% of high-risk CKD progressions to end-stage kidney disease saves approximately $90,000 per patient annually in hemodialysis costs.
- **Workflow Integration & Primary Care Time Budget:** 
  The average primary care consultation in the US lasts just 15.7 minutes, while clinicians spend 16 minutes per patient navigating EHR documentation (Overhage et al., *JAMIA*). VitaRisk eliminates "blank-form fatigue" and alert overload by operating as an automated HL7 CDS Hooks listener. It runs asynchronously in the background (<15ms latency), only surfacing high-priority warning cards (such as Metformin contraindication at eGFR < 30 or CKM Stage 3 progression) with pre-formatted 1-click GDMT order suggestions.
- **Deployment & Interoperability:** Native HL7 FHIR R4 Bundle parsing and standard HL7 CDS Hooks 1.0 (`patient-view` & `order-select`), enabling zero-rebuild integration with Epic App Orchard, Oracle Health (Cerner), and SMART Health IT containers.
- **Clinical Autonomy & Regulatory Status:** VitaRisk is a clinician-in-the-loop decision-support prototype, not an autonomous medical device; it is not cleared or approved by the FDA or any regulator. Risk scores, tiers and treatment suggestions are decision support for clinician review. Under FDA's 2022 Clinical Decision Support Software guidance, software that emits specific risk probabilities is regulated as SaMD; any clinical deployment would require external validation, prospective evaluation, and regulatory review (likely Class II, 510(k)/De Novo). All recommendations require physician confirmation.

---

## 8b. Limitations & Validation Status (Honest Framing)

**Limitations & validation status (honest framing):** VitaRisk was developed and evaluated on a 12,000-patient synthetic twin EHR cohort generated from published NHANES 2017-2020, UK Biobank, Framingham, AHA PREVENT, KDIGO, and QDiabetes distributions with latent unobserved confounders and realistic clinical missingness. This privacy-preserving synthetic design ensures zero risk of HIPAA/GDPR Protected Health Information (PHI) leakage during development. No real patient data was used, and the model has not undergone external validation on real-world EHR data; the reported ROC-AUC (0.79–0.85), ECE (≤0.042) and Brier (≤0.141) are internal hold-out estimates on the synthetic cohort, not clinical performance guarantees. The cohort's outcome labels are stochastic (Bernoulli) draws from epidemiological hazard equations, so metrics reflect recovery of a known data-generating process rather than prospective clinical accuracy. Fairness mitigation (τ_g) is operationalized in `/predict` and the CDS Hooks stream as early-interception alerts, equalizing false negative rates across demographic groups. Treatment suggestions are guideline-mapped decision support for clinician review, not patient-specific prescriptions. VitaRisk is a research/educational prototype, not a medical device; it is not cleared or approved by the FDA or any regulator, and any clinical deployment would require external validation, prospective evaluation, and appropriate regulatory review (likely SaMD, Class II).

See `docs/CLINICAL_VALIDITY_AND_LIMITATIONS.md` for the full disclaimer, validation roadmap, and regulatory framing.

---

## 9. Submission Deliverables
1. **PowerPoint Presentation (.pptx):** `presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx` (14 slides, executive layout).
2. **Working Demo Link:** 
   - **Hosted Production URL:** `https://farhan277-vitarisk-cds.hf.space` (Hugging Face Spaces)
   - **Direct Clinical Web Dashboard:** `https://farhan277-vitarisk-cds.hf.space/app/`
   - **HL7 CDS Hooks 1.0 Services:** `https://farhan277-vitarisk-cds.hf.space/cds-services`
   - **Interactive API Documentation:** `https://farhan277-vitarisk-cds.hf.space/docs`
   - **Hugging Face Space Repository:** `https://huggingface.co/spaces/farhan277/vitarisk-cds`
   - **GitHub Repository:** `https://github.com/armageden/vitarisk-cds`
   - **Zero-Friction Local Container:** `docker run -p 8000:8000 vitarisk-cds` (FastAPI serving compiled React frontend, HL7 CDS Hooks service, and static presentation download at `http://localhost:8000`).
3. **Comprehensive Clinical Validation Report:** `docs/VALIDATION_REPORT.md` (full epidemiological formulas, calibration curves, and DCA tables).
4. **3:38 Walkthrough Video & Script:** `docs/VIDEO_SCRIPT.md` (shot-by-shot storyboard and narration).
5. **Architectural Guardrails & Remediation Guide:** `process/features/chronic-risk-stratification/references/FAILURE_MODES_AND_REMEDIATION_GUIDE.md` (FM-01 through FM-12).
6. **Automated Verification Test Suite:** `backend/test_backend.py` (12 passing pre-submission verification gates).
