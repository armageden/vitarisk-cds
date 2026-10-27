# DN-HC-01: Early Risk Stratification for Chronic Disease
## Comprehensive Failure Mode Analysis & Engineering Remediation Guide (RIPER-5 Architecture Audit)

**Target Competition:** DataNova 2026 – Global Data-thon  
**Challenge ID:** `DN-HC-01` (Healthcare & Social Impact / AI & Machine Learning)  
**Document Role:** Mandatory Architectural Guardrail & Rubric Maximization Reference  
**Location:** `process/features/chronic-risk-stratification/references/FAILURE_MODES_AND_REMEDIATION_GUIDE.md`

---

## Executive Summary: Why Good Hackathon Architectures Lose

The proposed 6-phase RIPER-5 architecture (`Next.js` + `FastAPI` + `XGBoost/LightGBM` + `SHAP` + `Fairness Suite` + `CDS Engine`) is structurally superior to 90% of typical hackathon entries. However, in competitive data-thons judged by senior data scientists and clinical informaticists, **ambitious full-stack clinical ML projects fail in predictable, high-visibility ways**.

A judge evaluating `DN-HC-01` will spend roughly **4 minutes** testing your live demo, **3 minutes** inspecting your GitHub repository and validation metrics, and **3 minutes** reviewing your slide deck. During those 10 minutes, if they spot **synthetic circularity** (a model learning your own deterministic random number generator), **uncalibrated probability outputs**, **biologically impossible counterfactuals**, or **broken clinical guideline logic**, they will aggressively dock points across **Technical Implementation (25%)**, **Innovation & Originality (20%)**, and **Data & Analytical Rigor (15%)**.

This guide catalogs all **12 failure modes** across your 6 phases and provides exact mathematical, epidemiological, and code-level remediations.

---

## Master Risk Matrix Across RIPER-5 Phases

| Failure ID | Phase | Vulnerability / Failure Mode | Rubric Criterion Impacted | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **FM-01** | Phase 1 | **Synthetic Data Circularity ("Generator-Overfitting")** | Data & Analytical Rigor (15%) | 🔴 CRITICAL |
| **FM-02** | Phase 1 | **Unrealistic EHR Cleanliness (Zero Missingness / Zero Noise)** | Data & Analytical Rigor (15%) | 🟠 HIGH |
| **FM-03** | Phase 1 | **Anachronistic Race-Based eGFR & ASCVD Equations** | Problem Relevance (15%) & Responsible AI | 🔴 CRITICAL |
| **FM-04** | Phase 2 | **Isolated Binary Classifiers Ignoring Cardiorenal-Metabolic (CKM) Coupling** | Innovation & Originality (20%) | 🟠 HIGH |
| **FM-05** | Phase 2 | **Uncalibrated Boosted Tree Probabilities Used as Clinical Risk %** | Data & Analytical Rigor (15%) | 🔴 CRITICAL |
| **FM-06** | Phase 2 | **SHAP Scale Confusion (Log-Odds vs. Probability Space) & Collinearity** | Technical Implementation (25%) | 🟡 MEDIUM |
| **FM-07** | Phase 3 | **Biologically Impossible "Free-Slider" Counterfactuals** | Impact & Feasibility (15%) | 🔴 CRITICAL |
| **FM-08** | Phase 3 | **Passive Fairness Reporting Without Active Post-Processing Mitigation** | Responsible AI / Impact (15%) | 🟠 HIGH |
| **FM-09** | Phase 3 | **Unsafe Clinical Decision Support (CDS) Contraindication Blindness** | Problem Relevance (15%) | 🟠 HIGH |
| **FM-10** | Phase 4 | **On-the-Fly TreeSHAP & Cold-Start Latency Violating `<50ms` SLA** | Technical Implementation (25%) | 🟠 HIGH |
| **FM-11** | Phase 5 | **"Blank Form Fatigue" (Forcing Judges to Type 30 Biomarkers)** | Presentation & Documentation (10%) | 🔴 CRITICAL |
| **FM-12** | Phase 6 | **Absence of Decision Curve Analysis (Net Clinical Benefit) in Validation** | Data & Analytical Rigor (15%) | 🟡 MEDIUM |

