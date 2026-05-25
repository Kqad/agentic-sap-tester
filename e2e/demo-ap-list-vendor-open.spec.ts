// DEMO Test 2 — Manage Accounts payable Reports & Analytics Row 20/21
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable "Show OK Code field", Save
//   2.  TC = S_ALR_87012083, Execute
//   3.  Company code 8540, Execute
//   4.  Menu → System → List → Save → Save → Spreadsheet → Continue → Export to → OK
//   5.  底部出现绿色 √ 加 "download xxx" 文字 = PASS
//
// 移植自 SAP TEST DEMO 5.21/SAP test 2 自然语言+JS.txt。

import { test, expect } from './fixture';
import params from './cases/demo-ap-list-vendor-open.json' with { type: 'json' };
import {
  fillSapField,
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  clickExecute,
  openSap,
} from './lib/sap-helpers.js';

test.setTimeout(15 * 60 * 1000);

test('DEMO 2 · S_ALR_87012083 List of Vendor Open Items → Export to Spreadsheet', async ({
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
    await ai(
      '在 Settings 对话框左侧导航树中确保 "Interaction Design" 展开，然后点击 "Visualization" 子节点',
    );
    await page.waitForTimeout(1200);
    await ai('在 Visualization 面板中找到 "Show OK Code field" 开关并启用它');
    await page.waitForTimeout(500);
    await aiTap('Settings 对话框底部的 "Save" 按钮');
    await page.waitForTimeout(2500);
  });

  await test.step('Step 2: 进入 TC S_ALR_87012083 并 Execute', async () => {
    await goToTransaction(page, params.transactionCode, params.sapUrl);
    await fillSapField(page, 'Company code', params.query.companyCode);
    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step('Step 3: Menu → System → List → Save → Spreadsheet → Continue → Export → OK', async () => {
    // Download 监听：浏览器触发 download 事件即视为导出成功
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 }).catch(() => null);

    await withRetry('Menu → System → List → Save → Spreadsheet 弹窗', () =>
      ai(
        '依次完成下面这一连串菜单与弹窗操作：'
        + '(a) 点击 SAP WebGUI 工具栏左上角的 "Menu" 按钮；'
        + '(b) 在主菜单中点击 "System"；'
        + '(c) 在 System 子菜单中点击 "List"；'
        + '(d) 在 List 子菜单中点击 "Save..."；'
        + '(e) 在新弹出的 "Save list in file..." 对话框中再次点击 "Save" 或 "OK"；'
        + '(f) 在 "Save list in file" 格式选择对话框中选中 "Spreadsheet" 单选；'
        + '(g) 点击 "Continue" 或 "Tick / Enter / OK"；'
        + '(h) 在 "Export to a Local File" 对话框中保留路径，点击 "OK" / "Save" / "Generate"。'
        + '每步之间留出 1 秒等待 UI 切换。',
      ),
    );

    const download = await downloadPromise;
    if (download) {
      const name = download.suggestedFilename();
      console.log(`[DEMO 2] download triggered: ${name}`);
      expect(name, '下载文件名不应为空').toBeTruthy();
    } else {
      console.log('[DEMO 2] 未捕获到 download 事件，回退使用 aiAssert 校验状态栏');
      await aiAssert(
        '页面底部状态栏 / 信息栏显示绿色的对勾图标，并出现类似 "X bytes transmitted" / '
        + '"File transferred" / "Download" 字样，说明 spreadsheet 导出成功',
      );
    }
  });
});
