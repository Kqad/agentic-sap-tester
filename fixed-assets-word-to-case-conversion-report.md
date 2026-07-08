# Fixed Assets Word -> SAPTEST12-16 Conversion Report

Generated: 2026-07-07

executionConfidence 说明：0.85+ = Word 中字段/动作较明确；0.65-0.84 = 流程明确但依赖图标/菜单定位；<0.65 = Word 脱敏、字段值缺失或需要运行时人工确认。

## saptest12 - SAP TEST 12 - Fixed Asset Single Asset Master Data

- Case file: `e2e/cases/saptest12.json`
- URL: https://zhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#
- T-code / entry: CJ20N / AS03
- Source: Fixed_Assets_BP_IT_B2P_GUI_Single_Asset_Master_Dat-SOP-30062026.docx
- Steps: 42
- Confidence summary: high=5, medium=0, low=0

| # | executionConfidence | API | Step | Evidence |
|---:|---:|---|---|---|
| 1 | 0.95 | `agent.aiTap()` | 进入 Menu | Copied from saptest1 OK Code Field setup steps. |
| 2 | 0.95 | `agent.aiTap()` | 点击 Settings | Copied from saptest1 OK Code Field setup steps. |
| 3 | 0.95 | `agent.aiTap()` | 点击 Visualization | Copied from saptest1 OK Code Field setup steps. |
| 4 | 0.95 | `agent.aiTap()` | 启用 Show OK Code Field | Copied from saptest1 OK Code Field setup steps. |
| 5 | 0.95 | `agent.aiTap()` | 保存 Visualization 设置 | Copied from saptest1 OK Code Field setup steps. |
| 6 |  | `agent.aiInput()` | 在 OK Code / 左上角命令输入框输入 CJ20N |  |
| 7 |  | `agent.aiTap()` | 进入 Project Builder |  |
| 8 |  | `agent.aiKeyboardPress()` | 按 Enter 打开 Project Builder |  |
| 9 |  | `agent.aiTap()` | 点击 Project Builder 工具栏上的 Open Project 图标 |  |
| 10 |  | `agent.aiInput()` | 在 Open Project 弹窗的 WBS element 字段输入 EH-000000254-01 |  |
| 11 |  | `agent.aiTap()` | 从 listbox shell 中选择匹配的 WBS/project 条目 |  |
| 12 |  | `agent.aiTap()` | 在 Project Builder Subproject EH-000000254 页面中打开 Edit 菜单 |  |
| 13 |  | `agent.aiTap()` | 选择创建资产/Create Asset 的菜单项或应用字段 |  |
| 14 |  | `agent.aiInput()` | 在 Create Asset 页面填写必填资产字段（资产类别、描述、公司代码等 |  |
| 15 |  | `agent.aiTap()` | 按当前 WBS 默认值补齐） |  |
| 16 |  | `agent.aiTap()` | 在弹出的 listbox shell 中选择正确的资产类别/字段值 |  |
| 17 |  | `agent.aiTap()` | 点击 Additional data 图标/页签 |  |
| 18 |  | `agent.aiTap()` | 切换到 Time-dependent 页签 |  |
| 19 |  | `agent.aiAssert()` | 点击返回/确认图标 sap_178 保存当前资产主数据页签 |  |
| 20 |  | `agent.aiTap()` | 在 Create Asset 页面点击 OK |  |
| 21 |  | `agent.aiTap()` | 回到 Project Builder Subproject 页面后点击保存图标 sap_190 |  |
| 22 |  | `agent.aiAssert()` | 确认状态栏出现 project EH-000000254 being changed 或项目已保存/已更改提示 |  |
| 23 |  | `agent.aiTap()` | 关闭 Performance/提示窗口 |  |
| 24 |  | `agent.aiTap()` | 重新点击 Open Project 图标 sap_244 |  |
| 25 |  | `agent.aiInput()` | 再次在 WBS element 字段输入 EH-000000254-01 |  |
| 26 |  | `agent.aiTap()` | 打开项目 |  |
| 27 |  | `agent.aiTap()` | 在 Project Builder Subproject 页面打开 Goto 菜单 |  |
| 28 |  | `agent.aiTap()` | 选择 Maintain Settlement Rule |  |
| 29 |  | `agent.aiQuery()` | 读取 Maintain Settlement Rule Distribution Rules 表格中的 settlement receiver |  |
| 30 |  | `agent.aiTap()` | 点击 More |  |
| 31 |  | `agent.aiTap()` | 打开 settlement receiver 对应的资产主数据 |  |
| 32 |  | `agent.aiQuery()` | 读取 Display Asset Master data 页面中的 Asset 字段值 |  |
| 33 |  | `agent.aiQuery()` | 保存为变量 assetId |  |
| 34 |  | `agent.aiAssert()` | 切换到 Time-dependent、Assignments、Origin 页签逐项检查 |  |
| 35 |  | `agent.aiAssert()` | 确认 Origin 页签中的 WBS element 为 EH-000000254-01 |  |
| 36 |  | `agent.aiTap()` | 返回 SAP Easy Access 后 |  |
| 37 |  | `agent.aiInput()` | 在 OK Code 输入 AS03 |  |
| 38 |  | `agent.aiTap()` | 进入 Display Asset Initial Screen |  |
| 39 |  | `agent.aiKeyboardPress()` | 按 Enter 打开 Display Asset |  |
| 40 |  | `agent.aiQuery()` | 在 Display Asset Initial Screen 输入前面创建/读取到的 assetId |  |
| 41 |  | `agent.aiAssert()` | 确认资产主数据可打开 |  |
| 42 |  | `agent.aiTap()` | WBS assignment / settlement rule 与 EH-000000254-01 匹配 |  |

