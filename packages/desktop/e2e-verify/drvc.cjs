const { chromium } = require("playwright-core");
const SHOTS = "C:/Users/raviv/OneDrive/Desktop/MuminAI/mumin/packages/desktop/e2e-verify/shots-t11";
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /5173/.test(p.url())) || ctx.pages()[0];
  await page.bringToFront();
  // clear the search input in the open dialog
  const search = page.locator('[data-slot="list-search"] input, input[data-slot="input-input"]').last();
  if (await search.count()) {
    await search.fill("");
    await sleep(600);
  }
  await page.screenshot({ path: SHOTS+"/08-cleared-search.png" });
  const dlg = page.locator('[role="dialog"]').last();
  // dump list rows now
  const rows = await dlg.evaluate(el => {
    const out=[];
    el.querySelectorAll('[data-slot="list-item"],[role="option"],button').forEach(r=>{
      const txt=(r.textContent||'').trim().slice(0,40);
      if(txt && /claude|glm|gpt|opus|sonnet|haiku|gemini|grok/i.test(txt)) out.push({slot:r.getAttribute('data-slot'),role:r.getAttribute('role'),txt});
    });
    return out.slice(0,15);
  });
  console.log("ROWS:", JSON.stringify(rows,null,1));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
