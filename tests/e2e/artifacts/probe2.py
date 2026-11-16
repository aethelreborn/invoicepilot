"""Probe 2: full request/response trace for /invoices/new — find stuck chunk or 404."""

import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3102"
URL = f"{BASE}/invoices/new"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="msedge")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    ctx.request.post(f"{BASE}/api/demo/login")
    page = ctx.new_page()
    page.on("pageerror", lambda e: print(f"[pageerror] {e}"))
    page.on("requestfailed", lambda r: print(f"[requestfailed] {r.url} :: {r.failure}"))
    page.on(
        "response", lambda r: print(f"[{r.status}] {r.url.replace(BASE, '')[:180]}")
    )
    page.goto(URL, wait_until="load", timeout=180000)
    print("[probe] load event fired")
    page.wait_for_timeout(60000)
    print("[probe] select options:", page.locator("#existing option").count())
    print(
        "[probe] hydrated? submit button enabled:",
        page.locator("button[type=submit]").is_enabled(),
    )
    browser.close()
