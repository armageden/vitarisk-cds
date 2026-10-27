# VitaRisk CDS: 3-Minute Video Presentation Script
**DataNova 2026 Global Data-thon (DN-HC-01)**  
**Target Duration:** 3 minutes (180 seconds)  
**Presenter:** Project Lead / Clinical AI Engineer  

---

### Scene 1: The Problem & The Clinical Burden (0:00 - 0:30)
- **Visual Cue:** Screen shows Slide 1 (Title) then transitions to Slide 2 (Global Burden: 74% of deaths, $4.1T spend, and the asymptomatic kidney disease progression graphic).
- **Narration:**
  > "Hello judges and fellow innovators. Chronic diseases—specifically Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease—account for over 74% of all non-communicable deaths worldwide. 
  > 
  > The tragedy is that up to 90% of early-stage kidney disease and prediabetes cases progress in complete silence. By the time a primary care physician notices overt symptoms, irreversible organ damage has already occurred.
  > 
  > Furthermore, while machine learning risk models exist, clinicians reject them because they are opaque black boxes that fail to provide actionable, guideline-based interventions.
  > 
  > Introducing **VitaRisk CDS**—an explainable, equitable multi-disease risk stratification and clinical decision support system designed to turn routine EHR data into life-saving early interventions."

---

### Scene 2: Solution Architecture & Machine Learning Rigor (0:30 - 1:15)
- **Visual Cue:** Switch to the live interactive web app (`http://localhost:8000`). Click on the "Model Benchmarks" and "Population Health" tabs.
- **Narration:**
  > "VitaRisk is built on a clinically grounded cohort of 12,000 longitudinal patient EHR records spanning 32 physiological, hemodynamic, and laboratory biomarkers.
  > 
  > Rather than treating chronic diseases in silos, VitaRisk simultaneously predicts 5-year onset risk for Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular MACE, capturing their shared cardiorenal-metabolic pathophysiology.
  > 
  > We benchmarked four distinct model families—Logistic Regression, Random Forest, LightGBM, and XGBoost. Across all conditions, our production XGBoost models achieved outstanding discrimination with ROC-AUCs between 0.867 and 0.894, while dramatically reducing Brier calibration error by over 33% compared to standard clinical regression."

---

### Scene 3: Live Clinical Demonstration & SHAP Explainability (1:15 - 2:05)
- **Visual Cue:** Navigate to the "Patient Risk Calculator & CDS" tab. Select "Evelyn Reed" or "Marcus Vance" from the preset loader. Show the instant risk tier calculation. Then click on the "Explainable AI (SHAP Waterfall)" tab.
- **Narration:**
  > "Let's see VitaRisk in action with a real patient case. Here we load Marcus Vance, a 54-year-old male with early hypertension and elevated HbA1c.
  > 
  > In under 50 milliseconds, VitaRisk stratifies Marcus into the Critical Risk Tier with an 85.9% composite 5-year risk score. 
  > 
  > But why? In the clinical SHAP tab, VitaRisk uses TreeExplainer to break down the exact biological drivers. We see Marcus's elevated HbA1c (+0.90) and systolic BP (+0.36) pushing risk into the red zone, while his HDL acts as a partial protective buffer. Every prediction is fully transparent, verifiable, and ready for patient chart documentation."

---

### Scene 4: Actionable CDS & What-If Counterfactual Simulator (2:05 - 2:40)
- **Visual Cue:** Switch to the "Counterfactual 'What-If' Simulator" tab. Adjust the target sliders: reduce HbA1c to 6.5%, reduce Systolic BP to 125 mmHg, set smoking to Never. Show the risk downgrade from Critical to High.
- **Narration:**
  > "Risk scoring alone doesn't heal patients—action does. VitaRisk integrates a Clinical Decision Support engine mapped to ADA 2026 Standards of Care, KDIGO 2024, and ACC/AHA guidelines, recommending specific, evidence-graded pharmacotherapy like SGLT2 inhibitors and ACE inhibitors.
  > 
  > Even more powerful is our interactive counterfactual simulator. During a 15-minute consultation, a physician can show Marcus what happens if he achieves target glycemic control, lowers his blood pressure to 125, and quits smoking. 
  > 
  > Watch as Marcus's composite risk drops by an absolute 28.4%, achieving a 33% relative risk reduction and downgrading him out of the Critical Tier. This transforms passive risk scores into an active motivational intervention."

---

### Scene 5: Algorithmic Fairness & Conclusion (2:40 - 3:00)
- **Visual Cue:** Quickly show the "Algorithmic Fairness Audit" tab showing EEOC 80% rule compliance across Sex, Race, and SES. Finish on the Presentation / Summary slide.
- **Narration:**
  > "Finally, healthcare AI must be equitable. Our automated fairness audit verifies that VitaRisk passes the US EEOC Four-Fifths 80% rule across biological sex, race, and socioeconomic status, utilizing race-free 2021 CKD-EPI equations to prevent under-diagnosis.
  > 
  > With full FHIR interoperability readiness, a working full-stack prototype, a complete 14-slide executive deck, and published documentation, VitaRisk CDS turns clinical data into decisions that save lives.
  > 
  > Thank you."
