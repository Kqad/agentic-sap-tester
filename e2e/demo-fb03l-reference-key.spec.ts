// DEMO Test 8 — PSL_CT_B2P_PE_GUI_FI line item reports additional fields (Row 12)
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable Show OK Code, Save
//       TC = FB03L, Execute
//   2.  Fiscal year 2026, Company code 8540, Document number 1700000299, Continue
//   3.  点 change layout 图标 (xpath=//*[@id="_MB_VARIANT117"])
//   4.  右侧 Column Set 搜 "Reference Key" → OK → × → 向左箭头
//       → 选 "Reference Key 2" → 向左箭头 → 对勾 Adopt
//   5.  报表滚到最右，能同时看到 Reference Key 1 + 2 → PASS
//
// 移植自 SAP TEST DEMO 5.21/SAP test 8 自然语言+JS.txt。

import { test, expect } from './fixture';
import params from './cases/demo-fb03l-reference-key.json' with { type: 'json' };
import {
  fillSapField,
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  openSap,
} from './lib/sap-helpers.js';

test.setTimeout(20 * 60 * 1000);

test('DEMO 8 · FB03L change layout add Reference Key 1 + 2', async ({
  page, ai, aiTap, aiAssert,
}) => {
  await test.step('打开 SAP WebGUI 首页', async () => {
    await openSap(page, params.sapUrl);
  });

  await test.step('Step 1: Settings → Visualization → enable Show OK Code field', async () => {
    await aiTap('SAP WebGUI 左上角的 "Menu" 按钮');
    await page.waitForTimeout(800);
    await aiTap('刚弹出菜单中的 "Settings..." 菜单项');
    await page.waitForTimeout(2500);
    await ai('在 Settings 左侧导航树确保 "Interaction Design" 展开，然后点击 "Visualization"');
    await page.waitForTimeout(1200);
    await ai('在 Visualization 面板中找到 "Show OK Code field" 开关并启用它');
    await aiTap('Settings 对话框底部的 "Save" 按钮');
    await page.waitForTimeout(2500);
  });

  await test.step('Step 2: TC FB03L → 填 Year/CoCd/Doc → Continue (Enter)', async () => {
    await goToTransaction(page, params.transactionCode, params.sapUrl);

    await fillSapField(page, 'Fiscal Year',    params.filter.fiscalYear);
    await fillSapField(page, 'Company Code',   params.filter.companyCode);
    await fillSapField(page, 'Document Number', params.filter.documentNumber);

    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step('Step 3: 打开 Change Layout 对话框', async () => {
    // 原 DEMO 给的 xpath=//*[@id="_MB_VARIANT117"] 跨 release 不稳，优先 role=button
    const layoutBtn = page.getByRole('button', { name: /^Change Layout/i }).first();
    const found = await layoutBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (found) {
      try { await layoutBtn.click({ timeout: 3000 }); }
      catch { await layoutBtn.click({ force: true, timeout: 3000 }); }
    } else {
      console.log('[DEMO 8] role=Change Layout 未命中，使用原始 xpath 兜底');
      const xp = page.locator('xpath=//*[@id="_MB_VARIANT117"]').first();
      try { await xp.click({ timeout: 3000 }); }
      catch { await xp.click({ force: true, timeout: 3000 }); }
    }
    await page.waitForTimeout(3000);
  });

  await test.step('Step 4: Column Set 把 Reference Key 1 + 2 移到 Displayed → Adopt', async () => {
    for (const field of params.layoutFields) {
      await withRetry(`移动 "${field}" 到 Displayed Columns`, () =>
        ai(
          `当前已打开 "Change Layout" 对话框。请完成以下步骤把 "${field}" 加入 layout：`
          + `(1) 在对话框右侧 "Column Set" 面板工具栏点 "Find..." / 放大镜按钮；`
          + `(2) 在弹出的搜索框中输入 "${field}"；`
          + `(3) 按 Enter / 点 OK 让列表定位到 "${field}"；`
          + `(4) 点击 "×" / 按 Escape 关闭搜索小窗；`
          + `(5) 确保 "${field}" 在右侧 Column Set 列表中被选中（高亮）；`
          + `(6) 点击两个面板之间"向左指"的箭头按钮（tooltip "Show selected fields (F5)"），`
          + `把它移到左侧 Displayed Columns。`,
        ),
      );
      await page.waitForTimeout(1000);
    }

    // Adopt
    const adoptBtn = page.getByRole('button', { name: /^Adopt$|^Copy$|^Tick$/ }).first();
    if (await adoptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      try { await adoptBtn.click({ timeout: 3000 }); }
      catch { await adoptBtn.click({ force: true, timeout: 3000 }); }
    } else {
      await ai('点击 "Change Layout" 对话框底部的 "Adopt" 或绿色对勾按钮，应用 layout 改动');
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
  });

  await test.step('Step 5: 报表滚到最右，断言 Reference Key 1 + 2 同时可见', async () => {
    await withRetry('报表滚到最右', () =>
      ai(
        '当前是 FB03L 文档行项目报表。请把报表区域水平滚动到最右端，'
        + '可以拖动底部水平滚动条到最右，或反复点击右端的箭头按钮。',
      ),
    );
    await page.waitForTimeout(1500);

    // DOM 命中：columnheader 含 Reference Key 1 / Ref.key 1 等同义词
    const checkField = async (field: string): Promise<boolean> => {
      // 接受 "Reference Key 1" / "Ref.key 1" / "Ref. Key 1" 等
      const idx = field.match(/\d+$/)?.[0] ?? '';
      const pattern = new RegExp(`(Reference\\s*Key|Ref\\.?\\s*key|Ref\\.?\\s*Key)\\s*${idx}\\b`, 'i');
      const c1 = await page.getByRole('columnheader', { name: pattern }).count().catch(() => 0);
      if (c1 > 0) return true;
      const c2 = await page.locator(`[role="columnheader"]`).filter({ hasText: pattern }).count().catch(() => 0);
      return c2 > 0;
    };

    const found1 = await checkField(params.layoutFields[0]);
    const found2 = await checkField(params.layoutFields[1]);
    console.log(`[DEMO 8] DOM 命中：${params.layoutFields[0]}=${found1}, ${params.layoutFields[1]}=${found2}`);

    if (!(found1 && found2)) {
      await aiAssert(
        `当前 FB03L 报表表头中能同时看到 "${params.layoutFields[0]}" 列和 "${params.layoutFields[1]}" 列`
        + `（SAP 常用同义词 "Ref.key 1" / "Ref.key 2" 也算）`,
      );
    }
    expect(true).toBe(true);
  });
});
