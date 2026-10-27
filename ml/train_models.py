"""
VitaRisk CDS - Multi-Disease Machine Learning Pipeline & SHAP Explainability
Trains benchmark models (Logistic Regression, Random Forest, XGBoost, LightGBM)
across 3 chronic disease endpoints (T2D, CKD, CVD) + Composite Risk,
computes calibration and discrimination metrics, and integrates SHAP TreeExplainer.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    accuracy_score,
    classification_report
)
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import shap

SEED = 42

FEATURE_COLS_NUMERIC = [
    "age",
    "bmi",
    "waist_circ_cm",
    "systolic_bp",
    "diastolic_bp",
    "resting_heart_rate",
    "hba1c",
    "fasting_glucose",
    "serum_creatinine",
    "egfr",
    "uacr",
    "total_cholesterol",
    "ldl_cholesterol",
    "hdl_cholesterol",
    "triglycerides",
    "hs_crp",
    "ses_decile"
]

FEATURE_COLS_BINARY = [
    "history_hypertension",
    "history_dyslipidemia",
    "family_history_diabetes",
    "family_history_cvd",
    "current_antihypertensive",
    "current_statin"
]

FEATURE_COLS_CATEGORICAL = [
    "sex",
    "smoking_status",
    "physical_activity",
    "insurance_type"
]

TARGETS = ["onset_t2d", "onset_ckd", "onset_cvd"]

def build_preprocessor(df):
    """Fits scalers and encoders on training data."""
    scaler = StandardScaler()
    scaler.fit(df[FEATURE_COLS_NUMERIC])
    
    encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    encoder.fit(df[FEATURE_COLS_CATEGORICAL])
    cat_feature_names = list(encoder.get_feature_names_out(FEATURE_COLS_CATEGORICAL))
    
    all_feature_names = FEATURE_COLS_NUMERIC + FEATURE_COLS_BINARY + cat_feature_names
    return scaler, encoder, all_feature_names

def transform_features(df, scaler, encoder):
    num_scaled = scaler.transform(df[FEATURE_COLS_NUMERIC])
    cat_encoded = encoder.transform(df[FEATURE_COLS_CATEGORICAL])
    binary_vals = df[FEATURE_COLS_BINARY].values
    X = np.hstack([num_scaled, binary_vals, cat_encoded])
    return X

def train_and_evaluate(data_path="data/ehr_cohort.csv", artifacts_dir="ml/artifacts"):
    os.makedirs(artifacts_dir, exist_ok=True)
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records from {data_path}")
    
    # Stratified Train/Val/Test Split (70% train, 15% val, 15% test)
    # Stratify by composite risk tier
    train_df, test_df = train_test_split(df, test_size=0.30, random_state=SEED, stratify=df["risk_tier"])
    val_df, test_df = train_test_split(test_df, test_size=0.50, random_state=SEED, stratify=test_df["risk_tier"])
    
    print(f"Split sizes: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    
    # Save splits for fairness auditing and reproducibility
    train_df.to_csv(os.path.join(artifacts_dir, "train_cohort.csv"), index=False)
    val_df.to_csv(os.path.join(artifacts_dir, "val_cohort.csv"), index=False)
    test_df.to_csv(os.path.join(artifacts_dir, "test_cohort.csv"), index=False)
    
    # Build Preprocessing pipeline
    scaler, encoder, feature_names = build_preprocessor(train_df)
    joblib.dump(scaler, os.path.join(artifacts_dir, "scaler.joblib"))
    joblib.dump(encoder, os.path.join(artifacts_dir, "encoder.joblib"))
    with open(os.path.join(artifacts_dir, "feature_names.json"), "w") as f:
        json.dump(feature_names, f, indent=2)
        
    X_train = transform_features(train_df, scaler, encoder)
    X_val = transform_features(val_df, scaler, encoder)
    X_test = transform_features(test_df, scaler, encoder)
    
    models_config = {
        "LogisticRegression": lambda: LogisticRegression(max_iter=1000, random_state=SEED, class_weight="balanced"),
        "RandomForest": lambda: RandomForestClassifier(n_estimators=150, max_depth=10, random_state=SEED, n_jobs=-1),
        "LightGBM": lambda: LGBMClassifier(n_estimators=150, max_depth=6, learning_rate=0.05, random_state=SEED, verbose=-1),
        "XGBoost": lambda: XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.05, eval_metric="logloss", random_state=SEED)
    }
    
    results = {}
    best_models = {}
    models_trained = {}
    
    for target in TARGETS:
        print(f"\n==========================================")
        print(f"Training models for target: {target.upper()}")
        print(f"==========================================")
        y_train = train_df[target].values
        y_val = val_df[target].values
        y_test = test_df[target].values
        
        target_results = {}
        models_trained[target] = {}
        
        for m_name, m_fn in models_config.items():
            model = m_fn()
            model.fit(X_train, y_train)
            models_trained[target][m_name] = model
            
            # Predict probabilities
            y_pred_prob = model.predict_proba(X_test)[:, 1]
            y_pred_bin = (y_pred_prob >= 0.5).astype(int)
            
            roc_auc = roc_auc_score(y_test, y_pred_prob)
            pr_auc = average_precision_score(y_test, y_pred_prob)
            brier = brier_score_loss(y_test, y_pred_prob)
            f1 = f1_score(y_test, y_pred_bin, zero_division=0)
            acc = accuracy_score(y_test, y_pred_bin)
            
            target_results[m_name] = {
                "ROC_AUC": round(float(roc_auc), 4),
                "PR_AUC": round(float(pr_auc), 4),
                "Brier_Score": round(float(brier), 4),
                "F1_Score": round(float(f1), 4),
                "Accuracy": round(float(acc), 4)
            }
            print(f"[{m_name}] ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f} | Brier: {brier:.4f} | F1: {f1:.4f}")
            
        results[target] = {
            "primary_production_model": "XGBoost",
            "metrics": target_results
        }
                
    # Select primary production model (XGBoost) for deployment & TreeExplainer
    # While recording benchmark metrics for all models (LR, RF, LGBM, XGB)
    for target in TARGETS:
        prod_model = models_trained[target]["XGBoost"]
        joblib.dump(prod_model, os.path.join(artifacts_dir, f"best_model_{target}.joblib"))
        best_models[target] = prod_model
        
    # Save overall benchmark metrics
    with open(os.path.join(artifacts_dir, "benchmark_metrics.json"), "w") as f:
        json.dump(results, f, indent=2)
        
    print("\n==========================================")
    print("Computing SHAP TreeExplainers & Feature Attributions (XGBoost Production)...")
    print("==========================================")
    global_importance = {}
    
    # Representative background sample
    X_background = shap.sample(X_train, 200, random_state=SEED)
    joblib.dump(X_background, os.path.join(artifacts_dir, "shap_background.joblib"))
    
    for target in TARGETS:
        model = best_models[target]
        print(f"Creating TreeExplainer for {target.upper()}...")
        explainer = shap.TreeExplainer(model)
        joblib.dump(explainer, os.path.join(artifacts_dir, f"shap_explainer_{target}.joblib"))
        
        # Compute sample SHAP values on test set (first 300 samples)
        shap_vals_obj = explainer(X_test[:300])
        vals = shap_vals_obj.values
        if vals.ndim == 3:
            vals = vals[:, :, 1]
        mean_abs_shap = np.mean(np.abs(vals), axis=0)
            
        ranking = [
            {"feature": f, "importance": round(float(imp), 5)}
            for f, imp in sorted(zip(feature_names, mean_abs_shap), key=lambda x: x[1], reverse=True)
        ]
        global_importance[target] = ranking[:15]
        print(f"Top 5 SHAP features for {target.upper()}:")
        for item in ranking[:5]:
            print(f"  {item['feature']}: {item['importance']}")
            
    with open(os.path.join(artifacts_dir, "global_shap_importance.json"), "w") as f:
        json.dump(global_importance, f, indent=2)
        
    print("\n✅ ML Pipeline Training & SHAP Attribution Complete!")
    return results

if __name__ == "__main__":
    train_and_evaluate()
