"""
VitaRisk CDS - Synthetic Longitudinal EHR Cohort Generator
Generates clinically grounded, statistically realistic Electronic Health Record (EHR) data
with physiological correlations, clinical risk equations, and fairness attributes.
Cohort Size: N = 12,000 patients
Features: 32 clinical, demographic, and laboratory variables
"""

import numpy as np
import pandas as pd
import os

SEED = 42
np.random.seed(SEED)

def calculate_egfr_ckd_epi_2021(serum_cr, sex, age):
    """
    2021 CKD-EPI Creatinine Equation (Race-free, as recommended by NKF and ASN):
    Female: k = 0.7, a = -0.241 (if Cr <= 0.7) else -1.2
    Male:   k = 0.9, a = -0.302 (if Cr <= 0.9) else -1.2
    eGFR = 142 * min(Scr/k, 1)^a * max(Scr/k, 1)^(-1.2) * 0.9938^Age * (1.012 if female else 1.0)
    """
    egfr_list = []
    for scr, s, a in zip(serum_cr, sex, age):
        is_female = (s == "Female")
        k = 0.7 if is_female else 0.9
        alpha = (-0.241 if scr <= k else -1.200) if is_female else (-0.302 if scr <= k else -1.200)
        gender_mult = 1.012 if is_female else 1.0
        
        ratio = scr / k
        egfr = 142 * (min(ratio, 1.0) ** alpha) * (max(ratio, 1.0) ** -1.2) * (0.9938 ** a) * gender_mult
        egfr_list.append(round(float(np.clip(egfr, 5.0, 140.0)), 1))
    return np.array(egfr_list)

