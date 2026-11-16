"""
E2E: InvoicePilot critical path — create invoice in demo mode, pay it anonymously.

Flow:
  1. POST /api/demo/login (cookie into the browser context)
  2. GET /dashboard — expect 200 and "What is owed."
  3. GET /invoices/new — fill client/title/dates/one line item
  4. Submit — land on /invoices/<id> showing the invoice number
  5. Read the pay link from the <code> block (appUrl + /pay/ + pay_token)
  6. Open the pay URL in a FRESH context (no cookies = anonymous client):
     assert "Demo Studio", invoice number, "5,000", and the QR (a <canvas>, not <img>)
  7. Click "I have paid this invoice" (demo UPI provider => direct claim):
     expect "Payment claimed"
  8. (Optional, UI-observed) sender side shows status flipped sent -> viewed -> claimed

Run from repo root:  python tests/e2e/test_demo_pay_flow.py
Artifacts (screenshots): tests/e2e/artifacts/
"""

import re
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# NOTE 2026-11-15: the dev server treats http://127.0.0.1:3102 as cross-origin and
# blocks /_next/hmr ("Blocked cross-origin request ... add it to allowedDevOrigins").
# On that origin the client entry runs but hydration NEVER attaches (verified: 0
# reactified elements on /, /dashboard, /login, /invoices/new; mount-time useEffect
# never fired; native form GET submit reloaded the page). http://localhost:3102 is
# the same dev server, same demo mode — there hydration works (162/162 elements).
# Symptom-only workaround for the TEST; fixing the dev config is out of scope.
BASE_URL = "http://localhost:3102"
REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = REPO_ROOT / "tests" / "e2e" / "artifacts"
NAV_TIMEOUT_MS = 120_000  # dev-mode first compile is slow
SEL_TIMEOUT_MS = 120_000