---

## Phase 1 Vulnerabilities: EHR Cohort Generation & Data Engineering

### FM-01: Synthetic Data Circularity ("The 0.99 ROC-AUC Trap")
* **Why It Will Have Issues:**
  If Phase 1 generates $N = 10,000$ synthetic patients by applying a clean linear or logistic formula over 30 biomarkers and thresholding at $p > 0.5$ to assign 5-year outcomes (`T2D`, `CKD`, `CVD`, `Multimorbidity`), your Phase 2 `XGBoost` and `LightGBM` models will simply reverse-engineer your synthetic formula. You will get an artificially high **ROC-AUC of 0.97–0.99**. Any experienced data science judge who sees a 0.99 AUC on 5-year chronic disease prognosis will immediately flag the dataset as a toy synthetic loop and slash your **Data & Analytical Rigor (15%)** score.
* **How to Fix It (Leave No Detail):**
  1. **Ground the Cohort Distributions in Real NHANES / Framingham Marginals:** Use real-world physiological parameter distributions and covariance structures derived from **CDC NHANES** (National Health and Nutrition Examination Survey) and the **2026 AHA/ACC/ADA/ASN Cardiovascular-Kidney-Metabolic (CKM) Syndrome** reference cohorts.
  2. **Use Validated Epidemiological Hazard Equations with Latent Unobserved Confounders:** Compute baseline 5-year latent risk using published clinical risk architectures (**AHA PREVENT™ Equations** for CVD/HF, **KDIGO 2024 / Kidney Failure Risk Equation [KFRE]** for CKD progression, and **QDiabetes / ADA** risk equations for T2D), but inject **20–25% variance from unobserved latent factors** (e.g., unmeasured genetic polygenic risk $\epsilon_{\text{genetic}} \sim \mathcal{N}(0, \sigma_g^2)$ and environmental volatility $\epsilon_{\text{env}} \sim \mathcal{N}(0, \sigma_e^2)$) that are **withheld from the training feature matrix**.
  3. **Sample Outcomes Stochastically (Bernoulli Draws), Never Deterministically:**
     $$\text{logit}(p_i^{(k)}) = \beta_0^{(k)} + f_{\text{clinical}}^{(k)}(\mathbf{x}_i) + g_{\text{interaction}}^{(k)}(\mathbf{x}_i) + \epsilon_{i, \text{unobserved}}^{(k)}$$
     $$Y_i^{(k)} \sim \text{Bernoulli}\left(\sigma(\text{logit}(p_i^{(k)}))\right)$$
     Because $Y_i^{(k)}$ is drawn stochastically from a Bernoulli distribution with unobserved latent variance, the Bayes Optimal Classifier ceiling is naturally bounded to **ROC-AUC 0.83–0.89**—the exact range of state-of-the-art clinical prognostic models.

### FM-02: Unrealistic EHR Cleanliness (Zero Missingness & Zero Measurement Noise)
* **Why It Will Have Issues:**
  Real EHR data is never a dense $10,000 \times 30$ float matrix. In real clinical practice, healthy patients rarely have a Urine Albumin-to-Creatinine Ratio (`uACR`), `hs-CRP`, or `Cystatin C` ordered; these labs are **Missing At Random (MAR)** conditional on age, baseline `eGFR`, or hypertension status. Furthermore, laboratory assays have biological day-to-day variance.
* **How to Fix It:**
  1. **Inject Structured Clinical Missingness (MAR & MCAR):**
     * Core vitals (`Age`, `Sex`, `SBP`, `DBP`, `BMI`): `0%` missing.
     * Standard metabolic panel (`HbA1c`, `Fasting Glucose`, `eGFR`, `Total Cholesterol`, `HDL`, `LDL`, `Triglycerides`): `3%–6%` MCAR missingness.
     * Specialized cardiorenal labs (`uACR`, `hs-CRP`, `Uric Acid`, `ALT/AST`, `NT-proBNP`): `12%–25%` MAR missingness (higher probability of being measured when `eGFR < 60` or `HbA1c > 6.5`).
  2. **Add Assay Measurement Noise:** Add Gaussian analytical noise to observed features after computing latent true biology (e.g., $\text{SBP}_{\text{obs}} = \text{SBP}_{\text{true}} + \mathcal{N}(0, 4.5\text{ mmHg})$ to reflect clinic white-coat/cuff variability; $\text{HbA1c}_{\text{obs}} = \text{HbA1c}_{\text{true}} + \mathcal{N}(0, 0.15\%)$).
  3. **Document the Imputation Pipeline:** In Phase 2, compare native tree missing-value handling (`XGBoost`/`LightGBM` sparsity-aware split finding) against `MICE` (Multiple Imputation by Chained Equations) / `IterativeImputer` for `LogisticRegression` and `RandomForest`.

