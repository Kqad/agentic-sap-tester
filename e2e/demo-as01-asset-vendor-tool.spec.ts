// DEMO Test 7 — BP_IT_B2P_GUI_AuC Asset Master Data Creation-VendorTool (Row 21/22)
// 自然语言版本：
//   1.  Menu → Settings → Visualization → enable Show OK Code, Save
//       TC = AS01, Execute
//   2.  Company code 8540, Asset class A3200000, 点 Master data
//   3.  Description 第一行 = "ai test", Save
//       Cost center C854100263, Plant 8543, Save, 返回主页
//   4.  Menu → Settings → Visualization → enable Show OK Code, Save
//       TC = AS03, Execute
//   5.  点 Master data, 界面显示 A3200000 → PASS
//
// 移植自 SAP TEST DEMO 5.21/SAP test 7 自然语言+JS.txt。

import { test, expect } from './fixture';
import params from './cases/demo-as01-asset-vendor-tool.json' with { type: 'json' };
import {
  fillSapField,
  dismissInfoPopupIfAny,
  withRetry,
  goToTransaction,
  clickExecute,
  openSap,
  readStatusBar,
} from './lib/sap-helpers.js';

test.setTimeout(25 * 60 * 1000);

test('DEMO 7 · AS01 create AuC asset → AS03 verifies asset class A3200000', async ({
  page, ai, aiTap, aiQuery, aiAssert,
}) => {
  let createdAssetNumber = '';

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

  await test.step('Step 1: Settings + AS01 入口屏', async () => {
    await enableShowOkCode();
    await goToTransaction(page, params.transactionCodes.createAsset, params.sapUrl);
  });

  await test.step('Step 2: 填 Company / Asset class → Master data', async () => {
    await fillSapField(page, 'Company Code', params.entry.companyCode)
      .catch(() => fillSapField(page, 'Company code', params.entry.companyCode));
    await fillSapField(page, 'Asset Class', params.entry.assetClass)
      .catch(() => fillSapField(page, 'Asset class', params.entry.assetClass));

    // 按 Enter 进入资产明细（等同于点 Master data 按钮）
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3500);
    await dismissInfoPopupIfAny(page);

    await withRetry('确保位于 General tab', () =>
      ai(
        '在当前 AS01 资产明细界面中确保激活的是 "General" 选项卡，'
        + '如果不是 General 则点击 "General" tab 切换过去。',
      ),
      2,
    );
  });

  await test.step('Step 3: General Description → Save → Time-dependent CC/Plant → Save', async () => {
    await fillSapField(page, 'Description', params.general.description).catch(async () => {
      await ai(
        `在 General tab 上找到 "Description" 输入框（通常该 tab 第一个文本输入），`
        + `清空并键入 "${params.general.description}"`,
      );
    });

    // 第一次 Save —— 视频里是先保存再切 tab；若被验证拒绝（缺 cost center / plant 等），后面 Time-dependent 再补
    console.log('[DEMO 7] Save (first attempt)');
    await page.keyboard.press('Control+S');
    await page.waitForTimeout(3000);
    await dismissInfoPopupIfAny(page);

    await withRetry('切到 Time-dependent tab', () =>
      ai(
        '点击 AS01 资产明细界面顶部 "Time-dependent" 选项卡，切换到该 tab '
        + '显示 Cost center / Plant / Location 等字段',
      ),
      2,
    );
    await page.waitForTimeout(1500);

    await fillSapField(page, 'Cost Center', params.timeDependent.costCenter)
      .catch(() => fillSapField(page, 'Cost center', params.timeDependent.costCenter))
      .catch(async () => {
        await ai(`在 Time-dependent tab 找到 "Cost Center" 输入框，清空并键入 "${params.timeDependent.costCenter}"`);
      });
    await fillSapField(page, 'Plant', params.timeDependent.plant).catch(async () => {
      await ai(`在 Time-dependent tab 找到 "Plant" 输入框，清空并键入 "${params.timeDependent.plant}"`);
    });

    console.log('[DEMO 7] Save (after Time-dependent)');
    await page.keyboard.press('Control+S');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny(page);

    const status = await readStatusBar(page);
    console.log('[DEMO 7] AS01 status:', status || '(empty)');
    const m = status.match(/asset[^0-9]*(\d{6,18})/i);
    if (m) createdAssetNumber = m[1];

    if (!createdAssetNumber) {
      try {
        const snap = await withRetry('aiQuery AS01 result', () =>
          aiQuery<{ success: boolean; message: string; assetNumber: string }>(
            '观察当前 SAP AS01 界面执行 Save 之后的结果，返回 JSON: '
            + '{ "success": <true 如果显示资产已创建>, '
            + '"message": <底部消息或弹窗的文字>, '
            + '"assetNumber": <新建资产编号的纯数字部分，没有则空串> }',
          ),
          2,
        );
        console.log('[DEMO 7] AS01 AI result:', JSON.stringify(snap));
        if (snap?.assetNumber) createdAssetNumber = String(snap.assetNumber).replace(/\D+/g, '');
      } catch (e) {
        console.log('[DEMO 7] AS01 AI result skipped:', (e as Error).message);
      }
    }

    expect(
      createdAssetNumber,
      `AS01 未能识别新建资产编号；status="${status}"。如缺乏 UseLife / 权限请人工核实。`,
    ).toMatch(/^\d{6,18}$/);
    console.log(`[DEMO 7] 新建资产编号 = ${createdAssetNumber}`);
  });

  await test.step('Step 4: 返回主页 → Settings + AS03', async () => {
    await goToTransaction(page, '/n', params.sapUrl);
    await enableShowOkCode();
    await goToTransaction(page, '/n' + params.transactionCodes.displayAsset, params.sapUrl);
  });

  await test.step('Step 5: 填资产编号 + Master data 验证 Asset Class', async () => {
    await fillSapField(page, 'Asset', createdAssetNumber).catch(() =>
      fillSapField(page, 'Asset Number', createdAssetNumber),
    );
    await fillSapField(page, 'Company Code', params.entry.companyCode).catch(() =>
      fillSapField(page, 'Company code', params.entry.companyCode),
    );

    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny(page);

    // DOM 优先验证 — 资产类别字段或页面任意可见 input 值含 A3200000
    const expected = params.expectedAssetClass;
    const matchInDom = await page.evaluate((needle) => {
      const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      if (inputs.some(i => (i.value || '').includes(needle))) return true;
      const body = document.body?.innerText || '';
      return body.includes(needle);
    }, expected);

    if (matchInDom) {
      console.log(`[DEMO 7] DOM 命中 "${expected}"，PASS`);
    } else {
      console.log('[DEMO 7] DOM 未直接命中，使用 aiAssert 兜底');
      await aiAssert(
        `当前 AS03 资产显示界面（Master data 视图）中可以看到 Asset Class 字段值为 "${expected}"`,
      );
    }
  });
});
