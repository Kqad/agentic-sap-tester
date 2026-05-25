# SAP WebGUI 测试用例整理

**目标测试平台**: https://mhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#

**来源文件**: `S4_Test_Case_Automatic_Testing_AI.xlsx` (Sheet1)

**筛选规则**:
- 保留主要通过 **SAP GUI 事务码 (T-Code)** 执行的测试用例,这些都可在 SAP WebGUI (ITS) 中运行。
- 排除纯 Fiori Launchpad 应用(如 `F0712 Manage Supplier Line Items`、`Asset History Sheet HFM` 等需在 Fiori Launchpad 中执行的用例)。
- 混合用例(既有 GUI 又有 Fiori 步骤)予以保留,但对 Fiori 步骤明确标注 **"不适用本平台"**。

**被排除的纯 Fiori 用例**(供参考):
1. `BP_IT_B2P_Fiori Asset History Sheet HL (HFM ready)` — Fiori 报表 (RB4C_FI_C_SOC_ASSET_ALL_QY),仅在 PHL Fiori 上运行。
2. `BP_IT_B2P_FIORI_Report Supplier Balances and Line Items` — Fiori App ID `F0712`。

---

## 1. BP_IT_B2P_GUI_Report Asset HistorySheet

| 属性 | 值 |
|---|---|
| Folder | IT |
| Version Title | Name change |
| Status | 0RELEASED |
| Priority | 2 MEDIUM |
| Owner | 0000002791 |
| Language | EN |

**Description**: Calling up and evaluating the report data.

**Prerequisites**: Basic settings are customized; reports are available on the system.

### Steps

| # | Step Description | Test Instruction | Expected Result | T-Code |
|---|---|---|---|---|
| 1 | Calling up the report for Asset History | `TC: S_ALR_87011990` | The report shows the correct data according to the selected criteria. | `S_ALR_87011990` — Asset History Sheet |
| 2 | Calling up the report for Asset Balances | `TC: S_ALR_87011963` | The report shows the correct data according to the selected criteria. | `S_ALR_87011963` — Asset Balances |

---

## 2. BP_IT_B2P_GUI_CIT

| 属性 | 值 |
|---|---|
| Folder | (未填) |
| Version Title | Update SolDoc attribute |
| Status | 0RELEASED |
| Priority | 3 HIGH |
| Owner | 0000002128 |
| Language | EN |

**Description**: For all CIT ITRs.

### Steps

| # | Step Description | Test Instruction | Expected Result |
|---|---|---|---|
| 1 | A Balance Sheet & P&L structure can be displayed based on Tax Ledger values. | Display Balance Sheet with Tax Values:<br>• Open Report `S_ALR_87012284` - Financial Statement<br>• Select Tax Ledger (L2) Values<br>• Run the Report | It is possible to display the standard balance sheet and P&L structure by selecting tax ledger values only. |
| 2 | There needs to be a possibility to download the Balance Sheet Statement to Excel. | Download Tax Balance Sheet to Excel:<br>• Run Report `S_ALR_87012284` - Financial Statement and select Tax Ledger L2<br>• Download to Excel<br>• Check the generated file | The Balance Sheet Statement can be downloaded to Excel. |
| 3 | There shall be a functionality to download the Balance Sheet Statement in `.xml` format. | Download Tax Balance Sheet to .xml file:<br>• Run Report `S_ALR_87012284` - Financial Statement and select Tax Ledger L2<br>• Download to `.xml`<br>• Check the generated file | The Balance Sheet Statement can be downloaded to xml. |

**关键 T-Code**: `S_ALR_87012284` — Financial Statement.

---

## 3. PSL_CT_B2P_PE_GUI_FI line item reports additional fields

| 属性 | 值 |
|---|---|
| Folder | CT-UD |
| Version Title | V1 |
| Status | 0RELEASED |
| Priority | 2 MEDIUM |
| Owner | 0000000565 |
| Language | EN |

**Description**: In GL line item reports the fields `Operational Division`, `Document Header Text`, `Ref.key (header) 1` and `Ref.key (header) 2` should be checked.

**Prerequisites**: Some documents are available in the test system.

### Steps