### FM-03: Anachronistic Race-Based Clinical Equations
* **Why It Will Have Issues:**
  Legacy clinical calculators used race multipliers (such as the old MDRD / 2009 CKD-EPI race coefficient for `eGFR` and the 2013 Pooled Cohort Equations [PCE] for ASCVD). Modern clinical guidelines—specifically the **NKF-ASN 2021 CKD-EPI Race-Free Equation**, the **KDIGO 2024 CKD Guidelines**, and the **2024–2026 AHA PREVENT™ Equations**—explicitly removed race as a biological proxy and replaced it with **Social Determinants of Health (SDoH) / Area Deprivation Index (ADI)** while auditing race strictly in the **Fairness & Disparity Engine**.
* **How to Fix It:**
  * **Never include `Race/Ethnicity` as a direct predictive input feature inside the clinical risk model $f_\theta(\mathbf{x})$.**
  * Include **`SDI / Area Deprivation Percentile` (Social Deprivation Index)** as an optional structural feature, and store `Race/Ethnicity`, `Sex`, and `Age Group` in a protected metadata schema (`protected_attributes`) used exclusively by **Phase 3 (Fairness & Bias Auditing)** to verify that excluding race did not introduce indirect proxy discrimination.

---

## Phase 2 Vulnerabilities: ML Pipeline, Benchmarks & SHAP Explainability

### FM-04: Isolated Binary Classifiers Ignoring Cardiorenal-Metabolic (CKM) Pathophysiology
* **Why It Will Have Issues:**
  If Phase 2 trains four completely independent models (`model_t2d`, `model_ckd`, `model_cvd`, `model_multimorbidity`), two bad things happen:
  1. **Logical Contradictions:** A patient could be predicted by the independent models to have a `62%` risk of **Multimorbidity ($\ge 2$ diseases)** while their individual risks for `T2D`, `CKD`, and `CVD` are predicted at `20%`, `18%`, and `15%` (which mathematically cannot yield a 62% joint probability).
  2. **Missed Innovation Points:** You ignore the #1 paradigm in modern medicine: the **2026 AHA/ACC/ADA/ASN Cardiovascular-Kidney-Metabolic (CKM) Syndrome**, where insulin resistance (`T2D`) causes glomerular hyperfiltration and endothelial damage (`CKD`), which accelerates vascular calcification and heart failure (`CVD`).
* **How to Fix It:**
  Implement a **Stacked Out-of-Fold (OOF) Classifier Chain / Multi-Target CKM Pipeline**:
  1. **Stage 1 (Metabolic & Renal Base Models):** Train 5-fold cross-validated models for `T2D` and `CKD`, generating out-of-fold calibrated probability predictions $\hat{p}_{\text{T2D}}^{\text{OOF}}$ and $\hat{p}_{\text{CKD}}^{\text{OOF}}$.
  2. **Stage 2 (Cardiovascular Conditioning):** Train the `CVD` model using the base features **plus** the out-of-fold metabolic and renal risk states ($\hat{p}_{\text{T2D}}^{\text{OOF}}, \hat{p}_{\text{CKD}}^{\text{OOF}}$), capturing cardiorenal coupling.
  3. **Stage 3 (Coherent Joint Multimorbidity):** Compute `Multimorbidity` ($\ge 2$ conditions) both via a stacked meta-estimator and bound-checked against the joint probability distribution:
     $$P(\text{Multimorbidity} \ge 2) = 1 - P(N_{\text{diseases}} = 0) - P(N_{\text{diseases}} = 1)$$
     adjusted by the empirical polychoric correlation matrix $\Sigma_{\text{CKM}}$ between `T2D`, `CKD`, and `CVD`.

