"""
VitaRisk CDS - HL7 FHIR R4 & CDS Hooks 1.0 Interoperability Service
Specifications:
- HL7 CDS Hooks 1.0 (https://cds-hooks.hl7.org/)
- HL7 FHIR R4 (Release 4.0.1) Clinical Observation Profiles
- LOINC Standard Coding System for Clinical Laboratory Results
"""

import datetime
from typing import Dict, Any, List, Optional
import uuid

# Official LOINC Codes for Cardiorenal-Metabolic Biomarkers
LOINC_MAP = {
    "4548-4": "hba1c",                    # Hemoglobin A1c
    "17856-6": "hba1c",                   # HbA1c fraction
    "1558-6": "fasting_glucose",          # Fasting glucose (serum/plasma)
    "2345-7": "fasting_glucose",          # Glucose (blood)
    "2160-0": "serum_creatinine",         # Serum Creatinine
    "33914-3": "egfr",                    # eGFR (CKD-EPI)
    "48642-3": "egfr",                    # eGFR non-black
    "48643-1": "egfr",                    # eGFR general
    "62238-1": "egfr",                    # eGFR CKD-EPI 2021 race-free
    "14959-1": "uacr",                    # Urine Albumin/Creatinine Ratio
    "9318-7": "uacr",                     # Microalbumin/Creatinine
    "8480-6": "systolic_bp",              # Systolic Blood Pressure
    "8462-4": "diastolic_bp",             # Diastolic Blood Pressure
    "8867-4": "resting_heart_rate",       # Heart Rate
    "39156-5": "bmi",                     # Body Mass Index
    "2093-3": "total_cholesterol",        # Total Cholesterol
    "2085-9": "hdl_cholesterol",          # HDL Cholesterol
    "13457-7": "ldl_cholesterol",         # LDL Cholesterol
    "2571-8": "triglycerides",            # Triglycerides
    "30522-7": "hs_crp",                  # High-sensitivity C-reactive protein
    "72166-2": "smoking_status",          # Tobacco smoking status
}

CDS_SERVICES_DISCOVERY = {
    "services": [
        {
            "hook": "patient-view",
            "name": "vitarisk-ckm-advisor",
            "id": "vitarisk-ckm-advisor",
            "title": "VitaRisk CKM Risk Stratification & Contraindication Advisor",
            "description": (
                "Operationalizes AHA 2026 Cardiorenal-Metabolic (CKM) Syndrome staging. "
                "Predicts 5-year joint risk for T2D, CKD, CVD, and Multimorbidity from routine "
                "longitudinal EHR biomarkers, with KDIGO/ADA drug contraindication safety checks."
            ),
            "prefetch": {
                "patient": "Patient/{{context.patientId}}",
                "observations": "Observation?patient={{context.patientId}}&code=4548-4,33914-3,14959-1,8480-6,8462-4,2085-9,13457-7,2093-3,2571-8,30522-7,39156-5"
            }
        },
        {
            "hook": "order-select",
            "name": "vitarisk-gdmt-guardrail",
            "id": "vitarisk-gdmt-guardrail",
            "title": "VitaRisk GDMT & Medication Safety Guardrail",
            "description": "Flags nephrotoxic or contraindicated medications (e.g. Metformin at eGFR < 30) during active prescription orders.",
            "prefetch": {
                "patient": "Patient/{{context.patientId}}",
                "medications": "MedicationRequest?patient={{context.patientId}}&status=active"
            }
        }
    ]
}


