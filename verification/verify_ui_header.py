from playwright.sync_api import sync_playwright, expect

def verify_ui_header():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Go to Settings page
            print("Navigating to Settings page...")
            page.goto("http://localhost:3000/settings")

            # Wait for header
            print("Waiting for header...")
            header = page.locator("h1", has_text="Settings")
            expect(header).to_be_visible(timeout=10000)

            # Check for separator (by looking for the class or role)
            # The separator in shadcn/ui is usually a div with role="none" or specific classes
            # Since we added custom classes, let's verify visual presence via screenshot

            # Take screenshot of the header area specifically
            print("Taking screenshot...")
            page.screenshot(path="verification/settings_page_transparent.png", full_page=True)

            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure_transparent.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui_header()