### FM-05: Uncalibrated Boosted Tree Probabilities Used as Clinical Risk Percentages
* **Why It Will Have Issues:**
  Gradient-boosted decision trees (`XGBoost`, `LightGBM`) push predictions toward 0 and 1 or distort mid-range probabilities depending on tree depth and class imbalance (especially when 5-year incidence of `CVD` or `CKD` is `12%–22%`). In clinical risk stratification, **discrimination (ROC-AUC) is useless without calibration**: if your model outputs `18%` 5-year CVD risk, and the AHA guideline triggers high-intensity statin + SGLT2i therapy at `10%` risk, an uncalibrated model will over-treat or under-treat thousands of patients.
* **How to Fix It:**
  1. **Never use `scale_pos_weight` without post-hoc probability recalibration.** `scale_pos_weight` artificially inflates raw predicted probabilities toward `0.50`.
  2. **Wrap Every Estimator in `CalibratedClassifierCV`:** Use held-out calibration folds with **Isotonic Regression** (for $N \ge 2,000$ validation samples) and **Platt Scaling (Sigmoid)** comparison.
  3. **Report Quantitative Calibration Metrics per Disease:**
     * **Brier Score:** $\text{BS} = \frac{1}{N}\sum_{i=1}^N (\hat{p}_i - y_i)^2$ (Target: `< 0.10`).
     * **Expected Calibration Error (ECE):** Across 10 decile bins (Target: `< 0.025`).
     * **Calibration Slope & Intercept ( Spiegelhalter $Z$-test ).**

### FM-06: SHAP Log-Odds vs. Probability Space Confusion & Collinear Feature Splitting
* **Why It Will Have Issues:**
  * **Issue A (Scale Mismatch):** `shap.TreeExplainer(xgb_model)` outputs SHAP values in **raw margin (log-odds) space** by default (`model_output="raw"`), whereas your UI displays **calibrated 5-year risk in percentage points (`0%–100%`)**. If your Next.js waterfall chart displays a baseline of `0.15` (probability) and adds a raw log-odds SHAP value of `+1.42`, the bar lands at `157%` risk—an instant credibility killer in front of judges.
  * **Issue B (Collinear Dilution):** Including highly collinear feature pairs (`BMI` + `Waist Circumference`, `SBP` + `MAP` [Mean Arterial Pressure], `Total Cholesterol` + `Non-HDL Cholesterol` + `LDL`, `Serum Creatinine` + `eGFR`) splits SHAP importance arbitrarily between twins, making clinically critical drivers look weak.
* **How to Fix It:**
  1. **Compute Probability-Space Attributions for the UI:** Initialize `shap.TreeExplainer(base_tree_model, data=X_background_100, feature_perturbation="interventional", model_output="probability")` so that:
     $$\sum_{j=1}^M \phi_j(\mathbf{x}) + \mathbb{E}[f(\mathbf{X})] = \hat{p}(\mathbf{x}) \in [0, 1]$$
     Every SHAP bar on your Next.js waterfall chart can then be expressed cleanly in **percentage points of 5-year risk** (e.g., `HbA1c = 7.8% contributes +18.4% to 5-Year T2D Risk`).
  2. **Enforce Orthogonal / Clinically Canonical Feature Selection (VIF Audit):** Compute Variance Inflation Factor (`VIF`) in Phase 1/2. Instead of passing raw `Serum Creatinine` and `eGFR` simultaneously, pass `eGFR` (which already standardizes Creatinine for Age/Sex) and `uACR`. Instead of passing `Total Cholesterol`, `HDL`, and `LDL` independently with collinear ratios, pass `Non-HDL Cholesterol`, `HDL`, `Triglycerides`, and `Statin_Therapy_Active`.

---

## Phase 3 Vulnerabilities: Fairness Auditing, Counterfactuals & CDS Engine