def generate_cohort(n_patients=12000, output_path="data/ehr_cohort.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 1. Demographics & Protected Attributes
    patient_ids = [f"PAT-{i+1:05d}" for i in range(n_patients)]
    
    # Age: Bimodal / adult primary care distribution (18-85, mean ~54)
    age = np.clip(np.random.normal(54, 14, n_patients).astype(int), 18, 88)
    
    # Sex: ~52% Female, 48% Male
    sex = np.random.choice(["Female", "Male"], size=n_patients, p=[0.52, 0.48])
    
    # Race / Ethnicity (US Census representative distribution)
    ethnicity = np.random.choice(
        ["White", "Black/African American", "Hispanic/Latino", "Asian", "Other/Multiracial"],
        size=n_patients,
        p=[0.58, 0.16, 0.16, 0.06, 0.04]
    )
    
    # Area Deprivation / SES Index (1 = lowest deprivation / high wealth, 10 = highest deprivation)
    ses_decile = np.random.choice(np.arange(1, 11), size=n_patients)
    
    # Insurance type correlated with age and SES
    insurance = []
    for a, s in zip(age, ses_decile):
        if a >= 65:
            insurance.append("Medicare")
        elif s >= 8:
            insurance.append(np.random.choice(["Medicaid", "Uninsured", "Commercial"], p=[0.60, 0.15, 0.25]))
        else:
            insurance.append(np.random.choice(["Commercial", "Medicaid", "Uninsured"], p=[0.85, 0.10, 0.05]))
    insurance = np.array(insurance)
    
    # 2. Lifestyle Factors
    # Smoking: correlated with SES and age
    smoking_prob_high = 0.25 + 0.02 * (ses_decile - 5)
    smoking_prob_high = np.clip(smoking_prob_high, 0.10, 0.40)
    smoking_status = []
    for sp in smoking_prob_high:
        r = np.random.rand()
        if r < sp:
            smoking_status.append("Current")
        elif r < sp + 0.28:
            smoking_status.append("Former")
        else:
            smoking_status.append("Never")
    smoking_status = np.array(smoking_status)
    
    # Physical Activity
    activity_probs = [0.35, 0.45, 0.20] # Sedentary, Moderate, Active
    physical_activity = np.random.choice(["Sedentary", "Moderate", "Active"], size=n_patients, p=activity_probs)
    
    # 3. Anthropometrics & Vitals
    # BMI: Normal ~22-25, Overweight 25-30, Obese >30
    # Positively shifted with age, sedentary activity, and higher SES deprivation
    bmi_base = 27.5 + (age - 50) * 0.04 + (ses_decile - 5) * 0.35
    bmi_activity_offset = np.where(physical_activity == "Sedentary", 2.2, np.where(physical_activity == "Active", -1.8, 0.0))
    bmi = np.clip(bmi_base + bmi_activity_offset + np.random.normal(0, 4.5, n_patients), 17.0, 52.0)
    bmi = np.round(bmi, 1)
    
    # Waist Circumference (cm): correlated with BMI and sex
    waist_circ = np.where(sex == "Male", bmi * 2.8 + np.random.normal(12, 6, n_patients), bmi * 2.6 + np.random.normal(14, 6, n_patients))
    waist_circ = np.round(np.clip(waist_circ, 60.0, 145.0), 1)
    
    # Systolic & Diastolic BP:
    # Systolic rises strongly with age, BMI, and smoking
    sbp_base = 115 + (age - 40) * 0.55 + (bmi - 25) * 0.95 + np.where(smoking_status == "Current", 5, 0)
    sbp = np.clip(sbp_base + np.random.normal(0, 11, n_patients), 90.0, 210.0)
    sbp = np.round(sbp, 0)
    
    dbp_base = 74 + (age - 40) * 0.15 + (bmi - 25) * 0.45
    dbp = np.clip(dbp_base + np.random.normal(0, 7.5, n_patients), 55.0, 125.0)
    dbp = np.round(dbp, 0)
    
    resting_hr = np.round(np.clip(72 + (bmi - 25) * 0.3 + np.where(physical_activity == "Active", -8, 4) + np.random.normal(0, 8, n_patients), 48, 115), 0)
    
    # 4. Metabolic & Glycemic Biomarkers
    # Fasting Glucose & HbA1c: strongly correlated with BMI, age, and sedentary habits
    metabolic_score = (bmi - 25) * 0.08 + (age - 50) * 0.03 + np.where(physical_activity == "Sedentary", 0.3, 0.0) + (waist_circ - 90) * 0.02
    hba1c_base = 5.4 + metabolic_score * 0.5 + np.random.exponential(0.35, n_patients)
    hba1c = np.round(np.clip(hba1c_base, 4.5, 13.8), 2)
    
    # Fasting Glucose (mg/dL): physiological relation to HbA1c: (HbA1c - 5.0) * 30 + 90
    fasting_glucose = (hba1c - 5.0) * 28 + 92 + np.random.normal(0, 12, n_patients)
    fasting_glucose = np.round(np.clip(fasting_glucose, 65.0, 360.0), 1)
    
    # 5. Lipid Panel Biomarkers
    # Total Cholesterol, LDL, HDL, Triglycerides
    total_chol = np.round(np.clip(195 + (age - 50) * 0.4 + (bmi - 25) * 1.1 + np.random.normal(0, 32, n_patients), 110, 360), 1)
    hdl = np.round(np.clip(54 - (bmi - 25) * 0.65 + np.where(sex == "Female", 8, -4) + np.where(physical_activity == "Active", 7, -3) + np.random.normal(0, 9, n_patients), 20, 105), 1)
    triglycerides = np.round(np.clip(135 + (bmi - 25) * 3.5 + (hba1c - 5.5) * 18 + np.random.exponential(35, n_patients), 45, 650), 1)
    ldl = np.round(np.clip(total_chol - hdl - (triglycerides / 5.0), 35, 260), 1)
    
    # Systemic Inflammation: High-Sensitivity C-Reactive Protein (hs-CRP, mg/L)
    hs_crp = np.round(np.clip(np.exp((bmi - 25) * 0.05 + (sbp - 120) * 0.008 + np.where(smoking_status == "Current", 0.5, 0)) * 0.9 + np.random.exponential(0.8, n_patients), 0.1, 25.0), 2)
    
    # 6. Renal Biomarkers: Serum Creatinine, eGFR, UACR
    # Baseline creatinine (mg/dL) - slightly higher in males due to muscle mass
    cr_base = np.where(sex == "Male", 0.95, 0.75) + (age - 50) * 0.004 + (sbp - 120) * 0.0025 + (hba1c - 5.5) * 0.04
    serum_cr = np.round(np.clip(cr_base + np.random.exponential(0.18, n_patients), 0.45, 4.8), 2)
    
    # Calculate eGFR (CKD-EPI 2021)
    egfr = calculate_egfr_ckd_epi_2021(serum_cr, sex, age)
    
    # Urine Albumin-to-Creatinine Ratio (UACR, mg/g)
    # Strongly elevated in hypertension and diabetes
    uacr_log = np.log(12) + (hba1c - 5.5) * 0.35 + (sbp - 120) * 0.018 + np.random.normal(0, 0.75, n_patients)
    uacr = np.round(np.clip(np.exp(uacr_log), 2.0, 2400.0), 1)
    
    # 7. Comorbidities & Medical History
    history_hypertension = (sbp >= 140) | (dbp >= 90) | (np.random.rand(n_patients) < 0.22)
    history_hypertension = history_hypertension.astype(int)
    
    history_dyslipidemia = (ldl >= 160) | (triglycerides >= 200) | (np.random.rand(n_patients) < 0.25)
    history_dyslipidemia = history_dyslipidemia.astype(int)
    
    family_history_diabetes = (np.random.rand(n_patients) < 0.32).astype(int)
    family_history_cvd = (np.random.rand(n_patients) < 0.28).astype(int)
    
    current_antihypertensive = np.where(history_hypertension == 1, (np.random.rand(n_patients) < 0.68).astype(int), 0)
    current_statin = np.where(history_dyslipidemia == 1, (np.random.rand(n_patients) < 0.58).astype(int), 0)
    
    # 8. Longitudinal Ground Truth 5-Year Disease Onset Equations
    # Calibrated for realistic clinical cohort with representative risk strata
    
    # A) Type 2 Diabetes (T2D) 5-Year Onset Risk
    t2d_linear = (
        -4.6
        + 1.45 * (hba1c - 5.4)
        + 0.024 * (fasting_glucose - 90)
        + 0.095 * (bmi - 25)
        + 0.028 * (waist_circ - 85)
        + 0.022 * (age - 45)
        + 0.65 * family_history_diabetes
        + 0.40 * (history_hypertension)
        + 0.45 * (physical_activity == "Sedentary")
        + np.random.normal(0, 0.35, n_patients)
    )
    prob_t2d = 1.0 / (1.0 + np.exp(-t2d_linear))
    onset_t2d = (np.random.rand(n_patients) < prob_t2d).astype(int)
    
    # B) Chronic Kidney Disease (CKD) 5-Year Progression Risk
    ckd_linear = (
        -3.4
        + 0.075 * (60 - egfr)
        + 0.72 * np.log(np.maximum(uacr, 5) / 10.0)
        + 0.60 * (hba1c - 5.5)
        + 0.028 * (sbp - 125)
        + 0.038 * (age - 50)
        + 0.50 * history_hypertension
        + 0.35 * (smoking_status == "Current")
        + np.random.normal(0, 0.40, n_patients)
    )
    prob_ckd = 1.0 / (1.0 + np.exp(-ckd_linear))
    onset_ckd = (np.random.rand(n_patients) < prob_ckd).astype(int)
    
    # C) Cardiovascular Disease (CVD / MACE) 5-Year Risk
    cvd_linear = (
        -4.1
        + 0.065 * (age - 50)
        + 0.028 * (sbp - 120)
        + 0.015 * (ldl - 100)
        - 0.032 * (hdl - 50)
        + 0.65 * (hba1c >= 6.5).astype(int)
        + 0.85 * (smoking_status == "Current")
        + 0.50 * family_history_cvd
        + 0.35 * (sex == "Male").astype(int)
        + 0.18 * np.log(np.maximum(hs_crp, 0.5))
        + np.random.normal(0, 0.35, n_patients)
    )
    prob_cvd = 1.0 / (1.0 + np.exp(-cvd_linear))
    onset_cvd = (np.random.rand(n_patients) < prob_cvd).astype(int)
    
    # D) Multimorbidity Onset (>= 2 chronic diseases)
    onset_multimorbidity = ((onset_t2d + onset_ckd + onset_cvd) >= 2).astype(int)
    
    # E) Composite Clinical Risk Score (0.0 - 1.0)
    composite_risk = np.round(0.40 * prob_cvd + 0.35 * prob_t2d + 0.25 * prob_ckd, 3)
    
    # F) Clinical Risk Stratification Tier
    risk_tier = []
    for cr in composite_risk:
        if cr < 0.15:
            risk_tier.append("Low")
        elif cr < 0.35:
            risk_tier.append("Moderate")
        elif cr < 0.60:
            risk_tier.append("High")
        else:
            risk_tier.append("Critical")
    risk_tier = np.array(risk_tier)
    
    # Assemble DataFrame
    df = pd.DataFrame({
        "patient_id": patient_ids,
        "age": age,
        "sex": sex,
        "ethnicity": ethnicity,
        "ses_decile": ses_decile,
        "insurance_type": insurance,
        "smoking_status": smoking_status,
        "physical_activity": physical_activity,
        "bmi": bmi,
        "waist_circ_cm": waist_circ,
        "systolic_bp": sbp,
        "diastolic_bp": dbp,
        "resting_heart_rate": resting_hr,
        "hba1c": hba1c,
        "fasting_glucose": fasting_glucose,
        "serum_creatinine": serum_cr,
        "egfr": egfr,
        "uacr": uacr,
        "total_cholesterol": total_chol,
        "ldl_cholesterol": ldl,
        "hdl_cholesterol": hdl,
        "triglycerides": triglycerides,
        "hs_crp": hs_crp,
        "history_hypertension": history_hypertension,
        "history_dyslipidemia": history_dyslipidemia,
        "family_history_diabetes": family_history_diabetes,
        "family_history_cvd": family_history_cvd,
        "current_antihypertensive": current_antihypertensive,
        "current_statin": current_statin,
        # Probabilities & Targets
        "prob_t2d": np.round(prob_t2d, 4),
        "prob_ckd": np.round(prob_ckd, 4),
        "prob_cvd": np.round(prob_cvd, 4),
        "composite_risk_score": composite_risk,
        "onset_t2d": onset_t2d,
        "onset_ckd": onset_ckd,
        "onset_cvd": onset_cvd,
        "onset_multimorbidity": onset_multimorbidity,
        "risk_tier": risk_tier
    })
    
    df.to_csv(output_path, index=False)
    print(f"✅ Generated {len(df)} patient EHR records to '{output_path}'.")
    print("\n--- Summary Statistics ---")
    print(f"Age: Mean = {df['age'].mean():.1f}, Range = {df['age'].min()} - {df['age'].max()}")
    print(f"Sex: Female = {(df['sex'] == 'Female').mean()*100:.1f}%, Male = {(df['sex'] == 'Male').mean()*100:.1f}%")
    print(f"T2D 5-Year Onset Prevalence: {df['onset_t2d'].mean()*100:.2f}%")
    print(f"CKD 5-Year Progression Prevalence: {df['onset_ckd'].mean()*100:.2f}%")
    print(f"CVD 5-Year Event Prevalence: {df['onset_cvd'].mean()*100:.2f}%")
    print(f"Multimorbidity Prevalence: {df['onset_multimorbidity'].mean()*100:.2f}%")
    print("\nRisk Tier Distribution:")
    print(df['risk_tier'].value_counts(normalize=True).round(3) * 100)
    
    return df

if __name__ == "__main__":
    generate_cohort()