## saptest13 - SAP TEST 13 - Fixed Asset Capitalization of Current Asset

- Case file: `e2e/cases/saptest13.json`
- URL: https://bhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#
- T-code / entry: ABSOL / AS03
- Source: Fixed_Assets_BP_IT_B2P_GUI_Capitalization_of_curre-SOP-30062026.docx
- Steps: 40
- Confidence summary: high=17, medium=17, low=6

| # | executionConfidence | API | Step | Evidence |
|---:|---:|---|---|---|
| 1 | 0.95 | `agent.aiTap()` | 进入 Menu | Copied from saptest1 OK Code Field setup steps. |
| 2 | 0.95 | `agent.aiTap()` | 点击 Settings | Copied from saptest1 OK Code Field setup steps. |
| 3 | 0.95 | `agent.aiTap()` | 点击 Visualization | Copied from saptest1 OK Code Field setup steps. |
| 4 | 0.95 | `agent.aiTap()` | 启用 Show OK Code Field | Copied from saptest1 OK Code Field setup steps. |
| 5 | 0.95 | `agent.aiTap()` | 保存 Visualization 设置 | Copied from saptest1 OK Code Field setup steps. |
| 6 | 0.9 | `agent.aiInput()` | 在 OK Code / 左上角命令输入框输入 ABSOL，进入 Create General Header Data for Posting。 | Selecting from dropdown - ABSOL in edit |
| 7 | 0.84 | `agent.aiKeyboardPress()` | 按 Enter 打开 ABSOL 资产交易录入页面。 | Create General Header Data for Posting |
| 8 | 0.92 | `agent.aiInput()` | 在 Asset 字段输入 _mobilephone_。 | Reading from field - value _mobilephone_ in asset |
| 9 | 0.7 | `agent.aiInput()` | 在 Sub-number 字段粘贴/输入 <mobilephone>。 | Pasting into field - value <mobilephone> in sub-number |
| 10 | 0.91 | `agent.aiInput()` | 在 Trans. type 字段输入 1050。 | Reading from field - value 1050 in trans. type |
| 11 | 0.75 | `agent.aiTap()` | 打开 Transaction Type 搜索帮助/下拉列表。 | Viewing Transaction Type entries found |
| 12 | 0.76 | `agent.aiTap()` | 在 Transaction Type 列表中选择匹配的 1050 交易类型。 | Focusing on Table - ttype transaction type name |
| 13 | 0.82 | `agent.aiTap()` | 点击 OK 图标确认交易类型。 | Left Click on icon - OK |
| 14 | 0.86 | `agent.aiInput()` | 在 Document date 字段输入 29.05.2026。 | Reading a label - 29.05.2026 |
| 15 | 0.84 | `agent.aiInput()` | 在 Asset value date 字段输入 29.05.2026。 | Reading from field - asset value date |
| 16 | 0.9 | `agent.aiInput()` | 在 Text 字段输入 mobilephone。 | Posted message contains mobilephone |
| 17 | 0.88 | `agent.aiInput()` | 确认/输入公司代码 JPL1。 | Reading a label - jpl1 |
| 18 | 0.86 | `agent.aiTap()` | 切换到 Additional details 页签。 | Navigating to Tab - additional details |
| 19 | 0.45 | `agent.aiInput()` | 补齐 Additional details 中的必填字段（Word 导出未给出字段名/值，按页面默认或测试数据维护）。 | Editing a field with element name; value masked |
| 20 | 0.58 | `agent.aiTap()` | 点击检查/模拟或行项目按钮，进入行项目/Performance 窗口。 | Left Click on icon - sap_238; Performance <name> |
| 21 | 0.5 | `agent.aiTap()` | 在行项目表格中选择/确认 FIOU Center 或成本对象行。 | Focusing on Table - fiou ceniter |
| 22 | 0.75 | `agent.aiTap()` | 点击保存图标 sap_190 过账资产交易。 | Left Click on icon - sap_190 |
| 23 | 0.93 | `agent.aiAssert()` | 确认状态栏显示 asset transaction posted with document no.，且文本包含 mobilephone 和 company code JPL1。 | Reading a label - asset transaction posted with document no. 0280 mobilephone in accto princ. jpl1 |
| 24 | 0.74 | `agent.aiTap()` | 关闭 Performance/提示窗口。 | Left Click on icon - Close |
| 25 | 0.74 | `agent.aiInput()` | 进入 Display Asset Initial Screen，在 OK Code 输入 AS03。 | Enter Asset Transaction -> Display Asset Initial screen |
| 26 | 0.82 | `agent.aiKeyboardPress()` | 按 Enter 打开 Display Asset Initial Screen。 | Display Asset Initial screen |
| 27 | 0.9 | `agent.aiInput()` | 在 Display Asset Initial Screen 的 Asset 字段输入 _mobilephone_。 | Reading from field - value _mobilephone_ in asset |
| 28 | 0.86 | `agent.aiTap()` | 点击 Asset values 图标/按钮。 | Left Click on icon - Asset values |
| 29 | 0.82 | `agent.aiQuery()` | 读取 Asset Explorer 中 01 IFRS in local currency JPY 和 E10 Local GAAP in local currency 的资产值区域。 | Reading labels - 01 ifrs in local currency jpy; e10 local gaap |
| 30 | 0.77 | `agent.aiTap()` | 返回 SAP Easy Access，重新输入 ABSOL 开始第二笔 capitalization/currency difference posting。 | Document second ABSOL flow starts at step 16 |
| 31 | 0.42 | `agent.aiInput()` | 在第二笔 ABSOL 中维护 Trans. type（Word 仅显示字段名，需按 SOP 测试数据确认）。 | Reading from field - trans. type; no value exported |
| 32 | 0.82 | `agent.aiInput()` | 第二笔交易输入 Document date / Asset value date 为 29.05.2026。 | Reading label - 29.05.2026 |
| 33 | 0.48 | `agent.aiInput()` | 维护 Offsetting account。 | Reading from field - offsetting account; value masked |
| 34 | 0.9 | `agent.aiInput()` | 在 Text 字段输入 Capitalization currency diffr。 | Reading from field - value Capitalization currency diffr in text |
| 35 | 0.58 | `agent.aiTap()` | 切换到 Additional details 并补齐必填字段。 | Navigating to Tab - additional details |
| 36 | 0.72 | `agent.aiTap()` | 保存第二笔资产交易。 | Left Click on icon - sap_190 |
| 37 | 0.75 | `agent.aiInput()` | 再次打开 AS03 Display Asset。 | Display Asset Initial screen repeated |
| 38 | 0.82 | `agent.aiInput()` | 在 Display Asset Initial Screen 输入/确认 company code JPL1。 | Editing text in field - company code; earlier JPL1 label |
| 39 | 0.86 | `agent.aiTap()` | 打开 Asset values。 | Left Click on icon - Asset values |
| 40 | 0.84 | `agent.aiAssert()` | 确认 Asset Explorer 可看到 01 IFRS/local currency 与 E10 Local GAAP/local currency 的资产值/币种行。 | Focusing on Table - crcy; IFRS/local GAAP labels |