### FM-07: Biologically Impossible "Free-Slider" Counterfactuals
* **Why It Will Have Issues:**
  If your `/simulate` endpoint and Next.js counterfactual UI allow a judge to:
  * Change **immutable features** (`Age`, `Sex`, `Family History`), OR
  * Drag `BMI` from `36 kg/m²` down to `21 kg/m²` while `HbA1c`, `Systolic BP`, `Triglycerides`, and `hs-CRP` remain completely frozen, OR
  * Drag `eGFR` from `32` up to `115` in a patient with irreversible Stage 3b CKD (where realistic therapy slows decline or moderately improves hemodynamics rather than regenerating nephrons back to age-20 levels),
  a clinician or healthcare AI judge will dismiss the simulator as disconnected from physiology.
* **How to Fix It:**
  Build a **Physiologically Constrained Counterfactual Engine** in Phase 3:
  1. **Partition Features into 3 Strict Mutability Tiers:**
     * **Tier 0 — Immutable (Locked in UI):** `Age`, `Sex`, `Race/Ethnicity`, `Family_History_CVD_T2D`, `Baseline_CKD_Stage`.
     * **Tier 1 — Directly Actionable / Modifiable Biomarkers (Bounded Sliders):**
       * `HbA1c`: lower bound `4.8%`, max realistic 12-month reduction `Delta >= -2.5%`.
       * `Systolic_BP`: lower bound `95 mmHg`, target guideline corridor `110–129 mmHg`.
       * `BMI`: max realistic 12-month intervention delta `-15%` to `-20%` of baseline BMI (reflecting GLP-1/GIP agonist or intensive lifestyle ceilings).
       * `LDL_Cholesterol`: lower bound `35 mg/dL` (reflecting high-intensity statin + PCSK9i ceiling).
       * `uACR`: reducible by up to `30%–50%` via ACEi/ARB + SGLT2i + Finerenone therapy.
       * `Smoking_Status`: toggle `Current -> Former` (never `Current -> Never`, because pack-year vascular history does not vanish overnight).
     * **Tier 2 — Coupled / Co-Varying Biomarkers (Auto-Updated via Empirical Sensitivity Matrix $\mathbf{J}_{\text{phys}}$):**
       When the user adjusts $\Delta \text{BMI}$ or triggers an **Evidence-Based Clinical Intervention Preset**, automatically propagate coupled physiological shifts (with an option to override):
       $$\Delta \text{HbA1c}_{\text{coupled}} \approx 0.12 \times \Delta \text{BMI}, \quad \Delta \text{SBP}_{\text{coupled}} \approx 1.2 \times \Delta \text{BMI}, \quad \Delta \text{TG}_{\text{coupled}} \approx 4.5 \times \Delta \text{BMI}$$
  2. **Include 4 One-Click Evidence-Based Intervention Presets in `/simulate`:**
     * **Preset A:** *SGLT2 Inhibitor Initiation (e.g., Dapagliflozin / Empagliflozin)* — models `-0.6% HbA1c`, `-4 mmHg SBP`, `-35% uACR`, and attenuated eGFR slope decline (per DAPA-CKD / EMPA-KIDNEY trial magnitudes).
     * **Preset B:** *GLP-1 / Dual Incretin Therapy + Lifestyle* — models `-12% BMI`, `-1.4% HbA1c`, `-6 mmHg SBP`, `-18% Triglycerides` (per SELECT / SURMOUNT clinical magnitudes).
     * **Preset C:** *RAAS Blockade (ACEi/ARB) + High-Intensity Statin* — models `-14 mmHg SBP`, `-45% LDL-C`, `-30% uACR`.
     * **Preset D:** *Intensive Lifestyle & Smoking Cessation* — models `Current -> Former Smoker`, `+150 min/wk Physical Activity`, `-5% BMI`, `-7 mmHg SBP`.

### FM-08: Passive Fairness Reporting Without Active Mitigation ("Show-Don't-Fix Trap")
* **Why It Will Have Issues:**
  Many hackathon teams compute `Disparate Impact` and `Equalized Odds` in Phase 3, display a chart showing that one demographic subgroup has a `0.74` Disparate Impact or a higher False Negative Rate (under-diagnosis), and stop there. Reporting bias without providing a **mitigated model mode** leaves half the **Responsible AI** points on the table.
