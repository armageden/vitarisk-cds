# VitaRisk CDS — Devpost Submission Master Kit
**Competition:** DataNova 2026 Global Data-thon  
**Track:** Healthcare and AI / Social Impact (`DN-HC-01`)  
**Submission Portal:** Devpost Submission Form (`/submissions/1292590`)  

---

## STEP 1: Project Overview

### Project Name (Max 60 characters)
```text
VitaRisk CDS: Explainable CKM Risk Stratification
```
*(49 characters — fits comfortably within the 60-character limit)*

### Elevator Pitch (Max 200 characters)
```text
Calibrated multi-organ AI predicting 5-year CKM onset with probability SHAP, HL7 FHIR/CDS Hooks, and safety guardrails to detect silent cardiorenal disease.
```
*(158 characters — fits within the 200-character limit)*

### Thumbnail Image (3:2 Ratio)
Upload the pre-cropped, high-resolution thumbnail:
* **File path:** `presentation/thumbnail.png` (1380 × 920, 3:2 ratio, 154 KB)

---

## STEP 2: Project Details

### Built With (Tags — up to 25)
Copy and paste these tags into the tag field:
```text
python, fastapi, react, xgboost, shap, hl7-fhir, cds-hooks, scikit-learn, tailwind-css, huggingface-spaces, vite, recharts, healthcare, clinical-decision-support, responsible-ai, decision-curve-analysis, epidemiology, machine-learning, artificial-intelligence, cardiorenal-metabolic, safety-guardrails
```

### "Try It Out" Links
Add each of the following links:
* **Live Web Application:** `https://farhan277-vitarisk-cds.hf.space/app/`
* **HL7 CDS Hooks 1.0 Services:** `https://farhan277-vitarisk-cds.hf.space/cds-services`
* **Interactive OpenAPI Documentation:** `https://farhan277-vitarisk-cds.hf.space/docs`
* **Hugging Face Space:** `https://huggingface.co/spaces/farhan277/vitarisk-cds`
* **GitHub Repository:** `https://github.com/armageden/vitarisk-cds`
* **Executive Presentation (.pptx):** `https://farhan277-vitarisk-cds.hf.space/presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx`

### Project Media (Image Gallery — up to 15 images)
Upload all 6 high-resolution screenshots from `presentation/screenshots/`:
1. `presentation/screenshots/screenshot_marcus_vance_contraindication.png`  
   *(Persona 3 CKM Stage 4, Metformin Contraindication, and Tangri KFRE & AHA PREVENT comparative baselines)*
2. `presentation/screenshots/screenshot_ehr_cds_hooks.png`  
   *(Standard HL7 FHIR R4 Bundle Ingestion & CDS Hooks 1.0 Real-Time Patient-View Advisory Cards)*
3. `presentation/screenshots/screenshot_shap_waterfall.png`  
   *(Calibrated probability-space SHAP Waterfall chart decomposing patient biomarkers in % risk scale)*
4. `presentation/screenshots/screenshot_shap_counterfactual_trial.png`  
   *(SGLT2i Initiation trial preset with ARR/RRR de-escalation)*
5. `presentation/screenshots/screenshot_dca_net_benefit.png`  
   *(Decision Curve Analysis proving net clinical benefit across 17 decision thresholds)*
6. `presentation/screenshots/screenshot_fairness_mitigation.png`  
   *(Algorithmic Fairness Audit with active validation-fitted subgroup threshold \(\tau_g\) calibration)*

### Video Demo Link
* **Uploaded Video:** `https://farhan277-vitarisk-cds.hf.space/video/VitaRisk_CDS_Walkthrough.mp4` (or your YouTube/Vimeo URL after uploading `presentation/video/VitaRisk_CDS_Walkthrough.mp4`)

---

### About the Project (Markdown Story with LaTeX Math)
*(Copy and paste the entire block below into the "About the project" text area)*

