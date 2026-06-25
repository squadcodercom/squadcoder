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

  // open model picker
  await page.getByRole("button", { name: "Claude Sonnet 4.6", exact: true }).click();
  await sleep(900);
  await page.screenshot({ path: SHOTS+"/04-model-dialog.png" });

  // grab dialog title
  const heads = await page.getByRole("heading").all();
  let title="";
  for (const h of heads){ const t=((await h.textContent())||"").trim(); if(/model/i.test(t)) title=t; }
  // also any element with "Model for"
  const bodyTxt = await page.locator("body").innerText();
  const m = bodyTxt.match(/Model for[^\n]*/);
  console.log("DIALOG TITLE heading:", JSON.stringify(title));
  console.log("DIALOG 'Model for' text:", JSON.stringify(m? m[0] : null));
  console.log("LITERAL {agent} present:", /\{\{?agent\}?\}/.test(bodyTxt));

  // search filter test: count rows before
  // The list items - count buttons/options containing 'Claude' or 'GLM'
  const optsBefore = await page.getByRole("option").count().catch(()=>0);
  const listBtnsBefore = (await page.getByRole("button").all());
  console.log("option count before:", optsBefore);

  // find the search box
  const search = page.getByPlaceholder(/search/i).first();
  const hasSearch = await search.count();
  console.log("has search box:", hasSearch);
  if (hasSearch) {
    await search.fill("opus");
    await sleep(700);
    await page.screenshot({ path: SHOTS+"/05-search-opus.png" });
    const after = await page.locator("body").innerText();
    const opusLines = (after.match(/Opus/gi)||[]).length;
    const sonnetLines = (after.match(/Sonnet/gi)||[]).length;
    console.log("after filter 'opus' -> Opus mentions:", opusLines, "Sonnet mentions:", sonnetLines);
  }
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