* **How to Fix It:**
  Implement **Group-Specific Post-Processing Threshold Calibration (Equalized Sensitivity / Opportunity Optimization)** in Phase 3:
  1. For a clinical screening/stratification tool, the most dangerous error is a **False Negative** (missing a high-risk patient who needs early preventive care). Therefore, **Equalized Opportunity (True Positive Rate / Sensitivity parity across subgroups)** and **Calibration Within Groups** are your primary clinical fairness criteria.
  2. Compute both **Unmitigated (Global Threshold $\tau = 0.20$)** and **Fairness-Calibrated (Subgroup-Adjusted Thresholds $\tau_g$ or Sample-Reweighted)** metrics across `Sex`, `Age (<50, 50-65, >65)`, `Race/Ethnicity`, and `Socioeconomic Deprivation Quartile`.
  3. Expose a **"Before vs. After Fairness Mitigation"** toggle in the `/fairness` API response so judges can visually see Disparate Impact move into the safe `[0.85, 1.15]` corridor and Subgroup Sensitivity Differences drop below `< 0.03` with less than a `0.008` trade-off in overall ROC-AUC.

### FM-09: Unsafe Clinical Decision Support (CDS) Contraindication Blindness
* **Why It Will Have Issues:**
  If your Phase 3 CDS engine maps `High CKD Risk + High T2D Risk` to a hardcoded string like `"Recommend Metformin + ACE Inhibitor + SGLT2i"` without checking the patient's actual biomarkers, it can recommend **Metformin to a patient with `eGFR = 22 mL/min/1.73m²`** (a classic board-exam contraindication due to lactic acidosis risk) or recommend an **ACEi/ARB without flagging hyperkalemia monitoring**.
* **How to Fix It:**
  Build a deterministic **Rule-Guardrailed Clinical Guideline Matrix** aligned with **ADA 2026**, **KDIGO 2024**, and **AHA/ACC 2026 CKM Guidelines**:
  * **Guardrail 1 (`eGFR` Contraindication Check):**
    * If `eGFR < 30 mL/min/1.73m²`: Explicitly flag `"⚠️ CONTRAINDICATION ALERT: Avoid Metformin initiation/continuation (eGFR < 30). Prefer GLP-1 RA or SGLT2i (if eGFR >= 20 per KDIGO 2024)."`
    * If `30 <= eGFR < 45 mL/min/1.73m²`: Flag `"⚠️ DOSE ADJUSTMENT: Halve Metformin max dose (<= 1000 mg/day); monitor renal function every 3 months per KDIGO G3b guidelines."`
  * **Guardrail 2 (Albuminuria + Hypertension Check):**
    * If `uACR >= 30 mg/g` and `SBP >= 130 mmHg`: Trigger `"KDIGO 2024 Grade 1A: Initiate maximally tolerated ACEi or ARB + SGLT2i (if eGFR >= 20); monitor serum potassium and creatinine within 2–4 weeks."`
  * **Guardrail 3 (AHA PREVENT / CKM Stage Mapping):**
    * Automatically classify the patient into **AHA CKM Syndrome Stages 0 to 4** (`Stage 0`: No risk factors; `Stage 1`: Excess/dysfunctional adiposity; `Stage 2`: Metabolic risk factors or moderate-to-high risk CKD; `Stage 3`: Subclinical CVD or very-high-risk CKD / high predicted risk; `Stage 4`: Clinical CVD in CKM).

---

## Phase 4 Vulnerabilities: FastAPI Backend Services

### FM-10: On-the-Fly TreeSHAP & Cold-Start Latency Violating the `<50ms` SLA
* **Why It Will Have Issues:**
  Your Phase 4 acceptance criterion promises **sub-50ms latency** across `/predict`, `/explain`, and `/simulate`. However:
  1. Instantiating `shap.TreeExplainer` inside an endpoint handler takes **400ms–1,500ms** per request.
  2. Running `TreeExplainer.shap_values()` across 4 separate multi-hundred-tree ensembles sequentially while dragging a slider in Next.js will generate **250ms–600ms lag**, causing UI stutter during live counterfactual drags.
  3. Free-tier cloud hosts (Render, Hugging Face Spaces, Railway) spin down after 15 minutes of inactivity, causing a **30–50 second cold start** when a DataNova judge opens your link.
