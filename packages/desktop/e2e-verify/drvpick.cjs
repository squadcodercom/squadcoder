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

  const dlg = page.locator('[role="dialog"]').last();
  // click the Anthropic Claude Opus row (use list-item containing both Claude Opus and anthropic)
  const opus = dlg.locator('[data-slot="list-item"]', { hasText: "Claude Opus" }).filter({ hasText: "anthropic" }).first();
  console.log("opus row count:", await opus.count());
  await opus.scrollIntoViewIfNeeded();
  await opus.click();
  console.log("clicked Claude Opus (anthropic)");
  await sleep(1800);
  await page.screenshot({ path: SHOTS+"/09-after-pick-opus.png" });

  const body = await page.locator("body").innerText();
  const settingsBack = /Default model|Primary|Subagent|Save changes|Reset/.test(body);
  console.log("Settings still open at Agents:", settingsBack);
  const dlgCount = await page.locator('[role="dialog"]').count();
  console.log("dialog count after pick:", dlgCount);

  // team-dev model button text
  const mb = await page.getByRole("button", { name: /Claude Opus|Claude Sonnet|Claude Haiku|GLM/i }).all();
  const texts=[]; for (const b of mb) texts.push(((await b.textContent())||"").trim());
  console.log("MODEL BUTTONS NOW:", JSON.stringify(texts));
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
