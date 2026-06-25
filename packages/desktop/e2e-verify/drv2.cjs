const { chromium } = require("playwright-core");
const SHOTS = "C:/Users/raviv/OneDrive/Desktop/MuminAI/mumin/packages/desktop/e2e-verify/shots-t11";
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /5173/.test(p.url())) || ctx.pages()[0];
  await page.bringToFront();
  const errors = [];
  page.on("console", m => { if (m.type()==="error") errors.push("CONSOLE.error: "+m.text()); });
  page.on("pageerror", e => errors.push("PAGEERROR: "+e.message));

  // 1. Open Settings
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await sleep(800);
  await page.screenshot({ path: SHOTS+"/01-settings-open.png" });

  // 2. Click Agents tab
  const agentsTab = page.getByRole("tab", { name: /Agents/i }).first();
  if (await agentsTab.count()) { await agentsTab.click(); }
  else { await page.getByText(/^Agents$/).first().click(); }
  await sleep(900);
  await page.screenshot({ path: SHOTS+"/02-agents.png" });

  // dump what's visible in the agents pane
  const txt = await page.locator("body").innerText();
  console.log("HAS team-dev:", /team-dev/.test(txt));

  // find team-dev row's model button. List buttons containing model-ish text near team-dev
  const allBtns = await page.getByRole("button").all();
  const info = [];
  for (const b of allBtns) {
    const t = ((await b.textContent())||"").trim();
    if (t && t.length < 50) info.push(t);
  }
  console.log("BTNS:", JSON.stringify(info.filter(t=>/sonnet|opus|haiku|glm|gpt|model|team-dev|claude/i.test(t))));
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
