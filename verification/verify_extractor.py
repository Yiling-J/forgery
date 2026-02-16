from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        print("Navigating to Equipments page...")
        page.goto("http://localhost:3000/equipments")

        # Wait for potential loading
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except:
            print("Network idle timeout, continuing...")

        print("Looking for Extract Equipment button...")
        # The button text is "Extract Equipment"
        # It might take time to render if data is fetching
        extract_btn = page.get_by_role("button", name="Extract Equipment")
        expect(extract_btn).to_be_visible(timeout=15000)

        print("Clicking Extract Equipment...")
        extract_btn.click()

        # Wait for dialog
        dialog = page.locator("div[role='dialog']")
        expect(dialog).to_be_visible()

        print("Verifying Upload Stage Footer...")
        # The dialog should have a footer with a Cancel button
        # DialogFooter is just a div, but it should contain "Cancel" button
        cancel_btn = dialog.get_by_role("button", name="Cancel")
        expect(cancel_btn).to_be_visible()

        # Take screenshot of Upload Stage
        page.screenshot(path="verification/extractor_dialog_upload.png")
        print("Screenshot saved to verification/extractor_dialog_upload.png")

        # Verify content area (UploadStage)
        upload_area = page.get_by_text("Upload an Image")
        expect(upload_area).to_be_visible()

        browser.close()

if __name__ == "__main__":
    run()
