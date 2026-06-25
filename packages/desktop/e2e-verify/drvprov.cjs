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

  // open Settings
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await sleep(800);
  // go to Providers tab
  const pt = page.getByRole("tab", { name: /Providers/i }).first();
  if (await pt.count()) await pt.click();
  else await page.getByText(/^Providers$/).first().click();
  await sleep(1000);
  await page.screenshot({ path: SHOTS+"/10-providers.png" });

  const body = await page.locator("body").innerText();
  // capture the "Connected" section text
  console.log("HAS 'Connected':", /Connected/i.test(body));
  console.log("GitHub Models in body:", /GitHub Models/i.test(body));
  console.log("GitHub Copilot in body:", /GitHub Copilot/i.test(body));
  console.log("Anthropic in body:", /Anthropic/i.test(body));
  console.log("Z.AI / Zai in body:", /Z\.?AI|zai/i.test(body));
  console.log("Environment label in body:", /Environment/i.test(body));
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
