# VitaRisk CDS — Clinical Validity, Limitations & Regulatory Framing

**Purpose:** Honest, judge-ready framing of the model's clinical validity. Companion to `docs/VALIDATION_REPORT.md` and `docs/SUBMISSION_DEVPOST.md`.

---

## 1. Research Findings (summary)

### (1) Standard synthetic-data disclaimers in ML health hackathons
- Synthetic cohorts are common and accepted **only when framed as proof-of-concept / research prototypes**, with explicit statements that no real patient data was used and that metrics are internal (not clinical performance).
- Judges dock points for "synthetic circularity" (0.99 AUC) and for implying clinical validity. The accepted pattern is: state the data source (NHANES/UK Biobank/Framingham marginals), state that outcomes are stochastic draws, report bounded realistic AUCs, and label the artifact as a prototype.
- Standard disclaimer elements: (a) "synthetic data, no real patients"; (b) "not validated on real-world EHR data"; (c) "not a medical device; not for clinical use"; (d) "metrics are internal hold-out estimates."

### (2) What "external validation" means and why it is missing here
- External validation = applying the model **as originally specified** (no refitting) to a different, relevant dataset not used in development, then quantifying discrimination, calibration (slope, intercept, O/E), overall fit, and clinical utility (Riley et al., BMJ 2024; Collins et al., BMJ 2023). It tests reproducibility (similar population) and transportability (different population/setting).
- It is missing here because the cohort is synthetic: there is no independent real-world EHR dataset with 5-year T2D/CKD/CVD/multimorbidity outcomes. Internal hold-out (70/15/15) splits of the same synthetic generator measure recovery of the data-generating process, not real-world generalizability. UK Biobank is highly selective (ages 40–69); MIMIC/eICU are ICU populations, not primary care. PROBAST/TRIPOD and a real outcomes dataset would be required.

### (3) Phrasing limitations in Devpost without undermining the project
- Lead with what **is** rigorous (latent confounders bounding AUC to 0.79–0.85, calibration, DCA, fairness audit, guardrails) and frame limitations as a **roadmap**, not a confession.
- Use "research/educational prototype," "internal validation on synthetic cohort," "external validation planned," and "clinician-in-the-loop decision support."
- Avoid claiming prospective clinical accuracy, FDA clearance, or real-patient validation.

### (4) Public real-world datasets citable as "validation direction"
- **MIMIC-IV** (critical care, MIT/PhysioNet) — EHR-style, free with credentialing; useful for CKD/CVD endpoints but ICU case mix.
- **eICU-CRD** — multi-center ICU; external validation across sites.
- **All of Us Research Program** (NIH) — diverse US cohort, longitudinal; suitable for T2D/CKD/CVD risk and equity analysis.
- **UK Biobank** — large longitudinal cohort (ages 40–69); rich phenotyping; known selectivity caveat.
- **NHANES (longitudinal linked mortality)** — population-representative; useful for calibration to US population, but limited 5-year incident disease labels.
- **QResearch / CPRD / SAIL / THIN** (UK primary care EHR) — best match for primary-care 5-year risk; access via application.
- **Framingham Heart Study / AHA PREVENT derivation data** — for benchmarking against established equations.

### (5) Regulatory framing: CDS vs. SaMD
- Under the 21st Century Cures Act §520(o)(1)(E) and FDA's final **Clinical Decision Support Software** guidance (Sept 2022), software is **non-device CDS** only if it meets all four criteria: (1) does not acquire/process/analyze medical images, signals, or patterns; (2) displays/analyzes/prints medical information; (3) supports/provides recommendations to an HCP about prevention/dx/tx; (4) enables the HCP to **independently review the basis** (algorithm methods, datasets, validation) so they do not primarily rely on it.
- FDA narrowed Criterion 3: software that provides a **specific output** such as a **risk probability/score** does **not** meet Criterion 3 and is regulated as a **device (SaMD)**. FDA's January 2026 updates broadened enforcement discretion for some CDS but did not change this.
- VitaRisk emits specific risk probabilities, tiers, and therapy suggestions → if deployed clinically it would likely be **SaMD (Class II, 510(k)/De Novo)**, not non-device CDS. Its SHAP/calibration/validation transparency supports Criterion 4 (independent review) but does not cure Criterion 3.
- Therefore the honest framing is: research/educational decision-support prototype; not a medical device; not cleared/approved; clinical deployment would require external validation, prospective evaluation, and regulatory review.

---

## 2. Recommended Disclaimer Text

### A. Short (UI footer / badge)
> **Research & educational prototype.** Trained and evaluated on a synthetic 12,000-patient EHR cohort generated from published NHANES/UK Biobank/Framingham/AHA PREVENT/KDIGO/QDiabetes distributions (not real patients). Not a medical device; not for clinical use. All risk scores require clinician judgment.

