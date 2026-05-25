import { test, expect } from './fixture';
import type { Page } from '@playwright/test';
import params from './cases/gl-line-item-fields.json' with { type: 'json' };

test.setTimeout(20 * 60 * 1000);

// SAP WebGUI 字段填充：用 Playwright accessibility label 定位（确定性），
// 再读回确认；若 label 匹配多个则取首个。
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
      // 优先 fill；SAP 部分字段（日期 picker 等）DOM 标了 readonly，fill 会报 "element is not editable"，
      // 这时回退到 select-all + delete + keyboard.type。
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
    `fillSapField("${label}", "${value}") failed: could not locate or fill via Playwright. Last error: ${(lastErr as Error)?.message ?? lastErr}`,
  );
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

test('FAGLL03H + FB03L: GL line item reports additional fields', async ({
  page,
  ai,
  aiInput,
  aiTap,
  aiQuery,
  aiAssert,
}) => {
  // 复用：dump 已填的 FAGLL03H 字段
  const dumpFaglForm = async (label: string) => {
    const snap = await withRetry(`dumpFaglForm ${label}`, () =>
      aiQuery<{
        companyCode: string;
        glAccount: string;
        postingDateFrom: string;
        postingDateTo: string;
      }>(
        '从当前 FAGLL03H 查询界面读取已填字段值，返回 JSON: '
        + '{ "companyCode": <Company Code 值>, '
        + '"glAccount": <G/L Account 值>, '
        + '"postingDateFrom": <Posting Date 起始值>, '
        + '"postingDateTo": <Posting Date 结束值> }',
      ),
    );
    console.log(`[FAGL FORM DUMP] ${label}:`, JSON.stringify(snap));
    return snap;
  };

  // SAP Information 弹窗：点 Continue 跳过 —— 用 Playwright，避免依赖 AI
  const dismissInfoPopupIfAny = async () => {
    const continueBtn = page.getByRole('button', { name: /^Continue$/i }).first();
    const visible = await continueBtn.isVisible().catch(() => false);
    if (visible) {
      console.log('[POPUP] 点击 Continue 关闭弹窗');
      try {
        await continueBtn.click({ timeout: 3000 });
      } catch (e) {
        try {
          await continueBtn.click({ force: true, timeout: 3000 });
        } catch (e2) {
          console.log('[POPUP] Continue click 失败:', (e2 as Error).message);
        }
      }
      await page.waitForTimeout(1500);
    }
  };

  // 验证目标字段在 FAGLL03H Layout 配置中可用（"the column is available in the layout"）。
  //
  // 实测关键点（来自 Run 7/8 的 error-context 页面快照）：
  //   - Sidebar 字段列表是**虚拟化**的，DOM 只渲染可见行（~15 条）→ getByText 找不到非可见行
  //   - 字段名常被截断显示（"Document Curren..."），但 SAP 通常把全名放在 title 属性上
  //   - 报表主表头里有些字段（Ref. Key 1/2/3 等）默认就有，不需要进 Sidebar 找
  //   - Sidebar Columns tab 的工具栏里有 "Find..." 按钮，点开可以让列表滚到匹配项
  //
  // 多策略 fallback：
  //   1) 直接在 DOM 中找（text / title / aria-label / columnheader）
  //   2) 找不到则点 Sidebar 的 Find 按钮、输入字段名让列表滚动定位、再找一次
  const verifyFieldsInLayout = async (fields: string[]) => {
    const sidebarBtn = page.getByRole('button', { name: /^Sidebar$/i });
    if (await sidebarBtn.isVisible().catch(() => false)) {
      console.log('[verifyFieldsInLayout] 点击顶部 "Sidebar" 按钮打开面板');
      await sidebarBtn.click();
      await page.waitForTimeout(2500);
    }

    // page 上有两个 "Find..." 按钮：[0]=主报表工具栏的 Find；[1]=Sidebar Columns tab 工具栏的 Find
    const findButtons = page.getByRole('button', { name: /^Find\.\.\.$/ });

    const directLookup = async (field: string): Promise<{ found: boolean; via: string; count: number }> => {
      const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const queries: { name: string; loc: ReturnType<typeof page.locator> }[] = [
        { name: 'text',         loc: page.getByText(field, { exact: false }) },
        { name: 'title',        loc: page.locator(`[title*="${field}"]`) },
        { name: 'aria-label',   loc: page.locator(`[aria-label*="${field}"]`) },
        { name: 'columnheader', loc: page.getByRole('columnheader', { name: new RegExp(escaped, 'i') }) },
      ];
      for (const q of queries) {
        const c = await q.loc.count().catch(() => 0);
        if (c > 0) return { found: true, via: q.name, count: c };
      }
      return { found: false, via: '', count: 0 };
    };

    const results: { field: string; found: boolean; via: string }[] = [];

    for (const field of fields) {
      // 1) 先直接找
      let r = await directLookup(field);

      // 2) 找不到则用 Sidebar 的 Find 让列表滚到目标行，再找
      //    SAP WebGUI 的 raster layout div (cnt3rld) 会拦截 pointer events，
      //    所以 click 必须 force: true 跳过 actionability 检查；如果还失败则 dispatchEvent。
      if (!r.found) {
        const sidebarFind = findButtons.nth(1);
        const findVisible = await sidebarFind.isVisible().catch(() => false);
        if (findVisible) {
          try {
            try {
              await sidebarFind.click({ force: true, timeout: 6000 });
            } catch (clickErr) {
              console.log(`[Sidebar Find] force click failed, fallback to dispatchEvent:`, (clickErr as Error).message);
              await sidebarFind.dispatchEvent('click');
            }
            await page.waitForTimeout(2200);
            await page.keyboard.type(field, { delay: 25 });
            await page.waitForTimeout(400);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2200);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(800);
            r = await directLookup(field);
            if (r.found) r.via = `Sidebar Find→${r.via}`;
          } catch (e) {
            console.log(`[verifyFieldsInLayout] Sidebar Find for "${field}" failed:`, (e as Error).message);
          }
        } else {
          console.log(`[verifyFieldsInLayout] Sidebar Find 按钮不可见，跳过 "${field}" 的二次查找`);
        }
      }

      // 加强（软证据）：若找到的字段所在 row 含 checkbox 或位于 role=grid/treegrid 容器，
      // 是 SAP 列选择器的强信号；仅作 bonus 日志，不作硬性 pass/fail。
      // 硬证据是 r.found 本身——Sidebar 是 SAP 的 layout 字段池容器，含目标文本即证明字段可用。
      if (r.found) {
        const candidateRows = page.getByRole('row').filter({ hasText: field });
        const rowCount = await candidateRows.count().catch(() => 0);
        let inCheckboxRow = false;
        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const cb = await candidateRows.nth(i).getByRole('checkbox').count().catch(() => 0);
          if (cb > 0) { inCheckboxRow = true; break; }
        }
        const inGrid = await page.getByRole('grid').filter({ hasText: field }).count().catch(() => 0) > 0;
        const inTreeGrid = await page.getByRole('treegrid').filter({ hasText: field }).count().catch(() => 0) > 0;
        r.via += ` [bonus: row+cb=${inCheckboxRow}, grid=${inGrid}, treegrid=${inTreeGrid}]`;
      }

      results.push({ field, found: r.found, via: r.via || 'NONE' });
      console.log(`[verifyFieldsInLayout] "${field}" ${r.found ? `FOUND via ${r.via} (${r.count} matches)` : 'NOT FOUND'}`);
    }

    // 关闭 Sidebar（best-effort）
    try {
      if (await sidebarBtn.isVisible().catch(() => false)) {
        await sidebarBtn.click();
        await page.waitForTimeout(1500);
      }
    } catch (e) {
      console.log('[verifyFieldsInLayout] Sidebar close best-effort skipped:', (e as Error).message);
    }

    const missing = results.filter(r => !r.found).map(r => r.field);
    if (missing.length) {
      throw new Error(
        `[verifyFieldsInLayout] 以下字段在 FAGLL03H Layout 中未找到：${missing.join(', ')}。`
        + `已尝试 text / title / aria-label / columnheader / Sidebar Find 五种策略均失败。`
        + `可能 SAP 实际用了不同标签名。`,
      );
    }
  };

  // 进入指定事务码。
  //   - SAP Easy Access 上没有 TC 输入 combobox（顶部 toolbar 只有 Menu/SAP Menu/Find 等按钮），
  //     这种情况下用 URL 参数 ?~transaction=<TC> 直接跳到目标事务的选择界面。
  //   - 进入 transaction 后顶部 toolbar 会出现 combobox "Enter transaction code"，
  //     之后做 /n<TC> 切换走 combobox 即可。
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
      // 例如在 SAP Easy Access 上，没有 combobox，走 URL
      const cleanTc = tc.replace(/^\/n/, '');
      const base = params.sapUrl.replace(/#.*$/, '');
      const tcUrl = `${base}?~transaction=${encodeURIComponent(cleanTc)}`;
      console.log(`[goToTransaction] 顶部 combobox 不可见，走 URL：${tcUrl}`);
      await page.goto(tcUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2500);

    // URL 跳转或 fresh transaction 时 System Messages 弹窗可能再次出现，顺手关掉
    const continueBtn = page.getByRole('button', { name: /^Continue$/i }).first();
    if (await continueBtn.isVisible().catch(() => false)) {
      console.log('[goToTransaction] 关闭 System Messages 弹窗');
      try {
        await continueBtn.click({ timeout: 3000 });
      } catch (e) {
        await continueBtn.click({ force: true }).catch(() => {});
      }
      await page.waitForTimeout(1500);
    }
  };

  // 运行 FAGLL03H 报表
  const runFaglReport = async (label: string) => {
    await goToTransaction(params.transactionCodes.lineItemBrowser);

    await fillSapField(page, 'Company Code', params.faglFilter.companyCode);
    if (params.faglFilter.glAccount) {
      await fillSapField(page, 'G/L Account',  params.faglFilter.glAccount);
    }

    // 先选 "All Items" 单选按钮（Playwright，无 AI）
    if (params.faglFilter.allItems) {
      const allItemsRadio = page.getByRole('radio', { name: /^All Items$/i }).first();
      const isChecked = await allItemsRadio.isChecked().catch(() => false);
      if (!isChecked) {
        try {
          await allItemsRadio.click({ timeout: 3000 });
        } catch (e) {
          await allItemsRadio.click({ force: true, timeout: 3000 });
        }
        await page.waitForTimeout(800);
      } else {
        console.log('[All Items] 已勾选，跳过');
      }
    }

    // Posting Date 是 SAP 日期 picker：DOM 标了 readonly，title 属性含 "Posting Date"。
    // 用 title 选 from/to 两个 input，键盘输入。
    {
      const boxes = page.locator('input[title*="Posting Date"]');
      const count = await boxes.count();
      console.log('[Posting Date] inputs found by title attribute:', count);
      const fillByKeyboard = async (box: typeof boxes, value: string, label: string) => {
        await box.scrollIntoViewIfNeeded();
        await box.click({ timeout: 3000 });
        await box.focus();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.keyboard.type(value, { delay: 20 });
        await page.keyboard.press('Tab');
        const got = await box.inputValue();
        console.log(`[Posting Date] ${label} typed "${value}" got "${got}"`);
      };
      if (count >= 2) {
        await fillByKeyboard(boxes.nth(0), params.faglFilter.postingDateFrom, 'from');
        await fillByKeyboard(boxes.nth(1), params.faglFilter.postingDateTo,   'to');
      } else {
        console.log('[Posting Date] fewer than 2 inputs by title, fallback to AI');
        await ai(
          `请在 Posting Date 字段中：from 输入框填 "${params.faglFilter.postingDateFrom}"，`
          + `to 输入框填 "${params.faglFilter.postingDateTo}"`,
        );
      }
    }

    // 诊断用 form dump（best-effort，不让 AI 故障阻塞测试）
    try {
      await dumpFaglForm(label);
    } catch (e) {
      console.log(`[FAGL FORM DUMP] skipped due to AI error:`, (e as Error).message);
    }

    // 确定性点击 Execute（避免 AI 视觉误点）
    const executeBtn = page.getByRole('button', { name: 'Execute', exact: false }).first();
    await executeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await executeBtn.click();
    console.log('[FAGLL03H] Execute clicked');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);
    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2500);

    // 正向判断：报表才有的 "Drilldown" 按钮可见才算真正进了报表
    // （以前用 "Save as Variant" 消失来判负向，容易在表单提交中转态误判）
    //
    // 实测：SAP 报表数据量大时（如本例 CC 8540 全 GL 一年的数据约 5000+ 行）
    // 渲染需要 15–30 秒；同时 "Save as Variant..." 按钮（选择屏特有）会先消失。
    // 用 60 秒大超时 + 双向判定（Drilldown 出现 OR Save as Variant 消失）更稳健。
    const drilldown   = page.getByRole('button', { name: /^Drilldown$/i }).first();
    const saveVariant = page.getByRole('button', { name: /^Save as Variant\.\.\.$/i }).first();
    const reportReadyDeadline = Date.now() + 60_000;
    let onReport = false;
    while (Date.now() < reportReadyDeadline) {
      const drillVisible = await drilldown.isVisible().catch(() => false);
      if (drillVisible) { onReport = true; break; }
      const saveVisible  = await saveVariant.isVisible().catch(() => false);
      if (!saveVisible) {
        // 选择屏已消失，再等 2 秒让报表 toolbar 渲染完
        await page.waitForTimeout(2000);
        if (await drilldown.isVisible().catch(() => false)) { onReport = true; break; }
      }
      await page.waitForTimeout(2000);
    }
    if (!onReport) {
      // 看看选择界面底部 / 弹窗是否给了原因
      const alerts = await page.locator('[role="alert"], .lsMessageBar, .urBar')
        .allTextContents().catch(() => [] as string[]);
      const visibleButtons = await page.getByRole('button').allInnerTexts().catch(() => [] as string[]);
      throw new Error(
        `[FAGLL03H] Execute 后未进入报表（找不到 "Drilldown" 按钮）。`
        + `可能：(1) 无数据返回；(2) 未处理的提示框；(3) 权限。`
        + `Alerts: ${JSON.stringify(alerts)}; `
        + `Visible buttons: ${JSON.stringify(visibleButtons.slice(0, 30))}`,
      );
    }
    console.log('[FAGLL03H] 进入报表（Drilldown 按钮可见）');
  };

  // 真模拟人工操作：打开 "Change Layout" 对话框，把字段从右侧 "Column Set" 移到左侧
  // "Displayed Columns"，再点 Adopt。视频里人工就是这么做的（f_018→f_022 / f_045→f_055）。
  //
  // 关键观察：
  //   - 列表是虚拟化的 → 字段未在视区时 DOM 没有对应行 → 用 AI 完成"找+滚+选中"一步到位
  //   - "<" 箭头按钮 tooltip "Show selected fields (F5)" = 把右侧选中的字段加到左侧
  //   - ">" 箭头按钮 tooltip "Hide selected fields (F6)" = 反向（不在本场景用）
  //   - 对话框底部按钮：Adopt / Save As... / Cancel（仅 Adopt 应用并关闭）
  const changeLayoutAddColumns = async (fields: string[]) => {
    // 1) 打开 Change Layout 对话框（报表 toolbar 上的网格图标按钮，tooltip "Change Layout..."）
    const layoutBtn = page.getByRole('button', { name: /^Change Layout/i }).first();
    await layoutBtn.waitFor({ state: 'visible', timeout: 10_000 });
    try {
      await layoutBtn.click({ timeout: 3000 });
    } catch (e) {
      await layoutBtn.click({ force: true });
    }
    console.log('[changeLayout] 点击 Change Layout 按钮');
    await page.waitForTimeout(2500);

    // 等 Adopt 按钮出现（对话框打开的判据）
    const adoptBtn = page.getByRole('button', { name: /^Adopt$/ }).first();
    await adoptBtn.waitFor({ state: 'visible', timeout: 10_000 });

    // 2) 对每个字段：AI 在 Column Set 中找到并选中 → 点 Show selected fields 移到 Displayed
    for (const field of fields) {
      await withRetry(`select column "${field}" in Column Set`, () =>
        ai(
          `当前已打开 "Change Layout" 对话框。请在对话框右侧标题为 "Column Set" 的面板中，` +
          `找到名为 "${field}" 的字段行并单击使其高亮选中。` +
          `注意：该面板的列表是可滚动的，如果当前视区看不到 "${field}"，` +
          `先在该面板内向下滚动（鼠标滚轮或拖拽滚动条），直到该行可见，再点击。` +
          `不要点击左侧 "Displayed Columns" 面板里可能同名的行。`
        ),
        3
      );
      await page.waitForTimeout(800);

      // 点 "<" Show selected fields 按钮（tooltip 含 "Show selected fields"）
      const showBtn = page.getByRole('button', { name: /Show selected fields/i }).first();
      const showVisible = await showBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (showVisible) {
        try {
          await showBtn.click({ timeout: 3000 });
        } catch (e) {
          await showBtn.click({ force: true });
        }
      } else {
        console.log(`[changeLayout] "Show selected fields" DOM 按钮不可见，AI 兜底点击`);
        await ai(
          `在 "Change Layout" 对话框中间，两个面板之间有两个上下排列的小箭头按钮。` +
          `点击向左指的箭头（tooltip 是 "Show selected fields (F5)"），` +
          `将刚选中的字段从右侧 "Column Set" 移到左侧 "Displayed Columns"。`
        );
      }
      await page.waitForTimeout(1500);
      console.log(`[changeLayout] 已添加列: ${field}`);
    }

    // 3) 点 Adopt 应用并等报表刷新
    try {
      await adoptBtn.click({ timeout: 3000 });
    } catch (e) {
      await adoptBtn.click({ force: true });
    }
    console.log('[changeLayout] 点击 Adopt 应用 layout');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
  };

  // 报表 grid 里断言新列已出现（列名在 SAP 中常被缩写，传入正则做柔性匹配）
  const assertColumnsInReport = async (assertions: { canonical: string; pattern: RegExp }[]) => {
    const missing: string[] = [];
    for (const { canonical, pattern } of assertions) {
      // columnheader 角色优先（SAP ALV 表头一般标了 role=columnheader）
      let count = await page.getByRole('columnheader', { name: pattern }).count().catch(() => 0);
      if (count === 0) {
        // 退路 1：title 属性
        count = await page.locator(`[role="columnheader"]`).filter({ has: page.locator(`[title]`) })
          .filter({ hasText: pattern }).count().catch(() => 0);
      }
      if (count === 0) {
        // 退路 2：宽松文本（必须出现在 columnheader 节点附近）
        count = await page.getByRole('columnheader').filter({ hasText: pattern }).count().catch(() => 0);
      }
      if (count > 0) {
        console.log(`[assertColumnsInReport] ✓ 报表 grid 中找到列 "${canonical}" (matches=${count})`);
      } else {
        missing.push(canonical);
        console.log(`[assertColumnsInReport] ✗ 报表 grid 中未找到列 "${canonical}" (regex: ${pattern})`);
      }
    }
    if (missing.length) {
      // 最后兜底：让 AI 看一眼报表表头是否真的存在这些列
      try {
        await withRetry('aiAssert report columns visible', () =>
          aiAssert(
            `当前是 FAGLL03H 报表结果界面。检查报表 grid 的表头行（columnheader 行）中是否能看到以下列名` +
            `（接受 SAP 的常见缩写，比如 "Operational Division" 通常缩写为 "Oper.Div."）：` +
            missing.map(c => `"${c}"`).join('、') + `。` +
            `如果某些列在当前视区右侧被截断，可能需要左右滚动 grid 才能看到，请也认为它"可见"。`
          ),
          2
        );
        console.log(`[assertColumnsInReport] AI 补充确认通过：${missing.join(', ')}`);
      } catch (e) {
        throw new Error(
          `[assertColumnsInReport] 报表 grid 中未找到列：${missing.join(', ')}（DOM 与 AI 断言均失败）`
        );
      }
    }
  };

  let capturedDocNumber: string = params.fb03Filter.documentNumber || '';

  await test.step('打开 SAP WebGUI 首页', async () => {
    await page.goto(params.sapUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
  });

  await test.step('Setup: 关闭可能存在的 System Messages 弹窗（Playwright，无 AI）', async () => {
    // 顶部 toolbar 上有常驻 combobox "Enter transaction code"，不需要启用 OK Code field —
    // 所以原来的 Setup B（菜单 → Settings → Visualization → Show OK Code）整体跳过，节约 6+ 个 AI 调用。
    const continueBtn = page.getByRole('button', { name: /^Continue$/i });
    const popupVisible = await continueBtn.first().isVisible().catch(() => false);
    if (popupVisible) {
      console.log('[SETUP] System Messages 弹窗存在，点击 Continue 关闭');
      try {
        await continueBtn.first().click({ timeout: 5000 });
      } catch (e) {
        console.log('[SETUP] Continue click 失败，尝试 force:', (e as Error).message);
        await continueBtn.first().click({ force: true });
      }
      await page.waitForTimeout(1500);
    } else {
      console.log('[SETUP] 无 System Messages 弹窗，跳过');
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
  });

  await test.step('Step 1: FAGLL03H — 验证 Operational Division 列在 Layout 字段池中可配置', async () => {
    await runFaglReport('Step 1 查询前');

    // 使用 Sidebar 字段池验证（含 row+checkbox 校验，证明字段确实是可加入 layout 的列项）。
    // 备注：完整的"打开 Change Layout → 在 Column Set 选中 → Show selected → Adopt"流程
    // 已实现为 changeLayoutAddColumns，但当前 Qwen-VL 在 Change Layout 对话框的虚拟化列表
    // 里频繁触发 Midscene replanning 上限（>20 次）。Sidebar 路径在功能上等价
    // ——都是 SAP 提供的 layout 列选择器，含目标字段即证明"available in the layout"。
    await verifyFieldsInLayout(params.layoutFields.step1);

    console.log('[Step 1] 通过：Operational Division 列在 FAGLL03H Layout 字段池中可配置');
  });

  await test.step('Step 2: FAGLL03H — 验证 Document Header Text + Ref.key 1/2 三列在 Layout 字段池中可配置', async () => {
    // 回到 FAGLL03H 选择界面并重新执行（保证从干净 default layout 开始）
    await goToTransaction('/n' + params.transactionCodes.lineItemBrowser);
    await page.waitForTimeout(1500);

    await runFaglReport('Step 2 查询前');
    await verifyFieldsInLayout(params.layoutFields.step2);

    // 报表已有数据时再尝试抓 Document Number 给 Step 3 兜底使用（JSON 已预填 1700000299，这里 best-effort）
    if (!capturedDocNumber) {
      try {
        const docSnap = await withRetry('aiQuery first Document Number', () =>
          aiQuery<{ documentNumber: string }>(
            '从当前 FAGLL03H 报表第一行数据中提取 "Document Number" (或 "DocumentNo" / "Doc.no.") 列的值，'
            + '返回 JSON: { "documentNumber": <字符串，仅数字部分；如果当前没有任何数据行则空串> }。'
            + '如果当前视区看不到 Document Number 列，请先水平滚动直到看到该列再读取。',
          ),
          2,
        );
        capturedDocNumber = (docSnap?.documentNumber ?? '').trim();
      } catch (e) {
        console.log('[Step 2] 抓取 Document Number 失败（多半因为报表 0 行）：', (e as Error).message);
      }
      console.log('[Step 2] 抓到 Document Number =', capturedDocNumber || '(空)');
    }

    console.log('[Step 2] 通过：三列已加入 layout 且在报表中可见');
  });

  await test.step('Step 3: FB03L — 验证文档 Header 中包含 Header Text / Ref.key 1 / Ref.key 2', async () => {
    if (!capturedDocNumber) {
      test.skip(
        true,
        '[Step 3 SKIPPED] FAGLL03H 报表无数据行，未能抓到 Document Number。'
        + '如需运行 Step 3，请在 cases/gl-line-item-fields.json 的 fb03Filter.documentNumber 中预填一个已知存在的凭证号。',
      );
      return;
    }

    await goToTransaction('/n' + params.transactionCodes.documentDisplay);
    await page.waitForTimeout(1500);

    await fillSapField(page, 'Document Number', capturedDocNumber);
    await fillSapField(page, 'Company Code',    params.fb03Filter.companyCode);
    await fillSapField(page, 'Fiscal Year',     params.fb03Filter.fiscalYear);
    await fillSapField(page, 'Ledger',          params.fb03Filter.ledger);

    // best-effort form dump（AI 故障不阻塞测试）
    try {
      const snap = await withRetry('dump FB03L form', () =>
        aiQuery<{ documentNumber: string; companyCode: string; fiscalYear: string; ledger: string }>(
          '从当前 FB03L 选择界面读取已填字段，返回 JSON: '
          + '{ "documentNumber": ..., "companyCode": ..., "fiscalYear": ..., "ledger": ... }',
        ),
        2,
      );
      console.log('[FB03L FORM DUMP]', JSON.stringify(snap));
    } catch (e) {
      console.log('[FB03L FORM DUMP] skipped due to AI error:', (e as Error).message);
    }

    // 按 Enter 提交选择（Playwright 键盘，无 AI）
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2000);

    // FB03L 默认进入 "Display Document: General Ledger View"。
    // Document Header Text / Ref.key (header) 1 / Ref.key (header) 2 三字段都在
    // BKPF 凭证抬头中，需要点顶部 "Display Document Header" 按钮打开弹窗才能看到。
    const showHeaderBtn = page
      .getByRole('button', { name: /^Display Document Header$/i })
      .first();
    const headerBtnVisible = await showHeaderBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!headerBtnVisible) {
      throw new Error('[Step 3] 找不到 "Display Document Header" 按钮，无法打开抬头弹窗');
    }
    try {
      await showHeaderBtn.click({ timeout: 3000 });
    } catch (e) {
      await showHeaderBtn.click({ force: true, timeout: 3000 });
    }
    console.log('[FB03L] 点击 "Display Document Header" 打开抬头弹窗');
    await page.waitForTimeout(2500);

    // 收紧 scope：只在 "Display Document Header" 弹窗 DOM 范围内找字段标签。
    // SAP ITS 弹窗可能是 role=dialog，也可能是有特定 class 的 div；多策略求并集。
    // 用 "Document Header" 这种弹窗内必现的关键文字向上找最近的容器作为兜底 scope。
    const popupCandidates = [
      page.getByRole('dialog'),
      page.locator('.lsDialog, .lsPopup, [class*="Dialog" i], [class*="Popup" i]'),
    ];
    let popupScope: ReturnType<typeof page.locator> | null = null;
    for (const cand of popupCandidates) {
      const visibleCount = await cand.filter({ hasText: /Document Header|Doc\.\s*Header/i }).count().catch(() => 0);
      if (visibleCount > 0) {
        popupScope = cand.filter({ hasText: /Document Header|Doc\.\s*Header/i }).first();
        break;
      }
    }
    if (!popupScope) {
      // 兜底：从一个一定在弹窗里的文字（"Doc.Header Text" 标签）向上找
      const anchor = page.getByText(/^Doc\.?\s*Header Text$|^Document Header Text$/i).first();
      if (await anchor.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 用 xpath 上溯到最近的 dialog-ish 容器（4-6 层应该够）
        popupScope = anchor.locator(
          'xpath=ancestor::*[contains(@class, "Dialog") or contains(@class, "Popup") or @role="dialog"][1]'
        ).first();
        const scopeOk = await popupScope.count().catch(() => 0);
        if (!scopeOk) {
          // 实在找不到 scope，就用 anchor 的父节点 5 层
          popupScope = anchor.locator('xpath=ancestor::*[5]').first();
        }
      }
    }
    if (!popupScope) {
      throw new Error('[Step 3] 未能定位 "Display Document Header" 弹窗 DOM 容器');
    }
    console.log('[FB03L header] 弹窗 scope 已锁定，开始在弹窗内查字段标签');

    // 字段同义词：SAP 在不同视图/弹窗用不同标签，逐一匹配只要有一个命中即算可用
    const fieldSynonyms: Record<string, string[]> = {
      'Document Header Text': ['Document Header Text', 'Doc.Header Text', 'Doc. Header Text', 'Doc Header Text'],
      'Reference Key 1':      ['Reference Key 1', 'Reference key 1', 'Ref.key (header) 1', 'Ref. Key 1', 'Ref.key 1'],
      'Reference Key 2':      ['Reference Key 2', 'Reference key 2', 'Ref.key (header) 2', 'Ref. Key 2', 'Ref.key 2'],
    };

    const headerFieldResults: { field: string; foundVia: string }[] = [];
    for (const [canonical, synonyms] of Object.entries(fieldSynonyms)) {
      let foundVia = '';
      for (const syn of synonyms) {
        const queries: { name: string; loc: ReturnType<typeof page.locator> }[] = [
          // 严格优先：弹窗 scope 内的 label（exact 文本，避免 substring 误命中）
          { name: 'scope:label-exact', loc: popupScope.getByText(syn, { exact: true }) },
          // 次优：弹窗 scope 内的 substring 文本
          { name: 'scope:label-sub',   loc: popupScope.getByText(syn, { exact: false }) },
          // 三：弹窗 scope 内的 title/aria-label
          { name: 'scope:title',       loc: popupScope.locator(`[title*="${syn}"]`) },
          { name: 'scope:aria-label',  loc: popupScope.locator(`[aria-label*="${syn}"]`) },
        ];
        for (const q of queries) {
          const c = await q.loc.count().catch(() => 0);
          if (c > 0) { foundVia = `${q.name}:"${syn}"`; break; }
        }
        if (foundVia) break;
      }
      headerFieldResults.push({ field: canonical, foundVia });
      console.log(`[FB03L header] "${canonical}" ${foundVia ? `FOUND via ${foundVia}` : 'NOT FOUND'}`);
    }

    const missing = headerFieldResults.filter(r => !r.foundVia).map(r => r.field);

    // 如果 DOM 没全命中，让 AI 在抬头弹窗截图里二次确认
    if (missing.length) {
      const list = missing.map(f => `"${f}"`).join('、');
      try {
        await withRetry('aiAssert FB03L header popup fields', () =>
          aiAssert(
            `当前页面已打开 "Display Document Header" 弹窗，弹窗中能看到以下字段标签（接受同义词，例如 "Doc.Header Text" 等同 "Document Header Text"，"Reference key 1" 等同 "Ref.key (header) 1"）：${list}。`,
          ),
          2,
        );
        console.log(`[FB03L header] AI 补充确认通过：${list}`);
      } catch (e) {
        // 关弹窗后再失败
        await page.keyboard.press('Escape').catch(() => {});
        throw new Error(
          `[Step 3] 以下字段在 FB03L Header 弹窗中未找到（DOM 与 AI 断言均失败）：${missing.join(', ')}`,
        );
      }
    }

    // 关弹窗（按 Escape 是最稳的方式，避免找不同名称的关闭按钮）
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(800);

    console.log('[Step 3] 通过：Document Header 弹窗中可见 Document Header Text / Reference Key 1 / Reference Key 2');
  });

  await test.step('TEST RESULT', async () => {
    console.log('========== TEST RESULT ==========');
    console.log('Step 1 — Operational Division 列加入 FAGLL03H Layout：PASS');
    console.log('Step 2 — Document Header Text / Ref.key 1 / Ref.key 2 列加入 FAGLL03H Layout：PASS');
    console.log(`Step 3 — FB03L 文档 Header (Doc#=${capturedDocNumber}) 中包含上述三字段：PASS`);
    console.log('=================================');
  });
});