## saptest14 - SAP TEST 14 - Fixed Asset Single Asset Sale

- Case file: `e2e/cases/saptest14.json`
- URL: https://zhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#
- T-code / entry: ABAON / AS03
- Source: Fixed_Assets_BP_IT_B2P_GUI_Single_asset_sale-SOP-30062026.docx
- Steps: 31
- Confidence summary: high=7, medium=14, low=10

| # | executionConfidence | API | Step | Evidence |
|---:|---:|---|---|---|
| 1 | 0.95 | `agent.aiTap()` | 进入 Menu | Copied from saptest1 OK Code Field setup steps. |
| 2 | 0.95 | `agent.aiTap()` | 点击 Settings | Copied from saptest1 OK Code Field setup steps. |
| 3 | 0.95 | `agent.aiTap()` | 点击 Visualization | Copied from saptest1 OK Code Field setup steps. |
| 4 | 0.95 | `agent.aiTap()` | 启用 Show OK Code Field | Copied from saptest1 OK Code Field setup steps. |
| 5 | 0.95 | `agent.aiTap()` | 保存 Visualization 设置 | Copied from saptest1 OK Code Field setup steps. |
| 6 | 0.78 | `agent.aiInput()` | 在 OK Code / 左上角命令输入框输入 ABAON，进入 Asset Sale Without Customer。 | Enter Asset Transaction Asset Sale Without Customer |
| 7 | 0.82 | `agent.aiKeyboardPress()` | 按 Enter 打开 Enter Asset Transaction Asset Sale Without Customer 页面。 | Next view: Asset Sale Without Customer |
| 8 | 0.6 | `agent.aiInput()` | 在 Document date 字段输入 SOP 测试日期。 | Reading from field - document date; value not exported |
| 9 | 0.6 | `agent.aiInput()` | 在 Asset value date 字段输入 SOP 测试日期。 | Reading from field - asset value date; value not exported |
| 10 | 0.55 | `agent.aiInput()` | 在 Manual revenue 字段输入 sale revenue。 | Reading from field - manual revenue; value not exported |
| 11 | 0.86 | `agent.aiTap()` | 切换到 Additional details 页签。 | Navigating to Tab - additional details |
| 12 | 0.48 | `agent.aiInput()` | 填写 Additional details 中的必填字段。 | Editing a field with element name; field/value masked |
| 13 | 0.58 | `agent.aiTap()` | 从 listbox shell 中选择匹配条目。 | Selecting an application field |
| 14 | 0.84 | `agent.aiTap()` | 切换到 Partial retirement 页签。 | Navigating to Tab - partia retirement |
| 15 | 0.62 | `agent.aiInput()` | 在 Percentage rate 字段输入部分出售比例。 | Editing text in field - percentage rate |
| 16 | 0.62 | `agent.aiTap()` | 在 6A line items / amount currency cost center 表格中确认行项目。 | Reading label - 6a line items; Focusing on Table - amount crcy cost center |
| 17 | 0.76 | `agent.aiTap()` | 点击保存图标 sap_190 过账资产出售。 | Left Click on icon - sap_190 |
| 18 | 0.8 | `agent.aiTap()` | 在 Document lines Display messages 弹窗中点击 OK。 | Document lines Display messages; Left Click on icon - OK |
| 19 | 0.56 | `agent.aiInput()` | 进入 Display Asset / Asset Explorer，输入刚才出售的资产编号。 | Enter asset transaction -> Asset Explorer; asset value masked |
| 20 | 0.82 | `agent.aiQuery()` | 在 Asset Explorer 表格读取 amount / ttype / transaction type name，确认出售交易行存在。 | Focusing on Table - amount ttype transaction type name |
| 21 | 0.82 | `agent.aiTap()` | 打开 Documents for Asset。 | Display Asset Master data -> Documents for Asset |
| 22 | 0.58 | `agent.aiInput()` | 在 Documents for Asset 中输入/确认 Depreciation area。 | Reading from field - depreciation area; value not exported |
| 23 | 0.72 | `agent.aiTap()` | 选择 Overview of Asset Accounting Documents 中的 transaction 行。 | Reading label - transaction; Selecting an application field |
| 24 | 0.88 | `agent.aiTap()` | 在 Overview of Asset Accounting Documents 中点击 Reverse。 | Left Click on icon - Reverse |
| 25 | 0.62 | `agent.aiInput()` | 在 Specifications for Reverse Posting 中输入 Reversal reason。 | Reading from field - reversal reason; value not exported |
| 26 | 0.74 | `agent.aiTap()` | 打开 Reason for Reversal 搜索帮助并选择匹配原因。 | Viewing Reason for Reversal entries; Focusing on Table - text |
| 27 | 0.82 | `agent.aiTap()` | 点击 OK 确认 reversal reason。 | Left Click on icon - OK |
| 28 | 0.75 | `agent.aiTap()` | 在 Overview 中确认 reversal line items 后点击保存 sap_190。 | Focusing on Table - amount crcy cost center; Left Click on icon - sap_190 |
| 29 | 0.8 | `agent.aiTap()` | 在 Document lines Display messages 中点击 OK。 | Left Click on icon - OK |
| 30 | 0.72 | `agent.aiQuery()` | 返回 Display Asset Master data，读取 Plnd retirement on 或资产出售相关状态。 | Reading from field - plnd retirement on; asset values |
| 31 | 0.82 | `agent.aiAssert()` | 确认 Documents for Asset / Asset Explorer 中存在出售交易和对应 reversal/冲销记录。 | Documents for Asset; Overview; Asset Explorer table |

