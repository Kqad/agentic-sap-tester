import { test, expect } from './fixture';
import type { Page } from '@playwright/test';
import params from './cases/ap-reports-analytics.json' with { type: 'json' };

test.setTimeout(25 * 60 * 1000);

// SAP WebGUI 字段填充：用 Playwright accessibility label 定位（确定性），
// 再读回确认；若 label 匹配多个则取首个 (SAP 的 from-to 共享 label，首个即 from / 单值列)。
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
      if (got === value) return;
      console.log(`[fillSapField] "${label}" — typed "${value}" but read "${got}", trying next locator`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `fillSapField("${label}", "${value}") failed: ${(lastErr as Error)?.message ?? lastErr}`,
  );
}

// fillSapField 的可选版本：找不到字段时不抛错，便于跳过不存在的可选 filter
async function fillSapFieldOptional(page: Page, label: string, value: string): Promise<boolean> {
  try {
    await fillSapField(page, label, value);
    return true;
  } catch (e) {
    console.log(`[fillSapFieldOptional] "${label}" 不可用，跳过：${(e as Error).message?.split('\n')[0]}`);
    return false;
  }
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error)?.message ?? String(e);
      const isNetwork =
        /Connection error|fetch failed|other side closed|UND_ERR_SOCKET|ECONNRESET|ETIMEDOUT/i.test(msg);
      console.log(`[withRetry] ${label} attempt ${i}/${attempts} failed: ${msg}`);
      if (!isNetwork || i === attempts) throw e;
      await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
  throw lastErr;
}

