const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /5173/.test(p.url())) || ctx.pages()[0];
  const dlg = page.locator('[data-component="dialog"], [role="dialog"]').last();
  const rows = await dlg.evaluate(el => {
    const out = [];
    el.querySelectorAll('button,[role="option"],[data-slot]').forEach(r => {
      const txt = (r.textContent||'').trim().slice(0,45);
      if (txt && /opus/i.test(txt)) out.push({tag:r.tagName.toLowerCase(), role:r.getAttribute('role'), slot:r.getAttribute('data-slot'), txt});
    });
    return out;
  }).catch(e=>"ERR:"+e.message);
  console.log("OPUS ROWS:", JSON.stringify(rows,null,1));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
