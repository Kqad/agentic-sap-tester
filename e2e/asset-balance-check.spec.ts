import { test, expect } from './fixture';
import type { Page } from '@playwright/test';
import params from './cases/asset-balance-check.json' with { type: 'json' };

test.setTimeout(15 * 60 * 1000);

// SAP WebGUI 字段填充：用 Playwright accessibility label 定位（确定性），
// 再读回确认；若 label 匹配多个则取首个（SAP 通常 from-to 两列共享 label，
// 我们要的是 from / 单值列）。
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
      await first.fill('');
      await first.fill(value);
      const got = await first.inputValue();
      if (got === value) return;
      console.log(`[fillSapField] "${label}" — typed "${value}" but read "${got}", trying next locator`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `fillSapField("${label}", "${value}") failed: could not locate or fill via Playwright. Last error: ${(lastErr as Error)?.message ?? lastErr}`,
  );
}

// aiQuery 网络抖动重试包装
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

function parseNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,-]/g, '');
  let normalized = cleaned;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot   = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

test('SAP Asset Balance: Curr.bk.val. == Book val.', async ({
  page,
  ai,
  aiInput,
  aiTap,
  aiQuery,
  aiAssert,
}) => {
  let a1Raw: string | null = null;
  let a2Raw: string | null = null;

  // 填完查询表单后调用：dump 已填的字段，便于排查
  const dumpForm = async (label: string) => {
    const snap = await aiQuery<{
      companyCode: string;
      assetNumber: string;
      reportDate: string;
      listAssetsChecked: boolean;
    }>(
      '从当前查询界面读取已填的字段值，返回 JSON: '
      + '{ "companyCode": <Company code 字段当前值>, '
      + '"assetNumber": <Asset number 字段当前值>, '
      + '"reportDate": <Report date 字段当前值>, '
      + '"listAssetsChecked": <List assets 复选框是否被勾选 true/false> }',
    );
    console.log(`[FORM DUMP] ${label}:`, JSON.stringify(snap));
    return snap;
  };

  // SAP Information 弹窗：点 Continue 跳过
  const dismissInfoPopupIfAny = async () => {
    try {
      await ai(
        '如果当前页面有一个标题为 "Information" 的弹窗（或任何带 "Continue" 按钮的信息提示弹窗），'
        + '点击它底部的 "Continue" 按钮关闭弹窗。'
        + '如果没有这样的弹窗，则什么都不做。',
      );
    } catch (e) {
      console.log('[POPUP] dismiss step skipped:', (e as Error).message);
    }
    await page.waitForTimeout(1500);
  };

  // SAP 登陆后常弹 "System Messages" / "Information" 公告窗，需要先确定性 Continue
  const dismissContinuePopup = async () => {
    const btn = page.getByRole('button', { name: /^Continue$/i }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log('[POPUP] Continue 关闭弹窗');
      try { await btn.click({ timeout: 3000 }); }
      catch { try { await btn.click({ force: true, timeout: 3000 }); } catch {} }
      await page.waitForTimeout(1500);
    }
  };

  await test.step('打开 SAP WebGUI 首页', async () => {
    await page.goto(params.sapUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
    await dismissContinuePopup();
  });

  await test.step('Step 1: 在 Settings → Interaction Design → Visualization 启用 Show OK Code Field', async () => {
    await aiTap('SAP WebGUI 左上角的 "Menu" 按钮');
    await page.waitForTimeout(800);
    await aiTap('刚弹出菜单中的 "Settings..." 菜单项');
    await page.waitForTimeout(2500);

    // 关键：SAP tree 的单击只是 select，双击才展开
    await ai(
      '在 Settings 对话框左侧的导航树中找到 "Interaction Design" 节点。' +
      '观察它前面的图标：如果是 ">" 形状的右指箭头说明该节点折叠中，需要双击文字 "Interaction Design" 使其展开；' +
      '如果是 "v" 形状的下指箭头则说明已展开，跳过展开操作。' +
      '展开后，在 "Interaction Design" 下方会出现 "Keyboard Settings"、"Visualization"、"Notifications"、"Mobile Rendering"、"Sound Settings" 这些子节点。' +
      '请确保 "Interaction Design" 是展开状态。',
    );
    await page.waitForTimeout(1200);

    await aiTap(
      'Settings 对话框左侧导航树中 "Interaction Design" 节点下的 "Visualization" 子节点',
    );
    await page.waitForTimeout(1500);

    await ai(
      '在 Visualization 设置面板中找到 "Show OK Code field" 开关，' +
      '如果它当前是关闭的，则点击它使其变为开启；如果已经是开启状态则保持不变',
    );
    await page.waitForTimeout(500);
    await aiTap('Settings 对话框底部的 "Save" 按钮');
    await page.waitForTimeout(2500);
  });

  await test.step('Step 2: 通过事务码进入 Asset History Sheet 并提取 A1', async () => {
    await aiInput(params.transactionCode, '左上角 TC / OK Code 输入框（顶部菜单旁边的下拉/文本输入框）');
    await page.waitForTimeout(500);
    await ai('按下回车键，使刚刚输入的事务码生效并跳转到对应的查询界面');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3500);

    // SAP 表单字段用 Playwright 标签定位（确定性、快），AI 仅用于不易定位的导航/断言
    await fillSapField(page, 'Company code', params.query.companyCode);
    await fillSapField(page, 'Asset number', params.query.assetNumber);
    await fillSapField(page, 'Report date',  params.query.reportDate);

    if (params.query.listAssets) {
      await ai('如果查询界面中标签为 "List assets" 的单选/复选项尚未被选中，则点击它使其选中');
    }

    const snap1 = await dumpForm('Asset History Sheet 查询前');
    expect(snap1?.reportDate, 'Report date 未被正确填入').toContain('2026');

    await aiTap('查询界面工具栏上的 Execute 按钮（带时钟+对勾图标，或文字 Execute）');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);

    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2000);

    await withRetry('assert Asset History Sheet 报表', () =>
      aiAssert(
        '当前已显示 Asset History Sheet 报表（页面标题或表头含 "Asset History Sheet" 字样），'
        + '且报表中包含资产编号 1010001732 相关的数据行（或合计行）',
      ),
    );

    // Curr.bk.val. 是 history sheet 最右侧列，需要横向滚动
    await withRetry('滚动到 Curr.bk.val. 列', () =>
      ai(
        '当前报表横向有多列且部分列被截断（标题写着 "13 col., wide version"）。' +
        '请将报表区域水平滚动到最右端，直到能看到名为 "Curr.bk.val." 的列（中文：当前账面价值）。' +
        '可以通过下面这些方式实现：' +
        '（1）拖动报表底部的水平滚动条到最右端；' +
        '（2）反复点击水平滚动条右端的箭头按钮；' +
        '（3）点击报表中的任一单元格然后按多次 End 键。' +
        '滚动后请确认 "Curr.bk.val." 列标题可见于报表中。',
      ),
    );
    await page.waitForTimeout(1200);

    const a1 = await withRetry<{ currBkVal: string }>('aiQuery A1', () =>
      aiQuery<{ currBkVal: string }>(
        `从当前 Asset History Sheet 报表的可见列中找到 "${params.extract.a1ColumnLabel}" 列，` +
        `定位到资产编号 ${params.query.assetNumber} 对应的那一行（如果只有合计行就取合计行），` +
        `提取该列的单元格文本（保留原始格式，含千分位/小数点/货币符号），` +
        `返回 JSON: { "currBkVal": <字符串> }。` +
        `如果当前截图中看不到 "${params.extract.a1ColumnLabel}" 列，返回 { "currBkVal": "" }`,
      ),
    );
    a1Raw = a1?.currBkVal ?? null;
    console.log('A1 (Curr.bk.val.) =', a1Raw);
    expect(a1Raw, 'A1 不应为空').toBeTruthy();
  });

  await test.step('Step 3: 回到主页 → Favorites → Asset Balances，提取 A2', async () => {
    await aiInput('/n', '左上角 TC / OK Code 输入框');
    await ai('按下回车键，回到 SAP Easy Access 主页');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    await ai(
      '在主页左侧的菜单树中找到 "Favorites" 文件夹，如果它是折叠的就先展开它，'
      + `然后双击其下名为 "${params.favoritesEntry}" 的条目以打开该报表`,
    );
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3500);
    await dismissContinuePopup();

    // 收藏夹里的 Asset Balances 经常绑定了一个 variant，会跳过查询界面直接出结果。
    // 用 Company code label 探测当前是不是查询表单；不是就回退到选择屏（F3 / 直接 TC）。
    const onQueryForm = async () => page.getByLabel('Company code')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!(await onQueryForm())) {
      console.log('[Step 3] Favorites 直接进入结果页，按 F3 回到选择屏');
      await page.keyboard.press('F3');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2500);
      await dismissContinuePopup();
    }

    if (!(await onQueryForm())) {
      console.log('[Step 3] F3 仍未回到选择屏，直接走 TC S_ALR_87011963');
      await aiInput('/nS_ALR_87011963', '左上角 TC / OK Code 输入框');
      await ai('按下回车键，使刚刚输入的事务码生效并跳转到 Asset Balances 查询界面');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3500);
      await dismissContinuePopup();
    }

    await fillSapField(page, 'Company code', params.query.companyCode);
    await fillSapField(page, 'Asset number', params.query.assetNumber);
    await fillSapField(page, 'Report date',  params.query.reportDate);

    if (params.query.listAssets) {
      await ai('如果查询界面中标签为 "List assets" 的单选/复选项尚未被选中，则点击它使其选中');
    }

    const snap2 = await dumpForm('Asset Balances 查询前');
    expect(snap2?.reportDate, 'Report date 未被正确填入').toContain('2026');

    await aiTap('查询界面工具栏上的 Execute 按钮');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);

    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2000);

    await withRetry('assert Asset Balances 报表', () =>
      aiAssert('当前已显示 Asset Balances 报表结果表格（有表头和数据行）'),
    );

    // 同样：Book val. 列可能不在视区，先滚到能看到为止
    await withRetry('滚动到 Book val. 列', () =>
      ai(
        `当前是 Asset Balances 报表结果。请确保 "${params.extract.a2ColumnLabel}" 列可见，` +
        `如果该列在视区右侧之外，请向右滚动报表区域直到该列可见。`,
      ),
    );
    await page.waitForTimeout(1200);

    const a2 = await withRetry<{ bookVal: string }>('aiQuery A2', () =>
      aiQuery<{ bookVal: string }>(
        `从当前 Asset Balances 报表结果表格中，`
        + `定位到资产编号 ${params.query.assetNumber} 对应的那一行`
        + `（如果只有一条数据行就取该行；若有合计行/小计行，请取数据行而非合计行），`
        + `提取 "${params.extract.a2ColumnLabel}" 列的单元格文本（保留原始格式），`
        + `返回 JSON: { "bookVal": <字符串> }`,
      ),
    );
    a2Raw = a2?.bookVal ?? null;
    console.log('A2 (Book val.) =', a2Raw);
    expect(a2Raw, 'A2 不应为空').toBeTruthy();
  });

  await test.step('Step 4: 比较 A1 和 A2', async () => {
    const a1Num = parseNumber(a1Raw);
    const a2Num = parseNumber(a2Raw);
    const equal = a1Num !== null && a2Num !== null && Math.abs(a1Num - a2Num) < 0.005;

    console.log('========== TEST RESULT ==========');
    console.log(`A1 (Curr.bk.val.) raw = ${a1Raw}  parsed = ${a1Num}`);
    console.log(`A2 (Book val.)    raw = ${a2Raw}  parsed = ${a2Num}`);
    console.log(`A1 == A2 ? ${equal ? 'YES — 测试成功' : 'NO — 测试失败'}`);
    console.log('=================================');

    expect(equal, `A1 (${a1Raw}) 与 A2 (${a2Raw}) 不相等`).toBe(true);
  });
});