| # | Step Description | Test Instruction | Expected Result | T-Code |
|---|---|---|---|---|
| 1 | Execute the G/L Account Line Item Browser (G/L View) and select the field `Operational Division` for the layout. | Execute `TC: FAGLL03H`; Company Code: e.g. `8650`; G/L Account: e.g. `5010100000`; All Items: enter period; change Layout and select `Operational Division`. | Documents are shown and the column `Operational Division` is available in the layout. | `FAGLL03H` — G/L Line Item Browser (G/L View) |
| 2 | Execute the G/L Account Line Item Browser (G/L View) and select the fields `Document Header Text`, `Ref.key (header) 1`, `Ref.key (header) 2` for the layout. | Execute `TC: FAGLL03H`; Company Code: e.g. `8650`; G/L Account: e.g. `5010100000`; All Items: enter period; change Layout and select `Document Header Text`, `Ref.key (header) 1`, `Ref.key (header) 2`. | Documents are shown and the columns `Document Header Text`, `Ref.key (header) 1`, `Ref.key (header) 2` are available in the layout. | `FAGLL03H` |
| 3 | Execute the Display in General Ledger View report and check if `Document Header Text`, `Ref.key (header) 1`, `Ref.key (header) 2` are available in the header. | Execute `TC: FB03L`; select a Document Number; Company Code: e.g. `8650`; Fiscal Year: e.g. `2022`; Ledger: `0L`; the fields are shown in the header. | The information `Document Header Text`, `Ref.key (header) 1`, `Ref.key (header) 2` are available in the header of the document. | `FB03L` — Document Display : G/L View |

---

## 4. BP_IT_S2P_MM_GR-COR_Invoice cancellation in ERP

| 属性 | 值 |
|---|---|
| Folder | IT |
| Version Title | Initial Version |
| Status | 0RELEASED |
| Priority | 2 MEDIUM |
| Owner | 0000000949 |
| Language | EN |

**Description**: BP_IT_S2P_FIN_Invoice posting MM.

**Prerequisites**: MMPO with GL accounting.

### Steps

| # | Step Description | Test Instruction | Expected Result | T-Code |
|---|---|---|---|---|
| 1 | Cancellation of invoice receipt | Transaction code: `MR8M`<br>Test data: Select an MM invoice posting<br>- Invoice number<br>- Fiscal year<br>- Reversal reason<br>Save. | Invoice posting was reversed successfully. Check whether Invoice and cancelled document are cleared in xHL. | `MR8M` — Cancel Invoice Document |
| 2 | FI document overview for MM invoice reversal — Check PO history | Transaction code: `FB03` / `FB03L`. FI document overview for MM invoice reversal — Check PO history. | FI document is posted with document type `KC`. | `FB03` — Display Document |
| 3 | Vendor open item check | Transaction code: `FBL1N`<br>Test data: Display vendor open items for Document status:<br>- Cleared for payment?<br>- Blocking?<br>- Company code | Vendor items display. | `FBL1N` — Vendor Line Items |

---

## 5. BP_IT_S2P_I2P_Manage Accounts payable Reports & Analytics

| 属性 | 值 |
|---|---|
| Folder | IT |
| Version Title | BP_IT_S2P_I2P_Manage Accounts payable Reports & Analytics |
| Status | 0RELEASED |
| Priority | 2 MEDIUM |
| Owner | 0000000949 |
| Language | EN |

**Description**: Accounts payable operational reports and analytics are essential for monitoring and analyzing financial performance. These reports and analytics provide valuable insights into the efficiency and effectiveness of the AP process, as well as the overall financial health of the organization.

**Prerequisites**: Accounting Documents are available and the user has `X:4CSP_STAR_W_AP_EXPERT` role to execute the test case.

### Steps

