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
  const casesRes = await api.get('/api/cases');

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
            h('th', { class: 'actions' }, t('cases.col.actions')),
          )),
          h('tbody', {}, casesRes.cases.map(c => {
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
              h('td', { class: 'actions' },
                h('button', { class: 'btn sm', onClick: (e) => { e.stopPropagation(); openDetail(c.id); } }, t('cases.openDetail')),
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
  const [stepsTree, runsList] = await Promise.all([
    api.get('/api/cases/_specs/' + encodeURIComponent(specName) + '/steps').catch(() => null),
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
  const tabBar = h('div', { class: 'tabs' },
    tabLink('params',  t('detail.tabs.params'),  'cases/' + encodeURIComponent(caseId)),
    tabLink('run',     t('detail.tabs.run'),     'cases/' + encodeURIComponent(caseId) + '/run', !hasSpec),
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
        body.appendChild(h('div', { class: 'card' }, h('div', { class: 'muted' }, t('cases.noSpec'))));
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
  const usageByPath = stepsTree ? buildParamUseMap(stepsTree) : new Map();

  const dirtyFlag = h('span', { class: 'muted small', style: { marginLeft: 'auto', opacity: '0' } }, t('params.unsaved'));
  const errEl = h('div', { class: 'muted', style: { color: 'var(--err)', minHeight: '18px' } });
  const saveBtn = h('button', { class: 'btn primary', disabled: !hasPerm('cases:write') }, t('params.save'));

  // Track input state so save can collect current values without re-querying DOM.
  const inputs = [];

  // Track whether the user has edited anything since load — drives the
  // "unsaved" hint and prevents accidentally overwriting from a stale form.
  let dirty = false;
  function markDirty() {
    if (dirty) return;
    dirty = true;
    dirtyFlag.style.opacity = '1';
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
    if (rawVisible || !isFormable) {
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
    try {
      await api.put('/api/cases/' + encodeURIComponent(caseData.id), nextParsed);
      toast(t('params.saved'), 'ok');
      dirty = false;
      dirtyFlag.style.opacity = '0';
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
        h('a', {
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
