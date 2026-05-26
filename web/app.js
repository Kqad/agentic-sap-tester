// SAPTest Console — single-page app.
// No framework; vanilla JS with a tiny render/route layer. Each "view" is a
// function that takes the app context and returns an HTMLElement.

// ───────── i18n ─────────
const I18N = {
  zh: {
    'login.tagline': 'SAP WebGUI 自动化测试管理平台',
    'login.username': '用户名',
    'login.password': '密码',
    'login.submit': '登录',
    'login.submitting': '登录中…',
    'login.foot': '首次部署？后端启动日志会打印初始 admin 账号密码。',
    'login.failed': '登录失败',
    'shell.logout': '退出登录',
    'shell.loading': '加载中…',
    'shell.loadFailed': '加载失败',
    'shell.langSwitchLabel': 'EN',
    'modal.close': '关闭',
    'nav.section.workspace': '工作台',
    'nav.section.admin': '管理',
    'nav.dashboard': '总览',
    'nav.cases': '测试用例',
    'nav.run': '执行测试',
    'nav.results': '测试结果',
    'nav.generate': 'AI 用例生成',
    'nav.config': '系统配置',
    'nav.users': '用户管理',
    'nav.audit': '审计日志',
    'user.lastLogin': '上次登录 ',
    'user.firstLogin': '首次登录',
    'time.secAgo': '{n} 秒前',
    'time.minAgo': '{n} 分钟前',
    'time.hourAgo': '{n} 小时前',
    'time.dayAgo': '{n} 天前',
    'dashboard.stat.cases': '测试用例',
    'dashboard.stat.casesHint': '点击进入用例库',
    'dashboard.stat.casesNoPerm': '需要 cases:read 权限',
    'dashboard.stat.runs': '历史运行',
    'dashboard.stat.runsHint': '聚合报表数量',
    'dashboard.stat.runsNoPerm': '—',
    'dashboard.stat.lastRun': '上次结果',
    'dashboard.stat.lastRunFailed': '{n} 个失败用例',
    'dashboard.stat.lastRunSource': '来自 test-results/.last-run.json',
    'dashboard.stat.role': '您的角色',
    'dashboard.stat.permCount': '{n} 项权限',
    'dashboard.quick.title': '快速操作',
    'dashboard.quick.run': '执行测试',
    'dashboard.quick.gen': '用 AI 生成新用例',
    'dashboard.quick.cases': '管理用例',
    'dashboard.quick.config': '查看配置',
    'dashboard.quick.desc.a': '该控制台对接 Midscene.js + Playwright，使用 ',
    'dashboard.quick.desc.b': ' 作为视觉语言模型。所有运行都受角色权限管控。',
    'dashboard.report.title': '最近一次报告',
    'dashboard.report.file': '文件',
    'dashboard.report.created': '生成时间',
    'dashboard.report.size': '体积',
    'dashboard.report.open': '在新标签页打开',
    'dashboard.report.preview': '内嵌预览',
    'dashboard.report.empty': '尚无报告。先去「执行测试」跑一个用例。',
    'cases.title': '测试用例',
    'cases.new': '+ 新建用例',
    'cases.aiGen': '用 AI 生成',
    'cases.empty': '还没有用例。点右上角新建，或者去「AI 用例生成」让模型先给你一份。',
    'cases.col.id': 'ID',
    'cases.col.summary': '摘要',
    'cases.col.spec': '关联 Spec',
    'cases.col.modified': '修改时间',
    'cases.col.size': '体积',
    'cases.col.lastRun': 'Last run',
    'cases.col.actions': '操作',
    'cases.jsonError': 'JSON 错误: ',
    'cases.txPrefix': 'TX ',
    'cases.noSpec': '无配套 spec',
    'cases.view': '查看',
    'cases.edit': '编辑',
    'cases.run': '运行',
    'cases.delete': '删除',
    'cases.viewTitle': '用例：',
    'cases.editTitle': '编辑用例：',
    'cases.newTitle': '新建用例',
    'cases.idLabel': 'ID（文件名，不含 .json）',
    'cases.paramsLabel': '参数 JSON',
    'cases.idPlaceholder': 'kebab-case-id',
    'cases.tipSave': '提示：保存后立刻生效；要让 Playwright 真正运行，需要 e2e/ 下存在同名 spec.ts。',
    'cases.idBadChars': 'ID 只能是字母/数字/-/_',
    'cases.jsonParseFail': 'JSON 解析失败：',
    'cases.saved': '已保存',
    'cases.created': '已创建',
    'cases.deleted': '已删除',
    'cases.confirmDelete': '确认删除用例 "{id}"？此操作不会删除 spec.ts。',
    'cases.save': '保存',
    'specs.title': 'Spec 文件',
    'specs.desc': '这些是 e2e/ 下的 TypeScript 驱动文件。它们读取同名 JSON 参数，是真正被 Playwright 执行的入口。',
    'specs.col.file': '文件',
    'specs.col.viewCode': '查看代码',
    'run.title': '执行测试',
    'run.selectSpec': '— 选择一个 spec —',
    'run.specFile': 'Spec 文件',
    'run.start': '开始运行',
    'run.stop': '停止',
    'run.headed': 'headed (有头模式)',
    'run.useCache': '启用缓存重放',
    'run.useCache.tip': '复用上次成功运行记录的 AI 计划与定位 xpath，命中时跳过模型调用（更快、更稳定，受页面结构变化影响）。',
    'run.cacheStrategy.label': '缓存策略',
    'run.cacheStrategy.readWrite': '读写（默认）',
    'run.cacheStrategy.readOnly': '只读（仅重放）',
    'run.cacheStrategy.writeOnly': '只写（重新录制）',
    'run.cacheClear': '清空缓存',
    'run.cacheClear.confirm': '确认删除 Midscene 缓存目录下的所有 .cache.yaml？下一次运行会重新询问模型。',
    'run.cacheClear.done': '已删除 {n} 个缓存文件',
    'run.cacheActive': '缓存重放：{strategy}',
    'run.pleaseSelect': '请选择一个 spec',
    'run.started': '已启动运行',
    'run.confirmStop': '确认停止当前运行？',
    'run.stopSent': '已发送停止信号',
    'run.report': '本次报告：',
    'run.status.idle': '空闲',
    'run.status.running': '运行中',
    'run.status.passed': '上次：通过',
    'run.status.failed': '上次：失败 (exit {code})',
    'run.status.startedBy': ' · 由 @{user} 启动',
    'run.preview.title': '本次将要执行的步骤',
    'run.preview.subtitle': '由 spec.ts 静态解析得出（参数 JSON 已合并）。运行时实际顺序可能因条件分支略有不同。',
    'run.preview.empty': '先在上方选一个 spec',
    'run.preview.loading': '解析中…',
    'run.preview.loadFailed': '解析失败：',
    'run.preview.noSteps': '此 spec 没有任何 test.step 块。',
    'run.preview.test': '测试函数',
    'run.preview.actionsCount': '{n} 个动作',
    'run.preview.stepsCount': '{n} 个步骤',
    'run.preview.conditional': '条件执行',
    'run.preview.loop': '循环',
    'run.preview.retried': '失败重试',
    'run.preview.openSource': '在源码中查看',
    'run.preview.resolvedParam': '从参数 JSON 解析得到',
    'run.preview.status.pending': '待执行',
    'run.preview.status.running': '执行中',
    'run.preview.status.passed': '通过',
    'run.preview.status.failed': '失败',
    'run.preview.duration': '耗时 {d}',
    'results.title': '测试结果 / 报告',
    'results.empty': '尚无报告。',
    'results.subtitle': '所有 midscene_run/report/*.html 报告。「内嵌预览」会弹窗内打开，「新标签页打开」会弹出独立窗口。',
    'results.refresh': '刷新',
    'results.filter.placeholder': '按文件名过滤…',
    'results.kind.all': '全部',
    'results.kind.merged': '合并报表',
    'results.kind.single': '单次运行',
    'results.kind.other': '其他',
    'results.summary': '显示 {shown} / {total} 条',
    'results.col.kind': '类型',
    'results.col.name': '文件名',
    'results.col.when': '生成时间',
    'results.col.size': '体积',
    'results.col.openTab': '新标签页打开',
    'generate.title': 'AI 用例生成器',
    'generate.subtitleA': '用配置中的 ',
    'generate.subtitleB': ' 把自然语言翻译成参数 JSON',
    'generate.descLabel': '自然语言描述',
    'generate.descPlaceholder': '例：在 SAP WebGUI 用事务码 S_ALR_87011990 查公司代码 8540、资产号 1010001732、日期 30.04.2026 的资产历史报表，提取 Curr.bk.val.；再回主页用 Favorites → Asset Balances 查同样条件，取 Book val.。校验两者相等。',
    'generate.outLabel': '生成的 JSON（可在「测试用例」里再编辑）',
    'generate.idPlaceholder': 'kebab-case-id（保存时用）',
    'generate.genBtn': '生成 JSON',
    'generate.saveBtn': '保存为新用例',
    'generate.pleaseInput': '请输入用例描述',
    'generate.generating': '生成中…',
    'generate.parseError': '模型返回不是合法 JSON：',
    'generate.idInvalid': '请填一个合法的 id（字母/数字/-/_）',
    'generate.nothingToSave': '没有可用的 JSON',
    'generate.noPerm': '没有保存用例的权限',
    'generate.savedAs': '已保存为 {id}.json',
    'config.title': '环境变量 (.env)',
    'config.saveBtn': '保存',
    'config.readOnly': '只读：无 config:write 权限',
    'config.savedHint': '已保存 {n} 项。请重启后端使生效。',
    'config.maskedHint': '已设置 (****{suf}) — 留空保持不变',
    'config.setBadge': '已设置',
    'config.footnote': '修改后需要重启 Node 进程（npm run web）才能让运行时读到新值。密钥永远不会回传到前端。',
    'config.pw.title': '修改我的密码',
    'config.pw.cur': '当前密码',
    'config.pw.new': '新密码（≥8 位）',
    'config.pw.confirm': '确认新密码',
    'config.pw.update': '更新密码',
    'config.pw.mismatch': '两次输入的新密码不一致',
    'config.pw.tooShort': '新密码至少 8 位',
    'config.pw.updated': '密码已更新',
    'config.pwReadOnly': '只读',
    'users.title': '用户',
    'users.new': '+ 新建用户',
    'users.col.username': '用户名',
    'users.col.display': '显示名',
    'users.col.role': '角色',
    'users.col.status': '状态',
    'users.col.lastLogin': '上次登录',
    'users.status.disabled': '已禁用',
    'users.status.enabled': '启用',
    'users.editTitle': '编辑用户：',
    'users.newTitle': '新建用户',
    'users.field.username': '用户名',
    'users.field.display': '显示名',
    'users.field.role': '角色',
    'users.field.resetPw': '重设密码（可选，留空不改）',
    'users.field.initPw': '初始密码',
    'users.field.disable': '禁用此用户',
    'users.confirmDelete': '确认删除用户 "{u}"？',
    'users.pwPlaceholderEdit': '留空 = 不修改',
    'users.pwPlaceholderNew': '至少 8 位',
    'users.rolesTitle': '角色 → 权限',
    'audit.title': '审计日志',
    'audit.empty': '空。',
    'audit.countLabel': '共 {n} 条（最近 {limit}）',
    'audit.col.time': '时间',
    'audit.col.action': '动作',
    'audit.col.user': '用户',
    'audit.col.source': '来源',
    'audit.col.detail': '详情',
    'detail.backToList': '← 用例列表',
    'detail.tabs.params': '参数',
    'detail.tabs.run': '步骤 & 运行',
    'detail.tabs.history': '历史',
    'detail.latest': '最近一次',
    'detail.never': '从未运行',
    'detail.runNow': '▶ 运行',
    'detail.openSpec': '查看 Spec 源码',
    'detail.runs.count': '{n} 次运行',
    'detail.replayBanner': '正在查看历史运行（{when}）',
    'detail.replayLive': '回到当前',
    'detail.notFound': '找不到此用例。',
    'detail.summary.spec': 'Spec',
    'detail.summary.tx': '事务码',
    'detail.summary.favorites': '收藏',
    'detail.summary.id': '用例 ID',
    'cases.openDetail': '打开',
    'params.title': '参数',
    'params.subtitle': '改完保存。每个字段都映射到 Spec 里 ${params.xxx} 的引用。',
    'params.save': '保存参数',
    'params.empty': '此用例还没有参数。点击「原始 JSON」开始添加。',
    'params.usedBy': '用于步骤',
    'params.usedByNone': '未被任何步骤引用',
    'params.showRaw': '查看原始 JSON ▾',
    'params.hideRaw': '收起 ▴',
    'params.complexHint': '此用例含数组或嵌套结构，建议在原始 JSON 视图中编辑。',
    'params.saved': '参数已保存',
    'params.parseError': '无法解析 JSON：',
    'params.unsaved': '有未保存的修改',
    'history.title': '运行历史',
    'history.empty': '该用例还没有运行记录。点击「▶ 运行」执行第一次。',
    'history.replayBtn': '查看步骤',
    'history.preview': '内嵌预览',
    'history.previewHide': '收起预览',
    'history.openReport': '新标签页打开',
    'history.noReport': '无报告（运行可能失败或被中断）',
    'history.col.when': '时间',
    'history.col.status': '状态',
    'history.col.who': '运行者',
    'history.col.duration': '耗时',
    'history.col.actions': '操作',
    'history.status.passed': '通过',
    'history.status.failed': '失败',
    'history.delete': '删除',
    'history.confirmDelete': '删除这条运行记录？（不会影响报告文件本身）',
    'history.deleted': '已删除运行记录',
    'history.clearAll': '清空全部历史',
    'history.confirmClearAll': '清空 "{id}" 的全部 {n} 条运行记录？此操作无法撤销。',
    'history.clearedAll': '已清空 {n} 条运行记录',
    'dashboard.recent.title': '最近运行',
    'dashboard.recent.empty': '还没有运行记录。打开任意一个用例并点击「▶ 运行」。',
    'dashboard.recent.openCase': '打开用例',
  },
  en: {
    'login.tagline': 'SAP WebGUI Test Automation Console',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in…',
    'login.foot': 'First deployment? The backend startup log prints the initial admin credentials.',
    'login.failed': 'Login failed',
    'shell.logout': 'Sign out',
    'shell.loading': 'Loading…',
    'shell.loadFailed': 'Failed to load',
    'shell.langSwitchLabel': '中',
    'modal.close': 'Close',
    'nav.section.workspace': 'Workspace',
    'nav.section.admin': 'Admin',
    'nav.dashboard': 'Overview',
    'nav.cases': 'Test Cases',
    'nav.run': 'Run',
    'nav.results': 'Results',
    'nav.generate': 'AI Case Generator',
    'nav.config': 'Configuration',
    'nav.users': 'Users',
    'nav.audit': 'Audit Log',
    'user.lastLogin': 'Last login ',
    'user.firstLogin': 'First login',
    'time.secAgo': '{n}s ago',
    'time.minAgo': '{n}m ago',
    'time.hourAgo': '{n}h ago',
    'time.dayAgo': '{n}d ago',
    'dashboard.stat.cases': 'Test cases',
    'dashboard.stat.casesHint': 'Open case library',
    'dashboard.stat.casesNoPerm': 'Needs cases:read',
    'dashboard.stat.runs': 'Total runs',
    'dashboard.stat.runsHint': 'Aggregated reports',
    'dashboard.stat.runsNoPerm': '—',
    'dashboard.stat.lastRun': 'Last result',
    'dashboard.stat.lastRunFailed': '{n} failed test(s)',
    'dashboard.stat.lastRunSource': 'from test-results/.last-run.json',
    'dashboard.stat.role': 'Your role',
    'dashboard.stat.permCount': '{n} permission(s)',
    'dashboard.quick.title': 'Quick actions',
    'dashboard.quick.run': 'Run a test',
    'dashboard.quick.gen': 'Generate a case with AI',
    'dashboard.quick.cases': 'Manage cases',
    'dashboard.quick.config': 'View configuration',
    'dashboard.quick.desc.a': 'This console drives Midscene.js + Playwright, using ',
    'dashboard.quick.desc.b': ' as the vision-language model. All runs are gated by role permissions.',
    'dashboard.report.title': 'Latest report',
    'dashboard.report.file': 'File',
    'dashboard.report.created': 'Created',
    'dashboard.report.size': 'Size',
    'dashboard.report.open': 'Open in new tab',
    'dashboard.report.preview': 'Inline preview',
    'dashboard.report.empty': 'No reports yet. Go to “Run” and execute a case first.',
    'cases.title': 'Test cases',
    'cases.new': '+ New case',
    'cases.aiGen': 'Generate with AI',
    'cases.empty': 'No cases yet. Click the button in the top-right to add one, or have the AI generator draft one for you.',
    'cases.col.id': 'ID',
    'cases.col.summary': 'Summary',
    'cases.col.spec': 'Linked spec',
    'cases.col.modified': 'Modified',
    'cases.col.size': 'Size',
    'cases.col.lastRun': 'Last run',
    'cases.col.actions': 'Actions',
    'cases.jsonError': 'JSON error: ',
    'cases.txPrefix': 'TX ',
    'cases.noSpec': 'no spec',
    'cases.view': 'View',
    'cases.edit': 'Edit',
    'cases.run': 'Run',
    'cases.delete': 'Delete',
    'cases.viewTitle': 'Case: ',
    'cases.editTitle': 'Edit case: ',
    'cases.newTitle': 'New case',
    'cases.idLabel': 'ID (filename without .json)',
    'cases.paramsLabel': 'Parameter JSON',
    'cases.idPlaceholder': 'kebab-case-id',
    'cases.tipSave': 'Saved cases take effect immediately, but Playwright also needs a matching spec.ts under e2e/ to run them.',
    'cases.idBadChars': 'ID may only contain letters, digits, - and _',
    'cases.jsonParseFail': 'JSON parse error: ',
    'cases.saved': 'Saved',
    'cases.created': 'Created',
    'cases.deleted': 'Deleted',
    'cases.confirmDelete': 'Delete case "{id}"? The matching spec.ts will not be removed.',
    'cases.save': 'Save',
    'specs.title': 'Spec files',
    'specs.desc': 'These TypeScript drivers under e2e/ load same-named JSON parameters and are the actual entry points Playwright executes.',
    'specs.col.file': 'File',
    'specs.col.viewCode': 'View code',
    'run.title': 'Run a test',
    'run.selectSpec': '— Select a spec —',
    'run.specFile': 'Spec file',
    'run.start': 'Start',
    'run.stop': 'Stop',
    'run.headed': 'headed mode',
    'run.useCache': 'Replay cache',
    'run.useCache.tip': 'Reuse AI plans and located xpaths recorded by the last successful run; cache hits skip the model call (faster, deterministic, but sensitive to page changes).',
    'run.cacheStrategy.label': 'Cache strategy',
    'run.cacheStrategy.readWrite': 'Read/write (default)',
    'run.cacheStrategy.readOnly': 'Read only (replay only)',
    'run.cacheStrategy.writeOnly': 'Write only (re-record)',
    'run.cacheClear': 'Clear cache',
    'run.cacheClear.confirm': 'Delete every .cache.yaml under midscene_run/cache? The next run will fall back to the AI.',
    'run.cacheClear.done': 'Removed {n} cache file(s)',
    'run.cacheActive': 'Cache replay: {strategy}',
    'run.pleaseSelect': 'Please select a spec',
    'run.started': 'Run started',
    'run.confirmStop': 'Stop the current run?',
    'run.stopSent': 'Stop signal sent',
    'run.report': 'This run’s report:',
    'run.status.idle': 'Idle',
    'run.status.running': 'Running',
    'run.status.passed': 'Last: passed',
    'run.status.failed': 'Last: failed (exit {code})',
    'run.status.startedBy': ' · started by @{user}',
    'run.preview.title': 'Steps this run will execute',
    'run.preview.subtitle': 'Statically parsed from the spec.ts (params JSON merged in). Actual order may vary slightly due to conditional branches.',
    'run.preview.empty': 'Pick a spec above to preview steps',
    'run.preview.loading': 'Parsing…',
    'run.preview.loadFailed': 'Parse failed: ',
    'run.preview.noSteps': 'This spec has no test.step blocks.',
    'run.preview.test': 'test',
    'run.preview.actionsCount': '{n} actions',
    'run.preview.stepsCount': '{n} steps',
    'run.preview.conditional': 'conditional',
    'run.preview.loop': 'loop',
    'run.preview.retried': 'retried',
    'run.preview.openSource': 'View in source',
    'run.preview.resolvedParam': 'resolved from params JSON',
    'run.preview.status.pending': 'pending',
    'run.preview.status.running': 'running',
    'run.preview.status.passed': 'passed',
    'run.preview.status.failed': 'failed',
    'run.preview.duration': '{d}',
    'results.title': 'Results & reports',
    'results.empty': 'No reports yet.',
    'results.subtitle': 'Every HTML report under midscene_run/report. "Inline preview" opens a modal; "Open in new tab" pops a standalone window.',
    'results.refresh': 'Refresh',
    'results.filter.placeholder': 'Filter by filename…',
    'results.kind.all': 'All',
    'results.kind.merged': 'Merged',
    'results.kind.single': 'Single run',
    'results.kind.other': 'Other',
    'results.summary': 'Showing {shown} of {total}',
    'results.col.kind': 'Type',
    'results.col.name': 'Filename',
    'results.col.when': 'Created',
    'results.col.size': 'Size',
    'results.col.openTab': 'Open in new tab',
    'generate.title': 'AI case generator',
    'generate.subtitleA': 'Uses the configured ',
    'generate.subtitleB': ' to translate natural language into parameter JSON',
    'generate.descLabel': 'Natural-language description',
    'generate.descPlaceholder': 'e.g. In SAP WebGUI, use transaction S_ALR_87011990 to look up the asset history report for company code 8540, asset 1010001732, date 30.04.2026, and extract Curr.bk.val.; then return home, use Favorites → Asset Balances with the same filters, and grab Book val.. Assert they match.',
    'generate.outLabel': 'Generated JSON (you can re-edit it under “Test cases”)',
    'generate.idPlaceholder': 'kebab-case-id (used when saving)',
    'generate.genBtn': 'Generate JSON',
    'generate.saveBtn': 'Save as new case',
    'generate.pleaseInput': 'Please enter a description',
    'generate.generating': 'Generating…',
    'generate.parseError': 'Model output was not valid JSON: ',
    'generate.idInvalid': 'Please use a valid id (letters/digits/-/_)',
    'generate.nothingToSave': 'Nothing to save',
    'generate.noPerm': 'You don’t have permission to save cases',
    'generate.savedAs': 'Saved as {id}.json',
    'config.title': 'Environment variables (.env)',
    'config.saveBtn': 'Save',
    'config.readOnly': 'Read-only: missing config:write',
    'config.savedHint': 'Saved {n} entries. Restart the backend to apply.',
    'config.maskedHint': 'Set (****{suf}) — leave blank to keep',
    'config.setBadge': 'Set',
    'config.footnote': 'Restart the Node process (npm run web) after changes so the runtime picks up new values. Secrets are never sent back to the frontend.',
    'config.pw.title': 'Change my password',
    'config.pw.cur': 'Current password',
    'config.pw.new': 'New password (≥8 chars)',
    'config.pw.confirm': 'Confirm new password',
    'config.pw.update': 'Update password',
    'config.pw.mismatch': 'The two new passwords do not match',
    'config.pw.tooShort': 'New password must be at least 8 characters',
    'config.pw.updated': 'Password updated',
    'config.pwReadOnly': 'Read-only',
    'users.title': 'Users',
    'users.new': '+ New user',
    'users.col.username': 'Username',
    'users.col.display': 'Display name',
    'users.col.role': 'Role',
    'users.col.status': 'Status',
    'users.col.lastLogin': 'Last login',
    'users.status.disabled': 'Disabled',
    'users.status.enabled': 'Enabled',
    'users.editTitle': 'Edit user: ',
    'users.newTitle': 'New user',
    'users.field.username': 'Username',
    'users.field.display': 'Display name',
    'users.field.role': 'Role',
    'users.field.resetPw': 'Reset password (optional, leave blank to keep)',
    'users.field.initPw': 'Initial password',
    'users.field.disable': 'Disable this user',
    'users.confirmDelete': 'Delete user "{u}"?',
    'users.pwPlaceholderEdit': 'blank = unchanged',
    'users.pwPlaceholderNew': 'at least 8 chars',
    'users.rolesTitle': 'Roles → permissions',
    'audit.title': 'Audit log',
    'audit.empty': 'Empty.',
    'audit.countLabel': '{n} entries (latest {limit})',
    'audit.col.time': 'Time',
    'audit.col.action': 'Action',
    'audit.col.user': 'User',
    'audit.col.source': 'Source',
    'audit.col.detail': 'Detail',
    'detail.backToList': '← All cases',
    'detail.tabs.params': 'Parameters',
    'detail.tabs.run': 'Steps & Run',
    'detail.tabs.history': 'History',
    'detail.latest': 'Latest',
    'detail.never': 'Never run',
    'detail.runNow': '▶ Run',
    'detail.openSpec': 'View spec source',
    'detail.runs.count': '{n} run(s)',
    'detail.replayBanner': 'Viewing a past run ({when})',
    'detail.replayLive': 'Back to live',
    'detail.notFound': 'Case not found.',
    'detail.summary.spec': 'Spec',
    'detail.summary.tx': 'Transaction',
    'detail.summary.favorites': 'Favorites',
    'detail.summary.id': 'Case ID',
    'cases.openDetail': 'Open',
    'params.title': 'Parameters',
    'params.subtitle': 'Each field maps to a ${params.xxx} reference inside the spec.',
    'params.save': 'Save parameters',
    'params.empty': 'This case has no parameters yet. Open “Raw JSON” to start adding some.',
    'params.usedBy': 'Used by step',
    'params.usedByNone': 'Not referenced by any step',
    'params.showRaw': 'Raw JSON ▾',
    'params.hideRaw': 'Hide raw ▴',
    'params.complexHint': 'This case contains arrays or deeply nested objects — prefer the raw JSON view.',
    'params.saved': 'Parameters saved',
    'params.parseError': 'Could not parse JSON: ',
    'params.unsaved': 'Unsaved changes',
    'history.title': 'Run history',
    'history.empty': 'No run history yet. Click “▶ Run” to execute it for the first time.',
    'history.replayBtn': 'View steps',
    'history.preview': 'Inline preview',
    'history.previewHide': 'Hide preview',
    'history.openReport': 'Open in new tab',
    'history.noReport': 'No report (run may have failed or been aborted)',
    'history.col.when': 'When',
    'history.col.status': 'Status',
    'history.col.who': 'Run by',
    'history.col.duration': 'Duration',
    'history.col.actions': 'Actions',
    'history.status.passed': 'passed',
    'history.status.failed': 'failed',
    'history.delete': 'Delete',
    'history.confirmDelete': 'Delete this run record? (The report file itself is kept.)',
    'history.deleted': 'Run record deleted',
    'history.clearAll': 'Clear all history',
    'history.confirmClearAll': 'Clear all {n} run record(s) for "{id}"? This cannot be undone.',
    'history.clearedAll': 'Cleared {n} run record(s)',
    'dashboard.recent.title': 'Recent runs',
    'dashboard.recent.empty': 'No runs yet. Open any case and click “▶ Run”.',
    'dashboard.recent.openCase': 'Open case',
  },
};

