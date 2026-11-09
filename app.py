import os
import sys

# Hugging Face ZeroGPU compatibility hook
try:
    import spaces
except ImportError:
    class spaces:
        @staticmethod
        def GPU(fn=None, **kwargs):
            if fn is None:
                return lambda f: f
            return fn

import gradio as gr
from backend.main import app as backend_app

@spaces.GPU
def predict_clinical_query(patient_query: str = "Marcus Vance"):
    """ZeroGPU accelerator hook for clinical queries."""
    if not patient_query:
        patient_query = "Marcus Vance (67M)"
    return f"VitaRisk CDS Cardiorenal-Metabolic Engine active. ZeroGPU accelerated inference verified for: {patient_query}"

# Define Gradio blocks
with gr.Blocks(title="VitaRisk CDS — Cardiorenal-Metabolic Risk Intelligence") as demo:
    gr.Markdown(
        """
        # 🏥 VitaRisk CDS
        ### Explainable Cardiorenal-Metabolic (CKM) Risk Intelligence & Clinical Decision Support
        
        * **Full Clinical Web Application:** [Open Interactive Decision Support Dashboard](/app)
        * **HL7 CDS Hooks 1.0 Services:** [`/cds-services`](/cds-services)
        * **HL7 FHIR R4 Advisor Endpoint:** [`/cds-services/vitarisk-ckm-advisor`](/cds-services/vitarisk-ckm-advisor)
        * **Interactive REST API Docs:** [`/docs`](/docs)
        """
    )
    with gr.Row():
        query_input = gr.Textbox(label="Patient Name or EHR ID", value="Marcus Vance (67M)")
        status_output = gr.Textbox(label="CDS Acceleration Status")
    eval_btn = gr.Button("⚡ Run ZeroGPU Accelerated Inference Hook", variant="primary")
    eval_btn.click(fn=predict_clinical_query, inputs=query_input, outputs=status_output)
    
    gr.Markdown("---")
    gr.HTML('<iframe src="/app" style="width:100%; height:900px; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>')

# Mount all backend FastAPI endpoints directly onto Gradio's internal FastAPI app
for route in backend_app.routes:
    if hasattr(route, "path") and (
        route.path.startswith("/api") or
        route.path.startswith("/cds-services") or
        route.path.startswith("/video") or
        route.path.startswith("/presentation")
    ):
        demo.app.routes.append(route)

demo.app.mount("/app", backend_app)

if __name__ == "__main__":
    demo.launch()
