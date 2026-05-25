// DEMO Test 3 — Manage Accounts payable Reports & Analytics Row 19 (Fiori Aging Analysis)
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable "Show OK Code field", Save
//   2.  TC = /n/UI2/FLP, Execute → 跳到 Fiori Launchpad
//   3.  点击搜索图标（xpath=//*[@id="sf"]/span）, 搜 "Aging Analysis"
//   4.  打开 Aging Analysis 卡片 → 漏斗 filter → company code 8540 → OK
//   5.  点击 Export to Spreadsheet 按钮（xpath=…/button[11]） → 检查下载
//
// 移植自 SAP TEST DEMO 5.21/SAP test 3 自然语言+JS.txt。
// 注意：Fiori Launchpad 在 SAP WebGUI 之外渲染，若环境没有为该用户开放 FLP，
//       Step 2 之后无法继续；此 spec 在那种情况下会显式失败，便于在平台
//       UI 中查看错误并调整运行环境。

import { test, expect } from './fixture';
import params from './cases/demo-aging-analysis-fiori.json' with { type: 'json' };
import {
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  clickExecute,
  openSap,
} from './lib/sap-helpers.js';

test.setTimeout(15 * 60 * 1000);

test('DEMO 3 · Fiori Launchpad Aging Analysis Export', async ({
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

  await test.step('Step 2: 进入 /n/UI2/FLP Fiori Launchpad', async () => {
    await goToTransaction(page, params.transactionCode, params.sapUrl);
    await clickExecute(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step('Step 3: 搜 "Aging Analysis" 并打开卡片', async () => {
    // 搜索图标 xpath
    const searchIcon = page.locator(`xpath=${params.searchIconXPath}`).first();
    const found = await searchIcon.isVisible({ timeout: 8000 }).catch(() => false);
    if (found) {
      try { await searchIcon.click({ timeout: 3000 }); }
      catch { await searchIcon.click({ force: true, timeout: 3000 }); }
    } else {
      console.log('[DEMO 3] 搜索图标 xpath 未命中，回退到 AI 视觉点击');
      await aiTap('Fiori Launchpad 顶部右上角的搜索图标（放大镜形状）');
    }
    await page.waitForTimeout(1500);

    await aiInput(params.appName, 'Fiori Launchpad 搜索输入框');
    await page.keyboard.press('Enter');

    // FLP 搜索后会弹一个 "Busy" / "Please wait" 进度对话框，结果卡片要等它消失才会渲染。
    // 之前 3 秒的硬等待经常不够，AI 看到 "Results (1)" 但找不到卡片就直接失败。
    const busy = page.getByRole('progressbar', { name: /Please wait/i }).first();
    await busy.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await busy.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // 优先用 Playwright 语义 locator 命中结果卡片；命中不到再回退 AI 视觉。
    const cardCandidates = [
      page.getByRole('link', { name: new RegExp(`^${params.appName}$`, 'i') }),
      page.getByRole('link', { name: new RegExp(params.appName, 'i') }),
      page.getByRole('button', { name: new RegExp(`^${params.appName}$`, 'i') }),
      page.getByRole('heading', { name: new RegExp(`^${params.appName}$`, 'i') }),
      page.getByText(params.appName, { exact: true }),
    ];
    let clicked = false;
    for (const cand of cardCandidates) {
      const loc = cand.first();
      if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
        try {
          await loc.scrollIntoViewIfNeeded().catch(() => {});
          await loc.click({ timeout: 4000 });
          clicked = true;
          break;
        } catch {
          try { await loc.click({ force: true, timeout: 3000 }); clicked = true; break; }
          catch { /* 试下一个 */ }
        }
      }
    }
    if (!clicked) {
      console.log('[DEMO 3] 结果卡片语义 locator 全未命中，回退到 AI 视觉点击');
      await aiTap(`搜索结果中标题为 "${params.appName}" 的应用卡片或链接`);
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    await dismissInfoPopupIfAny(page);
  });

  await test.step('Step 4: 展开顶部 → 漏斗 filter → Company code 8540 → OK', async () => {
    await withRetry('展开 + 漏斗 + 设 Company code', () =>
      ai(
        '在 Aging Analysis 应用界面中：'
        + '(1) 点击屏幕上部"向下展开"的小箭头/图标，展开筛选面板；'
        + '(2) 在展开的筛选面板里点击"漏斗"图标打开 Filter 选择对话框；'
        + '(3) 在 Filter 列表中点击 "Company Code"；'
        + `(4) 在 Company Code 值输入框中搜索 "${params.filter.companyCode}" 并选中第一条匹配；`
        + '(5) 点击对话框底部的 "OK" 应用。',
      ),
    );
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
  });

  await test.step('Step 5: 点击 Export to Spreadsheet 并验证下载', async () => {
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 }).catch(() => null);

    const exportBtn = page.locator(`xpath=${params.exportButtonXPath}`).first();
    const xpathHit = await exportBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (xpathHit) {
      try { await exportBtn.click({ timeout: 3000 }); }
      catch { await exportBtn.click({ force: true, timeout: 3000 }); }
    } else {
      console.log('[DEMO 3] Export 按钮 xpath 未命中，回退到 AI 视觉点击');
      await aiTap('Aging Analysis 表格工具栏右侧的 "Export to Spreadsheet" 图标按钮（带向下箭头的工作表图标）');
    }
    await page.waitForTimeout(2000);

    // 部分 Fiori 应用点了 Export 后会弹一个 Save / OK 确认框
    try {
      await ai(
        '如果当前弹出了一个 "Export to Spreadsheet" 设置对话框（让你选 Include filter settings / Split cells 等），'
        + '保留默认设置并点击底部的 "OK" / "Save" / "Download" 按钮关闭弹窗触发下载；'
        + '如果没有这样的对话框则什么都不做。',
      );
    } catch (e) {
      console.log('[DEMO 3] 导出确认弹窗 AI 步骤忽略:', (e as Error).message);
    }

    const download = await downloadPromise;
    if (download) {
      const name = download.suggestedFilename();
      console.log(`[DEMO 3] download: ${name}`);
      expect(name, '下载文件名不应为空').toBeTruthy();
    } else {
      console.log('[DEMO 3] 未捕获 download 事件，使用 aiAssert 兜底');
      await aiAssert(
        '页面顶部 / 工具栏出现 "Downloaded" / "File generated" 等成功提示，或浏览器底部已弹出下载进度条',
      );
    }
  });
});
