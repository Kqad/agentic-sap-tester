---
name: sap-midscene-test
description: Use when converting a natural-language test case into a Midscene.js + Playwright TypeScript spec for SAP WebGUI in this project (saptest1). Triggers on requests like "translate this test case into a spec", "write a Midscene test for SAP", or any multi-step NL test case mentioning SAP / mhl.wdisp.bosch.com / transaction codes / Favorites / Asset, Finance, MM, SD modules. Bakes in this project's environment (DashScope Qwen via corporate proxy, getByLabel-first form filling, SAP WebGUI quirks, network retry).
---

# SAP WebGUI test-case → Midscene spec

The project already has working env + scaffolding. **Do not re-bootstrap.** When the user gives a new NL test case, write a new `.spec.ts` + `.json` pair, run it, and report results.

## Project layout (already in place)

```
e2e/
  fixture.ts                        # Midscene PlaywrightAiFixture (don't edit)
  <case-name>.spec.ts               # one spec per case — ADD HERE
  cases/<case-name>.json            # params for that spec — ADD HERE
playwright.config.ts                # Chromium, Midscene reporter, networkidle ignored
.env                                # DashScope Qwen creds; DO NOT commit
package.json                        # cross-env wraps NODE_OPTIONS / NODE_USE_ENV_PROXY / HTTPS_PROXY
```

## Run / report

```powershell
npm run test:headed -- <case-name>           # run one case in headed Chromium
npm run test -- <case-name>                  # CI mode
```

`cross-env` in npm scripts already wires:
- `NODE_OPTIONS=--use-system-ca` — trust Windows cert store (corp TLS intercept)
- `NODE_USE_ENV_PROXY=1` — make Node's global `fetch` honor `HTTPS_PROXY` (default-off in Node 22+)
- `HTTPS_PROXY=http://localhost:3128` — corporate proxy

**Never disable TLS verify** (`NODE_TLS_REJECT_UNAUTHORIZED=0` is blocked by harness, correctly).

Midscene auto-generates an HTML report under `midscene_run/report/*.html` per run — share that path with the user when reporting results.

## The 5 rules that took 6 failed runs to learn

### 1. Use Playwright DOM locators for form fields, NOT `aiInput`
SAP WebGUI emits clean ARIA labels. AI vision will sometimes type the Report date value into the Asset number field because the labels look visually similar in the screenshot. **Always** route field fills through this helper:

```ts
import type { Page } from '@playwright/test';

async function fillSapField(page: Page, label: string, value: string) {
  const candidates = [
    page.getByLabel(label, { exact: true }),
    page.getByLabel(label),
    page.getByRole('textbox', { name: label, exact: true }),
    page.getByRole('textbox', { name: label }),
  ];
  let lastErr: unknown = null;
  for (const loc of candidates) {
    try {
      const first = loc.first();
      await first.waitFor({ state: 'visible', timeout: 3000 });
      await first.scrollIntoViewIfNeeded();
      await first.click({ timeout: 2000 });
      await first.fill('');
      await first.fill(value);
      const got = await first.inputValue();
      if (got === value) return;
    } catch (e) { lastErr = e; }
  }
  throw new Error(`fillSapField("${label}") failed: ${(lastErr as Error)?.message ?? lastErr}`);
}
```

For SAP from-to range fields, `.first()` picks the "from" / single-value side — usually what the user means.

### 2. Wrap every `aiQuery` / `aiAssert` in `withRetry`
DashScope (and Poe earlier) drops sockets mid-vision-request. Midscene's built-in retry is 1 attempt — not enough.

```ts
async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      const msg = (e as Error)?.message ?? String(e);
      const isNetwork = /Connection error|fetch failed|other side closed|UND_ERR_SOCKET|ECONNRESET|ETIMEDOUT/i.test(msg);
      console.log(`[withRetry] ${label} attempt ${i}/${attempts} failed: ${msg}`);
      if (!isNetwork || i === attempts) throw e;
      await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
  throw lastErr;
}
```

### 3. Always dump the form before clicking Execute
This caught the date-into-Asset-number bug in one log line.

```ts
const dumpForm = async (label: string) => {
  const snap = await aiQuery<{ companyCode: string; assetNumber: string; reportDate: string; listAssetsChecked: boolean }>(
    '从当前查询界面读取已填字段值，返回 JSON: ' +
    '{ "companyCode": ..., "assetNumber": ..., "reportDate": ..., "listAssetsChecked": ... }',
  );
  console.log(`[FORM DUMP] ${label}:`, JSON.stringify(snap));
  return snap;
};
// then:
const snap = await dumpForm('before Execute');
expect(snap?.reportDate, 'Report date 未被正确填入').toContain('2026');
```

### 4. Dismiss SAP `Information` popups (fiscal year, etc.) before asserting on report content
Many SAP transactions show soft warnings on Execute. The popup has a `Continue` button — clicking it lets the report render.

```ts
const dismissInfoPopupIfAny = async () => {
  try {
    await ai(
      '如果当前页面有一个标题为 "Information" 的弹窗（或任何带 "Continue" 按钮的信息提示弹窗），' +
      '点击它底部的 "Continue" 按钮关闭弹窗。如果没有这样的弹窗，则什么都不做。',
    );
  } catch (e) { console.log('[POPUP] skipped:', (e as Error).message); }
  await page.waitForTimeout(1500);
};
```