```markdown
## Inspiration

Chronic diseases—specifically Type 2 Diabetes (T2D), Chronic Kidney Disease (CKD), and Cardiovascular Disease (CVD)—account for **74% of all non-communicable deaths globally** and over **$4.1 trillion in annual US healthcare expenditures**. Over 90% of patients with early-stage chronic kidney disease and prediabetes remain entirely asymptomatic until irreversible vascular remodeling and nephron loss have already occurred.

Current risk assessment models in clinical practice suffer from critical systemic vulnerabilities:
1. **Siloed Disease Thinking:** Conventional calculators (like standard ASCVD or Framingham) treat metabolic, renal, and cardiac organs independently, ignoring the interconnected pathophysiology emphasized in the American Heart Association (AHA) 2026 Cardiorenal-Metabolic (CKM) Syndrome staging consensus.
2. **Synthetic Data Circularity & Overfitting:** Many hackathon ML models learn deterministic formulas from their own data generators, reporting artificial 0.99 ROC-AUCs that collapse immediately when faced with real-world biological noise.
3. **Uncalibrated Output Probabilities:** Raw boosted tree margins frequently produce distorted probabilities that lead to overtreatment or undertreatment.
4. **Biologically Impossible Counterfactuals:** Free-slider simulators let users decouple interdependent biomarkers (e.g., dropping BMI by 10 points while systolic blood pressure remains unchanged).
5. **Unsafe CDS Alerts:** Recommending first-line therapies (like Metformin) without screening for severe renal failure risks fatal lactic acidosis.

We built **VitaRisk CDS** to bridge this gap: an explainable, calibrated, guardrailed clinical decision support platform that turns routine longitudinal EHR data into safe, guideline-directed early interventions during standard 15-minute consultations.

---

## What It Does

VitaRisk CDS provides a 6-pillar unified clinical intelligence engine:

1. **Cardiorenal-Metabolic (CKM) Syndrome Cascade:** Implements a 3-stage conditional cascade mirroring AHA 2026 CKM Stages (0: None, 1: Excess Adiposity, 2: Metabolic/Renal Risk, 3: Subclinical CVD, 4: Clinical CVD). The upstream predicted probabilities for T2D and CKD dynamically feed as input features into the downstream CVD and Multimorbidity models (+4.91-pp mean |SHAP| coupling escalation).
2. **Comparative Clinical Baselines in Real-Time:** Directly benchmarks VitaRisk against standard guideline calculators side-by-side:
   - **Tangri Kidney Failure Risk Equation (KFRE 4-variable):** 2-year and 5-year progression to End-Stage Renal Disease (ESRD).
   - **AHA PREVENT™ (2024 Base Model):** 10-year total cardiovascular risk.
3. **5-Fold Sigmoid Probability Calibration:** Eliminates probability distortion via `CalibratedClassifierCV(method='sigmoid', cv=5)`, achieving Expected Calibration Error (ECE) \(\le 0.042\) and Brier score \(\le 0.141\) across all production endpoints.
4. **Probability-Space SHAP TreeExplainer:** Decomposes risk into additive percentage points (\(+\Delta p_i\%\)) rather than unintuitive log-odds margins, enabling clinicians to immediately see which biomarkers elevate or protect the patient.
5. **Physiologically Coupled Counterfactual Presets:** Replaces unconstrained sliders with validated clinical trial regimens (SGLT2 inhibitors [EMPA-REG/DAPA-CKD], GLP-1 receptor agonists [LEADER/SELECT], RAAS blockade + Statin, Intensive Lifestyle) that automatically adjust co-dependent biomarkers and calculate Absolute Risk Reduction (ARR).
6. **Clinical Safety Guardrails & Active Fairness:** Flags mandatory Metformin dose halving at eGFR 30–44 and issues a hard-stop contraindication banner at eGFR < 30 mL/min/1.73m² to prevent lactic acidosis. Active validation-fitted threshold calibration (\(\tau_g\)) shrinks subgroup sensitivity gaps across sex and age groups.
7. **Native HL7 FHIR R4 & CDS Hooks 1.0 Services:** Ingests standard FHIR R4 Bundles (Patient, Observation, Condition) and evaluates `patient-view` hooks at `/cds-services/vitarisk-ckm-advisor`, returning structured advice cards and 1-click orders to hospital EHRs (Epic, Cerner, Meditech).

---

## How We Built It

- **Machine Learning Pipeline:** Trained on a 12,000-patient longitudinal EHR cohort incorporating 33 clinical variables, unobserved latent biological confounders (\(\epsilon \sim \mathcal{N}(0, \sigma^2)\)), and structured missingness (uACR 10%, hs-CRP 14%). Uses scikit-learn, XGBoost, and SHAP TreeExplainer.
- **Race-Free Clinical Features:** Implemented the 2021 race-free CKD-EPI eGFR equation, eliminating race from model input features while retaining demographic attributes for equitable audit tracking.
- **Decision Curve Analysis (DCA):** Modeled Vickers & Elkin net benefit curves across 17 decision thresholds (\(p_t \in [0.05, 0.40]\)), proving VitaRisk delivers higher net benefit than "Treat All" or "Treat None".
- **Backend Architecture:** High-performance FastAPI singleton pre-warming models in memory, delivering sub-15ms inference latency (<50ms SLA) with full OpenAPI documentation.
- **Frontend Application:** Modern, responsive React SPA with Tailwind CSS, Lucide icons, and Recharts, featuring 5 canonical personas for 1-click evaluation without form fatigue.
- **Cloud Deployment:** Live-deployed on Hugging Face Spaces with ZeroGPU compute and integrated Gradio / FastAPI / React routing.

---

## Challenges We Ran Into

1. **Eliminating Synthetic Data Circularity:** When generating synthetic EHR cohorts, it is tempting to use clean deterministic risk equations. However, gradient boosted trees easily achieve artificial 0.99 AUCs on such data. We introduced latent unobserved confounders and non-linear interactions to bound ROC-AUCs to realistic clinical ranges (0.79 to 0.85).
2. **Translating Log-Odds to Clinical Intuition:** Raw SHAP values are in log-odds margins, which mean nothing to a primary care doctor in a 15-minute consult. We engineered a calibrated probability-space waterfall mapping each feature's contribution into percentage points (\(+\Delta p_i\%\)), ensuring baseline risk + feature contributions sum exactly to the final calibrated probability dial.
3. **Preventing Biologically Impossible Counterfactuals:** Unconstrained sliders let users drop blood pressure while keeping heart rate and renal markers static. We coupled biomarker changes using empirical effect sizes from landmark randomized controlled trials (EMPA-REG OUTCOME, DAPA-CKD, LEADER).
4. **ZeroGPU Hugging Face Handshake:** Orchestrating Gradio 6, FastAPI sub-routing, static SPA serving, and Hugging Face ZeroGPU process discovery required careful lifecycles and router index insertions.

---

## Accomplishments That We're Proud Of

- **Realistic, Defensible Metrics:** Bounded ROC-AUCs reflecting real clinical distributions:
  - Type 2 Diabetes: **0.798**
  - Chronic Kidney Disease: **0.830**
  - Cardiovascular Disease (MACE): **0.794**
  - Multimorbidity: **0.851**
- **Strict Calibration:** 5-fold sigmoid post-hoc calibration keeps Expected Calibration Error (ECE) \(\le 0.042\) on held-out test data.
- **Demonstrated Net Clinical Benefit:** At a 15% intervention threshold for CKD, VitaRisk net benefit is **0.177** vs **0.123** for Treat-All (equivalent to finding 5 additional true high-risk progressors per 100 patients without extra follow-up burden).
- **Interoperability Standards:** Production-grade HL7 FHIR R4 Bundle parsing and standard CDS Hooks 1.0 services tested live on Hugging Face.
- **Zero-Friction Persona Evaluation:** 5 canonical clinical personas (Silent Cardiorenal 58F, Metabolic-Prediabetic 45M, High-Risk CKM Stage 4 67M, Well-Managed Post-MI 72F, Healthy Young Baseline 32F) eliminate judge form fatigue.
- **All 10 Pre-Submission Gates Passed:** 100% green verification suite in `backend/test_backend.py`.

---

## What We Learned

- **CKM Cross-Coupling is Real:** Upstream renal and metabolic damage directly accelerates cardiovascular vascular stiffening and plaque vulnerability; incorporating predicted renal risk into the CVD model added +4.91 percentage points of explanatory importance (mean |SHAP|).
- **Fairness Requires Operational Mitigation:** Passive disparity audits are insufficient; validation-fitted subgroup threshold calibration (\(\tau_g\)) is necessary to actively equalize False Negative Rates and avoid systematically undertreating vulnerable populations.
- **Guardrails Save Lives:** Clinical AI must prioritize patient safety over raw prediction; hard contraindication checks for nephrotoxic or lactic acidosis risks are mandatory in any clinical CDS.

---

## Limitations & Ethical Transparency (SaMD Roadmap)

VitaRisk CDS was developed and evaluated on a 12,000-patient synthetic twin EHR cohort modeled from published NHANES, UK Biobank, Framingham, and KDIGO distributions. This privacy-preserving design ensures zero risk of HIPAA/GDPR Protected Health Information (PHI) leakage.

VitaRisk is an educational and clinical research prototype and has not yet undergone prospective clinical trials or FDA clearance. Under FDA's 2022 Clinical Decision Support Software guidance, software outputting specific risk probabilities is regulated as Software as a Medical Device (SaMD, Class II 510(k)/De Novo). All recommendations are advisory for licensed clinician review.

---

## What's Next for VitaRisk CDS

- **Phase 2 (Retrospective EHR Validation):** Multi-center external validation on MIMIC-IV and All of Us research cohorts.
- **Phase 3 (Prospective Primary Care Pilot):** 6-month randomized controlled pilot assessing clinician decision adoption and HbA1c/eGFR trajectory improvements.
- **Phase 4 (Enterprise Integration & Regulatory Review):** Epic App Orchard and Oracle Health marketplace deployment with FDA SaMD pre-market review.
```

---

## STEP 3: Additional Info

### Upload a File (Limit: 35 MB)
Upload the complete pre-built submission archive:
* **File path:** `presentation/vitarisk_cds_submission_package.zip` (1.6 MB)
* **Contents:**
  - Executive 14-slide presentation deck: `VitaRisk_CDS_DataNova2026_Presentation.pptx`
  - Clinical evidence and validation report: `VALIDATION_REPORT.md`
  - Regulatory roadmap & limitations disclosure: `CLINICAL_VALIDITY_AND_LIMITATIONS.md`
  - Complete Devpost submission text: `SUBMISSION_DEVPOST.md`
  - 5-chapter walkthrough video storyboard & narration: `VIDEO_SCRIPT.md`
  - All 6 high-resolution UI screenshots (FHIR R4, CKM Stage 4, SHAP waterfall, SGLT2i trial, DCA, Fairness)