const LANG_KEY = 'saptest.lang';
function detectLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  const nav = (navigator.language || 'zh').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}
let LANG = detectLang();
function t(key, vars) {
  const dict = I18N[LANG] || I18N.zh;
  let s = dict[key];
  if (s == null) s = I18N.zh[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
function setLang(lang) {
  if (lang !== 'zh' && lang !== 'en') return;
  if (lang === LANG) return;
  LANG = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  if (state.user) renderShell(); else renderLogin();
}
function toggleLang() { setLang(LANG === 'zh' ? 'en' : 'zh'); }
function applyI18n(root) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
}
function wireLangToggle(root) {
  root.querySelectorAll('[data-action=lang-toggle]').forEach(btn => {
    const refresh = () => {
      const lbl = btn.querySelector('[data-bind=lang-label]') || btn;
      lbl.textContent = t('shell.langSwitchLabel');
    };
    refresh();
    btn.addEventListener('click', toggleLang);
  });
  // also wire any nested label spans (the button itself carries data-bind=lang-label)
  root.querySelectorAll('[data-bind=lang-label]').forEach(el => {
    if (!el.textContent) el.textContent = t('shell.langSwitchLabel');
  });
}

// ───────── tiny DOM helpers ─────────
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
};
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clone = (id) => document.getElementById(id).content.firstElementChild.cloneNode(true);
const fmtBytes = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1024/1024).toFixed(1)} MB`;
};
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US');
};
const fmtRel = (iso) => {
  if (!iso) return '—';
  const t0 = new Date(iso).getTime();
  const diff = (Date.now() - t0) / 1000;
  if (diff < 60) return t('time.secAgo', { n: Math.floor(diff) });
  if (diff < 3600) return t('time.minAgo', { n: Math.floor(diff/60) });
  if (diff < 86400) return t('time.hourAgo', { n: Math.floor(diff/3600) });
  return t('time.dayAgo', { n: Math.floor(diff/86400) });
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ───────── API client ─────────
const api = {
  async req(method, path, body) {
    const res = await fetch(path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let payload = null;
    const text = await res.text();
    try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
    if (!res.ok) {
      const err = new Error(payload?.error || `${res.status} ${res.statusText}`);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  },
  get: (p) => api.req('GET', p),
  post: (p, b) => api.req('POST', p, b ?? {}),
  put: (p, b) => api.req('PUT', p, b ?? {}),
  del: (p) => api.req('DELETE', p),
};

// ───────── App state ─────────
const state = {
  user: null,
  permissions: [],
  roles: null,
  route: { view: 'dashboard', params: {} },
};
const hasPerm = (p) => state.permissions.includes(p);

// ───────── Toast ─────────
function toast(message, kind = 'ok', ms = 2800) {
  let stack = $('.toast-stack');
  if (!stack) { stack = h('div', { class: 'toast-stack' }); document.body.appendChild(stack); }
  const el = h('div', { class: `toast ${kind}` }, message);
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }, ms - 200);
  setTimeout(() => el.remove(), ms);
}

// ───────── Modal ─────────
function modal({ title, body, wide = false, footer = null, onClose }) {
  const back = h('div', { class: 'modal-back' });
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  const box = h('div', { class: `modal ${wide ? 'wide' : ''}` },
    h('div', { class: 'modal-head' },
      h('span', {}, title || ''),
      h('button', { class: 'btn ghost sm', onClick: close }, t('modal.close')),
    ),
    h('div', { class: 'modal-body' }, body || ''),
  );
  if (footer) box.appendChild(h('div', { class: 'modal-foot' }, footer));
  back.appendChild(box);
  document.body.appendChild(back);
  return { close, box };
}

// ───────── Router ─────────
const VIEWS = {}; // populated below
// Hash format:
//   #/dashboard
//   #/cases                       → cases list
//   #/cases/<id>                  → case detail, default tab (params)
//   #/cases/<id>/run              → case detail, run tab (live)
//   #/cases/<id>/runs/<runId>     → case detail, run tab in replay mode
//   #/cases/<id>/history          → case detail, history tab
function parseHash() {
  const raw = (location.hash || '#/dashboard').slice(2);
  const segs = raw.split('/').filter(Boolean);
  const view = segs[0] || 'dashboard';
  return { view, params: { rest: segs.slice(1) } };
}
function go(path) { location.hash = '#/' + path; }
window.addEventListener('hashchange', () => render());

// ───────── Bootstrap ─────────
async function boot() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  try {
    const me = await api.get('/api/auth/me');
    state.user = me.user;
    state.permissions = me.permissions || [];
    state.roles = me.roles;
    renderShell();
  } catch (e) {
    renderLogin();
  }
}
boot();

// ───────── Login ─────────
function renderLogin() {
  const root = $('#app');
  root.innerHTML = '';
  const view = clone('tpl-login');
  applyI18n(view);
  wireLangToggle(view);
  const form = view.querySelector('[data-action=login]');
  const errEl = view.querySelector('[data-bind=error]');
  const submitTxt = view.querySelector('[data-bind=submit-text]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const fd = new FormData(form);
    submitTxt.textContent = t('login.submitting');
    try {
      const out = await api.post('/api/auth/login', {
        username: fd.get('username'),
        password: fd.get('password'),
      });
      state.user = out.user;
      state.permissions = out.permissions || [];
      try {
        const me = await api.get('/api/auth/me');
        state.roles = me.roles;
      } catch {}
      renderShell();
    } catch (err) {
      errEl.textContent = err.message || t('login.failed');
      submitTxt.textContent = t('login.submit');
    }
  });
  root.appendChild(view);
}

// ───────── Shell ─────────
// Top-level navigation. "Run" and "Results" used to live here but were merged
// into the case detail page (#/cases/:id) so each case is the one place to
// edit params, run it, and inspect history — see VIEWS.caseDetail.
const NAV = [
  { id: 'dashboard',  labelKey: 'nav.dashboard', sectionKey: 'nav.section.workspace', perm: null },
  { id: 'cases',      labelKey: 'nav.cases',     sectionKey: 'nav.section.workspace', perm: 'cases:read' },
  { id: 'results',    labelKey: 'nav.results',   sectionKey: 'nav.section.workspace', perm: 'results:read' },
  { id: 'generate',   labelKey: 'nav.generate',  sectionKey: 'nav.section.workspace', perm: 'agent:use' },
  { id: 'config',     labelKey: 'nav.config',    sectionKey: 'nav.section.admin',     perm: 'config:read' },
  { id: 'users',      labelKey: 'nav.users',     sectionKey: 'nav.section.admin',     perm: 'users:manage' },
  { id: 'audit',      labelKey: 'nav.audit',     sectionKey: 'nav.section.admin',     perm: 'audit:read' },
];

function renderShell() {
  const root = $('#app');
  root.innerHTML = '';
  const shell = clone('tpl-shell');
  applyI18n(shell);
  wireLangToggle(shell);
  // user card
  const userCard = shell.querySelector('[data-bind=user-card]');
  userCard.innerHTML = '';
  userCard.append(
    h('div', { class: 'name' }, state.user.displayName || state.user.username),
    h('div', { class: 'meta' },
      h('span', { class: `role-badge ${state.user.role}` }, roleLabel(state.user.role)),
      ' · ',
      h('span', {}, '@' + state.user.username),
    ),
    h('div', { class: 'meta', style: { marginTop: '6px' } },
      t('user.lastLogin'), state.user.lastLoginAt ? fmtRel(state.user.lastLoginAt) : t('user.firstLogin'),
    ),
  );
  // nav
  const navEl = shell.querySelector('[data-bind=nav]');
  const sections = new Map();
  for (const item of NAV) {
    if (item.perm && !hasPerm(item.perm)) continue;
    const secLabel = t(item.sectionKey);
    if (!sections.has(secLabel)) sections.set(secLabel, []);
    sections.get(secLabel).push(item);
  }
  for (const [sec, items] of sections.entries()) {
    navEl.appendChild(h('div', { class: 'nav-section' }, sec));
    for (const it of items) {
      const a = h('a', {
        class: 'nav-item',
        href: '#/' + it.id,
        dataset: { view: it.id },
      }, h('span', {}, t(it.labelKey)));
      navEl.appendChild(a);
    }
  }
  // logout
  shell.querySelector('[data-action=logout]').addEventListener('click', async () => {
    try { await api.post('/api/auth/logout', {}); } catch {}
    state.user = null; state.permissions = []; state.roles = null;
    renderLogin();
  });
  root.appendChild(shell);
  render();
}

function roleLabel(role) {
  return state.roles?.[role]?.label || role || 'unknown';
}

function navLabel(viewId) {
  const item = NAV.find(n => n.id === viewId);
  return item ? t(item.labelKey) : viewId;
}

function render() {
  if (!state.user) return;
  const route = parseHash();
  state.route = route;
  // Resolve which view function to use. "cases/<id>/..." is rendered by the
  // case detail view; everything else maps 1:1 to a VIEWS key.
  const isCaseDetail = route.view === 'cases' && route.params.rest.length > 0;
  const effectiveViewId = isCaseDetail ? 'caseDetail' : route.view;
  // mark active nav — case detail keeps the Cases item highlighted
  const navMatchId = isCaseDetail ? 'cases' : route.view;
  $$('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === navMatchId));
  // crumbs
  const crumbs = $('[data-bind=crumbs]');
  if (crumbs) {
    crumbs.innerHTML = '';
    if (isCaseDetail) {
      crumbs.append(
        h('span', {}, 'SAPTest · '),
        h('a', { href: '#/cases', style: { borderBottom: 'none', color: 'inherit' } }, navLabel('cases')),
        h('span', {}, ' · '),
        h('strong', { class: 'mono' }, route.params.rest[0]),
      );
    } else {
      crumbs.append(h('span', {}, 'SAPTest · '), h('strong', {}, navLabel(route.view)));
    }
  }
  // view
  const viewEl = $('[data-bind=view]');
  viewEl.innerHTML = '';
  viewEl.appendChild(h('div', { class: 'muted' }, t('shell.loading')));
  Promise.resolve()
    .then(() => (VIEWS[effectiveViewId] || VIEWS.dashboard)(route))
    .then(node => { viewEl.innerHTML = ''; viewEl.appendChild(node); })
    .catch(err => {
      viewEl.innerHTML = '';
      viewEl.appendChild(h('div', { class: 'card' },
        h('h2', {}, t('shell.loadFailed')),
        h('div', { class: 'muted' }, err.message),
      ));
    });
}

// ───────── View: Dashboard ─────────
VIEWS.dashboard = async () => {
  const wrap = h('div', { class: 'grid' });
  const stats = h('div', { class: 'grid cols-4' });
  wrap.appendChild(stats);

  let casesCount = 0, lastRun = null, latest = null, mergedRuns = 0, recentRuns = [];
  try {
    if (hasPerm('cases:read')) {
      const cs = await api.get('/api/cases'); casesCount = cs.cases.length;
    }
    if (hasPerm('results:read')) {
      const [rs, rr] = await Promise.all([
        api.get('/api/results'),
        api.get('/api/results/recent?limit=8').catch(() => ({ runs: [] })),
      ]);
      lastRun = rs.lastRun; latest = rs.stats.latest; mergedRuns = rs.stats.mergedRuns;
      recentRuns = rr.runs || [];
    }
  } catch (e) { /* ignore */ }

  stats.append(
    statCard(t('dashboard.stat.cases'), casesCount,
      hasPerm('cases:read') ? t('dashboard.stat.casesHint') : t('dashboard.stat.casesNoPerm'),
      hasPerm('cases:read') ? () => go('cases') : null),
    statCard(t('dashboard.stat.runs'), mergedRuns,
      hasPerm('results:read') ? t('dashboard.stat.runsHint') : t('dashboard.stat.runsNoPerm'),
      null),
    statCard(t('dashboard.stat.lastRun'),
      lastRun?.status ? lastRun.status.toUpperCase() : '—',
      lastRun?.failedTests?.length
        ? t('dashboard.stat.lastRunFailed', { n: lastRun.failedTests.length })
        : t('dashboard.stat.lastRunSource')),
    statCard(t('dashboard.stat.role'),
      roleLabel(state.user.role), t('dashboard.stat.permCount', { n: state.permissions.length })),
  );

  wrap.appendChild(h('div', { class: 'grid cols-2' },
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', {}, t('dashboard.quick.title'))),
      h('div', { class: 'row' },
        hasPerm('cases:read') && h('button', { class: 'btn primary', onClick: () => go('cases') }, t('dashboard.quick.cases')),
        hasPerm('agent:use') && h('button', { class: 'btn', onClick: () => go('generate') }, t('dashboard.quick.gen')),
        hasPerm('config:read') && h('button', { class: 'btn ghost', onClick: () => go('config') }, t('dashboard.quick.config')),
      ),
      h('div', { class: 'divider' }),
      h('div', { class: 'muted', style: { fontSize: '12.5px' } },
        t('dashboard.quick.desc.a'),
        h('span', { class: 'tag info' }, 'qwen3.6-plus'),
        t('dashboard.quick.desc.b'),
      ),
    ),
    h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', {}, t('dashboard.recent.title')),
        h('div', { class: 'row' },
          latest && h('button', { class: 'btn sm', onClick: () => openReportModal(latest) }, t('dashboard.report.preview')),
          latest && h('a', { class: 'btn sm ghost', href: reportPreviewUrl(latest.url), target: '_blank' }, t('dashboard.report.open')),
          hasPerm('results:read') && h('a', { class: 'btn sm ghost', href: '#/results', style: { borderBottom: 'none' } }, t('nav.results')),
        ),
      ),
      recentRuns.length === 0
        ? h('div', { class: 'muted' }, t('dashboard.recent.empty'))
        : h('ul', { class: 'recent-list' }, recentRuns.map(r => {
            const ok = r.status === 'passed';
            return h('li', { class: 'recent-item' },
              h('span', { class: 'status-dot ' + (ok ? 'ok' : 'err') }),
              h('a', {
                href: '#/cases/' + encodeURIComponent(r.caseId) + '/runs/' + encodeURIComponent(r.runId),
                class: 'mono',
                style: { borderBottom: 'none' },
              }, r.caseId),
              h('span', { class: 'spacer' }),
              h('span', { class: 'muted small' }, fmtMs(r.durationMs) || ''),
              h('span', { class: 'muted small' }, ' · '),
              h('span', { class: 'muted small' }, fmtRel(r.startedAt)),
            );
          })),
    ),
  ));

  return wrap;
};

function statCard(label, value, sub, onClick) {
  const el = h('div', { class: 'stat', style: onClick ? { cursor: 'pointer' } : {} },
    h('div', { class: 'label' }, label),
    h('div', { class: 'value' }, String(value)),
    sub && h('div', { class: 'sub' }, sub),
  );
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

// Append `?theme=light|dark` to a Midscene report URL so the in-report theme
// (injected by server/lib/strip-branding.js) matches the SAPTest UI. Falls
// back to prefers-color-scheme if the SPA hasn't pinned a theme.
function reportPreviewUrl(url) {
  if (!url) return url;
  let theme = document.documentElement.getAttribute('data-theme');
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}theme=${theme}`;
}

