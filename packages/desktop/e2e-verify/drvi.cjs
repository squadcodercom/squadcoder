const { chromium } = require("playwright-core");
const SHOTS = "C:/Users/raviv/OneDrive/Desktop/MuminAI/mumin/packages/desktop/e2e-verify/shots-t11";
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /5173/.test(p.url())) || ctx.pages()[0];
  await page.bringToFront();
  // dialog is still open with 'opus' filter. Inspect dialog content rows.
  const dlg = page.locator('[data-component="dialog"], [role="dialog"]').last();
  const html = await dlg.evaluate(el => {
    // collect candidate clickable rows
    const rows = [...el.querySelectorAll('[data-slot],[role="option"],button,li,[data-index]')];
    return rows.slice(0,40).map(r => ({
      tag: r.tagName.toLowerCase(),
      role: r.getAttribute('role'),
      slot: r.getAttribute('data-slot'),
      cls: (r.className||'').slice(0,40),
      txt: (r.textContent||'').trim().slice(0,40)
    })).filter(x=>x.txt);
  }).catch(e=>"ERR:"+e.message);
  console.log(JSON.stringify(html,null,1));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
