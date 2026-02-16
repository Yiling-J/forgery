from playwright.sync_api import sync_playwright, expect
import os

def run():
    # Create a dummy image file (1x1 transparent png)
    with open("dummy.png", "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        print("Navigating to Equipments page...")
        page.goto("http://localhost:3000/equipments")

        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except:
            print("Network idle timeout, continuing...")

        print("Opening dialog...")
        page.get_by_role("button", name="Extract Equipment").click()
        expect(page.locator("div[role='dialog']")).to_be_visible()

        print("Uploading image...")
        # Find file input (it has id="file-upload")
        # In UploadStage.tsx: <input id="file-upload" type="file" ... />
        # But verify checking if it is hidden
        # page.set_input_files("#file-upload", "dummy.png")
        # Or locate by label/id
        page.locator("#file-upload").set_input_files("dummy.png")

        print("Verifying Analyze Stage Footer...")
        # Should have Cancel and Start Extraction
        cancel_btn = page.get_by_role("button", name="Cancel")
        start_btn = page.get_by_role("button", name="Start Extraction")

        expect(cancel_btn).to_be_visible()
        expect(start_btn).to_be_visible()

        page.screenshot(path="verification/extractor_dialog_analyze.png")
        print("Screenshot saved to verification/extractor_dialog_analyze.png")

        browser.close()

    # Cleanup
    if os.path.exists("dummy.png"):
        os.remove("dummy.png")

if __name__ == "__main__":
    run()
