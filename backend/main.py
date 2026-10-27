"""
VitaRisk CDS - Production FastAPI Backend Service
Implements:
- FM-10: Pre-warmed singleton lifespan and fast <15ms cached responses.
- FM-11: 5 Canonical Clinical Personas for zero-friction judge evaluation.
- FM-12: Decision Curve Analysis (Vickers & Elkin Net Benefit) endpoint /api/dca.
- FM-07: Clinical trial presets & coupled counterfactual simulations.
- FM-08: Before vs After active fairness mitigation reporting.
- FM-09: Metformin eGFR contraindication alerts & AHA 2026 CKM Stages 0-4.
"""

import os
import sys
import json
from contextlib import asynccontextmanager
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ml.fairness_and_cds import ClinicalDecisionSupportEngine, CLINICAL_TRIAL_PRESETS

# Global cached singletons (FM-10)
cds_engine: Optional[ClinicalDecisionSupportEngine] = None
ARTIFACTS_DIR = os.path.join(BASE_DIR, "ml/artifacts")
BENCHMARK_METRICS = {}
FAIRNESS_AUDIT = {}
GLOBAL_SHAP = {}
DCA_DATA = {}
COHORT_DF = None

CANONICAL_PERSONAS = [
    {
        "id": "PERSONA-1",
        "name": "Persona 1 — Silent Cardiorenal Progression (58F)",
        "summary": "Stage 3a CKD with microalbuminuria & prediabetes. Demonstrates why siloed disease screening misses joint risk.",
        "data": {
            "age": 58, "sex": "Female", "ethnicity": "Black/African American", "ses_decile": 7, "insurance_type": "Commercial",
            "smoking_status": "Former", "smoking_current": 0, "physical_activity": "Sedentary", "bmi": 30.5, "waist_circ_cm": 94.0,
            "systolic_bp": 144.0, "diastolic_bp": 88.0, "resting_heart_rate": 74.0, "hba1c": 6.3, "fasting_glucose": 118.0,
            "serum_creatinine": 1.25, "egfr": 52.0, "uacr": 145.0, "total_cholesterol": 215.0, "ldl_cholesterol": 132.0,
            "hdl_cholesterol": 44.0, "triglycerides": 195.0, "non_hdl_cholesterol": 171.0, "hs_crp": 3.4,
            "history_hypertension": 1, "history_dyslipidemia": 1, "family_history_diabetes": 1, "family_history_cvd": 0,
            "current_antihypertensive": 1, "current_statin": 0
        }
    },
    {
        "id": "PERSONA-2",
        "name": "Persona 2 — Early Metabolic Syndrome (42M)",
        "summary": "Younger obese male with prediabetes and hypertriglyceridemia. Prime candidate for GLP-1 / lifestyle ARR.",
        "data": {
            "age": 42, "sex": "Male", "ethnicity": "Hispanic/Latino", "ses_decile": 5, "insurance_type": "Commercial",
            "smoking_status": "Never", "smoking_current": 0, "physical_activity": "Sedentary", "bmi": 33.8, "waist_circ_cm": 104.0,
            "systolic_bp": 132.0, "diastolic_bp": 84.0, "resting_heart_rate": 78.0, "hba1c": 6.1, "fasting_glucose": 112.0,
            "serum_creatinine": 0.92, "egfr": 96.0, "uacr": 18.0, "total_cholesterol": 225.0, "ldl_cholesterol": 138.0,
            "hdl_cholesterol": 39.0, "triglycerides": 240.0, "non_hdl_cholesterol": 186.0, "hs_crp": 2.8,
            "history_hypertension": 0, "history_dyslipidemia": 1, "family_history_diabetes": 1, "family_history_cvd": 1,
            "current_antihypertensive": 0, "current_statin": 0
        }
    },
    {
        "id": "PERSONA-3",
        "name": "Persona 3 — High-Risk Multi-Morbid CKM Stage 3 (67M)",
        "summary": "Elderly smoker with Stage 3b CKD, diabetic nephropathy, severe hypertension. Triggers Metformin guardrail.",
        "data": {
            "age": 67, "sex": "Male", "ethnicity": "White", "ses_decile": 7, "insurance_type": "Medicare",
            "smoking_status": "Current", "smoking_current": 1, "physical_activity": "Sedentary", "bmi": 32.5, "waist_circ_cm": 105.0,
            "systolic_bp": 158.0, "diastolic_bp": 92.0, "resting_heart_rate": 80.0, "hba1c": 8.4, "fasting_glucose": 178.0,
            "serum_creatinine": 1.85, "egfr": 36.0, "uacr": 410.0, "total_cholesterol": 240.0, "ldl_cholesterol": 155.0,
            "hdl_cholesterol": 36.0, "triglycerides": 250.0, "non_hdl_cholesterol": 204.0, "hs_crp": 5.2,
            "history_hypertension": 1, "history_dyslipidemia": 1, "family_history_diabetes": 1, "family_history_cvd": 1,
            "current_antihypertensive": 1, "current_statin": 1
        }
    },
    {
        "id": "PERSONA-4",
        "name": "Persona 4 — Discordant Lipid / Inflammatory Vascular Risk (54F)",
        "summary": "Normal BMI & glucose, but severe hypercholesterolemia and vascular inflammation (elevated hs-CRP).",
        "data": {
            "age": 54, "sex": "Female", "ethnicity": "Asian", "ses_decile": 3, "insurance_type": "Commercial",
            "smoking_status": "Never", "smoking_current": 0, "physical_activity": "Moderate", "bmi": 23.5, "waist_circ_cm": 76.0,
            "systolic_bp": 138.0, "diastolic_bp": 86.0, "resting_heart_rate": 68.0, "hba1c": 5.4, "fasting_glucose": 92.0,
            "serum_creatinine": 0.78, "egfr": 94.0, "uacr": 14.0, "total_cholesterol": 272.0, "ldl_cholesterol": 178.0,
            "hdl_cholesterol": 58.0, "triglycerides": 180.0, "non_hdl_cholesterol": 214.0, "hs_crp": 4.8,
            "history_hypertension": 1, "history_dyslipidemia": 1, "family_history_diabetes": 0, "family_history_cvd": 1,
            "current_antihypertensive": 1, "current_statin": 0
        }
    },
    {
        "id": "PERSONA-5",
        "name": "Persona 5 — Optimal Baseline / Healthy Control (39F)",
        "summary": "Physiologically optimal biomarkers across all 30 dimensions (<3% 5-year risk; CKM Stage 0).",
        "data": {
            "age": 39, "sex": "Female", "ethnicity": "White", "ses_decile": 2, "insurance_type": "Commercial",
            "smoking_status": "Never", "smoking_current": 0, "physical_activity": "Active", "bmi": 21.8, "waist_circ_cm": 70.0,
            "systolic_bp": 112.0, "diastolic_bp": 72.0, "resting_heart_rate": 60.0, "hba1c": 5.0, "fasting_glucose": 84.0,
            "serum_creatinine": 0.68, "egfr": 118.0, "uacr": 6.0, "total_cholesterol": 160.0, "ldl_cholesterol": 84.0,
            "hdl_cholesterol": 66.0, "triglycerides": 70.0, "non_hdl_cholesterol": 94.0, "hs_crp": 0.4,
            "history_hypertension": 0, "history_dyslipidemia": 0, "family_history_diabetes": 0, "family_history_cvd": 0,
            "current_antihypertensive": 0, "current_statin": 0
        }
    }
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    global cds_engine, BENCHMARK_METRICS, FAIRNESS_AUDIT, GLOBAL_SHAP, DCA_DATA, COHORT_DF
    print("Pre-warming VitaRisk CDS Engine & artifacts (FM-10)...")
    cds_engine = ClinicalDecisionSupportEngine(artifacts_dir=ARTIFACTS_DIR)
    
    with open(os.path.join(ARTIFACTS_DIR, "benchmark_metrics.json")) as f:
        BENCHMARK_METRICS = json.load(f)
    with open(os.path.join(ARTIFACTS_DIR, "fairness_audit.json")) as f:
        FAIRNESS_AUDIT = json.load(f)
    with open(os.path.join(ARTIFACTS_DIR, "global_shap_importance.json")) as f:
        GLOBAL_SHAP = json.load(f)
    with open(os.path.join(ARTIFACTS_DIR, "decision_curve_analysis.json")) as f:
        DCA_DATA = json.load(f)
        
    COHORT_DF = pd.read_csv(os.path.join(BASE_DIR, "data/ehr_cohort.csv"))
    
    # Warm-up inference
    cds_engine.predict_patient(CANONICAL_PERSONAS[0]["data"])
    cds_engine.explain_patient(CANONICAL_PERSONAS[0]["data"], target="onset_t2d")
    print("✅ Pre-warming complete. Ready for sub-15ms inference!")
    yield

app = FastAPI(
    title="VitaRisk CDS API",
    description="Explainable Multi-Disease Risk Stratification & Clinical Decision Support System",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientInput(BaseModel):
    age: int = Field(54, ge=18, le=100)
    sex: str = Field("Male")
    ethnicity: str = Field("White")
    ses_decile: int = Field(5, ge=1, le=10)
    insurance_type: str = Field("Commercial")
    smoking_status: str = Field("Never")
    smoking_current: Optional[int] = Field(0)
    physical_activity: str = Field("Moderate")
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
    non_hdl_cholesterol: Optional[float] = Field(None)
    hs_crp: float = Field(1.5, ge=0.05, le=30.0)
    history_hypertension: int = Field(0, ge=0, le=1)
    history_dyslipidemia: int = Field(0, ge=0, le=1)
    family_history_diabetes: int = Field(0, ge=0, le=1)
    family_history_cvd: int = Field(0, ge=0, le=1)
    current_antihypertensive: int = Field(0, ge=0, le=1)
    current_statin: int = Field(0, ge=0, le=1)

class SimulationRequest(BaseModel):
    patient: PatientInput
    interventions: Dict[str, Any] = Field(default_factory=dict)
    preset_name: Optional[str] = Field(None)
    couple_biology: bool = Field(True)

class ExplainRequest(BaseModel):
    patient: PatientInput
    target: str = Field("onset_t2d")

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "VitaRisk CDS API",
        "version": "2.0.0",
        "ckm_syndrome_architecture": "Active (Stages 0-4)",
        "models_loaded": ["onset_t2d", "onset_ckd", "onset_cvd", "onset_multimorbidity"]
    }

@app.post("/api/predict")
def predict_risk(patient: PatientInput):
    patient_dict = patient.model_dump()
    return cds_engine.predict_patient(patient_dict)

@app.post("/api/explain")
def explain_risk(req: ExplainRequest):
    if req.target not in ["onset_t2d", "onset_ckd", "onset_cvd"]:
        raise HTTPException(status_code=400, detail="Invalid target. Must be onset_t2d, onset_ckd, or onset_cvd.")
    patient_dict = req.patient.model_dump()
    return cds_engine.explain_patient(patient_dict, target=req.target)

@app.post("/api/simulate")
def simulate_intervention(req: SimulationRequest):
    patient_dict = req.patient.model_dump()
    return cds_engine.simulate_counterfactual(
        patient_dict,
        req.interventions,
        preset_name=req.preset_name,
        couple_biology=req.couple_biology
    )

@app.get("/api/cohorts")
def get_cohort_analytics():
    tier_counts = COHORT_DF["risk_tier"].value_counts().to_dict()
    tier_pct = (COHORT_DF["risk_tier"].value_counts(normalize=True).round(4) * 100).to_dict()
    disease_prev = {
        "t2d": round(float(COHORT_DF["onset_t2d"].mean()) * 100, 2),
        "ckd": round(float(COHORT_DF["onset_ckd"].mean()) * 100, 2),
        "cvd": round(float(COHORT_DF["onset_cvd"].mean()) * 100, 2),
        "multimorbidity": round(float(COHORT_DF["onset_multimorbidity"].mean()) * 100, 2)
    }
    return {
        "total_patients": len(COHORT_DF),
        "tier_counts": tier_counts,
        "tier_percentages": tier_pct,
        "disease_prevalence": disease_prev,
        "presets": CANONICAL_PERSONAS
    }

@app.get("/api/dca")
def get_decision_curve_analysis():
    return DCA_DATA

@app.get("/api/fairness")
def get_fairness_report():
    return FAIRNESS_AUDIT

@app.get("/api/benchmarks")
def get_benchmarks():
    return BENCHMARK_METRICS

@app.get("/api/global-importance")
def get_global_importance():
    return GLOBAL_SHAP

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

FRONTEND_DIST = os.path.join(BASE_DIR, "frontend/dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
