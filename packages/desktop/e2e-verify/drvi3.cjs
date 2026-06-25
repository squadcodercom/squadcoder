const { chromium } = require("playwright-core");
const SHOTS = "C:/Users/raviv/OneDrive/Desktop/MuminAI/mumin/packages/desktop/e2e-verify/shots-t11";
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /5173/.test(p.url())) || ctx.pages()[0];
  await page.bringToFront();
  await page.screenshot({ path: SHOTS+"/inspect-now.png" });
  const dlgCount = await page.locator('[data-component="dialog"], [role="dialog"]').count();
  console.log("dialog count:", dlgCount);
  if (dlgCount) {
    const dlg = page.locator('[data-component="dialog"], [role="dialog"]').last();
    const t = await dlg.innerText();
    console.log("DIALOG TEXT (first 400):", JSON.stringify(t.slice(0,400)));
    // list item slots
    const slots = await dlg.evaluate(el => {
      const s = new Set();
      el.querySelectorAll('[data-slot]').forEach(r=>s.add(r.getAttribute('data-slot')));
      return [...s];
    });
    console.log("SLOTS:", JSON.stringify(slots));
  } else {
    console.log("BODY:", JSON.stringify((await page.locator('body').innerText()).slice(0,300)));
  }
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
