# VitaRisk CDS: 2.5-Minute Competition Walkthrough Script
**Target Competition:** DataNova 2026 Global Data-thon  
**Challenge ID:** `DN-HC-01: Early Risk Stratification for Chronic Disease`  
**Target Duration:** Exactly 2 minutes 30 seconds (150 seconds)  
**Presenter:** Project Lead / Clinical AI Engineer  
**Display Resolution:** 1080p (1920x1080) or 1440p  
**Audio:** Clear microphone, quiet background  

---

### Segment 1: The CKM Syndrome Gap & Why Isolated Models Fail (0:00 – 0:30)
* **Screen Display:** Open on Slide 1 of the PowerPoint deck or the Hero Header of the live web app (`http://localhost:8000`), then transition to Slide 2 ("The Silent Epidemic").
* **Presenter Teleprompter / Narration:**
  > "Hello DataNova judges. Chronic diseases—specifically Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease—account for 74% of global deaths and over $4 trillion in US healthcare costs.
  >
  > The tragedy is that early-stage kidney disease and prediabetes progress silently: over 90% of patients are asymptomatic until irreversible organ damage occurs.
  >
  > But current calculators like Framingham or ASCVD fail because they treat organs as isolated silos, ignoring the American Heart Association's 2026 Cardiorenal-Metabolic (CKM) Syndrome staging.
  >
  > Introducing **VitaRisk CDS**—an explainable, guardrailed clinical decision support platform that turns silent longitudinal EHR data into calibrated early interventions."

---

### Segment 2: Live UI Click-Through — 5 Canonical Personas, CKM Cascade & Probability SHAP (0:30 – 1:15)
* **Screen Display:** Browser on `http://localhost:8000`. 
  1. Show top bar with **Quick Personas**.
  2. Click **Persona 1: Silent Cardiorenal Progression (58F)**. Point out the joint risk dials.
  3. Click **Persona 3: High-Risk CKM Stage 3 (67M)**. Show the **CKM Stage 3 Badge** appear in under 15ms.
  4. Point to the **Downstream CVD Cascade Risk**: show that upstream CKD and T2D add an automatic **+5.15% risk boost** to cardiovascular risk.
  5. Click the **Explainable AI (SHAP Waterfall)** tab: show the additive percentage point bars.
* **Presenter Teleprompter / Narration:**
  > "Here is our live full-stack system. To eliminate form fatigue for judges, we engineered 5 canonical clinical personas representing diverse real-world disease trajectories.
  >
  > Clicking Persona 3—an elderly patient with Stage 3b CKD and diabetes—calculates risk across all conditions in under 15 milliseconds.
  >
  > Notice our 3-stage CKM cascade: because the patient has elevated kidney and metabolic damage, VitaRisk automatically models the biological cross-coupling, elevating downstream cardiovascular risk by plus 5.15 percentage points.
  >
  > In our Explainability tab, we replace unintuitive log-odds with additive percentage-point SHAP waterfalls. A clinician sees in five seconds that elevated HbA1c is adding plus 24.37% risk, while normal HDL offers a protective buffer."

---

### Segment 3: SGLT2i Trial Preset & Hard Metformin Contraindication Guardrail (1:15 – 1:55)
* **Screen Display:** 
  1. Switch to **What-If Intervention Simulator** tab.
  2. Point to the sliders, then click the **"SGLT2i Trial" Preset button**.
  3. Show the dynamic ARR calculation (-18.4% ARR in CKD, -7.2% ARR in CVD).
  4. Switch back to **Patient Risk Calculator & CDS** tab: point to the prominent **Amber/Red Contraindication Alert Banner** reading:
     `DOSE ADJUSTMENT REQUIRED: Halve Metformin maximum daily dose (<= 1,000 mg/day). Monitor renal function every 3 months per KDIGO Stage G3b guidelines.`
* **Presenter Teleprompter / Narration:**
  > "Most hackathon tools allow free sliders that generate biologically impossible counterfactuals. VitaRisk implements physiologically coupled presets calibrated against landmark clinical trials like EMPA-REG and DAPA-CKD.
  >
  > Clicking the SGLT2 inhibitor trial preset dynamically models coupled weight, glucose, and renal improvements, producing an 18.4% Absolute Risk Reduction in kidney progression and de-escalating overall risk.
  >
  > But critically, VitaRisk enforces clinical safety guardrails. When eGFR drops below 45, the engine flags a mandatory Metformin dose halving, and at eGFR under 30, it issues a hard stop contraindication alert to prevent fatal lactic acidosis. We protect patients first."

---

### Segment 4: Calibration, Decision Curve Net Benefit & Active Fairness ($\tau_g$) (1:55 – 2:30)
* **Screen Display:**
  1. Click **Decision Curve Net Benefit** tab: show the Vickers & Elkin net benefit curves across 17 threshold points above the grey 'Treat All' and 'Treat None' baselines.
  2. Click **Algorithmic Fairness Audit** tab: toggle between "Unmitigated" and "Active Mitigated ($\tau_g$)", showing subgroup sensitivity gaps shrinking (e.g., T2D sex gap **0.077 → 0.007**, CKD age gap **0.44 → 0.13**).
  3. Click **Presentation Deck (14 Slides)** tab or flash the terminal showing `test_backend.py: ALL 10 PRE-SUBMISSION GATES PASSED`.
* **Presenter Teleprompter / Narration:**
  > "Behind the interface is rigorous epidemiology:
  > - We incorporated latent unobserved confounders to eliminate synthetic circularity, bounding ROC-AUCs to a realistic 0.80 to 0.85.
  > - 5-fold sigmoid calibration keeps Expected Calibration Error at or below 0.042 on every endpoint.
  > - Decision Curve Analysis confirms positive net clinical benefit across all treatment thresholds from 5% to 40%.
  > - And in our Fairness tab, we don't just passively report disparities—our validation-fitted threshold calibration shrinks sensitivity gaps across subgroups, and we publish every combination honestly, including where demographic parity remains structurally out of reach.
  >
  > All 10 pre-submission gates pass automated testing. VitaRisk CDS delivers the precision, safety, and transparency modern medicine demands.
  >
  > Thank you!"

---

### 🎬 Recording Tips for 100% Submission Quality
1. **Screen Capture Software:** Use **OBS Studio** (free, open source) or **Loom** / **QuickTime**. Set recording area to the browser window running `http://localhost:8000`.
2. **Tab Pre-Loading:** Ensure `http://localhost:8000` is already loaded before starting the recording so there is zero waiting.
3. **Pacing:** Speak with deliberate, confident pacing. Follow the visual cues step-by-step.
4. **Devpost Video Link:** Upload the resulting 2.5-minute video to **YouTube** (set visibility to "Unlisted" or "Public") or **Vimeo**, and paste the link into the Devpost submission field.