class DemoPayFlowTest(unittest.TestCase):
    def setUp(self):
        ARTIFACTS.mkdir(parents=True, exist_ok=True)
        self._pw = sync_playwright().start()
        self._browser = self._pw.chromium.launch(headless=True, channel="msedge")
        self._current_step = "init"

    def tearDown(self):
        try:
            self._browser.close()
        finally:
            self._pw.stop()

    # ---------- helpers ----------

    def shot(self, page, name):
        path = ARTIFACTS / f"{name}.png"
        try:
            page.screenshot(path=str(path), full_page=True)
            print(f"[artifact] {path}")
        except Exception as exc:  # screenshot best-effort; never mask the real failure
            print(f"[artifact] FAILED to capture {path}: {exc}")
        return path

    def step(self, name):
        self._current_step = name
        print(f"\n=== step: {name} ===")

    # ---------- the test ----------

    def test_demo_create_and_pay_flow(self):
        context = self._browser.new_context(viewport={"width": 1440, "height": 900})
        context.set_default_timeout(SEL_TIMEOUT_MS)
        context.set_default_navigation_timeout(NAV_TIMEOUT_MS)
        page = context.new_page()
        anon_context = None
        try:
            # 1. login (cookie lands in this context)
            self.step("1 demo login")
            resp = context.request.post(f"{BASE_URL}/api/demo/login")
            self.assertTrue(
                resp.ok, f"demo login failed: HTTP {resp.status} {resp.text()}"
            )
            self.assertEqual(resp.json().get("ok"), True)

            # 2. dashboard renders
            self.step("2 dashboard renders")
            resp = page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            self.assertIsNotNone(resp, "no response for /dashboard")
            self.assertEqual(resp.status, 200, f"/dashboard returned {resp.status}")
            page.wait_for_selector(
                "text=What is owed.", state="visible", timeout=SEL_TIMEOUT_MS
            )
            self.shot(page, "01-dashboard")

            # 3. new invoice form
            self.step("3 fill new invoice form")
            # The mount-time /api/clients fetch fires in a post-hydration effect, so
            # awaiting its response proves React handlers (incl. form onSubmit) are
            # attached. Clicking before that raced hydration and produced a native
            # GET submit -> full reload with an empty form (seen 2026-11-15).
            with page.expect_response(
                lambda r: "/api/clients" in r.url and r.request.method == "GET",
                timeout=NAV_TIMEOUT_MS,
            ) as clients_resp:
                resp = page.goto(
                    f"{BASE_URL}/invoices/new", wait_until="domcontentloaded"
                )
            self.assertIsNotNone(resp)
            self.assertEqual(resp.status, 200, f"/invoices/new returned {resp.status}")
            self.assertTrue(
                clients_resp.value.ok,
                f"/api/clients GET returned {clients_resp.value.status}",
            )
            page.wait_for_selector(
                "#clientName", state="visible", timeout=SEL_TIMEOUT_MS
            )
            page.fill("#clientName", "E2E Walker")
            page.fill("#clientEmail", "walker@example.com")
            page.fill("#title", "E2E Website redesign")
            page.fill(
                "#dueDate", "2026-12-14"
            )  # task-specified due date (2026-11-15 + ~30 days)
            # currency default INR — leave untouched; status default sent — leave untouched
            self.assertEqual(page.locator("#currency").input_value(), "INR")
            self.assertEqual(page.locator("#status").input_value(), "sent")
            page.get_by_placeholder("Design work").first.fill("E2E design work")
            page.get_by_label("Line 1 quantity").fill("1")
            page.get_by_placeholder("0.00").first.fill("5000.00")
            self.shot(page, "02-new-invoice-filled")

            # 4. submit -> detail page with invoice number
            self.step("4 submit and land on detail page")
            with page.expect_response(
                lambda r: "/api/invoices" in r.url and r.request.method == "POST",
                timeout=NAV_TIMEOUT_MS,
            ) as create_resp:
                page.locator("button[type=submit]").click()
            cr = create_resp.value
            self.assertTrue(
                cr.ok,
                f"POST /api/invoices failed: HTTP {cr.status} {cr.text()}",
            )
            page.wait_for_url(
                re.compile(r"/invoices/(?!new($|\?))[^/]+$"), timeout=NAV_TIMEOUT_MS
            )
            invoice_id = page.url.rstrip("/").split("/")[-1]
            self.assertNotEqual(invoice_id, "new")
            self.assertNotEqual(invoice_id, "")
            # error banner from the form, if any
            error_banner = page.locator("text=Failed to create invoice")
            self.assertEqual(
                error_banner.count(), 0, "form reported invoice creation failure"
            )
            heading = page.locator("article h1").first
            heading.wait_for(state="visible", timeout=SEL_TIMEOUT_MS)
            invoice_number = heading.inner_text().strip()
            self.assertRegex(
                invoice_number,
                r"^INV-",
                f"unexpected invoice number: {invoice_number!r}",
            )
            print(f"[info] invoice id={invoice_id} number={invoice_number}")
            self.shot(page, "03-detail-after-create")

            # 5. extract the pay URL from the <code> block (appUrl + /pay/ + pay_token)
            self.step("5 extract pay link")
            pay_code = page.locator("code", has_text="/pay/").first
            pay_code.wait_for(state="visible", timeout=SEL_TIMEOUT_MS)
            pay_url = pay_code.inner_text().strip()
            m = re.search(r"/pay/([^/?#\s]+)", pay_url)
            self.assertIsNotNone(m, f"pay link has no /pay/<token>: {pay_url!r}")
            pay_token = m.group(1)
            self.assertRegex(
                pay_token, r"^demo-token-", f"unexpected pay token shape: {pay_token!r}"
            )
            if not pay_url.startswith(BASE_URL):
                # NOT SILENT: .env.local sets NEXT_PUBLIC_APP_URL to the production origin,
                # so the dev/demo server renders the production origin here (trailing-slash
                # handling was fixed in src/app/(app)/invoices/[id]/page.tsx). Opening that
                # URL from this run would hit production with a token that exists only in
                # this process's in-memory demo store -> guaranteed 404. The anonymous-client
                # assertions below therefore run against the local equivalent (same path+token
                # on the dev server under test).
                print(
                    f"[WARNING] pay link points at {pay_url!r} — not this dev server."
                )
                print(
                    f"[WARNING] using local equivalent {BASE_URL}/pay/{pay_token} for anonymous-client assertions."
                )
                (ARTIFACTS / "extracted-pay-link.txt").write_text(
                    pay_url, encoding="utf-8"
                )
            print(f"[info] pay_url={pay_url} token={pay_token}")

            # 6. anonymous client opens the pay page in a FRESH context (no cookies)
            self.step("6 anonymous pay page")
            anon_context = self._browser.new_context(
                viewport={"width": 1440, "height": 900}
            )
            anon_context.set_default_timeout(SEL_TIMEOUT_MS)
            anon_context.set_default_navigation_timeout(NAV_TIMEOUT_MS)
            anon = anon_context.new_page()
            anon_pay_url = (
                pay_url
                if pay_url.startswith(BASE_URL)
                else f"{BASE_URL}/pay/{pay_token}"
            )
            print(f"[info] anon navigating to: {anon_pay_url}")
            resp = anon.goto(anon_pay_url, wait_until="domcontentloaded")
            self.assertIsNotNone(resp, "no response for pay page")
            self.assertEqual(resp.status, 200, f"pay page returned {resp.status}")
            anon.wait_for_selector(
                "text=Demo Studio", state="visible", timeout=SEL_TIMEOUT_MS
            )
            anon.wait_for_selector(
                f"text={invoice_number}", state="visible", timeout=SEL_TIMEOUT_MS
            )
            body_text = anon.locator("body").inner_text()
            self.assertIn("Demo Studio", body_text)
            self.assertIn(invoice_number, body_text)
            self.assertIn(
                "5,000", body_text, "amount ₹5,000.00 not rendered as expected"
            )
            # QR renders as <canvas> (QRCodeAssemble), not <img>. The demo branch of the
            # pay page was not wiring demoStore.paymentSettings into `payment`, so this
            # used to soft-fail with the "UPI is INR only" placeholder; fixed in
            # src/app/pay/[token]/page.tsx (demoPayment). Kept as a hard assertion now.
            anon.locator("canvas").first.wait_for(
                state="visible", timeout=SEL_TIMEOUT_MS
            )
            self.shot(anon, "04-pay-page-anonymous")

            # optional, UI-observable: sender side flips sent -> viewed after the anonymous view
            self.step("6b sender sees status 'viewed'")
            resp = page.goto(
                f"{BASE_URL}/invoices/{invoice_id}", wait_until="domcontentloaded"
            )
            self.assertEqual(resp.status, 200)
            page.wait_for_selector(
                "article h1", state="visible", timeout=SEL_TIMEOUT_MS
            )
            page.wait_for_selector(
                "text=viewed", state="visible", timeout=SEL_TIMEOUT_MS
            )
            self.shot(page, "05-detail-after-viewed")

            # 7. anonymous client claims the payment. The dev server can trigger
            # full-page reloads (on-demand recompile / version-skew guard) which
            # destroy React state, so assert on the persisted outcome: wait for the
            # claim POST to land, then reload and check the SSR'd state.
            self.step("7 anonymous claim")
            # Hydration race on this page: the QR render can finish before React
            # attaches handlers, so the first click can hit a dead button and no POST
            # fires. Rather than hide it, retry the click up to 3 times with a hard
            # failure after — every attempt is logged.
            claim_btn = anon.get_by_role("button", name="I have paid this invoice")
            claim_btn.first.wait_for(state="visible", timeout=SEL_TIMEOUT_MS)
            cr = None
            for attempt in range(3):
                try:
                    with anon.expect_response(
                        lambda r: (
                            "/api/pay/" in r.url
                            and r.request.method == "POST"
                            and r.request.post_data is not None
                            and '"action":"claim"'
                            in r.request.post_data.replace(" ", "")
                        ),
                        timeout=8_000,
                    ) as claim_resp:
                        claim_btn.first.click()
                    cr = claim_resp.value
                    break
                except PlaywrightTimeoutError:
                    print(
                        f"[attempt {attempt + 1}/3] claim POST did not fire; hydration? retrying"
                    )
            self.assertIsNotNone(cr, "claim POST never fired after 3 clicks")
            print(f"[info] claim POST -> HTTP {cr.status} {cr.text()[:200]}")
            self.assertTrue(cr.ok, f"claim POST failed: HTTP {cr.status}")
            anon.reload(wait_until="domcontentloaded")
            anon.wait_for_selector(
                "text=Payment claimed", state="visible", timeout=SEL_TIMEOUT_MS
            )
            self.shot(anon, "06-pay-page-claimed")

            # sender side now shows 'claimed'
            self.step("7b sender sees status 'claimed'")
            resp = page.goto(
                f"{BASE_URL}/invoices/{invoice_id}", wait_until="domcontentloaded"
            )
            self.assertEqual(resp.status, 200)
            page.wait_for_selector(
                "article h1", state="visible", timeout=SEL_TIMEOUT_MS
            )
            page.wait_for_selector(
                "text=claimed", state="visible", timeout=SEL_TIMEOUT_MS
            )
            self.shot(page, "07-detail-after-claim")

        except Exception:
            # capture the crashing state on BOTH pages, wherever we got to
            for label, pg in (("sender", page), ("anon", locals().get("anon"))):
                if pg is None:
                    continue
                try:
                    self.shot(
                        pg, f"failure-{label}-{self._current_step.replace(' ', '_')}"
                    )
                except Exception:
                    pass
            raise
        finally:
            if anon_context is not None:
                anon_context.close()
            context.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
