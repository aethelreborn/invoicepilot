"""Probe 5: fiber check across routes — is hydration broken app-wide?"""

import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3102"
routes = sys.argv[1:] or ["/dashboard", "/login", "/"]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="msedge")
    for route in routes:
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        ctx.request.post(f"{BASE}/api/demo/login")
        page = ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        try:
            page.goto(f"{BASE}{route}", wait_until="load", timeout=180000)
        except Exception as e:
            print(f"{route}: goto failed: {e}")
            ctx.close()
            continue
        page.wait_for_timeout(10000)
        info = page.evaluate(
            """() => {
              const els = [...document.querySelectorAll('body *')].slice(0, 400);
              let fibered = 0, total = 0;
              for (const el of els) { total++; if (Object.keys(el).some(k => k.startsWith('__react'))) fibered++; }
              return {fibered, total, next: window.next && window.next.version};
            }"""
        )
        print(
            f"{route}: reactified {info['fibered']}/{info['total']} sampled elements, next={info['next']}, errors={errs}"
        )
        ctx.close()
    browser.close()
