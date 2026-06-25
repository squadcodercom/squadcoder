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

  // search box should have 'opus' filtered. screenshot list, click first Opus option.
  await page.screenshot({ path: SHOTS+"/06-before-pick.png" });

  // find clickable row containing "Claude Opus". List rows are buttons or [role=option].
  // try option role first
  let clicked = false;
  const opts = await page.getByRole("option", { name: /Opus/i }).all();
  if (opts.length) { await opts[0].click(); clicked = true; console.log("clicked option Opus, count="+opts.length); }
  if (!clicked) {
    const btns = await page.getByRole("button", { name: /Claude Opus/i }).all();
    if (btns.length) { await btns[0].click(); clicked = true; console.log("clicked button Opus, count="+btns.length); }
  }
  if (!clicked) {
    // fallback: any element with text Claude Opus
    const el = page.getByText(/Claude Opus/i).first();
    if (await el.count()) { await el.click(); clicked = true; console.log("clicked text Opus"); }
  }
  console.log("CLICKED:", clicked);
  await sleep(1500);
  await page.screenshot({ path: SHOTS+"/07-after-pick.png" });

  // After select: check we are back at Agents (settings not torn down) and model button shows new model
  const body = await page.locator("body").innerText();
  const settingsStillOpen = /Default model|Primary|Subagent|Save changes|Reset/.test(body);
  console.log("Settings still open (back at Agents):", settingsStillOpen);
  // model button text for team-dev
  const mb = await page.getByRole("button", { name: /Claude Opus|Claude Sonnet|GLM/i }).all();
  const mbTexts = [];
  for (const b of mb) mbTexts.push(((await b.textContent())||"").trim());
  console.log("MODEL BUTTONS NOW:", JSON.stringify(mbTexts));
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
