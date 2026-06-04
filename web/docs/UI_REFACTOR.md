# SAPTest Console — UI 重构说明

> 本次重构把原本基于 shadcn/ui (New York) 的暗色调控制台，整体迁移到 **SAP Fiori 3 Quartz Light** 企业风格的测试管理工作台。
>
> **重要原则**：所有后端 API、路由、数据结构、事件绑定、权限语义、数据库 schema 一行未动。重构纯前端（`web/`），既有用户工作流（编辑用例 / 跑 Midscene JS / 看 Midscene 报告 / 历史回放 / 用户管理 / 审计 / AI 生成）100% 保留。
>
> 在线查看（同步 HTML 版）：[`/docs/ui-refactor.html`](web/docs/ui-refactor.html)

---

## 一、整体方向对比

| 维度 | 原始 UI | 重构后 |
|---|---|---|
| **设计语言** | shadcn/ui · New York · 偏极简暗色 | **SAP Fiori 3 Quartz Light** · 企业级桌面 |
| **首页** | Dashboard：4 张统计卡 + 快捷操作 + 最近 8 次运行列表 | **Workbench**：单页四区作战台（KPI / 用例 / 详情 / 日志 / 结果表） |
| **运行入口** | 必须先点用例 → 进详情页 → 点 Run | 工作台内**一键**：选中 → Enter / 点击运行按钮 |
| **看日志** | 必须在用例详情的 Steps & Run 标签下 | 工作台**常驻右侧**实时滚动 |
| **看历史** | 在用例详情 History 标签 / Results 页 | 工作台**底部结果表**全局聚合 + 原 History 标签保留 |
| **批量操作** | 不支持 | 多选 + Shift+Click 区段 + 底部批量执行按钮 |
| **键盘操作** | 仅原生 Tab | Ctrl+K 命令面板 / J K / `/` / Enter / g d / Shift+R / `?` |
| **配色** | shadcn zinc (黑/灰) | SAP Quartz Blue `#0070F2` + 浅灰白底 |
| **字体** | Geist Sans / Geist Mono | **IBM Plex Sans / IBM Plex Mono**（企业中性） |
| **正文密度** | 14px 行距 1.55 | 13px 行距 1.5（更紧凑，可见信息更多） |
| **按钮高度** | 36px / sm 32px | 32px / sm 26px |
| **表格行高** | 12 × 14 padding | 7 × 10 padding（Fiori responsive table 密度） |
| **圆角** | 10–14px | 4–6px（Fiori 标准） |
| **阴影** | 多层 shadow-sm / shadow-lg | 仅 hairline 1px 边框，无投影 |

---

## 二、设计系统重构（`web/styles.css`）

### 2.1 色彩 Token

| Token | 原值 (shadcn zinc) | 重构后 (SAP Fiori) | 用途 |
|---|---|---|---|
| `--primary` | `240 5.9% 10%` 黑 | `212 100% 47%` **SAP Quartz Blue** | 主按钮 / 选中 / focus ring |
| `--background` | `0 0% 100%` 纯白 | `220 11% 96%` 浅灰白 | app 画布 |
| `--card` | `0 0% 100%` | `0 0% 100%` 纯白 | 浮在画布上的面板 |
| `--success` | `142 76% 36%` | `142 55% 32%` `#1F7A39` | **PASS** |
| `--destructive` | `0 84% 60%` | `358 70% 47%` `#B00020` | **FAIL** |
| `--info` | `221 83% 53%` | `212 100% 47%` Quartz Blue | **RUNNING** |
| `--warning` | `32 95% 44%` | `26 95% 45%` `#E0660D` | **WARNING** |
| `--status-pend` | （无） | `220 8% 55%` 中灰 | **PENDING** |
| `--sidebar` | 浅灰 | `220 13% 24%` **深蓝灰** | Fiori shell bar 风格 |

### 2.2 字体

```css
/* 原 */
--sans: "Geist", ui-sans-serif, system-ui, ...
--mono: "Geist Mono", ui-monospace, ...

/* 重构后 */
--sans: "IBM Plex Sans", "Geist", ui-sans-serif, ...
--mono: "IBM Plex Mono", "Geist Mono", ui-monospace, ...
```