| # | Step Description | Test Instruction | Expected Result | T-Code / 备注 |
|---|---|---|---|---|
| 1 | Vendor Line Item Browser | Execute `Tcode FBL1H - Vendor Line Item Browser`<br>Enter Co. Code `XXXX`, Supplier `*`, and select (if required) Line Item Selection / Type / Additional Restrictions / Document number / Output / Selection Cond... | Able to view vendor line items. | `FBL1H` |
| 2 | G/L Account Line Item Browser | Execute `T Code FBL3H - G/L Account Line Item Browser`<br>Enter Company Code `XXXX`, Supplier `*`, and select (if required) Line Item Selection / Type / Additional Restrictions / Selection Conditions / Document number / Output. | Able to display GL line items. | `FBL3H` |
| 3 | Perform Vendor invoice Aging Analysis Reporting | Execute `/UI2/FLP` - SAP Fiori Launchpad → `Aging Analysis (F1733) (AgingAnalysisKPI)`<br>Company code: `XXXX`; Open on key date: current date. | Display vendor aging report and able to download in Excel. | **Fiori App `F1733` — 不适用 SAP WebGUI 平台,本步骤跳过** |
| 4 | Perform List of Vendor line Items reporting via GUI | Execute `TCode S_ALR_87012103 List of Vendor Line Items`<br>Enter Vendor Account `*`, Company code `XXXX`, and select All item - Posting date; select (if required) Type / Further Selections / Output Control. | Display List of Vendor line Items and able to download in Excel. | `S_ALR_87012103` — List of Vendor Line Items |
| 5 | List of Vendor Open Items via GUI | Execute `TCode S_ALR_87012083 List of Vendor Open Items`<br>Enter Vendor Account `*`, Company code `XXXX`, Status: open items, Open as on key date. | Display List of Vendor open Items and able to download in Excel. | `S_ALR_87012083` — List of Vendor Open Items |

> 注: 第 3 步使用 Fiori Launchpad,不在 SAP WebGUI 平台上执行;自动化测试时建议跳过该步,其余 4 步全部为 GUI T-Code。

---

## 6. BP_IT_B2P_GUI_AuC Asset Master Data Creation-VendorTool

| 属性 | 值 |
|---|---|
| Folder | IT |
| Version Title | Update SolDoc attribute |
| Status | 0RELEASED |
| Priority | 2 MEDIUM |
| Owner | 0000002147 |
| Language | EN |

**Description**: Create single asset master data from transaction `AS01`.

**Prerequisites**: Receive Purchase Requisition with Account Assignment Type "V" on Vendor Tool procurement.

### Steps

| # | Step Description | Test Instruction | Expected Result | T-Code |
|---|---|---|---|---|
| 1 | Create asset master data | 1. Asset class: `A3450000` Asset under construction (vendor-tools) **(M)**<br>2. Co.code: `xxxx` **(M)**<br>3. Number of similar assets: `1` **(M)**<br>Then Enter — a new window pops up.<br>**General tab**:<br>• Description: `xxxx` **(M)**<br>• Asset main.no text: `xxxx` **(M)**<br>• Serial number: `xxxx` (O)<br>• Quantity: `xxxx` (O)<br>**Time dependent tab**:<br>• Cost center: `xxxx` **(M)**<br>• Plant: `xxxx` **(M)**<br>• Location: `xxxx` (O)<br>• Room: `xxxx` (O)<br>**Assignments / Origins / Net worth tax / Leasing / Depreciation**: all optional (some fields may be mandatory by country).<br>Click **Save**. | The asset `xxxx 0` is successfully created. | `AS01` — Create Asset Master Record |
| 2 | Display the created asset | 1. Asset: `xxxx` **(M)**<br>2. Sub asset number: `0` **(M)**<br>3. Company code: `xxxx` **(M)**<br>Then Enter. | The asset is successfully displayed. | `AS03` — Display Asset Master Record |

> 注: (M) = Mandatory; (O) = Optional.

---

## 附录: 本平台涉及的全部 SAP GUI T-Code 汇总

| T-Code | 描述 | 出现于用例 |
|---|---|---|
| `S_ALR_87011990` | Asset History Sheet | 1 |
| `S_ALR_87011963` | Asset Balances | 1 |
| `S_ALR_87012284` | Financial Statement | 2 |
| `FAGLL03H` | G/L Line Item Browser (G/L View) | 3 |
| `FB03L` | Document Display : G/L View | 3 |
| `MR8M` | Cancel Invoice Document | 4 |
| `FB03` | Display Document | 4 |
| `FBL1N` | Vendor Line Items | 4 |
| `FBL1H` | Vendor Line Item Browser | 5 |
| `FBL3H` | G/L Account Line Item Browser | 5 |
| `S_ALR_87012103` | List of Vendor Line Items | 5 |
| `S_ALR_87012083` | List of Vendor Open Items | 5 |
| `AS01` | Create Asset Master Record | 6 |
| `AS03` | Display Asset Master Record | 6 |
