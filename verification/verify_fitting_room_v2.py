from playwright.sync_api import Page, expect, sync_playwright

def test_fitting_room_layout(page: Page):
    print("Navigating to Characters page...")
    # 1. Navigate to the Characters page (home)
    page.goto("http://localhost:3000/characters")

    # 2. Click the character card named "Momo"
    # Wait for network idle to ensure data is loaded
    print("Waiting for network idle...")
    page.wait_for_load_state("networkidle")

    # Locate and click Momo
    print("Looking for Momo...")
    # Using locator ensures we wait for it to appear
    momo_locator = page.get_by_text("Momo", exact=True).first
    if momo_locator.count() == 0:
        # Fallback to loose match if exact fails
        momo_locator = page.get_by_text("Momo").first

    momo_locator.click()
    print("Clicked Momo.")

    # 3. Wait for Fitting Room to load
    # Expect "Fitting Room" text or "Momo" (since name is displayed)
    print("Waiting for Fitting Room...")
    expect(page.get_by_text("Fitting Room")).to_be_visible()

    # Wait a bit for images to load
    page.wait_for_timeout(1000)

    # 4. Take Screenshot of Fitting Room
    print("Taking screenshot...")
    page.screenshot(path="verification/fitting_room_v2.png")
    print("Screenshot saved to verification/fitting_room_v2.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to verify overflow behavior (standard desktop size)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        try:
            test_fitting_room_layout(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_v2.png")
        finally:
            browser.close()