### B. Long (README / docs / Devpost)
> VitaRisk CDS is a research and educational prototype developed for the DataNova 2026 Global Data-thon. The underlying cohort (N = 12,000) is synthetically generated from published population distributions (NHANES, UK Biobank, Framingham/AHA PREVENT, KDIGO, QDiabetes) with latent unobserved confounders and realistic missingness; it contains no real patient data and has not been validated on real-world EHR data. Model discrimination (ROC-AUC 0.79–0.85), calibration (ECE ≤ 0.042, Brier ≤ 0.141) and decision-curve net benefit are internal hold-out estimates on the synthetic cohort, not clinical performance guarantees. The tool is not a medical device and is not cleared or approved by the FDA or any regulator; risk scores, tiers and treatment suggestions are decision support for clinician review, not patient-specific prescriptions or directives. Do not use for patient care.

### C. In-app one-line (header tooltip)
> "Synthetic-cohort research prototype — not for clinical use."

---

## 3. Validation Roadmap

| Phase | Window | Goal | Key activities | Exit criteria |
|---|---|---|---|---|
| **0. Hackathon MVP (current)** | Done | Internal validity on synthetic cohort | Latent-confounder-bounded AUC 0.79–0.85; 5-fold sigmoid calibration; DCA; fairness audit (τ_g); guardrails; SHAP | All 10 pre-submission gates pass; metrics published |
| **1. Retrospective EHR validation** | 0–6 mo | Transportability on real data | Obtain de-identified EHR cohort (MIMIC-IV, eICU-CRD, All of Us, or institutional); apply model **as-is** (no refit); report AUC, calibration slope/intercept/O/E, Brier, ECE, DCA; subgroup performance; PROBAST + TRIPOD reporting | Calibration within acceptable range or documented recalibration plan; no catastrophic miscalibration |
| **2. Multi-site external validation** | 6–12 mo | Generalizability across geography/setting | Independent replication (primary care vs. specialty); calibration updating/recalibration; sample-size adequacy (Riley part 3); heterogeneity analysis | Consistent discrimination/calibration across ≥2 independent sites |
| **3. Prospective pilot** | 12–24 mo | Clinical utility & adoption | Clinician-in-the-loop stepped-wedge or RCT; adoption, decision impact; HbA1c/BP/uACR endpoints; alert fatigue & override tracking | Demonstrated decision impact without harm; protocol published |
| **4. Regulatory & scale** | 24+ mo | Deployment readiness | Pre-submission with FDA; determine SaMD class (likely Class II → 510(k)/De Novo); QMS; clinical evidence package; EHR integration (SMART on FHIR) | Regulatory determination + cleared/approved status before any patient-facing use |

**Dataset notes for Phase 1:** Prefer primary-care EHR (QResearch/CPRD/SAIL/THIN) for a 5-year primary-care risk model; use MIMIC-IV/eICU only with explicit case-mix caveats (ICU populations); All of Us for equity/diversity; UK Biobank with age 40–69 selectivity caveat; NHANES linked mortality for population calibration.

---

## 4. Devpost-Ready Limitation Paragraph

> **Limitations & validation status (honest framing):** VitaRisk was developed and evaluated entirely on a synthetic 12,000-patient EHR cohort generated from published NHANES/UK Biobank/Framingham/AHA PREVENT/KDIGO/QDiabetes distributions with latent unobserved confounders and realistic missingness. No real patient data was used, and the model has not undergone external validation on real-world EHR data; the reported ROC-AUC (0.79–0.85), ECE (≤0.042) and Brier (≤0.141) are internal hold-out estimates on the synthetic cohort, not clinical performance guarantees. The cohort's outcome labels are stochastic (Bernoulli) draws from epidemiological hazard equations, so metrics reflect recovery of a known data-generating process rather than prospective clinical accuracy. Fairness mitigation (τ_g) is a proposed policy fitted on validation data and evaluated on held-out test data, not yet wired into production tiering, and demographic parity across age groups is structurally unattainable and is not claimed. Treatment suggestions are guideline-mapped decision support for clinician review, not patient-specific prescriptions. VitaRisk is a research/educational prototype, not a medical device; it is not cleared or approved by the FDA or any regulator, and any clinical deployment would require external validation, prospective evaluation, and appropriate regulatory review (likely SaMD, Class II).

---

## 5. Regulatory Framing (CDS vs. SaMD)

- **Claim to remove/soften:** "Adheres to FDA SaMD Tier II guidelines" and "FDA SaMD 510(k) pathway" as if already compliant. Replace with the aspirational roadmap language in §3 Phase 4 and the disclaimer in §2.
- **Why:** Under FDA's final CDS guidance (2022, §520(o)(1)(E)), software that emits a **specific risk probability/score** does not meet Criterion 3 and is regulated as **SaMD**, not non-device CDS. VitaRisk's risk probabilities, tiers, and therapy suggestions → SaMD if deployed.
- **What supports compliance later:** Criterion 4 transparency — probability-space SHAP, calibration metrics, DCA, fairness audit, guardrails, and this limitations document — provides the "independent review of basis" FDA requires. But transparency does not convert a specific risk score into non-device CDS.
- **Terminology fix:** FDA uses device **Class I/II/III**; IMDRF SaMD uses categories I–IV. "Tier II" is not an FDA term. Use "Class II (510(k)/De Novo)" for FDA-facing language.
- **Bottom line for judges:** "VitaRisk is a clinician-in-the-loop decision-support prototype. It is not a medical device and is not cleared/approved. Its outputs are for research and educational use; any clinical deployment would require external validation, prospective evaluation, and regulatory review (likely SaMD, Class II)."
