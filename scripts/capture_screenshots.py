import os
import time
from playwright.sync_api import sync_playwright

os.makedirs("presentation/screenshots", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 920})
    
    print("Navigating to http://localhost:8000...")
    page.goto("http://localhost:8000", wait_until="networkidle")
    time.sleep(2)
    
    # --- 1. Load Persona 3 (High-Risk Multi-Morbid CKM Stage 3) ---
    print("Clicking Persona 3...")
    page.click("button:has-text('Persona 3')")
    time.sleep(1.5)
    
    # Capture Screenshot 1: Calculator tab with CKM Stage 3 & Metformin Contraindication Alert
    print("Capturing Screenshot 1: Clinical Risk Summary & Guardrail Alert...")
    page.screenshot(path="presentation/screenshots/screenshot_marcus_vance_contraindication.png")
    print("Saved presentation/screenshots/screenshot_marcus_vance_contraindication.png")
    
    # --- 2. Switch to What-If Simulator & SGLT2i Trial Preset ---
    print("Switching to Simulator Tab...")
    page.click("button:has-text('What-If Intervention Simulator')")
    time.sleep(1.5)
    
       # Click SGLT2i Initiation Preset
    print("Clicking SGLT2i Initiation Preset...")
    sglt2_btn = page.locator("button:has-text('SGLT2i Initiation')")
    if sglt2_btn.count() > 0:
        sglt2_btn.click()
        time.sleep(1.5)
        
    page.screenshot(path="presentation/screenshots/screenshot_shap_counterfactual_trial.png")
    print("Saved presentation/screenshots/screenshot_shap_counterfactual_trial.png")
    
    # --- 3. Switch to Explainable AI (SHAP Waterfall) ---
    print("Switching to SHAP Waterfall Tab...")
    page.click("button:has-text('Explainable AI (SHAP Waterfall)')")
    time.sleep(1.5)
    page.screenshot(path="presentation/screenshots/screenshot_shap_waterfall.png")
    print("Saved presentation/screenshots/screenshot_shap_waterfall.png")

    # --- 4. Switch to Decision Curve Analysis Tab ---
    print("Switching to DCA Tab...")
    page.click("button:has-text('Decision Curve Net Benefit')")
    time.sleep(1.5)
    page.screenshot(path="presentation/screenshots/screenshot_dca_net_benefit.png")
    print("Saved presentation/screenshots/screenshot_dca_net_benefit.png")

    # --- 5. Switch to Fairness Tab ---
    print("Switching to Fairness Tab...")
    page.click("button:has-text('Algorithmic Fairness Audit')")
    time.sleep(1.5)
    page.screenshot(path="presentation/screenshots/screenshot_fairness_mitigation.png")
    print("Saved presentation/screenshots/screenshot_fairness_mitigation.png")

    browser.close()
    print("All 5 high-res UI screenshots captured successfully!")
