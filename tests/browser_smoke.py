"""Optional normal-origin smoke test. Start `npm run dev` before running this file.
Install test-only dependencies with: python3 -m pip install playwright
Then: python3 -m playwright install chromium
"""
from __future__ import annotations
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get("INVARIANT_URL", "http://127.0.0.1:5173").rstrip("/")

def main() -> None:
    errors: list[str] = []
    with sync_playwright() as p:
        options: dict = {"headless": True}
        if os.environ.get("CHROMIUM_PATH"):
            options["executable_path"] = os.environ["CHROMIUM_PATH"]
        browser = p.chromium.launch(**options)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("pageerror", lambda error: errors.append(str(error)))
        response = page.goto(BASE + "/", wait_until="networkidle")
        assert response and response.ok, "Homepage request failed"
        assert page.locator("h1").inner_text().strip(), "Missing headline"
        page.locator("#lab").scroll_into_view_if_needed()
        page.wait_for_function('document.querySelector("#compiler-result").textContent === "112"')
        print("Renderer:", page.locator("#render-backend").inner_text())
        print("Execution:", page.locator("#worker-status").inner_text())
        print("Compiler:", page.locator("#compiler-detail").inner_text())
        page.locator("#tab-algebra").click()
        page.wait_for_timeout(300)
        assert "216" in page.locator("#panel-algebra").inner_text()
        page.keyboard.press("Control+k")
        assert page.locator("#command-dialog").is_visible()
        page.keyboard.press("Escape")
        assert not page.locator("#command-dialog").is_visible()
        for width in (360, 390, 768, 1024, 1440):
            page.set_viewport_size({"width": width, "height": 900})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"Overflow at {width}px"
        assert not errors, "Browser exceptions: " + "\n".join(errors)
        browser.close()
    print("Normal-origin smoke checks passed. GPU appearance still needs visual inspection.")

if __name__ == "__main__":
    main()
