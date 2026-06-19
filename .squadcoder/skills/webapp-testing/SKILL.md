---
name: sc:webapp-testing
description: "Test a web app end-to-end with Playwright: drive real flows, assert on visible state, catch console/network errors, and do visual + RTL/Hebrew checks. Covers writing resilient selectors (roles/text over CSS), waiting on conditions (never sleeps), screenshot diffing, and a quick smoke pass before shipping. Activate for: test the web app, e2e test, playwright, browser test, check the UI, visual regression, smoke test, בדיקת אתר, בדיקות אוטומציה, בדיקת ממשק."
argument-hint: "[flow or page to test]"
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Webapp Testing — resilient end-to-end tests with Playwright

Test what the **user sees and does**, not implementation details. The bundled Playwright MCP/browser
is available; use it to drive a real browser and assert on real state.

## Step 0 — decide the flow
Name the user journey ("sign up → onboarding → first project"). Test that, not isolated widgets.
List the success assertions up front (what must be true at the end).

## Step 1 — resilient selectors (in priority order)
1. **Role + accessible name** — `getByRole("button", { name: "Save" })`. Survives restyles.
2. **Visible text** — `getByText(...)`.
3. **Label / placeholder** — for form fields.
4. **`data-testid`** — only when the above can't disambiguate.
Avoid brittle CSS/XPath chains and nth-child positional selectors.

## Step 2 — wait on conditions, never sleep
- Use auto-waiting assertions: `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`.
- Never `waitForTimeout(n)` to "let it settle" — wait for the actual condition (element, response, URL).
- For network: `await page.waitForResponse(/api\/thing/)` when an action triggers a fetch.

## Step 3 — drive the flow and assert
```ts
await page.goto(BASE_URL)
await page.getByRole("button", { name: "Open project" }).click()
await page.getByPlaceholder("Browse folders").fill("~/demo")
await page.keyboard.press("Enter")
await expect(page.getByRole("heading", { name: "demo" })).toBeVisible()
```

## Step 4 — catch errors the user wouldn't report
- **Console:** fail the test on `console.error` / uncaught exceptions (`page.on("console")` / `"pageerror"`).
- **Network:** flag 4xx/5xx on requests the flow depends on.
- **A11y:** check focus order and that interactive elements have accessible names.

## Step 5 — visual + RTL/Hebrew parity
- Screenshot key states; compare to a baseline (`toHaveScreenshot`) with a small tolerance.
- **Always test RTL too:** load the app in Hebrew (`dir="rtl"`), verify the sidebar/layout mirror and
  nothing overlaps. RTL bugs hide in physical-CSS leftovers — this catches them.
- Test at mobile and desktop widths if the app is responsive.

## Step 6 — a fast smoke pass
Before shipping, run one short script that: loads the app, asserts no console errors, walks the primary
flow, and screenshots the result LTR + RTL. Cheap insurance.

## Rules
- Test behavior and visible state, not internals.
- One flow per test; clear arrange/act/assert.
- No sleeps, no brittle selectors, no asserting on text you didn't render.
- Report failures with the screenshot + the failing assertion, not a vague "it broke".