### 5. SAP tree controls: single-click = SELECT, double-click = EXPAND
Step 1 (Menu → Settings → Interaction Design → Visualization) wasted 4 minutes because `aiTap('Interaction Design')` selected but didn't expand. Right wording:

```ts
await ai(
  '在 Settings 对话框左侧导航树中找到 "<Group Name>" 节点。' +
  '观察它前面的图标：如果是 ">" 形状的右指箭头说明该节点折叠中，需要双击文字使其展开；' +
  '如果是 "v" 形状的下指箭头则已展开，跳过展开操作。' +
  '请确保 "<Group Name>" 是展开状态。',
);
await aiTap('"<Child Name>" 子节点');
```

## Things the user will probably get wrong

| User says | Reality | What to do |
| --- | --- | --- |
| `31.04.2026` | April has 30 days. SAP will reject as date. | Flag the typo, use `30.04.2026`, tell user you corrected. |
| `Book val.l` | Trailing `l` is copy-paste tail of next char. | Use `Book val.` in extract prompts. |
| Any 2026 report date | May trigger `Fiscal year change not yet made for company code XXXX` if accounting hasn't rolled the year | The popup says Information, not Error — `dismissInfoPopupIfAny` clicks Continue. If report still fails after dismiss, ask user to pick a 2025 date. |

## Wide SAP reports: scroll horizontally before `aiQuery`

Reports like `S_ALR_87011990` (Asset History Sheet) are wider than the viewport (header says `13 col., wide version`). `Curr.bk.val.` sits at the far right and is invisible until you scroll.

```ts
await withRetry('scroll to Curr.bk.val.', () =>
  ai(
    '当前报表横向有多列且部分列被截断。请将报表区域水平滚动到最右端，直到能看到名为 "<column label>" 的列。' +
    '可通过：（1）拖动报表底部水平滚动条到最右；（2）反复点击滚动条右端箭头；（3）点击任一单元格然后按多次 End 键。',
  ),
);
```

## Number parsing — SAP locales

SAP often shows German format `1.234,56` (THB / EUR locales). Use this parser before comparing A1/A2 numerically:

```ts
function parseNumber(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,-]/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot   = cleaned.lastIndexOf('.');
  const normalized = lastComma > lastDot
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
```

Compare with `Math.abs(a-b) < 0.005`, not `===`.

## Spec template (copy this)

```ts
import { test, expect } from './fixture';
import type { Page } from '@playwright/test';
import params from './cases/<case-name>.json';

test.setTimeout(15 * 60 * 1000);   // SAP + Qwen is slow; budget generously

// ... paste fillSapField / withRetry / parseNumber / dumpForm / dismissInfoPopupIfAny helpers here ...

test('<case description>', async ({ page, ai, aiTap, aiInput, aiQuery, aiAssert }) => {
  await test.step('open SAP', async () => {
    await page.goto(params.sapUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
  });

  await test.step('navigate via TC', async () => {
    await aiInput(params.transactionCode, '左上角 TC / OK Code 输入框');
    await ai('按下回车键');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3500);
  });

  await test.step('fill form + execute', async () => {
    await fillSapField(page, 'Company code', params.query.companyCode);
    await fillSapField(page, 'Asset number', params.query.assetNumber);
    await fillSapField(page, 'Report date',  params.query.reportDate);
    if (params.query.listAssets) await ai('如果 "List assets" 未勾选则点击勾选');

    await dumpForm('before Execute');
    await aiTap('工具栏 Execute 按钮');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny();
  });

  // extract / assert / compare using withRetry-wrapped aiQuery
});
```

## Params file shape

```json
{
  "sapUrl": "https://mhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#",
  "transactionCode": "S_ALR_87011990",
  "favoritesEntry": "Asset Balances",
  "query": {
    "companyCode": "8540",
    "assetNumber": "1010001732",
    "reportDate": "30.04.2026",
    "listAssets": true
  },
  "extract": {
    "a1ColumnLabel": "Curr.bk.val.",
    "a2ColumnLabel": "Book val."
  }
}
```

## Timings to expect (Qwen3.6-plus via DashScope)

| Phase | Time |
| --- | --- |
| Step 1 (Settings → Visualization → Save) | 3–4 min |
| Step 2 (TC → form → execute → extract) | 4–6 min |
| Step 3 (back to Easy Access → Favorites → execute → extract) | 4–6 min |
| Full 3-step compare case | 10–13 min |

If a run takes <2 min and exits 1, it almost certainly broke before Step 2 — read `test-results/**/test-failed-1.png` first, then `error-context.md`.

## Model gotchas

| Model | Verdict | Why |
| --- | --- | --- |
| `gemini-3-flash` (via Poe) | DON'T USE | Returns `reasoning_content` only, `content` empty → Midscene parser misfires. Also Poe sockets drop on sustained vision sessions. |
| `qwen3.6-plus` (DashScope) | WORKS | Has vision despite name; returns proper `content`. Some socket drops handled by `withRetry`. |
| `gpt-4o`, `claude-sonnet-4-5` | Probably fine | Untested in this project. If user requests, just swap `.env`. |

## Reference: the case that drove this skill

[e2e/asset-balance-check.spec.ts](../../../e2e/asset-balance-check.spec.ts) — Compares `Curr.bk.val.` from `S_ALR_87011990` against `Book val.` from Favorites → Asset Balances for the same asset/date. Passing result: A1 = A2 = `130,09` (THB).
