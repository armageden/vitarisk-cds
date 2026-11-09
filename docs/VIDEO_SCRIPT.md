# VitaRisk CDS: 3.5-Minute Competition Walkthrough Script
**Target Competition:** DataNova 2026 Global Data-thon  
**Challenge ID:** `DN-HC-01: Early Risk Stratification for Chronic Disease`  
**Target Duration:** ~3 minutes 30 seconds (matches the shipped `VitaRisk_CDS_Walkthrough.mp4`)  
**Presenter:** Project Lead / Clinical AI Engineer  
**Display Resolution:** 1080p (1920x1080)  
**Audio:** Neural Voiceover (`en-US-ChristopherNeural`) or Live Presenter  

---

### Segment 1: The CKM Syndrome Gap & Why Isolated Models Fail (0:00 – 0:45)
* **Screen Display:** Open on the Hero Header of the live web app (`http://localhost:8000` or `https://farhan277-vitarisk-cds.hf.space/app/`), scroll smoothly through the CKM Cascade architecture diagram.
* **Presenter Teleprompter / Narration:**
  > "Hello DataNova judges and clinical colleagues. Chronic diseases—specifically Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease—account for 74% of all non-communicable deaths globally and over $4 trillion in US healthcare expenditures.
  >
  > The tragedy is that early-stage kidney disease and prediabetes progress silently: over 90% of patients remain asymptomatic until irreversible vascular remodeling and nephron loss occur.
  >
  > Existing calculators like Framingham or ASCVD fail because they treat organs as isolated silos, ignoring the American Heart Association's 2026 Cardiorenal-Metabolic, or CKM, syndrome staging.
  >
  > Introducing **VitaRisk CDS**: an explainable, guardrailed clinical decision support platform that transforms routine longitudinal EHR data into calibrated early interventions."

---

### Segment 2: 5 Canonical Personas, Multi-Organ Dials & Comparative Baselines (0:45 – 1:30)
* **Screen Display:** Browser on `http://localhost:8000`. 
  1. Click through **Persona 1: Silent Cardiorenal Progression (58F)**, **Persona 2**, and **Persona 3: High-Risk CKM Stage 4 (67M)**.
  2. Show the **CKM Stage 4 badge** and multi-organ risk dials computing in <15ms.
  3. Scroll down to highlight the **Comparative Baselines Card**: show **Tangri Kidney Failure Risk Equation (KFRE 4-variable 2-yr & 5-yr risk)** and **AHA PREVENT (10-yr CVD risk)** calculated side-by-side with VitaRisk.
* **Presenter Teleprompter / Narration:**
  > "Here is our live full-stack system. To eliminate form fatigue for judges, we engineered five canonical clinical personas representing diverse real-world disease trajectories.
  >
  > When we select Persona 3—an elderly patient with diabetes and chronic kidney disease—VitaRisk stratifies multi-organ risk in under 15 milliseconds.
  >
  > Notice our 3-stage CKM cascade: elevated kidney damage automatically models the biological cross-coupling, elevating downstream cardiovascular risk.
  >
  > Crucially, VitaRisk directly benchmarks our predictions against established clinical calculators in real-time, calculating Tangri's 4-variable Kidney Failure Risk Equation and AHA PREVENT scores side-by-side to give clinicians immediate comparative context."

---

### Segment 3: Explainable SHAP & Coupled What-If Simulations (1:30 – 2:15)
* **Screen Display:** 
  1. Switch to **Explainable AI (SHAP Waterfall)** tab: show percentage-point risk drivers (+% risk scale).
  2. Switch to **What-If Intervention Simulator** tab: click the **"SGLT2i Initiation" Preset button**.
  3. Show the dynamic ARR/RRR de-escalation across multi-organ endpoints.
  4. Switch back to **Clinical Risk Calculator & CDS** tab: point to the prominent **Metformin Contraindication Alert Banner** (eGFR < 30 mL/min/1.73m² hard stop).
* **Presenter Teleprompter / Narration:**
  > "In our Explainability tab, we replace unintuitive log-odds with additive percentage-point SHAP waterfalls. A clinician sees in five seconds that elevated HbA1c and eGFR loss dominate Marcus Vance's risk, while normal HDL offers a protective buffer.
  >
  > In our Simulator tab, unlike tools with unconstrained sliders that create biologically impossible patients, VitaRisk implements physiologically coupled presets calibrated against landmark clinical trials like EMPA-REG and DAPA-CKD. Clicking the SGLT2 inhibitor trial preset dynamically models coupled weight, glycemic, and renal improvements, producing quantified Absolute Risk Reductions.
  >
  > And when eGFR drops below 30, our safety guardrail fires a hard-stop contraindication banner against Metformin to prevent fatal lactic acidosis."

---

### Segment 4: Native HL7 FHIR R4 & CDS Hooks 1.0 Services (2:15 – 2:55)
* **Screen Display:**
  1. Switch to **EHR & CDS Hooks (FHIR R4)** tab.
  2. Toggle between **CDS Advisory Cards** and **FHIR R4 Bundle JSON**.
  3. Show the active `patient-view` hook evaluation against `/cds-services/vitarisk-ckm-advisor` returning advisory cards, severity indicators, and guideline links.
* **Presenter Teleprompter / Narration:**
  > "A predictive model is useless if trapped outside clinical workflows. VitaRisk is engineered for seamless EHR interoperability.
  >
  > In our EHR and CDS Hooks tab, we ingest standard HL7 FHIR R4 Bundles—extracting Patient demographics, Observation labs, and Condition resources into normalized clinical vectors.
  >
  > When a clinician opens a patient chart in Epic, Cerner, or Meditech, our CDS Hooks 1.0 endpoint at slash cds-services evaluates the patient-view hook in real-time, returning structured advice cards, critical indicators, and direct guideline links without disrupting clinician workflow."

---

### Segment 5: Rigorous Epidemiology, Active Fairness & Verification (2:55 – 3:35)
* **Screen Display:**
  1. Click **Decision Curve Net Benefit** tab: show the Vickers & Elkin net benefit curves across 17 threshold points above Treat All / Treat None.
  2. Click **Algorithmic Fairness Audit** tab: show active threshold mitigation ($\tau_g$) shrinking subgroup sensitivity gaps.
  3. Click **Submission Slides (14)** tab.
* **Presenter Teleprompter / Narration:**
  > "Behind the interface is rigorous epidemiology:
  > - We incorporated latent unobserved confounders to eliminate synthetic circularity, bounding ROC-AUCs to a realistic 0.79 to 0.85.
  > - 5-fold sigmoid calibration keeps Expected Calibration Error at or below 0.042 across all endpoints.
  > - Decision Curve Analysis confirms positive net clinical benefit over Treat All and Treat None across the 5% to 40% threshold spectrum.
  > - And in our Fairness tab, validation-fitted subgroup threshold calibration actively shrinks sensitivity gaps across age and sex groups.
  >
  > Deployed live on Hugging Face Spaces with all 10 pre-submission gates passing automated tests, VitaRisk CDS delivers the precision, safety, and transparency modern medicine demands.
  >
  > Thank you."

---

### 🎬 Production & Reproduction
Run `python scripts/produce_demo_video.py` to re-synthesize neural narration with `edge-tts`, record synchronized headless browser UI walkthrough via Playwright, and produce the final master `VitaRisk_CDS_Walkthrough.mp4`.
