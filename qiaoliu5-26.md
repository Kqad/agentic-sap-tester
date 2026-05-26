# Changelog · qiaoliu 5/26

## 新增功能

### 1. 移植 8 个测试用例
从原 midscene 平台移植 8 个已验证可跑通的 SAP 测试用例（saptest1–saptest8）到当前共建平台。由于新平台引入了 Playwright，存在一些兼容性差异，大部分 case 需要重新录制 cache。

### 2. 参数化 + NL ↔ params 双向联动
- 从自然语言中自动解析每一个 `aiInput` 步骤的输入值（company code、Asset number、Report date 等），生成 Parameters 编辑器
- 单独修改任一参数值 → 自然语言文本里对应位置自动替换
- 单独修改自然语言里的值 → 参数表单对应字段自动更新
- 保存时两侧一起持久化，无需手动同步

### 2.1 用例详情页 UI 扩充
原版只有一块 raw JSON 文本框，现在按字段拆分成多个编辑区：
- **顶部操作栏**：Run JS / Run JS w/ Cache / Re-Gen API / Save parameters / Delete
- **基础字段**：Title / Target URL / Transaction code / Description（独立输入框）
- **Natural language**：专用大文本框 + 一行实时提示说明改 NL 不会让 cache 失效，并标注 tcode 是唯一例外
- **Parameters 网格**：每个 aiInput 步骤一张卡片，显示 step 编号 + locator 名（"左上角矩形"自动重命名为 "T Code"）+ 当前值 + apiInput default。tcode 类步骤额外打一个黄色 `⚠ tcode · invalidates cache` 标签，hover 有 tooltip 说明
- **生成的 JS**：折叠预览整段从 apiGuide 拼出来的可执行 JS，便于和"原版 JS"对照
- **API guide steps**：只读列表，标签显示 runner 实际调用的 API（aiTap/aiInput/...），若 LLM 原始分类和实际不同会附 `planned aiScroll` 这种小标签提示
- **原版 JS**：折叠展示从 `.txt` 1:1 拷贝过来的手写 JS 源（read-only）
- **Raw JSON**：折叠的全量 JSON 视图，复杂结构（数组/深嵌套）回退到此处编辑

### 3. Cache 复用策略
重写 cache hash 函数，**只在真正影响 runtime 元素定位的字段变化时才让 cache 失效**：

| 改动 | cache 是否失效 |
|---|---|
| 改 NL 任意文本 | 否 |
| 改非 tcode 的 input 值（参数 / NL / apiGuide 默认值） | 否 |
| 改 step 的 title / instruction / reason 等描述字段 | 否 |
| Gen API 重生（描述变但 locator 不变） | 否 |
| **改 sleep 时长 / 增删 sleep 步骤** | **否** |
| 改 step 的 locator 字符串 | 是 |
| 改 step 的 midsceneApi | 是 |
| 调整非 sleep step 的相对顺序 | 是 |
| 改 tcode 值（事务码切换 SAP 屏幕） | 是 |

实现：hash 输入只取 `caseId + 精简版 apiGuide + 有效 tcode 值`。精简版 apiGuide 先过滤掉所有 sleep 步骤，剩下的 step 每个只保留 `index（序号）/ midsceneApi / xpath / 剥了 value 的 exampleCode`，所有描述性字段排除。

#### 为什么 sleep 不进 hash
`await sleep(3000)` 这种纯等待步骤不调用任何 UI 元素，cache YAML 也不存它。**实际跑 SAP 时经常遇到某个页面加载特别慢，要现场加一段 sleep / 改长等待时间**——这种调试动作不应该让前面已经录好的 locator cache 失效。所以：sleep 步骤过滤掉，剩下的步骤用序号索引（避免插入 sleep 改变其他 step 的位置），把"等待时间"完全和"元素定位"解耦。

### 4. Cache 迁移工具
- `scripts/rename-cache-ids.mjs`：hash schema 演进时（v1 → v4c 六个版本）把现存 cache 文件按当前 hash 重命名，幂等
- `scripts/restore-desktop-cache.mjs`：根据 case JSON 的 `source.desktopCaseId`，从原 Desktop saptest 项目拷贝最合适的 cache 文件并按当前 hash 命名

### 5. 用例总览 UI 优化
- saptest1–saptest8 这 8 个标杆用例固定排在列表最上方
- 移除列表行里的 Gen API 按钮（进详情页里仍可用）
- 新增 **Last run** 状态列：`Pass` / `Fail` / `Not run`（英文），hover 显示最近一次运行时间

### 6. 调试体验小改
- runner 修复 `await sleep(...)` 在 apiGuide 步骤里报 `sleep is not defined` 的问题（把 `sleep` 注入到 AsyncFunction 作用域）
- 跑测试模态框的 **Console (tail)** 不再固定高度，按内容自动伸长，长行自动换行，再也不会显示不全
