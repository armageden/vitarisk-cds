import os
import sys
import time
import shutil
import subprocess
import asyncio
import edge_tts
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "presentation/video"
RAW_VIDEO_DIR = "presentation/video/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(RAW_VIDEO_DIR, exist_ok=True)

NARRATION = [
    {
        "id": "seg1",
        "text": "Hello DataNova judges and clinical colleagues. Chronic diseases—specifically Type 2 Diabetes, Chronic Kidney Disease, and Cardiovascular Disease—account for 74% of all non-communicable deaths globally and over $4 trillion in US healthcare expenditures. The tragedy is that early-stage kidney disease and prediabetes progress silently: over 90% of patients remain asymptomatic until irreversible vascular remodeling and nephron loss occur. Existing calculators like Framingham or ASCVD fail because they treat organs as isolated silos, ignoring the American Heart Association's 2026 Cardiorenal-Metabolic, or CKM, syndrome staging. Introducing VitaRisk CDS: an explainable, guardrailed clinical decision support platform that transforms routine longitudinal EHR data into calibrated early interventions."
    },
    {
        "id": "seg2",
        "text": "Here is our live full-stack system. To eliminate form fatigue for judges, we engineered five canonical clinical personas representing diverse real-world disease trajectories. When we select Persona 3—an elderly patient with Stage 3b CKD and diabetes—VitaRisk stratifies risk in under 15 milliseconds. Notice our 3-stage CKM cascade: because the patient has elevated kidney and metabolic damage, VitaRisk automatically models the biological cross-coupling, elevating downstream cardiovascular risk. In our Explainability tab, we replace unintuitive log-odds with additive percentage-point SHAP waterfalls. A clinician sees in five seconds that elevated HbA1c dominates the risk, while normal HDL offers a protective buffer."
    },
    {
        "id": "seg3",
        "text": "Most hackathon tools allow free sliders that generate biologically impossible counterfactuals. VitaRisk implements physiologically coupled presets calibrated against landmark clinical trials like EMPA-REG and DAPA-CKD. Clicking the SGLT2 inhibitor trial preset dynamically models coupled weight, glucose, and renal improvements, producing a measurable Absolute Risk Reduction in kidney progression and de-escalating overall risk. But critically, VitaRisk enforces clinical safety guardrails. When eGFR drops below 45, the engine flags a mandatory Metformin dose halving, and at eGFR under 30, it issues a hard stop contraindication alert to prevent fatal lactic acidosis. We protect patients first."
    },
    {
        "id": "seg4",
        "text": "Behind the interface is rigorous epidemiology: We incorporated latent unobserved confounders to eliminate synthetic circularity, bounding ROC-AUCs to a realistic 0.80 to 0.85. 5-fold sigmoid calibration keeps Expected Calibration Error at or below 0.042. Decision Curve Analysis confirms positive net clinical benefit across all treatment thresholds from 5% to 40%. And in our Fairness tab, we don't just passively report disparities—our validation-fitted threshold calibration shrinks sensitivity gaps across subgroups, and we publish every combination honestly, including where demographic parity remains structurally out of reach. All 10 pre-submission gates pass automated testing. VitaRisk CDS delivers the precision, safety, and transparency modern medicine demands. Thank you."
    }
]

async def generate_audio():
    full_audio = os.path.join(OUTPUT_DIR, "full_voiceover.mp3")
    durations = [56.33, 55.44, 49.82, 56.54]
    if os.path.exists(full_audio):
        print(f"✅ Found existing full voiceover: {full_audio} ({sum(durations):.2f}s total)")
        return durations

    print("🎙️ Generating neural voiceover audio tracks...")
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
        print(f"  • {seg['id']}: {dur:.2f} seconds")
        
    concat_list = Path(OUTPUT_DIR) / "concat.txt"
    concat_list.write_text("\n".join(f"file '{os.path.abspath(sf)}'" for sf in seg_files))
            
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
                    "-c", "copy", full_audio], check=True)
    full_dur = sum(durations)
    print(f"✅ Full voiceover created: {full_audio} ({full_dur:.2f}s total)")
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
        time.sleep(4.0)
        page.evaluate("window.scrollBy({top: 250, behavior: 'smooth'})")
        time.sleep(4.0)
        page.evaluate("window.scrollBy({top: -250, behavior: 'smooth'})")
        
        elapsed = time.time() - start_t
        rem = max(0.5, durations[0] - elapsed)
        time.sleep(rem)
        
        # --- SEGMENT 2 (Personas, CKM Cascade, SHAP Waterfall) ---
        print(f"  [Seg 2 UI: {durations[1]:.1f}s] Clicking Personas & SHAP...")
        start_t = time.time()
        
        safe_click("button:has-text('Persona 1')", 3.0)
        safe_click("button:has-text('Persona 2')", 3.0)
        safe_click("button:has-text('Persona 3')", 3.0)
        
        # Scroll to show CKM Stage 3 and Risk Dials
        page.evaluate("window.scrollBy({top: 300, behavior: 'smooth'})")
        time.sleep(4.0)
        page.evaluate("window.scrollBy({top: -300, behavior: 'smooth'})")
        time.sleep(2.0)
        
        # Switch to SHAP Waterfall Tab
        safe_click("button:has-text('Explainable AI (SHAP Waterfall)')", 3.0)
        safe_click("button:has-text('Chronic Kidney Disease')", 3.0)
            
        elapsed = time.time() - start_t
        rem = max(0.5, durations[1] - elapsed)
        time.sleep(rem)
        
        # --- SEGMENT 3 (Simulator, SGLT2i Initiation Preset & Contraindication Guardrail) ---
        print(f"  [Seg 3 UI: {durations[2]:.1f}s] SGLT2i Trial Preset & Contraindication Guardrail...")
        start_t = time.time()
        
        # Switch to Simulator tab
        safe_click("button:has-text('What-If Intervention Simulator')", 3.0)
        
        # Click SGLT2i Initiation Preset
        safe_click("button:has-text('SGLT2i Initiation')", 4.0)
        
        # Scroll to view ARR / RRR outcome cards
        page.evaluate("window.scrollBy({top: 350, behavior: 'smooth'})")
        time.sleep(4.0)
        
        # Switch back to Calculator to highlight Contraindication Alert
        safe_click("button:has-text('Patient Risk Calculator & CDS')", 2.0)
        page.evaluate("window.scrollBy({top: 200, behavior: 'smooth'})")
        time.sleep(4.0)
        
        elapsed = time.time() - start_t
        rem = max(0.5, durations[2] - elapsed)
        time.sleep(rem)
        
        # --- SEGMENT 4 (Decision Curve Analysis, Fairness Audit & Wrap-up) ---
        print(f"  [Seg 4 UI: {durations[3]:.1f}s] DCA Net Benefit, Fairness Audit & Conclusion...")
        start_t = time.time()
        
        # Switch to DCA Tab
        safe_click("button:has-text('Decision Curve Net Benefit')", 5.0)
        
        # Switch to Fairness Tab
        safe_click("button:has-text('Algorithmic Fairness Audit')", 5.0)
        page.evaluate("window.scrollBy({top: 300, behavior: 'smooth'})")
        time.sleep(4.0)
        
        # Switch to Presentation Tab
        safe_click("button:has-text('Presentation Deck (14 Slides)')", 5.0)
        
        elapsed = time.time() - start_t
        rem = max(0.5, durations[3] - elapsed)
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
