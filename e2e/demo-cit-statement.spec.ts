// DEMO Test 5 — BP_IT_B2P_GUI_CIT (Row 8/9)
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable Show OK Code, Save
//       TC = S_ALR_87012284, Execute
//   2.  Company code 8540, Ledger L2, Financial statement version IFR4
//       滚到最底 → 点击 "ALV tree control" → Execute → 点对勾 → 等 10s
//       → 点击打印机右边的下箭头 → "Print preview of view"
//   3.  Menu → System → List → Save → Save → Spreadsheet → Continue → Export to → OK
//   4.  绿色 √ + download 文件 = PASS
//
// 移植自 SAP TEST DEMO 5.21/SAP test 5 自然语言+JS.txt。

import { test, expect } from './fixture';
import params from './cases/demo-cit-statement.json' with { type: 'json' };
import {
  fillSapField,
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  clickExecute,
  openSap,
} from './lib/sap-helpers.js';

test.setTimeout(20 * 60 * 1000);

test('DEMO 5 · S_ALR_87012284 IFR4 CIT statement → ALV → print preview → export', async ({
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

  await test.step('Step 2: 进入 TC S_ALR_87012284', async () => {
    await goToTransaction(page, params.transactionCode, params.sapUrl);
  });

  await test.step('Step 3: 填 Company / Ledger / FSV → 选 ALV tree control → Execute', async () => {
    await fillSapField(page, 'Company code', params.query.companyCode);
    await fillSapField(page, 'Ledger',       params.query.ledger);
    await fillSapField(page, 'Financial statement version', params.query.financialStatementVersion)
      .catch(() => fillSapField(page, 'Financial Statement Version', params.query.financialStatementVersion));

    await withRetry('选 ALV tree control 输出格式', () =>
      ai(
        '在当前 S_ALR_87012284 选择界面中：'
        + '(1) 把界面纵向滚动到最底部，找到 "Output Type" / "Output Control" / "List output" 区块；'
        + '(2) 在该区块中找到 "ALV tree control" 单选/复选项并将其选中（如果已选中则跳过）。',
      ),
    );

    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step('Step 4: 弹窗对勾 → 等渲染 → 打印机下箭头 → Print preview of view', async () => {
    await ai(
      '如果当前出现了一个需要确认的对话框（含 "Continue" / 绿色对勾按钮），点击对勾/Continue 关闭它；'
      + '如果没有这种对话框则什么都不做。',
    );
    await page.waitForTimeout(10_000);

    await withRetry('打印机下箭头 → Print preview of view', () =>
      ai(
        '在 CIT 报表结果界面顶部工具栏找到"打印机"图标按钮；'
        + '点击该按钮右侧紧挨着的"向下箭头"，弹出下拉菜单；'
        + '然后点击下拉菜单中的 "Print preview of view" 项。',
      ),
    );
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
  });

  await test.step('Step 5: System → List → Save → Save → Spreadsheet → Continue → Export → OK', async () => {
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 }).catch(() => null);

    await withRetry('System List Save Spreadsheet 整链', () =>
      ai(
        '依次完成下面这一连串菜单与弹窗操作：'
        + '(a) 点击 SAP WebGUI 工具栏左上角的 "Menu" 按钮；'
        + '(b) 在主菜单中点击 "System"；'
        + '(c) 在 System 子菜单中点击 "List"；'
        + '(d) 在 List 子菜单中点击 "Save..."；'
        + '(e) 在新弹出的 "Save list in file..." 对话框中再次点击 "Save" 或 "OK"；'
        + '(f) 在 "Save list in file" 格式选择对话框中选中 "Spreadsheet" 单选；'
        + '(g) 点击 "Continue" 或对勾；'
        + '(h) 在 "Export to a Local File" 对话框中保留默认路径，点击 "OK"。'
        + '每步之间留 1 秒等 UI 切换。',
      ),
    );

    const download = await downloadPromise;
    if (download) {
      const name = download.suggestedFilename();
      console.log(`[DEMO 5] download: ${name}`);
      expect(name, '下载文件名不应为空').toBeTruthy();
    } else {
      console.log('[DEMO 5] 未捕获 download 事件，使用 aiAssert 兜底');
      await aiAssert(
        '页面底部状态栏显示绿色对勾，并出现 "X bytes transmitted" / "File transferred" 等成功提示',
      );
    }
  });
});
