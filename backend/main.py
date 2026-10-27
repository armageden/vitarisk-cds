"""
VitaRisk CDS - Production FastAPI Backend Service
Provides high-performance REST APIs for multi-disease risk stratification,
SHAP explainability, counterfactual simulation, population analytics, and fairness audits.
"""

import os
import sys
import json
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ml.fairness_and_cds import ClinicalDecisionSupportEngine

app = FastAPI(
    title="VitaRisk CDS API",
    description="Early Multi-Disease Risk Stratification & Clinical Decision Support System",
    version="1.0.0"
)

# Enable CORS for local dev and web frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated presentation PPTX
@app.get("/presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx")
def download_presentation():
    pptx_path = os.path.join(BASE_DIR, "presentation/VitaRisk_CDS_DataNova2026_Presentation.pptx")
    if os.path.exists(pptx_path):
        return FileResponse(
            pptx_path,
            filename="VitaRisk_CDS_DataNova2026_Presentation.pptx",
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
    raise HTTPException(status_code=404, detail="Presentation not found")

# Initialize CDS engine and cache artifacts
cds_engine = ClinicalDecisionSupportEngine(artifacts_dir=os.path.join(BASE_DIR, "ml/artifacts"))

# Load precomputed benchmarks, fairness, and cohort metadata
ARTIFACTS_DIR = os.path.join(BASE_DIR, "ml/artifacts")
with open(os.path.join(ARTIFACTS_DIR, "benchmark_metrics.json")) as f:
    BENCHMARK_METRICS = json.load(f)

with open(os.path.join(ARTIFACTS_DIR, "fairness_audit.json")) as f:
    FAIRNESS_AUDIT = json.load(f)

with open(os.path.join(ARTIFACTS_DIR, "global_shap_importance.json")) as f:
    GLOBAL_SHAP = json.load(f)

# Load test cohort for population analytics and sample patient selector
COHORT_DF = pd.read_csv(os.path.join(BASE_DIR, "data/ehr_cohort.csv"))

class PatientInput(BaseModel):
    age: int = Field(54, ge=18, le=100)
    sex: str = Field("Male", description="Male or Female")
    ethnicity: str = Field("White")
    ses_decile: int = Field(5, ge=1, le=10)
    insurance_type: str = Field("Commercial")
    smoking_status: str = Field("Never", description="Never, Former, or Current")
    physical_activity: str = Field("Moderate", description="Sedentary, Moderate, or Active")
    bmi: float = Field(27.5, ge=15.0, le=60.0)
    waist_circ_cm: float = Field(88.0, ge=50.0, le=160.0)
    systolic_bp: float = Field(125.0, ge=70.0, le=240.0)
    diastolic_bp: float = Field(80.0, ge=40.0, le=140.0)
    resting_heart_rate: float = Field(72.0, ge=40.0, le=150.0)
    hba1c: float = Field(5.6, ge=4.0, le=16.0)
    fasting_glucose: float = Field(98.0, ge=50.0, le=450.0)
    serum_creatinine: float = Field(0.95, ge=0.3, le=8.0)
    egfr: float = Field(88.0, ge=5.0, le=150.0)
    uacr: float = Field(15.0, ge=1.0, le=3500.0)
    total_cholesterol: float = Field(190.0, ge=80.0, le=500.0)
    ldl_cholesterol: float = Field(110.0, ge=20.0, le=350.0)
    hdl_cholesterol: float = Field(52.0, ge=15.0, le=120.0)
    triglycerides: float = Field(140.0, ge=30.0, le=1000.0)
    hs_crp: float = Field(1.5, ge=0.05, le=30.0)
    history_hypertension: int = Field(0, ge=0, le=1)
    history_dyslipidemia: int = Field(0, ge=0, le=1)
    family_history_diabetes: int = Field(0, ge=0, le=1)
    family_history_cvd: int = Field(0, ge=0, le=1)
    current_antihypertensive: int = Field(0, ge=0, le=1)
    current_statin: int = Field(0, ge=0, le=1)

class SimulationRequest(BaseModel):
    patient: PatientInput
    interventions: Dict[str, Any]

class ExplainRequest(BaseModel):
    patient: PatientInput
    target: str = Field("onset_t2d", description="onset_t2d, onset_ckd, or onset_cvd")

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "VitaRisk CDS API",
        "version": "1.0.0",
        "models_loaded": list(cds_engine.models.keys())
    }