function openReportModal(report) {
  modal({
    title: report.name,
    wide: true,
    body: h('iframe', {
      src: reportPreviewUrl(report.url),
      style: { width: '100%', height: 'calc(80vh - 110px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', background: 'hsl(var(--background))' },
    }),
  });
}

// ───────── View: Test Cases (list) ─────────
// Cases are the primary entry point. Clicking a row navigates to the case
// detail page (#/cases/:id) where the user can edit parameters, run it, and
// review past runs — all in one place.
VIEWS.cases = async () => {
  const wrap = h('div', { class: 'grid' });
  // Fetch cases + recent runs in parallel; recent runs feed the per-case
  // "Last run" status column. Limit 500 covers ~25 runs per case for 20 cases.
  const [casesRes, recentRes] = await Promise.all([
    api.get('/api/cases'),
    api.get('/api/results/recent?limit=500').catch(() => ({ runs: [] })),
  ]);

  // Map caseId → most recent run (recent endpoint already sorts desc).
  const lastRunByCase = new Map();
  for (const r of recentRes.runs || []) {
    if (r.caseId && !lastRunByCase.has(r.caseId)) lastRunByCase.set(r.caseId, r);
  }

  // Sort: saptest1-8 first (in numeric order), then everything else by id.
  const saptestRank = (id) => {
    const m = /^saptest([1-8])$/.exec(id);
    return m ? Number(m[1]) : Infinity;
  };
  casesRes.cases.sort((a, b) => {
    const ra = saptestRank(a.id);
    const rb = saptestRank(b.id);
    if (ra !== rb) return ra - rb;
    return a.id.localeCompare(b.id);
  });

  const openDetail = (id) => go('cases/' + encodeURIComponent(id));

  wrap.appendChild(h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', {}, t('cases.title')),
      h('div', { class: 'row' },
        hasPerm('cases:write') && h('button', { class: 'btn primary sm', onClick: () => editCase(null) }, t('cases.new')),
        hasPerm('agent:use') && h('button', { class: 'btn sm', onClick: () => go('generate') }, t('cases.aiGen')),
      ),
    ),
    casesRes.cases.length === 0
      ? h('div', { class: 'muted' }, t('cases.empty'))
      : h('table', { class: 'tbl tbl-clickable' },
          h('thead', {}, h('tr', {},
            h('th', {}, t('cases.col.id')),
            h('th', {}, t('cases.col.summary')),
            h('th', {}, t('cases.col.spec')),
            h('th', {}, t('cases.col.modified')),
            h('th', {}, t('cases.col.size')),
            h('th', {}, t('cases.col.lastRun')),
            h('th', { class: 'actions' }, t('cases.col.actions')),
          )),
          h('tbody', {}, casesRes.cases.map(c => {
            const lastRun = lastRunByCase.get(c.id);
            let lastRunCell;
            if (!lastRun) {
              lastRunCell = h('span', { class: 'tag', style: { background: '#eee', color: '#666' } }, 'Not run');
            } else if (lastRun.status === 'passed') {
              lastRunCell = h('span', { class: 'tag ok', title: fmtRel(lastRun.finishedAt || lastRun.startedAt) }, 'Pass');
            } else {
              lastRunCell = h('span', { class: 'tag err', title: fmtRel(lastRun.finishedAt || lastRun.startedAt) }, 'Fail');
            }
            const row = h('tr', { dataset: { caseId: c.id } },
              h('td', {}, h('span', { class: 'mono' }, c.id)),
              h('td', {},
                c.parseError
                  ? h('span', { class: 'tag err' }, t('cases.jsonError') + c.parseError)
                  : h('div', {},
                      c.summary?.transactionCode && h('span', { class: 'tag info' }, t('cases.txPrefix') + c.summary.transactionCode),
                      ' ',
                      c.summary?.favoritesEntry && h('span', { class: 'tag' }, c.summary.favoritesEntry),
                    ),
              ),
              h('td', {},
                c.specPath
                  ? h('span', { class: 'mono' }, c.specPath)
                  : h('span', { class: 'tag warn' }, t('cases.noSpec')),
              ),
              h('td', {}, fmtRel(c.modifiedAt)),
              h('td', {}, fmtBytes(c.bytes)),
              h('td', {}, lastRunCell),
              h('td', { class: 'actions' },
                h('button', { class: 'btn sm', onClick: (e) => { e.stopPropagation(); openDetail(c.id); } }, t('cases.openDetail')),
                ' ',
                hasPerm('runs:execute') && h('button', {
                  class: 'btn sm',
                  disabled: !c.summary?.hasApiGuide,
                  title: c.summary?.hasApiGuide
                    ? `Run apiGuide (${c.summary.apiStepCount} steps) headed, write cache`
                    : 'No apiGuide on this case — click "Gen API" first',
                  onClick: (e) => { e.stopPropagation(); openJsRunModal(c.id, 'write'); },
                }, 'Run JS'),
                ' ',
                hasPerm('runs:execute') && h('button', {
                  class: 'btn sm',
                  disabled: !c.summary?.hasApiGuide,
                  title: c.summary?.hasApiGuide
                    ? 'Replay using midscene_run/cache (read-write strategy)'
                    : 'No apiGuide on this case',
                  onClick: (e) => { e.stopPropagation(); openJsRunModal(c.id, 'read'); },
                }, 'Run JS w/ Cache'),
                ' ',
                hasPerm('cases:delete') && h('button', {
                  class: 'btn danger sm',
                  onClick: (e) => { e.stopPropagation(); deleteCase(c.id); },
                }, t('cases.delete')),
              ),
            );
            row.addEventListener('click', () => openDetail(c.id));
            return row;
          })),
        ),
  ));
  return wrap;
};

async function viewSpec(name) {
  const s = await api.get('/api/cases/_specs/' + encodeURIComponent(name));
  modal({
    title: name,
    wide: true,
    body: h('pre', { class: 'code-block' }, s.text),
  });
}

async function editCase(id) {
  let initial = '{\n  "$schema": "Parameters for new-case.spec.ts",\n  "title": "",\n  "sapUrl": "",\n  "transactionCode": ""\n}\n';
  let initialId = '';
  if (id) {
    const c = await api.get('/api/cases/' + encodeURIComponent(id));
    initial = c.raw;
    initialId = id;
  }
  const idInput = h('input', { value: initialId, placeholder: t('cases.idPlaceholder'), disabled: !!id });
  const ta = h('textarea', { style: { minHeight: '380px' } }, initial);
  const err = h('div', { class: 'muted', style: { color: 'var(--err)', minHeight: '18px' } });
  const m = modal({
    title: id ? t('cases.editTitle') + id : t('cases.newTitle'),
    wide: true,
    body: h('div', {},
      h('div', { class: 'field' }, h('span', {}, t('cases.idLabel')), idInput),
      h('div', { class: 'field' }, h('span', {}, t('cases.paramsLabel')), ta),
      err,
      h('div', { class: 'muted', style: { fontSize: '12px' } }, t('cases.tipSave')),
    ),
    footer: h('div', { class: 'row', style: { marginLeft: 'auto' } },
      h('button', { class: 'btn primary', onClick: async () => {
        err.textContent = '';
        const newId = idInput.value.trim();
        if (!/^[a-zA-Z0-9_\-]+$/.test(newId)) { err.textContent = t('cases.idBadChars'); return; }
        let parsed;
        try { parsed = JSON.parse(ta.value); } catch (e) { err.textContent = t('cases.jsonParseFail') + e.message; return; }
        try {
          await api.put('/api/cases/' + encodeURIComponent(newId), parsed);
          toast(id ? t('cases.saved') : t('cases.created'), 'ok');
          m.close();
          render();
        } catch (e) { err.textContent = e.message; }
      }}, t('cases.save')),
    ),
  });
}

async function deleteCase(id) {
  if (!confirm(t('cases.confirmDelete', { id }))) return;
  try {
    await api.del('/api/cases/' + encodeURIComponent(id));
    toast(t('cases.deleted'), 'ok');
    render();
  } catch (e) { toast(e.message, 'err'); }
}

// ───────── Run panel (embedded inside the case detail page) ─────────
// Module-level WebSocket so we can tear it down before opening a new one when
// the user navigates between case detail pages.
let runWs = null;