test('SAP AP Reports & Analytics: FBL1H + FBL3H + S_ALR_87012103 + S_ALR_87012083', async ({
  page,
  ai,
  aiInput,
  aiTap,
  aiQuery,
  aiAssert,
}) => {
  // -------- 通用：Playwright 关闭 Information / System Messages 弹窗 --------
  const dismissInfoPopupIfAny = async () => {
    const continueBtn = page.getByRole('button', { name: /^Continue$/i }).first();
    const visible = await continueBtn.isVisible().catch(() => false);
    if (visible) {
      console.log('[POPUP] 点击 Continue 关闭弹窗');
      try {
        await continueBtn.click({ timeout: 3000 });
      } catch (e) {
        try { await continueBtn.click({ force: true, timeout: 3000 }); }
        catch (e2) { console.log('[POPUP] Continue click 失败:', (e2 as Error).message); }
      }
      await page.waitForTimeout(1500);
    }
  };

  // -------- 通用：进入指定 TC（首选顶部 combobox，回退 URL） --------
  const goToTransaction = async (tc: string) => {
    const tcBox = page.getByRole('combobox', { name: /Enter transaction code/i }).first();
    const hasTopCombobox = await tcBox.isVisible({ timeout: 1500 }).catch(() => false);

    if (hasTopCombobox) {
      console.log(`[goToTransaction] 用顶部 combobox 输入 TC=${tc}`);
      try {
        await tcBox.fill('', { timeout: 3000 });
        await tcBox.fill(tc, { timeout: 3000 });
      } catch (e) {
        if (/not editable|readonly/i.test((e as Error).message)) {
          await tcBox.focus();
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Delete');
          await page.keyboard.type(tc, { delay: 20 });
        } else {
          throw e;
        }
      }
      await tcBox.press('Enter');
    } else {
      // SAP Easy Access 首屏没有 combobox 时走 URL
      const cleanTc = tc.replace(/^\/n/, '');
      const base = params.sapUrl.replace(/#.*$/, '');
      const tcUrl = `${base}?~transaction=${encodeURIComponent(cleanTc)}`;
      console.log(`[goToTransaction] 顶部 combobox 不可见，走 URL：${tcUrl}`);
      await page.goto(tcUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2500);
    await dismissInfoPopupIfAny();
  };

  // -------- 通用：填一组 from-to 日期输入（按 title 属性匹配） --------
  const fillDateRangeByTitle = async (
    titleSubstring: string,
    fromValue: string,
    toValue: string | null,
  ) => {
    const boxes = page.locator(`input[title*="${titleSubstring}"]`);
    const count = await boxes.count();
    console.log(`[DateRange] title="${titleSubstring}" inputs:`, count);
    const typeInto = async (loc: ReturnType<typeof page.locator>, value: string, label: string) => {
      await loc.scrollIntoViewIfNeeded();
      await loc.click({ timeout: 3000 });
      await loc.focus();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.keyboard.type(value, { delay: 20 });
      await page.keyboard.press('Tab');
      const got = await loc.inputValue();
      console.log(`[DateRange] ${label} typed "${value}" got "${got}"`);
    };
    if (count >= 1) {
      await typeInto(boxes.nth(0), fromValue, `${titleSubstring} from`);
      if (toValue !== null && count >= 2) {
        await typeInto(boxes.nth(1), toValue, `${titleSubstring} to`);
      }
      return true;
    }
    return false;
  };

  // -------- 通用：点击 Execute（F8） --------
  const clickExecute = async () => {
    const candidates = [
      page.getByRole('button', { name: /^Execute$/i }),
      page.getByRole('button', { name: /Execute.*F8|F8.*Execute/i }),
      page.locator('[title*="Execute (F8)"]'),
      page.locator('[title="Execute"]'),
    ];
    for (const c of candidates) {
      const first = c.first();
      const visible = await first.isVisible().catch(() => false);
      if (visible) {
        try {
          await first.click({ timeout: 4000 });
          console.log('[clickExecute] clicked via locator');
          return;
        } catch (e) {
          try { await first.click({ force: true, timeout: 3000 }); console.log('[clickExecute] force click'); return; }
          catch { /* try next */ }
        }
      }
    }
    console.log('[clickExecute] 没找到 Execute 按钮，使用 F8 快捷键');
    await page.keyboard.press('F8');
  };

  // -------- 通用：判断是否进入了报表结果页（非选择屏） --------
  // 启发：选择屏有 Execute 按钮且没有"Back"按钮在主工具栏中；结果页通常有 Back/Exit。
  // 更鲁棒的方式：检查页面是否包含表格数据（grid rows）或典型结果页按钮。
  const onReportResult = async (timeoutMs = 8000): Promise<{ ok: boolean; reason: string }> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // 1. Drilldown 按钮（FBL1H/FBL3H 等浏览器报表特征）
      const drilldown = page.getByRole('button', { name: /^Drilldown$/i }).first();
      if (await drilldown.isVisible().catch(() => false)) {
        return { ok: true, reason: 'Drilldown button visible' };
      }
      // 2. ALV 表头或 columnheader
      const colHeaders = await page.getByRole('columnheader').count().catch(() => 0);
      if (colHeaders >= 3) {
        return { ok: true, reason: `${colHeaders} columnheaders visible` };
      }
      // 3. 经典 ALR 报表：标题区或结果区出现 "List of Vendor" 字样且无 Execute
      const executeStillVisible = await page
        .getByRole('button', { name: /^Execute$/i })
        .first()
        .isVisible()
        .catch(() => false);
      if (!executeStillVisible) {
        // Execute 不在了，多半已经跳走
        const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 4000);
        if (/List of Vendor|Vendor Line Items|Open Items|Posting Date|Document Number|Account|Amount/i.test(bodyText)) {
          return { ok: true, reason: 'Execute gone & report-like content visible' };
        }
      }
      await page.waitForTimeout(500);
    }
    return { ok: false, reason: 'timed out waiting for report-result indicators' };
  };

  // -------- 通用：执行一个 AP 报表步骤 --------
  // 返回一个 best-effort 摘要供测试结尾打印
  const runReportStep = async (
    stepLabel: string,
    tc: string,
    fillForm: () => Promise<void>,
  ): Promise<{ label: string; ok: boolean; reason: string }> => {
    await goToTransaction('/n' + tc);
    await page.waitForTimeout(1500);

    // 进入 TC 后可能还有 Continue 弹窗
    await dismissInfoPopupIfAny();

    await fillForm();
    await page.waitForTimeout(500);

    await clickExecute();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2000);

    const res = await onReportResult(10_000);
    console.log(`[${stepLabel}] onReportResult:`, res);
    return { label: stepLabel, ok: res.ok, reason: res.reason };
  };

  // -------- 通用：在 ALR 选择屏点击某个 radio（"All items" / "Open items at key date" 等） --------
  const clickRadioIfPresent = async (name: RegExp): Promise<boolean> => {
    const radio = page.getByRole('radio', { name }).first();
    const visible = await radio.isVisible().catch(() => false);
    if (!visible) return false;
    const checked = await radio.isChecked().catch(() => false);
    if (checked) {
      console.log(`[Radio ${name}] already checked`);
      return true;
    }
    try { await radio.click({ timeout: 3000 }); }
    catch { await radio.click({ force: true, timeout: 3000 }); }
    await page.waitForTimeout(500);
    return true;
  };

  // -------- 用例执行 --------
  const results: { label: string; ok: boolean; reason: string }[] = [];

  await test.step('打开 SAP WebGUI 首页', async () => {
    await page.goto(params.sapUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
    await dismissInfoPopupIfAny();
  });

  await test.step('Step 1: FBL1H — Vendor Line Item Browser', async () => {
    const r = await runReportStep('Step 1 FBL1H', params.transactionCodes.fbl1h, async () => {
      await fillSapField(page, 'Company Code', params.filters.companyCode);
      // FBL1H 的 supplier 字段在不同 release 上叫 "Supplier" / "Vendor" / "Vendor Account"
      const supplierFilled =
        (await fillSapFieldOptional(page, 'Supplier', params.filters.supplierWildcard)) ||
        (await fillSapFieldOptional(page, 'Vendor', params.filters.supplierWildcard)) ||
        (await fillSapFieldOptional(page, 'Vendor Account', params.filters.supplierWildcard));
      console.log('[Step 1] supplier filled?', supplierFilled);
      // Posting date 范围（避免 * 全量扫描，限定一个时间窗以加快执行）
      await fillDateRangeByTitle('Posting Date', params.filters.postingDateFrom, params.filters.postingDateTo);
    });
    results.push(r);
    expect(r.ok, `[Step 1 FBL1H] 报表未渲染：${r.reason}`).toBe(true);
  });

  await test.step('Step 2: FBL3H — G/L Account Line Item Browser', async () => {
    const r = await runReportStep('Step 2 FBL3H', params.transactionCodes.fbl3h, async () => {
      await fillSapField(page, 'Company Code', params.filters.companyCode);
      // FBL3H 是 G/L 浏览器；测试用例文本错写 "Supplier *"，实际应填 G/L 账户
      await fillSapField(page, 'G/L Account', params.filters.glAccount);
      await fillDateRangeByTitle('Posting Date', params.filters.postingDateFrom, params.filters.postingDateTo);
    });
    results.push(r);
    expect(r.ok, `[Step 2 FBL3H] 报表未渲染：${r.reason}`).toBe(true);
  });

  await test.step('Step 3: Fiori Aging Analysis (F1733) — 不适用 SAP WebGUI 平台，跳过', async () => {
    console.log('[Step 3] Fiori App F1733 (Aging Analysis) 不能在 WebGUI 中运行，按测试用例说明跳过');
    results.push({
      label: 'Step 3 F1733 Aging (Fiori)',
      ok: true,
      reason: 'SKIPPED — Fiori only, not applicable to SAP WebGUI per test case note',
    });
  });

  await test.step('Step 4: S_ALR_87012103 — List of Vendor Line Items', async () => {
    const r = await runReportStep('Step 4 S_ALR_87012103', params.transactionCodes.alrVendorLineItems, async () => {
      // Vendor account = *（同义字段尝试多个标签）
      const vendorFilled =
        (await fillSapFieldOptional(page, 'Vendor account', params.filters.vendorWildcard)) ||
        (await fillSapFieldOptional(page, 'Vendor Account', params.filters.vendorWildcard)) ||
        (await fillSapFieldOptional(page, 'Vendor', params.filters.vendorWildcard)) ||
        (await fillSapFieldOptional(page, 'Supplier', params.filters.vendorWildcard));
      console.log('[Step 4] vendor filled?', vendorFilled);
      await fillSapField(page, 'Company code', params.filters.companyCode);
      // "All items" 单选（List of Vendor Line Items 默认有三选一）
      const allItemsClicked = await clickRadioIfPresent(/^All items$/i);
      console.log('[Step 4] All items radio clicked?', allItemsClicked);
      // Posting date 范围
      await fillDateRangeByTitle('Posting Date', params.filters.postingDateFrom, params.filters.postingDateTo);
    });
    results.push(r);
    expect(r.ok, `[Step 4 S_ALR_87012103] 报表未渲染：${r.reason}`).toBe(true);
  });

  await test.step('Step 5: S_ALR_87012083 — List of Vendor Open Items', async () => {
    const r = await runReportStep('Step 5 S_ALR_87012083', params.transactionCodes.alrVendorOpenItems, async () => {
      const vendorFilled =
        (await fillSapFieldOptional(page, 'Vendor account', params.filters.vendorWildcard)) ||
        (await fillSapFieldOptional(page, 'Vendor Account', params.filters.vendorWildcard)) ||
        (await fillSapFieldOptional(page, 'Vendor', params.filters.vendorWildcard)) ||
        (await fillSapFieldOptional(page, 'Supplier', params.filters.vendorWildcard));
      console.log('[Step 5] vendor filled?', vendorFilled);
      await fillSapField(page, 'Company code', params.filters.companyCode);
      // 默认 "Open items" / "Open at key date" — 显式确认
      await clickRadioIfPresent(/Open items at key date|Open at key date|Open items/i);
      // Key date = today
      const keyDateFilled =
        (await fillSapFieldOptional(page, 'Open at key date', params.filters.openKeyDate)) ||
        (await fillSapFieldOptional(page, 'Key date', params.filters.openKeyDate)) ||
        (await fillDateRangeByTitle('Open at Key Date', params.filters.openKeyDate, null)) ||
        (await fillDateRangeByTitle('Key date', params.filters.openKeyDate, null));
      console.log('[Step 5] key date filled?', keyDateFilled);
    });
    results.push(r);
    expect(r.ok, `[Step 5 S_ALR_87012083] 报表未渲染：${r.reason}`).toBe(true);
  });

  await test.step('TEST RESULT', async () => {
    console.log('========== AP Reports & Analytics — RESULT ==========');
    for (const r of results) {
      console.log(`  ${r.ok ? 'PASS' : 'FAIL'} — ${r.label}: ${r.reason}`);
    }
    console.log('=====================================================');
    // Excel 下载验证：本自动化未覆盖（SAP "Export → Spreadsheet" 菜单跨 release 极其脆弱，
    // 浏览器还要拦截 download dialog）。手工测试时按测试用例核对即可。
    console.log('NOTE: "Download to Excel" 校验本脚本未覆盖（需要手工核对，或单独编写下载拦截）。');
  });
});
