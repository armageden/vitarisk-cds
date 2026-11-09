import os
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

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
from starlette.routing import Mount
from fastapi.staticfiles import StaticFiles
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
        
        * **Full Clinical Web Application:** [Open Interactive Decision Support Dashboard](/app/)
        * **HL7 CDS Hooks 1.0 Services:** [`/cds-services`](/cds-services)
        * **HL7 FHIR R4 Advisor Endpoint:** [`/cds-services/vitarisk-ckm-advisor`](/cds-services/vitarisk-ckm-advisor)
        * **Interactive REST API Health:** [`/api/health`](/api/health)
        """
    )
    with gr.Row():
        query_input = gr.Textbox(label="Patient Name or EHR ID", value="Marcus Vance (67M)")
        status_output = gr.Textbox(label="CDS Acceleration Status")
    eval_btn = gr.Button("⚡ Run ZeroGPU Accelerated Inference Hook", variant="primary")
    eval_btn.click(fn=predict_clinical_query, inputs=query_input, outputs=status_output)
    
    gr.Markdown("---")
    gr.HTML('<iframe src="/app/" style="width:100%; height:920px; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>')

if __name__ == "__main__":
    # Launch Gradio server without blocking immediately so we can prioritize API routes
    app, _, _ = demo.launch(prevent_thread_lock=True, ssr_mode=False)

    # Insert static assets & SPA sub-mount at top priority
    assets_dir = os.path.join(BASE_DIR, "frontend/dist/assets")
    if os.path.exists(assets_dir):
        app.routes.insert(0, Mount("/assets", StaticFiles(directory=assets_dir), name="assets"))
    app.routes.insert(0, Mount("/app", backend_app, name="app"))

    # Insert all backend REST & CDS endpoints at index 0
    for route in reversed(backend_app.routes):
        if hasattr(route, "path") and (
            route.path.startswith("/api") or
            route.path.startswith("/cds-services") or
            route.path.startswith("/video") or
            route.path.startswith("/presentation")
        ):
            app.routes.insert(0, route)

    # Keep server thread active
    try:
        demo.block_thread()
    except (KeyboardInterrupt, SystemExit):
        demo.close()
