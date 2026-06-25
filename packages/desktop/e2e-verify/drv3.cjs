const { chromium } = require("playwright-core");
const SHOTS = "C:/Users/raviv/OneDrive/Desktop/MuminAI/mumin/packages/desktop/e2e-verify/shots-t11";
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /5173/.test(p.url())) || ctx.pages()[0];
  await page.bringToFront();
  const errors = [];
  page.on("console", m => { if (m.type()==="error") errors.push("C.err: "+m.text()); });
  page.on("pageerror", e => errors.push("PAGEERR: "+e.message));

  // assume Settings/Agents already open from prior step; if not, open
  if (!(await page.getByRole("button",{name:"team-dev",exact:true}).count())) {
    await page.getByRole("button", { name: "Settings", exact: true }).click(); await sleep(700);
    const at = page.getByRole("tab", { name: /Agents/i }).first();
    if (await at.count()) await at.click(); await sleep(700);
  }
  // click team-dev agent
  await page.getByRole("button", { name: "team-dev", exact: true }).click();
  await sleep(900);
  await page.screenshot({ path: SHOTS+"/03-teamdev-selected.png" });

  const allBtns = await page.getByRole("button").all();
  const info = [];
  for (const b of allBtns) {
    const t = ((await b.textContent())||"").trim();
    if (t && t.length < 60) info.push(t);
  }
  console.log("ALLBTNS:", JSON.stringify(info));
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
