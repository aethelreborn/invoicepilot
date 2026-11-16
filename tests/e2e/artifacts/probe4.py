"""Probe 4: fiber keys on DOM nodes + navigation timing + test dashboard hydration."""

import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3102"
target = sys.argv[1] if len(sys.argv) > 1 else "/invoices/new"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="msedge")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    ctx.request.post(f"{BASE}/api/demo/login")
    page = ctx.new_page()
    page.on("pageerror", lambda e: print(f"[pageerror] {e}"))
    page.goto(f"{BASE}{target}", wait_until="load", timeout=180000)
    page.wait_for_timeout(15000)
    for sel in [
        "#clientName",
        "button[type=submit]",
        "input[placeholder='Design work']",
        "#dueDate",
    ]:
        keys = page.evaluate(
            "(s) => { const el = document.querySelector(s); if (!el) return 'MISSING';"
            " return Object.keys(el).filter(k => k.startsWith('__react')).join(',') || 'NO-FIBER'; }",
            sel,
        )
        print(f"[fiber] {sel}: {keys}")
    print(
        "[next] version:",
        page.evaluate("() => window.next && window.next.version || 'n/a'"),
    )
    print("[next] __NEXT_DATA__:", page.evaluate("() => typeof window.__NEXT_DATA__"))
    browser.close()