* **How to Fix It:**
  1. **Singleton Model & Explainer Lifespan Pre-Warming:** Load all calibrated models, background matrices, and `TreeExplainer` objects **once** inside FastAPI's `@asynccontextmanager async def lifespan(app: FastAPI):` and run a warm-up dummy inference during container boot so Numba/C++ extensions compile before the first HTTP request.
  2. **Use Native C++ `pred_contribs=True` for Real-Time Slider Calls:** Both `XGBoost` (`booster.predict(dmatrix, pred_contribs=True)`) and `LightGBM` (`booster.predict(X, pred_contrib=True)`) compute exact TreeSHAP values natively in C++ in **1.8ms–4.5ms** (10x faster than Python wrapper overhead). Use native `pred_contribs` inside `/simulate` and `/explain` to guarantee `<15ms` p95 response times.
  3. **Debounced `/simulate` + Pre-Computed Cohort Cache:** Pre-compute `/cohorts` and `/fairness` JSON payloads into memory on startup (`0.4ms` response time), and debounce Next.js slider requests at `60ms` (or run lightweight client-side Taylor expansion interpolation between `15ms` FastAPI roundtrips).

---

## Phase 5 Vulnerabilities: Next.js Interactive Clinical Web App

### FM-11: "Blank Form Fatigue" (The #1 Reason Judges Bounce in 20 Seconds)
* **Why It Will Have Issues:**
  If a judge clicks your working demo link and lands on a dashboard with **30 empty numeric inputs** (`HbA1c`, `eGFR`, `uACR`, `Fasting Glucose`, `LDL`, `HDL`, `Triglycerides`, `SBP`, `DBP`, `BMI`, `Waist Circumference`, `hs-CRP`, etc.) waiting for them to type values and click "Run", **they will not type 30 numbers**. Worse, if they type random numbers, they won't know what a realistic `uACR` or `eGFR` value is.
* **How to Fix It:**
  1. **Boot Directly into a Pre-Loaded Canonical Patient with Live Visuals Rendered on Mount (`t = 0ms`):** The moment the page loads, Patient Persona #1 must already be selected, scored, explained via SHAP waterfall, and loaded into the counterfactual simulator.
  2. **Provide a Prominent 5-Persona "One-Click Clinical Case Selector" Bar at the Top of the App (`/patients/sample`):**
     * **Persona 1 — "Silent Cardiorenal Progression" (Age 58, F):** Moderately elevated `HbA1c (6.3%)`, stage 3a `eGFR (52 mL/min)`, elevated `uACR (145 mg/g)`, `SBP 144 mmHg`. Demonstrates why standard single-disease screening misses multimorbidity risk.
     * **Persona 2 — "Early Metabolic Syndrome / Pre-Diabetic" (Age 42, M):** Normal `eGFR (96 mL/min)`, high `BMI (33.8 kg/m²)`, `Triglycerides (240 mg/dL)`, `HbA1c (6.1%)`. Shows massive counterfactual risk reduction from early lifestyle / GLP-1 intervention.
     * **Persona 3 — "High-Risk Multi-Morbid CKM Stage 3" (Age 67, M):** `HbA1c (8.4%)`, `eGFR (36 mL/min - Stage 3b)`, `uACR (410 mg/g)`, `SBP (158 mmHg)`, current smoker. Triggers the **Metformin Dose/Contraindication Guardrail** and **KDIGO Dual SGLT2i + ACEi Guideline**.
     * **Persona 4 — "Discordant Lipid / Inflammatory Vascular Risk" (Age 54, F):** Normal `HbA1c (5.4%)` and normal `BMI (23.5)`, but high `LDL (178 mg/dL)`, elevated `hs-CRP (4.8 mg/L)`, `SBP (138 mmHg)`, positive family history. Demonstrates non-diabetic CVD stratification.
     * **Persona 5 — "Optimal Baseline / Healthy Control" (Age 39, F):** Optimal biomarkers across all 30 dimensions (`<3%` 5-year risk across all conditions; `CKM Stage 0`).