function fmtMs(ms) {
  if (ms == null || !Number.isFinite(ms)) return '';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const m = Math.floor(ms / 60_000), s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

function clearStepStatuses(previewEl) {
  if (!previewEl) return;
  for (const n of previewEl.querySelectorAll('.step')) {
    n.classList.remove('is-running', 'is-passed', 'is-failed');
    const s = n.querySelector(':scope > .step-head > .step-status');
    if (s) { s.textContent = '○'; s.title = t('run.preview.status.pending'); }
    const d = n.querySelector(':scope > .step-head > .step-duration');
    if (d) d.textContent = '';
    const e = n.querySelector(':scope > .step-error');
    if (e) { e.textContent = ''; e.style.display = 'none'; }
  }
}

function applyEventToPreview(previewEl, evt) {
  if (!evt || !previewEl) return;
  if (evt.type === 'session' && evt.phase === 'begin') {
    clearStepStatuses(previewEl);
    return;
  }
  if (evt.type !== 'step' || evt.line == null) return;
  const node = previewEl.querySelector(`.step[data-step-line="${evt.line}"]`);
  if (!node) return;
  const statusEl = node.querySelector(':scope > .step-head > .step-status');
  const durEl = node.querySelector(':scope > .step-head > .step-duration');
  const errEl = node.querySelector(':scope > .step-error');
  if (evt.phase === 'begin') {
    node.classList.remove('is-passed', 'is-failed');
    node.classList.add('is-running');
    if (statusEl) { statusEl.textContent = '◐'; statusEl.title = t('run.preview.status.running'); }
    if (durEl) durEl.textContent = '';
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
    try { node.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch {}
  } else if (evt.phase === 'end') {
    node.classList.remove('is-running');
    const ok = evt.status === 'passed';
    node.classList.add(ok ? 'is-passed' : 'is-failed');
    if (statusEl) {
      statusEl.textContent = ok ? '✓' : '✗';
      statusEl.title = t(ok ? 'run.preview.status.passed' : 'run.preview.status.failed');
    }
    if (durEl) durEl.textContent = fmtMs(evt.durationMs);
    if (errEl && !ok && evt.errorMessage) {
      errEl.textContent = evt.errorMessage;
      errEl.style.display = '';
    }
  }
}

// Builds the run UI for a single spec. Two modes:
//   live   — open the WS, stream logs/events, allow Start/Stop.
//   replay — render the step tree once, replay the supplied events,
//            show a banner telling the user they're looking at history.
async function createRunPanel({ specPath, replayRun = null, onAfterRun }) {
  const isReplay = !!replayRun;
  const consoleEl = h('div', { class: 'console' });
  const reportLink = h('div', { class: 'muted' });
  const previewEl = h('div', { class: 'step-preview' },
    h('div', { class: 'muted' }, t('run.preview.loading')));

  // Header — status + controls (live) or replay banner.
  const statusEl = h('div', { class: 'muted', html: statusHtml({ running: false }) });
  const headedChk = h('input', { type: 'checkbox' });
  const cacheChk  = h('input', { type: 'checkbox' });
  const cacheStrategySel = h('select', { disabled: true },
    h('option', { value: 'read-write' }, t('run.cacheStrategy.readWrite')),
    h('option', { value: 'read-only' },  t('run.cacheStrategy.readOnly')),
    h('option', { value: 'write-only' }, t('run.cacheStrategy.writeOnly')),
  );
  cacheChk.addEventListener('change', () => { cacheStrategySel.disabled = !cacheChk.checked; });
  const clearCacheBtn = h('button', { class: 'btn sm ghost', type: 'button' }, t('run.cacheClear'));
  clearCacheBtn.addEventListener('click', async () => {
    if (!confirm(t('run.cacheClear.confirm'))) return;
    try {
      const r = await api.del('/api/run/cache');
      toast(t('run.cacheClear.done', { n: r.removed ?? 0 }), 'ok');
    } catch (e) { toast(e.message, 'err'); }
  });
  const startBtn = h('button', { class: 'btn primary' }, t('detail.runNow'));
  const stopBtn  = h('button', { class: 'btn danger', disabled: true }, t('run.stop'));

  function appendLog(entry) {
    const ln = h('div', { class: 'ln ' + (entry.stream || '') });
    const ts = new Date(entry.ts || Date.now()).toLocaleTimeString();
    ln.append(h('span', { class: 'ts' }, ts), entry.line || '');
    consoleEl.appendChild(ln);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
  function setStatus(s, report) {
    statusEl.innerHTML = statusHtml(s);
    const runningThisSpec = s.running && s.spec === specPath;
    startBtn.disabled = s.running || !hasPerm('runs:execute');
    stopBtn.disabled = !runningThisSpec || !hasPerm('runs:stop');
    // Lock cache controls while ANY run is in progress — the server refuses
    // cache mutations during a run, and the toggles only take effect at spawn.
    cacheChk.disabled = s.running || !hasPerm('runs:execute');
    cacheStrategySel.disabled = s.running || !cacheChk.checked || !hasPerm('runs:execute');
    clearCacheBtn.disabled = s.running || !hasPerm('runs:execute');
    if (report) {
      reportLink.innerHTML = '';
      reportLink.append(
        t('run.report'),
        ' ',
        h('a', { class: 'mono', href: reportPreviewUrl(report.url), target: '_blank' }, report.name),
        ' ',
        h('button', { class: 'btn sm', onClick: () => openReportModal(report) }, t('dashboard.report.preview')),
      );
    }
  }

  // Load the static step tree for this spec.
  let runEvents = [];
  async function loadPreview() {
    const name = specPath.replace(/^e2e\//, '');
    try {
      const data = await api.get('/api/cases/_specs/' + encodeURIComponent(name) + '/steps');
      previewEl.innerHTML = '';
      previewEl.appendChild(renderPreview(data));
      runEvents.forEach(evt => applyEventToPreview(previewEl, evt));
    } catch (e) {
      previewEl.innerHTML = '';
      previewEl.appendChild(h('div', { class: 'muted' }, t('run.preview.loadFailed') + e.message));
    }
  }

  // ── Replay mode ──────────────────────────────────────────────
  if (isReplay) {
    runEvents = Array.isArray(replayRun.events) ? replayRun.events.slice() : [];
    await loadPreview();
    const when = fmtDate(replayRun.startedAt);
    const banner = h('div', { class: 'replay-banner' },
      h('span', {}, t('detail.replayBanner', { when })),
      h('span', { class: 'spacer' }),
      h('a', {
        href: '#/cases/' + encodeURIComponent(replayRun.caseId) + '/run',
        class: 'btn sm',
        style: { borderBottom: 'none' },
      }, t('detail.replayLive')),
    );
    if (replayRun.report) {
      reportLink.innerHTML = '';
      reportLink.append(
        t('run.report'),
        ' ',
        h('a', { class: 'mono', href: reportPreviewUrl(replayRun.report.url), target: '_blank' }, replayRun.report.name),
        ' ',
        h('button', { class: 'btn sm', onClick: () => openReportModal(replayRun.report) }, t('dashboard.report.preview')),
      );
    }
    // Logs aren't shown for replays (we only persist a tail; future work).
    consoleEl.style.display = 'none';
    return {
      root: h('div', { class: 'grid' },
        banner,
        previewEl,
        h('div', { style: { marginTop: '10px' } }, reportLink),
      ),
      dispose: () => {},
    };
  }

  // ── Live mode ────────────────────────────────────────────────
  startBtn.addEventListener('click', async () => {
    consoleEl.innerHTML = '';
    reportLink.innerHTML = '';
    runEvents = [];
    clearStepStatuses(previewEl);
    try {
      await api.post('/api/run/start', {
        spec: specPath,
        headed: headedChk.checked,
        useCache: cacheChk.checked,
        cacheStrategy: cacheChk.checked ? cacheStrategySel.value : null,
      });
      toast(t('run.started'), 'ok');
    } catch (e) { toast(e.message, 'err'); }
  });
  stopBtn.addEventListener('click', async () => {
    if (!confirm(t('run.confirmStop'))) return;
    try { await api.post('/api/run/stop', {}); toast(t('run.stopSent'), 'warn'); }
    catch (e) { toast(e.message, 'err'); }
  });

  await loadPreview();

  // Open WebSocket. We replace any previous connection so an older case
  // detail page can't keep mutating the new panel's DOM.
  try { runWs?.close(); } catch {}
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws/run`);
  runWs = ws;
  ws.onmessage = (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.type === 'hello') {
      setStatus(msg.status);
      (msg.backlog || []).forEach(appendLog);
      // Only paint events from a run that actually belongs to this spec —
      // a leftover run for a different case shouldn't smear status onto
      // unrelated steps.
      const evts = Array.isArray(msg.events) ? msg.events.slice() : [];
      if (msg.status?.spec === specPath) {
        runEvents = evts;
        evts.forEach(evt => applyEventToPreview(previewEl, evt));
      }
    } else if (msg.type === 'log') {
      // Only show logs for runs of this spec.
      if (!ws._currentSpec || ws._currentSpec === specPath) appendLog(msg);
    } else if (msg.type === 'event') {
      if (msg.event && (!ws._currentSpec || ws._currentSpec === specPath)) {
        runEvents.push(msg.event);
        applyEventToPreview(previewEl, msg.event);
      }
    } else if (msg.type === 'status') {
      ws._currentSpec = msg.status?.spec || ws._currentSpec;
      setStatus(msg.status, msg.report);
      // When a run finishes, refresh any caller-supplied history list.
      if (!msg.status?.running && onAfterRun) onAfterRun();
    }
  };
  try {
    const s = await api.get('/api/run/status');
    ws._currentSpec = s.spec || null;
    setStatus(s);
  } catch {}

  return {
    root: h('div', { class: 'grid' },
      h('div', { class: 'row', style: { alignItems: 'center', flexWrap: 'wrap', gap: '8px' } },
        statusEl,
        h('span', { class: 'spacer' }),
        h('label', { class: 'row', style: { gap: '6px' }, title: t('run.useCache.tip') },
          cacheChk, h('span', { class: 'muted' }, t('run.useCache')),
        ),
        cacheStrategySel,
        clearCacheBtn,
        h('label', { class: 'row', style: { gap: '6px' } },
          headedChk, h('span', { class: 'muted' }, t('run.headed')),
        ),
        startBtn,
        stopBtn,
      ),
      previewEl,
      consoleEl,
      h('div', { style: { marginTop: '10px' } }, reportLink),
    ),
    dispose: () => { try { ws.close(); } catch {} },
  };
}

// VIEWS.run is kept as a redirect so any stale link or cached hash still lands
// somewhere sensible — the run flow itself now lives inside VIEWS.caseDetail.
VIEWS.run     = async () => { go('cases'); return h('div', { class: 'muted' }, t('shell.loading')); };

// Cross-case browser for every Midscene/Playwright HTML report under
// midscene_run/report. Per-case history is still on the case detail page;
// this view exists so users can pull up any historical report without
// remembering which case produced it.
VIEWS.results = async () => {
  const wrap = h('div', { class: 'grid' });

  const filterInput = h('input', {
    type: 'search',
    placeholder: t('results.filter.placeholder'),
    style: { minWidth: '220px', flex: '1' },
  });
  const kindSel = h('select', {},
    h('option', { value: 'all' },    t('results.kind.all')),
    h('option', { value: 'merged' }, t('results.kind.merged')),
    h('option', { value: 'single' }, t('results.kind.single')),
    h('option', { value: 'other' },  t('results.kind.other')),
  );
  const refreshBtn = h('button', { class: 'btn sm' }, t('results.refresh'));

  const tbody = h('tbody', {});
  const emptyEl = h('div', { class: 'muted', style: { display: 'none', padding: '8px 4px' } }, t('results.empty'));
  const summary = h('div', { class: 'muted small', style: { marginTop: '8px' } });

  let items = [];

  const kindTagClass = (k) => k === 'merged' ? 'tag ok' : k === 'single' ? 'tag info' : 'tag';

  function paint() {
    const q = filterInput.value.trim().toLowerCase();
    const k = kindSel.value;
    const filtered = items.filter(it =>
      (k === 'all' || it.kind === k) &&
      (!q || it.name.toLowerCase().includes(q))
    );
    tbody.innerHTML = '';
    emptyEl.style.display = filtered.length ? 'none' : 'block';
    for (const it of filtered) {
      tbody.appendChild(h('tr', {},
        h('td', {}, h('span', { class: kindTagClass(it.kind) }, t('results.kind.' + it.kind))),
        h('td', { class: 'mono', style: { wordBreak: 'break-all', maxWidth: '520px' } }, it.name),
        h('td', {}, fmtDate(it.modifiedAt)),
        h('td', { class: 'mono' }, fmtBytes(it.bytes)),
        h('td', { class: 'actions' },
          h('button', { class: 'btn sm', onClick: () => openReportModal(it) }, t('dashboard.report.preview')),
          ' ',
          h('a', { class: 'btn sm', href: reportPreviewUrl(it.url), target: '_blank', rel: 'noopener' }, t('results.col.openTab')),
        ),
      ));
    }
    summary.textContent = t('results.summary', { shown: filtered.length, total: items.length });
  }

  async function load() {
    try {
      const r = await api.get('/api/results');
      items = r.items || [];
      paint();
    } catch (e) {
      items = [];
      tbody.innerHTML = '';
      emptyEl.style.display = 'block';
      emptyEl.textContent = e.message || t('shell.loadFailed');
      summary.textContent = '';
    }
  }

  filterInput.addEventListener('input', paint);
  kindSel.addEventListener('change', paint);
  refreshBtn.addEventListener('click', load);

  wrap.appendChild(h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', {}, t('results.title')),
      h('div', { class: 'row' }, filterInput, kindSel, refreshBtn),
    ),
    h('div', { class: 'muted', style: { marginBottom: '8px', fontSize: '12.5px' } }, t('results.subtitle')),
    h('table', { class: 'tbl' },
      h('thead', {}, h('tr', {},
        h('th', {}, t('results.col.kind')),
        h('th', {}, t('results.col.name')),
        h('th', {}, t('results.col.when')),
        h('th', {}, t('results.col.size')),
        h('th', { class: 'actions' }, t('cases.col.actions')),
      )),
      tbody,
    ),
    emptyEl,
    summary,
  ));

  await load();
  return wrap;
};

// ───────── Step preview rendering ─────────
// Resolve `params.foo.bar` against the parameter JSON loaded alongside the
// spec. Returns null if any segment isn't found, so the caller can fall back
// to showing the raw token.
function resolveParamPath(params, path) {
  if (!params || typeof path !== 'string') return null;
  const m = path.trim().match(/^params(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)+$/);
  if (!m) return null;
  const segs = path.trim().split('.').slice(1);
  let cur = params;
  for (const s of segs) {
    if (cur == null || typeof cur !== 'object' || !(s in cur)) return null;
    cur = cur[s];
  }
  if (cur && typeof cur === 'object') return null;
  return String(cur);
}

// Replace ${params.x.y} inside a string with the resolved value, returning
// rich segments so the UI can style resolved values distinctly.
function resolveTemplateText(text, params) {
  if (typeof text !== 'string' || !text) return [{ kind: 'text', value: text || '' }];
  const parts = [];
  const re = /\$\{([^}]+)\}/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', value: text.slice(last, m.index) });
    const expr = m[1];
    const resolved = resolveParamPath(params, expr);
    if (resolved != null) {
      parts.push({ kind: 'resolved', value: resolved, source: expr });
    } else {
      parts.push({ kind: 'expr', value: '${' + expr + '}' });
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) });
  return parts;
}

function renderResolvedText(parts) {
  return parts.map(p => {
    if (p.kind === 'resolved') {
      return h('span', { class: 'tok-resolved', title: t('run.preview.resolvedParam') + ' (' + p.source + ')' }, p.value);
    }
    if (p.kind === 'expr') {
      return h('span', { class: 'tok-expr' }, p.value);
    }
    return document.createTextNode(p.value);
  });
}

// Pick a glyph for each kind of action.
function actionGlyph(kind) {
  switch (kind) {
    case 'ai':            return '✦';
    case 'aiTap':         return '◉';
    case 'aiInput':       return '⌨';
    case 'aiHover':       return '◌';
    case 'aiScroll':      return '↕';
    case 'aiQuery':       return '?';
    case 'aiAssert':      return '✓';
    case 'aiKeyboardPress': return '⏎';
    case 'aiWaitFor':     return '⏳';
    case 'helper':        return '⚙';
    case 'call':          return '→';
    default:              return '·';
  }
}

function renderAction(a, params) {
  const head = h('div', { class: 'act-head' },
    h('span', { class: 'act-glyph k-' + a.kind }, actionGlyph(a.kind)),
    h('span', { class: 'act-kind' }, (a.kind === 'helper' || a.kind === 'call') ? a.name : a.kind),
  );
  if (a.conditional) head.appendChild(h('span', { class: 'badge cond' }, t('run.preview.conditional')));
  if (a.loop)        head.appendChild(h('span', { class: 'badge loop' }, t('run.preview.loop')));
  if (a.wrappedIn)   head.appendChild(h('span', { class: 'badge retry' }, t('run.preview.retried')));

  let body;
  if (a.kind === 'helper' || a.kind === 'call') {
    // e.g. fillSapField(page, "Company code", params.query.companyCode)
    body = h('div', { class: 'act-body' },
      a.args.map((arg, i) => h('span', { class: 'arg' },
        i > 0 ? ', ' : '',
        ...renderResolvedText(resolveTemplateText(String(arg), params)),
      )),
    );
  } else if (a.kind === 'aiInput') {
    // aiInput("value", "into hint")
    const value = a.text ?? '';
    const hint = a.hint ?? '';
    body = h('div', { class: 'act-body' },
      h('span', { class: 'arg' }, ...renderResolvedText(resolveTemplateText(value, params))),
      hint ? h('span', { class: 'arg-sep' }, ' → ') : null,
      hint ? h('span', { class: 'arg arg-hint' }, ...renderResolvedText(resolveTemplateText(hint, params))) : null,
    );
  } else {
    body = h('div', { class: 'act-body' },
      h('span', { class: 'arg arg-text' }, ...renderResolvedText(resolveTemplateText(a.text || '', params))),
    );
  }

  return h('li', { class: 'act' + (a.conditional ? ' is-cond' : '') + (a.loop ? ' is-loop' : '') },
    head, body,
    h('span', { class: 'act-line mono' }, ':' + a.line),
  );
}

function renderStep(step, idx, params, specPath) {
  const statusEl = h('span', {
    class: 'step-status',
    title: t('run.preview.status.pending'),
  }, '○');
  const durationEl = h('span', { class: 'step-duration mono' });
  const errorEl = h('div', { class: 'step-error mono' });
  const headBits = [
    statusEl,
    h('span', { class: 'step-num' }, '#' + (idx + 1)),
    h('span', { class: 'step-title' }, step.title),
  ];
  if (step.conditional) headBits.push(h('span', { class: 'badge cond' }, t('run.preview.conditional')));
  if (step.loop)        headBits.push(h('span', { class: 'badge loop' }, t('run.preview.loop')));
  if (step.actions?.length)  headBits.push(h('span', { class: 'muted small' }, t('run.preview.actionsCount', { n: step.actions.length })));
  if (step.children?.length) headBits.push(h('span', { class: 'muted small' }, t('run.preview.stepsCount', { n: step.children.length })));

  const actionList = step.actions?.length
    ? h('ol', { class: 'act-list' }, step.actions.map(a => renderAction(a, params)))
    : null;

  const childList = step.children?.length
    ? h('ol', { class: 'step-list nested' }, step.children.map((c, i) => renderStep(c, i, params, specPath)))
    : null;

  return h('li', {
    class: 'step',
    dataset: { stepLine: String(step.line), stepTitle: step.title },
  },
    h('div', { class: 'step-head' },
      ...headBits,
      durationEl,
      h('span', { class: 'step-line mono' }, ':' + step.line),
    ),
    errorEl,
    actionList,
    childList,
  );
}

function renderPreview(data) {
  const tests = data.tests || [];
  if (tests.length === 0 || tests.every(t => !t.steps?.length && !t.actions?.length)) {
    return h('div', { class: 'muted' }, t('run.preview.noSteps'));
  }
  const wrap = h('div', { class: 'preview-card' });
  wrap.appendChild(h('div', { class: 'preview-head' },
    h('strong', {}, t('run.preview.title')),
    h('span', { class: 'muted small' }, ' · ' + t('run.preview.subtitle')),
  ));
  for (const tc of tests) {
    wrap.appendChild(h('div', { class: 'test-head' },
      h('span', { class: 'test-tag' }, t('run.preview.test')),
      h('span', { class: 'test-title mono' }, tc.title),
    ));
    if (tc.steps?.length) {
      wrap.appendChild(h('ol', { class: 'step-list' },
        tc.steps.map((s, i) => renderStep(s, i, data.params, data.file)),
      ));
    }
    if (tc.actions?.length) {
      // Actions before the first test.step (rare).
      wrap.appendChild(h('ol', { class: 'act-list act-orphan' },
        tc.actions.map(a => renderAction(a, data.params)),
      ));
    }
  }
  return wrap;
}

function statusHtml(s) {
  if (!s) return '';
  let dot = 'idle', label = t('run.status.idle');
  if (s.running) { dot = 'running'; label = t('run.status.running'); }
  else if (s.exitCode === 0) { dot = 'ok'; label = t('run.status.passed'); }
  else if (s.exitCode != null && s.exitCode !== 0) { dot = 'err'; label = t('run.status.failed', { code: s.exitCode }); }
  const who = s.startedBy ? t('run.status.startedBy', { user: esc(s.startedBy) }) : '';
  const spec = s.spec ? ` · <span class="mono">${esc(s.spec)}</span>` : '';
  return `<span class="status-dot ${dot}"></span>${label}${spec}${who}`;
}

// ───────── View: Case detail (params + run + history under one roof) ─────────
// Route shapes handled here (segs[0] is always "cases"):
//   ['<id>']                     → params tab
//   ['<id>', 'run']              → run tab, live
//   ['<id>', 'runs', '<runId>']  → run tab, replaying a past run
//   ['<id>', 'history']          → history tab
VIEWS.caseDetail = async (route) => {
  const [caseId, sub, runId] = route.params.rest;

  // Resolve which tab is active. The run tab handles both live and replay.
  let activeTab = 'params';
  let replayRunId = null;
  if (sub === 'run') activeTab = 'run';
  else if (sub === 'runs' && runId) { activeTab = 'run'; replayRunId = runId; }
  else if (sub === 'history') activeTab = 'history';

  // Load the case + spec metadata in parallel. Missing case → friendly 404.
  let caseData;
  try {
    caseData = await api.get('/api/cases/' + encodeURIComponent(caseId));
  } catch (e) {
    return h('div', { class: 'card' },
      h('h2', {}, t('detail.notFound')),
      h('div', { class: 'muted' }, e.message),
      h('div', { style: { marginTop: '12px' } },
        h('a', { class: 'btn', href: '#/cases' }, t('detail.backToList'))),
    );
  }
  const specName = caseId + '.spec.ts';
  const specRelPath = 'e2e/' + specName;
  // Midscene-shape cases (saptest1-8) have apiGuide but no spec.ts file, so
  // skip the spec/steps GET to silence the noisy 404 spam in DevTools console.
  const isMidsceneShapeCase = !!(
    caseData.parsed && typeof caseData.parsed === 'object' &&
    ('naturalLanguage' in caseData.parsed || 'apiGuide' in caseData.parsed || 'jsSource' in caseData.parsed)
  );
  const [stepsTree, runsList] = await Promise.all([
    isMidsceneShapeCase
      ? Promise.resolve(null)
      : api.get('/api/cases/_specs/' + encodeURIComponent(specName) + '/steps').catch(() => null),
    hasPerm('results:read') ? api.get('/api/cases/' + encodeURIComponent(caseId) + '/runs').catch(() => ({ runs: [] })) : Promise.resolve({ runs: [] }),
  ]);
  const hasSpec = !!stepsTree;
  const latestRun = runsList.runs?.[0] || null;
  const summary = caseData.parsed && typeof caseData.parsed === 'object' ? summarizeParsed(caseData.parsed) : {};

  // ── Header (always visible above the tabs) ──
  const header = h('div', { class: 'case-header' },
    h('div', { class: 'case-header-top' },
      h('a', { class: 'case-back', href: '#/cases' }, t('detail.backToList')),
      h('div', { class: 'spacer' }),
      hasSpec && hasPerm('runs:execute') && activeTab !== 'run' && h('button', {
        class: 'btn primary',
        onClick: () => go('cases/' + encodeURIComponent(caseId) + '/run'),
      }, t('detail.runNow')),
    ),
    h('div', { class: 'case-title-row' },
      h('h1', { class: 'case-title' }, summary.title || caseId),
      summary.transactionCode && h('span', { class: 'tag info' }, t('cases.txPrefix') + summary.transactionCode),
      summary.favoritesEntry && h('span', { class: 'tag' }, summary.favoritesEntry),
    ),
    h('div', { class: 'case-meta-row' },
      h('span', { class: 'kv-inline' },
        h('span', { class: 'muted' }, t('detail.summary.id')), ' ',
        h('span', { class: 'mono' }, caseId)),
      hasSpec
        ? h('span', { class: 'kv-inline' },
            h('span', { class: 'muted' }, t('detail.summary.spec')), ' ',
            h('a', {
              class: 'mono',
              href: '#',
              onClick: (e) => { e.preventDefault(); viewSpec(specName); },
            }, specRelPath))
        : h('span', { class: 'tag warn' }, t('cases.noSpec')),
      h('span', { class: 'kv-inline' },
        h('span', { class: 'muted' }, t('detail.latest')), ' ',
        latestRun
          ? renderRunChip(latestRun, caseId)
          : h('span', { class: 'muted' }, t('detail.never'))),
      runsList.runs?.length
        ? h('span', { class: 'muted small' }, t('detail.runs.count', { n: runsList.runs.length }))
        : null,
    ),
  );

  // ── Tabs ──
  // Steps & Run is always enabled now: no-spec cases (Midscene JS) get a
  // dedicated apiGuide-aware view instead of the Playwright spec runner.
  const tabBar = h('div', { class: 'tabs' },
    tabLink('params',  t('detail.tabs.params'),  'cases/' + encodeURIComponent(caseId)),
    tabLink('run',     t('detail.tabs.run'),     'cases/' + encodeURIComponent(caseId) + '/run'),
    tabLink('history', t('detail.tabs.history'), 'cases/' + encodeURIComponent(caseId) + '/history'),
  );
  function tabLink(id, label, target, disabled) {
    const a = h('a', {
      class: 'tab' + (id === activeTab ? ' active' : '') + (disabled ? ' disabled' : ''),
      href: disabled ? null : '#/' + target,
    }, label);
    return a;
  }

  // ── Body, varies per tab ──
  const body = h('div', { class: 'case-tab-body' });
  if (activeTab === 'params') {
    body.appendChild(renderParamsTab(caseData, stepsTree));
  } else if (activeTab === 'run') {
    let replayRun = null;
    if (replayRunId) {
      try { replayRun = await api.get('/api/cases/' + encodeURIComponent(caseId) + '/runs/' + encodeURIComponent(replayRunId)); }
      catch (e) { body.appendChild(h('div', { class: 'card' }, h('div', { class: 'muted' }, e.message))); }
    }
    if (!replayRunId || replayRun) {
      if (!hasSpec) {
        // Midscene JS case (no Playwright spec). Render an apiGuide-aware
        // panel instead of just "no spec": last-run summary + report link
        // + step list + Run buttons.
        body.appendChild(renderMidsceneJsTab(caseData, runsList.runs || []));
      } else {
        const panel = await createRunPanel({
          specPath: specRelPath,
          replayRun,
          onAfterRun: () => { /* user can hit history tab to see the new entry */ },
        });
        body.appendChild(h('div', { class: 'card' }, panel.root));
      }
    }
  } else if (activeTab === 'history') {
    body.appendChild(renderHistoryTab(caseId, runsList.runs || []));
  }

  return h('div', { class: 'case-detail' }, header, tabBar, body);
};

// Inline summary helper used by the case-detail header (mirrors what the
// server returns under c.summary on the list endpoint).
function summarizeParsed(p) {
  if (!p || typeof p !== 'object') return {};
  return {
    title: p.title || null,
    transactionCode: p.transactionCode || null,
    favoritesEntry: p.favoritesEntry || null,
  };
}

// A small chip showing pass/fail + relative time for one run. Optionally
// links to the replay route when caseId is provided.
function renderRunChip(run, caseId) {
  const ok = run.status === 'passed';
  const wrap = h('span', { class: 'run-chip' },
    h('span', { class: 'status-dot ' + (ok ? 'ok' : 'err') }),
    h('span', {}, ok ? t('history.status.passed') : t('history.status.failed')),
    h('span', { class: 'muted small' }, ' · ' + fmtRel(run.startedAt)),
  );
  if (caseId && run.runId) {
    return h('a', {
      href: '#/cases/' + encodeURIComponent(caseId) + '/runs/' + encodeURIComponent(run.runId),
      style: { borderBottom: 'none' },
    }, wrap);
  }
  return wrap;
}

// ── NL ↔ params value sync ──
// NL 文本里通常会内嵌输入值（"company code输入8540"），Auto Parameters 编辑器
// 又把同一个值单独列出来 — 两边其实是同一份"输入框内容"的两种视图。这个函数
// 在 save 时把改动从一侧传播到另一侧：
//   - 只改了 params → 在 NL 里把旧值就地替换成新值
//   - 只改了 NL    → 用 locator 作锚点从新 NL 里抓出新值，回填 params
//   - 两边都改了   → 不动（尊重用户的显式编辑）
// 注意：apiGuide 不进 hash 之外的字段无影响；values 改了 cache 也不会失效。
function collectAiInputStepsForSync(apiGuide) {
  const out = [];
  for (const s of apiGuide?.steps ?? []) {
    const api = String(s.midsceneApi || '').toLowerCase();
    if (!api.includes('aiinput')) continue;
    const m = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{\s*value\s*:\s*(['"`])([\s\S]*?)\3\s*\}\s*\)/.exec(s.exampleCode || '');
    if (!m) continue;
    out.push({
      order: s.order,
      locator: m[2],
      defaultValue: m[4],
      instruction: s.naturalLanguageInstruction || '',
    });
  }
  // Sort by step order so forward replacement scans NL left-to-right and
  // disambiguates duplicate values across multiple aiInput steps.
  out.sort((a, b) => Number(a.order) - Number(b.order));
  return out;
}