## saptest15 - SAP TEST 15 - Fixed Asset Single Asset Scrapping

- Case file: `e2e/cases/saptest15.json`
- URL: https://zhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#
- T-code / entry: ABAVN / AS03
- Source: Fixed_Assets_BP_IT_B2P_GUI_Single_asset_scrapping-SOP-30062026.docx
- Steps: 31
- Confidence summary: high=9, medium=17, low=5

| # | executionConfidence | API | Step | Evidence |
|---:|---:|---|---|---|
| 1 | 0.95 | `agent.aiTap()` | 进入 Menu | Copied from saptest1 OK Code Field setup steps. |
| 2 | 0.95 | `agent.aiTap()` | 点击 Settings | Copied from saptest1 OK Code Field setup steps. |
| 3 | 0.95 | `agent.aiTap()` | 点击 Visualization | Copied from saptest1 OK Code Field setup steps. |
| 4 | 0.95 | `agent.aiTap()` | 启用 Show OK Code Field | Copied from saptest1 OK Code Field setup steps. |
| 5 | 0.95 | `agent.aiTap()` | 保存 Visualization 设置 | Copied from saptest1 OK Code Field setup steps. |
| 6 | 0.86 | `agent.aiInput()` | 在 OK Code / 左上角命令输入框输入 ABAVN，进入 Asset Retirement by Scrapping。 | Enter Asset Transaction Asset Retirement by Scrapping |
| 7 | 0.82 | `agent.aiKeyboardPress()` | 按 Enter 打开 Enter Asset Transaction Asset Retirement by Scrapping 页面。 | Next: Asset Retirement by Scrapping |
| 8 | 0.6 | `agent.aiInput()` | 在 Document date 字段输入 SOP 测试日期。 | Reading from field - document date; value not exported |
| 9 | 0.6 | `agent.aiInput()` | 在 Asset value date 字段输入 SOP 测试日期。 | Reading from field - asset value date; value not exported |
| 10 | 0.58 | `agent.aiTap()` | 从 listbox shell 中选择匹配资产/字段条目。 | Selecting an application field; listbox shell |
| 11 | 0.86 | `agent.aiTap()` | 切换到 Additional details 页签。 | Navigating to Tab - additional details |
| 12 | 0.48 | `agent.aiInput()` | 填写 Additional details 中的必填字段。 | Editing a field with element name; value masked |
| 13 | 0.84 | `agent.aiTap()` | 切换到 Partial retirement 页签。 | Navigating to Tab - partia retirement |
| 14 | 0.68 | `agent.aiInput()` | 在 Percentage rate 字段输入报废比例。 | Reading from field - percentage rate; Editing a field |
| 15 | 0.68 | `agent.aiTap()` | 在 6A line items 的 amount / currency / cost center / order 表格中确认行项目。 | Reading label - 6a line items; Focusing on Table - amount crcy cost ctr order |
| 16 | 0.76 | `agent.aiTap()` | 点击保存图标 sap_190 过账资产报废。 | Left Click on icon - sap_190 |
| 17 | 0.8 | `agent.aiTap()` | 在 Document lines Display messages 弹窗中点击 OK。 | Document lines Display messages; Left Click on icon - OK |
| 18 | 0.55 | `agent.aiInput()` | 进入 Display Asset Master data，输入/确认被报废资产编号。 | Display Asset Master data; asset value masked |
| 19 | 0.82 | `agent.aiQuery()` | 在 Asset Explorer 读取 value、amount、ttype、transaction type name，确认报废交易行存在。 | Focusing on Table - value; amount ttype transaction type name |
| 20 | 0.7 | `agent.aiTap()` | 从 SAP Easy Access 打开 Documents for Asset。 | SAP Easy Access -> Documents for Asset |
| 21 | 0.68 | `agent.aiInput()` | 在 Documents for Asset 中输入 Fiscal Year。 | Editing text in field - Fiscal Year |
| 22 | 0.74 | `agent.aiTap()` | 在 Overview of Asset Accounting Documents 中选择报废 transaction 行。 | Overview of Asset Accounting Documents |
| 23 | 0.88 | `agent.aiTap()` | 点击 Reverse。 | Left Click on icon - Reverse |
| 24 | 0.86 | `agent.aiInput()` | 在 Specifications for Reverse Posting 中输入 Reversal reason 01A。 | Reading from field - value 01a in reversal reason |
| 25 | 0.78 | `agent.aiTap()` | 在 listbox shell 中选择 reversal reason 01A。 | Viewing listbox shell; Selecting application field |
| 26 | 0.7 | `agent.aiTap()` | 打开 Reason for Reversal 搜索结果并选择匹配文本。 | Viewing Reason for Reversal entries; Focusing on Table - text |
| 27 | 0.82 | `agent.aiTap()` | 点击 OK 确认 reversal reason。 | Left Click on icon - OK |
| 28 | 0.72 | `agent.aiTap()` | 在 Overview 中确认冲销行项目后点击保存 sap_190。 | Focusing on Table ---; Left Click on icon - sap_190 |
| 29 | 0.8 | `agent.aiTap()` | 在 Document lines Display messages 中点击 OK。 | Left Click on icon - OK |
| 30 | 0.76 | `agent.aiQuery()` | 返回 Display Asset Master data / Asset values，读取报废后资产状态和值。 | Display Asset Master data; Asset Explorer |
| 31 | 0.84 | `agent.aiAssert()` | 确认 Asset Explorer / Documents for Asset 中存在 scrapping transaction 和 reversal transaction。 | Asset Explorer table; Documents for Asset |

