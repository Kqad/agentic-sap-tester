// DEMO Test 6 — PSL_CT_B2P_PE_GUI_FI line item reports additional fields (Row 10)
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable Show OK Code, Save
//       TC = FAGLL03H, Execute
//   2.  Company code 8540, "All items"
//       Posting date 01.12.2025–31.12.2025, Execute, 等 4s
//   3.  点工具栏 change layout 图标 (xpath=//*[@id="C185_toolbar_btn10"])，等 2s
//   4.  Column set 下面的搜索框 → 输 "operational division" → OK → ×
//       → 向左箭头 (Show selected fields) → Adopt → 等 6s
//   5.  滚到最右，能看到 "oper. div." 列 → PASS
//
// 移植自 SAP TEST DEMO 5.21/SAP test 6 自然语言+JS.txt。

import { test, expect } from './fixture';
import params from './cases/demo-fagl-oper-division.json' with { type: 'json' };
import {
  fillSapField,
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  clickExecute,
  openSap,
} from './lib/sap-helpers.js';

test.setTimeout(20 * 60 * 1000);

test('DEMO 6 · FAGLL03H change layout add Operational Division column', async ({
  page, ai, aiTap, aiInput, aiAssert,
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

  await test.step('Step 2: FAGLL03H → 填查询条件 → Execute', async () => {
    await goToTransaction(page, params.transactionCode, params.sapUrl);
    await fillSapField(page, 'Company Code', params.filter.companyCode);

    if (params.filter.allItems) {
      const allItems = page.getByRole('radio', { name: /^All Items$/i }).first();
      const checked = await allItems.isChecked().catch(() => false);
      if (!checked) {
        try { await allItems.click({ timeout: 3000 }); }
        catch { await allItems.click({ force: true, timeout: 3000 }); }
        await page.waitForTimeout(500);
      }
    }

    // Posting Date 双 input（title 属性）
    const dateBoxes = page.locator('input[title*="Posting Date"]');
    const count = await dateBoxes.count();
    const typeInto = async (idx: number, value: string) => {
      const b = dateBoxes.nth(idx);
      await b.scrollIntoViewIfNeeded();
      await b.click({ timeout: 3000 });
      await b.focus();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.keyboard.type(value, { delay: 20 });
      await page.keyboard.press('Tab');
    };
    if (count >= 2) {
      await typeInto(0, params.filter.postingDateFrom);
      await typeInto(1, params.filter.postingDateTo);
    } else {
      console.log('[DEMO 6] Posting Date 输入框不足 2 个，回退 AI');
      await ai(
        `请在 Posting Date 字段中：from 输入框填 "${params.filter.postingDateFrom}"，`
        + `to 输入框填 "${params.filter.postingDateTo}"`,
      );
    }

    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(8000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step('Step 3: 打开 Change Layout 对话框', async () => {
    // 原始 JS 给的 xpath=//*[@id="C185_toolbar_btn10"] 是 SAP 内部 id，跨 release 易变。
    // 优先用 role=button name=Change Layout，xpath 作为兜底。
    const layoutBtn = page.getByRole('button', { name: /^Change Layout/i }).first();
    const found = await layoutBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (found) {
      try { await layoutBtn.click({ timeout: 3000 }); }
      catch { await layoutBtn.click({ force: true, timeout: 3000 }); }
    } else {
      console.log('[DEMO 6] 顶部 "Change Layout" 按钮 role 未命中，使用 xpath 兜底');
      const xp = page.locator('xpath=//*[@id="C185_toolbar_btn10"]').first();
      try { await xp.click({ timeout: 3000 }); }
      catch { await xp.click({ force: true, timeout: 3000 }); }
    }
    await page.waitForTimeout(3000);
  });

  await test.step('Step 4: Column Set 搜 Operational Division → 移到左侧 → Adopt', async () => {
    await withRetry('Column Set 搜索 → 添加列 → Adopt', () =>
      ai(
        `当前已打开 "Change Layout" 对话框。请完成以下动作：`
        + `(1) 在对话框右侧 "Column Set" 面板工具栏中点击 "Find..." 或放大镜搜索按钮；`
        + `(2) 在弹出的搜索输入框（"Search term" / "Search for"）中输入 "${params.layoutField}"；`
        + `(3) 点击 "OK" / 按回车，让 Column Set 列表滚动到 "${params.layoutField}" 行并选中它；`
        + `(4) 关闭搜索小窗（点击 "×" 或按 Escape）；`
        + `(5) 点击两个面板之间"向左指"的箭头按钮（tooltip 通常是 "Show selected fields (F5)"），`
        + `把 "${params.layoutField}" 从右侧 Column Set 移到左侧 Displayed Columns；`
        + `(6) 点击对话框底部的 "Adopt" / 绿色对勾 按钮应用 layout。`,
      ),
    );
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);
  });

  await test.step('Step 5: 报表滚到最右，断言 Operational Division 列可见', async () => {
    await withRetry('报表滚到最右', () =>
      ai(
        '当前是 FAGLL03H 报表结果。请把报表区域水平滚动到最右端，'
        + '可以拖动底部水平滚动条到最右，或反复点击右端的箭头按钮。',
      ),
    );
    await page.waitForTimeout(1500);

    // DOM 优先：columnheader 含 Oper.Div. / Operational Division
    const pattern = new RegExp(
      `${params.layoutField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${params.layoutFieldAbbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'i',
    );
    let visible = false;
    try {
      visible = (await page.getByRole('columnheader', { name: pattern }).count()) > 0;
    } catch { /* ignore */ }
    if (!visible) {
      visible = (await page.locator(`[role="columnheader"]`).filter({ hasText: pattern }).count()) > 0;
    }

    if (visible) {
      console.log(`[DEMO 6] DOM 命中 "${params.layoutField}" / "${params.layoutFieldAbbrev}" 列`);
    } else {
      console.log('[DEMO 6] DOM 未直接命中，使用 aiAssert 兜底');
      await aiAssert(
        `当前 FAGLL03H 报表的表头中能看到 "${params.layoutField}" 列`
        + `（在 SAP 中常缩写为 "${params.layoutFieldAbbrev}"），证明 Operational Division 字段已加入 layout`,
      );
    }
    expect(true).toBe(true); // 走到这里就算通过；上面任一断言失败会抛错
  });
});