def parse_fhir_bundle_to_vitarisk(bundle: Dict[str, Any], default_fallback: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Parses a standard HL7 FHIR R4 Bundle into VitaRisk's clinical feature vector.
    Extracts Patient demographics and Observation LOINC lab values.
    """
    patient_data = dict(default_fallback or {
        "age": 54, "sex": "Male", "ethnicity": "White", "ses_decile": 5, "insurance_type": "Commercial",
        "smoking_status": "Never", "smoking_current": 0, "physical_activity": "Moderate", "bmi": 27.5, "waist_circ_cm": 88.0,
        "systolic_bp": 125.0, "diastolic_bp": 80.0, "resting_heart_rate": 72.0, "hba1c": 5.6, "fasting_glucose": 98.0,
        "serum_creatinine": 0.95, "egfr": 88.0, "uacr": 15.0, "total_cholesterol": 190.0, "ldl_cholesterol": 110.0,
        "hdl_cholesterol": 52.0, "triglycerides": 140.0, "non_hdl_cholesterol": 138.0, "hs_crp": 1.5,
        "history_hypertension": 0, "history_dyslipidemia": 0, "family_history_diabetes": 0, "family_history_cvd": 0,
        "current_antihypertensive": 0, "current_statin": 0
    })

    entries = bundle.get("entry", [])
    current_year = datetime.datetime.now().year

    for entry in entries:
        resource = entry.get("resource", {})
        res_type = resource.get("resourceType")

        # 1. Patient Resource
        if res_type == "Patient":
            gender = resource.get("gender", "").lower()
            if gender in ["female", "f"]:
                patient_data["sex"] = "Female"
            elif gender in ["male", "m"]:
                patient_data["sex"] = "Male"

            birth_date = resource.get("birthDate")
            if birth_date:
                try:
                    birth_year = int(birth_date.split("-")[0])
                    patient_data["age"] = max(18, min(100, current_year - birth_year))
                except Exception:
                    pass

        # 2. Observation Resource (LOINC mapped)
        elif res_type == "Observation":
            codings = resource.get("code", {}).get("coding", [])
            val_quantity = resource.get("valueQuantity", {})
            val_num = val_quantity.get("value")
            val_str = resource.get("valueString") or resource.get("valueCodeableConcept", {}).get("text")

            for coding in codings:
                code = coding.get("code")
                if code in LOINC_MAP:
                    feature_name = LOINC_MAP[code]
                    if val_num is not None:
                        try:
                            patient_data[feature_name] = float(val_num)
                        except (ValueError, TypeError):
                            pass
                    elif val_str is not None:
                        # Smoking string matching
                        if feature_name == "smoking_status":
                            v = str(val_str).lower()
                            if "current" in v or "smoker" in v:
                                patient_data["smoking_status"] = "Current"
                                patient_data["smoking_current"] = 1
                            elif "former" in v or "quit" in v:
                                patient_data["smoking_status"] = "Former"
                                patient_data["smoking_current"] = 0
                            else:
                                patient_data["smoking_status"] = "Never"
                                patient_data["smoking_current"] = 0

        # 3. Condition Resource (ICD-10 / SNOMED)
        elif res_type == "Condition":
            codings = resource.get("code", {}).get("coding", [])
            for c in codings:
                code_str = str(c.get("code", "")).upper()
                display = str(c.get("display", "")).lower()
                if "I10" in code_str or "hypertension" in display:
                    patient_data["history_hypertension"] = 1
                if "E78" in code_str or "dyslipidemia" in display or "hypercholesterolemia" in display:
                    patient_data["history_dyslipidemia"] = 1
                if "diabetes" in display and "family" in display:
                    patient_data["family_history_diabetes"] = 1

        # 4. MedicationRequest Resource
        elif res_type == "MedicationRequest":
            med_codings = resource.get("medicationCodeableConcept", {}).get("coding", [])
            med_text = str(resource.get("medicationCodeableConcept", {}).get("text", "")).lower()
            for mc in med_codings:
                disp = str(mc.get("display", "")).lower()
                if "statin" in disp or "atorvastatin" in disp or "rosuvastatin" in disp:
                    patient_data["current_statin"] = 1
                if any(x in disp for x in ["lisinopril", "losartan", "amlodipine", "metoprolol", "hydrochlorothiazide"]):
                    patient_data["current_antihypertensive"] = 1
            if "statin" in med_text:
                patient_data["current_statin"] = 1

    # Keep Non-HDL coherent
    if patient_data.get("total_cholesterol") and patient_data.get("hdl_cholesterol"):
        patient_data["non_hdl_cholesterol"] = max(30.0, float(patient_data["total_cholesterol"]) - float(patient_data["hdl_cholesterol"]))

    return patient_data


def generate_sample_fhir_bundle(patient_dict: Dict[str, Any], patient_id: str = "PAT-00042") -> Dict[str, Any]:
    """
    Generates an authentic HL7 FHIR R4 Bundle from a patient record for EHR simulation & testing.
    """
    birth_year = datetime.datetime.now().year - int(patient_dict.get("age", 54))
    bundle_id = str(uuid.uuid4())

    entries = [
        {
            "fullUrl": f"urn:uuid:{uuid.uuid4()}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_id,
                "gender": str(patient_dict.get("sex", "male")).lower(),
                "birthDate": f"{birth_year}-05-14",
                "meta": {"profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"]}
            }
        }
    ]

    # Add LOINC Observations
    observations = [
        ("4548-4", "Hemoglobin A1c", patient_dict.get("hba1c"), "%"),
        ("33914-3", "Glomerular filtration rate/1.73 sq M.predicted [eGFR]", patient_dict.get("egfr"), "mL/min/1.73m2"),
        ("14959-1", "Albumin/Creatinine in Urine [uACR]", patient_dict.get("uacr"), "mg/g"),
        ("8480-6", "Systolic blood pressure", patient_dict.get("systolic_bp"), "mmHg"),
        ("8462-4", "Diastolic blood pressure", patient_dict.get("diastolic_bp"), "mmHg"),
        ("39156-5", "Body mass index (BMI)", patient_dict.get("bmi"), "kg/m2"),
        ("2093-3", "Total Cholesterol", patient_dict.get("total_cholesterol"), "mg/dL"),
        ("2085-9", "HDL Cholesterol", patient_dict.get("hdl_cholesterol"), "mg/dL"),
        ("13457-7", "LDL Cholesterol", patient_dict.get("ldl_cholesterol"), "mg/dL"),
        ("2571-8", "Triglycerides", patient_dict.get("triglycerides"), "mg/dL"),
        ("30522-7", "C reactive protein [hs-CRP]", patient_dict.get("hs_crp"), "mg/L")
    ]

    for code, display, val, unit in observations:
        if val is not None:
            entries.append({
                "fullUrl": f"urn:uuid:{uuid.uuid4()}",
                "resource": {
                    "resourceType": "Observation",
                    "status": "final",
                    "code": {
                        "coding": [
                            {"system": "http://loinc.org", "code": code, "display": display}
                        ],
                        "text": display
                    },
                    "subject": {"reference": f"Patient/{patient_id}"},
                    "effectiveDateTime": datetime.datetime.now().isoformat(),
                    "valueQuantity": {
                        "value": float(val),
                        "unit": unit,
                        "system": "http://unitsofmeasure.org"
                    }
                }
            })

    return {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "collection",
        "entry": entries
    }


def create_cds_cards(prediction: Dict[str, Any], patient_dict: Dict[str, Any], context_id: str = "PAT-001") -> List[Dict[str, Any]]:
    """
    Transforms VitaRisk predictions into HL7 CDS Hooks 1.0 Cards.
    Includes:
    - Critical Drug Contraindication Cards (e.g. Metformin eGFR < 30)
    - Cardiorenal-Metabolic Staging Summary Cards
    - SMART on FHIR App Launch Links
    """
    cards = []
    contra_alerts = prediction.get("contraindication_alerts", [])
    ckm_stage = prediction.get("ckm_stage", {})
    probs = prediction.get("probabilities", {})
    urgency = prediction.get("urgency", "Surveillance")

    # 1. Critical Safety Card (Highest Priority)
    for alert in contra_alerts:
        indicator = "critical" if alert.get("severity") == "CRITICAL" else "warning"
        cards.append({
            "uuid": str(uuid.uuid4()),
            "summary": f"⚠️ {alert.get('type')}: {alert.get('medication')} Risk",
            "indicator": indicator,
            "detail": (
                f"{alert.get('message')}\n\n"
                f"**Current Renal Biomarkers:** eGFR = {patient_dict.get('egfr')} mL/min/1.73m², "
                f"uACR = {patient_dict.get('uacr')} mg/g. **Stage:** {ckm_stage.get('stage')} ({ckm_stage.get('label')})."
            ),
            "source": {
                "label": "VitaRisk CDS Safety Engine (KDIGO 2024 / ADA 2026)",
                "url": "https://vitarisk-cds.org/guidelines/kdigo"
            },
            "suggestions": [
                {
                    "label": "Switch to Renal-Protective SGLT2i / GLP-1 RA",
                    "uuid": str(uuid.uuid4()),
                    "actions": [
                        {
                            "type": "create",
                            "description": "Order Empagliflozin 10 mg oral tablet daily (safe down to eGFR 20 per KDIGO 2024)",
                            "resource": {
                                "resourceType": "MedicationRequest",
                                "status": "active",
                                "intent": "order",
                                "medicationCodeableConcept": {
                                    "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "1545653", "display": "Empagliflozin 10 MG Oral Tablet"}]
                                }
                            }
                        }
                    ]
                }
            ],
            "links": [
                {
                    "label": "Open VitaRisk CKM Interactive Dashboard",
                    "url": f"/#patient={context_id}",
                    "type": "smart"
                }
            ]
        })

    # 2. Cardiorenal-Metabolic (CKM) Syndrome Staging Card
    composite_pct = round(probs.get("composite", 0.0) * 100, 1)
    stage_str = ckm_stage.get("stage", "Stage 0")
    indicator = "critical" if "Stage 4" in stage_str or composite_pct >= 50 else ("warning" if "Stage 3" in stage_str or composite_pct >= 25 else "info")

    cards.append({
        "uuid": str(uuid.uuid4()),
        "summary": f"AHA 2026 CKM {stage_str}: {composite_pct}% 5-Yr Composite Risk",
        "indicator": indicator,
        "detail": (
            f"**{ckm_stage.get('label')}:** {ckm_stage.get('description')}\n\n"
            f"- **T2D 5-Yr Risk:** {round(probs.get('t2d', 0)*100, 1)}%\n"
            f"- **CKD 5-Yr Progression:** {round(probs.get('ckd', 0)*100, 1)}%\n"
            f"- **CVD 5-Yr Risk:** {round(probs.get('cvd', 0)*100, 1)}%\n"
            f"- **Multimorbidity (>=2 diseases):** {round(probs.get('multimorbidity', 0)*100, 1)}%\n\n"
            f"**Recommended Clinical Action:** {urgency}."
        ),
        "source": {
            "label": "American Heart Association (AHA) 2026 CKM Consensus",
            "url": "https://www.heart.org/en/health-topics/ckm-syndrome"
        },
        "links": [
            {
                "label": "Review SHAP Waterfalls & Trial Simulator in VitaRisk",
                "url": f"/#patient={context_id}",
                "type": "smart"
            }
        ]
    })

    return cards
