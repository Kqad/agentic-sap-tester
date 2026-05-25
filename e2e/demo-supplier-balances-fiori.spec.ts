// DEMO Test 4 — BP_IT_B2P_FIORI_Report Supplier Balances and Line Items (Row 6/7)
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable Show OK Code, Save
//       TC = FBL1N, Execute, company code 8540, Execute, 滚到最底, 读最底 local crcy → A2
//   2.  回主页 → Menu → Settings → Visualization → enable Show OK Code, Save
//       TC = /n/UI2/FLP, Execute → Fiori Launchpad
//   3.  Add apps → 搜 "Manage Supplier Line Items" → 等 4 秒 → 打开第一个
//       Company code 8540, Execute
//   4.  滚到最底, 读最底 local crcy → A1
//   5.  A1 == A2 → PASS
//
// 移植自 SAP TEST DEMO 5.21/SAP test 4 自然语言+JS.txt。

import { test, expect } from './fixture';
import params from './cases/demo-supplier-balances-fiori.json' with { type: 'json' };
import {
  fillSapField,
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  clickExecute,
  openSap,
} from './lib/sap-helpers.js';

test.setTimeout(20 * 60 * 1000);

function parseNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/[^\d.,-]/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot   = s.lastIndexOf('.');
  const normalized = lastComma > lastDot
    ? s.replace(/\./g, '').replace(',', '.')
    : s.replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

test('DEMO 4 · FBL1N local crcy == Fiori Manage Supplier Line Items local crcy', async ({
  page, ai, aiTap, aiInput, aiQuery, aiAssert,
}) => {
  let a1: string | null = null;
  let a2: string | null = null;

  const enableShowOkCode = async () => {
    await aiTap('SAP WebGUI 左上角的 "Menu" 按钮');
    await page.waitForTimeout(800);
    await aiTap('刚弹出菜单中的 "Settings..." 菜单项');
    await page.waitForTimeout(2500);
    await ai('在 Settings 左侧导航树确保 "Interaction Design" 展开，然后点击 "Visualization"');
    await page.waitForTimeout(1200);
    await ai('在 Visualization 面板中找到 "Show OK Code field" 开关并启用它');
    await aiTap('Settings 对话框底部的 "Save" 按钮');
    await page.waitForTimeout(2500);
  };

  await test.step('打开 SAP WebGUI 首页', async () => {
    await openSap(page, params.sapUrl);
  });

  await test.step('Step 1: FBL1N → company 8540 → Execute → 滚到底，读 A2', async () => {
    await enableShowOkCode();
    await goToTransaction(page, params.transactionCodes.fbl1n, params.sapUrl);
    await fillSapField(page, 'Company Code', params.query.companyCode)
      .catch(() => fillSapField(page, 'Company code', params.query.companyCode));
    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);
    await dismissInfoPopupIfAny(page);

    await withRetry('滚到 FBL1N 报表最底端', () =>
      ai(
        '当前是 FBL1N vendor line items 报表结果。请把表格纵向滚动到最底端，'
        + '直到能看到底部的合计/小计行（含 "Local Crcy" / "Local currency" 等列的总计值）。'
        + '可以拖动右侧纵向滚动条到最底，或鼠标在表格内多次按 Page Down / End。',
      ),
    );
    await page.waitForTimeout(1500);

    const r = await withRetry<{ localCrcyTotal: string }>('aiQuery FBL1N total', () =>
      aiQuery<{ localCrcyTotal: string }>(
        '从当前 FBL1N 报表的合计/小计行（位于表格最底部）中找到 "Local Crcy" / "Local Currency" 列的总计金额，'
        + '返回 JSON: { "localCrcyTotal": <字符串原文，保留千分位和小数> }',
      ),
    );
    a2 = r?.localCrcyTotal ?? null;
    console.log('A2 (FBL1N local crcy total) =', a2);
    expect(a2, 'A2 不应为空').toBeTruthy();
  });

  await test.step('Step 2: 回主页 → 进 Fiori Launchpad /n/UI2/FLP', async () => {
    await goToTransaction(page, '/n', params.sapUrl);
    await enableShowOkCode();
    await goToTransaction(page, params.transactionCodes.fiori, params.sapUrl);
    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step(`Step 3: Add apps → 搜 ${params.fioriApp} → 打开第一个`, async () => {
    await withRetry('点击 Add apps 入口', () =>
      ai('在 Fiori Launchpad 主屏中找到 "Add apps" / "App Finder" / "+" 按钮并点击，进入应用查找器'),
    );
    await page.waitForTimeout(2500);
    await aiInput(params.fioriApp, 'App Finder 顶部的搜索框');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
    await aiTap(`搜索结果列表中第一张标题为 "${params.fioriApp}" 的应用卡片`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step('Step 4: company code 8540 → Execute → 滚到底，读 A1', async () => {
    await fillSapField(page, 'Company Code', params.query.companyCode)
      .catch(() => fillSapField(page, 'Company code', params.query.companyCode))
      .catch(async () => {
        await aiInput(params.query.companyCode, 'Manage Supplier Line Items 应用筛选区的 "Company Code" 输入框');
      });
    await clickExecute(page).catch(async () => {
      await aiTap('Fiori 应用界面右上角或筛选条上的 "Go" / "Execute" 按钮');
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(7000);

    await withRetry('Fiori 表格滚到最底', () =>
      ai(
        '当前是 Fiori Manage Supplier Line Items 应用的数据表。'
        + '将表格内容滚动到最底端，直到能看到底部合计行（"Local Crcy" 列的总计）。',
      ),
    );
    await page.waitForTimeout(1500);

    const r = await withRetry<{ localCrcyTotal: string }>('aiQuery Fiori total', () =>
      aiQuery<{ localCrcyTotal: string }>(
        '从 Fiori Manage Supplier Line Items 应用的合计行（表格最底部）中读取 "Local Crcy" 列的总计金额，'
        + '返回 JSON: { "localCrcyTotal": <字符串原文> }',
      ),
    );
    a1 = r?.localCrcyTotal ?? null;
    console.log('A1 (Fiori local crcy total) =', a1);
    expect(a1, 'A1 不应为空').toBeTruthy();
  });

  await test.step('Step 5: 比较 A1 == A2', async () => {
    const a1n = parseNumber(a1);
    const a2n = parseNumber(a2);
    const equal = a1n !== null && a2n !== null && Math.abs(a1n - a2n) < 0.005;

    console.log('========== DEMO 4 RESULT ==========');
    console.log(`A1 (Fiori) raw="${a1}" parsed=${a1n}`);
    console.log(`A2 (FBL1N) raw="${a2}" parsed=${a2n}`);
    console.log(`A1 == A2 ? ${equal ? 'YES — PASS' : 'NO — FAIL'}`);
    console.log('===================================');

    expect(equal, `A1 (${a1}) != A2 (${a2})`).toBe(true);
  });
});
