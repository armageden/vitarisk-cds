"""
VitaRisk CDS - Algorithmic Fairness Auditing, Active Mitigation & Clinical Safety Engine
Remediations Implemented:
- FM-07: Physiologically coupled counterfactuals, locked immutable attributes,
         and 4 one-click clinical trial presets (SGLT2i, GLP-1 RA, RAAS+Statin, Lifestyle).
- FM-08: Active Fairness Mitigation (Before vs After Mitigation with Subgroup-Calibrated Thresholds tau_g).
- FM-09: Uncompromising clinical contraindication guardrails (Metformin eGFR < 30 alert,
         30-44 dose halving, ACEi/ARB potassium monitoring, AHA 2026 CKM Stages 0-4 mapping).
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import roc_auc_score, brier_score_loss
from ml.train_models import transform_features

def _safe_float(val, default):
    if val is None:
        return default
    try:
        f = float(val)
        return default if np.isnan(f) else f
    except (ValueError, TypeError):
        return default

def _ensure_non_hdl(patient_dict):
    """Return a copy with coherent non-HDL: max(30, TC - HDL) when absent/None; explicit values preserved."""
    d = dict(patient_dict)
    if d.get("non_hdl_cholesterol") is None:
        tc = _safe_float(d.get("total_cholesterol"), 200.0)
        hdl = _safe_float(d.get("hdl_cholesterol"), 50.0)
        d["non_hdl_cholesterol"] = max(30.0, tc - hdl)
    return d

IMMUTABLE_FEATURES = {"age", "sex", "ethnicity", "family_history_diabetes", "family_history_cvd"}

PHYSIOLOGICAL_BOUNDS = {
    "hba1c": (4.6, 14.0),
    "fasting_glucose": (60.0, 400.0),
    "systolic_bp": (90.0, 215.0),
    "diastolic_bp": (55.0, 125.0),
    "bmi": (17.5, 52.0),
    "waist_circ_cm": (60.0, 150.0),
    "egfr": (8.0, 135.0),
    "uacr": (2.0, 3000.0),
    "total_cholesterol": (90.0, 400.0),
    "ldl_cholesterol": (30.0, 260.0),
    "hdl_cholesterol": (18.0, 110.0),
    "triglycerides": (40.0, 700.0),
    "non_hdl_cholesterol": (50.0, 320.0),
    "hs_crp": (0.1, 25.0)
}

CLINICAL_TRIAL_PRESETS = {
    "preset_sglt2i": {
        "name": "SGLT2 Inhibitor Initiation (DAPA-CKD / EMPA-KIDNEY)",
        "description": "Evidence-proven SGLT2i (Dapagliflozin 10mg / Empagliflozin 10mg): lowers HbA1c, BP, and reduces albuminuria by 35%.",
        "deltas": {
            "hba1c": -0.6,
            "systolic_bp": -4.0,
            "uacr_mult": 0.65  # 35% reduction
        }
    },
    "preset_glp1": {
        "name": "GLP-1 / Dual Incretin Therapy (SELECT / SURMOUNT Trials)",
        "description": "High-efficacy incretin therapy: 12% body weight loss, 1.4% HbA1c reduction, 6 mmHg SBP lowering, 18% triglyceride reduction.",
        "deltas": {
            "bmi_pct": -0.12,
            "hba1c": -1.4,
            "systolic_bp": -6.0,
            "triglycerides_pct": -0.18
        }
    },
    "preset_raas_statin": {
        "name": "Optimized RAAS Blockade + High-Intensity Statin",
        "description": "Maximally tolerated ACEi/ARB + Atorvastatin 40-80mg: 14 mmHg SBP drop, 45% LDL-C reduction, 30% uACR reduction.",
        "deltas": {
            "systolic_bp": -14.0,
            "ldl_pct": -0.45,
            "uacr_mult": 0.70
        }
    },
    "preset_lifestyle": {
        "name": "Intensive Lifestyle Intervention & Smoking Cessation (DPP Protocol)",
        "description": "150 min/wk physical activity, smoking cessation, 5% weight loss, and dietary sodium restriction.",
        "deltas": {
            "smoking_status": "Former",
            "physical_activity": "Active",
            "bmi_pct": -0.05,
            "systolic_bp": -7.0,
            "hba1c": -0.4
        }
    }
}

def determine_ckm_stage(patient_dict, composite_risk, prob_cvd):
    """
    Classifies patient into AHA 2026 Cardiovascular-Kidney-Metabolic (CKM) Syndrome Stages 0-4.
    """
    bmi = _safe_float(patient_dict.get("bmi"), 25.0)
    waist = _safe_float(patient_dict.get("waist_circ_cm"), 85.0)
    sex = str(patient_dict.get("sex") or "Male")
    hba1c = _safe_float(patient_dict.get("hba1c"), 5.4)
    fpg = _safe_float(patient_dict.get("fasting_glucose"), 90.0)
    sbp = _safe_float(patient_dict.get("systolic_bp"), 120.0)
    egfr = _safe_float(patient_dict.get("egfr"), 90.0)
    uacr = _safe_float(patient_dict.get("uacr"), 10.0)
    tg = _safe_float(patient_dict.get("triglycerides"), 120.0)
    prob_cvd = _safe_float(prob_cvd, 0.0)
    composite_risk = _safe_float(composite_risk, 0.0)
    
    # Stage 4: Clinical CVD / Advanced CKM Syndrome (prob_cvd >= 0.40 or composite_risk >= 0.70)
    if prob_cvd >= 0.40 or composite_risk >= 0.70:
        return {
            "stage": "Stage 4",
            "label": "Clinical CVD / Advanced CKM Syndrome",
            "description": "Established clinical cardiovascular-kidney-metabolic disease; requires aggressive multi-specialty intervention."
        }

    # Stage 3: Subclinical CVD / Very high risk CKD (eGFR < 30 or uACR > 300) or high predicted risk (>= 20%)
    if egfr < 30.0 or uacr > 300.0 or prob_cvd >= 0.20 or composite_risk >= 0.50:
        return {
            "stage": "Stage 3",
            "label": "Subclinical CVD / Very High-Risk CKM",
            "description": "Advanced cardiorenal risk with microvascular organ stress; priority for dual SGLT2i + RAAS blockade."
        }
    
    # Stage 2: Metabolic risk factors (hypertension, diabetes, dyslipidemia) or moderate CKD
    has_metabolic = (sbp >= 130) or (hba1c >= 6.5) or (tg >= 150) or (30 <= egfr < 60) or (30 <= uacr <= 300)
    if has_metabolic:
        return {
            "stage": "Stage 2",
            "label": "Metabolic Risk Factors / Moderate-Risk CKD",
            "description": "Documented metabolic syndrome, hypertension, or early nephropathy; intensive risk factor modification indicated."
        }
        
    # Stage 1: Excess or dysfunctional adiposity or prediabetes
    is_adiposity = (bmi >= 25.0) or (waist >= (102.0 if sex == "Male" else 88.0)) or (5.7 <= hba1c < 6.5) or (100 <= fpg < 126)
    if is_adiposity:
        return {
            "stage": "Stage 1",
            "label": "Excess Adiposity / Pre-Diabetes",
            "description": "Early physiological dysfunction; highly responsive to weight management and physical activity."
        }
        
    return {
        "stage": "Stage 0",
        "label": "No CKM Risk Factors",
        "description": "Optimal cardiorenal and metabolic health; annual preventive screening recommended."
    }

AGE_CRITERION_NOTE = (
    "Disparate impact (demographic parity) across age groups is structurally unattainable and clinically "
    "wrong to enforce: disease prevalence rises sharply with age, so a correct model must screen more "
    "older patients. Age-group fairness is judged on equal opportunity (sensitivity/TPR parity), reported above."
)

def audit_and_mitigate_fairness(test_csv_path="ml/artifacts/test_cohort.csv",
                                val_csv_path="ml/artifacts/val_cohort.csv",
                                artifacts_dir="ml/artifacts"):
    artifacts_dir = os.path.realpath(artifacts_dir)
    df = pd.read_csv(test_csv_path)
    df_val = pd.read_csv(val_csv_path)
    imputer = joblib.load(os.path.join(artifacts_dir, "imputer.joblib"))
    scaler = joblib.load(os.path.join(artifacts_dir, "scaler.joblib"))
    encoder = joblib.load(os.path.join(artifacts_dir, "encoder.joblib"))

    X_test = transform_features(df, imputer, scaler, encoder)
    X_val = transform_features(df_val, imputer, scaler, encoder)

    # Load calibrated production models
    model_t2d = joblib.load(os.path.join(artifacts_dir, "best_model_onset_t2d.joblib"))
    model_ckd = joblib.load(os.path.join(artifacts_dir, "best_model_onset_ckd.joblib"))

    p_t2d = model_t2d.predict_proba(X_test)[:, 1]
    p_ckd = model_ckd.predict_proba(X_test)[:, 1]
    X_test_ckm = np.hstack([X_test, p_t2d.reshape(-1, 1), p_ckd.reshape(-1, 1)])

    model_cvd = joblib.load(os.path.join(artifacts_dir, "best_model_onset_cvd.joblib"))
    model_mm = joblib.load(os.path.join(artifacts_dir, "best_model_onset_multimorbidity.joblib"))
    p_cvd = model_cvd.predict_proba(X_test_ckm)[:, 1]
    p_mm = model_mm.predict_proba(X_test_ckm)[:, 1]

    p_t2d_v = model_t2d.predict_proba(X_val)[:, 1]
    p_ckd_v = model_ckd.predict_proba(X_val)[:, 1]
    X_val_ckm = np.hstack([X_val, p_t2d_v.reshape(-1, 1), p_ckd_v.reshape(-1, 1)])
    p_cvd_v = model_cvd.predict_proba(X_val_ckm)[:, 1]
    p_mm_v = model_mm.predict_proba(X_val_ckm)[:, 1]

    df["pred_prob_t2d"] = p_t2d
    df["pred_prob_ckd"] = p_ckd
    df["pred_prob_cvd"] = p_cvd
    df["pred_prob_multimorbidity"] = p_mm

    df_val["pred_prob_t2d"] = p_t2d_v
    df_val["pred_prob_ckd"] = p_ckd_v
    df_val["pred_prob_cvd"] = p_cvd_v
    df_val["pred_prob_multimorbidity"] = p_mm_v

    df["age_group"] = pd.cut(df["age"], bins=[0, 45, 64, 120], labels=["<45", "45-64", "65+"])
    df["ses_group"] = pd.cut(df["ses_decile"], bins=[0, 3, 7, 10], labels=["High SES", "Medium SES", "Low SES (Deprived)"])
    df_val["age_group"] = pd.cut(df_val["age"], bins=[0, 45, 64, 120], labels=["<45", "45-64", "65+"])
    df_val["ses_group"] = pd.cut(df_val["ses_decile"], bins=[0, 3, 7, 10], labels=["High SES", "Medium SES", "Low SES (Deprived)"])
    
    protected_attrs = ["sex", "ethnicity", "ses_group", "age_group"]
    target_endpoints = ["onset_t2d", "onset_ckd", "onset_cvd", "onset_multimorbidity"]
    
    fairness_audit = {}
    
    for target in target_endpoints:
        prob_col = f"pred_prob_{target.replace('onset_', '')}"
        y_true = df[target].values
        y_prob = df[prob_col].values
        y_true_val = df_val[target].values
        y_prob_val = df_val[prob_col].values
        
        target_eval = {}
        for attr in protected_attrs:
            subgroups = sorted(df[attr].dropna().unique())
            
            # --- 1. UNMITIGATED (Standard Global Screening Threshold tau = 0.25) ---
            global_tau = 0.25
            unmit_selection = []
            unmit_tpr = []
            unmit_metrics = {}
            
            for grp in subgroups:
                idx = (df[attr] == grp).values
                n_grp = int(np.sum(idx))
                if n_grp == 0:
                    continue
                grp_y = y_true[idx]
                grp_p = y_prob[idx]
                grp_pred = (grp_p >= global_tau).astype(int)
                
                sr = float(np.mean(grp_pred))
                pos = (grp_y == 1)
                tpr = float(np.mean(grp_pred[pos])) if np.sum(pos) > 0 else 0.0
                auc = float(roc_auc_score(grp_y, grp_p)) if len(np.unique(grp_y)) > 1 else 1.0
                brier = float(brier_score_loss(grp_y, grp_p))
                
                unmit_selection.append(sr)
                unmit_tpr.append(tpr)
                unmit_metrics[str(grp)] = {
                    "count": n_grp,
                    "prevalence": round(float(np.mean(grp_y)), 4),
                    "selection_rate": round(sr, 4),
                    "tpr_sensitivity": round(tpr, 4),
                    "roc_auc": round(auc, 4),
                    "brier_score": round(brier, 4)
                }
                
            unmit_di = min(unmit_selection) / max(unmit_selection) if max(unmit_selection) > 0 else 1.0
            unmit_dpd = max(unmit_selection) - min(unmit_selection) if unmit_selection else 0.0
            unmit_eod = max(unmit_tpr) - min(unmit_tpr) if unmit_tpr else 0.0
            
            # --- 2. ACTIVELY MITIGATED (FM-08: Subgroup Threshold Calibration tau_g) ---
            # Thresholds are fitted on the VALIDATION cohort and evaluated on the held-out
            # TEST cohort, so reported "after" metrics are not tuned on the evaluation data.
            target_sensitivity = 0.75
            mit_selection = []
            mit_tpr = []
            mit_metrics = {}
            subgroup_thresholds = {}

            for grp in subgroups:
                idx_v = (df_val[attr] == grp).values
                grp_y_v = y_true_val[idx_v]
                grp_p_v = y_prob_val[idx_v]

                # Find group-specific threshold on validation positives
                pos_idx_v = (grp_y_v == 1)
                if np.sum(pos_idx_v) > 0:
                    sorted_pos_probs = np.sort(grp_p_v[pos_idx_v])
                    tau_index = int(np.floor((1.0 - target_sensitivity) * len(sorted_pos_probs)))
                    tau_g = float(sorted_pos_probs[max(0, min(tau_index, len(sorted_pos_probs) - 1))])
                else:
                    tau_g = global_tau

                tau_g = float(np.clip(tau_g, 0.15, 0.45))
                subgroup_thresholds[str(grp)] = round(tau_g, 3)

                # Apply validation-fitted tau_g to the held-out test cohort
                idx = (df[attr] == grp).values
                grp_y = y_true[idx]
                grp_p = y_prob[idx]
                pos_idx = (grp_y == 1)
                grp_pred_mit = (grp_p >= tau_g).astype(int)
                sr_mit = float(np.mean(grp_pred_mit))
                tpr_mit = float(np.mean(grp_pred_mit[pos_idx])) if np.sum(pos_idx) > 0 else 0.0

                mit_selection.append(sr_mit)
                mit_tpr.append(tpr_mit)
                mit_metrics[str(grp)] = {
                    "count": int(np.sum(idx)),
                    "calibrated_threshold": round(tau_g, 3),
                    "selection_rate": round(sr_mit, 4),
                    "tpr_sensitivity": round(tpr_mit, 4)
                }

            mit_di = min(mit_selection) / max(mit_selection) if max(mit_selection) > 0 else 1.0
            mit_dpd = max(mit_selection) - min(mit_selection) if mit_selection else 0.0
            mit_eod = max(mit_tpr) - min(mit_tpr) if mit_tpr else 0.0

            target_eval[attr] = {
                "unmitigated": {
                    "subgroups": unmit_metrics,
                    "disparate_impact_ratio": round(float(unmit_di), 4),
                    "demographic_parity_diff": round(float(unmit_dpd), 4),
                    "equal_opportunity_diff": round(float(unmit_eod), 4),
                    "passes_four_fifths_rule": bool(unmit_di >= 0.80)
                },
                "mitigated": {
                    "threshold_source": "validation_cohort",
                    "policy_note": "Proposed deployment policy (tau_g fitted on validation cohort, evaluated on held-out test); production tiering still uses global composite cutoffs.",
                    "calibrated_subgroup_thresholds": subgroup_thresholds,
                    "subgroups": mit_metrics,
                    "disparate_impact_ratio": round(float(mit_di), 4),
                    "demographic_parity_diff": round(float(mit_dpd), 4),
                    "equal_opportunity_diff": round(float(mit_eod), 4),
                    "passes_four_fifths_rule": bool(mit_di >= 0.80)
                }
            }
            if attr == "age_group":
                target_eval[attr]["criterion_note"] = AGE_CRITERION_NOTE
            
        fairness_audit[target] = target_eval
        
    Path(artifacts_dir, "fairness_audit.json").write_text(json.dumps(fairness_audit, indent=2))
    print("✅ Active Fairness Audit (Before vs After Mitigation) saved to 'ml/artifacts/fairness_audit.json'.")
    return fairness_audit

class ClinicalDecisionSupportEngine:
    """
    Production CDS Engine implementing:
    - Cardiorenal-Metabolic (CKM) joint pipeline
    - Clinical contraindication guardrails (Metformin, ACEi/ARB)
    - AHA 2026 CKM Syndrome Stages 0-4
    - Physiologically coupled counterfactual interventions
    """
    def __init__(self, artifacts_dir="ml/artifacts"):
        self.artifacts_dir = os.path.realpath(artifacts_dir)
        artifacts_dir = self.artifacts_dir
        self.imputer = joblib.load(os.path.join(artifacts_dir, "imputer.joblib"))
        self.scaler = joblib.load(os.path.join(artifacts_dir, "scaler.joblib"))
        self.encoder = joblib.load(os.path.join(artifacts_dir, "encoder.joblib"))
        
        with open(f"{artifacts_dir}/feature_names.json") as f:
            self.feature_names = json.load(f)
            
        self.model_t2d = joblib.load(os.path.join(artifacts_dir, "best_model_onset_t2d.joblib"))
        self.model_ckd = joblib.load(os.path.join(artifacts_dir, "best_model_onset_ckd.joblib"))
        self.model_cvd = joblib.load(os.path.join(artifacts_dir, "best_model_onset_cvd.joblib"))
        self.model_mm = joblib.load(os.path.join(artifacts_dir, "best_model_onset_multimorbidity.joblib"))
        
        self.explainer_t2d = joblib.load(os.path.join(artifacts_dir, "shap_explainer_onset_t2d.joblib"))
        self.explainer_ckd = joblib.load(os.path.join(artifacts_dir, "shap_explainer_onset_ckd.joblib"))
        self.explainer_cvd = joblib.load(os.path.join(artifacts_dir, "shap_explainer_onset_cvd.joblib"))

    def predict_patient(self, patient_dict):
        patient_dict = _ensure_non_hdl(patient_dict)
            
        df_patient = pd.DataFrame([patient_dict])
        X = transform_features(df_patient, self.imputer, self.scaler, self.encoder)
        
        prob_t2d = float(self.model_t2d.predict_proba(X)[0, 1])
        prob_ckd = float(self.model_ckd.predict_proba(X)[0, 1])
        
        # CKM Coupled Stage 2 & 3
        X_ckm = np.hstack([X, np.array([[prob_t2d, prob_ckd]])])
        prob_cvd = float(self.model_cvd.predict_proba(X_ckm)[0, 1])
        prob_mm = float(self.model_mm.predict_proba(X_ckm)[0, 1])
        
        # Bound check multimorbidity against Fréchet-Hoeffding upper bounds (Gate 4)
        upper_bound = min(1.0, prob_t2d + prob_ckd + prob_cvd)
        prob_mm = min(prob_mm, upper_bound)
        
        composite_score = round(0.35 * prob_t2d + 0.25 * prob_ckd + 0.40 * prob_cvd, 3)
        
        if composite_score < 0.15:
            tier = "Low"
            urgency = "Annual Routine Surveillance"
            color = "#10b981"
        elif composite_score < 0.35:
            tier = "Moderate"
            urgency = "Proactive (3-6 Months Surveillance)"
            color = "#f59e0b"
        elif composite_score < 0.60:
            tier = "High"
            urgency = "Prompt Intervention (1-3 Months)"
            color = "#f97316"
        else:
            tier = "Critical"
            urgency = "Urgent Cardiorenal-Metabolic Consultation"
            color = "#ef4444"
            
        # AHA 2026 CKM Syndrome Stage
        ckm_stage_info = determine_ckm_stage(patient_dict, composite_score, prob_cvd)
        
        # Clinical Guideline Recommendations & Contraindication Safety (FM-09)
        recommendations = []
        contraindication_alerts = []
        
        egfr = _safe_float(patient_dict.get("egfr"), 90.0)
        uacr = _safe_float(patient_dict.get("uacr"), 10.0)
        hba1c = _safe_float(patient_dict.get("hba1c"), 5.5)
        sbp = _safe_float(patient_dict.get("systolic_bp"), 120.0)
        ldl = _safe_float(patient_dict.get("ldl_cholesterol"), 100.0)
        smoking = str(patient_dict.get("smoking_status") or "Never")
        
        # 1. Metformin Contraindication / Dose Adjustment Check (FM-09)
        if egfr < 30.0:
            contraindication_alerts.append({
                "type": "CONTRAINDICATION",
                "medication": "Metformin",
                "severity": "CRITICAL",
                "message": "CONTRAINDICATION ALERT: Avoid Metformin initiation or continuation (eGFR < 30 mL/min/1.73m² - risk of fatal lactic acidosis). Prefer GLP-1 RA or SGLT2i (if eGFR >= 20 per KDIGO 2024)."
            })
        elif 30.0 <= egfr < 45.0:
            contraindication_alerts.append({
                "type": "DOSE_ADJUSTMENT",
                "medication": "Metformin",
                "severity": "WARNING",
                "message": "DOSE ADJUSTMENT REQUIRED: Halve Metformin maximum daily dose (<= 1,000 mg/day). Monitor renal function every 3 months per KDIGO Stage G3b guidelines."
            })
            
        # 2. Glycemic & Incretin Management (ADA 2026 Standards of Care)
        if hba1c >= 6.5 or prob_t2d >= 0.40:
            rec_text = "Initiate organ-protective dual therapy (Metformin + SGLT2i or GLP-1 RA)." if egfr >= 30 else "Initiate GLP-1 receptor agonist (e.g., Dulaglutide / Semaglutide) with nephroprotection; Metformin withheld."
            recommendations.append({
                "category": "Glycemic & Metabolic (ADA 2026)",
                "action": rec_text,
                "evidence_level": "Level A (RCT Strong Evidence)",
                "target": "Target HbA1c < 7.0% without hypoglycemia."
            })
        elif hba1c >= 5.7 or prob_t2d >= 0.20:
            recommendations.append({
                "category": "Pre-Diabetes Interception (ADA 2026)",
                "action": "Enroll in intensive Diabetes Prevention Program (DPP): target >= 7% weight loss and 150 min/wk moderate activity.",
                "evidence_level": "Level A (DPP Trial)",
                "target": "Target fasting glucose < 100 mg/dL and HbA1c < 5.7%."
            })
            
        # 3. Renal Protection (KDIGO 2024 Guidelines)
        if egfr < 60.0 or uacr >= 30.0 or prob_ckd >= 0.35:
            recommendations.append({
                "category": "Nephroprotection (KDIGO 2024)",
                "action": "Initiate SGLT2 inhibitor (Dapagliflozin 10mg / Empagliflozin 10mg) + maximally tolerated ACEi or ARB. Monitor serum potassium & creatinine in 2-4 weeks.",
                "evidence_level": "Grade 1A (KDIGO 2024)",
                "target": "Aim for >= 30% reduction in uACR; slow eGFR decline to < 1 mL/min/year."
            })
        elif prob_ckd >= 0.20:
            recommendations.append({
                "category": "Renal Surveillance (KDIGO)",
                "action": "Perform semi-annual uACR and eGFR monitoring. Avoid nephrotoxic chronic NSAIDs.",
                "evidence_level": "Grade 2B",
                "target": "Detect early microalbuminuria prior to glomerular scarring."
            })
            
        # 4. Cardiovascular Protection (ACC/AHA 2026 CKM Guidelines)
        if sbp >= 130.0 or prob_cvd >= 0.18:
            recommendations.append({
                "category": "Cardiovascular & Hemodynamics (ACC/AHA)",
                "action": "Intensive blood pressure titration to target SBP < 130 mmHg using first-line ACEi/ARB or CCB.",
                "evidence_level": "Class I, Level A (SPRINT Trial)",
                "target": "Target SBP 120-129 mmHg, DBP < 80 mmHg."
            })
        if ldl >= 100.0 or prob_cvd >= 0.15:
            recommendations.append({
                "category": "Lipid Lowering (ACC/AHA)",
                "action": "Initiate high-intensity statin (Atorvastatin 40-80mg or Rosuvastatin 20-40mg).",
                "evidence_level": "Class I, Level A",
                "target": "Achieve >= 50% LDL-C reduction or LDL-C < 70 mg/dL."
            })
        if smoking == "Current":
            recommendations.append({
                "category": "Tobacco Cessation (USPSTF)",
                "action": "Prescribe combination pharmacotherapy (Varenicline or dual NRT) + behavioral support.",
                "evidence_level": "Grade A Recommendation",
                "target": "Complete tobacco cessation within 12 weeks."
            })
            
        return {
            "probabilities": {
                "t2d": round(prob_t2d, 4),
                "ckd": round(prob_ckd, 4),
                "cvd": round(prob_cvd, 4),
                "multimorbidity": round(prob_mm, 4),
                "composite": composite_score
            },
            "tier": tier,
            "urgency": urgency,
            "color": color,
            "ckm_stage": ckm_stage_info,
            "contraindication_alerts": contraindication_alerts,
            "recommendations": recommendations
        }

    def explain_patient(self, patient_dict, target="onset_t2d"):
        patient_dict = _ensure_non_hdl(patient_dict)
            
        df_patient = pd.DataFrame([patient_dict])
        X = transform_features(df_patient, self.imputer, self.scaler, self.encoder)
        
        prob_t2d = float(self.model_t2d.predict_proba(X)[0, 1])
        prob_ckd = float(self.model_ckd.predict_proba(X)[0, 1])
        
        if target == "onset_t2d":
            explainer = self.explainer_t2d
            shap_obj = explainer(X)
            feat_names = self.feature_names
            target_prob = prob_t2d
        elif target == "onset_ckd":
            explainer = self.explainer_ckd
            shap_obj = explainer(X)
            feat_names = self.feature_names
            target_prob = prob_ckd
        else:
            explainer = self.explainer_cvd
            X_ckm = np.hstack([X, np.array([[prob_t2d, prob_ckd]])])
            prob_cvd = float(self.model_cvd.predict_proba(X_ckm)[0, 1])
            shap_obj = explainer(X_ckm)
            feat_names = self.feature_names + ["predicted_risk_t2d", "predicted_risk_ckd"]
            target_prob = prob_cvd
            
        base_val = float(explainer.expected_value) if not isinstance(explainer.expected_value, np.ndarray) else float(explainer.expected_value[0])
        values = np.array(shap_obj.values[0], dtype=float)
        
        # Calibrate SHAP decomposition to match calibrated risk probability (Finding 6)
        raw_sum = float(np.sum(values))
        target_diff = (target_prob * 100.0) - (base_val * 100.0)
        scale = (target_diff / (raw_sum * 100.0)) if abs(raw_sum) > 1e-5 else 1.0
        calibrated_values = values * scale
        
        contributions = []
        for fn, val in zip(feat_names, calibrated_values):
            # Express in percentage points (FM-06)
            contributions.append({
                "feature": fn,
                "shap_value_percentage_points": round(float(val * 100), 2),
                "patient_value": str(patient_dict.get(fn, round(prob_t2d if fn == "predicted_risk_t2d" else prob_ckd, 3) if "predicted_risk" in fn else ""))
            })
            
        contributions.sort(key=lambda x: abs(x["shap_value_percentage_points"]), reverse=True)
        
        return {
            "target": target,
            "base_probability_percentage": round(base_val * 100, 1),
            "top_contributions": contributions[:10],
            "all_contributions": contributions
        }

    def simulate_counterfactual(self, patient_dict, overrides, preset_name=None, couple_biology=True):
        """
        Physiologically Constrained Counterfactual Engine (FM-07):
        - Enforces immutable features (age, sex, ethnicity, family history locked)
        - Handles clinical trial presets (SGLT2i, GLP-1, RAAS+Statin, Lifestyle)
        - Propagates biological coupling matrix J_phys (BMI drops lower SBP, HbA1c, Triglycerides)
        - Caps short-term eGFR gains (+8 mL/min max)
        """
        baseline_result = self.predict_patient(patient_dict)
        cf = dict(patient_dict)
        
        # Lock immutable features (FM-07 Tier 0)
        for imm in IMMUTABLE_FEATURES:
            overrides.pop(imm, None)
            
        # Handle Clinical Trial Presets if triggered
        if preset_name and preset_name in CLINICAL_TRIAL_PRESETS:
            preset = CLINICAL_TRIAL_PRESETS[preset_name]
            deltas = preset["deltas"]
            if "hba1c" in deltas:
                cf["hba1c"] = max(4.8, cf["hba1c"] + deltas["hba1c"])
            if "systolic_bp" in deltas:
                cf["systolic_bp"] = max(100.0, cf["systolic_bp"] + deltas["systolic_bp"])
            if "uacr_mult" in deltas:
                cf["uacr"] = max(3.0, round(cf["uacr"] * deltas["uacr_mult"], 1))
            if "bmi_pct" in deltas:
                cf["bmi"] = round(cf["bmi"] * (1.0 + deltas["bmi_pct"]), 1)
            if "ldl_pct" in deltas:
                cf["ldl_cholesterol"] = round(cf["ldl_cholesterol"] * (1.0 + deltas["ldl_pct"]), 1)
            if "triglycerides_pct" in deltas:
                cf["triglycerides"] = round(cf["triglycerides"] * (1.0 + deltas["triglycerides_pct"]), 1)
            if "smoking_status" in deltas:
                cf["smoking_status"] = deltas["smoking_status"]
            if "physical_activity" in deltas:
                cf["physical_activity"] = deltas["physical_activity"]
                
        # Biological Coupling: BMI shift propagation (FM-07 Tier 2)
        if couple_biology and "bmi" in overrides:
            delta_bmi = overrides["bmi"] - patient_dict["bmi"]
            if "hba1c" not in overrides:
                cf["hba1c"] = round(max(4.8, cf["hba1c"] + 0.11 * delta_bmi), 2)
            if "systolic_bp" not in overrides:
                cf["systolic_bp"] = round(max(95.0, cf["systolic_bp"] + 1.15 * delta_bmi), 0)
            if "triglycerides" not in overrides:
                cf["triglycerides"] = round(max(45.0, cf["triglycerides"] + 4.2 * delta_bmi), 1)
                
        # Apply explicit user overrides
        for k, v in overrides.items():
            if k not in IMMUTABLE_FEATURES and v is not None:
                try:
                    cf[k] = float(v) if k in PHYSIOLOGICAL_BOUNDS else v
                except (ValueError, TypeError):
                    continue
                
        # Coherent lipid re-calculation (Finding 9)
        preset_deltas = CLINICAL_TRIAL_PRESETS.get(preset_name, {}).get("deltas", {}) if preset_name else {}
        if "ldl_pct" in preset_deltas or "ldl_cholesterol" in overrides:
            if "total_cholesterol" not in overrides:
                delta_ldl = cf.get("ldl_cholesterol", 100.0) - patient_dict.get("ldl_cholesterol", cf.get("ldl_cholesterol", 100.0))
                cf["total_cholesterol"] = max(90.0, cf.get("total_cholesterol", 200.0) + delta_ldl)
        if "total_cholesterol" in cf and "hdl_cholesterol" in cf:
            cf["non_hdl_cholesterol"] = max(30.0, cf["total_cholesterol"] - cf["hdl_cholesterol"])

        # Clamp to physiological bounds safely (Finding 2)
        for k, (low, high) in PHYSIOLOGICAL_BOUNDS.items():
            if k in cf and cf[k] is not None:
                try:
                    cf[k] = float(np.clip(float(cf[k]), low, high))
                except (ValueError, TypeError):
                    cf[k] = float(patient_dict.get(k, low))
                
        # Prevent impossible short-term nephron regeneration
        patient_egfr = _safe_float(patient_dict.get("egfr"), 90.0)
        if _safe_float(cf.get("egfr"), 90.0) > patient_egfr + 8.0:
            cf["egfr"] = min(120.0, patient_egfr + 8.0)
            
        intervened_result = self.predict_patient(cf)
        
        arr_comp = baseline_result["probabilities"]["composite"] - intervened_result["probabilities"]["composite"]
        rrr_comp = (arr_comp / baseline_result["probabilities"]["composite"]) * 100 if baseline_result["probabilities"]["composite"] > 0 else 0
        
        return {
            "baseline": baseline_result,
            "intervened": intervened_result,
            "intervened_patient_data": cf,
            "absolute_risk_reduction": {
                "composite": round(arr_comp, 4),
                "t2d": round(baseline_result["probabilities"]["t2d"] - intervened_result["probabilities"]["t2d"], 4),
                "ckd": round(baseline_result["probabilities"]["ckd"] - intervened_result["probabilities"]["ckd"], 4),
                "cvd": round(baseline_result["probabilities"]["cvd"] - intervened_result["probabilities"]["cvd"], 4)
            },
            "relative_risk_reduction_pct": {
                "composite": round(rrr_comp, 1)
            }
        }

if __name__ == "__main__":
    audit_and_mitigate_fairness()
    cds = ClinicalDecisionSupportEngine()
    test_pt = {
        "age": 67, "sex": "Male", "ethnicity": "White", "ses_decile": 7, "insurance_type": "Medicare",
        "smoking_status": "Current", "physical_activity": "Sedentary", "bmi": 32.5, "waist_circ_cm": 104.0,
        "systolic_bp": 158.0, "diastolic_bp": 92.0, "resting_heart_rate": 80.0, "hba1c": 8.4,
        "fasting_glucose": 178.0, "serum_creatinine": 2.2, "egfr": 26.0, "uacr": 410.0,
        "total_cholesterol": 240.0, "ldl_cholesterol": 155.0, "hdl_cholesterol": 36.0,
        "triglycerides": 250.0, "non_hdl_cholesterol": 204.0, "hs_crp": 5.2,
        "history_hypertension": 1, "history_dyslipidemia": 1, "family_history_diabetes": 1,
        "family_history_cvd": 1, "current_antihypertensive": 1, "current_statin": 1
    }
    pred = cds.predict_patient(test_pt)
    print("\n--- Clinical CDS Test Output ---")
    print("CKM Stage:", pred["ckm_stage"])
    print("Contraindication Alerts:", pred["contraindication_alerts"])
    print("Composite Risk:", pred["probabilities"]["composite"], f"({pred['tier']} Tier)")
    
    sim = cds.simulate_counterfactual(test_pt, {}, preset_name="preset_sglt2i")
    print("\n--- SGLT2i Clinical Trial Preset Simulation ---")
    print("Post-Intervention Composite:", sim["intervened"]["probabilities"]["composite"])
    print("Absolute Risk Reduction:", sim["absolute_risk_reduction"]["composite"])
