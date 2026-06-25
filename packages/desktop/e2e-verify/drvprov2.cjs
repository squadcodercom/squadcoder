const { chromium } = require("playwright-core");
const SHOTS = "C:/Users/raviv/OneDrive/Desktop/MuminAI/mumin/packages/desktop/e2e-verify/shots-t11";
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /5173/.test(p.url())) || ctx.pages()[0];
  await page.bringToFront();
  // structured: find the heading "Connected" and list its sibling provider rows + their source label
  const data = await page.evaluate(() => {
    const out = { connected: [], headings: [] };
    // gather all text nodes that look like section headings
    document.querySelectorAll('h1,h2,h3,h4,[class*="text-"][class*="medium"]').forEach(h=>{
      const t=(h.textContent||'').trim();
      if(/connected|popular|available/i.test(t) && t.length<40) out.headings.push(t);
    });
    // Heuristic: find the container after a "Connected" heading and list provider names + badges
    const all=[...document.querySelectorAll('*')];
    const connHead = all.find(e=>/^Connected/i.test((e.textContent||'').trim()) && (e.textContent||'').trim().length<30 && e.children.length===0);
    if(connHead){
      let sec = connHead.closest('div');
      // climb to a section that holds rows
      for(let i=0;i<4 && sec && sec.querySelectorAll('[data-slot],button').length<2;i++) sec=sec.parentElement;
      if(sec){
        sec.querySelectorAll('*').forEach(()=>{});
        // collect rows: elements with a provider name + an Environment/Custom/API key badge
        const rows=[...sec.querySelectorAll('div')].filter(d=>{
          const t=(d.textContent||'');
          return /(Environment|Custom|API key|OAuth)/.test(t) && t.length<80;
        });
        rows.forEach(r=>out.connected.push((r.textContent||'').replace(/\s+/g,' ').trim().slice(0,70)));
      }
    }
    out.connected=[...new Set(out.connected)];
    return out;
  });
  console.log("HEADINGS:", JSON.stringify(data.headings));
  console.log("CONNECTED ROWS:", JSON.stringify(data.connected,null,1));
  // screenshot just top of providers panel
  await page.screenshot({ path: SHOTS+"/11-connected-providers.png" });
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