IBM Plex 是 IBM 开源的企业字体，工程化、几何化但带温度，避开了 Inter / SF Pro 的"AI 同质化"感。

### 2.3 状态标签（`.tag`）

* 形状：从胶囊（`border-radius: 999px`）→ 方角（3px 圆角），更贴合 Fiori "ObjectStatus" 组件
* 新增 `.tag.run`：带跳动小圆点（`@keyframes tagRunPulse`），运行中状态视觉化
* 新增 `.tag.pass / .fail / .pend`：与 `.tag.ok / .err` 等价的语义别名

---

## 三、布局重构（核心改动）

### 3.1 主页面：Dashboard → **Workbench**

```
┌────────────────────────────────────────────────────────────────┐
│  KPI strip · 7 metrics                                         │
│  Total / Pass / Fail / Running / Pending / Rate↗ / Avg dur     │
├──────────────┬─────────────────────────────┬───────────────────┤
│              │                             │                   │
│  TEST CASES  │   CASE DETAIL               │  LIVE LOG         │
│  (search +   │   (run controls + params    │  (ws/run + active │
│   filter +   │    quick-edit + step        │   runs polling,   │
│   multi-     │    pipeline w/ live status) │   color-coded,    │
│   select)    │                             │   filter)         │
│              │                             │                   │
├──────────────┴─────────────────────────────┴───────────────────┤
│  EXECUTION RESULTS · search + status filter + CSV export       │
│  case / module / status / start / end / duration / progress    │
└────────────────────────────────────────────────────────────────┘
```

* **响应式**：≤ 1280px 自动 → 2 列（日志移到下方）；≤ 880px → 单列
* **数据源全部复用**：`/api/cases`、`/api/results/recent`、`/api/cases/:id`、`/ws/run`、`/api/midscene-js/runs/active`、`/api/midscene-js/cases/:id/run`
* **服务端零改动**

### 3.2 原 Dashboard 保留

* 原视图函数移到 `VIEWS.dashboardLegacy`（**未删除**）
* `#/dashboard` 路由的渲染目标改为新的 Workbench
* `nav.dashboard` 文案从「总览/Overview」改为「工作台/Workbench」

### 3.3 其他路由原封不动

| 路由 | 视图 | 状态 |
|---|---|---|
| `#/cases` | 用例列表表格 | 沿用，仅获得新 Fiori 样式 |
| `#/cases/:id` | 用例详情（Parameters / Steps & Run / History 三标签） | 沿用 |
| `#/cases/:id/run` | 详情 Run 标签 | 沿用 |
| `#/cases/:id/runs/:runId` | 历史 run 回放 | 沿用 |
| `#/cases/:id/history` | 详情 History 标签 | 沿用 |
| `#/results` | 全局报告浏览器 | 沿用 |
| `#/generate` | AI 用例生成 | 沿用 |
| `#/config` | 环境变量配置 | 沿用 |
| `#/users` | 用户管理 | 沿用 |
| `#/audit` | 审计日志 | 沿用 |

---

## 四、Power-user 交互（新增）

10 项贴合 Fiori "企业重度操作员" 场景的交互，全部 ≤ 550ms 动画时长，遵循 `prefers-reduced-motion`。

### 4.1 命令面板（Ctrl/Cmd+K）

模糊搜索三类目标：
* **用例**（含标题 / TX 码 / 文件名）
* **跳转**（七个 nav 目标）
* **操作**（清空缓存、切主题、切语言、退出登录、打开速查表）

打分：子序列匹配 + 前缀加权 + 相邻字符加权，模仿 VS Code 命令面板手感。
`↑`/`↓` 或 `Ctrl+P`/`Ctrl+N` 移动；`Enter` 触发；`Esc` 关闭。

### 4.2 键盘速查表（`?`）