// Find the longest prefix of `locator` that actually appears in `nl`. Handles
// cases where the apiGuide locator is "左上角矩形" but NL writes "左上角矩形输入框".
function findAnchorInNL(nl, locator) {
  if (!nl || !locator) return -1;
  let anchor = locator;
  while (anchor.length >= 2) {
    const i = nl.indexOf(anchor);
    if (i >= 0) return i + anchor.length;
    anchor = anchor.slice(0, -1);
  }
  return -1;
}

// After the locator anchor in NL, skip an optional suffix ("输入框", "字段" …)
// and a connector ("输入", ":", "=", " "), then capture the value up to the
// next terminator. Terminators include CJK comma/period, ASCII comma/semi,
// newline, and ASCII whitespace — but NOT ASCII '.', because real values
// often contain it ("30.04.2026", "S_ALR_87011990", file extensions, ...).
// If a value is followed by an ASCII period sentence ender ("8540."), the
// period will be captured as part of the value; the user can clean it up.
function extractValueAfterAnchor(nl, anchorEnd) {
  let rest = nl.slice(anchorEnd);
  rest = rest.replace(/^(输入框|输入栏|字段|栏目|栏|框|处|input|field|box)+/i, '');
  rest = rest.replace(/^[\s　]*(输入为|输入|为|=|：|:|=)?[\s　]*/, '');
  const m = rest.match(/^([^,，。\n;；、\t ]+?)(?=[,，。\n;；、\t ]|$)/);
  if (!m) return null;
  const captured = m[1].trim();
  return captured || null;
}

function syncNlAndParams({ oldNL, newNL, oldParams, newParams, apiGuide }) {
  const steps = collectAiInputStepsForSync(apiGuide);
  if (!steps.length) {
    console.log('[sync] skipped (no aiInput steps in apiGuide)');
    return { nl: newNL ?? '', params: newParams ?? {} };
  }

  const nlChanged = (oldNL ?? '') !== (newNL ?? '');
  const paramsChanged = JSON.stringify(oldParams ?? {}) !== JSON.stringify(newParams ?? {});
  console.log('[sync] entry — nlChanged:', nlChanged, 'paramsChanged:', paramsChanged, 'aiInputSteps:', steps.length);

  // Forward: param 改了 → NL 跟着改
  // 完全用 locator 锚点定位 NL 里每个 step 的 value 位置，把当前在那里的
  // value（不管和 oldParams 是否一致）替换成新值。不依赖 "oldV 必须在 NL 里
  // 找得到"，避免 params 和 NL 之前就不一致时无法 sync。
  if (paramsChanged && !nlChanged) {
    let nl = newNL ?? '';
    let cursor = 0;
    const replaced = [];
    const misses = [];
    for (const s of steps) {
      const anchorRel = findAnchorInNL(nl.slice(cursor), s.locator);
      if (anchorRel < 0) {
        misses.push(`step ${s.order} (locator "${s.locator}" not in NL)`);
        continue;
      }
      const currentValue = extractValueAfterAnchor(nl.slice(cursor), anchorRel);
      if (!currentValue) {
        misses.push(`step ${s.order} (no value after "${s.locator}")`);
        cursor += anchorRel;
        continue;
      }
      const valueAbsStart = nl.indexOf(currentValue, cursor + anchorRel);
      const newEff = (newParams?.[s.order] ?? s.defaultValue) || '';
      const oldEff = (oldParams?.[s.order] ?? s.defaultValue) || '';
      if (oldEff !== newEff && currentValue !== newEff && valueAbsStart >= 0) {
        nl = nl.slice(0, valueAbsStart) + newEff + nl.slice(valueAbsStart + currentValue.length);
        cursor = valueAbsStart + newEff.length;
        replaced.push(`step ${s.order}: "${currentValue}" → "${newEff}"`);
      } else {
        cursor = (valueAbsStart >= 0 ? valueAbsStart : cursor + anchorRel) + currentValue.length;
      }
    }
    if (replaced.length) console.log('[sync] param→NL:', replaced.join(' · '));
    else console.log('[sync] param→NL: no replacements (misses:', misses.length ? misses.join(' · ') : 'none', ')');
    return { nl, params: newParams ?? {} };
  }

  // Reverse: NL 改了 → params 跟着改
  if (nlChanged && !paramsChanged) {
    const next = { ...(newParams ?? {}) };
    const extracted = [];
    const misses = [];
    let cursor = 0;
    for (const s of steps) {
      const effectiveOld = (oldParams?.[s.order] ?? s.defaultValue) || '';
      const anchorRel = findAnchorInNL((newNL ?? '').slice(cursor), s.locator);
      if (anchorRel < 0) { misses.push(`step ${s.order} (locator "${s.locator}" not in NL)`); continue; }
      const v = extractValueAfterAnchor((newNL ?? '').slice(cursor), anchorRel);
      if (!v) { misses.push(`step ${s.order} (no value after "${s.locator}")`); cursor += anchorRel; continue; }
      cursor += anchorRel + v.length;
      if (v === effectiveOld) continue;
      if (v === s.defaultValue) delete next[String(s.order)];
      else next[String(s.order)] = v;
      extracted.push(`step ${s.order}: "${effectiveOld}" → "${v}"`);
    }
    if (extracted.length) console.log('[sync] NL→param:', extracted.join(' · '));
    else console.log('[sync] NL→param: no changes detected (misses:', misses.length ? misses.join(' · ') : 'none', ')');
    return { nl: newNL ?? '', params: next };
  }

  if (nlChanged && paramsChanged) console.log('[sync] both NL and params changed — leaving both as-is');
  else console.log('[sync] neither changed — no-op');
  return { nl: newNL ?? '', params: newParams ?? {} };
}

