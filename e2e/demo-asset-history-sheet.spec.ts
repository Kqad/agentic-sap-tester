// DEMO Test 1 — BP_IT_B2P_GUI_Report Asset HistorySheet (Row 2/3)
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable "Show OK Code field", Save
//   2.  TC = S_ALR_87011990, Execute
//   3.  Company code 8540, Asset number 1010001732
//   4.  跳出栏目第一个
//   5.  Report date = 上月末（这里固定为 30.04.2026），勾选 List assets, Execute
//   6.  滚到最右，读 Curr.bk.val. 列 → A1
//   7.  回 SAP 主页 → Favorites/Asset Balances → Execute
//   8-11. 同样输入，读第一行 Book val. → A2
//   12. A1 == A2 → PASS
//
// 移植自 SAP TEST DEMO 5.21/SAP test 1 自然语言+JS.txt。

import { test, expect } from './fixture';
import params from './cases/demo-asset-history-sheet.json' with { type: 'json' };
import {
  fillSapField,
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  clickExecute,
  openSap,
} from './lib/sap-helpers.js';

test.setTimeout(15 * 60 * 1000);

function parseNumber(raw: string | null | undefined): number | null {
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

test('DEMO 1 · Asset History Sheet (Curr.bk.val.) == Asset Balances (Book val.)', async ({
  page, ai, aiTap, aiQuery, aiAssert,
}) => {
  let a1Raw: string | null = null;
  let a2Raw: string | null = null;

  await test.step('打开 SAP WebGUI 首页', async () => {
    await openSap(page, params.sapUrl);
  });

  await test.step('Step 1: Settings → Visualization → enable Show OK Code field', async () => {
    await aiTap('SAP WebGUI 左上角的 "Menu" 按钮');
    await page.waitForTimeout(800);
    await aiTap('刚弹出菜单中的 "Settings..." 菜单项');
    await page.waitForTimeout(2500);

    await ai(
      '在 Settings 对话框左侧导航树中确保 "Interaction Design" 展开（如果是 ">" 折叠状态请双击它），'
      + '展开后点击其下方的 "Visualization" 子节点',
    );
    await page.waitForTimeout(1200);

    await ai(
      '在 Visualization 设置面板中找到 "Show OK Code field" 开关，如果当前关闭则点击使其开启',
    );
    await page.waitForTimeout(500);
    await aiTap('Settings 对话框底部的 "Save" 按钮');
    await page.waitForTimeout(2500);
  });

  await test.step('Step 2: TC S_ALR_87011990 → Asset History Sheet, 提取 A1', async () => {
    await goToTransaction(page, params.transactionCode, params.sapUrl);

    await fillSapField(page, 'Company code', params.query.companyCode);
    await fillSapField(page, 'Asset number', params.query.assetNumber);
    await fillSapField(page, 'Report date',  params.query.reportDate);

    if (params.query.listAssets) {
      await ai('如果标签为 "List assets" 的复选框/单选未选中，则点击它使其选中');
    }

    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny(page);

    await withRetry('滚到 Curr.bk.val. 列', () =>
      ai(
        '当前是 Asset History Sheet 报表。请将报表区域水平滚动到最右端，'
        + '直到能看到名为 "Curr.bk.val." 的列。可以拖动底部水平滚动条到最右，'
        + '或反复点击右端的箭头按钮，或点击表格后多次按 End 键。',
      ),
    );
    await page.waitForTimeout(1200);

    const a1 = await withRetry<{ currBkVal: string }>('aiQuery A1', () =>
      aiQuery<{ currBkVal: string }>(
        `从当前 Asset History Sheet 报表中找到 "${params.extract.a1ColumnLabel}" 列，`
        + `定位到资产编号 ${params.query.assetNumber} 对应的行（若只有合计行则取合计行），`
        + `提取单元格文本，返回 JSON: { "currBkVal": <字符串> }`,
      ),
    );
    a1Raw = a1?.currBkVal ?? null;
    console.log('A1 (Curr.bk.val.) =', a1Raw);
    expect(a1Raw, 'A1 不应为空').toBeTruthy();
  });

  await test.step('Step 3: 回主页 → Favorites/Asset Balances，提取 A2', async () => {
    await goToTransaction(page, '/n', params.sapUrl);

    await ai(
      '在主页左侧菜单树中找到 "Favorites" 文件夹，如果折叠就展开，'
      + `然后双击其下名为 "${params.favoritesEntry}" 的条目以打开该报表`,
    );
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3500);

    await fillSapField(page, 'Company code', params.query.companyCode);
    await fillSapField(page, 'Asset number', params.query.assetNumber);
    await fillSapField(page, 'Report date',  params.query.reportDate);

    if (params.query.listAssets) {
      await ai('如果标签为 "List assets" 的复选框/单选未选中，则点击它使其选中');
    }

    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny(page);

    await withRetry('滚到 Book val. 列', () =>
      ai(
        `当前是 Asset Balances 报表结果。请确保 "${params.extract.a2ColumnLabel}" 列可见，`
        + `若不在视区右侧，请向右滚动报表区域直到该列可见。`,
      ),
    );
    await page.waitForTimeout(1200);

    const a2 = await withRetry<{ bookVal: string }>('aiQuery A2', () =>
      aiQuery<{ bookVal: string }>(
        `从当前 Asset Balances 报表结果表格中取第一条数据行（不含表头/合计行），`
        + `提取 "${params.extract.a2ColumnLabel}" 列的单元格文本，`
        + `返回 JSON: { "bookVal": <字符串> }`,
      ),
    );
    a2Raw = a2?.bookVal ?? null;
    console.log('A2 (Book val.) =', a2Raw);
    expect(a2Raw, 'A2 不应为空').toBeTruthy();
  });

  await test.step('Step 4: 比较 A1 == A2', async () => {
    const a1Num = parseNumber(a1Raw);
    const a2Num = parseNumber(a2Raw);
    const equal = a1Num !== null && a2Num !== null && Math.abs(a1Num - a2Num) < 0.005;

    console.log('========== DEMO 1 RESULT ==========');
    console.log(`A1 (Curr.bk.val.) raw="${a1Raw}" parsed=${a1Num}`);
    console.log(`A2 (Book val.)    raw="${a2Raw}" parsed=${a2Num}`);
    console.log(`A1 == A2 ? ${equal ? 'YES — PASS' : 'NO — FAIL'}`);
    console.log('===================================');

    expect(equal, `A1 (${a1Raw}) 与 A2 (${a2Raw}) 不相等`).toBe(true);
  });
});
