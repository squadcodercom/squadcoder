const { chromium } = require("playwright-core");
const fs = require("fs");
const SHOTS = "C:/Users/raviv/OneDrive/Desktop/MuminAI/mumin/packages/desktop/e2e-verify/shots-t11";
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => /5173/.test(p.url())) || pages[0];
  await page.bringToFront();
  const errors = [];
  page.on("console", m => { if (m.type()==="error") errors.push("CONSOLE.error: "+m.text()); });
  page.on("pageerror", e => errors.push("PAGEERROR: "+e.message));
  console.log("URL:", page.url(), "TITLE:", await page.title());

  // Open Settings. Try common entry points.
  await page.screenshot({ path: SHOTS+"/00-initial.png" });

  // dump roles to find settings entry
  const buttons = await page.getByRole("button").all();
  const labels = [];
  for (const b of buttons.slice(0,60)) {
    const n = (await b.getAttribute("aria-label")) || (await b.textContent()) || "";
    if (n.trim()) labels.push(n.trim().slice(0,40));
  }
  console.log("BUTTONS:", JSON.stringify(labels));
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
