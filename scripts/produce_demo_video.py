import os
import sys
import time
import shutil
import subprocess
import asyncio
from pathlib import Path
import edge_tts
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "presentation/video"
RAW_VIDEO_DIR = "presentation/video/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(RAW_VIDEO_DIR, exist_ok=True)

NARRATION = [
    {
        "id": "seg1",
        "title": "Clinical Crisis & CKM Staging Gap",
        "text": "Hello DataNova judges and clinical colleagues. Chronic diseases—specifically Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease—account for 74% of all non-communicable deaths globally and over $4 trillion in US healthcare expenditures. The tragedy is that early-stage kidney disease and prediabetes progress silently: over 90% of patients remain asymptomatic until irreversible vascular remodeling and nephron loss occur. Existing calculators like Framingham or ASCVD fail because they treat organs as isolated silos, ignoring the American Heart Association's 2026 Cardiorenal-Metabolic, or CKM, syndrome staging. Introducing VitaRisk CDS: an explainable, guardrailed clinical decision support platform that transforms routine longitudinal EHR data into calibrated early interventions."
    },
    {
        "id": "seg2",
        "title": "5 Personas, Multi-Organ Dials & Comparative Baselines",
        "text": "Here is our live full-stack system. To eliminate form fatigue for judges, we engineered five canonical clinical personas representing diverse real-world disease trajectories. When we select Persona 3—an elderly patient with diabetes and chronic kidney disease—VitaRisk stratifies multi-organ risk in under 15 milliseconds. Notice our 3-stage CKM cascade: elevated kidney damage automatically models the biological cross-coupling, elevating downstream cardiovascular risk. Crucially, VitaRisk directly benchmarks our predictions against established clinical calculators in real-time, calculating Tangri's 4-variable Kidney Failure Risk Equation and AHA PREVENT scores side-by-side to give clinicians immediate comparative context."
    },
    {
        "id": "seg3",
        "title": "Explainable SHAP & Coupled What-If Simulations",
        "text": "In our Explainability tab, we replace unintuitive log-odds with additive percentage-point SHAP waterfalls. A clinician sees in five seconds that elevated HbA1c and eGFR loss dominate Marcus Vance's risk, while normal HDL offers a protective buffer. In our Simulator tab, unlike tools with unconstrained sliders that create biologically impossible patients, VitaRisk implements physiologically coupled presets calibrated against landmark clinical trials like EMPA-REG and DAPA-CKD. Clicking the SGLT2 inhibitor trial preset dynamically models coupled weight, glycemic, and renal improvements, producing quantified Absolute Risk Reductions. And when eGFR drops below 30, our safety guardrail fires a hard-stop contraindication banner against Metformin to prevent fatal lactic acidosis."
    },
    {
        "id": "seg4",
        "title": "Native HL7 FHIR R4 & CDS Hooks 1.0 Services",
        "text": "A predictive model is useless if trapped outside clinical workflows. VitaRisk is engineered for seamless EHR interoperability. In our EHR and CDS Hooks tab, we ingest standard HL7 FHIR R4 Bundles—extracting Patient demographics, Observation labs, and Condition resources into normalized clinical vectors. When a clinician opens a patient chart in Epic, Cerner, or Meditech, our CDS Hooks 1.0 endpoint at slash cds-services evaluates the patient-view hook in real-time, returning structured advice cards, critical indicators, and direct guideline links without disrupting clinician workflow."
    },
    {
        "id": "seg5",
        "title": "Rigorous Epidemiology, Active Fairness & Verification",
        "text": "Behind the interface is rigorous epidemiology: We incorporated latent unobserved confounders to eliminate synthetic circularity, bounding ROC-AUCs to a realistic 0.79 to 0.85. 5-fold sigmoid calibration keeps Expected Calibration Error at or below 0.042 across all endpoints. Decision Curve Analysis confirms positive net clinical benefit over Treat All and Treat None across the 5% to 40% threshold spectrum. And in our Fairness tab, validation-fitted subgroup threshold calibration actively shrinks sensitivity gaps across age and sex groups. Deployed live on Hugging Face Spaces with all 10 pre-submission gates passing automated tests, VitaRisk CDS delivers the precision, safety, and transparency modern medicine demands. Thank you."
    }
]