---

## Phase 6 Vulnerabilities: Presentation Deck, Validation Report & Submission

### FM-12: Missing Decision Curve Analysis (Net Clinical Benefit) & Reproducibility Proofs
* **Why It Will Have Issues:**
  Standard ML metrics (`ROC-AUC`, `F1-Score`, `Accuracy`) do not tell a hospital or health system whether deploying a model actually improves patient outcomes compared to **"Treat All"** or **"Treat None"** strategies across clinical decision thresholds ($p_t \in [0.05, 0.40]$).
* **How to Fix It:**
  Include **Decision Curve Analysis (Vickers & Elkin Net Benefit)** in Phase 2 and feature the plot prominently in `VALIDATION_REPORT.md` and Slide 8 of your `python-pptx` deck:
  $$\text{Net Benefit}(p_t) = \frac{\text{TP}}{N} - \frac{\text{FP}}{N} \times \left(\frac{p_t}{1 - p_t}\right)$$
  Showing that your calibrated `XGBoost/LightGBM` CKM stack achieves higher **Net Clinical Benefit** than both "Treat All", "Treat None", and single-biomarker rules (`HbA1c >= 6.5%` alone or `eGFR < 60` alone) across the entire clinical decision range ($5\%$ to $35\%$ 5-year risk) is the gold-standard proof in clinical AI publications (NEJM AI / Lancet Digital Health).

---

## Pre-Submission Verification Checklist (Gatekeeper for Phase 6)

Before marking the RIPER-5 Phase Program complete, verify all 10 gates:

- [ ] **Gate 1 (No Toy AUC):** Held-out test set ROC-AUC across `T2D`, `CKD`, `CVD`, and `Multimorbidity` sits between `0.81` and `0.91` (never `> 0.96`).
- [ ] **Gate 2 (Calibration Verified):** Every disease model has a held-out **Brier Score `< 0.11`** and **ECE `< 0.03`**, with reliability diagrams saved to `reports/figures/`.
- [ ] **Gate 3 (Race-Free Clinical Inputs):** `race_ethnicity` is verified absent from `MODEL_FEATURE_COLUMNS` and present exclusively in `FAIRNESS_AUDIT_COLUMNS`.
- [ ] **Gate 4 (Coherent Multimorbidity):** For 100% of test patients, predicted `P(Multimorbidity)` does not exceed the upper Fréchet-Hoeffding bound of the marginal disease probabilities.
- [ ] **Gate 5 (Probability-Space SHAP):** Waterfall explanations sum to $\hat{p}(\mathbf{x}) - \mathbb{E}[f(\mathbf{X})]$ in percentage-point units (`%`), with zero collinear twin features (`VIF < 5.0`).
- [ ] **Gate 6 (Physiological Counterfactuals):** Immutable features (`Age`, `Sex`, `Family History`) are locked in `/simulate`, and 4 clinical trial intervention presets (*SGLT2i*, *GLP-1 RA*, *RAAS + Statin*, *Intensive Lifestyle*) work in one click.
- [ ] **Gate 7 (Active Fairness Mitigation):** `/fairness` returns both **Unmitigated** and **Threshold-Calibrated Mitigated** metrics showing Disparate Impact within `[0.80, 1.25]` and Equalized Opportunity difference `< 0.03`.
- [ ] **Gate 8 (Contraindication Safety):** CDS output automatically flags `Metformin` contraindication at `eGFR < 30` and dose reduction at `eGFR 30–44`, and maps patients to **2026 AHA CKM Syndrome Stages 0–4**.
- [ ] **Gate 9 (Sub-50ms Latency):** `/predict`, `/explain`, and `/simulate` achieve `< 50ms` p95 latency under `pytest` benchmark tests using pre-warmed models and native C++ `pred_contribs`.
- [ ] **Gate 10 (Zero-Friction Judge UX):** Next.js app boots directly into **Persona 1 ("Silent Cardiorenal Progression")** with all charts populated immediately and a 5-persona selector bar at the top of the screen.
