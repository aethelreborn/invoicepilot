"""Probe 3: click a client-only button to test hydration; watch console + api calls."""

import time
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3102"
URL = f"{BASE}/invoices/new"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="msedge")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    ctx.request.post(f"{BASE}/api/demo/login")
    page = ctx.new_page()
    page.on("pageerror", lambda e: print(f"[pageerror] {e}"))
    page.on("console", lambda m: print(f"[console.{m.type}] {m.text[:200]}"))
    page.on(
        "response",
        lambda r: (
            print(f"[{r.status}] {r.url.replace(BASE, '')[:150]}")
            if "/api/" in r.url or "page.js" in r.url
            else None
        ),
    )
    page.goto(URL, wait_until="load", timeout=180000)
    print("[probe] load fired; waiting 20s")
    page.wait_for_timeout(20000)
    n_before = page.locator("input[placeholder='Design work']").count()
    print("[probe] line-item inputs before click:", n_before)
    try:
        page.get_by_role("button", name="+ Add line item").click(timeout=5000)
        page.wait_for_timeout(1500)
        n_after = page.locator("input[placeholder='Design work']").count()
        print(
            "[probe] line-item inputs after click:",
            n_after,
            "=> hydrated" if n_after > n_before else "=> NOT hydrated",
        )
    except Exception as e:
        print("[probe] click failed:", e)
    print("[probe] /api/clients requests seen: check lines above")
    browser.close()
