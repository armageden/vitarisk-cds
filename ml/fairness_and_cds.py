"""
VitaRisk CDS - Algorithmic Fairness Auditing & Clinical Decision Support Engine
Performs demographic parity, equalized odds, and disparate impact audits across
Sex, Ethnicity, Age, and SES subgroups. Implements evidence-based clinical guideline
decision support (ADA 2026, KDIGO, ACC/AHA) and counterfactual what-if simulation.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, brier_score_loss

def audit_fairness(test_csv_path="ml/artifacts/test_cohort.csv", artifacts_dir="ml/artifacts"):
    df = pd.read_csv(test_csv_path)
    scaler = joblib.load(os.path.join(artifacts_dir, "scaler.joblib"))
    encoder = joblib.load(os.path.join(artifacts_dir, "encoder.joblib"))
    
    # Load feature names
    with open(os.path.join(artifacts_dir, "feature_names.json")) as f:
        feature_names = json.load(f)
        
    from ml.train_models import transform_features, TARGETS
    X_test = transform_features(df, scaler, encoder)
    
    models = {t: joblib.load(os.path.join(artifacts_dir, f"best_model_{t}.joblib")) for t in TARGETS}
    
    # Generate model predictions
    preds_prob = {}
    preds_bin = {}
    for t in TARGETS:
        prob = models[t].predict_proba(X_test)[:, 1]
        preds_prob[t] = prob
        preds_bin[t] = (prob >= 0.35).astype(int) # High-sensitivity clinical screening threshold
        
    df["pred_prob_t2d"] = preds_prob["onset_t2d"]
    df["pred_prob_ckd"] = preds_prob["onset_ckd"]
    df["pred_prob_cvd"] = preds_prob["onset_cvd"]
    df["pred_bin_t2d"] = preds_bin["onset_t2d"]
    df["pred_bin_ckd"] = preds_bin["onset_ckd"]
    df["pred_bin_cvd"] = preds_bin["onset_cvd"]
    
    # Add age group
    df["age_group"] = pd.cut(df["age"], bins=[0, 45, 64, 120], labels=["<45", "45-64", "65+"])
    df["ses_group"] = pd.cut(df["ses_decile"], bins=[0, 3, 7, 10], labels=["High SES", "Medium SES", "Low SES (Deprived)"])
    
    protected_attrs = ["sex", "ethnicity", "age_group", "ses_group"]
    
    fairness_report = {}
    
    for target in TARGETS:
        target_report = {}
        y_true = df[target].values
        y_pred = df[f"pred_bin_{target.replace('onset_', '')}"].values
        y_prob = df[f"pred_prob_{target.replace('onset_', '')}"].values
        
        for attr in protected_attrs:
            subgroups = df[attr].dropna().unique()
            attr_metrics = {}
            selection_rates = []
            tpr_rates = []
            fpr_rates = []
            
            for grp in sorted(subgroups):
                idx = (df[attr] == grp).values
                n_grp = int(np.sum(idx))
                if n_grp == 0:
                    continue
                
                grp_y_true = y_true[idx]
                grp_y_pred = y_pred[idx]
                grp_y_prob = y_prob[idx]
                
                selection_rate = float(np.mean(grp_y_pred))
                pos_idx = (grp_y_true == 1)
                neg_idx = (grp_y_true == 0)
                
                tpr = float(np.mean(grp_y_pred[pos_idx])) if np.sum(pos_idx) > 0 else 0.0
                fpr = float(np.mean(grp_y_pred[neg_idx])) if np.sum(neg_idx) > 0 else 0.0
                auc = float(roc_auc_score(grp_y_true, grp_y_prob)) if len(np.unique(grp_y_true)) > 1 else 1.0
                brier = float(brier_score_loss(grp_y_true, grp_y_prob))
                
                selection_rates.append(selection_rate)
                tpr_rates.append(tpr)
                fpr_rates.append(fpr)
                
                attr_metrics[str(grp)] = {
                    "count": n_grp,
                    "prevalence": round(float(np.mean(grp_y_true)), 4),
                    "selection_rate": round(selection_rate, 4),
                    "tpr_sensitivity": round(tpr, 4),
                    "fpr": round(fpr, 4),
                    "roc_auc": round(auc, 4),
                    "brier_score": round(brier, 4)
                }
                
            # Disparate Impact Ratio = min selection rate / max selection rate
            min_sr = min(selection_rates) if selection_rates else 1.0
            max_sr = max(selection_rates) if selection_rates else 1.0
            disparate_impact = (min_sr / max_sr) if max_sr > 0 else 1.0
            
            # Demographic Parity Difference = max selection rate - min selection rate
            demographic_parity_diff = max_sr - min_sr
            
            # Equal Opportunity Difference = max TPR - min TPR
            equal_opp_diff = (max(tpr_rates) - min(tpr_rates)) if tpr_rates else 0.0
            
            target_report[attr] = {
                "subgroups": attr_metrics,
                "disparate_impact_ratio": round(disparate_impact, 4),
                "demographic_parity_difference": round(demographic_parity_diff, 4),
                "equal_opportunity_difference": round(equal_opp_diff, 4),
                "passes_four_fifths_rule": bool(disparate_impact >= 0.80)
            }
            
        fairness_report[target] = target_report
        
    with open(os.path.join(artifacts_dir, "fairness_audit.json"), "w") as f:
        json.dump(fairness_report, f, indent=2)
        
    print("✅ Algorithmic Fairness Audit complete and saved to 'ml/artifacts/fairness_audit.json'.")
    return fairness_report

class ClinicalDecisionSupportEngine:
    """
    Evidence-based clinical guidelines engine aligning risk predictions
    with ADA 2026, ACC/AHA, and KDIGO guidelines.
    """
    def __init__(self, artifacts_dir="ml/artifacts"):
        self.artifacts_dir = artifacts_dir
        self.scaler = joblib.load(os.path.join(artifacts_dir, "scaler.joblib"))
        self.encoder = joblib.load(os.path.join(artifacts_dir, "encoder.joblib"))
        with open(os.path.join(artifacts_dir, "feature_names.json")) as f:
            self.feature_names = json.load(f)
            
        from ml.train_models import TARGETS
        self.models = {t: joblib.load(os.path.join(artifacts_dir, f"best_model_{t}.joblib")) for t in TARGETS}
        self.explainers = {t: joblib.load(os.path.join(artifacts_dir, f"shap_explainer_{t}.joblib")) for t in TARGETS}

    def predict_patient(self, patient_dict):
        """Calculates multi-disease risks, composite tier, and guideline recommendations."""
        from ml.train_models import transform_features
        df_patient = pd.DataFrame([patient_dict])
        X = transform_features(df_patient, self.scaler, self.encoder)
        
        prob_t2d = float(self.models["onset_t2d"].predict_proba(X)[0, 1])
        prob_ckd = float(self.models["onset_ckd"].predict_proba(X)[0, 1])
        prob_cvd = float(self.models["onset_cvd"].predict_proba(X)[0, 1])
        
        # Composite score
        composite_score = round(0.35 * prob_t2d + 0.25 * prob_ckd + 0.40 * prob_cvd, 3)
        
        if composite_score < 0.15:
            tier = "Low"
            urgency = "Routine (Annual)"
            color = "#10b981" # green
        elif composite_score < 0.35:
            tier = "Moderate"
            urgency = "Proactive (3-6 Months)"
            color = "#f59e0b" # amber
        elif composite_score < 0.60:
            tier = "High"
            urgency = "Prompt (1-3 Months)"
            color = "#f97316" # orange
        else:
            tier = "Critical"
            urgency = "Immediate Specialist Referral"
            color = "#ef4444" # red
            
        # Clinical guideline recommendations
        recommendations = []
        
        # 1. Glycemic / Metabolic Management (ADA 2026 Standards of Care)
        hba1c = patient_dict.get("hba1c", 5.5)
        bmi = patient_dict.get("bmi", 25.0)
        if hba1c >= 6.5 or prob_t2d >= 0.50:
            recommendations.append({
                "category": "Endocrine & Glycemic Control (ADA 2026)",
                "action": "Initiate first-line dual organ-protective pharmacotherapy (Metformin + SGLT2i / GLP-1 RA).",
                "evidence_level": "Level A (RCT Strong Evidence)",
                "target": "Target HbA1c < 7.0% without hypoglycemia."
            })
        elif hba1c >= 5.7 or prob_t2d >= 0.25:
            recommendations.append({
                "category": "Prediabetes Prevention (ADA 2026)",
                "action": "Intensive lifestyle intervention (Diabetes Prevention Program DPP): target >= 7% weight reduction and 150 min/wk moderate activity.",
                "evidence_level": "Level A (DPP Trial)",
                "target": "Target fasting glucose < 100 mg/dL and HbA1c < 5.7%."
            })
            
        # 2. Renal Protection (KDIGO 2024 Guidelines)
        egfr = patient_dict.get("egfr", 90.0)
        uacr = patient_dict.get("uacr", 10.0)
        if egfr < 60.0 or uacr >= 30.0 or prob_ckd >= 0.40:
            recommendations.append({
                "category": "Renal Protection & Nephroprotection (KDIGO 2024)",
                "action": "Prescribe SGLT2 inhibitor (e.g., Dapagliflozin/Empagliflozin) + optimized maximally tolerated ACEi/ARB for kidney protection.",
                "evidence_level": "Grade 1A (KDIGO 2024)",
                "target": "UACR reduction by >= 30%, maintain eGFR trajectory decline < 1 mL/min/1.73m2/year."
            })
        elif prob_ckd >= 0.20:
            recommendations.append({
                "category": "Renal Surveillance (KDIGO)",
                "action": "Perform semi-annual serum creatinine, eGFR, and spot urine albumin-to-creatinine ratio (UACR). Avoid chronic NSAIDs.",
                "evidence_level": "Grade 2B",
                "target": "Repeat UACR in 6 months to assess persistent microalbuminuria."
            })
            
        # 3. Cardiovascular & Blood Pressure (ACC/AHA 2023 Guidelines)
        sbp = patient_dict.get("systolic_bp", 120.0)
        ldl = patient_dict.get("ldl_cholesterol", 100.0)
        smoking = patient_dict.get("smoking_status", "Never")
        if sbp >= 130 or prob_cvd >= 0.20:
            recommendations.append({
                "category": "Cardiovascular Prevention & Hemodynamics (ACC/AHA)",
                "action": "Titrate antihypertensive regimen to achieve intensive systolic blood pressure target < 130 mmHg.",
                "evidence_level": "Class I, Level A (SPRINT Trial)",
                "target": "Target SBP < 130 mmHg, DBP < 80 mmHg."
            })
        if ldl >= 100 or prob_cvd >= 0.15:
            recommendations.append({
                "category": "Lipid Lowering Therapy (ACC/AHA)",
                "action": "Initiate or intensify moderate-to-high intensity statin therapy (Atorvastatin 20-40mg or Rosuvastatin 10-20mg).",
                "evidence_level": "Class I, Level A",
                "target": "Target LDL-C reduction >= 50% or LDL-C < 70 mg/dL."
            })
        if smoking == "Current":
            recommendations.append({
                "category": "Tobacco Cessation (USPSTF)",
                "action": "Provide FDA-approved pharmacotherapy (Varenicline or dual NRT) combined with behavioral counseling.",
                "evidence_level": "Grade A Recommendation",
                "target": "Complete smoking cessation within 12 weeks."
            })
            
        return {
            "probabilities": {
                "t2d": round(prob_t2d, 4),
                "ckd": round(prob_ckd, 4),
                "cvd": round(prob_cvd, 4),
                "composite": composite_score
            },
            "tier": tier,
            "urgency": urgency,
            "color": color,
            "recommendations": recommendations
        }

    def explain_patient(self, patient_dict, target="onset_t2d"):
        """Computes patient-level SHAP local waterfall values."""
        from ml.train_models import transform_features
        df_patient = pd.DataFrame([patient_dict])
        X = transform_features(df_patient, self.scaler, self.encoder)
        
        explainer = self.explainers[target]
        shap_res = explainer(X)
        
        base_value = float(explainer.expected_value) if not isinstance(explainer.expected_value, np.ndarray) else float(explainer.expected_value[1] if len(explainer.expected_value) > 1 else explainer.expected_value[0])
        values = shap_res.values[0]
        if values.ndim == 2:
            values = values[:, 1]
            
        contributions = []
        for feat_name, sv in zip(self.feature_names, values):
            contributions.append({
                "feature": feat_name,
                "shap_value": round(float(sv), 4),
                "patient_value": str(patient_dict.get(feat_name, ""))
            })
            
        # Sort by absolute impact
        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        
        return {
            "target": target,
            "base_value": round(base_value, 4),
            "top_contributions": contributions[:10],
            "all_contributions": contributions
        }

    def simulate_counterfactual(self, patient_dict, interventions):
        """
        Interactively simulates biomarker changes (e.g. BMI -10%, SBP -20 mmHg, HbA1c -1.5%)
        and calculates absolute risk reduction (ARR) and relative risk reduction (RRR).
        """
        baseline_result = self.predict_patient(patient_dict)
        
        modified_patient = dict(patient_dict)
        for k, v in interventions.items():
            if k in modified_patient:
                modified_patient[k] = v
                
        intervened_result = self.predict_patient(modified_patient)
        
        arr_t2d = baseline_result["probabilities"]["t2d"] - intervened_result["probabilities"]["t2d"]
        arr_ckd = baseline_result["probabilities"]["ckd"] - intervened_result["probabilities"]["ckd"]
        arr_cvd = baseline_result["probabilities"]["cvd"] - intervened_result["probabilities"]["cvd"]
        arr_comp = baseline_result["probabilities"]["composite"] - intervened_result["probabilities"]["composite"]
        
        return {
            "baseline": baseline_result,
            "intervened": intervened_result,
            "absolute_risk_reduction": {
                "t2d": round(arr_t2d, 4),
                "ckd": round(arr_ckd, 4),
                "cvd": round(arr_cvd, 4),
                "composite": round(arr_comp, 4)
            },
            "relative_risk_reduction_pct": {
                "t2d": round((arr_t2d / baseline_result["probabilities"]["t2d"]) * 100, 1) if baseline_result["probabilities"]["t2d"] > 0 else 0,
                "ckd": round((arr_ckd / baseline_result["probabilities"]["ckd"]) * 100, 1) if baseline_result["probabilities"]["ckd"] > 0 else 0,
                "cvd": round((arr_cvd / baseline_result["probabilities"]["cvd"]) * 100, 1) if baseline_result["probabilities"]["cvd"] > 0 else 0,
                "composite": round((arr_comp / baseline_result["probabilities"]["composite"]) * 100, 1) if baseline_result["probabilities"]["composite"] > 0 else 0
            }
        }

if __name__ == "__main__":
    audit_fairness()
    cds = ClinicalDecisionSupportEngine()
    sample_pt = {
        "age": 62,
        "sex": "Male",
        "ethnicity": "Black/African American",
        "ses_decile": 7,
        "insurance_type": "Medicare",
        "smoking_status": "Current",
        "physical_activity": "Sedentary",
        "bmi": 32.4,
        "waist_circ_cm": 104.0,
        "systolic_bp": 148.0,
        "diastolic_bp": 92.0,
        "resting_heart_rate": 78.0,
        "hba1c": 7.8,
        "fasting_glucose": 164.0,
        "serum_creatinine": 1.45,
        "egfr": 54.0,
        "uacr": 85.0,
        "total_cholesterol": 228.0,
        "ldl_cholesterol": 146.0,
        "hdl_cholesterol": 38.0,
        "triglycerides": 220.0,
        "hs_crp": 4.8,
        "history_hypertension": 1,
        "history_dyslipidemia": 1,
        "family_history_diabetes": 1,
        "family_history_cvd": 1,
        "current_antihypertensive": 1,
        "current_statin": 0
    }
    pred = cds.predict_patient(sample_pt)
    print("\n--- Sample Patient Prediction ---")
    print(f"Risk Tier: {pred['tier']} (Score: {pred['probabilities']['composite']})")
    print(f"Probabilities: T2D={pred['probabilities']['t2d']*100:.1f}%, CKD={pred['probabilities']['ckd']*100:.1f}%, CVD={pred['probabilities']['cvd']*100:.1f}%")
    print(f"Recommendations count: {len(pred['recommendations'])}")
    
    sim = cds.simulate_counterfactual(sample_pt, {
        "smoking_status": "Never",
        "hba1c": 6.4,
        "systolic_bp": 124.0,
        "bmi": 27.5
    })
    print(f"\n--- Counterfactual Simulation (Lifestyle + Treatment) ---")
    print(f"New Composite Score: {sim['intervened']['probabilities']['composite']} (ARR: -{sim['absolute_risk_reduction']['composite']*100:.1f}%, RRR: {sim['relative_risk_reduction_pct']['composite']}%)")
    print(f"New Tier: {sim['intervened']['tier']}")