// ── Parameters tab ──
// Renders a flat field-by-field form when the JSON is "simple" (objects with
// primitive leaves). Reverse-maps each ${params.xxx} reference found in the
// spec to the steps that use it, so the user can see immediately which field
// drives which step. Complex shapes (arrays of objects, deeply nested) fall
// back to a raw JSON view to avoid lossy round-tripping.
function renderParamsTab(caseData, stepsTree) {
  const wrap = h('div', { class: 'card' });
  wrap.appendChild(h('div', { class: 'card-head' },
    h('h2', {}, t('params.title')),
    h('span', { class: 'muted small' }, t('params.subtitle')),
  ));

  const parsed = caseData.parsed && typeof caseData.parsed === 'object' && !Array.isArray(caseData.parsed)
    ? caseData.parsed : null;
  const leaves = parsed ? flattenParams(parsed) : [];
  const isFormable = parsed && leaves.length > 0 && leaves.every(l => l.formable);
  // Midscene-shape cases have a non-formable apiGuide.steps[]/source{} blob.
  // Render dedicated editors for the human-editable fields above the raw JSON.
  const isMidsceneShape =
    parsed && ('naturalLanguage' in parsed || 'apiGuide' in parsed || 'jsSource' in parsed);
  const usageByPath = stepsTree ? buildParamUseMap(stepsTree) : new Map();

  const dirtyFlag = h('span', { class: 'muted small', style: { marginLeft: 'auto', opacity: '0' } }, t('params.unsaved'));
  const errEl = h('div', { class: 'muted', style: { color: 'var(--err)', minHeight: '18px' } });
  const saveBtn = h('button', { class: 'btn primary', disabled: !hasPerm('cases:write') }, t('params.save'));

  // Track input state so save can collect current values without re-querying DOM.
  const inputs = [];
  // Midscene-mode editors. Populated below when isMidsceneShape.
  let midsceneInputs = null;

  // Track whether the user has edited anything since load — drives the
  // "unsaved" hint and prevents accidentally overwriting from a stale form.
  let dirty = false;
  function markDirty() {
    if (dirty) return;
    dirty = true;
    dirtyFlag.style.opacity = '1';
  }

  // ── Midscene editor (title / sapUrl / transactionCode / description /
  //    naturalLanguage) + read-only API guide step list + read-only JS
  //    source. Always rendered for Midscene-shape cases so the user can edit
  //    naturalLanguage without diving into raw JSON.
  // Holds per-aiInput-step value-override inputs so the bottom saveBtn can
  // fold them back into caseObj.params on save. Populated below.
  let paramOverrideInputs = null;
  if (isMidsceneShape) {
    const canWrite = hasPerm('cases:write');
    const mkField = (label, control, hint) => h('div', { class: 'field', style: { marginBottom: '12px' } },
      h('span', {}, label),
      control,
      hint && h('div', { class: 'muted small', style: { marginTop: '2px' } }, hint),
    );

    // Toolbar at the top of the Parameters tab — mirrors the original Desktop
    // saptest UI layout (Run JS / Run JS w/ Cache / Save / Delete sitting
    // right above the editor). Save delegates to the bottom saveBtn click
    // handler so we don't duplicate the fold-and-persist logic.
    const stepCount = parsed.apiGuide?.steps?.length ?? 0;
    const topRunJsBtn = h('button', {
      class: 'btn primary',
      disabled: !hasPerm('runs:execute') || !stepCount,
      title: stepCount ? 'Run JS — write-only cache (record fresh element locations)' : 'apiGuide is empty — generate it first',
      onClick: () => openJsRunModal(caseData.id, 'write'),
    }, 'Run JS');
    const topRunJsCacheBtn = h('button', {
      class: 'btn',
      disabled: !hasPerm('runs:execute') || !stepCount,
      title: stepCount ? 'Run JS — read-write cache (replay existing locations, ~5× faster)' : 'apiGuide is empty — generate it first',
      onClick: () => openJsRunModal(caseData.id, 'read'),
    }, 'Run JS w/ Cache');
    const topGenApiBtn = h('button', {
      class: 'btn',
      disabled: !canWrite,
      title: stepCount
        ? 'Re-generate apiGuide from naturalLanguage (LLM call · falls back to local rules if LLM is unreachable). ⚠ apiGuide changes invalidate the cache.'
        : 'Generate apiGuide from naturalLanguage (LLM call · falls back to local rules if LLM is unreachable)',
      onClick: async () => {
        // The server-side /api-guide endpoint reads the case's
        // naturalLanguage from disk, not from the request body, so any
        // unsaved edits in the textarea would be ignored and Re-Gen would
        // produce the SAME apiGuide as before (then render() would refresh
        // the textarea, making it look like the edit "reverted"). Persist
        // the current Midscene-shape fields first, then regen.
        if (midsceneInputs) {
          const next = JSON.parse(JSON.stringify(parsed));
          next.title           = midsceneInputs.titleInp.value;
          next.sapUrl          = midsceneInputs.urlInp.value;
          next.transactionCode = midsceneInputs.txInp.value || null;
          next.description     = midsceneInputs.descTa.value;
          next.naturalLanguage = midsceneInputs.nlTa.value;
          try {
            await api.put('/api/cases/' + encodeURIComponent(caseData.id), next);
          } catch (e) {
            toast('Save before Gen API failed: ' + e.message, 'err');
            return;
          }
        }
        await generateApiGuide(caseData.id);
      },
    }, stepCount ? 'Re-Gen API' : 'Gen API');
    const topSaveBtn = h('button', {
      class: 'btn',
      disabled: !canWrite,
      title: 'Save title / sapUrl / NL / per-step value overrides',
      onClick: () => saveBtn.click(),
    }, t('params.save'));
    const topDeleteBtn = h('button', {
      class: 'btn danger',
      disabled: !hasPerm('cases:delete'),
      onClick: () => deleteCase(caseData.id),
    }, t('cases.delete'));
    wrap.appendChild(h('div', {
      class: 'row',
      style: { gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
    }, topRunJsBtn, topRunJsCacheBtn, topGenApiBtn, h('span', { class: 'spacer' }), topSaveBtn, topDeleteBtn));

    const titleInp = h('input', { value: parsed.title ?? '', disabled: !canWrite });
    const urlInp   = h('input', { value: parsed.sapUrl ?? '', disabled: !canWrite });
    const txInp    = h('input', { value: parsed.transactionCode ?? '', disabled: !canWrite, placeholder: 'optional, e.g. S_ALR_87011990 or AS01' });
    const descTa   = h('textarea', { style: { minHeight: '60px' }, disabled: !canWrite }, parsed.description ?? '');
    const nlTa     = h('textarea', { style: { minHeight: '260px', fontFamily: 'inherit' }, disabled: !canWrite }, parsed.naturalLanguage ?? '');

    [titleInp, urlInp, txInp, descTa, nlTa].forEach((el) => el.addEventListener('input', markDirty));

    midsceneInputs = { titleInp, urlInp, txInp, descTa, nlTa };

    const editor = h('div', {});
    editor.appendChild(mkField('Title', titleInp));
    editor.appendChild(mkField('Target URL (sapUrl)', urlInp));
    editor.appendChild(mkField('Transaction code', txInp));
    editor.appendChild(mkField('Description', descTa));
    editor.appendChild(mkField(
      'Natural language',
      nlTa,
      parsed.apiGuide?.steps?.length
        ? 'Editing this does NOT invalidate the cache — values are input content, not structure. ' +
          'Same goes for editing apiGuide value defaults via Gen API or raw JSON: only locator / ' +
          'step structure changes invalidate. Sleep / wait steps are also ignored — pure timing, ' +
          'always reusable. Exception: the T Code value (e.g. S_ALR_87011990) IS in the hash, ' +
          'because changing it lands you on a different SAP screen.'
        : 'After saving, click "Gen API" (or fill in apiGuide) and then "Run JS" to record a cache.',
    ));
    wrap.appendChild(editor);

    // Auto Parameters — list every apiGuide aiInput step with its current
    // value, sourced from caseObj.params[step.order] if set, otherwise from
    // exampleCode's literal "{ value: \"...\" }". Editing only updates
    // caseObj.params; apiGuide stays byte-identical so cacheId is stable for
    // non-tcode fields and the recorded element location keeps replaying
    // from cache. EXCEPTION: tcode steps (locator matches 矩形 / TC框 /
    // T-Code) feed their value into the hash too, because tcode determines
    // which SAP screen we land on — changing it makes every other recorded
    // xpath stale. The TCode field below is tagged so users can see this.
    if (parsed.apiGuide?.steps?.length) {
      const existingParams = (parsed.params && typeof parsed.params === 'object' && !Array.isArray(parsed.params))
        ? parsed.params : {};
      const inputSteps = [];
      for (const s of parsed.apiGuide.steps) {
        const api = String(s.midsceneApi || '').toLowerCase();
        if (!api.includes('aiinput')) continue;
        const m = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{\s*value\s*:\s*(['"`])([\s\S]*?)\3\s*\}\s*\)/.exec(s.exampleCode || '');
        if (!m) continue;
        const orderKey = String(s.order);
        inputSteps.push({
          order: s.order,
          locator: m[2],
          defaultValue: m[4],
          paramValue: orderKey in existingParams ? String(existingParams[orderKey] ?? '') : null,
        });
      }

      if (inputSteps.length) {
        paramOverrideInputs = [];
        const paramCard = h('details', { open: true, style: { marginBottom: '12px' } },
          h('summary', { class: 'muted' },
            'Parameters · ' + inputSteps.length + ' aiInput step' + (inputSteps.length === 1 ? '' : 's') +
            ' (editable — non-tcode values don\'t invalidate cache; tcode does)'),
        );
        const grid = h('div', { class: 'param-grid', style: { marginTop: '8px' } });
        const isTCodeLocator = (loc) => /矩形|TC\s*框|T[-\s]?Code|事务码/i.test(loc || '');
        for (const it of inputSteps) {
          const initial = it.paramValue !== null ? it.paramValue : it.defaultValue;
          const inp = h('input', {
            value: initial,
            disabled: !canWrite,
            placeholder: it.defaultValue,
          });
          inp.addEventListener('input', markDirty);
          paramOverrideInputs.push({
            order: it.order,
            input: inp,
            defaultValue: it.defaultValue,
          });
          // Display-only rename: SAP's transaction-code box gets called
          // "矩形" / "左上角矩形" in the LLM-generated locator (rectangle in
          // top-left), but in the Parameters UI we surface it as "T Code"
          // — what users actually call it. apiGuide stays byte-identical
          // (cacheId stable, runner still passes the original locator to
          // agent.aiInput).
          const displayLocator = it.locator
            .replace(/左上角矩形/g, 'T Code')
            .replace(/矩形/g, 'T Code');
          const tcodeFlag = isTCodeLocator(it.locator)
            ? h('span', {
                class: 'mono small',
                title: 'Changing this value rotates cacheId — cache must be re-recorded after save.',
                style: { marginLeft: '8px', padding: '1px 6px', background: '#fff4d6', color: '#7a5800', borderRadius: '3px', fontSize: '11px' },
              }, '⚠ tcode · invalidates cache')
            : null;
          grid.appendChild(h('div', { class: 'param-field' },
            h('div', { class: 'param-field-head' },
              h('label', { class: 'param-path mono' }, 'Step ' + it.order + ' · ' + displayLocator),
              tcodeFlag,
              dirtyFlag,
            ),
            inp,
            h('span', { class: 'param-usage muted' },
              'aiInput default: ', h('code', {}, it.defaultValue || '(empty)'),
            ),
          ));
        }
        paramCard.appendChild(grid);
        wrap.appendChild(paramCard);
      }
    }

    // Read-only: JS assembled from apiGuide steps. This is the script the
    // runner actually evals per-step (or that Desktop used to display under
    // "生成的 JS" before each run).
    if (parsed.apiGuide?.steps?.length) {
      const generatedJs =
        '// Auto-assembled from apiGuide.steps[].exampleCode\n' +
        '// Title: ' + (parsed.title ?? '') + '\n' +
        '// Target URL: ' + (parsed.sapUrl ?? '') + '\n\n' +
        'async function run(agent) {\n' +
        parsed.apiGuide.steps.map((s) => {
          const reason = s.reason ? `  // ${String(s.reason).split('\n')[0]}\n` : '';
          return `  // Step ${s.order}: ${s.title ?? ''}\n${reason}  ${(s.exampleCode ?? '').trim()}`;
        }).join('\n\n') +
        '\n}\n';

      wrap.appendChild(h('details', { open: true, style: { marginBottom: '10px' } },
        h('summary', { class: 'muted' },
          '生成的 JS (from apiGuide · ' + parsed.apiGuide.steps.length + ' steps, ' +
          generatedJs.length + ' chars)'),
        h('pre', {
          class: 'code-block',
          style: { maxHeight: '320px', overflow: 'auto', fontSize: '12px', margin: '6px 0 0 0' },
        }, generatedJs),
      ));
    }

    // Read-only: API guide step list. Label shows the API the runner ACTUALLY
    // calls (parsed from exampleCode), not the midsceneApi classification —
    // which sometimes diverges for "拖到最X端" type scroll steps that get
    // rewritten to aiAct. A small "planned: aiScroll" tag is shown when they
    // differ so you can still see the LLM's original intent.
    if (parsed.apiGuide?.steps?.length) {
      const stepsList = h('ol', {
        class: 'mono',
        style: { fontSize: '12px', maxHeight: '300px', overflow: 'auto', paddingLeft: '24px', margin: '6px 0 0 0' },
      }, ...parsed.apiGuide.steps.map((s) => {
        const actual = displayApiFromStep(s);
        const planned = plannedApiTagIfDifferent(s);
        return h('li', {
          style: { marginBottom: '3px' },
          title: planned ? `Runner evals exampleCode → agent.${actual}(). LLM tagged this ${planned} but exampleCode was rewritten.` : '',
        },
          h('strong', {}, actual + ': '),
          h('span', {}, s.title || s.naturalLanguageInstruction || ''),
          planned && h('span', {
            class: 'muted small',
            style: { marginLeft: '6px', opacity: 0.65 },
          }, '· planned ' + planned),
        );
      }));
      wrap.appendChild(h('details', { style: { marginBottom: '10px' } },
        h('summary', { class: 'muted' },
          'API guide steps · ' + parsed.apiGuide.steps.length +
          ' (read-only — labels show what runner actually calls; "planned" = LLM classification)'),
        stepsList,
      ));
    }

    // Read-only: ORIGINAL JS source — the user's hand-written code from
    // SAP TEST DEMO 5.21/SAP test N 自然语言+JS.txt (with aiAct(...拖滑块)
    // calls). Differs from "生成的 JS" above which is the LLM-derived version.
    if (typeof parsed.jsSource === 'string' && parsed.jsSource.trim()) {
      wrap.appendChild(h('details', { style: { marginBottom: '10px' } },
        h('summary', { class: 'muted' },
          '原版 JS (从 .txt 1:1 拷贝, ' + parsed.jsSource.length + ' chars, read-only)'),
        h('pre', {
          class: 'code-block',
          style: { maxHeight: '260px', overflow: 'auto', fontSize: '12px', margin: '6px 0 0 0' },
        }, parsed.jsSource),
      ));
    }
  }

  if (isFormable) {
    const formGrid = h('div', { class: 'param-grid' });
    for (const leaf of leaves) {
      const uses = usageByPath.get(leaf.path) || [];
      const inp = h('input', {
        value: leaf.value == null ? '' : String(leaf.value),
        type: typeof leaf.value === 'number' ? 'number' : 'text',
        disabled: !hasPerm('cases:write'),
      });
      // Hint about original type so save can preserve it (string vs number vs bool).
      inputs.push({ path: leaf.path, input: inp, origType: typeof leaf.value, origValue: leaf.value });
      inp.addEventListener('input', markDirty);
      const usageEl = uses.length === 0
        ? h('span', { class: 'param-usage muted' }, t('params.usedByNone'))
        : h('span', { class: 'param-usage' },
            h('span', { class: 'muted' }, t('params.usedBy')), ' ',
            ...uses.map((u, i) => [
              i > 0 ? h('span', { class: 'muted' }, ', ') : null,
              h('span', { class: 'param-step-ref' }, '#' + u.stepNum + ' ' + u.stepTitle),
            ].filter(Boolean)).flat(),
          );
      formGrid.appendChild(h('div', { class: 'param-field' },
        h('div', { class: 'param-field-head' },
          h('label', { class: 'param-path mono' }, leaf.path),
          dirtyFlag,
        ),
        inp,
        usageEl,
      ));
    }
    wrap.appendChild(formGrid);
  } else if (parsed) {
    wrap.appendChild(h('div', { class: 'muted', style: { marginBottom: '10px' } }, t('params.complexHint')));
  } else {
    wrap.appendChild(h('div', { class: 'muted', style: { marginBottom: '10px' } }, t('params.empty')));
  }

  // Raw JSON — always available, collapsed by default for "formable" cases.
  const rawToggle = h('button', { class: 'btn ghost sm' }, isFormable ? t('params.showRaw') : t('params.hideRaw'));
  const rawTa = h('textarea', { style: { minHeight: '320px' }, disabled: !hasPerm('cases:write') }, caseData.raw);
  rawTa.addEventListener('input', markDirty);
  const rawWrap = h('div', { class: 'raw-json', style: { display: isFormable ? 'none' : 'block' } },
    h('div', { class: 'field' }, h('span', {}, t('cases.paramsLabel')), rawTa),
  );
  rawToggle.addEventListener('click', () => {
    const open = rawWrap.style.display !== 'none';
    rawWrap.style.display = open ? 'none' : 'block';
    rawToggle.textContent = open ? t('params.showRaw') : t('params.hideRaw');
  });
  wrap.appendChild(h('div', { class: 'divider' }));
  wrap.appendChild(h('div', { class: 'row' }, rawToggle, h('span', { class: 'spacer' }), errEl, saveBtn));
  wrap.appendChild(rawWrap);

  saveBtn.addEventListener('click', async () => {
    errEl.textContent = '';
    let nextParsed;
    const rawVisible = rawWrap.style.display !== 'none';
    if (rawVisible) {
      try { nextParsed = JSON.parse(rawTa.value); }
      catch (e) { errEl.textContent = t('params.parseError') + e.message; return; }
    } else if (midsceneInputs) {
      // Midscene-mode: fold the friendly editor values into the parsed JSON
      // skeleton, preserving apiGuide / source / tags / yamlScript etc.
      nextParsed = JSON.parse(JSON.stringify(parsed));
    } else if (!isFormable) {
      try { nextParsed = JSON.parse(rawTa.value); }
      catch (e) { errEl.textContent = t('params.parseError') + e.message; return; }
    } else {
      // Re-fold the form values into a fresh object using the original
      // parsed JSON as the skeleton, so unrelated keys/metadata survive.
      nextParsed = JSON.parse(JSON.stringify(parsed));
      for (const { path, input, origType, origValue } of inputs) {
        let v = input.value;
        if (origType === 'number') v = v === '' ? null : Number(v);
        else if (origType === 'boolean') v = /^(true|1|yes)$/i.test(v);
        else if (origValue === null && v === '') v = null;
        setByPath(nextParsed, path, v);
      }
    }

    // For Midscene-shape cases, the friendly editor (title/sapUrl/NL/etc)
    // and the Auto Parameters editor are ALWAYS the source of truth for
    // those fields — even when the user has the Raw JSON view open. Without
    // this overlay, editing NL in the textarea while raw view is visible
    // gets silently dropped: save would write back rawTa's old text and the
    // post-save render() would show the user's edit "reverted".
    if (midsceneInputs) {
      nextParsed.title           = midsceneInputs.titleInp.value;
      nextParsed.sapUrl          = midsceneInputs.urlInp.value;
      nextParsed.transactionCode = midsceneInputs.txInp.value || null;
      nextParsed.description     = midsceneInputs.descTa.value;
      nextParsed.naturalLanguage = midsceneInputs.nlTa.value;
    }
    if (paramOverrideInputs && paramOverrideInputs.length) {
      const nextParams = {};
      for (const it of paramOverrideInputs) {
        const v = it.input.value;
        if (v !== '' && v !== it.defaultValue) nextParams[String(it.order)] = v;
      }
      if (Object.keys(nextParams).length) {
        nextParsed.params = nextParams;
      } else if ('params' in nextParsed) {
        delete nextParsed.params;
      }
    }

    // NL ↔ params 双向同步 — 只对有 apiGuide 的 Midscene-shape case 生效。
    // 改了一侧就把值传播到另一侧；两侧都改了就尊重用户原始输入。
    if (midsceneInputs && parsed?.apiGuide?.steps?.length) {
      const synced = syncNlAndParams({
        oldNL: parsed.naturalLanguage ?? '',
        newNL: nextParsed.naturalLanguage ?? '',
        oldParams: (parsed.params && typeof parsed.params === 'object' && !Array.isArray(parsed.params)) ? parsed.params : {},
        newParams: (nextParsed.params && typeof nextParsed.params === 'object' && !Array.isArray(nextParsed.params)) ? nextParsed.params : {},
        apiGuide: parsed.apiGuide,
      });
      nextParsed.naturalLanguage = synced.nl;
      if (synced.params && Object.keys(synced.params).length) {
        nextParsed.params = synced.params;
      } else if ('params' in nextParsed) {
        delete nextParsed.params;
      }
    }

    // Diagnostic — open DevTools console to see what's actually being PUT.
    // Remove once the "save reverts" bug stops reproducing.
    try {
      const nlPreview = (nextParsed.naturalLanguage || '').slice(0, 120).replace(/\n/g, ' ⏎ ');
      console.log('[saveBtn] PUT', caseData.id, '— title:', nextParsed.title, '— NL len:', (nextParsed.naturalLanguage || '').length, '— NL head:', nlPreview);
      console.log('[saveBtn] midsceneInputs.nlTa.value head:', midsceneInputs ? midsceneInputs.nlTa.value.slice(0, 120) : '(no midsceneInputs)');
    } catch (e) { console.warn('[saveBtn] diag log failed', e); }

    try {
      const putRes = await api.put('/api/cases/' + encodeURIComponent(caseData.id), nextParsed);
      console.log('[saveBtn] PUT response:', putRes);
      toast(t('params.saved'), 'ok');
      dirty = false;
      dirtyFlag.style.opacity = '0';

      // Verify the server actually persisted what we sent.
      try {
        const verify = await api.get('/api/cases/' + encodeURIComponent(caseData.id));
        const persistedNlHead = (verify.parsed?.naturalLanguage || '').slice(0, 120).replace(/\n/g, ' ⏎ ');
        console.log('[saveBtn] GET-after-PUT NL head:', persistedNlHead);
        if ((verify.parsed?.naturalLanguage || '') !== (nextParsed.naturalLanguage || '')) {
          console.warn('[saveBtn] MISMATCH — server returned different NL than we sent!');
        }
      } catch (e) { console.warn('[saveBtn] verify GET failed', e); }

      // Refresh the page so the saved values flow into the spec preview too.
      render();
    } catch (e) { errEl.textContent = e.message; }
  });

  return wrap;
}

// Flatten a JSON object into [{ path, value, formable }] leaves. Marks
// "formable: false" for arrays-of-objects so the form falls back to raw JSON.
function flattenParams(obj, prefix = '', out = []) {
  if (obj == null || typeof obj !== 'object') {
    out.push({ path: prefix, value: obj, formable: true });
    return out;
  }
  if (Array.isArray(obj)) {
    const allPrim = obj.every(x => x == null || (typeof x !== 'object'));
    if (allPrim) {
      out.push({ path: prefix, value: obj, formable: false });
    } else {
      obj.forEach((v, i) => flattenParams(v, prefix ? `${prefix}.${i}` : `${i}`, out));
    }
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    // Skip schema metadata in the form — these aren't params the user tweaks.
    if (!prefix && (k === '$schema' || k === 'title')) {
      out.push({ path: k, value: v, formable: typeof v !== 'object' || v === null });
      continue;
    }
    const p = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object') flattenParams(v, p, out);
    else out.push({ path: p, value: v, formable: true });
  }
  return out;
}

function setByPath(obj, dottedPath, value) {
  const segs = dottedPath.split('.');
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (cur[s] == null || typeof cur[s] !== 'object') cur[s] = {};
    cur = cur[s];
  }
  cur[segs[segs.length - 1]] = value;
}

// Walk the parsed spec tree to build path → step-usage. The step preview
// already resolves `${params.x.y}` references in action args/text/hint, so
// we just scan those strings for the same pattern.
function buildParamUseMap(tree) {
  const map = new Map();
  const re = /\bparams\.([a-zA-Z0-9_$][a-zA-Z0-9_$.]*)/g;
  function scanText(text, sink) {
    if (typeof text !== 'string') return;
    let m;
    while ((m = re.exec(text)) !== null) sink.add(m[1]);
  }
  function visit(steps, depth = 0) {
    for (let i = 0; i < (steps || []).length; i++) {
      const step = steps[i];
      const stepNum = depth === 0 ? i + 1 : null;
      const refs = new Set();
      for (const a of (step.actions || [])) {
        scanText(a.text, refs);
        scanText(a.hint, refs);
        for (const arg of (a.args || [])) scanText(String(arg), refs);
      }
      for (const r of refs) {
        if (!map.has(r)) map.set(r, []);
        map.get(r).push({ stepNum: stepNum || i + 1, stepTitle: step.title });
      }
      if (step.children) visit(step.children, depth + 1);
    }
  }
  for (const tc of (tree?.tests || [])) visit(tc.steps);
  return map;
}

// ── Steps & Run tab for Midscene JS cases (no spec.ts) ──
// Shows: latest run summary (status + error + report iframe), the apiGuide
// step list, and Run JS / Run JS w/ Cache buttons that drive the same
// /api/midscene-js/cases/:id/run pipeline as the Cases table.
function renderMidsceneJsTab(caseData, runs) {
  const wrap = h('div', { class: 'grid' });
  const parsed = caseData?.parsed ?? {};
  const apiGuide = parsed.apiGuide;
  const caseId = caseData?.id;
  const stepCount = apiGuide?.steps?.length ?? 0;
  const latest = runs?.[0] || null;
  const canRun = hasPerm('runs:execute');

  // ── Card 1: Latest run summary (only if we have one)
  if (latest) {
    const ok = latest.status === 'passed';
    const hasReport = !!latest.report?.url;
    const card = h('div', { class: 'card' });
    card.appendChild(h('div', { class: 'card-head' },
      h('h2', {}, 'Latest run'),
      h('span', { class: 'tag ' + (ok ? 'ok' : 'err'), style: { marginLeft: '8px' } },
        ok ? 'passed' : 'failed'),
      h('span', { class: 'muted small', style: { marginLeft: '8px' } },
        fmtDate(latest.startedAt) + ' · ' + fmtMs(latest.durationMs) +
        (latest.startedBy ? ' · @' + latest.startedBy : '')),
    ));
    if (latest.errorMessage) {
      card.appendChild(h('div', {
        class: 'mono',
        style: {
          background: '#fff1f1', color: '#7a0010',
          border: '1px solid #ffd0d0', borderRadius: '6px',
          padding: '8px 10px', fontSize: '13px', whiteSpace: 'pre-wrap',
          margin: '8px 0',
        },
      }, latest.errorMessage));
    }
    // Variables / Assertions / Downloads — surface the runSummary block the
    // runner now writes to each record. Helps you see e.g. "A1 = 12,345.00,
    // A2 = 12,345.00, comparison passed" without opening the report.
    const rs = latest.runSummary;
    if (rs && (Object.keys(rs.variables ?? {}).length || rs.assertions?.length || rs.downloads?.length)) {
      const sumCard = h('div', { style: { margin: '8px 0', borderTop: '1px solid #eee', paddingTop: '8px' } });
      const varEntries = Object.entries(rs.variables ?? {});
      if (varEntries.length) {
        sumCard.appendChild(h('div', { style: { marginBottom: '6px' } },
          h('strong', {}, 'Captured variables: '),
          h('span', { class: 'mono', style: { fontSize: '12px' } },
            varEntries.map(([k, v]) => `${k} = ${String(v).slice(0, 80)}`).join(' · ')),
        ));
      }
      if (rs.assertions?.length) {
        const list = h('ul', { style: { margin: '4px 0 6px 18px', padding: 0, fontSize: '13px' } },
          ...rs.assertions.map((a) => {
            const op = a.operator ?? (a.equal ? '==' : '!=');
            const passed = a.passed ?? a.equal;
            return h('li', { class: 'mono', style: { color: passed ? '#0a7a0a' : '#7a0010' } },
              (passed ? '✓ ' : '✗ ') + a.left + '=' + a.leftValue + ' ' + op + ' ' + a.right + '=' + a.rightValue);
          }),
        );
        sumCard.appendChild(h('div', {}, h('strong', {}, 'Comparisons:'), list));
      }
      if (rs.downloads?.length) {
        const list = h('ul', { style: { margin: '4px 0 6px 18px', padding: 0, fontSize: '13px' } },
          ...rs.downloads.map((d) => h('li', { class: 'mono' },
            d.fileName + ' (' + fmtBytes(d.sizeBytes) + ') · ' + d.filePath)),
        );
        sumCard.appendChild(h('div', {}, h('strong', {}, 'Downloads:'), list));
      }
      card.appendChild(sumCard);
    }
    if (latest.logTail?.length) {
      card.appendChild(h('details', { style: { margin: '8px 0' } },
        h('summary', { class: 'muted' }, 'Console tail (' + latest.logTail.length + ' lines)'),
        h('pre', {
          class: 'code-block',
          style: { overflowX: 'auto', fontSize: '12px', marginTop: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
        }, latest.logTail.map((l) => (typeof l === 'string' ? l : l.line)).join('\n')),
      ));
    }
    if (hasReport) {
      card.appendChild(h('div', { class: 'row', style: { gap: '8px', marginTop: '8px' } },
        h('a', { class: 'btn primary sm', href: reportPreviewUrl(latest.report.url), target: '_blank' },
          'Open Midscene report ↗'),
        h('a', { class: 'btn sm ghost', href: '#/cases/' + encodeURIComponent(caseId) + '/history' },
          'Open History tab'),
      ));
      // Inline replay
      card.appendChild(h('details', { style: { marginTop: '10px' } },
        h('summary', { class: 'muted' }, 'Replay inline'),
        h('div', { class: 'history-report-frame', style: { marginTop: '6px' } },
          h('iframe', {
            src: reportPreviewUrl(latest.report.url),
            loading: 'lazy',
            title: latest.report.name || 'report',
            style: { width: '100%', height: '560px', border: '1px solid #ddd', borderRadius: '6px' },
          }),
        ),
      ));
    } else {
      card.appendChild(h('div', { class: 'muted small', style: { marginTop: '8px' } },
        'No Midscene report — the run failed before Midscene wrote one (typically: ' +
        'browser launch error or missing MIDSCENE_MODEL_NAME in .env).'));
    }
    wrap.appendChild(card);
  }

  // ── Card 2: Run controls + step list
  const runCard = h('div', { class: 'card' });
  runCard.appendChild(h('div', { class: 'card-head' },
    h('h2', {}, 'API guide steps'),
    h('span', { class: 'muted small', style: { marginLeft: '8px' } },
      stepCount ? stepCount + ' steps' : 'no apiGuide yet'),
  ));

  if (canRun) {
    runCard.appendChild(h('div', { class: 'row', style: { gap: '8px', marginBottom: '10px' } },
      h('button', {
        class: 'btn primary',
        disabled: !stepCount,
        onClick: () => openJsRunModal(caseId, 'write'),
      }, 'Run JS (write cache)'),
      h('button', {
        class: 'btn',
        disabled: !stepCount,
        onClick: () => openJsRunModal(caseId, 'read'),
      }, 'Run JS w/ Cache (replay)'),
      // Gen API only when the case has no apiGuide. Existing cases with
      // apiGuide + cache don't need to "generate" anything.
      hasPerm('cases:write') && !stepCount && h('button', {
        class: 'btn ghost sm',
        onClick: () => generateApiGuide(caseId),
        title: 'This case has no apiGuide. Generate one from naturalLanguage (LLM call).',
      }, 'Gen API'),
    ));
  }

  if (!stepCount) {
    runCard.appendChild(h('div', { class: 'muted' },
      'This case has no apiGuide. Add one by editing the case JSON (Parameters tab) ' +
      'or, once Gen API is wired up, click the Gen API button.'));
  } else {
    runCard.appendChild(h('ol', {
      class: 'mono',
      style: { fontSize: '12px', maxHeight: '420px', overflow: 'auto', paddingLeft: '24px', margin: 0 },
    }, ...apiGuide.steps.map((s) => {
      const actual = displayApiFromStep(s);
      const planned = plannedApiTagIfDifferent(s);
      return h('li', {
        style: { marginBottom: '4px' },
        title: planned ? `Runner evals exampleCode → agent.${actual}(). Step's midsceneApi field labels it ${planned}, but exampleCode was rewritten.` : '',
      },
        h('strong', {}, actual + ': '),
        h('span', {}, s.title || s.naturalLanguageInstruction || ''),
        planned && h('span', {
          class: 'muted small',
          style: { marginLeft: '6px', opacity: 0.65 },
        }, '· planned ' + planned),
        s.xpath && h('div', { class: 'muted small', style: { marginLeft: '8px' } }, 'xpath: ' + s.xpath),
      );
    })));
  }
  wrap.appendChild(runCard);

  // ── Card 3: per-case cache files (list + delete). Lazy-loaded.
  if (caseId) {
    const cacheCard = h('div', { class: 'card' });
    cacheCard.appendChild(h('div', { class: 'card-head' },
      h('h2', {}, 'Cache files'),
      h('span', { class: 'muted small', style: { marginLeft: '8px' } },
        'midscene_run/cache/saptest-js-' + caseId.slice(0, 8) + '-…'),
    ));
    const cacheBody = h('div', { class: 'muted' }, 'Loading…');
    cacheCard.appendChild(cacheBody);
    wrap.appendChild(cacheCard);
    loadCachePanel(caseId, cacheBody);
  }

  return wrap;
}

async function loadCachePanel(caseId, mountEl) {
  let data;
  try {
    data = await api.get('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/cache');
  } catch (e) {
    mountEl.textContent = 'Failed to load cache list: ' + e.message;
    return;
  }
  mountEl.innerHTML = '';
  if (!data.files.length) {
    mountEl.appendChild(h('div', { class: 'muted' },
      'No cache files for this case. The next "Run JS" will record one to ' +
      (data.currentCacheId ? 'saptest-js-' + data.currentCacheId.split('-').pop() + '.cache.yaml' : 'a new cacheId.')));
    return;
  }
  const table = h('table', { class: 'tbl' },
    h('thead', {}, h('tr', {},
      h('th', {}, 'File'),
      h('th', {}, 'Hash tail'),
      h('th', {}, 'Size'),
      h('th', {}, 'Modified'),
      h('th', { class: 'actions' }, ''),
    )),
    h('tbody', {}, ...data.files.map((f) => {
      const hashTail = f.cacheId.replace(/^saptest-js-.+?-/, '');
      const row = h('tr', {},
        h('td', { class: 'mono', style: { fontSize: '12px' } },
          h('span', {}, f.name),
          f.isCurrent && h('span', {
            class: 'tag info',
            style: { marginLeft: '6px', fontSize: '10px' },
          }, 'CURRENT'),
        ),
        h('td', { class: 'mono', style: { fontSize: '12px' } }, hashTail),
        h('td', { class: 'mono' }, fmtBytes(f.bytes)),
        h('td', {}, fmtRel(f.modifiedAt)),
        h('td', { class: 'actions' },
          hasPerm('runs:execute') && h('button', {
            class: 'btn danger sm',
            onClick: async () => {
              if (!confirm('Delete cache file "' + f.name + '"?')) return;
              try {
                await api.del('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/cache/' + encodeURIComponent(f.name));
                toast('Cache file deleted', 'ok');
                loadCachePanel(caseId, mountEl);
              } catch (e) { toast(e.message, 'err'); }
            },
          }, 'Delete'),
        ),
      );
      return row;
    })),
  );
  mountEl.appendChild(table);
}

// ── History tab ──
// Each row pairs with a hidden expansion row underneath that lazily embeds
// the Midscene report in an iframe. The report is themed to match SAPTest
// via the `?theme=…` param (see reportPreviewUrl + strip-branding.js).
function renderHistoryTab(caseId, runs) {
  const wrap = h('div', { class: 'card' });
  const headChildren = [
    h('h2', {}, t('history.title')),
    h('span', { class: 'muted small' }, t('detail.runs.count', { n: runs.length })),
  ];
  if (runs.length > 0 && hasPerm('cases:delete')) {
    headChildren.push(h('button', {
      class: 'btn danger sm',
      style: { marginLeft: 'auto' },
      onClick: () => clearAllHistory(caseId, runs.length),
    }, t('history.clearAll')));
  }
  wrap.appendChild(h('div', { class: 'card-head' }, ...headChildren));
  if (runs.length === 0) {
    wrap.appendChild(h('div', { class: 'muted' }, t('history.empty')));
    return wrap;
  }

  const tbody = h('tbody', {});
  let openRow = null;

  runs.forEach(r => {
    const ok = r.status === 'passed';
    const hasReport = !!r.report?.url;

    const expand = h('tr', { class: 'history-expand', style: { display: 'none' } },
      h('td', { colspan: '5', class: 'history-expand-cell' }),
    );

    const previewBtn = hasReport ? h('button', {
      class: 'btn sm',
      type: 'button',
    }, t('history.preview')) : null;

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const cell = expand.firstElementChild;
        if (openRow === expand) {
          expand.style.display = 'none';
          openRow = null;
          previewBtn.textContent = t('history.preview');
          return;
        }
        // Collapse any other open row before opening this one.
        if (openRow) {
          openRow.style.display = 'none';
          const prevBtn = openRow.previousElementSibling?.querySelector('[data-preview-btn]');
          if (prevBtn) prevBtn.textContent = t('history.preview');
        }
        // Lazy-mount the iframe so closed rows don't fetch reports.
        if (!cell.firstChild) {
          cell.appendChild(h('div', { class: 'history-report-frame' },
            h('iframe', {
              src: reportPreviewUrl(r.report.url),
              loading: 'lazy',
              title: r.report.name || 'report',
            }),
          ));
        }
        expand.style.display = '';
        openRow = expand;
        previewBtn.textContent = t('history.previewHide');
      });
      previewBtn.setAttribute('data-preview-btn', '1');
    }

    const row = h('tr', {},
      h('td', {}, fmtDate(r.startedAt)),
      h('td', {},
        h('span', { class: 'tag ' + (ok ? 'ok' : 'err') },
          ok ? t('history.status.passed') : t('history.status.failed')),
      ),
      h('td', {}, r.startedBy ? '@' + r.startedBy : '—'),
      h('td', { class: 'mono' }, fmtMs(r.durationMs)),
      h('td', { class: 'actions' },
        previewBtn || h('span', { class: 'muted small' }, t('history.noReport')),
        ' ',
        hasReport && h('a', {
          class: 'btn sm ghost', href: reportPreviewUrl(r.report.url), target: '_blank',
        }, t('history.openReport')),
        ' ',
        // Midscene JS runs (spec === null) get an in-process Rerun button that
        // re-executes via /api/midscene-js/runs/:runId/rerun, preserving the
        // original cacheMode + headed setting. Playwright runs keep their
        // existing "view steps" deep-link behavior.
        r.spec === null && r.mode === 'javascript' && hasPerm('runs:execute')
          ? h('button', {
              class: 'btn sm primary',
              title: 'Re-run this case via Midscene JS (' + (r.useCache ? 'cached' : 'no cache') + ', ' + (r.headed ? 'headed' : 'headless') + ')',
              onClick: async (ev) => {
                ev.preventDefault();
                const btn = ev.currentTarget;
                btn.disabled = true; btn.textContent = 'rerunning…';
                try {
                  const out = await api.post('/api/midscene-js/runs/' + encodeURIComponent(r.runId) + '/rerun', {});
                  toast(
                    'Rerun ' + (out.run?.status ?? 'finished') + ' · ' + fmtMs(out.run?.durationMs ?? 0),
                    out.ok ? 'ok' : 'err',
                    4500,
                  );
                  render();
                } catch (e) {
                  toast(e.message, 'err');
                  btn.disabled = false; btn.textContent = 'Rerun';
                }
              },
            }, 'Rerun')
          : h('a', {
              class: 'btn sm ghost',
              href: '#/cases/' + encodeURIComponent(caseId) + '/runs/' + encodeURIComponent(r.runId),
              style: { borderBottom: 'none' },
            }, t('history.replayBtn')),
        ' ',
        hasPerm('cases:delete') && h('button', {
          class: 'btn danger sm',
          onClick: () => deleteRun(caseId, r.runId),
        }, t('history.delete')),
      ),
    );

    tbody.appendChild(row);
    tbody.appendChild(expand);
  });

  wrap.appendChild(h('table', { class: 'tbl history-tbl' },
    h('thead', {}, h('tr', {},
      h('th', {}, t('history.col.when')),
      h('th', {}, t('history.col.status')),
      h('th', {}, t('history.col.who')),
      h('th', {}, t('history.col.duration')),
      h('th', { class: 'actions' }, t('history.col.actions')),
    )),
    tbody,
  ));
  return wrap;
}

async function deleteRun(caseId, runId) {
  if (!confirm(t('history.confirmDelete'))) return;
  try {
    await api.del('/api/cases/' + encodeURIComponent(caseId) + '/runs/' + encodeURIComponent(runId));
    toast(t('history.deleted'), 'ok');
    render();
  } catch (e) { toast(e.message, 'err'); }
}

async function clearAllHistory(caseId, n) {
  if (!confirm(t('history.confirmClearAll', { id: caseId, n }))) return;
  try {
    const r = await api.del('/api/cases/' + encodeURIComponent(caseId) + '/runs');
    toast(t('history.clearedAll', { n: r.deleted }), 'ok');
    render();
  } catch (e) { toast(e.message, 'err'); }
}

// ───────── View: Generate (AI) ─────────
VIEWS.generate = async () => {
  const ta = h('textarea', { placeholder: t('generate.descPlaceholder') });
  const out = h('pre', { class: 'code-block', style: { minHeight: '380px' } }, '');
  const errEl = h('div', { class: 'muted', style: { color: 'var(--err)' } });
  const idInput = h('input', { placeholder: t('generate.idPlaceholder') });
  const genBtn = h('button', { class: 'btn primary' }, t('generate.genBtn'));
  const saveBtn = h('button', { class: 'btn ok', disabled: true }, t('generate.saveBtn'));
  let lastParsed = null;

  genBtn.addEventListener('click', async () => {
    if (!ta.value.trim()) return toast(t('generate.pleaseInput'), 'warn');
    errEl.textContent = '';
    out.textContent = t('generate.generating');
    genBtn.disabled = true;
    try {
      const r = await api.post('/api/generate/case', { prompt: ta.value });
      out.textContent = r.jsonText || r.raw || '';
      lastParsed = r.parsed;
      if (r.parseError) errEl.textContent = t('generate.parseError') + r.parseError;
      if (r.suggestedId && !idInput.value) idInput.value = r.suggestedId;
      saveBtn.disabled = !lastParsed;
    } catch (e) {
      out.textContent = '';
      errEl.textContent = e.message;
    } finally {
      genBtn.disabled = false;
    }
  });

  saveBtn.addEventListener('click', async () => {
    const id = idInput.value.trim();
    if (!/^[a-zA-Z0-9_\-]+$/.test(id)) return toast(t('generate.idInvalid'), 'warn');
    if (!lastParsed) return toast(t('generate.nothingToSave'), 'warn');
    if (!hasPerm('cases:write')) return toast(t('generate.noPerm'), 'err');
    try {
      await api.put('/api/cases/' + encodeURIComponent(id), lastParsed);
      toast(t('generate.savedAs', { id }), 'ok');
    } catch (e) { toast(e.message, 'err'); }
  });

  return h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', {}, t('generate.title')),
      h('span', { class: 'muted', style: { fontSize: '12px' } },
        t('generate.subtitleA'), h('span', { class: 'tag info' }, 'MIDSCENE_MODEL_NAME'), t('generate.subtitleB')),
    ),
    h('div', { class: 'split' },
      h('div', {},
        h('div', { class: 'field' }, h('span', {}, t('generate.descLabel')), ta),
        h('div', { class: 'row', style: { marginTop: '10px' } }, genBtn,
          h('div', { class: 'spacer' }),
          idInput, saveBtn,
        ),
        errEl,
      ),
      h('div', {},
        h('div', { class: 'field' }, h('span', {}, t('generate.outLabel')), out),
      ),
    ),
  );
};