| 快捷键 | 动作 |
|---|---|
| `Ctrl+K` / `Cmd+K` | 命令面板 |
| `/` | 聚焦用例搜索框 |
| `J` 或 `↓` | 下一个用例 |
| `K` 或 `↑` | 上一个用例 |
| `Enter` | 运行当前选中用例（write cache） |
| `Shift+Enter` / `Shift+R` | 运行（缓存重放） |
| `Shift+Click` | 多选区段（anchor → click 之间全选/全反选） |
| `Esc` | 清空多选 / 关闭面板 |
| `g d` | 跳到工作台 |
| `g c` | 跳到测试用例 |
| `g r` | 跳到测试结果 |
| `g g` / `g a` / `g u` / `g s` | AI 生成 / 审计 / 用户 / 设置 |
| `?` | 打开本速查表 |

所有快捷键在输入框聚焦时自动让位（除 `Esc` 和 `Ctrl+K`）。

### 4.3 KPI 数字 count-up 动画

数字变化时以 ease-out-cubic 曲线滚动，搭配 `kpiBump` Y 轴微弹（420ms）。
DOM 复用：跨轮询不重建 cell，避免动画被打断。

### 4.4 通过率 KPI 内嵌 Sparkline

* 60×18 SVG（fully inline）
* 滑动窗口 K = max(3, min(12, ⌊N/2⌋ ∨ 5))
* path.area 半透明填充 + path.line + 末端 circle
* 颜色随 KPI 语义（pass = 绿，fail = 红）
* 类似 SAPUI5 `sap.suite.ui.microchart.LineMicroChart`

### 4.5 步骤管线自动滚动

运行步骤推进时（Playwright `/ws/run` 事件 / Midscene JS active-runs poll），当前 `is-running` 步骤平滑滚入视口。

**防抢手**：用户在 1.5s 内手动滚动过 detail 区域时不抢，避免操作员看历史步骤时被强行拽走。

### 4.6 日志条目入场微闪

新日志条目按 kind 着色闪入：
* `info` → 蓝半透明 → 透明（550ms）
* `ok` → 绿半透明
* `warn` → 橙半透明
* `err` → 红半透明 → 保留淡红背景

重渲（清空 / 过滤切换）时**不触发**入场动画，避免一次性闪烁 200 条。

### 4.7 状态徽章变化脉冲

用例 last-run 状态变化（pending → passed / failed → passed 等）时，左侧状态 `.tag` 触发 `wbTagPulse` 微缩放 + 阴影脉冲（550ms）。

实现：渲染时对比 `prevStatusByCase` Map，仅在变化的 tag 上加 `.is-changed` 类。

### 4.8 Shift+Click 区段多选

`rangeAnchorIdx` 记住上次点击的可见行索引，按住 Shift 点击 checkbox 时，从 anchor 到当前行全部按"刚点击的勾选状态"批量同步。
anchor 行右侧显示蓝色小圆点提示。经典邮件客户端模式。

### 4.9 Run 完成 toast 通知

`pollActiveRuns()` 检测到刚结束的 run（对比上一轮 `activeRuns`），自动：
1. 拉新一次 `/api/results/recent` 同步 KPI / 列表 / 结果表
2. 弹出可点击 toast：`saptest1 ✓ passed · 41.6s`
3. 点击 toast 直接跳到该用例的 History 标签

### 4.10 参数快捷编辑（详情面板内联）⭐

> 对应用户提示："比如 case 支持参数修改的那几个，一个小思路"

对包含 `aiInput` 步骤的用例，详情面板在步骤管线**之上**插入一个紧凑参数网格：

* 每个 aiInput 步一格 → `#order · 定位词` + 输入框
* `value` 优先取 `parsed.params[order]`，否则取 `apiGuide.steps[].exampleCode` 中的 `{ value: "…" }`
* T Code 字段（locator 匹配 `矩形 / TC 框 / 事务码`）橙色 `⚠` 警示 — 提醒"改 T Code 会让 cache 失效"
* "保存参数" 一键 `PUT /api/cases/:id` — 与完整编辑器走同一接口，apiGuide 字节级保留，cache 不失效（非 T Code）
* 不影响打开完整编辑器（`完整编辑器` 按钮仍然可用）

---

## 五、动画细节

