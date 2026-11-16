"""Probe: does /invoices/new hydrate on the dev server? Collect console/errors/requests."""

import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3102"
URL = sys.argv[1] if len(sys.argv) > 1 else f"{BASE}/invoices/new"
WAIT_S = int(sys.argv[2]) if len(sys.argv) > 2 else 45

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="msedge")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    ctx.request.post(f"{BASE}/api/demo/login")
    page = ctx.new_page()
    page.on("console", lambda m: print(f"[console.{m.type}] {m.text[:300]}"))
    page.on("pageerror", lambda e: print(f"[pageerror] {e}"))
    page.on("requestfailed", lambda r: print(f"[requestfailed] {r.url} :: {r.failure}"))
    page.on(
        "response",
        lambda r: print(f"[response] {r.status} {r.url}") if "/api/" in r.url else None,
    )
    page.goto(URL, wait_until="domcontentloaded", timeout=120000)
    print("[probe] domcontentloaded; waiting", WAIT_S, "s for hydration/fetch...")
    page.wait_for_timeout(WAIT_S * 1000)
    print("[probe] final url:", page.url)
    print("[probe] select options:", page.locator("#existing option").count())
    print("[probe] clients api seen: checking console log above")
    browser.close()