// ───────── View: Config ─────────
VIEWS.config = async () => {
  const cfg = await api.get('/api/config');
  const wrap = h('div', { class: 'grid' });
  const inputs = {};
  const fields = cfg.keys.map(k => {
    const inp = h('input', {
      value: k.value ?? '',
      placeholder: k.secret && k.hasValue
        ? t('config.maskedHint', { suf: k.maskedSuffix || '' })
        : (k.placeholder || ''),
      disabled: !hasPerm('config:write'),
      type: k.secret ? 'password' : 'text',
    });
    inputs[k.key] = { input: inp, secret: !!k.secret };
    return h('div', { class: 'field' },
      h('span', {}, k.label || k.key,
        k.secret && k.hasValue ? h('span', { class: 'tag info', style: { marginLeft: '6px' } }, t('config.setBadge')) : null),
      inp,
      k.help && h('div', { class: 'faint', style: { fontSize: '11.5px' } }, k.help),
    );
  });
  const saveBtn = h('button', { class: 'btn primary' }, t('config.saveBtn'));
  const errEl = h('div', { class: 'muted', style: { color: 'var(--err)' } });

  saveBtn.addEventListener('click', async () => {
    errEl.textContent = '';
    const body = {};
    for (const [key, { input, secret }] of Object.entries(inputs)) {
      const v = input.value;
      if (secret && v === '') continue; // empty secret = no change
      body[key] = v;
    }
    try {
      const r = await api.put('/api/config', body);
      toast(t('config.savedHint', { n: r.changed.length }), 'ok', 4500);
    } catch (e) { errEl.textContent = e.message; }
  });

  wrap.appendChild(h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', {}, t('config.title')),
      hasPerm('config:write') ? saveBtn : h('span', { class: 'tag warn' }, t('config.readOnly')),
    ),
    h('div', { class: 'grid cols-2' }, fields),
    errEl,
    h('div', { class: 'divider' }),
    h('div', { class: 'faint', style: { fontSize: '12px' } }, t('config.footnote')),
  ));

  // Playwright config viewer
  try {
    const pw = await api.get('/api/config/playwright');
    if (pw.text) {
      wrap.appendChild(h('div', { class: 'card' },
        h('div', { class: 'card-head' },
          h('h2', {}, 'playwright.config.ts'),
          h('span', { class: 'tag' }, t('config.pwReadOnly')),
        ),
        h('pre', { class: 'code-block' }, pw.text),
      ));
    }
  } catch {}

  // Change password
  wrap.appendChild(passwordCard());
  return wrap;
};

