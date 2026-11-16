"""Probe 7: anonymous pay page at localhost — fibers, console, canvas, hydration."""

import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3102"
TOKEN = sys.argv[1]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="msedge")
    ctx = browser.new_context(
        viewport={"width": 1440, "height": 900}
    )  # fresh = anonymous
    page = ctx.new_page()
    page.on("pageerror", lambda e: print(f"[pageerror] {e}"))
    page.on(
        "console",
        lambda m: (
            print(f"[console.{m.type}] {m.text[:220]}")
            if m.type in ("error", "warning", "info")
            else None
        ),
    )
    page.on(
        "requestfailed",
        lambda r: print(
            f"[requestfailed] {r.url.replace(BASE, '')[:120]} :: {r.failure}"
        ),
    )
    page.on(
        "response",
        lambda r: (
            print(f"[{r.status}] {r.url.replace(BASE, '')[:150]}")
            if ("/api/" in r.url or "pay" in r.url.lower() and ".js" in r.url)
            else None
        ),
    )
    page.goto(f"{BASE}/pay/{TOKEN}", wait_until="load", timeout=180000)
    print("[probe] load fired")
    page.wait_for_timeout(25000)
    n = page.evaluate(
        "() => { const els=[...document.querySelectorAll('body *')];"
        " return els.filter(el => Object.keys(el).some(k => k.startsWith('__react'))).length; }"
    )
    cvs = page.locator("canvas").count()
    print(f"[probe] reactified els: {n}, canvas count: {cvs}")
    print(
        "[probe] body has 'Demo Studio':",
        page.locator("body").inner_text().count("Demo Studio") if False else "",
    )
    page.screenshot(
        path="D:/Projects/invoicepilot/tests/e2e/artifacts/probe7-pay-page.png",
        full_page=True,
    )
    browser.close()
