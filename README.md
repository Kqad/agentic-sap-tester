# saptest1 — Midscene.js + Playwright

用自然语言驱动 Web 端到端测试。AI 后端：**Gemini 3 Flash**（通过 Poe 网关接入）。

## 1. 前置条件

- Node.js **20+**
- Poe API Key — https://poe.com/api_key

## 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 Poe Key：

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env` 的关键字段：

| 变量 | 含义 |
| --- | --- |
| `MIDSCENE_MODEL_BASE_URL` | `https://api.poe.com/v1` |
| `MIDSCENE_MODEL_API_KEY` | Poe API Key (`sk-poe-...`) |
| `MIDSCENE_MODEL_NAME` | `gemini-3-flash` |
| `MIDSCENE_MODEL_FAMILY` | `gemini` —— 启用 Gemini 系列的 prompt 适配 |

## 3. 安装依赖

```powershell
npm install
npm run install:browsers   # 下载 Chromium
```

## 4. 跑示例用例

```powershell
npm test                   # 默认 headed=false? 当前 config 设了 headless:false
npm run test:headed        # 显式有头模式
npm run test:ui            # Playwright UI 模式 (推荐调试用)
npm run report             # 打开 Playwright 报告
```

执行完成后，Midscene 还会生成可视化报告，路径在控制台输出（一般在 `midscene_run/report/*.html`），用浏览器直接打开即可看到每一步 AI 操作的截图 + 推理过程。

## 5. 写新用例

在 `e2e/` 下新建 `*.spec.ts`，参考 `e2e/demo.spec.ts`。三个核心 AI API：

```ts
import { test, expect } from './fixture';

test('your case', async ({ ai, aiQuery, aiAssert, page }) => {
  await page.goto('https://example.com');

  // 1) 执行动作（自然语言）
  await ai('点击页面右上角的"登录"按钮');

  // 2) 提取数据（返回结构化 JSON）
  const items = await aiQuery<{ name: string; price: string }[]>(
    '提取列表中所有商品的 name 和 price',
  );

  // 3) 断言
  await aiAssert('页面顶部显示了用户头像，说明已登录成功');
});
```

也可以用 `aiTap` / `aiInput` / `aiHover` / `aiScroll` 等更细粒度的 API。

## 6. 目录结构

```
.
├── e2e/
│   ├── fixture.ts                # 注入 Midscene AI 方法到 Playwright test
│   ├── demo.spec.ts              # 示例
│   ├── asset-balance-check.spec.ts
│   └── cases/                    # 用例参数 JSON（被 spec 读取）
├── server/                       # Web 控制台后端（Express + WebSocket）
│   ├── index.js                  # 入口
│   ├── auth/                     # 登录 / JWT / RBAC / 中间件
│   ├── api/                      # 业务路由（cases/config/results/run/...）
│   └── data/                     # 运行时数据（users.json, jwt.secret, audit.jsonl）
├── web/                          # SPA 前端（HTML + CSS + 原生 JS）
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── playwright.config.ts
├── .env / .env.example
└── package.json
```

## 7. Web 控制台

可视化管理：用例 / 配置 / 运行 / 结果 / AI 用例生成 / 用户与权限 / 审计日志。

```powershell
npm run web          # 启动 http://127.0.0.1:5174
# npm run web:dev    # 自动重载（Node --watch）
```

首次启动时，如果 `server/data/users.json` 不存在，会自动创建一个 `admin` 账号：
- 如果设置了环境变量 `ADMIN_PASSWORD`，用这个密码；
- 否则随机生成一个并打印到控制台（**只显示一次**，请登录后立刻在「系统配置 → 修改我的密码」改掉）。

### 角色权限

| 角色 | 用例 | 配置 | 运行 | 结果 | AI 生成 | 用户 | 审计 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| admin  | RW | RW | ✓ | R | ✓ | ✓ | R |
| editor | RW | R  | ✓ | R | ✓ | ✗ | ✗ |
| runner | R  | R  | ✓ | R | ✗ | ✗ | ✗ |
| viewer | R  | R  | ✗ | R | ✗ | ✗ | ✗ |

### 安全说明

- 密码用 bcrypt 哈希存储；JWT 用首次启动随机生成的 secret 签名（写入 `server/data/jwt.secret`）。
- 会话放在 `httpOnly` cookie，默认 8 小时过期。`secure` 标志默认 false——**部署到 HTTPS 后请把 `server/auth/middleware.js` 里 `setSessionCookie` 的 `secure` 改为 true**。
- 登录失败有按 (IP + 用户名) 维度的限流：15 分钟内 8 次失败会被临时拒绝。
- 所有写操作 / 登录 / 运行都写入 `server/data/audit.jsonl`。
- `MIDSCENE_MODEL_API_KEY` 这类敏感字段不会回传到前端，编辑时留空即代表不修改。