## saptest16 - SAP TEST 16 - IFRS16 Lease Liability Reclassification

- Case file: `e2e/cases/saptest16.json`
- URL: https://zhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#
- T-code / entry: OBJREG / Reclassification
- Source: IFRS16_Leasing_BP_IT_B2P_RE_FX_YEC_LeaseLiab_Recl-SOP-30062026 (1).docx
- Steps: 37
- Confidence summary: high=11, medium=18, low=8

| # | executionConfidence | API | Step | Evidence |
|---:|---:|---|---|---|
| 1 | 0.95 | `agent.aiTap()` | 进入 Menu | Copied from saptest1 OK Code Field setup steps. |
| 2 | 0.95 | `agent.aiTap()` | 点击 Settings | Copied from saptest1 OK Code Field setup steps. |
| 3 | 0.95 | `agent.aiTap()` | 点击 Visualization | Copied from saptest1 OK Code Field setup steps. |
| 4 | 0.95 | `agent.aiTap()` | 启用 Show OK Code Field | Copied from saptest1 OK Code Field setup steps. |
| 5 | 0.95 | `agent.aiTap()` | 保存 Visualization 设置 | Copied from saptest1 OK Code Field setup steps. |
| 6 | 0.55 | `agent.aiQuery()` | 读取工作簿 RBJP_BP_IT_B2P_RE-FX_YEC_LeaseLiab_Reclassification 中的测试参数。 | Reading a Workbook; Reading from worksheet |
| 7 | 0.58 | `agent.aiTap()` | 从 SAP Easy Access 用户菜单打开 Info System Reclassification。 | ZHL SAP Easy Access -> Info System Reclassification; menu path not exported |
| 8 | 0.78 | `agent.aiTap()` | 打开 Sort Method 搜索帮助。 | Reading from field - sort method; Sort Method entries found |
| 9 | 0.8 | `agent.aiTap()` | 在 Sort Method 搜索结果中选择 sort method 1。 | Reading a label - sort method 1; Focusing on Table - description |
| 10 | 0.62 | `agent.aiInput()` | 在 Info System Reclassification 页面输入 Key date。 | Reading from field - key date; value from workbook |
| 11 | 0.58 | `agent.aiTap()` | 从 listbox shell 中选择匹配的 key date/参数条目。 | Viewing listbox shell; Selecting an application field |
| 12 | 0.72 | `agent.aiTap()` | 执行 Info System Reclassification。 | Left Click on icon - sap_180; Reclassification (<Date>) |
| 13 | 0.84 | `agent.aiAssert()` | 确认出现 Reclassification (<Date>) 结果页。 | Viewing ZHL Reclassification (<Date>) |
| 14 | 0.72 | `agent.aiTap()` | 返回 SAP Easy Access。 | Reclassification -> SAP Easy Access |
| 15 | 0.9 | `agent.aiInput()` | 在 OK Code / 左上角命令输入框输入 OBJREG。 | Selecting from dropdown - OBJREG in edit |
| 16 | 0.82 | `agent.aiKeyboardPress()` | 按 Enter 打开 Sorted List for Valuation Objects。 | Sorted <name> for Valuation Objects |
| 17 | 0.78 | `agent.aiTap()` | 打开 Sort Method 搜索帮助并选择 sort method 2。 | Reading a label - sort method 2 |
| 18 | 0.8 | `agent.aiTap()` | 打开 Valuation Area for FI Year End Closing 搜索帮助并选择 valuation area 2。 | valuation area for f year-end closing 2 |
| 19 | 0.9 | `agent.aiInput()` | 在 Valuation key date 输入 31.03.2026。 | Reading from field - value 31.03.2026o in valuation key date |
| 20 | 0.86 | `agent.aiTap()` | 切换到 Valuation objects 页签。 | Navigating to Tab - valuation objects |
| 21 | 0.84 | `agent.aiInput()` | 在 Aggregation ledger 字段选择 Bosch valuation ledger IFRS16。 | Reading label - bosch valuation ledger ifrs16 |
| 22 | 0.6 | `agent.aiInput()` | 在 G/L account 字段输入 lease liabilities 对应科目。 | Reading a label - lease liabilities; G/L account value masked |
| 23 | 0.55 | `agent.aiInput()` | 在 Identif. val. obj 字段选择或输入估值对象。 | Reading from field - identif. val. obj; value masked |
| 24 | 0.86 | `agent.aiTap()` | 切换到 Parameters 页签。 | Navigating to Tab - parameters |
| 25 | 0.86 | `agent.aiTap()` | 切换到 Postings 页签。 | Navigating to Tab - postinqs |
| 26 | 0.78 | `agent.aiTap()` | 点击执行图标 sap_180 进行测试运行/生成日志。 | Left Click on icon - sap_180; Messages |
| 27 | 0.82 | `agent.aiTap()` | 点击 Messages 查看 Display logs。 | Left Click on icon - Messages; Display logs |
| 28 | 0.72 | `agent.aiAssert()` | 确认 Display logs 中没有阻断性错误。 | Display logs |
| 29 | 0.8 | `agent.aiTap()` | 返回 Sorted Valuation Objects 页面，并确认 Post documents immediately 选项。 | sap_178; Reading label - post documents immediately |
| 30 | 0.58 | `agent.aiInput()` | 在 Valuation objects 页签输入 Debit flow type。 | Reading from field - debit flow type; value masked |
| 31 | 0.9 | `agent.aiInput()` | 确认 Credit flow type 为 L40。 | Reading from field - value L40 in credit flow type |
| 32 | 0.82 | `agent.aiTap()` | 切换到 Postings 页签，并确认 Perform test run。 | Navigating to Tab - postinqs; Reading a label - perform test run |
| 33 | 0.78 | `agent.aiTap()` | 点击执行图标 sap_180 并打开 Messages。 | Left Click on icon - sap_180; Messages |
| 34 | 0.62 | `agent.aiTap()` | 返回后取消/关闭 test run 标记，准备正式 posting。 | sap_178; Post documents immediately |
| 35 | 0.68 | `agent.aiTap()` | 再次点击执行图标 sap_180 进行正式过账。 | Left Click on icon - sap_180; Postings |
| 36 | 0.72 | `agent.aiTap()` | 打开 Postings 结果并返回。 | Left Click on icon - Postings; sap_178 |
| 37 | 0.78 | `agent.aiAssert()` | 确认 IFRS16 lease liability reclassification 运行完成，日志/过账结果无错误。 | Display logs / Postings flow completed |

