"""Probe 6: does hydration work on localhost:3102 (the non-blocked origin)?"""

import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3102"
ROUTE = sys.argv[2] if len(sys.argv) > 2 else "/invoices/new"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="msedge")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    ctx.request.post(f"{BASE}/api/demo/login")
    page = ctx.new_page()
    msgs = []
    page.on("console", lambda m: msgs.append((m.type, m.text[:160])))
    page.on("pageerror", lambda e: print(f"[pageerror] {e}"))
    page.goto(f"{BASE}{ROUTE}", wait_until="load", timeout=180000)
    page.wait_for_timeout(12000)
    n = page.evaluate(
        "() => { const els=[...document.querySelectorAll('body *')];"
        " return els.filter(el => Object.keys(el).some(k => k.startsWith('__react'))).length; }"
    )
    print(f"[{BASE}{ROUTE}] reactified elements: {n}")
    opts = (
        page.locator("#existing option").count() if ROUTE == "/invoices/new" else None
    )
    print(f"[{BASE}{ROUTE}] select options: {opts}")
    for t, m in msgs[:15]:
        print(f"  [{t}] {m}")
    browser.close()
