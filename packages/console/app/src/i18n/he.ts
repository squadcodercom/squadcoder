import { dict as en } from "./en"

// Hebrew (עברית) — partial translations; any missing key falls back to English
// via the `{ ...base, ...he }` merge in ./index.ts. RTL layout is applied
// automatically by `dir("he") === "rtl"` in ../lib/language.ts.
export const dict = {
  ...en,
  "nav.docs": "תיעוד",
  "nav.changelog": "יומן שינויים",
  "nav.enterprise": "ארגוני",
  "nav.login": "התחברות",
  "nav.free": "הורדה",
  "nav.home": "בית",
  "nav.openMenu": "פתחו תפריט",
  "nav.getStartedFree": "התחילו בחינם",
  "nav.logoAlt": "MuminAI",

  "footer.docs": "תיעוד",
  "footer.changelog": "יומן שינויים",

  "legal.brand": "מותג",
}