async def generate_audio():
    full_audio = os.path.join(OUTPUT_DIR, "full_voiceover.mp3")
    
    # Check if voiceover needs regeneration
    print("🎙️ Generating neural voiceover audio tracks via edge-tts...")
    voice = "en-US-ChristopherNeural"
    seg_files = []
    durations = []
    
    for seg in NARRATION:
        out_file = os.path.join(OUTPUT_DIR, f"{seg['id']}.mp3")
        communicate = edge_tts.Communicate(seg['text'], voice)
        await communicate.save(out_file)
        seg_files.append(out_file)
        
        dur = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", out_file,
        ]).decode().strip())
        durations.append(dur)
        print(f"  • {seg['id']} ({seg['title']}): {dur:.2f} seconds")
        
    concat_list = Path(OUTPUT_DIR) / "concat.txt"
    concat_list.write_text("\n".join(f"file '{os.path.abspath(sf)}'" for sf in seg_files))
            
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
                    "-c", "copy", full_audio], check=True)
    full_dur = sum(durations)
    print(f"✅ Full voiceover created: {full_audio} ({full_dur:.2f}s total / {full_dur/60:.2f} mins)")
    return durations

def record_ui(durations):
    # Clean previous raw videos
    for f in os.listdir(RAW_VIDEO_DIR):
        if f.endswith(".webm"):
            os.remove(os.path.join(RAW_VIDEO_DIR, f))

    print("🎥 Recording synchronized UI walkthrough via Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=RAW_VIDEO_DIR,
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()
        
        def safe_click(selector, wait_s=2.0):
            try:
                loc = page.locator(selector).first
                if loc.count() > 0:
                    loc.click()
                    time.sleep(wait_s)
            except Exception as e:
                print(f"  [Notice] Click skipped for {selector}: {e}")

        # --- SEGMENT 1 (Intro & Header) ---
        print(f"  [Seg 1 UI: {durations[0]:.1f}s] Loading home & overview...")
        start_t = time.time()
        page.goto("http://localhost:8000", wait_until="networkidle")
        time.sleep(3.0)
        page.evaluate("window.scrollBy({top: 250, behavior: 'smooth'})")
        time.sleep(3.5)
        page.evaluate("window.scrollBy({top: -250, behavior: 'smooth'})")
        
        elapsed = time.time() - start_t
        rem = max(0.5, durations[0] - elapsed)
        time.sleep(rem)
        
        # --- SEGMENT 2 (Personas, Risk Dials & Comparative Baselines) ---
        print(f"  [Seg 2 UI: {durations[1]:.1f}s] Clicking Personas, Dials & Baselines...")
        start_t = time.time()
        
        safe_click("button:has-text('Persona 1')", 2.5)
        safe_click("button:has-text('Persona 2')", 2.5)
        safe_click("button:has-text('Persona 3')", 2.5)
        
        # Scroll to show CKM Stage 4, Risk Dials, and Siloed Baselines (KFRE & PREVENT)
        page.evaluate("window.scrollBy({top: 350, behavior: 'smooth'})")
        time.sleep(4.0)
        page.evaluate("window.scrollBy({top: 350, behavior: 'smooth'})")
        time.sleep(3.0)
        page.evaluate("window.scrollBy({top: -700, behavior: 'smooth'})")
        time.sleep(1.5)
            
        elapsed = time.time() - start_t
        rem = max(0.5, durations[1] - elapsed)
        time.sleep(rem)
        
        # --- SEGMENT 3 (SHAP Waterfall, Simulator & Contraindication Guardrail) ---
        print(f"  [Seg 3 UI: {durations[2]:.1f}s] SHAP Waterfall, SGLT2i Preset & Safety Guardrail...")
        start_t = time.time()
        
        # Switch to SHAP Waterfall Tab
        safe_click("button:has-text('Explainable AI (SHAP Waterfall)')", 2.5)
        safe_click("button:has-text('Chronic Kidney Disease')", 2.0)
        
        # Switch to Simulator tab
        safe_click("button:has-text('What-If Intervention Simulator')", 2.5)
        
        # Click SGLT2i Initiation Preset
        safe_click("button:has-text('SGLT2i Initiation')", 3.0)
        page.evaluate("window.scrollBy({top: 350, behavior: 'smooth'})")
        time.sleep(3.0)
        
        # Switch back to Calculator to highlight Metformin Contraindication Alert
        safe_click("button:has-text('Clinical Risk Calculator & CDS')", 2.0)
        page.evaluate("window.scrollBy({top: 250, behavior: 'smooth'})")
        time.sleep(3.0)
        
        elapsed = time.time() - start_t
        rem = max(0.5, durations[2] - elapsed)
        time.sleep(rem)

        # --- SEGMENT 4 (EHR Interoperability: HL7 FHIR R4 & CDS Hooks 1.0) ---
        print(f"  [Seg 4 UI: {durations[3]:.1f}s] HL7 FHIR R4 & CDS Hooks 1.0 Services...")
        start_t = time.time()
        
        # Switch to EHR & CDS Hooks Tab
        safe_click("button:has-text('EHR & CDS Hooks (FHIR R4)')", 3.0)
        
        # Click Persona selector inside CDS Hooks viewer or toggle subtabs
        safe_click("button:has-text('FHIR R4 Bundle JSON')", 3.0)
        safe_click("button:has-text('CDS Advisory Cards')", 3.0)
        page.evaluate("window.scrollBy({top: 350, behavior: 'smooth'})")
        time.sleep(3.0)
        page.evaluate("window.scrollBy({top: -350, behavior: 'smooth'})")
        time.sleep(1.5)
        
        elapsed = time.time() - start_t
        rem = max(0.5, durations[3] - elapsed)
        time.sleep(rem)

        # --- SEGMENT 5 (DCA Net Benefit, Active Fairness & Submission Slides) ---
        print(f"  [Seg 5 UI: {durations[4]:.1f}s] DCA Net Benefit, Active Fairness & Conclusion...")
        start_t = time.time()
        
        # Switch to DCA Tab
        safe_click("button:has-text('Decision Curve Net Benefit')", 3.0)
        page.evaluate("window.scrollBy({top: 300, behavior: 'smooth'})")
        time.sleep(2.5)
        page.evaluate("window.scrollBy({top: -300, behavior: 'smooth'})")
        time.sleep(1.0)
        
        # Switch to Fairness Tab
        safe_click("button:has-text('Algorithmic Fairness Audit')", 3.0)
        # Toggle mitigated mode button if available
        safe_click("button:has-text('Mitigated')", 2.5)
        page.evaluate("window.scrollBy({top: 350, behavior: 'smooth'})")
        time.sleep(2.5)
        page.evaluate("window.scrollBy({top: -350, behavior: 'smooth'})")
        time.sleep(1.0)
        
        # Switch to Presentation Tab
        safe_click("button:has-text('Submission Slides (14)')", 3.0)
        
        elapsed = time.time() - start_t
        rem = max(0.5, durations[4] - elapsed)
        time.sleep(rem)
        
        context.close()
        browser.close()
        print("✅ UI recording complete!")

def merge_video_audio():
    print("🎞️ Merging recorded video with neural voiceover...")
    files = [os.path.join(RAW_VIDEO_DIR, f) for f in os.listdir(RAW_VIDEO_DIR) if f.endswith(".webm")]
    if not files:
        raise RuntimeError("No raw video files found!")
    raw_video = max(files, key=os.path.getmtime)
    
    full_audio = os.path.join(OUTPUT_DIR, "full_voiceover.mp3")
    final_output = os.path.join(OUTPUT_DIR, "VitaRisk_CDS_Walkthrough.mp4")
    
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_video, "-i", full_audio,
        "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", final_output,
    ], check=True)
    print(f"🎉 Final MP4 Walkthrough Video Ready: {final_output}")

    dist_video = "frontend/dist/video"
    os.makedirs(dist_video, exist_ok=True)
    shutil.copy(final_output, os.path.join(dist_video, os.path.basename(final_output)))
    print(f"✅ Video copied to {dist_video}/VitaRisk_CDS_Walkthrough.mp4 for public web streaming!")

if __name__ == "__main__":
    durations = asyncio.run(generate_audio())
    record_ui(durations)
    merge_video_audio()
