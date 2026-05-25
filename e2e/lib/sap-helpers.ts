// Shared helpers for the SAP WebGUI demo specs (e2e/demo-*.spec.ts).
//
// The platform's static spec parser (server/lib/spec-steps.js) recognizes
// these helper names by identifier — `fillSapField`, `dismissInfoPopupIfAny`,
// `withRetry` — so keep names stable.

import type { Page } from '@playwright/test';

// ---------- Field fill ----------
// Resolve by accessibility label first, falling back to role=textbox/combobox.
// If SAP marks the field readonly, fall back to keyboard typing.
export async function fillSapField(page: Page, label: string, value: string): Promise<void> {
  const candidates = [
    page.getByLabel(label, { exact: true }),
    page.getByLabel(label),
    page.getByRole('textbox', { name: label, exact: true }),
    page.getByRole('textbox', { name: label }),
    page.getByRole('combobox', { name: label, exact: true }),
    page.getByRole('combobox', { name: label }),
  ];

  let lastErr: unknown = null;
  for (const loc of candidates) {
    try {
      const first = loc.first();
      await first.waitFor({ state: 'visible', timeout: 3000 });
      await first.scrollIntoViewIfNeeded();
      await first.click({ timeout: 2000 });
      try {
        await first.fill('', { timeout: 2000 });
        await first.fill(value, { timeout: 2000 });
      } catch (fillErr) {
        const msg = (fillErr as Error)?.message ?? '';
        if (/not editable|readonly/i.test(msg)) {
          await first.focus();
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Delete');
          await page.keyboard.type(value, { delay: 20 });
        } else {
          throw fillErr;
        }
      }
      const got = await first.inputValue();
      if (got === value || got.trim() === value.trim()) return;
      console.log(`[fillSapField] "${label}" — typed "${value}" but read "${got}", trying next locator`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `fillSapField("${label}", "${value}") failed: ${(lastErr as Error)?.message ?? lastErr}`,
  );
}

export async function fillSapFieldOptional(page: Page, label: string, value: string): Promise<boolean> {
  try { await fillSapField(page, label, value); return true; }
  catch (e) {
    console.log(`[fillSapFieldOptional] "${label}" skipped: ${(e as Error).message?.split('\n')[0]}`);
    return false;
  }
}

// ---------- Popups ----------
export async function dismissInfoPopupIfAny(page: Page): Promise<void> {
  const continueBtn = page.getByRole('button', { name: /^Continue$/i }).first();
  const visible = await continueBtn.isVisible({ timeout: 1500 }).catch(() => false);
  if (visible) {
    console.log('[POPUP] Continue 关闭弹窗');
    try { await continueBtn.click({ timeout: 3000 }); }
    catch {
      try { await continueBtn.click({ force: true, timeout: 3000 }); }
      catch (e) { console.log('[POPUP] Continue click 失败:', (e as Error).message); }
    }
    await page.waitForTimeout(1500);
  }
}

// ---------- Retry ----------
export async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) {
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

// ---------- Transaction navigation ----------
// Try the top-bar combobox first; fall back to ?~transaction=… URL when the
// Easy Access toolbar has no TC box.
export async function goToTransaction(page: Page, tc: string, sapUrl: string): Promise<void> {
  const tcBox = page.getByRole('combobox', { name: /Enter transaction code/i }).first();
  const hasTopCombobox = await tcBox.isVisible({ timeout: 1500 }).catch(() => false);

  if (hasTopCombobox) {
    console.log(`[goToTransaction] combobox TC=${tc}`);
    try {
      await tcBox.fill('', { timeout: 3000 });
      await tcBox.fill(tc, { timeout: 3000 });
    } catch (e) {
      if (/not editable|readonly/i.test((e as Error).message)) {
        await tcBox.focus();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.keyboard.type(tc, { delay: 20 });
      } else { throw e; }
    }
    await tcBox.press('Enter');
  } else {
    const cleanTc = tc.replace(/^\/n/, '');
    const base = sapUrl.replace(/#.*$/, '');
    const tcUrl = `${base}?~transaction=${encodeURIComponent(cleanTc)}`;
    console.log(`[goToTransaction] URL=${tcUrl}`);
    await page.goto(tcUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
  await dismissInfoPopupIfAny(page);
}

// ---------- Execute (F8) ----------
export async function clickExecute(page: Page): Promise<void> {
  const candidates = [
    page.getByRole('button', { name: /^Execute$/i }),
    page.getByRole('button', { name: /Execute.*F8|F8.*Execute/i }),
    page.locator('[title*="Execute (F8)"]'),
    page.locator('[title="Execute"]'),
  ];
  for (const c of candidates) {
    const first = c.first();
    if (await first.isVisible().catch(() => false)) {
      try { await first.click({ timeout: 4000 }); return; }
      catch {
        try { await first.click({ force: true, timeout: 3000 }); return; }
        catch { /* try next */ }
      }
    }
  }
  console.log('[clickExecute] 没找到 Execute 按钮，使用 F8');
  await page.keyboard.press('F8');
}

// ---------- Open SAP and dismiss System Messages ----------
export async function openSap(page: Page, sapUrl: string): Promise<void> {
  await page.goto(sapUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  await dismissInfoPopupIfAny(page);
}

// ---------- Status bar ----------
export async function readStatusBar(page: Page): Promise<string> {
  const texts = await page
    .locator(
      '[role="status"], .lsMessageBar, .urMsgText, [class*="MessageArea"], '
      + '[class*="MessageBar"], [class*="msgText"], .lsMessage',
    )
    .allTextContents()
    .catch(() => [] as string[]);
  return texts.map(t => t.trim()).filter(Boolean).join(' | ').trim();
}