| 名称 | 时长 | 缓动 | 触发 |
|---|---|---|---|
| `cmdPalIn` | 160ms | cubic-bezier(.2,1,.3,1) | 命令面板入场 |
| `cmdPalBackIn` | 120ms | ease-out | 命令面板背景模糊 |
| `kpiBump` | 420ms | cubic-bezier(.2,1,.3,1) | KPI 数字变化时 Y 轴微弹 |
| `wbLogFlash` | 550ms | ease-out | 日志条目入场 |
| `wbLogFlashErr/Warn/Ok` | 550ms | ease-out | 按 kind 着色入场 |
| `wbTagPulse` | 550ms | cubic-bezier(.2,1,.3,1) | 状态徽章变化 |
| `wbStepPulse` | 1100ms loop | ease-in-out | 运行中步骤指示器呼吸 |
| `tagRunPulse` | 1200ms loop | ease-in-out | RUN 标签圆点闪烁 |

所有动画在 `prefers-reduced-motion: reduce` 媒体查询下被强制压到 0.001ms（即视觉等价无动画）。

---

## 六、修改文件清单

| 文件 | 改动类型 | 主要内容 |
|---|---|---|
| `web/index.html` | 修改 | 引入 IBM Plex 字体；登录页加左下 SAP 品牌渐变条 |
| `web/styles.css` | 重写 + 追加 | 主题 token 全面 Fiori 化；新增 ~480 行 workbench / 命令面板 / sparkline / 动画 CSS |
| `web/app.js` | 追加 | 新增 ~750 行：`VIEWS.dashboard`（Workbench, 470 行）/ 命令面板 / 全局键盘 / `animateNumber` / `sparkline` / 内联参数编辑 / `wbToast` / nav 文案更新 / i18n 字典扩展 |
| `server/**/*` | **零改动** | — |
| `scripts/verify-workbench.mjs` | 新增 | Playwright 自动化验证：5 区域 + 命令面板 + 速查表 + J/K + sparkline + 参数编辑 |
| `scripts/mint-test-token.mjs` | 新增 | 仅供本地验证：用项目自身的 JWT secret 签 10 分钟 admin 令牌 |
| `web/docs/ui-refactor.html` | 新增 | 本文档的 HTML 镜像（同字体 / 同 token / 浏览器内查看） |
| `UI_REFACTOR.md` | 新增 | 本文档 |

---

## 七、可访问性 / 性能

* **键盘可达**：所有命令面板项、kbd cheat 都是 `<button>`/`<a>`，原生 Tab 顺序自然
* **不抢输入焦点**：全局快捷键监听 `target.tagName in {input, textarea, select}` 时直接 return
* **滚动锚定**：日志和步骤管线都做了"用户滚动过则不强抢"的判断
* **轮询自适应**：`pollActiveRuns` 在 idle 时 4s 周期，发现有活跃 run 立刻切 1.5s 周期，run 结束自动回退
* **JS bundle 增量**：约 +30KB 未压缩，gzip 后约 +9KB
* **CSS 增量**：约 +12KB 未压缩
* **零外部依赖**：所有交互纯 vanilla DOM，没有引入 Motion / framer-motion / cmdk 等库

---

## 八、回滚 / 兼容性

* 老的 dashboard 视图函数保留为 `VIEWS.dashboardLegacy`，若需快速回退只需在 [`web/app.js`](web/app.js) 的 `render()` 里把 `effectiveViewId === 'dashboard'` 时改回调用它
* `#/cases`、`#/cases/:id` 全套路由完整保留，原有的"完整编辑器"工作流（含 raw JSON 视图）一行未改
* 后端任何接口都没动 → 部署只需替换 `web/` 目录
* 现有运行记录、cache 文件、用户、审计日志格式都没受影响

---

## 九、设计依据

* **SAP Fiori 3 Design Guidelines** — Quartz Light 配色 / 密度 / ObjectStatus
* **SAPUI5 sap.m.Table** — responsive table 行高与表头样式
* **SAPUI5 sap.suite.ui.microchart.LineMicroChart** — KPI 内嵌 sparkline 形态
* **VS Code Command Palette** — 模糊匹配评分与键盘交互
* **Linear / Notion** — `g d` / `g c` 二键序列导航
* **IBM Carbon Design** — IBM Plex Sans 排版（与 Carbon 同源）

---

_文档生成时间：2026-06-02_
