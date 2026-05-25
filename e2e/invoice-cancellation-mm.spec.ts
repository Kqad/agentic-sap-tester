import { test, expect } from './fixture';
import type { Page } from '@playwright/test';
import params from './cases/invoice-cancellation-mm.json' with { type: 'json' };

test.setTimeout(20 * 60 * 1000);

// SAP WebGUI 字段填充：用 Playwright accessibility label 定位（确定性），
// 部分 SAP 日期/code picker 标 readonly 时回退到 keyboard.type。
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

test('MR8M → FB03L → FBL1N: MM invoice cancellation flow', async ({
  page,
  ai,
  aiTap,
  aiQuery,
  aiAssert,
}) => {
  // 跳过守卫：MR8M 是破坏性操作，缺少真实数据时整体跳过
  const placeholderInvoice =
    !params.mr8mFilter.invoiceDocumentNumber
    || /^PLACEHOLDER/i.test(params.mr8mFilter.invoiceDocumentNumber);

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
      const cleanTc = tc.replace(/^\/n/, '');
      const base = params.sapUrl.replace(/#.*$/, '');
      const tcUrl = `${base}?~transaction=${encodeURIComponent(cleanTc)}`;
      console.log(`[goToTransaction] 顶部 combobox 不可见，走 URL：${tcUrl}`);
      await page.goto(tcUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2500);
    await dismissInfoPopupIfAny();
  };

  // SAP status bar 文本（成功/错误消息一般在底部 lsMessageBar）
  const readStatusBar = async (): Promise<string> => {
    const texts = await page
      .locator('[role="status"], .lsMessageBar, .urMsgText, [class*="MessageArea"]')
      .allTextContents()
      .catch(() => [] as string[]);
    return texts.join(' | ').trim();
  };

  let capturedReversalDoc = '';

  await test.step('打开 SAP WebGUI 首页', async () => {
    await page.goto(params.sapUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
    await dismissInfoPopupIfAny();
  });

  await test.step('Step 1: MR8M — Cancel MM invoice', async () => {
    if (placeholderInvoice) {
      test.skip(
        true,
        '[Step 1 SKIPPED] mr8mFilter.invoiceDocumentNumber 为占位符，'
        + 'MR8M 会真实反转凭证 — 请先在 cases/invoice-cancellation-mm.json 填入真实测试 invoice 号、年度、reversal reason 再运行。',
      );
      return;
    }

    await goToTransaction(params.transactionCodes.cancelInvoice);

    await fillSapField(page, 'Invoice doc. no.', params.mr8mFilter.invoiceDocumentNumber)
      .catch(() => fillSapField(page, 'Invoice Document No.', params.mr8mFilter.invoiceDocumentNumber))
      .catch(() => fillSapField(page, 'Document Number', params.mr8mFilter.invoiceDocumentNumber));

    await fillSapField(page, 'Fiscal Year', params.mr8mFilter.fiscalYear);
    await fillSapField(page, 'Reversal Reason', params.mr8mFilter.reversalReason)
      .catch(() => fillSapField(page, 'Reason for Reversal', params.mr8mFilter.reversalReason));

    // best-effort form dump
    try {
      const snap = await withRetry('dump MR8M form', () =>
        aiQuery<{ invoiceDoc: string; fiscalYear: string; reversalReason: string }>(
          '从当前 MR8M 反转发票选择界面读取已填字段，返回 JSON: '
          + '{ "invoiceDoc": <Invoice doc no 值>, '
          + '"fiscalYear": <Fiscal Year 值>, '
          + '"reversalReason": <Reversal Reason 值> }',
        ),
        2,
      );
      console.log('[MR8M FORM DUMP]', JSON.stringify(snap));
    } catch (e) {
      console.log('[MR8M FORM DUMP] skipped due to AI error:', (e as Error).message);
    }

    // SAP 标准 Save 快捷键 Ctrl+S；toolbar Save 按钮作为兜底
    console.log('[MR8M] 执行 Save (Ctrl+S)');
    await page.keyboard.press('Control+S');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2000);

    // 抓底部状态栏，如果显示 "Document XXX created" / "posting was reversed" 则视为成功
    const statusText = await readStatusBar();
    console.log('[MR8M STATUS BAR]', statusText || '(empty)');

    let statusOk = /reversed|created|posted|cleared/i.test(statusText);
    if (!statusOk) {
      // AI 兜底确认：要么看到成功消息，要么看到已经回到 MR8M 选择界面（说明动作完成）
      try {
        const snap = await withRetry('aiQuery MR8M result', () =>
          aiQuery<{ success: boolean; message: string; reversalDocumentNumber: string }>(
            '观察当前 SAP MR8M 界面执行 Save 后的结果。返回 JSON: '
            + '{ "success": <true 如果显示反转成功 / 凭证已创建 / 已 cleared 等正向消息；否则 false>, '
            + '"message": <底部消息或弹窗中的文字>, '
            + '"reversalDocumentNumber": <新创建的反转凭证号；如果消息中没有提到则空串> }',
          ),
          2,
        );
        console.log('[MR8M AI RESULT]', JSON.stringify(snap));
        statusOk = !!snap?.success;
        if (snap?.reversalDocumentNumber) {
          capturedReversalDoc = String(snap.reversalDocumentNumber).trim();
        }
      } catch (e) {
        console.log('[MR8M AI RESULT] skipped:', (e as Error).message);
      }
    } else {
      // 从状态栏文字中正则提取凭证号
      const m = statusText.match(/\b(\d{8,12})\b/);
      if (m) capturedReversalDoc = m[1];
    }

    expect(statusOk, `MR8M 反转未成功；status bar 文本: "${statusText}"`).toBeTruthy();
    console.log('[Step 1] 通过：MM invoice 反转成功，反转凭证号 =', capturedReversalDoc || '(未抓到)');
  });

  await test.step('Step 2: FB03L — verify reversal FI document is type KC', async () => {
    const docToCheck = capturedReversalDoc || params.fb03Filter.documentNumber;
    if (!docToCheck) {
      test.skip(
        true,
        '[Step 2 SKIPPED] 未抓到反转凭证号，且 fb03Filter.documentNumber 为空。'
        + '如需运行 Step 2，请在 JSON 中预填一个已知的反转凭证号。',
      );
      return;
    }

    await goToTransaction('/n' + params.transactionCodes.documentDisplay);
    await page.waitForTimeout(1500);

    await fillSapField(page, 'Document Number', docToCheck);
    await fillSapField(page, 'Company Code',    params.fb03Filter.companyCode);
    await fillSapField(page, 'Fiscal Year',     params.fb03Filter.fiscalYear);
    await fillSapField(page, 'Ledger',          params.fb03Filter.ledger).catch(() => {
      console.log('[FB03L] Ledger 字段未找到，跳过（部分 layout 不强制）');
    });

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
      console.log('[FB03L FORM DUMP] skipped:', (e as Error).message);
    }

    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(4000);
    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2000);

    // 在 FB03L 文档显示界面读 Document Type
    const expectedType = params.expected.documentType;
    let docType = '';

    // 先尝试 DOM：包含 "Doc.Type" / "Document Type" 的标签邻近 input
    for (const candidate of [
      page.locator('input[title*="Document Type"]'),
      page.locator('input[title*="Doc.Type"]'),
      page.getByLabel(/Document Type|Doc\.\s*Type/i),
    ]) {
      const c = await candidate.count().catch(() => 0);
      if (c > 0) {
        const v = await candidate.first().inputValue().catch(() => '');
        if (v) { docType = v.trim(); break; }
      }
    }

    if (!docType) {
      // AI 兜底
      try {
        const snap = await withRetry('aiQuery FB03L doc type', () =>
          aiQuery<{ documentType: string; documentNumber: string; companyCode: string }>(
            '从当前 SAP FB03L 文档显示界面 (G/L View) 读取该 FI 凭证的属性，返回 JSON: '
            + '{ "documentType": <"Document Type" / "Doc.Type" 字段显示的二字母代码，例如 "KC" / "KR" / "RE">, '
            + '"documentNumber": ..., "companyCode": ... }',
          ),
          2,
        );
        console.log('[FB03L DOC HEADER]', JSON.stringify(snap));
        docType = String(snap?.documentType ?? '').trim().toUpperCase();
      } catch (e) {
        console.log('[FB03L DOC HEADER] AI failed:', (e as Error).message);
      }
    }

    expect(docType, `FB03L 凭证类型不符；实际="${docType}"，期望="${expectedType}"`).toBe(expectedType);
    console.log(`[Step 2] 通过：反转凭证 ${docToCheck} 类型 = ${docType}（期望 ${expectedType}）`);
  });

  await test.step('Step 3: FBL1N — vendor open items display', async () => {
    await goToTransaction('/n' + params.transactionCodes.vendorLineItems);
    await page.waitForTimeout(1500);

    await fillSapField(page, 'Vendor Account', params.fbl1nFilter.vendorAccount)
      .catch(() => fillSapField(page, 'Vendor account', params.fbl1nFilter.vendorAccount))
      .catch(() => fillSapField(page, 'Supplier', params.fbl1nFilter.vendorAccount));

    await fillSapField(page, 'Company Code', params.fbl1nFilter.companyCode);

    // Open Items radio
    if (params.fbl1nFilter.openItems) {
      const openRadio = page.getByRole('radio', { name: /^Open\s*items?$/i }).first();
      const isChecked = await openRadio.isChecked().catch(() => false);
      if (!isChecked) {
        try {
          await openRadio.click({ timeout: 3000 });
        } catch (e) {
          await openRadio.click({ force: true, timeout: 3000 });
        }
        await page.waitForTimeout(600);
      } else {
        console.log('[FBL1N] Open items 已选中，跳过');
      }
    }

    // Open at key date
    await fillSapField(page, 'Open at key date', params.fbl1nFilter.openAtKeyDate).catch(async () => {
      const boxes = page.locator('input[title*="Open at key date"]');
      if ((await boxes.count()) > 0) {
        const box = boxes.first();
        await box.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.keyboard.type(params.fbl1nFilter.openAtKeyDate, { delay: 20 });
      } else {
        console.log('[FBL1N] Open at key date 字段未找到，跳过');
      }
    });

    try {
      const snap = await withRetry('dump FBL1N form', () =>
        aiQuery<{ vendor: string; companyCode: string; openAtKeyDate: string; openItemsSelected: boolean }>(
          '从当前 FBL1N 选择界面读取已填字段，返回 JSON: '
          + '{ "vendor": <Vendor Account 值>, "companyCode": <Company Code 值>, '
          + '"openAtKeyDate": <Open at key date 值>, '
          + '"openItemsSelected": <Open items 单选是否选中> }',
        ),
        2,
      );
      console.log('[FBL1N FORM DUMP]', JSON.stringify(snap));
    } catch (e) {
      console.log('[FBL1N FORM DUMP] skipped:', (e as Error).message);
    }

    // Execute
    const executeBtn = page.getByRole('button', { name: 'Execute', exact: false }).first();
    await executeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await executeBtn.click().catch(async () => {
      await page.keyboard.press('F8');
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    await dismissInfoPopupIfAny();
    await page.waitForTimeout(2000);

    // 进入报表的正向标志：行项目网格 / Drilldown / 行计数大于 0
    const drilldown = page.getByRole('button', { name: /^Drilldown$/i }).first();
    const onReport = await drilldown.isVisible({ timeout: 8000 }).catch(() => false);

    let rowCount = 0;
    if (onReport) {
      const rows = page.locator('[role="row"]');
      rowCount = await rows.count().catch(() => 0);
      console.log(`[FBL1N] 报表加载，行数（含表头）= ${rowCount}`);
    } else {
      // AI 兜底确认有数据
      try {
        await withRetry('aiAssert FBL1N has items', () =>
          aiAssert(
            '当前 SAP FBL1N 屏幕已经显示了至少一行 Vendor Line Item 数据（不是仍然处于选择界面）。'
            + '判据：能看到带列名 (Document Number / Posting Date / Amount 等) 的数据表格。',
          ),
          2,
        );
      } catch (e) {
        throw new Error(`[FBL1N] Execute 后未进入 vendor line item 列表：${(e as Error).message}`);
      }
    }

    console.log('[Step 3] 通过：FBL1N 显示 vendor line items');
  });

  await test.step('TEST RESULT', async () => {
    console.log('========== TEST RESULT ==========');
    console.log(`Step 1 — MR8M Cancel MM invoice: PASS (reversal doc=${capturedReversalDoc || 'n/a'})`);
    console.log(`Step 2 — FB03L 反转凭证类型 = ${params.expected.documentType}: PASS`);
    console.log(`Step 3 — FBL1N vendor open items 显示: PASS`);
    console.log('=================================');
  });
});