@app.post("/api/predict")
def predict_risk(patient: PatientInput):
    patient_dict = patient.model_dump()
    result = cds_engine.predict_patient(patient_dict)
    return result

@app.post("/api/explain")
def explain_risk(req: ExplainRequest):
    if req.target not in ["onset_t2d", "onset_ckd", "onset_cvd"]:
        raise HTTPException(status_code=400, detail="Invalid target. Must be onset_t2d, onset_ckd, or onset_cvd.")
    patient_dict = req.patient.model_dump()
    explanation = cds_engine.explain_patient(patient_dict, target=req.target)
    return explanation

@app.post("/api/simulate")
def simulate_intervention(req: SimulationRequest):
    patient_dict = req.patient.model_dump()
    simulation = cds_engine.simulate_counterfactual(patient_dict, req.interventions)
    return simulation

@app.get("/api/cohorts")
def get_cohort_analytics():
    """Returns population-level distributions and high-risk case previews."""
    tier_counts = COHORT_DF["risk_tier"].value_counts().to_dict()
    tier_pct = (COHORT_DF["risk_tier"].value_counts(normalize=True).round(4) * 100).to_dict()
    
    disease_prevalence = {
        "t2d": round(float(COHORT_DF["onset_t2d"].mean()) * 100, 2),
        "ckd": round(float(COHORT_DF["onset_ckd"].mean()) * 100, 2),
        "cvd": round(float(COHORT_DF["onset_cvd"].mean()) * 100, 2),
        "multimorbidity": round(float(COHORT_DF["onset_multimorbidity"].mean()) * 100, 2)
    }
    
    # Representative preset clinical personas for instant demo loading
    sample_patients = [
        {
            "id": "PRESET-1",
            "name": "Evelyn Reed (68F, Critical Multimorbidity)",
            "summary": "Elderly patient with diabetic nephropathy, Stage 3b CKD, uncontrolled hypertension.",
            "data": {
                "age": 68,
                "sex": "Female",
                "ethnicity": "Black/African American",
                "ses_decile": 8,
                "insurance_type": "Medicare",
                "smoking_status": "Former",
                "physical_activity": "Sedentary",
                "bmi": 34.2,
                "waist_circ_cm": 102.0,
                "systolic_bp": 158.0,
                "diastolic_bp": 94.0,
                "resting_heart_rate": 82.0,
                "hba1c": 8.4,
                "fasting_glucose": 178.0,
                "serum_creatinine": 1.75,
                "egfr": 38.0,
                "uacr": 240.0,
                "total_cholesterol": 240.0,
                "ldl_cholesterol": 152.0,
                "hdl_cholesterol": 36.0,
                "triglycerides": 260.0,
                "hs_crp": 5.4,
                "history_hypertension": 1,
                "history_dyslipidemia": 1,
                "family_history_diabetes": 1,
                "family_history_cvd": 1,
                "current_antihypertensive": 1,
                "current_statin": 1
            }
        },
        {
            "id": "PRESET-2",
            "name": "Marcus Vance (54M, High CVD & Metabolic Risk)",
            "summary": "Middle-aged male smoker with severe dyslipidemia, visceral adiposity, and stage 1 hypertension.",
            "data": {
                "age": 54,
                "sex": "Male",
                "ethnicity": "White",
                "ses_decile": 6,
                "insurance_type": "Commercial",
                "smoking_status": "Current",
                "physical_activity": "Sedentary",
                "bmi": 31.0,
                "waist_circ_cm": 98.0,
                "systolic_bp": 144.0,
                "diastolic_bp": 90.0,
                "resting_heart_rate": 78.0,
                "hba1c": 6.3,
                "fasting_glucose": 118.0,
                "serum_creatinine": 1.05,
                "egfr": 79.0,
                "uacr": 28.0,
                "total_cholesterol": 265.0,
                "ldl_cholesterol": 175.0,
                "hdl_cholesterol": 38.0,
                "triglycerides": 235.0,
                "hs_crp": 3.8,
                "history_hypertension": 1,
                "history_dyslipidemia": 1,
                "family_history_diabetes": 0,
                "family_history_cvd": 1,
                "current_antihypertensive": 0,
                "current_statin": 0
            }
        },
        {
            "id": "PRESET-3",
            "name": "Carlos Gomez (46M, Moderate Early Prediabetes)",
            "summary": "Overweight individual with early prediabetic glycemic trajectory and family history.",
            "data": {
                "age": 46,
                "sex": "Male",
                "ethnicity": "Hispanic/Latino",
                "ses_decile": 5,
                "insurance_type": "Commercial",
                "smoking_status": "Never",
                "physical_activity": "Moderate",
                "bmi": 28.6,
                "waist_circ_cm": 92.0,
                "systolic_bp": 128.0,
                "diastolic_bp": 82.0,
                "resting_heart_rate": 70.0,
                "hba1c": 5.9,
                "fasting_glucose": 106.0,
                "serum_creatinine": 0.88,
                "egfr": 96.0,
                "uacr": 12.0,
                "total_cholesterol": 195.0,
                "ldl_cholesterol": 118.0,
                "hdl_cholesterol": 48.0,
                "triglycerides": 145.0,
                "hs_crp": 1.2,
                "history_hypertension": 0,
                "history_dyslipidemia": 0,
                "family_history_diabetes": 1,
                "family_history_cvd": 0,
                "current_antihypertensive": 0,
                "current_statin": 0
            }
        },
        {
            "id": "PRESET-4",
            "name": "Sarah Lin (32F, Healthy Low-Risk Baseline)",
            "summary": "Young adult with optimal cardiometabolic and renal biomarkers.",
            "data": {
                "age": 32,
                "sex": "Female",
                "ethnicity": "Asian",
                "ses_decile": 2,
                "insurance_type": "Commercial",
                "smoking_status": "Never",
                "physical_activity": "Active",
                "bmi": 22.4,
                "waist_circ_cm": 72.0,
                "systolic_bp": 112.0,
                "diastolic_bp": 72.0,
                "resting_heart_rate": 62.0,
                "hba1c": 5.1,
                "fasting_glucose": 86.0,
                "serum_creatinine": 0.72,
                "egfr": 115.0,
                "uacr": 6.0,
                "total_cholesterol": 165.0,
                "ldl_cholesterol": 88.0,
                "hdl_cholesterol": 64.0,
                "triglycerides": 75.0,
                "hs_crp": 0.4,
                "history_hypertension": 0,
                "history_dyslipidemia": 0,
                "family_history_diabetes": 0,
                "family_history_cvd": 0,
                "current_antihypertensive": 0,
                "current_statin": 0
            }
        }
    ]
    
    return {
        "total_patients": len(COHORT_DF),
        "tier_counts": tier_counts,
        "tier_percentages": tier_pct,
        "disease_prevalence": disease_prevalence,
        "presets": sample_patients
    }

@app.get("/api/fairness")
def get_fairness_report():
    return FAIRNESS_AUDIT

@app.get("/api/benchmarks")
def get_benchmarks():
    return BENCHMARK_METRICS

@app.get("/api/global-importance")
def get_global_importance():
    return GLOBAL_SHAP

# Mount compiled React frontend dist if available
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend/dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