function passwordCard() {
  const cur = h('input', { type: 'password', autocomplete: 'current-password' });
  const nu  = h('input', { type: 'password', autocomplete: 'new-password' });
  const nu2 = h('input', { type: 'password', autocomplete: 'new-password' });
  const err = h('div', { class: 'muted', style: { color: 'var(--err)' } });
  const btn = h('button', { class: 'btn primary' }, t('config.pw.update'));
  btn.addEventListener('click', async () => {
    err.textContent = '';
    if (nu.value !== nu2.value) { err.textContent = t('config.pw.mismatch'); return; }
    if (nu.value.length < 8) { err.textContent = t('config.pw.tooShort'); return; }
    try {
      await api.post('/api/auth/change-password', { currentPassword: cur.value, newPassword: nu.value });
      toast(t('config.pw.updated'), 'ok');
      cur.value = nu.value = nu2.value = '';
    } catch (e) { err.textContent = e.message; }
  });
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, t('config.pw.title'))),
    h('div', { class: 'grid cols-3' },
      h('div', { class: 'field' }, h('span', {}, t('config.pw.cur')), cur),
      h('div', { class: 'field' }, h('span', {}, t('config.pw.new')), nu),
      h('div', { class: 'field' }, h('span', {}, t('config.pw.confirm')), nu2),
    ),
    h('div', { class: 'row', style: { marginTop: '10px' } }, btn, err),
  );
}

// ───────── View: Users ─────────
VIEWS.users = async () => {
  const u = await api.get('/api/users');
  const wrap = h('div', { class: 'grid' });
  wrap.appendChild(h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', {}, t('users.title')),
      h('button', { class: 'btn primary sm', onClick: () => userForm(u.roles) }, t('users.new')),
    ),
    h('table', { class: 'tbl' },
      h('thead', {}, h('tr', {},
        h('th', {}, t('users.col.username')),
        h('th', {}, t('users.col.display')),
        h('th', {}, t('users.col.role')),
        h('th', {}, t('users.col.status')),
        h('th', {}, t('users.col.lastLogin')),
        h('th', { class: 'actions' }, t('cases.col.actions')),
      )),
      h('tbody', {}, u.users.map(usr => h('tr', {},
        h('td', {}, h('span', { class: 'mono' }, usr.username)),
        h('td', {}, usr.displayName || ''),
        h('td', {}, h('span', { class: 'role-badge ' + usr.role }, u.roles[usr.role]?.label || usr.role)),
        h('td', {}, usr.disabled
          ? h('span', { class: 'tag err' }, t('users.status.disabled'))
          : h('span', { class: 'tag ok' }, t('users.status.enabled'))),
        h('td', {}, usr.lastLoginAt ? fmtRel(usr.lastLoginAt) : '—'),
        h('td', { class: 'actions' },
          h('button', { class: 'btn sm', onClick: () => userForm(u.roles, usr) }, t('cases.edit')),
          ' ',
          usr.id !== state.user.id && h('button', { class: 'btn danger sm', onClick: () => deleteUser(usr) }, t('cases.delete')),
        ),
      ))),
    ),
  ));

  wrap.appendChild(h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, t('users.rolesTitle'))),
    h('div', { class: 'grid cols-2' },
      Object.entries(u.roles).map(([rid, def]) => h('div', { class: 'card', style: { background: 'var(--bg-2)' } },
        h('div', { class: 'row between' },
          h('h2', {}, h('span', { class: 'role-badge ' + rid }, def.label)),
        ),
        h('div', { class: 'muted', style: { fontSize: '12.5px', marginBottom: '8px' } }, def.description),
        h('div', { class: 'row' }, def.permissions.map(p => h('span', { class: 'tag' }, p))),
      )),
    ),
  ));
  return wrap;
};

function userForm(roles, existing) {
  const username = h('input', { value: existing?.username || '', disabled: !!existing });
  const display  = h('input', { value: existing?.displayName || '' });
  const role     = h('select', {}, Object.entries(roles).map(([rid, def]) =>
    h('option', { value: rid, selected: existing?.role === rid }, def.label)));
  if (!existing) role.value = 'viewer';
  const password = h('input', {
    type: 'password',
    placeholder: existing ? t('users.pwPlaceholderEdit') : t('users.pwPlaceholderNew'),
  });
  const disabled = h('input', { type: 'checkbox', ...(existing?.disabled ? { checked: true } : {}) });
  const err = h('div', { class: 'muted', style: { color: 'var(--err)' } });
  const m = modal({
    title: existing ? t('users.editTitle') + existing.username : t('users.newTitle'),
    body: h('div', { class: 'grid' },
      h('div', { class: 'field' }, h('span', {}, t('users.field.username')), username),
      h('div', { class: 'field' }, h('span', {}, t('users.field.display')), display),
      h('div', { class: 'field' }, h('span', {}, t('users.field.role')), role),
      h('div', { class: 'field' }, h('span', {}, existing ? t('users.field.resetPw') : t('users.field.initPw')), password),
      existing && h('label', { class: 'row' }, disabled, h('span', {}, t('users.field.disable'))),
      err,
    ),
    footer: h('div', { class: 'row', style: { marginLeft: 'auto' } },
      h('button', { class: 'btn primary', onClick: async () => {
        err.textContent = '';
        try {
          if (existing) {
            const patch = { displayName: display.value, role: role.value, disabled: !!disabled.checked };
            if (password.value) patch.password = password.value;
            await api.put('/api/users/' + existing.id, patch);
          } else {
            await api.post('/api/users', {
              username: username.value.trim(),
              displayName: display.value,
              role: role.value,
              password: password.value,
            });
          }
          toast(t('cases.saved'), 'ok'); m.close(); render();
        } catch (e) { err.textContent = e.message; }
      }}, t('cases.save')),
    ),
  });
}

async function deleteUser(usr) {
  if (!confirm(t('users.confirmDelete', { u: usr.username }))) return;
  try { await api.del('/api/users/' + usr.id); toast(t('cases.deleted'), 'ok'); render(); }
  catch (e) { toast(e.message, 'err'); }
}

// ───────── View: Audit ─────────
VIEWS.audit = async () => {
  const a = await api.get('/api/audit?limit=300');
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', {}, t('audit.title')),
      h('span', { class: 'muted', style: { fontSize: '12px' } },
        t('audit.countLabel', { n: a.entries.length, limit: a.limit })),
    ),
    a.entries.length === 0
      ? h('div', { class: 'muted' }, t('audit.empty'))
      : h('table', { class: 'tbl' },
          h('thead', {}, h('tr', {},
            h('th', {}, t('audit.col.time')),
            h('th', {}, t('audit.col.action')),
            h('th', {}, t('audit.col.user')),
            h('th', {}, t('audit.col.source')),
            h('th', {}, t('audit.col.detail')),
          )),
          h('tbody', {}, a.entries.map(e => h('tr', {},
            h('td', { class: 'mono', style: { fontSize: '11.5px' } }, fmtDate(e.ts)),
            h('td', {}, h('span', { class: 'tag ' + auditTagClass(e.action) }, e.action)),
            h('td', {}, e.user ? `@${e.user.username} (${e.user.role})` : '—'),
            h('td', { class: 'muted' }, e.ip || ''),
            h('td', { class: 'mono', style: { fontSize: '11.5px', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
              JSON.stringify(stripBase(e))),
          ))),
        ),
  );
};
function auditTagClass(action) {
  if (action.includes('failed') || action.includes('blocked') || action.includes('.delete')) return 'err';
  if (action.startsWith('runs.')) return 'info';
  if (action.startsWith('auth.')) return 'warn';
  return '';
}
function stripBase(e) {
  const { ts, action, user, ip, ua, ...rest } = e;
  return rest;
}

// ──────────────────────────────────────────────────────────────────────────
// Midscene JS pipeline UI (Generate API / Run JS / Run JS w/ Cache + active
// runs badge). Talks to /api/midscene-js/* — see server/api/midscene-js.js.
// ──────────────────────────────────────────────────────────────────────────

async function generateApiGuide(caseId) {
  toast('Generating API guide (本地规则拆分)…', 'info', 4000);
  try {
    const r = await api.post('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/api-guide');
    const n = r?.apiGuide?.steps?.length ?? 0;
    const w = r?.apiGuide?.warnings?.length ?? 0;
    toast(`apiGuide saved · ${n} steps · ${w} warning${w === 1 ? '' : 's'}`, 'ok', 5000);
    render();
  } catch (e) {
    toast(e.message, 'err', 7000);
  }
}

async function openJsRunModal(caseId, cacheMode) {
  let detail;
  try {
    detail = await api.get('/api/cases/' + encodeURIComponent(caseId));
  } catch (e) {
    return toast(e.message, 'err');
  }
  const parsed = detail.parsed ?? {};
  const apiGuide = parsed.apiGuide;
  if (!apiGuide?.steps?.length) {
    return toast('Case has no apiGuide. Click "Gen API" first.', 'warn');
  }

  const headedChk = h('input', { type: 'checkbox', checked: true });
  const consoleEl = h('pre', {
    class: 'code-block',
    // No maxHeight — let the box grow with content so users never lose log
    // lines off-screen. overflowX:auto keeps very long single lines from
    // breaking the modal width.
    style: { minHeight: '120px', overflowX: 'auto', margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  }, '(idle)');
  const statusEl = h('div', { class: 'muted', style: { minHeight: '20px' } },
    cacheMode === 'read' ? 'Will replay using existing cache (read-write).' : 'Will record fresh cache (write-only).');
  const startBtn = h('button', { class: 'btn primary' },
    cacheMode === 'read' ? 'Start (cached)' : 'Start (no cache)');
  const abortBtn = h('button', { class: 'btn danger', disabled: true, title: 'Abort the in-flight run (closes browser handles)' }, 'Abort');
  const reportLinkBox = h('div', { class: 'muted', style: { minHeight: '20px' } });

  const stepsList = h('ol', { class: 'mono', style: { fontSize: '12px', maxHeight: '320px', overflow: 'auto', paddingLeft: '20px' } },
    ...apiGuide.steps.map((s) => {
      const actual = displayApiFromStep(s);
      const planned = plannedApiTagIfDifferent(s);
      return h('li', {
        dataset: { stepOrder: String(s.order) },
        title: planned ? `Runner evals exampleCode, which calls agent.${actual}(). LLM classified this as ${planned} but the exampleCode was rewritten.` : '',
      },
        h('strong', {}, actual + ': '),
        h('span', {}, s.title || s.naturalLanguageInstruction || ''),
        planned && h('span', {
          class: 'muted small',
          style: { marginLeft: '6px', opacity: 0.65 },
        }, '· planned ' + planned),
      );
    }),
  );

  const m = modal({
    title: 'JS run · ' + (parsed.title ?? caseId) + ' · cache=' + cacheMode,
    wide: true,
    body: h('div', {},
      h('div', { class: 'field' },
        h('span', {}, 'Run options'),
        h('label', { class: 'row', style: { gap: '6px' } }, headedChk, h('span', {}, 'headed (show browser window)')),
      ),
      h('div', { class: 'field' }, h('span', {}, 'API guide steps (' + apiGuide.steps.length + ')'), stepsList),
      h('div', { class: 'field' }, h('span', {}, 'Status'), statusEl),
      h('div', { class: 'field' }, h('span', {}, 'Console (tail)'), consoleEl),
      reportLinkBox,
    ),
    footer: h('div', { class: 'row', style: { marginLeft: 'auto', gap: '8px' } }, abortBtn, startBtn),
  });

  let activeRunId = null;
  abortBtn.addEventListener('click', async () => {
    if (!activeRunId) return;
    abortBtn.disabled = true;
    abortBtn.textContent = 'Aborting…';
    try {
      await api.post('/api/midscene-js/runs/' + encodeURIComponent(activeRunId) + '/abort');
      toast('Abort signal sent', 'warn');
    } catch (e) {
      toast(e.message, 'err');
      abortBtn.disabled = false;
      abortBtn.textContent = 'Abort';
    }
  });

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    abortBtn.disabled = true;
    abortBtn.textContent = 'Abort';
    statusEl.textContent = 'Launching browser…';
    consoleEl.textContent = '';
    activeRunId = null;

    let lastLogIdx = 0;
    const pollHandle = setInterval(async () => {
      try {
        const r = await api.get('/api/midscene-js/runs/active');
        const mine = r.active.find((a) => a.caseId === caseId);
        if (!mine) return;
        activeRunId = mine.runId;
        abortBtn.disabled = false;
        const step = mine.currentStep;
        statusEl.textContent =
          'Running — step ' + (step?.order ?? '?') + '/' + mine.totalSteps +
          (step ? ` (${step.api}: ${truncForStatus(step.title, 50)})` : '') +
          '  · ' + Math.round(mine.elapsedMs / 100) / 10 + 's elapsed';
        // Highlight current step
        for (const li of stepsList.children) {
          li.style.background = li.dataset.stepOrder === String(step?.order ?? -1) ? 'rgba(80,140,255,0.18)' : '';
        }
        // Pull new log lines from logTail (server keeps last 200; we dedupe by idx)
        const fresh = mine.logTail.slice(lastLogIdx);
        if (fresh.length) {
          consoleEl.textContent += (consoleEl.textContent ? '\n' : '') + fresh.map((l) => l.line).join('\n');
          consoleEl.scrollTop = consoleEl.scrollHeight;
          lastLogIdx = mine.logTail.length;
        }
      } catch { /* ignore poll errors */ }
    }, 1500);

    try {
      const r = await api.post(
        '/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/run?cache=' + encodeURIComponent(cacheMode),
        { headed: headedChk.checked },
      );
      clearInterval(pollHandle);
      const run = r.run;
      statusEl.textContent =
        (run.status === 'passed' ? 'PASSED ✓' : 'FAILED ✗') +
        ' · ' + Math.round(run.durationMs / 100) / 10 + 's · ' +
        (run.errorMessage || '');
      // Append final logs
      consoleEl.textContent = (run.logTail ?? []).map((l) => l.line).join('\n');
      consoleEl.scrollTop = consoleEl.scrollHeight;
      if (run.report?.url) {
        reportLinkBox.appendChild(h('a', {
          href: run.report.url, target: '_blank',
          style: { color: 'var(--accent)' },
        }, 'Open Midscene report ↗'));
      }
      toast(run.status === 'passed' ? 'Run passed' : 'Run failed', run.status === 'passed' ? 'ok' : 'err');
    } catch (e) {
      clearInterval(pollHandle);
      statusEl.textContent = 'ERROR: ' + e.message;
      toast(e.message, 'err');
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = 'Run again';
      abortBtn.disabled = true;
      abortBtn.textContent = 'Abort';
      activeRunId = null;
    }
  });
}

function truncForStatus(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n) + '…';
}

// What the runner ACTUALLY calls when it evals step.exampleCode. Distinct
// from step.midsceneApi (the LLM's classification label). For "最X端" scroll
// instructions, the LLM tags them aiScroll but Desktop's
// formatAiScrollExampleCode rewrites exampleCode to agent.aiAct(...拖滑块)
// because nontrivial scroll on SAP tables doesn't respond to plain aiScroll.
// The runner evals exampleCode → aiAct is what hits the browser.
function displayApiFromStep(step) {
  const code = String(step?.exampleCode ?? '');
  const m = code.match(/\bagent\.(ai[A-Za-z]+|recordToReport)\b/);
  if (m) return m[1];
  if (/^\s*await\s+sleep\(/.test(code)) return 'sleep';
  if (/openNewTab\(/.test(code)) return 'openNewTab';
  return String(step?.midsceneApi ?? '').replace(/^agent\.|\(\)$/g, '') || 'aiTap';
}

// Returns the planned (label) name only if it differs from the actual.
// Use when you want to disclose the LLM's classification next to the truth.
function plannedApiTagIfDifferent(step) {
  const actual = displayApiFromStep(step);
  const planned = String(step?.midsceneApi ?? '').replace(/^agent\.|\(\)$/g, '');
  return planned && planned !== actual ? planned : '';
}

// ── Active-runs badge in the bottom-right corner. Auto-shows when at least
// one Midscene JS run is in flight, hidden otherwise. Polls every 2s.
function ensureActiveBadge() {
  let badge = document.getElementById('midscene-active-badge');
  if (!badge) {
    badge = h('div', {
      id: 'midscene-active-badge',
      style: {
        position: 'fixed', bottom: '14px', right: '14px', zIndex: 9000,
        background: '#111', color: '#fff', padding: '8px 12px',
        borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        display: 'none', maxWidth: '420px',
      },
    });
    document.body.appendChild(badge);
  }
  return badge;
}

async function pollActiveRuns() {
  const badge = ensureActiveBadge();
  try {
    const r = await api.get('/api/midscene-js/runs/active');
    if (!r.active.length) {
      badge.style.display = 'none';
      return;
    }
    badge.style.display = '';
    badge.innerHTML = '';
    badge.appendChild(h('div', { style: { fontWeight: 'bold', marginBottom: '4px' } },
      `${r.active.length} Midscene JS run${r.active.length > 1 ? 's' : ''} active`));
    for (const a of r.active) {
      const step = a.currentStep;
      const elapsedS = Math.round(a.elapsedMs / 100) / 10;
      const abortBtn = h('button', {
        style: {
          background: a.aborted ? '#555' : '#b3261e',
          color: '#fff', border: 0, borderRadius: '4px',
          padding: '2px 8px', fontSize: '11px',
          cursor: a.aborted ? 'default' : 'pointer',
        },
        disabled: !!a.aborted,
      }, a.aborted ? 'aborting…' : 'Abort');
      abortBtn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        abortBtn.disabled = true;
        abortBtn.textContent = 'aborting…';
        try {
          await api.post('/api/midscene-js/runs/' + encodeURIComponent(a.runId) + '/abort');
          toast('Abort signal sent for ' + (a.caseTitle || a.caseId), 'warn');
        } catch (e) {
          toast(e.message, 'err');
          abortBtn.disabled = false;
          abortBtn.textContent = 'Abort';
        }
      });
      badge.appendChild(h('div', { style: { marginTop: '4px', borderTop: '1px solid #333', paddingTop: '4px' } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('span', { style: { flex: 1 } }, (a.caseTitle || a.caseId) + ' · ' + elapsedS + 's'),
          abortBtn,
        ),
        h('div', { style: { opacity: 0.75 } },
          step ? `step ${step.order}/${a.totalSteps} · ${step.api}: ${truncForStatus(step.title, 38)}`
               : '(launching…)'),
      ));
    }
  } catch { /* swallow; badge stays as last state */ }
}

function startActiveRunsPoller() {
  if (window.__midsceneActivePollerStarted) return;
  window.__midsceneActivePollerStarted = true;
  pollActiveRuns();
  setInterval(pollActiveRuns, 2000);
}

// Kick the poller off when the SPA boots (after auth/render lifecycle is up).
// The auth gate hides the SPA until logged in; until then the badge stays
// hidden because the /api/midscene-js/runs/active endpoint requires auth.
window.addEventListener('load', () => {
  setTimeout(startActiveRunsPoller, 600);
});


