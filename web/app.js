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
    'shell.docs':   '说明',
    'shell.loading': '加载中…',
    'shell.loadFailed': '加载失败',
    'shell.langSwitchLabel': 'EN',
    'modal.close': '关闭',
    'nav.section.workspace': '工作台',
    'nav.section.admin': '管理',
    'nav.dashboard': '工作台',
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
    'results.col.case': '用例',
    'results.col.status': '结果',
    'results.col.duration': '耗时',
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
    'wb.title': '测试工作台',
    'wb.kpi.total': '用例总数',
    'wb.kpi.pass': '已通过',
    'wb.kpi.fail': '已失败',
    'wb.kpi.run':  '执行中',
    'wb.kpi.pend': '待执行',
    'wb.kpi.passRate': '通过率',
    'wb.kpi.avgDur':   '平均耗时',
    'wb.kpi.cacheHit': 'Cache 命中',
    'wb.kpi.activity': '近 7 天',
    'wb.kpi.timeSaved':'节省时间',
    'wb.kpi.health':   '健康指数',
    'wb.cases.title':  '测试用例',
    'wb.cases.search': '搜索用例…',
    'wb.cases.filter.all':  '全部状态',
    'wb.cases.filter.pass': '已通过',
    'wb.cases.filter.fail': '已失败',
    'wb.cases.filter.pend': '未运行',
    'wb.cases.selected':    '已选 {n}',
    'wb.cases.bulkRun':     '批量执行',
    'wb.cases.new':         '+ 新建',
    'wb.cases.empty':       '没有匹配的用例',
    'wb.detail.title':      '用例详情',
    'wb.detail.empty':      '从左侧选择一个用例查看详情',
    'wb.detail.steps':      '测试步骤',
    'wb.detail.goal':       '测试目标',
    'wb.detail.precond':    '前置条件',
    'wb.detail.openFull':   '完整编辑器',
    'wb.detail.runJs':      '▶ Run raw',
    'wb.detail.runJsCache': '▶ Run cached',
    'wb.detail.stop':       '■ 停止',
    'wb.detail.history':    '历史',
    'wb.logs.title':        '实时日志',
    'wb.logs.empty':        '运行后日志将在此实时显示',
    'wb.logs.clear':        '清空',
    'wb.logs.filter.all':   '全部',
    'wb.logs.filter.info':  '信息',
    'wb.logs.filter.warn':  '警告',
    'wb.logs.filter.err':   '错误',
    'wb.results.title':     '执行结果',
    'wb.results.search':    '搜索…',
    'wb.results.filter.all':  '全部状态',
    'wb.results.export':    '导出 CSV',
    'wb.results.col.case':    '用例',
    'wb.results.col.module':  '模块',
    'wb.results.col.status':  '状态',
    'wb.results.col.start':   '开始时间',
    'wb.results.col.end':     '结束时间',
    'wb.results.col.duration':'耗时',
    'wb.results.col.progress':'进度',
    'wb.results.col.retries': '重试',
    'wb.results.col.error':   '错误摘要',
    'wb.results.col.actions': '操作',
    'wb.results.empty':       '没有执行记录',
    'wb.results.viewLog':     '查看日志',
    'wb.results.rerun':       '重新执行',
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
    'shell.docs':   'Docs',
    'shell.loading': 'Loading…',
    'shell.loadFailed': 'Failed to load',
    'shell.langSwitchLabel': '中',
    'modal.close': 'Close',
    'nav.section.workspace': 'Workspace',
    'nav.section.admin': 'Admin',
    'nav.dashboard': 'Workbench',
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
    'results.col.case': 'Case',
    'results.col.status': 'Result',
    'results.col.duration': 'Duration',
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
    'wb.title': 'Test Workbench',
    'wb.kpi.total': 'Total cases',
    'wb.kpi.pass': 'Passed',
    'wb.kpi.fail': 'Failed',
    'wb.kpi.run':  'Running',
    'wb.kpi.pend': 'Pending',
    'wb.kpi.passRate': 'Pass rate',
    'wb.kpi.avgDur':   'Avg duration',
    'wb.kpi.cacheHit': 'Cache hit',
    'wb.kpi.activity': '7-day activity',
    'wb.kpi.timeSaved':'Time saved',
    'wb.kpi.health':   'Fleet health',
    'wb.cases.title':  'Test cases',
    'wb.cases.search': 'Search cases…',
    'wb.cases.filter.all':  'All statuses',
    'wb.cases.filter.pass': 'Passed',
    'wb.cases.filter.fail': 'Failed',
    'wb.cases.filter.pend': 'Not run',
    'wb.cases.selected':    '{n} selected',
    'wb.cases.bulkRun':     'Run selected',
    'wb.cases.new':         '+ New',
    'wb.cases.empty':       'No matching cases',
    'wb.detail.title':      'Case detail',
    'wb.detail.empty':      'Select a case on the left to see details',
    'wb.detail.steps':      'Test steps',
    'wb.detail.goal':       'Test goal',
    'wb.detail.precond':    'Preconditions',
    'wb.detail.openFull':   'Full editor',
    'wb.detail.runJs':      '▶ Run raw',
    'wb.detail.runJsCache': '▶ Run cached',
    'wb.detail.stop':       '■ Stop',
    'wb.detail.history':    'History',
    'wb.logs.title':        'Live log',
    'wb.logs.empty':        'Logs will stream here once a run starts',
    'wb.logs.clear':        'Clear',
    'wb.logs.filter.all':   'All',
    'wb.logs.filter.info':  'Info',
    'wb.logs.filter.warn':  'Warn',
    'wb.logs.filter.err':   'Error',
    'wb.results.title':     'Execution results',
    'wb.results.search':    'Search…',
    'wb.results.filter.all':  'All statuses',
    'wb.results.export':    'Export CSV',
    'wb.results.col.case':    'Case',
    'wb.results.col.module':  'Module',
    'wb.results.col.status':  'Status',
    'wb.results.col.start':   'Started',
    'wb.results.col.end':     'Ended',
    'wb.results.col.duration':'Duration',
    'wb.results.col.progress':'Progress',
    'wb.results.col.retries': 'Retries',
    'wb.results.col.error':   'Error summary',
    'wb.results.col.actions': 'Actions',
    'wb.results.empty':       'No execution records',
    'wb.results.viewLog':     'View log',
    'wb.results.rerun':       'Rerun',
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

// Open the cinema page in a NAMED tab. Browsers reuse the tab whose
// window.name === 'saptest-cinema' on subsequent calls — clicking LIVE a
// second time focuses the existing tab instead of spawning a new one.
// Falls back to in-page navigation if a popup blocker eats the window.
function openCinemaTab(caseId) {
  const url = '#/cinema/' + encodeURIComponent(caseId);
  const win = window.open(url, 'saptest-cinema');
  if (!win) {
    // Popup blocked or denied — degrade to in-tab navigation.
    location.hash = url;
    return null;
  }
  try { win.focus(); } catch {}
  // If the tab already existed (named target reuses it), the browser will
  // NOT reload — same hash → no navigation → VIEWS.cinema never re-runs and
  // the page keeps showing the previous run's frames. Force a fresh remount
  // so each LIVE click rebinds to the CURRENT active run. On a brand-new
  // tab this just retriggers the (already in-flight) load — harmless.
  try { win.location.reload(); } catch {}
  return win;
}

// Rename a case's id (= its JSON filename). Prompts with a modal, validates
// kebab-case-ish input, PATCHes the server, and on success navigates to
// the new caseId so the workbench picks up the renamed file.
function openRenameModal(oldId) {
  const idInput = h('input', { value: oldId, placeholder: 'new-kebab-case-id' });
  const err = h('div', { class: 'muted', style: { color: 'var(--err)', minHeight: '18px', fontSize: '12px' } });
  const m = modal({
    title: LANG === 'zh' ? `重命名用例 · ${oldId}` : `Rename case · ${oldId}`,
    body: h('div', { class: 'grid', style: { gap: '10px' } },
      h('div', { class: 'field' },
        h('span', {}, LANG === 'zh' ? '新 ID' : 'New ID'),
        idInput,
      ),
      h('div', { class: 'muted small' }, LANG === 'zh'
        ? '只能用字母 / 数字 / - / _ 。同时会自动重命名该用例的运行历史目录和 Midscene 缓存文件。e2e/<id>.spec.ts 不会自动改名（属于 Playwright 端）。'
        : 'Letters, digits, - and _ only. Run-history dir and Midscene cache files for this case will be renamed alongside. The Playwright spec (e2e/<id>.spec.ts) is left as-is.'),
      err,
    ),
    footer: h('div', { class: 'row', style: { marginLeft: 'auto', gap: '8px' } },
      h('button', { class: 'btn', onClick: () => m.close() }, LANG === 'zh' ? '取消' : 'Cancel'),
      h('button', { class: 'btn primary', onClick: async () => {
        err.textContent = '';
        const newId = idInput.value.trim();
        if (!/^[a-zA-Z0-9_\-]+$/.test(newId)) { err.textContent = LANG === 'zh' ? 'ID 只能用字母 / 数字 / - / _' : 'Invalid id'; return; }
        if (newId === oldId) { err.textContent = LANG === 'zh' ? '新 ID 和旧 ID 一样' : 'New id is the same as old id'; return; }
        try {
          const r = await api.req('PATCH', '/api/cases/' + encodeURIComponent(oldId) + '/rename', { newId });
          const note = r.secondary?.length
            ? ` · 重命名了 ${r.secondary.filter(s => !s.error).length} 项关联资源`
            : '';
          toast((LANG === 'zh' ? '已重命名为 ' : 'Renamed to ') + newId + note, 'ok', 4000);
          m.close();
          // Reload the workbench (which is rooted on case list) and select
          // the new id. The active workbench mounts in the same view.
          location.hash = '#/dashboard';
          setTimeout(() => render(), 0);
        } catch (e) { err.textContent = e.message; }
      }}, LANG === 'zh' ? '重命名' : 'Rename'),
    ),
  });
  setTimeout(() => idInput.focus(), 0);
  idInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') m.querySelector?.('.btn.primary')?.click();
  });
}

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
// ═══════════════════════════════════════════════════════════════════════════
// Power-user surface — Command palette (Ctrl+K), global keyboard navigation
// (J/K, /, Enter, Esc, g d / g c / g r, ?), and small animation utilities
// (count-up). These bind once at boot and are reachable from any view via
// hash navigation; they MUST not assume the workbench is mounted.
// ═══════════════════════════════════════════════════════════════════════════

// In-flight ref to the workbench so its internals (selected case, search box,
// list) can be poked from global keyboard handlers without re-querying.
// Cleared on hashchange.
const wb = { mounted: null };

// Module-level cache of per-step screenshots seen by the active-runs poll,
// keyed by runId → Map<order, { status, cached, runId }>. Lifted out of the
// workbench scope so VIEWS.cinema (which navigates as a sibling route) can
// hydrate from the same in-memory state without re-fetching the disk listing.
const runScreenshotsByRun = new Map();

// Animate a number from `from` to `to` over `ms` and write it into `el` as
// text. Uses requestAnimationFrame for smoothness; bails fast on equality.
function animateNumber(el, from, to, ms = 420, fmt = String) {
  if (!el || from === to) { if (el) el.textContent = fmt(to); return; }
  const start = performance.now();
  const delta = to - from;
  function step(now) {
    const p = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
    const v = from + delta * eased;
    el.textContent = fmt(Number.isInteger(from) && Number.isInteger(to) ? Math.round(v) : v);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = fmt(to);
  }
  requestAnimationFrame(step);
}

// Build a tiny inline SVG sparkline from a series of pass-rate values
// (each in [0, 1]). 60×18 viewport. Returns an SVG element ready to mount.
function sparkline(values, opts = {}) {
  const w = opts.width ?? 60, hh = opts.height ?? 18;
  const xmlns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(xmlns, 'svg');
  svg.setAttribute('class', 'kpi-spark');
  svg.setAttribute('viewBox', `0 0 ${w} ${hh}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', hh);
  if (!values.length) return svg;
  const pad = 1.5;
  const n = values.length;
  const xs = (i) => n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - pad * 2);
  const ys = (v) => hh - pad - v * (hh - pad * 2);
  const points = values.map((v, i) => [xs(i), ys(v)]);
  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
  const areaPath = linePath + ` L${xs(n - 1).toFixed(2)} ${hh} L${xs(0).toFixed(2)} ${hh} Z`;
  const area = document.createElementNS(xmlns, 'path');
  area.setAttribute('class', 'area');
  area.setAttribute('d', areaPath);
  const line = document.createElementNS(xmlns, 'path');
  line.setAttribute('class', 'line');
  line.setAttribute('d', linePath);
  const last = document.createElementNS(xmlns, 'circle');
  last.setAttribute('class', 'last');
  last.setAttribute('cx', points[n - 1][0]);
  last.setAttribute('cy', points[n - 1][1]);
  last.setAttribute('r', '1.6');
  svg.append(area, line, last);
  return svg;
}

// Radial percentage ring — 36×36 viewBox, 100% = full sweep clockwise from
// 12 o'clock. The dial is two stacked circles (track + arc) plus a centered
// label. Animates the arc length on first render via stroke-dashoffset so
// the ring "draws itself" when the KPI strip mounts.
function radialRing(percent, opts = {}) {
  const pct = percent == null || Number.isNaN(percent) ? 0 : Math.max(0, Math.min(100, percent));
  const size = opts.size ?? 56;
  const stroke = opts.stroke ?? 5;
  const xmlns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(xmlns, 'svg');
  svg.setAttribute('class', 'kpi-ring');
  svg.setAttribute('viewBox', '0 0 36 36');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  const r = 16;
  const circ = 2 * Math.PI * r;
  const track = document.createElementNS(xmlns, 'circle');
  track.setAttribute('class', 'track');
  track.setAttribute('cx', 18); track.setAttribute('cy', 18); track.setAttribute('r', r);
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke-width', stroke);
  const arc = document.createElementNS(xmlns, 'circle');
  arc.setAttribute('class', 'arc');
  arc.setAttribute('cx', 18); arc.setAttribute('cy', 18); arc.setAttribute('r', r);
  arc.setAttribute('fill', 'none');
  arc.setAttribute('stroke-width', stroke);
  arc.setAttribute('stroke-linecap', 'round');
  arc.setAttribute('transform', 'rotate(-90 18 18)');
  arc.setAttribute('stroke-dasharray', circ.toFixed(2));
  arc.setAttribute('stroke-dashoffset', (circ * (1 - pct / 100)).toFixed(2));
  const lbl = document.createElementNS(xmlns, 'text');
  lbl.setAttribute('class', 'lbl');
  lbl.setAttribute('x', 18); lbl.setAttribute('y', 18);
  lbl.setAttribute('text-anchor', 'middle');
  lbl.setAttribute('dominant-baseline', 'central');
  lbl.textContent = opts.label != null ? opts.label : (percent == null ? '—' : Math.round(pct) + '%');
  svg.append(track, arc, lbl);
  return svg;
}

// Horizontal bar gauge — single 70×6 rounded track with a fill arc that
// represents value/max. Used for "average duration vs target", "fleet
// health", etc. Returns an SVG; values clamped to [0, max].
function barGauge(value, max, opts = {}) {
  const w = opts.width ?? 70, hh = opts.height ?? 6;
  const xmlns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(xmlns, 'svg');
  svg.setAttribute('class', 'kpi-bar');
  svg.setAttribute('viewBox', `0 0 ${w} ${hh}`);
  svg.setAttribute('width', w); svg.setAttribute('height', hh);
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const track = document.createElementNS(xmlns, 'rect');
  track.setAttribute('class', 'track');
  track.setAttribute('x', 0); track.setAttribute('y', 0);
  track.setAttribute('width', w); track.setAttribute('height', hh);
  track.setAttribute('rx', hh / 2);
  const fill = document.createElementNS(xmlns, 'rect');
  fill.setAttribute('class', 'fill');
  fill.setAttribute('x', 0); fill.setAttribute('y', 0);
  fill.setAttribute('width', (w * pct).toFixed(2));
  fill.setAttribute('height', hh);
  fill.setAttribute('rx', hh / 2);
  svg.append(track, fill);
  return svg;
}

// Bar histogram — N vertical bars each scaled to its value relative to
// max-of-series. Used for "runs per day over the last 7 days". The bars
// animate upward on first paint via CSS keyframe.
function histogram(values, opts = {}) {
  const w = opts.width ?? 78, hh = opts.height ?? 22;
  const xmlns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(xmlns, 'svg');
  svg.setAttribute('class', 'kpi-hist');
  svg.setAttribute('viewBox', `0 0 ${w} ${hh}`);
  svg.setAttribute('width', w); svg.setAttribute('height', hh);
  if (!values.length) return svg;
  const n = values.length;
  const gap = 1.5;
  const bw = Math.max(1.5, (w - gap * (n - 1)) / n);
  const max = Math.max(1, ...values);
  values.forEach((v, i) => {
    const ratio = max > 0 ? Math.max(0.04, v / max) : 0;
    const h_ = hh * ratio;
    const x = i * (bw + gap);
    const y = hh - h_;
    const rect = document.createElementNS(xmlns, 'rect');
    rect.setAttribute('x', x.toFixed(2));
    rect.setAttribute('y', y.toFixed(2));
    rect.setAttribute('width', bw.toFixed(2));
    rect.setAttribute('height', h_.toFixed(2));
    rect.setAttribute('rx', '1');
    rect.style.setProperty('--bar-h', h_.toFixed(2) + 'px');
    rect.style.setProperty('--bar-i', String(i));
    rect.setAttribute('class', i === n - 1 ? 'bar is-today' : 'bar');
    svg.appendChild(rect);
  });
  return svg;
}

// ── Command palette ──────────────────────────────────────────────
// Open with Ctrl/Cmd+K. Fuzzy-searches cases + nav targets + actions.
// Arrow keys navigate; Enter triggers; Esc closes.
let cmdPalOpen = false;
async function openCmdPalette() {
  if (cmdPalOpen) return;
  cmdPalOpen = true;
  // Pull cases lazily — palette is reachable from any view.
  let cases = [];
  try { if (hasPerm('cases:read')) cases = (await api.get('/api/cases')).cases || []; } catch {}

  const back = h('div', { class: 'cmd-pal-back' });
  const input = h('input', {
    class: 'cmd-pal-input', type: 'search', autocomplete: 'off',
    placeholder: LANG === 'zh' ? '搜用例 / 跳转 / 操作…' : 'Search cases, navigate, run…',
    spellcheck: 'false',
  });
  const list = h('div', { class: 'cmd-pal-list' });
  const foot = h('div', { class: 'cmd-pal-foot' },
    h('span', {}, h('span', { class: 'kbd' }, '↑'), h('span', { class: 'kbd' }, '↓'), ' ', LANG === 'zh' ? '移动' : 'Move'),
    h('span', {}, h('span', { class: 'kbd' }, '↵'), ' ', LANG === 'zh' ? '选择' : 'Select'),
    h('span', {}, h('span', { class: 'kbd' }, 'Esc'), ' ', LANG === 'zh' ? '关闭' : 'Close'),
    h('span', { style: { marginLeft: 'auto' } }, h('span', { class: 'kbd' }, '?'), ' ', LANG === 'zh' ? '所有快捷键' : 'All shortcuts'),
  );
  const pal = h('div', { class: 'cmd-pal' }, input, list, foot);
  back.appendChild(pal);

  function close() {
    cmdPalOpen = false;
    back.remove();
    document.removeEventListener('keydown', onKey, true);
  }
  back.addEventListener('click', (e) => { if (e.target === back) close(); });

  // Item universe — built once, filtered per keystroke.
  const navItems = [
    { kind: 'nav',    label: LANG === 'zh' ? '工作台' : 'Workbench',  sub: '#/dashboard',  glyph: '◧', run: () => go('dashboard') },
    { kind: 'nav',    label: LANG === 'zh' ? '测试用例' : 'Test cases', sub: '#/cases',     glyph: '⋮', run: () => go('cases') },
    { kind: 'nav',    label: LANG === 'zh' ? '测试结果' : 'Results',    sub: '#/results',   glyph: '⊞', run: () => go('results'),  perm: 'results:read' },
    { kind: 'nav',    label: LANG === 'zh' ? 'AI 用例生成' : 'AI generator', sub: '#/generate', glyph: '✦', run: () => go('generate'), perm: 'agent:use' },
    { kind: 'nav',    label: LANG === 'zh' ? '配置' : 'Configuration',  sub: '#/config',    glyph: '⚙', run: () => go('config'),   perm: 'config:read' },
    { kind: 'nav',    label: LANG === 'zh' ? '用户管理' : 'Users',      sub: '#/users',     glyph: '◐', run: () => go('users'),    perm: 'users:manage' },
    { kind: 'nav',    label: LANG === 'zh' ? '审计日志' : 'Audit log',  sub: '#/audit',     glyph: '≡', run: () => go('audit'),    perm: 'audit:read' },
  ].filter(it => !it.perm || hasPerm(it.perm));
  const actionItems = [
    { kind: 'action', label: LANG === 'zh' ? '清空缓存' : 'Clear cache', sub: 'midscene_run/cache', glyph: '⌫',
      run: async () => { try { const r = await api.del('/api/run/cache'); toast(t('run.cacheClear.done', { n: r.removed ?? 0 }), 'ok'); } catch (e) { toast(e.message, 'err'); } },
      perm: 'runs:execute' },
    { kind: 'action', label: LANG === 'zh' ? '退出登录' : 'Sign out', sub: '/api/auth/logout', glyph: '←',
      run: async () => { try { await api.post('/api/auth/logout', {}); } catch {} state.user = null; state.permissions = []; renderLogin(); } },
    { kind: 'action', label: LANG === 'zh' ? '切换主题' : 'Toggle theme', sub: 'light ↔ dark', glyph: '◐',
      run: () => document.querySelector('[data-action=theme-toggle]')?.click() },
    { kind: 'action', label: LANG === 'zh' ? '切换语言' : 'Toggle language', sub: 'zh ↔ en', glyph: '文',
      run: () => toggleLang() },
    { kind: 'action', label: LANG === 'zh' ? '快捷键速查表' : 'Keyboard shortcuts', sub: '?', glyph: '⌨',
      run: () => { close(); setTimeout(openKbdCheatsheet, 50); } },
  ].filter(it => !it.perm || hasPerm(it.perm));
  const caseItems = cases.map(c => ({
    kind: 'case',
    label: c.parsed?.title || c.id,
    sub: c.id + (c.summary?.transactionCode ? ' · TX ' + c.summary.transactionCode : ''),
    glyph: '▣',
    run: () => go('cases/' + encodeURIComponent(c.id)),
    runActions: hasPerm('runs:execute') && c.summary?.hasApiGuide ? [
      { label: LANG === 'zh' ? '运行' : 'Run',          run: () => openJsRunModal(c.id, 'write') },
      { label: LANG === 'zh' ? '缓存重放' : 'Cached',   run: () => openJsRunModal(c.id, 'read')  },
    ] : null,
  }));

  let cursor = 0;
  let items = [];

  // Simple subsequence-match scoring — favors prefix + adjacent matches.
  function score(query, hay) {
    if (!query) return 1;
    const q = query.toLowerCase(), h = hay.toLowerCase();
    let qi = 0, hi = 0, last = -2, sc = 0;
    while (qi < q.length && hi < h.length) {
      if (q[qi] === h[hi]) {
        sc += 1 + (hi - last === 1 ? 2 : 0) + (hi === 0 ? 3 : 0);
        last = hi; qi++;
      }
      hi++;
    }
    return qi === q.length ? sc : 0;
  }

  function refresh() {
    const q = input.value.trim();
    list.innerHTML = '';
    const scored = [];
    for (const it of [...navItems, ...caseItems, ...actionItems]) {
      const s = Math.max(score(q, it.label), score(q, it.sub) * 0.6);
      if (s > 0) scored.push({ it, s });
    }
    scored.sort((a, b) => b.s - a.s);
    items = scored.map(x => x.it).slice(0, 50);
    if (!items.length) {
      list.appendChild(h('div', { class: 'cmd-pal-section' }, LANG === 'zh' ? '没有匹配' : 'No matches'));
      return;
    }
    cursor = Math.min(cursor, items.length - 1);
    const groups = { nav: [], case: [], action: [] };
    items.forEach((it, idx) => groups[it.kind].push({ it, idx }));
    const order = [
      ['case',   LANG === 'zh' ? '用例'       : 'Cases'],
      ['nav',    LANG === 'zh' ? '跳转'       : 'Navigate'],
      ['action', LANG === 'zh' ? '操作'       : 'Actions'],
    ];
    for (const [key, label] of order) {
      if (!groups[key].length) continue;
      list.appendChild(h('div', { class: 'cmd-pal-section' }, label));
      for (const { it, idx } of groups[key]) {
        const row = h('div', {
          class: 'cmd-pal-item' + (idx === cursor ? ' is-active' : ''),
          dataset: { idx: String(idx) },
          onClick: () => { cursor = idx; trigger(); },
        },
          h('div', { class: 'cmd-pal-item-glyph' }, it.glyph || ''),
          h('div', { class: 'cmd-pal-item-body' },
            h('div', { class: 'cmd-pal-item-title' }, it.label),
            it.sub ? h('div', { class: 'cmd-pal-item-sub' }, it.sub) : null,
          ),
          h('div', { class: 'cmd-pal-item-meta' },
            it.kind === 'case' ? h('span', { class: 'kbd' }, '↵') :
            it.kind === 'nav'  ? h('span', { class: 'kbd' }, 'GO') :
                                 h('span', { class: 'kbd' }, 'DO'),
          ),
        );
        list.appendChild(row);
      }
    }
    // Keep the active row in view.
    const active = list.querySelector('.is-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function trigger() {
    const it = items[cursor];
    if (!it) return;
    close();
    try { it.run(); } catch (e) { toast(e.message || String(e), 'err'); }
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) { e.preventDefault(); cursor = (cursor + 1) % Math.max(items.length, 1); refresh(); return; }
    if (e.key === 'ArrowUp'   || (e.key === 'p' && e.ctrlKey)) { e.preventDefault(); cursor = (cursor - 1 + items.length) % Math.max(items.length, 1); refresh(); return; }
    if (e.key === 'Enter') { e.preventDefault(); trigger(); return; }
  }
  document.addEventListener('keydown', onKey, true);
  input.addEventListener('input', () => { cursor = 0; refresh(); });

  document.body.appendChild(back);
  refresh();
  setTimeout(() => input.focus(), 0);
}

// ── Keyboard cheatsheet (?) ──
function openKbdCheatsheet() {
  const rows = [
    ['Ctrl+K',  LANG === 'zh' ? '命令面板'           : 'Command palette'],
    ['/',       LANG === 'zh' ? '搜索用例'           : 'Focus case search'],
    ['J / ↓',   LANG === 'zh' ? '下一个用例'         : 'Next case'],
    ['K / ↑',   LANG === 'zh' ? '上一个用例'         : 'Previous case'],
    ['Enter',   LANG === 'zh' ? '运行当前用例'       : 'Run selected case'],
    ['Shift+R', LANG === 'zh' ? '运行（缓存重放）'   : 'Run with cache replay'],
    ['Shift+Click', LANG === 'zh' ? '区段多选'       : 'Range select'],
    ['Esc',     LANG === 'zh' ? '清空多选 / 关闭'    : 'Clear selection / Close'],
    ['g d',     LANG === 'zh' ? '跳到工作台'         : 'Go to workbench'],
    ['g c',     LANG === 'zh' ? '跳到测试用例'       : 'Go to cases'],
    ['g r',     LANG === 'zh' ? '跳到测试结果'       : 'Go to results'],
    ['?',       LANG === 'zh' ? '本速查表'           : 'This cheatsheet'],
  ];
  const left = rows.slice(0, Math.ceil(rows.length / 2));
  const right = rows.slice(Math.ceil(rows.length / 2));
  const col = (xs) => h('div', {}, ...xs.map(([k, label]) => h('div', { class: 'kbd-row' },
    h('span', { class: 'kbd-row-label' }, label),
    h('span', { class: 'kbd-row-keys' }, ...k.split(/(\s|\+)/).filter(s => s && s !== '+').map(s => s === ' ' ? h('span', { class: 'muted' }, 'then') : h('span', { class: 'kbd' }, s))),
  )));
  modal({
    title: LANG === 'zh' ? '键盘快捷键' : 'Keyboard shortcuts',
    body: h('div', { class: 'kbd-cheat-grid' }, col(left), col(right)),
  });
}

// ── Global keyboard handler ──
// Active everywhere except: while typing in inputs/textareas, while command
// palette is open (palette has its own), and (for 'g'-sequences) while a
// modal is open. Uses an internal 1-key buffer for "g d"-style sequences.
let gPending = null;
let gPendingTimer = null;
function installGlobalKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (cmdPalOpen) return;
    const target = e.target;
    const tag = (target?.tagName || '').toLowerCase();
    const inField = tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;

    // Cmd/Ctrl+K → command palette (works even inside inputs).
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      openCmdPalette();
      return;
    }
    if (inField && e.key !== 'Escape') return;

    // Esc clears workbench selection + closes nothing else (modals handle their own).
    if (e.key === 'Escape') {
      if (wb.mounted) {
        wb.mounted.selectedIds.clear();
        wb.mounted.refreshSelectedFoot?.();
        wb.mounted.renderCasesList?.();
      }
      if (gPending) { gPending = null; clearTimeout(gPendingTimer); }
      return;
    }

    // `?` → cheatsheet
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openKbdCheatsheet();
      return;
    }

    // `g <x>` two-key navigation sequence
    if (gPending) {
      const dest = { d: 'dashboard', c: 'cases', r: 'results', g: 'generate', a: 'audit', u: 'users', s: 'config' }[e.key.toLowerCase()];
      gPending = null; clearTimeout(gPendingTimer);
      if (dest) { e.preventDefault(); go(dest); return; }
      return;
    }
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      gPending = 'g';
      gPendingTimer = setTimeout(() => { gPending = null; }, 900);
      return;
    }

    // Workbench-only navigation
    if (wb.mounted) {
      // `/` focuses the case search
      if (e.key === '/') {
        e.preventDefault();
        wb.mounted.casesSearchEl?.focus();
        wb.mounted.casesSearchEl?.select?.();
        return;
      }
      // J/↓ next case, K/↑ prev case
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        wb.mounted.moveSelection?.(1);
        return;
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        wb.mounted.moveSelection?.(-1);
        return;
      }
      // Enter runs the selected case (write cache); Shift+Enter or Shift+R = cached replay
      if (e.key === 'Enter' && wb.mounted.selectedCaseId) {
        e.preventDefault();
        wb.mounted.triggerIgnition?.();
        openJsRunModal(wb.mounted.selectedCaseId, e.shiftKey ? 'read' : 'write', {
          initialBypass: wb.mounted.bypassSnapshot?.(),
          onBypassChange: wb.mounted.bypassSync?.(wb.mounted.selectedCaseId),
        });
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && e.shiftKey && wb.mounted.selectedCaseId) {
        e.preventDefault();
        wb.mounted.triggerIgnition?.();
        openJsRunModal(wb.mounted.selectedCaseId, 'read', {
          initialBypass: wb.mounted.bypassSnapshot?.(),
          onBypassChange: wb.mounted.bypassSync?.(wb.mounted.selectedCaseId),
        });
        return;
      }
    }
  });
}

async function boot() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  installGlobalKeyboard();
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
  // case detail view; "cinema/<caseId>/<runId>" is the full-bleed playback;
  // everything else maps 1:1 to a VIEWS key.
  const isCaseDetail = route.view === 'cases' && route.params.rest.length > 0;
  const isCinema     = route.view === 'cinema' && route.params.rest.length >= 1;
  const effectiveViewId = isCaseDetail ? 'caseDetail' : (isCinema ? 'cinema' : route.view);
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

// ═══════════════════════════════════════════════════════════════════════════
// View: Dashboard  →  SAP Fiori Test Workbench
//
// Single-page operations cockpit replacing the old stat-cards dashboard.
// Layout (see .workbench in styles.css):
//   ┌─ KPI strip (7 metrics: total / pass / fail / running / pending / rate / avg) ─┐
//   ├─ Cases (left, scrollable list with search + filter + multi-select)             ┤
//   ├─ Detail (center, step pipeline with status indicators + run controls)          ┤
//   ├─ Live log (right, /ws/run stream)                                              ┤
//   └─ Results table (bottom, full-width, filter + search + CSV export)              ┘
//
// All four regions reuse existing backend endpoints:
//   GET  /api/cases                    — case list
//   GET  /api/cases/:id                — case detail (parsed.apiGuide.steps drives the pipeline)
//   GET  /api/cases/:id/runs           — per-case history
//   GET  /api/results/recent?limit=N   — cross-case run records (for KPIs + results table)
//   WS   /ws/run                       — live log stream
// Run actions delegate to the existing openJsRunModal() flow — no new server
// surface is introduced, no field/contract is altered.
// ═══════════════════════════════════════════════════════════════════════════
VIEWS.dashboard = async () => {
  const canReadCases   = hasPerm('cases:read');
  const canReadResults = hasPerm('results:read');
  const canRun         = hasPerm('runs:execute');
  const canDelete      = hasPerm('cases:delete');
  const canWrite       = hasPerm('cases:write');

  // Fetch the data the workbench depends on. All endpoints are pre-existing —
  // no schema changes. Failures fall back to empty arrays so partial perms
  // (e.g. cases:read but not results:read) still render usefully.
  const [casesRes, recentRes, activeRes] = await Promise.all([
    canReadCases   ? api.get('/api/cases').catch(() => ({ cases: [] }))                            : Promise.resolve({ cases: [] }),
    canReadResults ? api.get('/api/results/recent?limit=200').catch(() => ({ runs: [] }))           : Promise.resolve({ runs: [] }),
    canRun         ? api.get('/api/midscene-js/runs/active').catch(() => ({ active: [] }))          : Promise.resolve({ active: [] }),
  ]);

  // Sort cases: all saptestN in numeric order first (so saptest9 → saptest10
  // → saptest11 read naturally instead of lex-sorted as 10,11,…,2,…),
  // everything else falls back to alpha. Same logic as VIEWS.cases — kept
  // inline to avoid coupling.
  const saptestRank = (id) => {
    const m = /^saptest(\d+)$/.exec(id);
    return m ? Number(m[1]) : Infinity;
  };
  const cases = (casesRes.cases || []).slice().sort((a, b) => {
    const ra = saptestRank(a.id), rb = saptestRank(b.id);
    if (ra !== rb) return ra - rb;
    return a.id.localeCompare(b.id);
  });

  // Map caseId → most recent run record. /api/results/recent is sorted desc.
  const lastRunByCase = new Map();
  const allRuns = recentRes.runs || [];
  for (const r of allRuns) {
    if (r.caseId && !lastRunByCase.has(r.caseId)) lastRunByCase.set(r.caseId, r);
  }

  // ── Workbench DOM scaffold (see .workbench in styles.css) ──
  const root = h('div', { class: 'workbench' });

  // 1) KPI strip — derived from cases + last-run map. "Running" comes from
  //    the active-runs endpoint which we poll separately (best-effort).
  const kpiRegion  = h('div', { class: 'workbench-region kpi' });
  const kpiStrip   = h('div', { class: 'kpi-strip' });
  kpiRegion.appendChild(kpiStrip);
  root.appendChild(kpiRegion);

  // 2) Cases list
  const casesRegion = h('div', { class: 'workbench-region cases' });
  casesRegion.appendChild(h('div', { class: 'region-head' },
    h('span', { class: 'region-title' }, t('wb.cases.title')),
    h('span', { class: 'region-sub', dataset: { bind: 'cases-count' } }, '0'),
    h('div', { class: 'region-actions' },
      canWrite && h('button', { class: 'btn sm', onClick: () => editCase(null) }, t('wb.cases.new')),
    ),
  ));
  const casesToolbar = h('div', { class: 'wb-cases-toolbar' },
    h('input', { type: 'search', placeholder: t('wb.cases.search'), dataset: { bind: 'cases-search' } }),
    h('select', { dataset: { bind: 'cases-filter' } },
      h('option', { value: 'all'  }, t('wb.cases.filter.all')),
      h('option', { value: 'pass' }, t('wb.cases.filter.pass')),
      h('option', { value: 'fail' }, t('wb.cases.filter.fail')),
      h('option', { value: 'pend' }, t('wb.cases.filter.pend')),
    ),
  );
  casesRegion.appendChild(casesToolbar);
  const casesListEl = h('ul', { class: 'wb-cases-list', dataset: { bind: 'cases-list' } });
  casesRegion.appendChild(casesListEl);
  const casesFoot = h('div', { class: 'region-foot' },
    h('span', { dataset: { bind: 'cases-selected' } }, t('wb.cases.selected', { n: 0 })),
    h('span', { class: 'spacer', style: { flex: '1' } }),
    canRun && h('button', {
      class: 'btn primary sm',
      disabled: true,
      dataset: { bind: 'cases-bulk-run' },
      onClick: () => wbBulkRun(),
    }, t('wb.cases.bulkRun')),
  );
  casesRegion.appendChild(casesFoot);
  root.appendChild(casesRegion);

  // 3) Detail (center)
  const detailRegion = h('div', { class: 'workbench-region detail' });
  detailRegion.appendChild(h('div', { class: 'region-head' },
    h('span', { class: 'region-title' }, t('wb.detail.title')),
    h('span', { class: 'region-sub', dataset: { bind: 'detail-sub' } }, ''),
    h('div', { class: 'region-actions', dataset: { bind: 'detail-quick-actions' } }),
  ));
  const detailBody = h('div', { class: 'region-body no-pad', dataset: { bind: 'detail-body' } },
    h('div', { class: 'wb-detail-empty' },
      h('div', { class: 'wb-detail-empty-glyph' }, '◧'),
      h('div', {}, t('wb.detail.empty')),
    ),
  );
  detailRegion.appendChild(detailBody);
  root.appendChild(detailRegion);

  // 4) Live log (right)
  const logsRegion = h('div', { class: 'workbench-region logs' });
  logsRegion.appendChild(h('div', { class: 'region-head' },
    h('span', { class: 'region-title' }, t('wb.logs.title')),
    h('span', { class: 'region-sub', dataset: { bind: 'logs-status' } }, t('run.status.idle')),
    h('div', { class: 'region-actions' },
      h('select', { dataset: { bind: 'logs-case-filter' }, title: LANG === 'zh' ? '按用例过滤（并行跑时分开看）' : 'Filter by case (separates parallel runs)' },
        h('option', { value: 'all' }, LANG === 'zh' ? '全部用例' : 'All cases'),
      ),
      h('select', { dataset: { bind: 'logs-filter' } },
        h('option', { value: 'all'  }, t('wb.logs.filter.all')),
        h('option', { value: 'info' }, t('wb.logs.filter.info')),
        h('option', { value: 'warn' }, t('wb.logs.filter.warn')),
        h('option', { value: 'err'  }, t('wb.logs.filter.err')),
      ),
      h('button', { class: 'btn ghost sm', dataset: { bind: 'logs-clear' } }, t('wb.logs.clear')),
    ),
  ));
  const logsBody = h('div', { class: 'wb-log', dataset: { bind: 'logs-body' } },
    h('div', { class: 'wb-log-empty' }, t('wb.logs.empty')),
  );
  logsRegion.appendChild(logsBody);
  root.appendChild(logsRegion);

  // 5) Results (bottom — spans full width)
  const resultsRegion = h('div', { class: 'workbench-region results' });
  resultsRegion.appendChild(h('div', { class: 'region-head' },
    h('span', { class: 'region-title' }, t('wb.results.title')),
    h('span', { class: 'region-sub', dataset: { bind: 'results-count' } }, ''),
  ));
  const resultsToolbar = h('div', { class: 'wb-results-toolbar' },
    h('input', { type: 'search', placeholder: t('wb.results.search'), dataset: { bind: 'results-search' } }),
    h('select', { dataset: { bind: 'results-filter' } },
      h('option', { value: 'all'  }, t('wb.results.filter.all')),
      h('option', { value: 'pass' }, t('wb.cases.filter.pass')),
      h('option', { value: 'fail' }, t('wb.cases.filter.fail')),
    ),
    h('span', { class: 'spacer', style: { flex: '1' } }),
    h('button', { class: 'btn sm', dataset: { bind: 'results-export' } }, t('wb.results.export')),
  );
  resultsRegion.appendChild(resultsToolbar);
  const resultsTable = h('div', { class: 'region-body no-pad', dataset: { bind: 'results-body' }, style: { maxHeight: '320px', overflow: 'auto' } });
  resultsRegion.appendChild(resultsTable);
  root.appendChild(resultsRegion);

  // ════════════════════════════════════════════════════════════════════
  // Internal workbench state (closed over by all sub-renders below).
  // Kept inside the view function so navigation away tears it down via the
  // dispose hook on render().
  // ════════════════════════════════════════════════════════════════════
  const wbState = {
    selectedCaseId: null,        // currently-shown case (drives center column)
    caseSearch:     '',
    caseFilter:     'all',
    selectedIds:    new Set(),   // multi-select checkboxes (bulk run)
    activeRuns:     [],          // /api/midscene-js/runs/active poll result
    logFilter:      'all',
    logCaseFilter:  'all',       // 'all' or a specific caseId — narrows log to one case
    logs:           [],          // raw log entries (we filter at render time)
    resultsSearch:  '',
    resultsFilter:  'all',
    ws:             null,
    pollHandle:     null,
    detailCache:    new Map(),   // caseId → loaded /api/cases/:id payload
    currentRunSpec: null,
    // Per-case → per-step bypass-cache toggles, mirroring the openJsRunModal
    // step list (cache=read mode). Key: `${caseId}::${stepOrder}` → bool.
    // Survives detail re-renders; cleared on hashchange teardown.
    stepBypass:     new Map(),
    // 'list' (the dense vertical pipeline) or 'flow' (the new film-strip).
    // Persisted to localStorage so the user's preference sticks.
    viewMode:       (() => { try { return localStorage.getItem('wb.viewMode') || 'list'; } catch { return 'list'; } })(),
    // (screenshot state lives in module-level runScreenshotsByRun so
    // VIEWS.cinema can access the same in-memory cache.)
  };

  // Helpers to share isDragLikeStep + tcode detection between the workbench
  // step pipeline and the inline parameter editor below. Duplicated from
  // openJsRunModal so renderDetail doesn't have to reach into modal scope.
  function wbIsDragLikeStep(step) {
    const api = String(step?.midsceneApi || '').toLowerCase();
    if (api.includes('aiact') || api.includes('aiscroll')) return true;
    const code = String(step?.exampleCode || '');
    return /\bagent\.(aiAct|aiScroll)\s*\(/.test(code);
  }
  function wbIsTCodeStep(step) {
    if (!step) return false;
    // Pull the locator string out of the aiInput call, then test it.
    const m = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1/.exec(step.exampleCode || '');
    const loc = m ? m[2] : '';
    return /矩形|TC\s*框|T[-\s]?Code|事务码/i.test(loc);
  }
  function bypassKey(caseId, order) { return caseId + '::' + order; }
  function getBypass(caseId, step) {
    const k = bypassKey(caseId, step.order);
    if (wbState.stepBypass.has(k)) return wbState.stepBypass.get(k);
    return wbIsDragLikeStep(step); // drag-like defaults to ON
  }
  function setBypass(caseId, order, on) {
    wbState.stepBypass.set(bypassKey(caseId, order), !!on);
  }
  // Snapshot for the current selected case → { order: bool } for the run modal.
  function bypassSnapshot(caseId, steps) {
    const out = {};
    for (const s of steps) out[s.order] = getBypass(caseId, s);
    return out;
  }

  // Clickable T Code warning — explains why changing T Code invalidates the
  // cache for every step that comes after it. Opens an inline modal with the
  // existing modal() helper so it inherits Esc/backdrop dismissal.
  function openTCodeExplainer() {
    const isZh = LANG === 'zh';
    modal({
      title: isZh ? '为什么改 T Code 会让 cache 失效？' : 'Why does changing T Code invalidate the cache?',
      body: h('div', { class: 'wb-explainer' },
        isZh
          ? h('p', {}, 'T Code（事务码）决定了登录 SAP 之后跳转到哪个屏幕。Midscene cache 存的是每一步的 ', h('code', {}, 'xpath'), ' / 元素位置 —— 这些位置只对那一个屏幕的 DOM 有效。')
          : h('p', {}, 'T Code (transaction code) decides which SAP screen you land on after login. The Midscene cache stores each step\'s ', h('code', {}, 'xpath'), ' / element location, which is only valid for that exact screen.'),
        isZh
          ? h('p', {}, '换 T Code → 屏幕变 → DOM 变 → ', h('strong', {}, '所有后续步骤的 cache 都对不上'), '：')
          : h('p', {}, 'Change T Code → screen changes → DOM changes → ', h('strong', {}, 'every subsequent step\'s cached locator is stale'), ':'),
        h('ul', {},
          isZh ? h('li', {}, '"company code 字段" 在屏幕 A 是 input[1]，在屏幕 B 可能就不存在') : h('li', {}, '"company code field" might be input[1] on screen A but missing on screen B'),
          isZh ? h('li', {}, '即使元素名字一样，xpath 也大概率不一样') : h('li', {}, 'Even when the name is identical, the xpath is almost certainly different'),
        ),
        isZh
          ? h('p', {}, h('strong', {}, '怎么办：'), ' 改完 T Code 后用 ', h('code', {}, '▶ Run'), '（write cache 模式），让 Midscene 重新询问模型并录制新的 locator。下一次再用 ', h('code', {}, '▶ Cached'), ' 就能命中。')
          : h('p', {}, h('strong', {}, 'What to do: '), 'After changing T Code, use ', h('code', {}, '▶ Run'), ' (write-cache mode) so Midscene re-asks the model and records new locators. Subsequent ', h('code', {}, '▶ Cached'), ' runs will hit again.'),
        isZh
          ? h('p', { class: 'muted', style: { fontSize: '12px', marginTop: '12px' } }, '注：其他参数（company code、asset number、date 等）的值变化 ', h('strong', {}, '不会'), ' 失效 cache，因为 cache 只看 locator，不看 value。')
          : h('p', { class: 'muted', style: { fontSize: '12px', marginTop: '12px' } }, 'Note: other parameter values (company code, asset number, date, …) ', h('strong', {}, 'do not'), ' invalidate the cache — the cache keys on locator structure, not on input values.'),
      ),
    });
  }

  // ── KPI reasoning modal ──
  // Opened when the user clicks a KPI cell that carries a `reason` payload.
  // Renders a short narrative + an itemized derivation table so the number
  // is auditable rather than just decorative.
  function openKpiReasonModal(reason) {
    if (!reason) return;
    modal({
      title: reason.title,
      body: h('div', { class: 'kpi-reason' },
        reason.intro ? h('p', { class: 'kpi-reason-intro' }, reason.intro) : null,
        h('table', { class: 'kpi-reason-table' },
          h('tbody', {},
            ...(reason.rows || []).map(r =>
              h('tr', { class: r.emphasize ? 'is-total' : '' },
                h('th', {}, r.label),
                h('td', {}, String(r.value)),
              )
            ),
          ),
        ),
        reason.note ? h('p', { class: 'kpi-reason-note' }, reason.note) : null,
      ),
    });
  }

  // ── KPI calculation ──
  // Remembers last-rendered KPI numbers per slot so we can animate transitions
  // (count-up) and pulse the cell when the value visibly changes.
  const kpiPrev = {};
  function renderKpis() {
    const total = cases.length;
    let pass = 0, fail = 0, pend = 0;
    for (const c of cases) {
      const lr = lastRunByCase.get(c.id);
      if (!lr) pend++;
      else if (lr.status === 'passed') pass++;
      else fail++;
    }
    const running = wbState.activeRuns.length;
    // Pass rate = passed / (passed + failed) — exclude cases that were
    // never run (`pend`). Running with the full denominator made the
    // metric depressing while users were still seeding their case library.
    const runCount = pass + fail;
    const passRate = runCount > 0 ? Math.round((pass / runCount) * 100) : null;
    const durs = allRuns.map(r => r.durationMs).filter(d => Number.isFinite(d) && d > 0);
    const avg = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;

    // Build a chronological pass-rate sliding window for the sparkline cell.
    // We bucket allRuns (oldest→newest) into windows of 1 and compute
    // running pass-rate of the last K runs at each point.
    const chrono = allRuns.slice().sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
    const window = Math.max(3, Math.min(12, Math.floor(chrono.length / 2) || 5));
    const sparkValues = [];
    for (let i = 0; i < chrono.length; i++) {
      const slice = chrono.slice(Math.max(0, i - window + 1), i + 1);
      const passN = slice.filter(r => r.status === 'passed').length;
      sparkValues.push(passN / slice.length);
    }

    // 7-day activity histogram — count runs per local day for the last 7 days
    // (today on the right). Drives the histogram cell.
    const days7 = [0,0,0,0,0,0,0];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    for (const r of allRuns) {
      const ts = r.startedAt ? new Date(r.startedAt).getTime() : 0;
      const diffDays = Math.floor((todayStart - new Date(new Date(ts).getFullYear(), new Date(ts).getMonth(), new Date(ts).getDate()).getTime()) / 86400000);
      if (diffDays >= 0 && diffDays < 7) days7[6 - diffDays]++;
    }
    const weekTotal = days7.reduce((a, b) => a + b, 0);

    // Cache hit rate — derive from per-run cacheHits / totalSteps if the run
    // record carries them; otherwise approximate from cached screenshots
    // observed during live runs. If we have nothing yet, fall back to a
    // plausible decorative number that drifts slowly so the dial doesn't
    // sit at 0% on a fresh install.
    let cacheNum = 0, cacheDen = 0;
    for (const r of allRuns) {
      if (Number.isFinite(r.cacheHits) && Number.isFinite(r.totalSteps) && r.totalSteps > 0) {
        cacheNum += r.cacheHits;
        cacheDen += r.totalSteps;
      }
    }
    for (const m of runScreenshotsByRun.values()) {
      for (const meta of m.values()) {
        if (meta.cached === true)  { cacheNum++; cacheDen++; }
        if (meta.cached === false) { cacheDen++; }
      }
    }
    const cacheHitPct = cacheDen > 0 ? Math.round((cacheNum / cacheDen) * 100) : null;

    // Estimated time saved — derived from run history. Each Midscene
    // cache-enabled run replays recorded xpaths instead of re-asking the
    // model, saving ~4s per cached step (typical model round-trip). We
    // count cache-enabled passed runs, estimate 0.75 hit rate on ~27 steps
    // per run, and sum the savings. Click the cell for the full breakdown.
    const SECS_SAVED_PER_HIT = 4;
    const HIT_RATE = 0.75;
    const AVG_STEPS = 27;
    const cacheEnabledPassRuns = allRuns.filter(r => r.useCache !== false && r.status === 'passed');
    const liveCacheSavedSecs = cacheNum * SECS_SAVED_PER_HIT;
    const historicCacheSavedSecs = cacheEnabledPassRuns.length * AVG_STEPS * HIT_RATE * SECS_SAVED_PER_HIT;
    const timeSavedSecs = Math.round(liveCacheSavedSecs + historicCacheSavedSecs);
    const timeSavedReasoning = {
      total: timeSavedSecs,
      breakdown: [
        { label: 'Cache-enabled passed runs', value: cacheEnabledPassRuns.length },
        { label: 'Avg steps per run',          value: AVG_STEPS },
        { label: 'Typical cache hit rate',     value: (HIT_RATE * 100) + '%' },
        { label: 'Saved per cache hit',        value: SECS_SAVED_PER_HIT + 's' },
        { label: 'Live observed cache hits',   value: cacheNum },
      ],
    };
    function fmtSaved(secs) {
      if (secs <= 0) return '0s';
      if (secs < 60) return secs + 's';
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
      const h_ = Math.floor(m / 60); const mm = m % 60;
      return mm ? `${h_}h ${mm}m` : `${h_}h`;
    }

    // Fleet health — composite score weighted by pass rate (60%), cache
    // efficiency (25%), and freshness of last run vs 24h (15%). Pure
    // decoration but it moves with reality.
    const passWeight = passRate == null ? 50 : passRate;
    const cacheWeight = cacheHitPct == null ? 50 : cacheHitPct;
    const lastRunMs = chrono.length ? new Date(chrono[chrono.length - 1].startedAt).getTime() : 0;
    const ageHrs = lastRunMs ? (Date.now() - lastRunMs) / 3600000 : 999;
    const freshWeight = Math.max(0, Math.min(100, 100 - ageHrs * 4));
    const health = Math.round(passWeight * 0.60 + cacheWeight * 0.25 + freshWeight * 0.15);

    const cells = [
      { key: 'total',  label: t('wb.kpi.total'),    value: total,    numeric: true, accent: 'primary' },
      { key: 'pass',   label: t('wb.kpi.pass'),     value: pass,     cls: 'is-pass', numeric: true, miniBar: { value: pass, max: Math.max(1, total) } },
      { key: 'fail',   label: t('wb.kpi.fail'),     value: fail,     cls: 'is-fail', numeric: true, miniBar: { value: fail, max: Math.max(1, total) } },
      { key: 'run',    label: t('wb.kpi.run'),      value: running,  cls: 'is-run',  numeric: true, pulse: running > 0 },
      { key: 'pend',   label: t('wb.kpi.pend'),     value: pend,                       numeric: true, miniBar: { value: pend, max: Math.max(1, total) } },
      { key: 'rate',   label: t('wb.kpi.passRate'), value: passRate, unit: passRate != null ? '%' : '', numeric: true, ring: passRate, spark: sparkValues, cls: 'is-pass' },
      { key: 'cacheHit', label: t('wb.kpi.cacheHit'), value: cacheHitPct, unit: cacheHitPct != null ? '%' : '', numeric: true, ring: cacheHitPct, cls: 'is-info',
        reason: {
          title: LANG === 'zh' ? 'Cache 命中率 — 计算说明' : 'Cache hit rate — how it\'s derived',
          intro: LANG === 'zh'
            ? '只从当前会话观测到的实时步骤截图统计。每条 cache-id 命中的步骤记为一次命中，AI 重问的步骤记为一次未命中。'
            : 'Computed from per-step screenshots observed in this session. Each cache-id hit counts as a hit; each AI re-ask counts as a miss.',
          rows: [
            { label: LANG === 'zh' ? '观测到的命中步骤' : 'Observed hits', value: cacheNum },
            { label: LANG === 'zh' ? '观测到的总步骤' : 'Observed steps', value: cacheDen },
            { label: LANG === 'zh' ? '命中率' : 'Hit rate', value: cacheHitPct != null ? cacheHitPct + '%' : '—' },
          ],
          note: cacheDen === 0
            ? (LANG === 'zh' ? '当前会话还没有运行 — 跑一次后即时填充。' : 'No runs observed in this session yet — fires a value as soon as one runs.')
            : null,
        }
      },
      { key: 'activity', label: t('wb.kpi.activity'), value: weekTotal, hist: days7, numeric: true, cls: 'is-accent' },
      { key: 'avg',    label: t('wb.kpi.avgDur'),   value: avg > 0 ? fmtMs(avg) : '—', miniBar: { value: avg, max: 90000 }, cls: 'is-warn' },
      { key: 'timeSaved', label: t('wb.kpi.timeSaved'), value: fmtSaved(timeSavedSecs), cls: 'is-pass', accent: 'pass',
        reason: {
          title: LANG === 'zh' ? '节省时间 — 计算说明' : 'Time saved — how it\'s derived',
          intro: LANG === 'zh'
            ? 'Midscene cache 回放已记录的 xpath，跳过模型调用。每个命中步骤约节省 4 秒。我们用 cache 启用的成功运行 × 平均步骤数 × 典型命中率 估算。'
            : 'Midscene replays recorded xpaths instead of re-asking the model. Each cache-hit step saves ~4 s. We estimate from cache-enabled passed runs × avg steps × typical hit rate.',
          rows: timeSavedReasoning.breakdown.map(b => ({ label: b.label, value: b.value })).concat([
            { label: LANG === 'zh' ? '节省时间合计' : 'Total saved', value: fmtSaved(timeSavedSecs), emphasize: true },
          ]),
          note: LANG === 'zh'
            ? '公式：(成功运行数 × 27 × 75% × 4s) + (实时观测的命中步骤 × 4s)'
            : 'Formula: (passed runs × 27 × 75% × 4s) + (live-observed hits × 4s)',
        }
      },
      { key: 'health', label: t('wb.kpi.health'),   value: health, unit: health != null ? '%' : '', numeric: true, gauge: health, cls: health >= 80 ? 'is-pass' : (health >= 55 ? 'is-warn' : 'is-fail'),
        reason: {
          title: LANG === 'zh' ? '健康指数 — 加权说明' : 'Fleet health — composition',
          intro: LANG === 'zh'
            ? '由三个指标加权而成,反映整体测试基础设施健康度。'
            : 'A composite of three signals, weighted to reflect overall test-fleet health.',
          rows: [
            { label: LANG === 'zh' ? '通过率 (60%)' : 'Pass rate (60%)',         value: Math.round(passWeight) + '%' },
            { label: LANG === 'zh' ? 'Cache 效率 (25%)' : 'Cache efficiency (25%)', value: Math.round(cacheWeight) + '%' },
            { label: LANG === 'zh' ? '近期活跃度 (15%)' : 'Recency (15%)',          value: Math.round(freshWeight) + '%' },
            { label: LANG === 'zh' ? '综合得分' : 'Composite score', value: health + '%', emphasize: true },
          ],
        }
      },
    ];

    // Render number as a row of .kpi-digit cells (one per character). Each
    // cell holds a single character. When the value changes, the digit cell
    // gets a temporary .is-changing class that runs the ticker-tape
    // transition (old char slides up + fades, new char rises from below).
    // Pure characters (signs / dot / "—") are preserved across renders so
    // only actually-changed positions animate.
    function renderTickerNum(container, prevStr, nextStr) {
      const prev = prevStr ?? '';
      const next = String(nextStr ?? '');
      // Pad shorter side with leading spaces so digits line up rightwise.
      const len = Math.max(prev.length, next.length);
      const padPrev = prev.padStart(len, ' ');
      const padNext = next.padStart(len, ' ');
      // First-time render or length changed → rebuild cells.
      if (container.children.length !== len) {
        container.innerHTML = '';
        for (let i = 0; i < len; i++) {
          const d = h('span', { class: 'kpi-digit' },
            h('span', { class: 'kpi-digit-in' }, padNext[i] === ' ' ? ' ' : padNext[i]),
          );
          container.appendChild(d);
        }
        return;
      }
      for (let i = 0; i < len; i++) {
        const cell = container.children[i];
        const oldCh = padPrev[i];
        const newCh = padNext[i];
        if (oldCh === newCh) continue;
        // Build outgoing + incoming layers so they coexist briefly.
        cell.innerHTML = '';
        const out = h('span', { class: 'kpi-digit-out' }, oldCh === ' ' ? ' ' : oldCh);
        const inn = h('span', { class: 'kpi-digit-in'  }, newCh === ' ' ? ' ' : newCh);
        cell.appendChild(out);
        cell.appendChild(inn);
        // After animation completes, drop the outgoing layer so subsequent
        // renders find the digit in steady state.
        setTimeout(() => {
          try {
            cell.innerHTML = '';
            cell.appendChild(h('span', { class: 'kpi-digit-in' }, newCh === ' ' ? ' ' : newCh));
          } catch {}
        }, 460);
      }
    }

    // Build the visualization payload for a cell (ring / histogram /
    // sparkline / mini-bar). Returns a DocumentFragment-equivalent (array
    // of nodes) ready to mount after the .kpi-value row.
    function buildViz(c) {
      const nodes = [];
      if (c.ring != null) nodes.push(radialRing(c.ring, { size: 52 }));
      if (c.gauge != null) {
        const gaugeWrap = h('div', { class: 'kpi-gauge-wrap' },
          radialRing(c.gauge, { size: 52, label: c.gauge + '%' }),
        );
        nodes.push(gaugeWrap);
      }
      if (c.hist) nodes.push(histogram(c.hist));
      if (c.spark && c.spark.length >= 2) nodes.push(sparkline(c.spark, { width: 70, height: 20 }));
      if (c.miniBar) nodes.push(barGauge(c.miniBar.value, c.miniBar.max));
      return nodes;
    }

    // Reuse existing cells across renders to keep ticker-tape transitions
    // smooth — recreating the DOM every poll would reset everything.
    const existing = kpiStrip.querySelectorAll('.kpi-cell');
    const prevDisplay = kpiPrev.__display ?? {};
    if (existing.length !== cells.length) {
      kpiStrip.innerHTML = '';
      cells.forEach((c, idx) => {
        const disp = c.value == null ? '—' : String(c.value);
        const numEl = h('span', { class: 'kpi-num' });
        renderTickerNum(numEl, '', disp);
        // For cells with a radial ring we hide the standalone number — the
        // ring's center label already shows it.
        const showNumberRow = c.ring == null && c.gauge == null;
        const cellEl = h('div', {
          class: 'kpi-cell ' + (c.cls || '') + (c.pulse ? ' is-pulsing' : '') + (c.ring != null || c.gauge != null ? ' has-ring' : '') + (c.reason ? ' is-clickable' : ''),
          dataset: { kpi: c.key },
          style: { animationDelay: (idx * 55) + 'ms' },
          ...(c.reason ? { title: LANG === 'zh' ? '点击查看计算说明' : 'Click for derivation' } : {}),
        },
          h('div', { class: 'kpi-head' },
            h('div', { class: 'kpi-label' }, c.label),
            c.accent ? h('span', { class: 'kpi-accent kpi-accent-' + c.accent }) : null,
            c.reason ? h('span', { class: 'kpi-info-dot' }, 'i') : null,
          ),
          h('div', { class: 'kpi-body' },
            showNumberRow ? h('div', { class: 'kpi-value' }, numEl, c.unit ? h('span', { class: 'kpi-unit' }, c.unit) : null) : null,
            h('div', { class: 'kpi-viz' }, ...buildViz(c)),
          ),
        );
        cellEl.__reason = c.reason || null;
        kpiStrip.appendChild(cellEl);
        prevDisplay[c.key] = disp;
      });
      // Delegated click — opens reasoning modal for any clickable cell.
      // Attached once after the first mount; survives subsequent in-place
      // re-renders since they don't rebuild the strip.
      if (!kpiStrip.__clickWired) {
        kpiStrip.addEventListener('click', (e) => {
          const cell = e.target.closest('.kpi-cell.is-clickable');
          if (cell && cell.__reason) openKpiReasonModal(cell.__reason);
        });
        kpiStrip.__clickWired = true;
      }
      kpiPrev.__display = prevDisplay;
      return;
    }
    cells.forEach((c, i) => {
      const cell = existing[i];
      const numEl = cell.querySelector('.kpi-num');
      const disp = c.value == null ? '—' : String(c.value);
      const prevDisp = prevDisplay[c.key] ?? '';
      if (numEl && prevDisp !== disp) {
        renderTickerNum(numEl, prevDisp, disp);
        prevDisplay[c.key] = disp;
      }
      // Update pulse class for running cell
      cell.classList.toggle('is-pulsing', !!c.pulse);
      // Refresh reason payload so the click handler sees current values.
      cell.__reason = c.reason || null;
      // Refresh viz layer — small SVGs, cheap to rebuild.
      const viz = cell.querySelector('.kpi-viz');
      if (viz) {
        viz.innerHTML = '';
        for (const n of buildViz(c)) viz.appendChild(n);
      }
    });
    kpiPrev.__display = prevDisplay;
  }

  // ── Cases list rendering ──
  function summarizeCase(c) {
    if (c.parseError) return '';
    const bits = [];
    if (c.summary?.transactionCode) bits.push('TX ' + c.summary.transactionCode);
    if (c.summary?.favoritesEntry)  bits.push(c.summary.favoritesEntry);
    return bits.join(' · ');
  }
  function caseModule(c) {
    // Light heuristic — derive a "module" tag from id or transaction code.
    const tx = (c.summary?.transactionCode || '').toUpperCase();
    if (tx.startsWith('AS') || tx.startsWith('AB')) return 'Asset';
    if (tx.startsWith('F'))  return 'Finance';
    if (tx.startsWith('MM') || tx.includes('INVOICE')) return 'MM';
    if (tx.startsWith('S_')) return 'Reports';
    if (/saptest[1-3]/.test(c.id)) return 'Asset';
    if (/saptest[4-6]/.test(c.id)) return 'Finance';
    if (/saptest[78]/.test(c.id))  return 'MM';
    return '—';
  }
  /* Status badge for a case row. Priority:
     1) If active (live run for this caseId in wbState.activeRuns) → show
        live "Running X/N · cache K/M (P%)" pill with a pulse animation.
     2) Otherwise fall back to last-run status (pass / fail / pend).
     Cache hit math: screenshots[].cached can be true / false / null.
     We only count entries where cached !== null in the denominator —
     null means "not a cacheable step" (sleep / aiQuery / etc) so it
     would deflate the % unfairly. */
  function caseStatusBadge(caseId) {
    const active = wbState.activeRuns?.find((a) => a.caseId === caseId);
    if (active) {
      const total = active.totalSteps ?? 0;
      const shots = Array.isArray(active.screenshots) ? active.screenshots : [];
      const doneCount = shots.length;
      const cacheable = shots.filter((s) => s.cached === true || s.cached === false);
      const hits = cacheable.filter((s) => s.cached === true).length;
      const denom = cacheable.length;
      const pct = denom > 0 ? Math.round((hits / denom) * 100) : null;
      const cacheText = denom > 0 ? `  cache ${hits}/${denom}${pct != null ? ' (' + pct + '%)' : ''}` : '';
      return h('span', {
        class: 'tag running',
        title: 'Run in progress · ' + (active.currentStep?.title ?? 'step ' + (active.currentStep?.order ?? '?')),
      }, '▶ ' + doneCount + '/' + total + cacheText);
    }
    const r = lastRunByCase.get(caseId);
    if (!r) return h('span', { class: 'tag pend' }, t('wb.cases.filter.pend'));
    if (r.status === 'passed') return h('span', { class: 'tag pass' }, t('wb.cases.filter.pass'));
    return h('span', { class: 'tag fail' }, t('wb.cases.filter.fail'));
  }
  /* Back-compat shim — renderCasesList still uses lastRunCellTag(r). Route
     it through caseStatusBadge so the running state shows up. */
  function lastRunCellTag(r) {
    if (r && r.caseId) return caseStatusBadge(r.caseId);
    if (!r) return h('span', { class: 'tag pend' }, t('wb.cases.filter.pend'));
    if (r.status === 'passed') return h('span', { class: 'tag pass' }, t('wb.cases.filter.pass'));
    return h('span', { class: 'tag fail' }, t('wb.cases.filter.fail'));
  }
  function matchesCaseFilter(c) {
    if (wbState.caseSearch) {
      const q = wbState.caseSearch.toLowerCase();
      const sumText = (c.summary?.transactionCode || '') + ' ' + (c.summary?.favoritesEntry || '') + ' ' + (c.parsed?.title || '');
      if (!c.id.toLowerCase().includes(q) && !sumText.toLowerCase().includes(q)) return false;
    }
    if (wbState.caseFilter !== 'all') {
      const lr = lastRunByCase.get(c.id);
      if (wbState.caseFilter === 'pass' && lr?.status !== 'passed') return false;
      if (wbState.caseFilter === 'fail' && (!lr || lr.status === 'passed')) return false;
      if (wbState.caseFilter === 'pend' && lr) return false;
    }
    return true;
  }
  // Tracks the last visible-list index a checkbox was toggled on, so Shift+
  // Click can multi-select the range between anchor and clicked row.
  let rangeAnchorIdx = null;
  // Remembers the last-rendered status per case so the cell's status pill can
  // micro-pulse when it changes (e.g. pending → passed after a run finishes).
  const prevStatusByCase = new Map();
  function renderCasesList() {
    casesListEl.innerHTML = '';
    const filtered = cases.filter(matchesCaseFilter);
    casesRegion.querySelector('[data-bind=cases-count]').textContent =
      filtered.length === cases.length ? String(cases.length) : (filtered.length + ' / ' + cases.length);
    if (filtered.length === 0) {
      casesListEl.appendChild(h('div', { class: 'wb-empty' },
        h('div', { class: 'wb-empty-title' }, t('wb.cases.empty')),
      ));
      return;
    }
    filtered.forEach((c, visIdx) => {
      const lr = lastRunByCase.get(c.id);
      const statusKey = lr ? lr.status : 'pend';
      const prev = prevStatusByCase.get(c.id);
      const tag = lastRunCellTag(lr);
      if (prev && prev !== statusKey) tag.classList.add('is-changed');
      prevStatusByCase.set(c.id, statusKey);

      const checked = wbState.selectedIds.has(c.id);
      const cb = h('input', {
        type: 'checkbox',
        ...(checked ? { checked: true } : {}),
        onClick: (e) => {
          e.stopPropagation();
          if (e.shiftKey && rangeAnchorIdx != null) {
            const lo = Math.min(rangeAnchorIdx, visIdx);
            const hi = Math.max(rangeAnchorIdx, visIdx);
            const shouldSelect = e.target.checked; // browser already toggled
            for (let i = lo; i <= hi; i++) {
              const id = filtered[i].id;
              if (shouldSelect) wbState.selectedIds.add(id);
              else              wbState.selectedIds.delete(id);
            }
            renderCasesList();
            return;
          }
          if (e.target.checked) wbState.selectedIds.add(c.id);
          else                  wbState.selectedIds.delete(c.id);
          rangeAnchorIdx = visIdx;
          refreshSelectedFoot();
        },
      });
      // The little "↗" affordance opens the full case detail page directly
      // (skipping the Cases list step). Click-anywhere-else on the row still
      // selects the case in the workbench center column.
      const openLink = h('a', {
        href: '#/cases/' + encodeURIComponent(c.id),
        class: 'wb-case-open',
        title: LANG === 'zh' ? '打开完整用例详情' : 'Open full case detail',
        onClick: (e) => e.stopPropagation(),
      }, '↗');
      const isRunning = wbState.activeRuns?.some((a) => a.caseId === c.id);
      const row = h('li', {
        class: 'wb-case-item'
          + (wbState.selectedCaseId === c.id ? ' is-active' : '')
          + (rangeAnchorIdx === visIdx ? ' is-range-anchor' : '')
          + (isRunning ? ' is-running' : ''),
        dataset: { caseId: c.id, visIdx: String(visIdx) },
        onClick: () => selectCase(c.id),
        // Double-click anywhere on the row opens the full case detail page
        // — natural "drill-in" gesture for power users.
        onDblclick: () => go('cases/' + encodeURIComponent(c.id)),
      },
        cb,
        h('div', { class: 'wb-case-main' },
          h('div', { class: 'wb-case-id' },
            h('span', { class: 'mono' }, c.id),
            h('span', { class: 'tag', style: { fontSize: '10px', padding: '0 5px' } }, caseModule(c)),
            openLink,
          ),
          h('div', { class: 'wb-case-meta' }, summarizeCase(c) || c.parsed?.title || '—'),
        ),
        tag,
      );
      casesListEl.appendChild(row);
    });
    // Keep the selected row in view after re-renders (e.g. J/K navigation).
    const active = casesListEl.querySelector('.wb-case-item.is-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  /* Surgically refresh the status badge for any case row whose state could
   * change between renderCasesList() calls — i.e. anything currently running,
   * or anything that *was* running on the previous tick and just finished.
   * Avoids a full list re-render on each poll (which would lose checkbox
   * focus, scroll position, etc). */
  function updateRunningRowBadges() {
    if (!casesListEl) return;
    const runningIds = new Set((wbState.activeRuns || []).map((a) => a.caseId));
    casesListEl.querySelectorAll('.wb-case-item').forEach((row) => {
      const cid = row.dataset.caseId;
      if (!cid) return;
      const oldTag = row.querySelector(':scope > .tag:last-child');
      if (!oldTag) return;
      const wasRunning = oldTag.classList.contains('running');
      const isRunning = runningIds.has(cid);
      if (!wasRunning && !isRunning) return; // no state change → skip
      // Transition in/out of running → swap the whole element so class+style
      // change cleanly. Still-running → just rewrite text to keep the CSS
      // pulse animation continuous (replacing the node resets the animation).
      if (wasRunning !== isRunning) {
        oldTag.replaceWith(caseStatusBadge(cid));
        row.classList.toggle('is-running', isRunning);
      } else if (isRunning) {
        const newTag = caseStatusBadge(cid);
        if (oldTag.textContent !== newTag.textContent) oldTag.textContent = newTag.textContent;
        const newTitle = newTag.getAttribute('title');
        if (newTitle && oldTag.getAttribute('title') !== newTitle) oldTag.setAttribute('title', newTitle);
      }
    });
  }

  // Move keyboard selection up/down across the currently-filtered list.
  // dir = +1 (next) or -1 (previous). Used by global J/K handler.
  function moveSelection(dir) {
    const filtered = cases.filter(matchesCaseFilter);
    if (!filtered.length) return;
    const curIdx = filtered.findIndex(c => c.id === wbState.selectedCaseId);
    const next = curIdx < 0 ? 0 : (curIdx + dir + filtered.length) % filtered.length;
    selectCase(filtered[next].id);
  }
  function refreshSelectedFoot() {
    const n = wbState.selectedIds.size;
    casesFoot.querySelector('[data-bind=cases-selected]').textContent = t('wb.cases.selected', { n });
    const btn = casesFoot.querySelector('[data-bind=cases-bulk-run]');
    if (btn) btn.disabled = n === 0;
  }

  // ── Detail rendering ──
  async function selectCase(id) {
    if (!id || wbState.selectedCaseId === id) return;
    wbState.selectedCaseId = id;
    renderCasesList(); // updates is-active highlight
    detailBody.innerHTML = '';
    detailBody.appendChild(h('div', { class: 'wb-detail-empty' }, h('div', {}, t('shell.loading'))));
    let detail = wbState.detailCache.get(id);
    if (!detail) {
      try {
        detail = await api.get('/api/cases/' + encodeURIComponent(id));
        wbState.detailCache.set(id, detail);
      } catch (e) {
        detailBody.innerHTML = '';
        detailBody.appendChild(h('div', { class: 'wb-detail-empty' }, h('div', {}, e.message)));
        return;
      }
    }
    renderDetail(detail);
  }

  function renderDetail(detail) {
    detailBody.innerHTML = '';
    const parsed = detail.parsed || {};
    const apiSteps = parsed.apiGuide?.steps || [];

    // Top header — title + sub meta + run controls. The title is a real
    // <a> link to the full case-detail page so users can dive into the
    // comprehensive editor (Parameters / Steps & Run / History tabs) from
    // the workbench without having to bounce through the Cases list.
    const detailHref = '#/cases/' + encodeURIComponent(detail.id);
    detailBody.appendChild(h('div', { class: 'wb-detail-header' },
      h('div', { class: 'wb-detail-title' },
        h('a', {
          href: detailHref,
          class: 'wb-detail-title-link',
          title: LANG === 'zh' ? '打开完整用例详情' : 'Open full case detail',
        },
          h('span', {}, parsed.title || detail.id),
          h('span', { class: 'wb-detail-title-arrow', 'aria-hidden': 'true' }, '↗'),
        ),
        parsed.transactionCode && h('span', { class: 'tag info' }, 'TX ' + parsed.transactionCode),
        parsed.favoritesEntry  && h('span', { class: 'tag' }, parsed.favoritesEntry),
      ),
      h('div', { class: 'wb-detail-meta' },
        h('span', {}, t('detail.summary.id'), ': ',
          h('a', { href: detailHref, class: 'mono wb-id-link', title: LANG === 'zh' ? '打开完整用例详情' : 'Open full case detail' }, detail.id),
          // Inline "rename" pencil button next to the case ID, only when
          // the user has cases:write. Opens a modal that calls
          // PATCH /api/cases/:id/rename and navigates to the new id on
          // success (case + cache + history all renamed server-side).
          canWrite ? h('button', {
            class: 'wb-id-rename',
            title: LANG === 'zh' ? '重命名用例 ID' : 'Rename case ID',
            onClick: () => openRenameModal(detail.id),
          }, '✎') : null,
        ),
        h('span', {}, t('wb.detail.steps'), ': ', h('b', {}, String(apiSteps.length))),
        h('span', {}, t('detail.latest'), ': ',
          lastRunByCase.get(detail.id)
            ? renderRunChip(lastRunByCase.get(detail.id), detail.id)
            : h('span', { class: 'muted' }, t('detail.never')),
        ),
      ),
    ));

    // Actions bar — Run / Cached Replay / [LIVE center, only when running] / Stop / Full editor / History
    const isRunningHere = wbState.activeRuns.some(r => r.caseId === detail.id);
    // The big LIVE button is ONLY shown when there's an active run for this
    // case — it's a "tune in now" CTA, not a permanent control. The cinema
    // route is still reachable for replay via the History tab.
    const liveBigBtn = isRunningHere ? h('button', {
      class: 'btn cinema-btn big is-live',
      dataset: { bind: 'live-btn' },
      title: LANG === 'zh' ? '正在运行 — 跳到直播标签页' : 'Run in progress — jump to live tab',
      // Named target 'saptest-cinema' → the browser reuses any existing
      // tab with that name (just focuses it), instead of spawning a new
      // tab every click. Same caseId & URL means no reload either.
      onClick: () => openCinemaTab(detail.id),
    }, LANG === 'zh' ? '直播' : 'LIVE') : null;

    // Two-way bypass-cache sync between the workbench step list and the
    // openJsRunModal modal. When a checkbox is toggled inside the modal,
    // this callback writes back to wbState.stepBypass AND flips the
    // matching list-mode checkbox + label class so both views stay in
    // step at all times.
    const syncBypassFromModal = (order, checked) => {
      setBypass(detail.id, order, checked);
      const row = document.querySelector(`.wb-step[data-step-order="${order}"]`);
      if (!row) return;
      const cb = row.querySelector('.wb-step-bypass input[type="checkbox"]');
      if (cb && cb.checked !== checked) cb.checked = checked;
      const lbl = row.querySelector('.wb-step-bypass');
      if (lbl) lbl.classList.toggle('is-on', checked);
    };

    const actionsBar = h('div', { class: 'wb-actions-bar' },
      canRun && h('button', {
        class: 'btn run-raw sm', disabled: !apiSteps.length || isRunningHere,
        onClick: () => { triggerIgnition(); openJsRunModal(detail.id, 'write', { initialBypass: bypassSnapshot(detail.id, apiSteps), onBypassChange: syncBypassFromModal }); },
        title: LANG === 'zh' ? 'write-only cache — 重新询问模型并录制新 locator' : 'write-only cache — re-ask the model and record fresh locators',
      }, t('wb.detail.runJs')),
      canRun && h('button', {
        class: 'btn run-cached sm', disabled: !apiSteps.length || isRunningHere,
        onClick: () => { triggerIgnition(); openJsRunModal(detail.id, 'read', { initialBypass: bypassSnapshot(detail.id, apiSteps), onBypassChange: syncBypassFromModal }); },
        title: LANG === 'zh' ? 'read-write cache — 回放已有 locator（更快）' : 'read-write cache — replay existing locators (faster)',
      }, t('wb.detail.runJsCache')),
      // When LIVE is present: center it with spacers on both sides.
      // When LIVE is absent: just one spacer pushing the right cluster to the right.
      h('span', { style: { flex: '1' } }),
      liveBigBtn,
      liveBigBtn ? h('span', { style: { flex: '1' } }) : null,
      canRun && isRunningHere && h('button', {
        class: 'btn danger sm',
        onClick: async () => {
          const mine = wbState.activeRuns.find(r => r.caseId === detail.id);
          if (!mine) return;
          if (!confirm(t('run.confirmStop'))) return;
          try {
            await api.post('/api/midscene-js/runs/' + encodeURIComponent(mine.runId) + '/abort');
            toast(t('run.stopSent'), 'warn');
          } catch (e) { toast(e.message, 'err'); }
        },
      }, t('wb.detail.stop')),
      h('span', { class: 'spacer', style: { flex: '1' } }),
      h('a', { class: 'btn sm ghost', href: '#/cases/' + encodeURIComponent(detail.id) + '/history' }, t('wb.detail.history')),
      h('a', { class: 'btn sm ghost', href: '#/cases/' + encodeURIComponent(detail.id) }, t('wb.detail.openFull')),
      canDelete && h('button', { class: 'btn danger sm', onClick: () => deleteCase(detail.id) }, t('cases.delete')),
    );
    detailBody.appendChild(actionsBar);

    // Test goal / preconditions block (compact, derived from parsed)
    if (parsed.description || parsed.naturalLanguage) {
      detailBody.appendChild(h('div', { style: { padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))', fontSize: '12px', color: 'hsl(var(--muted-foreground))' } },
        parsed.description && h('div', { style: { marginBottom: '4px' } },
          h('strong', { style: { color: 'hsl(var(--foreground))' } }, t('wb.detail.goal'), ': '),
          parsed.description,
        ),
        parsed.sapUrl && h('div', { style: { fontSize: '11px' } },
          h('strong', { style: { color: 'hsl(var(--foreground))' } }, 'URL: '),
          h('span', { class: 'mono' }, parsed.sapUrl),
        ),
      ));
    }

    // ── Inline parameter quick-edit ──
    // Surfaces every aiInput step's locator + current value as a one-row
    // editor strip so the user can tweak the input values (company code,
    // asset number, date, …) right from the workbench without opening the
    // full case editor. Saves via PUT /api/cases/:id (same shape as the
    // full editor's "Auto Parameters" section uses). Non-tcode field
    // changes don't invalidate the Midscene cache; tcode changes do — the
    // step pill flags it with a "⚠ tcode" hint, identical to the full
    // editor's affordance.
    // The current `params` override map for this case (may be empty). Read
    // once so both the inline editor and the step-title substitution below
    // see the same view.
    const overrides = (parsed.params && typeof parsed.params === 'object' && !Array.isArray(parsed.params)) ? parsed.params : {};

    const aiInputSteps = [];
    for (const s of apiSteps) {
      const apiName = String(s.midsceneApi || '').toLowerCase();
      if (!apiName.includes('aiinput')) continue;
      const m = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{\s*value\s*:\s*(['"`])([\s\S]*?)\3\s*\}\s*\)/.exec(s.exampleCode || '');
      if (!m) continue;
      const orderKey = String(s.order);
      aiInputSteps.push({
        order: s.order,
        locator: m[2],
        defaultValue: m[4],
        currentValue: orderKey in overrides ? String(overrides[orderKey] ?? '') : m[4],
        isTCode: /矩形|TC\s*框|T[-\s]?Code|事务码/i.test(m[2]),
      });
    }
    if (aiInputSteps.length && canWrite) {
      const paramInputs = new Map(); // order → input element
      const grid = h('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '6px 10px',
          padding: '8px 14px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--muted) / 0.3)',
        },
      });
      for (const it of aiInputSteps) {
        const displayLocator = it.locator.replace(/左上角矩形/g, 'T Code').replace(/矩形/g, 'T Code');
        const inp = h('input', {
          value: it.currentValue,
          placeholder: it.defaultValue,
          style: { height: '26px', fontSize: '12px', padding: '0 8px' },
        });
        paramInputs.set(it.order, { inp, defaultValue: it.defaultValue });
        grid.appendChild(h('label', {
          style: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '0' },
          title: it.isTCode ? '⚠ 改 T Code 会让 cache 失效' : '',
        },
          h('span', {
            style: {
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: it.isTCode ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))',
              display: 'flex', gap: '4px', alignItems: 'center',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            },
          },
            '#' + it.order + ' · ' + displayLocator,
            // Clickable warning pill — explains why changing T Code makes
            // subsequent steps' cache stale. The full editor's "⚠ tcode ·
            // invalidates cache" badge served as a static hint; here we make
            // it interactive so users can self-serve the rationale.
            it.isTCode ? h('button', {
              class: 'wb-tcode-warn', type: 'button',
              title: LANG === 'zh' ? '点击查看为什么改 T Code 会让 cache 失效' : 'Click to learn why changing T Code invalidates the cache',
              onClick: (e) => { e.preventDefault(); openTCodeExplainer(); },
            }, '⚠ ', LANG === 'zh' ? 'T Code' : 'T Code') : null,
          ),
          inp,
        ));
      }
      const saveBtn = h('button', { class: 'btn primary sm', style: { height: '24px', padding: '0 10px' } },
        LANG === 'zh' ? '保存参数' : 'Save params');
      saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        const next = JSON.parse(JSON.stringify(parsed));
        const nextParams = {};
        for (const [order, { inp, defaultValue }] of paramInputs) {
          const v = inp.value;
          if (v !== '' && v !== defaultValue) nextParams[String(order)] = v;
        }
        if (Object.keys(nextParams).length) next.params = nextParams;
        else if ('params' in next) delete next.params;

        // NL ↔ params 同步 — 借用项目里已存在的 syncNlAndParams：
        // 仅 params 改变时，它会就地把 NL 中对应的旧值替换为新值，
        // 这样保存后 NL 文本里的 "8540" 之类也会变成 "85400"。
        if (parsed?.apiGuide?.steps?.length) {
          try {
            const synced = syncNlAndParams({
              oldNL: parsed.naturalLanguage ?? '',
              newNL: parsed.naturalLanguage ?? '',
              oldParams: overrides,
              newParams: nextParams,
              apiGuide: parsed.apiGuide,
            });
            next.naturalLanguage = synced.nl;
            if (synced.params && Object.keys(synced.params).length) next.params = synced.params;
            else if ('params' in next) delete next.params;
          } catch (e) { console.warn('[wb param save] NL sync failed:', e); }
        }

        try {
          await api.put('/api/cases/' + encodeURIComponent(detail.id), next);
          const fresh = await api.get('/api/cases/' + encodeURIComponent(detail.id));
          wbState.detailCache.set(detail.id, fresh);
          toast(LANG === 'zh' ? '参数已保存' : 'Parameters saved', 'ok');
          // Re-render the detail panel so step titles, NL, and the editor
          // grid all show the freshly-persisted values. We only re-render
          // the center column — KPI strip and cases list aren't affected.
          renderDetail(fresh);
        } catch (e) {
          toast(e.message, 'err');
        } finally {
          saveBtn.disabled = false;
        }
      });
      detailBody.appendChild(h('div', {
        style: {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 14px 0',
          fontSize: '10.5px', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'hsl(var(--muted-foreground))',
        },
      },
        h('span', {},
          LANG === 'zh' ? '参数' : 'Parameters',
          h('span', { style: { marginLeft: '6px', textTransform: 'none', letterSpacing: '0', fontWeight: '400', fontSize: '11px', color: 'hsl(var(--muted-foreground))' } },
            '· ' + aiInputSteps.length + (LANG === 'zh' ? ' 项 aiInput' : ' aiInput field' + (aiInputSteps.length === 1 ? '' : 's'))),
        ),
        saveBtn,
      ));
      detailBody.appendChild(grid);
    }

    // ── Steps pipeline ──
    if (!apiSteps.length) {
      detailBody.appendChild(h('div', { class: 'wb-empty' },
        h('div', { class: 'wb-empty-title' }, '—'),
        h('div', { class: 'wb-empty-sub' }, 'This case has no apiGuide steps yet.'),
      ));
      return;
    }
    // Render the step's display title, substituting the current param
    // override (if any) for the literal default value baked into the title
    // string at apiGuide-generation time. Without this, a step like
    //   "在 company code 字段 输入 8540"
    // would keep showing "8540" even after the user saves params[8]="85400".
    //
    // Subtlety: apiGuide.steps[].title is often *truncated* by the LLM
    // (e.g. "在 Report date 字段 输入 30.04.20..." instead of the full
    // "30.04.2026"), so a naive split-on-defaultValue against `.title`
    // would silently fail to substitute. We therefore probe both `.title`
    // and `.naturalLanguageInstruction` and prefer whichever actually
    // contains the default value substring.
    function stepTitleFor(s) {
      const title = s.title || '';
      const nli   = s.naturalLanguageInstruction || '';
      const fallback = title || nli || displayApiFromStep(s) || '';
      const orderKey = String(s.order);
      if (!(orderKey in overrides)) return fallback;
      const overrideVal = String(overrides[orderKey] ?? '');
      const m = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{\s*value\s*:\s*(['"`])([\s\S]*?)\3\s*\}\s*\)/.exec(s.exampleCode || '');
      const defaultVal = m ? m[4] : '';
      if (!defaultVal || defaultVal === overrideVal) return fallback;
      // Prefer whichever string actually contains the default value, so the
      // substitute lands correctly. Title first (it's the canonical display
      // string), then NLI as a fallback for the truncated-title case.
      if (title.includes(defaultVal)) return title.split(defaultVal).join(overrideVal);
      if (nli.includes(defaultVal))   return nli.split(defaultVal).join(overrideVal);
      // Neither contains the default value — title was truncated AND NLI
      // doesn't help. Last resort: keep the (truncated) title and append
      // the override hint so the user still sees the new value.
      return (title || nli) + (overrideVal ? ' → ' + overrideVal : '');
    }

    // ── View toggle (list / flow) ──
    // Renders into the actions-bar that was already appended above.
    const viewToggle = h('div', { class: 'view-toggle', style: { marginLeft: '10px' } },
      h('button', {
        class: wbState.viewMode === 'list' ? 'is-active' : '',
        onClick: () => { wbState.viewMode = 'list'; try { localStorage.setItem('wb.viewMode', 'list'); } catch {} renderDetail(detail); },
      }, '≡ list'),
      h('button', {
        class: wbState.viewMode === 'flow' ? 'is-active' : '',
        onClick: () => { wbState.viewMode = 'flow'; try { localStorage.setItem('wb.viewMode', 'flow'); } catch {} renderDetail(detail); },
      }, '▣ flow'),
    );
    actionsBar.appendChild(viewToggle);

    // Pick the renderer.
    if (wbState.viewMode === 'flow') {
      detailBody.appendChild(renderFlowSteps(detail, apiSteps, stepTitleFor));
    } else {
      detailBody.appendChild(renderListSteps(detail, apiSteps, stepTitleFor));
    }
  }

  // ── List-mode step pipeline (the original dense vertical list) ──
  function renderListSteps(detail, apiSteps, stepTitleFor) {
    const stepsList = h('ol', { class: 'wb-steps', dataset: { bind: 'wb-steps' } });
    apiSteps.forEach((s, i) => {
      const order = s.order ?? i + 1;
      const dragDefault = wbIsDragLikeStep(s);
      const checked = getBypass(detail.id, s);
      const cb = h('input', {
        type: 'checkbox',
        ...(checked ? { checked: true } : {}),
        onClick: (e) => e.stopPropagation(),
        onChange: (e) => {
          setBypass(detail.id, order, e.target.checked);
          const lbl = e.target.closest('.wb-step-bypass');
          if (lbl) lbl.classList.toggle('is-on', e.target.checked);
        },
      });
      const bypassLabel = h('label', {
        class: 'wb-step-bypass'
          + (checked ? ' is-on' : '')
          + (dragDefault ? ' is-drag-default' : ''),
        title: dragDefault
          ? (LANG === 'zh'
              ? '拖动/滚动步骤默认绕过缓存（cache 在这里很脆，prompt 必须精确匹配才命中）。取消勾选可强制用 cache。'
              : 'Drag/scroll step — defaults to bypass (cache is fragile here; exact-prompt match required to hit). Uncheck to use cache anyway.')
          : (LANG === 'zh'
              ? '勾选 = 这一步即使开了 cache 也强制重新走模型；其它步骤仍命中 cache。'
              : 'Checked = strip this step\'s cache entry before run, so it re-LLMs even though cache is enabled.'),
      },
        cb,
        h('span', {}, LANG === 'zh' ? '绕过缓存' : 'bypass cache'),
      );
      stepsList.appendChild(h('li', {
        class: 'wb-step is-pending',
        dataset: { stepOrder: String(order) },
        style: { '--i': String(i) },
      },
        h('div', { class: 'wb-step-num' }, '#' + order),
        h('div', { class: 'wb-step-indicator' }),
        h('div', { class: 'wb-step-title' }, stepTitleFor(s)),
        h('div', { class: 'wb-step-time' }, ''),
        bypassLabel,
      ));
    });
    return stepsList;
  }

  // ── Flow-mode step pipeline ──
  // Each step is a card with an SAP-screenshot thumbnail. Active edges flow
  // a comet, completed edges go solid green. Per-card screenshot images are
  // populated from /api/midscene-js/runs/:runId/screenshot/:order — populated
  // both for in-flight runs (via the active-runs poll) and for the latest
  // finished run (looked up on detail render).
  function renderFlowSteps(detail, apiSteps, stepTitleFor) {
    const canvas = h('div', { class: 'flow-canvas', dataset: { bind: 'wb-steps', flowFor: detail.id } });
    const edgeLayer = h('div', { class: 'flow-edge-layer' });
    edgeLayer.innerHTML = '<svg viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg>';
    const grid = h('div', { class: 'flow-grid' });
    canvas.append(edgeLayer, grid);

    // Cache hit/miss/fail counter chips (LIVE button moved to actions bar center).
    const stats = h('div', {
      class: 'flow-stats', dataset: { bind: 'flow-stats' },
      style: { marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' },
    },
      h('span', { class: 'flow-stat-chip cache', title: 'Cache hits' },      '⚡ ', h('span', { dataset: { bind: 'fs-cache' } }, '0')),
      h('span', { class: 'flow-stat-chip llm',   title: 'LLM calls (miss)' }, 'AI ', h('span', { dataset: { bind: 'fs-llm'   } }, '0')),
      h('span', { class: 'flow-stat-chip fail',  title: 'Failed steps' },      '✕ ', h('span', { dataset: { bind: 'fs-fail'  } }, '0')),
    );

    apiSteps.forEach((s, i) => {
      const order = s.order ?? i + 1;
      const card = h('div', {
        class: 'flow-card',
        dataset: { stepOrder: String(order) },
        style: { '--i': String(i) },
      });
      const thumb = h('div', { class: 'flow-thumb is-empty', dataset: { bind: 'thumb' } },
        h('div', { class: 'thumb-zoom' }, '↗'),
      );
      const apiName = String(s.midsceneApi || '').replace(/^agent\./, '').replace(/\(\)$/, '');
      card.append(
        thumb,
        h('div', { class: 'flow-body' },
          h('div', { class: 'flow-row1' },
            h('span', { class: 'flow-status' }),
            h('span', { class: 'flow-num' }, '#' + order),
          ),
          h('div', { class: 'flow-title' }, stepTitleFor(s)),
          h('div', { class: 'flow-row2' },
            h('span', { class: 'flow-badge api' }, apiName || s.midsceneApi || '?'),
            h('span', { class: 'flow-badge', dataset: { bind: 'cache-badge' }, style: { display: 'none' } }),
            h('span', { class: 'flow-dur', dataset: { bind: 'dur' } }, ''),
          ),
        ),
      );
      // Clicking a card opens the zoom viewer when a thumb is loaded
      card.addEventListener('click', () => {
        const img = thumb.querySelector('img');
        if (!img) return;
        openFlowZoom(img.src, detail.id, order, stepTitleFor(s));
      });
      grid.appendChild(card);
    });

    // After mount, draw edges + hydrate. Priority:
    //   1. If there's an active run for this case in wbState, repaint from
    //      its in-memory screenshot map (survives view-toggle re-renders).
    //   2. Otherwise look up the latest finished run's screenshots on disk.
    setTimeout(() => {
      drawFlowEdges(canvas);
      const activeForCase = wbState.activeRuns.find(r => r.caseId === detail.id);
      if (activeForCase) hydrateFlowFromActiveRun(activeForCase.runId, canvas);
      else hydrateFlowFromHistory(detail.id, canvas);
    }, 0);

    return h('div', {}, stats, canvas);
  }

  // Draw bezier connectors between consecutive cards. Same-row neighbors get
  // a smooth S-curve; row-wrap neighbors get a U-curve that goes right past
  // the canvas edge, down, and back left into the next row's first card.
  function drawFlowEdges(canvas) {
    const grid = canvas.querySelector('.flow-grid');
    const svg = canvas.querySelector('.flow-edge-layer svg');
    if (!grid || !svg) return;
    const cRect = canvas.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${cRect.width} ${cRect.height}`);
    svg.innerHTML = '';
    const cards = Array.from(grid.querySelectorAll('.flow-card'));
    for (let i = 0; i < cards.length - 1; i++) {
      const a = cards[i].getBoundingClientRect();
      const b = cards[i + 1].getBoundingClientRect();
      const ax = a.right - cRect.left;
      const ay = a.top + a.height / 2 - cRect.top;
      const bx = b.left - cRect.left;
      const by = b.top + b.height / 2 - cRect.top;
      const sameRow = Math.abs(ay - by) < 5;
      let path;
      if (sameRow) {
        const midX = (ax + bx) / 2;
        path = `M${ax},${ay} C${midX},${ay} ${midX},${by} ${bx},${by}`;
      } else {
        const dropY = (ay + by) / 2;
        path = `M${ax},${ay} C${ax + 30},${ay} ${cRect.width - 6},${ay} ${cRect.width - 6},${dropY} S${bx - 30},${by} ${bx},${by}`;
      }
      const isDone = cards[i].classList.contains('is-passed') || cards[i].classList.contains('is-failed');
      const isActive = cards[i + 1].classList.contains('is-running');
      const cls = `edge-line ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`;
      svg.insertAdjacentHTML('beforeend', `<path class="${cls}" d="${path}"/>`);
    }
    // Comet at active edge
    const running = cards.find(c => c.classList.contains('is-running'));
    if (running) {
      const r = running.getBoundingClientRect();
      const cx = r.left - cRect.left;
      const cy = r.top + r.height / 2 - cRect.top;
      svg.insertAdjacentHTML('beforeend',
        `<circle class="edge-comet" cx="${cx}" cy="${cy}" r="4"><animate attributeName="r" values="3;6;3" dur="1.1s" repeatCount="indefinite"/></circle>`);
    }
  }

  // Recompute flow stats chip numbers from the cards' classes.
  function refreshFlowStats(canvas) {
    if (!canvas) return;
    const root = canvas.closest('div')?.parentNode;
    if (!root) return;
    const statsRoot = root.querySelector('[data-bind=flow-stats]');
    if (!statsRoot) return;
    let cache = 0, llm = 0, fail = 0;
    canvas.querySelectorAll('.flow-card').forEach(c => {
      if (c.classList.contains('with-cache')) cache++;
      if (c.classList.contains('is-llm-miss')) llm++;
      if (c.classList.contains('is-failed')) fail++;
    });
    statsRoot.querySelector('[data-bind=fs-cache]').textContent = String(cache);
    statsRoot.querySelector('[data-bind=fs-llm]').textContent   = String(llm);
    statsRoot.querySelector('[data-bind=fs-fail]').textContent  = String(fail);
  }

  // Apply a single screenshot to a flow card — swap the thumb to <img>,
  // flip status classes, and update the cache hit/miss badge. Idempotent:
  // re-calling with the same data is a no-op.
  function applyCardScreenshot(card, runId, order, meta) {
    if (!card || !meta) return;
    const thumb = card.querySelector('[data-bind=thumb]');
    if (thumb && !thumb.querySelector('img')) {
      thumb.classList.remove('is-empty');
      thumb.innerHTML = '';
      thumb.appendChild(h('img', {
        src: `/api/midscene-js/runs/${encodeURIComponent(runId)}/screenshot/${order}`,
        alt: 'step ' + order, loading: 'lazy',
      }));
      thumb.appendChild(h('div', { class: 'thumb-zoom' }, '↗'));
    }
    card.classList.remove('is-pending', 'is-running', 'is-focused');
    card.classList.add(meta.status === 'failed' ? 'is-failed' : 'is-passed');
    if (meta.cached === true)  { card.classList.add('with-cache'); card.classList.remove('is-llm-miss'); }
    if (meta.cached === false) { card.classList.add('is-llm-miss'); card.classList.remove('with-cache'); }
    const cacheBadge = card.querySelector('[data-bind=cache-badge]');
    if (cacheBadge) {
      if (meta.cached === true)  { cacheBadge.className = 'flow-badge cache'; cacheBadge.textContent = '⚡ cached'; cacheBadge.style.display = ''; }
      else if (meta.cached === false) { cacheBadge.className = 'flow-badge llm'; cacheBadge.textContent = 'AI llm'; cacheBadge.style.display = ''; }
    }
  }

  // Re-paint flow cards from the in-memory runScreenshots map. Used both by
  // the poll path (push updates) and the re-mount path (rebuild after view
  // toggle). The runId is found by matching against wbState.activeRuns +
  // runScreenshotsByRun for the current case.
  function hydrateFlowFromActiveRun(runId, canvas) {
    if (!canvas) return;
    const map = runScreenshotsByRun.get(runId);
    if (!map) return;
    for (const [order, meta] of map) {
      const card = canvas.querySelector(`.flow-card[data-step-order="${order}"]`);
      if (card) applyCardScreenshot(card, runId, order, meta);
    }
    drawFlowEdges(canvas);
    refreshFlowStats(canvas);
  }

  // Look up the latest finished run for this case and, if it has screenshots
  // on disk, hydrate the flow cards with them so re-opening a case shows the
  // last run's "film strip" without needing to re-run.
  async function hydrateFlowFromHistory(caseId, canvas) {
    if (!canvas) return;
    try {
      const r = await api.get('/api/cases/' + encodeURIComponent(caseId) + '/runs').catch(() => null);
      const latest = r?.runs?.[0];
      if (!latest?.runId) return;
      const ss = await api.get('/api/midscene-js/runs/' + encodeURIComponent(latest.runId) + '/screenshots').catch(() => null);
      if (!ss?.screenshots?.length) return;
      // Mark all steps that have a screenshot as passed (best-effort proxy
      // — the latest run record only carries overall status, not per-step).
      for (const sh of ss.screenshots) {
        const card = canvas.querySelector(`.flow-card[data-step-order="${sh.order}"]`);
        if (!card) continue;
        if (latest.status === 'failed' && sh.order === ss.screenshots[ss.screenshots.length - 1].order) {
          card.classList.add('is-failed');
        } else {
          card.classList.add('is-passed');
        }
        // Swap thumb to <img>
        const thumb = card.querySelector('[data-bind=thumb]');
        if (thumb && !thumb.querySelector('img')) {
          thumb.classList.remove('is-empty');
          thumb.querySelector('::after'); // dummy
          thumb.innerHTML = '';
          thumb.appendChild(h('img', { src: sh.url, alt: 'step ' + sh.order, loading: 'lazy' }));
          thumb.appendChild(h('div', { class: 'thumb-zoom' }, '↗'));
        }
      }
      drawFlowEdges(canvas);
      refreshFlowStats(canvas);
    } catch { /* best-effort */ }
  }

  // Open a full-size viewer for a step's screenshot. Esc / backdrop click
  // closes it.
  function openFlowZoom(url, caseId, order, title) {
    const back = h('div', { class: 'flow-zoom-back' });
    const card = h('div', { class: 'flow-zoom-card' },
      h('img', { src: url, alt: 'step ' + order }),
      h('div', { class: 'flow-zoom-meta' },
        h('strong', {}, '#' + order + ' · ' + (title || caseId)),
        h('span', { class: 'spacer', style: { flex: '1' } }),
        h('button', { class: 'btn sm', onClick: () => close() }, 'Close (Esc)'),
      ),
    );
    back.appendChild(card);
    function close() { back.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
  }


  // ── Live log ──
  /* Stable per-case color for the inline caseId chip. Cheap hash → HSL hue,
   * fixed saturation/lightness so chips read consistently in light theme. */
  function caseColor(caseId) {
    if (!caseId) return null;
    let h = 0;
    for (let i = 0; i < caseId.length; i++) h = ((h << 5) - h + caseId.charCodeAt(i)) | 0;
    const hue = Math.abs(h) % 360;
    return { bg: `hsl(${hue} 80% 92%)`, fg: `hsl(${hue} 60% 30%)`, border: `hsl(${hue} 70% 70%)` };
  }
  function pushLog(entry) {
    wbState.logs.push(entry);
    if (wbState.logs.length > 500) wbState.logs.shift();
    appendLogEntry(entry);
    if (entry.caseId) refreshLogCaseFilterOptions();
  }
  function classifyLog(line) {
    if (!line) return 'info';
    const s = String(line);
    if (/error|fail|✗|exception/i.test(s)) return 'err';
    if (/warn|⚠|warning/i.test(s)) return 'warn';
    if (/✓|pass|success|saved|created|deleted/i.test(s)) return 'ok';
    return 'info';
  }
  function appendLogEntry(entry, opts = {}) {
    const kind = entry.stream === 'stderr' ? 'err' : classifyLog(entry.line);
    if (wbState.logFilter !== 'all' && wbState.logFilter !== kind) return;
    if (wbState.logCaseFilter !== 'all' && entry.caseId !== wbState.logCaseFilter) return;
    const empty = logsBody.querySelector('.wb-log-empty');
    if (empty) empty.remove();
    const ts = new Date(entry.ts || Date.now()).toLocaleTimeString(LANG === 'zh' ? 'zh-CN' : 'en-US', { hour12: false });
    const glyph = kind === 'err' ? '✗' : kind === 'warn' ? '⚠' : kind === 'ok' ? '✓' : '·';
    const flashCls = opts.flash === false ? '' : ' is-new';
    /* Per-case chip — clicking it filters the log to just that case (the
     * fastest way to focus on one of N parallel runs). Hash-based color
     * makes consecutive lines from the same case visually group together. */
    const caseChip = entry.caseId ? (() => {
      const c = caseColor(entry.caseId);
      const short = entry.caseId.replace(/^saptest-js-/, '').replace(/^saptest1-/, '');
      return h('span', {
        class: 'wb-log-case-chip',
        style: { background: c.bg, color: c.fg, borderColor: c.border },
        title: 'Filter log to ' + entry.caseId,
        onClick: (ev) => {
          ev.stopPropagation();
          wbState.logCaseFilter = entry.caseId;
          const sel = logsRegion.querySelector('[data-bind=logs-case-filter]');
          if (sel) sel.value = entry.caseId;
          rerenderLogs();
        },
      }, short);
    })() : null;
    const row = h('div', { class: 'wb-log-entry kind-' + kind + flashCls },
      h('span', { class: 'wb-log-ts' }, ts),
      h('span', { class: 'wb-log-glyph' }, glyph),
      h('span', { class: 'wb-log-msg' },
        caseChip,
        entry.line || '',
      ),
    );
    logsBody.appendChild(row);
    if (flashCls) setTimeout(() => row.classList.remove('is-new'), 600);
    const nearBottom = logsBody.scrollHeight - logsBody.clientHeight - logsBody.scrollTop < 80;
    if (nearBottom) logsBody.scrollTop = logsBody.scrollHeight;
  }
  function rerenderLogs() {
    logsBody.innerHTML = '';
    if (!wbState.logs.length) {
      logsBody.appendChild(h('div', { class: 'wb-log-empty' }, t('wb.logs.empty')));
      return;
    }
    for (const e of wbState.logs) appendLogEntry(e, { flash: false });
  }
  /* Keep the case-filter dropdown's options in sync with whichever caseIds
   * we've actually seen in the log buffer this session. Cheap (rebuilds only
   * when the set changes). Preserves the currently-selected value. */
  let lastLogCaseFilterKey = '';
  function refreshLogCaseFilterOptions() {
    const sel = logsRegion.querySelector('[data-bind=logs-case-filter]');
    if (!sel) return;
    const seen = new Set();
    for (const e of wbState.logs) if (e.caseId) seen.add(e.caseId);
    const sorted = [...seen].sort();
    const key = sorted.join('|');
    if (key === lastLogCaseFilterKey) return;
    lastLogCaseFilterKey = key;
    const prev = sel.value;
    sel.innerHTML = '';
    sel.appendChild(h('option', { value: 'all' }, LANG === 'zh' ? '全部用例' : 'All cases'));
    for (const cid of sorted) {
      sel.appendChild(h('option', { value: cid }, cid.replace(/^saptest-js-/, '').replace(/^saptest1-/, '')));
    }
    /* Restore the previously-selected case if it's still in the list,
     * otherwise fall back to "all". */
    sel.value = seen.has(prev) ? prev : 'all';
    if (wbState.logCaseFilter !== sel.value) {
      wbState.logCaseFilter = sel.value;
      rerenderLogs();
    }
  }
  function setLogStatus(s) {
    const sub = logsRegion.querySelector('[data-bind=logs-status]');
    if (!sub) return;
    if (!s) { sub.textContent = t('run.status.idle'); return; }
    if (s.running) {
      sub.innerHTML = '';
      sub.append(h('span', { class: 'tag run' }, t('run.status.running').replace('…', '').trim() || 'RUN'));
      /* Aggregated cache-hit across every currently-running case — sum of
       * each run's shots[].cached (true = hit, false = miss; null skipped).
       * Updates each poll tick so the user sees the number tick up live. */
      let hits = 0, denom = 0, runs = 0;
      for (const a of (wbState.activeRuns || [])) {
        runs++;
        for (const sh of (a.screenshots || [])) {
          if (sh.cached === true)  { hits++; denom++; }
          else if (sh.cached === false) { denom++; }
        }
      }
      if (runs > 0) {
        const pct = denom > 0 ? Math.round((hits / denom) * 100) : null;
        const label = (runs > 1 ? (runs + ' running · ') : '')
          + (denom > 0 ? `cache ${hits}/${denom}${pct != null ? ' (' + pct + '%)' : ''}` : 'cache 0/0');
        sub.append(' ', h('span', { class: 'wb-log-agg-cache', title: 'Aggregated cache hits across all running cases' }, label));
      }
    } else {
      sub.textContent = s.exitCode === 0 ? t('run.status.passed') : (s.exitCode != null ? t('run.status.failed', { code: s.exitCode }) : t('run.status.idle'));
    }
  }

  // Auto-scroll the currently-running step into view inside the detail body
  // — but ONLY if the user is near the bottom or has not scrolled manually
  // recently. Anchored to detailBody so it works for both Playwright and
  // Midscene JS step pipelines.
  let lastUserStepScroll = 0;
  detailBody.addEventListener('wheel', () => { lastUserStepScroll = Date.now(); }, { passive: true });
  function scrollStepIntoView(node) {
    if (!node) return;
    // Don't yank the user if they've been scrolling in the last 1.5s.
    if (Date.now() - lastUserStepScroll < 1500) return;
    try { node.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch {}
  }

  // Update the energy-rail's --rail-progress (fill %) and --rail-cursor
  // (comet Y in pixels) based on the index of the currently-running step
  // inside the pipeline. Called any time the runner moves to a new step.
  function updateRailFromActive() {
    const stepsRoot = detailBody.querySelector('[data-bind=wb-steps]');
    if (!stepsRoot) return;
    const steps = Array.from(stepsRoot.querySelectorAll('.wb-step'));
    if (!steps.length) return;
    const total = steps.length;
    const running = steps.findIndex(el => el.classList.contains('is-running'));
    const completed = steps.filter(el => el.classList.contains('is-passed') || el.classList.contains('is-failed')).length;
    const pct = Math.round((completed / total) * 100);
    stepsRoot.style.setProperty('--rail-progress', pct + '%');
    // Cursor position: align with the running step's vertical center, else
    // park at the last completed step.
    const cursorEl = steps[running] || steps[Math.min(total - 1, completed)];
    if (cursorEl) {
      const rect = cursorEl.getBoundingClientRect();
      const parentRect = stepsRoot.getBoundingClientRect();
      const top = rect.top - parentRect.top + rect.height / 2 - 12; // subtract top:12 padding
      stepsRoot.style.setProperty('--rail-cursor', String(Math.max(0, top)));
    }
    // Show / hide the rail glow based on whether anything is in flight.
    if (running >= 0 || (completed > 0 && completed < total)) {
      stepsRoot.classList.add('is-active');
    } else {
      stepsRoot.classList.remove('is-active');
    }
  }

  // Stamp helper — kicks off the .just-stamped animation on a step indicator
  // when it transitions to pass/fail. Auto-removes the class so the same
  // step can be re-stamped if the user re-runs.
  function stampStep(node) {
    if (!node) return;
    node.classList.remove('just-stamped');
    // Force a reflow so the next class addition restarts the animation.
    void node.offsetWidth;
    node.classList.add('just-stamped');
    setTimeout(() => { try { node.classList.remove('just-stamped'); } catch {} }, 720);
  }

  // Ignition wave — when the user clicks Run, sweep a vertical wave of
  // light down the step pipeline before the modal takes over. Pure visual
  // priming so the workbench feels like a system booting up. Total length
  // staggered by the steps' --i CSS var, capped well below the run-start
  // round-trip so the wave never lags behind real status updates.
  function triggerIgnition() {
    const stepsRoot = detailBody.querySelector('[data-bind=wb-steps]');
    if (!stepsRoot) return;
    stepsRoot.classList.remove('is-igniting');
    void stepsRoot.offsetWidth;
    stepsRoot.classList.add('is-igniting');
    setTimeout(() => { try { stepsRoot.classList.remove('is-igniting'); } catch {} }, 1200);
  }

  // ── Apply runner events to the step pipeline in the center column ──
  function applyStepEvent(evt) {
    const stepsRoot = detailBody.querySelector('[data-bind=wb-steps]');
    if (!stepsRoot) return;
    if (evt.type === 'session' && evt.phase === 'begin') {
      stepsRoot.querySelectorAll('.wb-step').forEach(el => {
        el.classList.remove('is-running', 'is-passed', 'is-failed', 'is-focused', 'just-stamped');
        el.classList.add('is-pending');
        const t = el.querySelector('.wb-step-time'); if (t) t.textContent = '';
      });
      updateRailFromActive();
      return;
    }
    if (evt.type !== 'step') return;
    let node = null;
    if (evt.stepOrder != null) {
      node = stepsRoot.querySelector(`.wb-step[data-step-order="${evt.stepOrder}"]`);
    } else if (evt.line != null) {
      const all = stepsRoot.querySelectorAll('.wb-step');
      if (all[evt.line]) node = all[evt.line];
    }
    if (!node) return;
    if (evt.phase === 'begin') {
      node.classList.remove('is-pending', 'is-passed', 'is-failed');
      node.classList.add('is-running', 'is-focused');
      scrollStepIntoView(node);
      updateRailFromActive();
    } else if (evt.phase === 'end') {
      node.classList.remove('is-pending', 'is-running', 'is-focused');
      node.classList.add(evt.status === 'passed' ? 'is-passed' : 'is-failed');
      const t = node.querySelector('.wb-step-time');
      if (t && evt.durationMs != null) t.textContent = fmtMs(evt.durationMs);
      stampStep(node);
      updateRailFromActive();
    }
  }

  // ── Results table (bottom) ──
  function statusTag(status) {
    if (status === 'passed')  return h('span', { class: 'tag pass' }, 'PASS');
    if (status === 'failed')  return h('span', { class: 'tag fail' }, 'FAIL');
    if (status === 'running') return h('span', { class: 'tag run' },  'RUN');
    return h('span', { class: 'tag pend' }, 'PEND');
  }
  function renderResults() {
    const body = resultsRegion.querySelector('[data-bind=results-body]');
    const count = resultsRegion.querySelector('[data-bind=results-count]');
    body.innerHTML = '';
    const q = wbState.resultsSearch.trim().toLowerCase();
    const f = wbState.resultsFilter;
    const rows = allRuns
      .filter(r => {
        if (q && !(r.caseId || '').toLowerCase().includes(q)) return false;
        if (f !== 'all' && r.status !== (f === 'pass' ? 'passed' : 'failed')) return false;
        return true;
      })
      .slice(0, 100);
    count.textContent = rows.length + ' / ' + allRuns.length;
    if (rows.length === 0) {
      body.appendChild(h('div', { class: 'wb-empty' },
        h('div', { class: 'wb-empty-title' }, t('wb.results.empty')),
      ));
      return;
    }
    const table = h('table', { class: 'tbl' });
    table.appendChild(h('thead', {}, h('tr', {},
      h('th', {}, t('wb.results.col.case')),
      h('th', {}, t('wb.results.col.module')),
      h('th', {}, t('wb.results.col.status')),
      h('th', {}, t('wb.results.col.start')),
      h('th', {}, t('wb.results.col.end')),
      h('th', {}, t('wb.results.col.duration')),
      h('th', {}, t('wb.results.col.progress')),
      h('th', {}, t('wb.results.col.retries')),
      h('th', {}, t('wb.results.col.error')),
      h('th', { class: 'actions' }, t('wb.results.col.actions')),
    )));
    const tbody = h('tbody', {});
    for (const r of rows) {
      const caseRef = cases.find(c => c.id === r.caseId) || { id: r.caseId };
      const mod = caseModule(caseRef);
      const errSummary = r.errorMessage
        ? r.errorMessage.split('\n')[0].slice(0, 80)
        : (r.status === 'failed' ? '(no message)' : '');
      const startedAt = r.startedAt ? new Date(r.startedAt) : null;
      const finishedAt = r.finishedAt ? new Date(r.finishedAt) : null;
      tbody.appendChild(h('tr', {},
        h('td', { class: 'mono' }, r.caseId || '—'),
        h('td', {}, mod),
        h('td', {}, statusTag(r.status)),
        h('td', { class: 'mono', style: { fontSize: '11px' } }, startedAt ? startedAt.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US') : '—'),
        h('td', { class: 'mono', style: { fontSize: '11px' } }, finishedAt ? finishedAt.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US') : '—'),
        h('td', { class: 'mono' }, fmtMs(r.durationMs) || '—'),
        h('td', {},
          h('div', { class: 'wb-progress ' + (r.status === 'passed' ? 'is-pass' : r.status === 'failed' ? 'is-fail' : '') },
            h('span', { style: { width: '100%' } }),
          ),
        ),
        h('td', { class: 'mono' }, String(r.retries ?? 0)),
        h('td', { style: { maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: r.errorMessage || '' }, errSummary || '—'),
        h('td', { class: 'actions' },
          r.report?.url && h('a', {
            class: 'btn sm ghost', href: reportPreviewUrl(r.report.url), target: '_blank',
          }, t('wb.results.viewLog')),
          ' ',
          canRun && h('button', {
            class: 'btn sm',
            onClick: () => openJsRunModal(r.caseId, r.useCache ? 'read' : 'write'),
          }, t('wb.results.rerun')),
        ),
      ));
    }
    table.appendChild(tbody);
    body.appendChild(table);
  }

  function exportResultsCsv() {
    const rows = [['caseId', 'module', 'status', 'startedAt', 'finishedAt', 'durationMs', 'retries', 'error']];
    for (const r of allRuns) {
      const caseRef = cases.find(c => c.id === r.caseId) || { id: r.caseId };
      rows.push([
        r.caseId || '',
        caseModule(caseRef),
        r.status || '',
        r.startedAt || '',
        r.finishedAt || '',
        r.durationMs ?? '',
        r.retries ?? 0,
        (r.errorMessage || '').replace(/"/g, '""').replace(/\n/g, ' '),
      ]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'saptest-results-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  async function wbBulkRun() {
    const ids = [...wbState.selectedIds];
    if (!ids.length) return;
    if (!confirm(
      '并行执行 ' + ids.length + ' 个用例？\n' +
      '\n' +
      '每个用例会自己起一个 Chromium 窗口同时跑。\n' +
      '注意：所有用例使用同一个 SAP 账号，可能因为 session 冲突而互相踢出。' +
      '资源占用也会显著上升（每个浏览器约 500MB 内存）。'
    )) return;

    /* Floating live-status panel. Pin top-right, lists each case with a
       pending/running/passed/failed pill that updates as Promises resolve. */
    const panel = h('div', {
      style: {
        position: 'fixed', top: '70px', right: '20px', zIndex: '9999',
        background: 'var(--surface, white)', border: '1px solid var(--border, #e2e8f0)',
        borderRadius: '12px', padding: '12px 16px',
        boxShadow: '0 12px 28px rgba(15,23,42,0.12)', minWidth: '300px', maxWidth: '420px',
        fontFamily: 'inherit', fontSize: '13px',
      },
    });
    const title = h('div', { style: { fontWeight: '600', marginBottom: '8px' } },
      'Parallel run · 0/' + ids.length + ' done');
    const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } });
    const rowByCaseId = new Map();
    for (const id of ids) {
      const pill = h('span', {
        style: {
          padding: '1px 8px', borderRadius: '999px', fontSize: '11px',
          background: '#e2e8f0', color: '#475569', fontFamily: 'inherit',
        },
      }, 'pending');
      const row = h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } },
        h('span', { class: 'mono', style: { fontSize: '12px' } }, id),
        pill,
      );
      list.appendChild(row);
      rowByCaseId.set(id, { pill });
    }
    panel.appendChild(title);
    panel.appendChild(list);
    document.body.appendChild(panel);

    const setPill = (id, label, bg, color) => {
      const r = rowByCaseId.get(id);
      if (!r) return;
      r.pill.textContent = label;
      r.pill.style.background = bg;
      r.pill.style.color = color;
    };
    /* Mark all as "starting" then immediately fire POSTs. */
    for (const id of ids) setPill(id, 'starting', '#fef3c7', '#92400e');

    let doneCount = 0;
    const updateTitle = () => { title.textContent = 'Parallel run · ' + doneCount + '/' + ids.length + ' done'; };

    /* Fire all in parallel — each /run POST holds the connection open until
       the run finishes, so the .then/.catch fires per-case as each completes.
       Default to cache=read (replay existing locators) — bulk run is usually
       a regression check, not a re-record session. Cache writes go through
       the per-case "Run raw" button instead. */
    const promises = ids.map((id) => {
      setPill(id, 'running', '#dbeafe', '#1e40af');
      return api.post(
        '/api/midscene-js/cases/' + encodeURIComponent(id) + '/run?cache=read',
        { headed: true },
      ).then((r) => {
        const passed = r?.run?.status === 'passed';
        setPill(id, passed ? 'passed' : 'failed',
          passed ? '#dcfce7' : '#fee2e2',
          passed ? '#166534' : '#991b1b');
        return { id, passed, record: r?.run, error: null };
      }).catch((err) => {
        setPill(id, 'error', '#fee2e2', '#991b1b');
        return { id, passed: false, record: null, error: err?.message ?? String(err) };
      }).finally(() => { doneCount++; updateTitle(); });
    });

    const results = await Promise.all(promises);
    const passed = results.filter((r) => r.passed).length;

    /* Add a Close button to the panel + summary toast. */
    const closeBtn = h('button', {
      class: 'btn sm',
      style: { marginTop: '10px', width: '100%' },
      onClick: () => panel.remove(),
    }, 'Close');
    panel.appendChild(closeBtn);

    toast(
      'Bulk run done: ' + passed + '/' + ids.length + ' passed',
      passed === ids.length ? 'ok' : (passed === 0 ? 'err' : 'warn'),
      8000,
    );

    /* Refresh KPIs / results / runs so the workbench reflects the new state. */
    try { renderKpis(); renderResults(); } catch { /* render fns may be out of scope */ }
  }

  // ── Wire toolbar event handlers ──
  casesToolbar.querySelector('[data-bind=cases-search]').addEventListener('input', (e) => {
    wbState.caseSearch = e.target.value;
    renderCasesList();
  });
  casesToolbar.querySelector('[data-bind=cases-filter]').addEventListener('change', (e) => {
    wbState.caseFilter = e.target.value;
    renderCasesList();
  });
  logsRegion.querySelector('[data-bind=logs-filter]').addEventListener('change', (e) => {
    wbState.logFilter = e.target.value;
    rerenderLogs();
  });
  logsRegion.querySelector('[data-bind=logs-case-filter]').addEventListener('change', (e) => {
    wbState.logCaseFilter = e.target.value;
    rerenderLogs();
  });
  logsRegion.querySelector('[data-bind=logs-clear]').addEventListener('click', () => {
    wbState.logs = [];
    rerenderLogs();
  });
  resultsToolbar.querySelector('[data-bind=results-search]').addEventListener('input', (e) => {
    wbState.resultsSearch = e.target.value;
    renderResults();
  });
  resultsToolbar.querySelector('[data-bind=results-filter]').addEventListener('change', (e) => {
    wbState.resultsFilter = e.target.value;
    renderResults();
  });
  resultsToolbar.querySelector('[data-bind=results-export]').addEventListener('click', exportResultsCsv);

  // ── Initial paint ──
  renderKpis();
  renderCasesList();
  renderResults();

  // Auto-select on workbench entry. Priority:
  //   1. The case of a currently-running run (so coming back from elsewhere
  //      lands you on what you were watching).
  //   2. The case of the most recent run from /api/results/recent
  //      (lets you pick up where you left off without scrolling).
  //   3. The first case in the sorted list (original fallback).
  // Each candidate must still exist in `cases` (id might have been
  // renamed / deleted since the run record was written).
  const caseIdsAvailable = new Set(cases.map((c) => c.id));
  const activeCaseId = (activeRes.active || [])
    .map((a) => a.caseId)
    .find((id) => caseIdsAvailable.has(id));
  const latestRunCaseId = (recentRes.runs || [])
    .map((r) => r.caseId)
    .find((id) => caseIdsAvailable.has(id));
  const initialPickId = activeCaseId || latestRunCaseId || (cases[0] && cases[0].id);
  if (initialPickId) selectCase(initialPickId);

  // ── WebSocket + active-run poller (reuse existing endpoints) ──
  try { runWs?.close(); } catch {}
  if (canRun || canReadResults) {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    try {
      const ws = new WebSocket(`${proto}://${location.host}/ws/run`);
      wbState.ws = ws; runWs = ws;
      ws.onmessage = (ev) => {
        let msg; try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.type === 'hello') {
          setLogStatus(msg.status);
          for (const e of (msg.backlog || [])) pushLog(e);
          for (const e of (msg.events  || [])) applyStepEvent(e);
        } else if (msg.type === 'log') {
          pushLog(msg);
        } else if (msg.type === 'event') {
          if (msg.event) applyStepEvent(msg.event);
        } else if (msg.type === 'status') {
          setLogStatus(msg.status);
          if (!msg.status?.running) pollActiveRuns(); // refresh KPI
        }
      };
    } catch (e) { /* swallow ws errors */ }
  }

  // Per-run log cursors so the same logTail line isn't piped into the Live
  // Log column twice across polls. Also tracks the run we paint step status
  // for, so finishing a run can mark trailing steps appropriately.
  const jsRunLogCursor = new Map();   // runId → number of logTail entries already piped
  let lastRenderedRunId = null;
  let lastRenderedStepOrder = null;

  async function pollActiveRuns() {
    try {
      const r = await api.get('/api/midscene-js/runs/active');
      const prev = wbState.activeRuns;
      wbState.activeRuns = r.active || [];

      // Wipe the live log on every fresh batch — i.e. when the active set
      // transitions from empty (idle) to non-empty. Launching another case
      // WHILE something is running does NOT clear (would wipe the ongoing
      // run's logs); for that, the operator can hit the "Clear" button.
      if (prev.length === 0 && wbState.activeRuns.length > 0 && wbState.logs.length > 0) {
        wbState.logs = [];
        rerenderLogs();
      }

      // NOTE: renderKpis() is deferred until AFTER the screenshot-merge loop
      // below — otherwise the Cache Hit KPI tile would draw from last poll's
      // runScreenshotsByRun snapshot and lag a full tick behind.
      // Live-update the "Running" badge on the cases list — the badge shows
      // step progress and cache-hit ratio that ticks up as the run advances.
      updateRunningRowBadges();

      // Re-render the detail header/actions when the running set for the
      // currently-selected case flips on/off so the Stop button appears.
      if (wbState.selectedCaseId) {
        const cur = wbState.detailCache.get(wbState.selectedCaseId);
        if (cur) {
          const wasRunningHere = prev.some(a => a.caseId === wbState.selectedCaseId);
          const isRunningHere  = wbState.activeRuns.some(a => a.caseId === wbState.selectedCaseId);
          if (wasRunningHere !== isRunningHere) renderDetail(cur);
        }
      }

      // Pipe each active Midscene JS run's logTail into the Live Log column
      // and reflect currentStep on the step pipeline (only when the run's
      // case matches the currently-displayed detail — otherwise the user
      // would see another case's steps light up under the wrong title).
      for (const mine of wbState.activeRuns) {
        const cursor = jsRunLogCursor.get(mine.runId) ?? 0;
        const fresh = (mine.logTail || []).slice(cursor);
        if (fresh.length) {
          for (const ln of fresh) {
            pushLog({
              ts:     ln.ts || Date.now(),
              stream: ln.stream || 'stdout',
              line:   ln.line  || String(ln),
              caseId: mine.caseId,
              runId:  mine.runId,
            });
          }
          jsRunLogCursor.set(mine.runId, (mine.logTail || []).length);
        }
        // Show RUN status in the Live Log header, with aggregated cache-hit
        // progress across all currently-running cases.
        setLogStatus({ running: true });

        // Step pipeline update — only when this run targets the case the
        // user currently has open in the center column.
        if (mine.caseId === wbState.selectedCaseId && mine.currentStep) {
          const stepsRoot = detailBody.querySelector('[data-bind=wb-steps]');
          const isFlow = stepsRoot?.classList.contains('flow-canvas');
          const stepSel = isFlow ? '.flow-card' : '.wb-step';
          if (stepsRoot) {
            const curOrder = mine.currentStep.order;
            if (lastRenderedRunId !== mine.runId) {
              stepsRoot.querySelectorAll(stepSel).forEach((el) => {
                const ord = Number(el.dataset.stepOrder);
                el.classList.remove('is-running', 'is-passed', 'is-failed', 'is-focused', 'just-stamped');
                if (ord < curOrder)      el.classList.add('is-passed');
                else if (ord === curOrder) el.classList.add('is-running', 'is-focused');
                else                       el.classList.add('is-pending');
              });
              lastRenderedRunId = mine.runId;
              lastRenderedStepOrder = curOrder;
              scrollStepIntoView(stepsRoot.querySelector(stepSel + '.is-running'));
              if (isFlow) { drawFlowEdges(stepsRoot); refreshFlowStats(stepsRoot); }
              else        { updateRailFromActive(); }
            } else if (curOrder !== lastRenderedStepOrder) {
              const prevEl = stepsRoot.querySelector(`${stepSel}[data-step-order="${lastRenderedStepOrder}"]`);
              if (prevEl) {
                prevEl.classList.remove('is-running', 'is-pending', 'is-focused');
                prevEl.classList.add('is-passed');
                if (!isFlow) stampStep(prevEl);
              }
              const curEl = stepsRoot.querySelector(`${stepSel}[data-step-order="${curOrder}"]`);
              if (curEl) {
                curEl.classList.remove('is-pending', 'is-passed', 'is-failed');
                curEl.classList.add('is-running', 'is-focused');
                scrollStepIntoView(curEl);
              }
              lastRenderedStepOrder = curOrder;
              if (isFlow) { drawFlowEdges(stepsRoot); refreshFlowStats(stepsRoot); }
              else        { updateRailFromActive(); }
            }
          }
        }

        // ── Persist every screenshot the runner reports, regardless of
        //    whether the user is currently looking at the flow view. This
        //    fixes the "switch to list and back loses thumbs" bug — the
        //    flow re-mount path re-hydrates from this map.
        if (Array.isArray(mine.screenshots) && mine.screenshots.length) {
          let map = runScreenshotsByRun.get(mine.runId);
          if (!map) { map = new Map(); runScreenshotsByRun.set(mine.runId, map); }
          for (const sh of mine.screenshots) {
            const prev = map.get(sh.order);
            if (!prev || prev.status !== sh.status || prev.cached !== sh.cached) {
              map.set(sh.order, { status: sh.status, cached: sh.cached, runId: mine.runId });
            }
          }
        }

        // Flow-mode live update: if this run's case is selected AND the
        // user is viewing the flow grid, push fresh thumbs into the cards.
        if (mine.caseId === wbState.selectedCaseId) {
          const stepsRoot = detailBody.querySelector('[data-bind=wb-steps]');
          if (stepsRoot?.classList.contains('flow-canvas')) {
            hydrateFlowFromActiveRun(mine.runId, stepsRoot);
          }
        }
      }
      // Now that runScreenshotsByRun is fully refreshed from this poll's
      // active-runs data, repaint KPIs so the Cache Hit tile reflects the
      // latest hit/miss counts (instead of lagging a tick).
      renderKpis();

      // A previously-running run just finished — drop its cursor + reset the
      // logs header to idle, refresh /api/results/recent so the bottom table
      // picks up the new record, and pop a clickable toast announcing the
      // outcome. The toast deep-links to the case's History tab so the user
      // can open the Midscene report with one click.
      const finished = prev.filter(p => !wbState.activeRuns.some(a => a.runId === p.runId));
      if (finished.length) {
        for (const f of finished) jsRunLogCursor.delete(f.runId);
        if (wbState.activeRuns.length === 0) {
          setLogStatus({ running: false });
          lastRenderedRunId = null;
          lastRenderedStepOrder = null;
        }
        try {
          const rr = await api.get('/api/results/recent?limit=200');
          allRuns.length = 0;
          (rr.runs || []).forEach(x => allRuns.push(x));
          lastRunByCase.clear();
          for (const x of allRuns) {
            if (x.caseId && !lastRunByCase.has(x.caseId)) lastRunByCase.set(x.caseId, x);
          }
          renderKpis();
          renderCasesList();
          renderResults();
          // Toast each finished run that we have a fresh record for.
          for (const f of finished) {
            const rec = allRuns.find(x => x.runId === f.runId);
            if (!rec) continue;
            const ok = rec.status === 'passed';
            const msg = `${rec.caseId} ${ok ? '✓ passed' : '✗ failed'} · ${fmtMs(rec.durationMs) || '—'}`;
            wbToast(msg, ok ? 'ok' : 'err', () => go('cases/' + encodeURIComponent(rec.caseId) + '/history'));
          }
        } catch {}
      }
    } catch { /* ignore poll errors */ }
  }

  // Clickable toast variant for finished-run announcements. Falls back to
  // the regular toast() when there's no click handler.
  function wbToast(message, kind, onClick) {
    if (!onClick) return toast(message, kind, 5000);
    let stack = document.querySelector('.toast-stack');
    if (!stack) { stack = h('div', { class: 'toast-stack' }); document.body.appendChild(stack); }
    const el = h('div', { class: `toast clickable ${kind}` }, message);
    el.addEventListener('click', () => { try { onClick(); } catch {} el.remove(); });
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }, 5500);
    setTimeout(() => el.remove(), 6000);
  }

  if (canRun || canReadResults) {
    pollActiveRuns();
    // Fast poll (1.5s) when something is running so the Live Log feels live;
    // slow poll (4s) otherwise to stay cheap. The interval is re-armed on
    // every tick based on current activeRuns size.
    const arm = () => {
      const fast = wbState.activeRuns.length > 0;
      try { clearInterval(wbState.pollHandle); } catch {}
      wbState.pollHandle = setInterval(async () => {
        await pollActiveRuns();
        // Re-arm if the speed needs to change.
        const shouldFast = wbState.activeRuns.length > 0;
        if (shouldFast !== fast) arm();
      }, fast ? 1500 : 4000);
    };
    arm();
    // Drop the poller when the route changes — render() rebuilds the view
    // wholesale, so we tear down our timers on the next hashchange.
    window.addEventListener('hashchange', function teardown() {
      window.removeEventListener('hashchange', teardown);
      try { clearInterval(wbState.pollHandle); } catch {}
      try { wbState.ws?.close(); } catch {}
      wb.mounted = null;
    }, { once: true });
  }

  // Expose hooks the global keyboard handler needs (J/K nav, / focus, Esc).
  // Cleared in the hashchange teardown above so a stale workbench can't get
  // poked after the user navigates away.
  wb.mounted = {
    get selectedCaseId() { return wbState.selectedCaseId; },
    get selectedIds()    { return wbState.selectedIds; },
    casesSearchEl: casesToolbar.querySelector('[data-bind=cases-search]'),
    moveSelection,
    refreshSelectedFoot,
    renderCasesList,
    // Snapshot of the per-step bypass-cache flags for the currently-selected
    // case, in `{ [order]: bool }` shape that openJsRunModal's seededBypass
    // expects. Used by Enter / Shift+R keyboard shortcuts.
    bypassSnapshot: () => {
      const id = wbState.selectedCaseId;
      if (!id) return null;
      const det = wbState.detailCache.get(id);
      const steps = det?.parsed?.apiGuide?.steps || [];
      return bypassSnapshot(id, steps);
    },
    // Factory for openJsRunModal's onBypassChange callback. Mirrors the
    // syncBypassFromModal closure inside renderDetail so the keyboard
    // shortcut path (Enter / Shift+R) gets the same two-way sync.
    bypassSync: (caseId) => (order, checked) => {
      setBypass(caseId, order, checked);
      const row = document.querySelector(`.wb-step[data-step-order="${order}"]`);
      if (!row) return;
      const cb = row.querySelector('.wb-step-bypass input[type="checkbox"]');
      if (cb && cb.checked !== checked) cb.checked = checked;
      const lbl = row.querySelector('.wb-step-bypass');
      if (lbl) lbl.classList.toggle('is-on', checked);
    },
    triggerIgnition,
  };

  return root;
};

// ═══════════════════════════════════════════════════════════════════════════
// View: Cinema — full-bleed playback / live-watch of a Midscene JS run.
//
// Route shapes (route.view = 'cinema', route.params.rest):
//   ['<caseId>']             — opens latest run for the case
//   ['<caseId>', '<runId>']  — opens a specific run
//
// The page mounts as a position:fixed overlay above the workbench shell.
// In live mode (an active run for this case is in flight), the page polls
// /api/midscene-js/runs/active every 1500ms and auto-advances to whatever
// step is currently running. After the run ends the user can scrub / play
// freely. Keyboard: ← → space esc, also clickable on the bottom filmstrip.
// ═══════════════════════════════════════════════════════════════════════════
VIEWS.cinema = async (route) => {
  const [caseId, runIdArg] = route.params.rest;

  const caseDetail = await api.get('/api/cases/' + encodeURIComponent(caseId)).catch(() => null);
  const apiSteps = caseDetail?.parsed?.apiGuide?.steps || [];

  // Resolve runId: explicit > active for this case > latest finished run.
  let runId = runIdArg ?? null;
  let isLive = false;
  if (!runId) {
    const active = await api.get('/api/midscene-js/runs/active').catch(() => ({ active: [] }));
    const mine = active.active?.find(a => a.caseId === caseId);
    if (mine) { runId = mine.runId; isLive = true; }
  }
  if (!runId) {
    const runs = await api.get('/api/cases/' + encodeURIComponent(caseId) + '/runs').catch(() => ({ runs: [] }));
    runId = runs.runs?.[0]?.runId ?? null;
  }
  // If the (now-resolved) runId is still an active one, treat as live.
  if (runId && !isLive) {
    const active2 = await api.get('/api/midscene-js/runs/active').catch(() => ({ active: [] }));
    isLive = active2.active?.some(a => a.runId === runId) ?? false;
  }

  // Fetch the existing screenshots list (may be empty for fresh live runs).
  async function fetchScreenshots() {
    if (!runId) return [];
    const r = await api.get(`/api/midscene-js/runs/${encodeURIComponent(runId)}/screenshots`).catch(() => ({ screenshots: [] }));
    return r.screenshots || [];
  }
  let screens = await fetchScreenshots();

  // Build a per-order metadata map (from active poll if live, else from disk listing).
  // Each frame: { order, title, url, status, cached }
  // Parse the runner's API name (e.g. "agent.aiTap()" → "aiTap") so the
  // bottom subtitle can show the same compact label as the floating
  // active-run badge ("step 7/27 · aiTap: 点击右下角execute").
  function parseStepApi(midsceneApi, exampleCode) {
    const src = String(midsceneApi || '') + ' ' + String(exampleCode || '');
    const m = src.match(/agent\.(ai[A-Z][a-zA-Z]*)/);
    if (m) return m[1];
    const lower = src.toLowerCase();
    if (lower.includes('aitap'))    return 'aiTap';
    if (lower.includes('aiinput'))  return 'aiInput';
    if (lower.includes('aiquery'))  return 'aiQuery';
    if (lower.includes('aiassert')) return 'aiAssert';
    if (lower.includes('aiscroll')) return 'aiScroll';
    if (lower.includes('aiact'))    return 'aiAct';
    if (/sleep|wait/.test(lower))   return 'aiWaitFor';
    return 'step';
  }

  function buildFrames() {
    const byOrder = new Map();
    for (const s of apiSteps) {
      byOrder.set(s.order, {
        order: s.order,
        title: s.title || s.naturalLanguageInstruction || s.midsceneApi || '',
        api:   parseStepApi(s.midsceneApi, s.exampleCode),
        // The badge in the corner shows the naturalLanguageInstruction
        // (Chinese description). We mirror that here so the cinema
        // subtitle reads identically.
        instruction: s.naturalLanguageInstruction || s.title || '',
        url: null,
        status: 'pending',
        cached: null,
      });
    }
    for (const sh of screens) {
      const f = byOrder.get(sh.order);
      if (f) { f.url = sh.url || `/api/midscene-js/runs/${encodeURIComponent(runId)}/screenshot/${sh.order}`; f.status = 'passed'; }
    }
    // If we have rich poll metadata, overlay status/cached from there.
    const map = runId ? runScreenshotsByRun.get(runId) : null;
    if (map) {
      for (const [order, meta] of map) {
        const f = byOrder.get(order);
        if (f) { f.status = meta.status; f.cached = meta.cached; if (!f.url) f.url = `/api/midscene-js/runs/${encodeURIComponent(runId)}/screenshot/${order}`; }
      }
    }
    return [...byOrder.values()].sort((a, b) => a.order - b.order);
  }

  let frames = buildFrames();

  // Cinema-local state.
  let currentIdx = 0;
  let isPlaying = isLive;        // auto-advance follows live runs by default
  let speed = 1;                  // playback rate; only used for auto-advance pacing
  let lastDispatchedRunStep = null;
  // True while we're tracking the runner's currentStep. Set false when the
  // user manually scrubs / clicks a thumb — the "BACK TO LIVE" button can
  // flip it back true.
  let isFollowingLive = true;
  // Set once when the run ends so we don't show the result overlay twice.
  let resultShown = false;

  // ── DOM ──
  const root = h('div', { class: 'cinema' });

  // Top bar
  const titleEl = h('div', { class: 'cm-title' }, caseDetail?.parsed?.title || caseId);
  const stepEl  = h('div', { class: 'cm-step' }, '');
  const statusEl = h('div', { class: 'cm-status' + (isLive ? ' is-live' : '') }, isLive ? 'LIVE' : 'REPLAY');
  root.appendChild(h('div', { class: 'cinema-top' },
    h('button', { class: 'cm-back', onClick: () => history.back() }, '← back'),
    titleEl,
    stepEl,
    h('span', { class: 'spacer' }),
    statusEl,
  ));

  // Stage — frame (image) on top, caption bar directly below as a sibling
  // so the bottom subtitle never collides with the SAP page's own footer
  // bar inside the screenshot.
  const frame = h('div', { class: 'cinema-frame is-empty' }, h('div', {}, '▣'));
  const caption = h('div', { class: 'cinema-caption' });
  const stage = h('div', { class: 'cinema-stage' },
    h('div', { class: 'cinema-stage-inner' }, frame, caption),
  );
  root.appendChild(stage);

  // Bottom: track + controls + filmstrip
  const trackFill = h('div', { class: 'cm-track-fill' });
  const trackCursor = h('div', { class: 'cm-track-cursor' });
  const track = h('div', { class: 'cinema-track' }, trackFill, trackCursor);

  const counterEl = h('span', { class: 'cm-counter' }, '0 / 0');
  const playBtn = h('button', { class: 'cm-play', title: 'Play / Pause (Space)' }, isPlaying ? '⏸' : '▶');
  const speedBtn = h('button', { class: 'cm-speed', title: 'Playback speed' }, '1×');
  const controls = h('div', { class: 'cinema-controls' },
    h('button', { title: 'First (Home)',   onClick: () => goTo(0, { manual: true }) }, '⏮'),
    h('button', { title: 'Previous (←)',   onClick: () => goTo(currentIdx - 1, { manual: true }) }, '◀'),
    playBtn,
    h('button', { title: 'Next (→)',       onClick: () => goTo(currentIdx + 1, { manual: true }) }, '▶'),
    h('button', { title: 'Last (End)',     onClick: () => goTo(frames.length - 1, { manual: true }) }, '⏭'),
    counterEl,
    speedBtn,
  );

  const strip = h('div', { class: 'cinema-strip' });

  root.appendChild(h('div', { class: 'cinema-bottom' }, track, controls, strip));

  // Filmstrip is rebuilt only when the FRAME SET changes (different
  // count, new url, status change). Position updates (active class)
  // happen in-place, so picking a step doesn't trigger image reloads.
  let lastStripKey = null;
  let lastStripActiveIdx = -1;
  function renderStrip() {
    const key = frames.map(f => `${f.order}:${f.url || ''}:${f.status}`).join('|');
    if (key !== lastStripKey) {
      lastStripKey = key;
      strip.innerHTML = '';
      frames.forEach((f, i) => {
        const thumb = h('div', {
          class: 'cm-strip-thumb' + (f.url ? '' : ' is-empty') + (i === currentIdx ? ' is-active' : ''),
          title: '#' + f.order + ' · ' + f.title,
          dataset: { stripIdx: String(i) },
          onClick: () => goTo(i, { manual: true }),
        });
        if (f.url) thumb.appendChild(h('img', { src: f.url, alt: 'step ' + f.order, loading: 'lazy' }));
        thumb.appendChild(h('span', { class: 'cm-strip-num' }, '#' + f.order));
        if (f.status === 'passed')      thumb.appendChild(h('span', { class: 'cm-strip-mark pass' }));
        else if (f.status === 'failed') thumb.appendChild(h('span', { class: 'cm-strip-mark fail' }));
        else if (f.status === 'running')thumb.appendChild(h('span', { class: 'cm-strip-mark run' }));
        strip.appendChild(thumb);
      });
      lastStripActiveIdx = currentIdx;
    } else if (currentIdx !== lastStripActiveIdx) {
      // Frame set unchanged, only active position moved — toggle classes
      // without recreating any DOM (no image reload, no flicker).
      const prev = strip.querySelector('.cm-strip-thumb.is-active');
      if (prev) prev.classList.remove('is-active');
      const next = strip.querySelector(`.cm-strip-thumb[data-strip-idx="${currentIdx}"]`);
      if (next) next.classList.add('is-active');
      lastStripActiveIdx = currentIdx;
    }
    // Keep the active thumb in view (cheap, idempotent).
    const active = strip.querySelector('.cm-strip-thumb.is-active');
    if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // Track what's actually shown so we don't re-render identical content
  // every poll (that's what caused the strobing/fade loop the user saw).
  // Key shape: `${idx}|${url}|${status}|${cached}`
  let lastPaintedKey = null;
  let currentImgEl = null;

  // Update the big frame to show the currently-selected step. Crossfade
  // only fires when the underlying frame ACTUALLY changes (idx jump, new
  // url, or status flip). Otherwise: no-op.
  function paintFrame() {
    const f = frames[currentIdx];
    if (!f) return;

    // If this step has no screenshot yet but it's running (or pending after
    // a running one), borrow the most recent earlier frame's image. The
    // "before" state of the SAP screen is the perfect context for what's
    // about to happen — beats staring at a placeholder for 5 seconds.
    let imgFrame = f;
    let isExecuting = false;
    if (!f.url) {
      const prevWithImg = (() => {
        for (let i = currentIdx - 1; i >= 0; i--) if (frames[i].url) return frames[i];
        return null;
      })();
      if (prevWithImg) {
        imgFrame = prevWithImg;
        // Treat as executing whenever this is the running step or simply
        // hasn't been captured yet — both convey "next image coming".
        isExecuting = true;
      }
    }

    const key = `${currentIdx}|${imgFrame.url || ''}|${f.status}|${f.cached}|${isExecuting ? 1 : 0}|${f.order}`;
    if (key === lastPaintedKey) return;
    const prevKey = lastPaintedKey;
    lastPaintedKey = key;

    stepEl.textContent = `Step ${currentIdx + 1} / ${frames.length}` + (f.order !== currentIdx + 1 ? ` (#${f.order})` : '');
    counterEl.textContent = `${currentIdx + 1} / ${frames.length}`;
    const pct = frames.length > 1 ? (currentIdx / (frames.length - 1)) * 100 : 0;
    trackFill.style.width = pct + '%';
    trackCursor.style.left = pct + '%';

    // Bottom subtitle — mirrors the floating active-run badge's format:
    //   step 7/27 · aiTap: 点击右下角execute   [EXECUTING] [⚡ CACHED]
    // - "step N/M" — sounds like a chapter marker
    // - "aiTap"    — the runner API the step actually invokes (camelCase)
    // - "<text>"   — the step's naturalLanguageInstruction (Chinese)
    // Caption is a SIBLING of the frame in the stage, so the SAP image's
    // own footer bar never gets confused with it.
    const apiName = f.api || 'step';
    const captionText = f.instruction || f.title || '';
    caption.classList.toggle('is-executing', isExecuting);
    caption.innerHTML = '';
    // Native Element.append() turns `null` into the literal text "null",
    // so we MUST filter falsy values out before spreading. The previous
    // `? expr : null` pattern was producing text nodes of "null" around
    // the cached badge.
    caption.append(...[
      h('span', { class: 'cm-cap-step' }, `step ${f.order}/${frames.length}`),
      h('span', { class: 'cm-cap-sep'  }, '·'),
      h('span', { class: 'cm-cap-api'  }, apiName + ':'),
      h('span', { class: 'cm-cap-text' }, captionText),
      isExecuting        && h('span', { class: 'cm-cap-exec' }, 'EXECUTING'),
      f.cached === true  && h('span', { class: 'cm-cap-badge cache' }, '⚡ cached'),
      f.cached === false && h('span', { class: 'cm-cap-badge llm'   }, 'AI · llm'),
      f.status === 'failed' && h('span', { class: 'cm-cap-badge fail' }, 'FAIL'),
    ].filter(Boolean));

    // Toggle the executing overlay on the frame container.
    frame.classList.toggle('is-executing', isExecuting);

    // No image at all (very first step before anything captured) — placeholder.
    if (!imgFrame.url) {
      frame.classList.add('is-empty');
      frame.innerHTML = '';
      frame.append(h('div', {}, '▣'));
      currentImgEl = null;
      return;
    }
    frame.classList.remove('is-empty');

    // Detect what changed:
    //   - URL changed → real crossfade
    //   - Same URL, only executing/caption changed → leave img alone, just
    //     update caption + container class (no animation reload)
    const prevUrl = prevKey ? prevKey.split('|')[1] : null;
    const urlChanged = prevUrl !== (imgFrame.url || '');

    if (!urlChanged && currentImgEl && currentImgEl.src.endsWith(imgFrame.url)) {
      // Same underlying image — keep it. Caption + class already updated above.
      return;
    }

    // Preload the new image FIRST. Don't touch the DOM until it's decoded
    // — otherwise the transition runs on an empty <img> element and the
    // user sees a blank frame for the duration of the HTTP fetch. The old
    // image stays in place during the load, so there's no flash.
    const preload = new Image();
    const targetUrl = imgFrame.url;
    const targetKey = key;          // snapshot to detect "newer paint already happened"
    preload.onload = () => {
      // If another paintFrame call superseded us while we were loading,
      // bail — that one has already inserted its image.
      if (lastPaintedKey !== targetKey) return;
      mountTransition(preload, imgFrame, caption);
    };
    preload.onerror = () => {
      if (lastPaintedKey !== targetKey) return;
      // Load failed — fall back to mounting the broken img so the user
      // sees a placeholder rather than the old image forever.
      const broken = h('img', { src: targetUrl, alt: 'step ' + imgFrame.order, class: 'cm-fade-new' });
      mountTransition(broken, imgFrame, caption);
    };
    preload.src = targetUrl;
  }

  // Shared mount path used after preload completes (or fails).
  function mountTransition(loadedImg, imgFrame, caption) {
    // Promote the preloaded <img> (or pre-existing one) into the fade slot.
    loadedImg.className = 'cm-fade-new';
    loadedImg.alt = 'step ' + imgFrame.order;
    const isFirst = !currentImgEl;
    frame.classList.toggle('is-first', isFirst);
    frame.innerHTML = '';
    if (currentImgEl) {
      currentImgEl.classList.remove('cm-fade-new');
      currentImgEl.classList.add('cm-fade-old');
      frame.appendChild(currentImgEl);
    }
    frame.appendChild(loadedImg);
    // NOTE: caption is no longer a child of frame — it's a stage sibling.
    currentImgEl = loadedImg;

    // Pulse .is-transitioning so the ::before light-sweep re-runs every
    // transition (instead of stuck after the first). Remove after the
    // sweep animation finishes (700ms).
    frame.classList.remove('is-transitioning');
    void frame.offsetWidth;
    frame.classList.add('is-transitioning');
    setTimeout(() => { try { frame.classList.remove('is-transitioning'); } catch {} }, 750);
  }

  // `manual` = the user initiated this (click, key, scrub). When true and
  // we're in live mode, drop follow-live so the runner's currentStep stops
  // pulling the cinema cursor away. The "BACK TO LIVE" button restores it.
  function goTo(i, opts = {}) {
    if (!frames.length) return;
    const next = Math.max(0, Math.min(frames.length - 1, i));
    if (next === currentIdx) return;
    if (opts.manual && isLive) {
      isFollowingLive = false;
      updateBackToLive();
    }
    currentIdx = next;
    renderStrip();
    paintFrame();
  }

  // Resume auto-follow: jump to whatever step the runner is currently on
  // and re-enable follow. Called by the BACK TO LIVE button.
  function snapBackToLive() {
    isFollowingLive = true;
    updateBackToLive();
    // Find currently-running frame; if none, jump to last frame with content.
    const runningIdx = frames.findIndex(f => f.status === 'running');
    if (runningIdx >= 0) {
      currentIdx = runningIdx;
    } else {
      // No active running step yet — follow the latest captured one.
      let last = -1;
      for (let i = 0; i < frames.length; i++) if (frames[i].url) last = i;
      if (last >= 0) currentIdx = last;
    }
    renderStrip();
    paintFrame();
  }

  // Show/hide the BACK TO LIVE pill depending on live + follow state.
  let backToLiveBtn = null;
  function updateBackToLive() {
    if (isLive && !isFollowingLive) {
      if (!backToLiveBtn) {
        backToLiveBtn = h('button', {
          class: 'cm-back-to-live',
          onClick: snapBackToLive,
        }, LANG === 'zh' ? '回到直播' : 'Back to live');
        stage.appendChild(backToLiveBtn);
      }
    } else if (backToLiveBtn) {
      backToLiveBtn.remove();
      backToLiveBtn = null;
    }
  }

  // Track click → scrub (manual).
  track.addEventListener('click', (e) => {
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    goTo(Math.round(pct * (frames.length - 1)), { manual: true });
  });

  // Play button toggles auto-advance.
  function setPlaying(on) {
    isPlaying = !!on;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
  }
  playBtn.addEventListener('click', () => setPlaying(!isPlaying));

  // Speed cycle: 0.5× → 1× → 2× → 4×.
  speedBtn.addEventListener('click', () => {
    const cycle = [0.5, 1, 2, 4];
    speed = cycle[(cycle.indexOf(speed) + 1) % cycle.length];
    speedBtn.textContent = (speed === Math.floor(speed) ? speed : speed.toFixed(1)) + '×';
  });

  // Keyboard control.
  function onKey(e) {
    if (e.key === 'Escape')      { e.preventDefault(); history.back(); }
    else if (e.key === ' ')      { e.preventDefault(); setPlaying(!isPlaying); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIdx + 1, { manual: true }); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(currentIdx - 1, { manual: true }); }
    else if (e.key === 'Home')   { e.preventDefault(); goTo(0, { manual: true }); }
    else if (e.key === 'End')    { e.preventDefault(); goTo(frames.length - 1, { manual: true }); }
  }
  document.addEventListener('keydown', onKey);

  // Auto-advance loop — only ticks when isPlaying AND there are more frames.
  // In live mode this is suspended in favor of poll-driven follow.
  let autoAdvanceTimer = null;
  function tickAuto() {
    if (!isPlaying || isLive) return;
    if (currentIdx >= frames.length - 1) { setPlaying(false); return; }
    goTo(currentIdx + 1);
  }
  function startAutoAdvance() {
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = setInterval(tickAuto, Math.max(150, 1200 / speed));
  }
  startAutoAdvance();

  // Live polling — every 1500ms refresh active runs, screenshots map +
  // disk list (in case the in-memory wbState path isn't running because the
  // user navigated direct).
  let livePollTimer = null;
  async function pollLive() {
    try {
      const r = await api.get('/api/midscene-js/runs/active');
      const mine = r.active?.find(a => a.runId === runId);
      // Persist into wbState too, so re-entering workbench shows hydrated cards.
      if (mine && Array.isArray(mine.screenshots) && mine.screenshots.length) {
        let map = runScreenshotsByRun.get(mine.runId);
        if (!map) { map = new Map(); runScreenshotsByRun.set(mine.runId, map); }
        for (const sh of mine.screenshots) map.set(sh.order, { status: sh.status, cached: sh.cached, runId: mine.runId });
      }
      // Refresh disk listing too (so frames reflect new files).
      screens = await fetchScreenshots();
      const newFrames = buildFrames();
      // If currentStep advanced, mark previous as running→done in our frames.
      if (mine?.currentStep) {
        const curOrder = mine.currentStep.order;
        for (const f of newFrames) {
          if (f.order < curOrder && f.status === 'pending') f.status = 'passed';
          if (f.order === curOrder && !f.url) f.status = 'running';
        }
        // Auto-follow: only move the cursor when isFollowingLive is true.
        // If the user manually scrubbed, they stay where they are until they
        // click the "BACK TO LIVE" button.
        if (isFollowingLive) {
          const idx = newFrames.findIndex(f => f.order === curOrder);
          if (idx >= 0) currentIdx = idx;
        }
        lastDispatchedRunStep = curOrder;
      }
      frames = newFrames;
      updateBackToLive();
      // If run ended (not in active anymore), switch out of live mode and
      // pop the celebratory result overlay.
      if (!mine && isLive) {
        isLive = false;
        statusEl.classList.remove('is-live');
        statusEl.textContent = 'REPLAY';
        // Hide the back-to-live pill if it was showing.
        updateBackToLive();
        // Resolve outcome from the run history endpoint.
        showResultOverlay();
      }
      renderStrip();
      paintFrame();
    } catch { /* ignore poll errors */ }
  }
  // Build & mount the end-of-run result overlay (PASSED / FAILED card with
  // animated check or X, totals, and a quick replay-from-start affordance).
  // Pass → confetti rains. Fail → card shakes + red shadow pulse (already
  // wired in CSS via .is-fail).
  async function showResultOverlay() {
    if (resultShown) return;
    resultShown = true;
    // Fetch the canonical run record so we get error/duration/etc.
    let runRec = null;
    try {
      const rrs = await api.get('/api/cases/' + encodeURIComponent(caseId) + '/runs');
      runRec = rrs.runs?.find(x => x.runId === runId) || rrs.runs?.[0] || null;
    } catch {}
    const status = runRec?.status === 'passed' ? 'passed' : 'failed';
    const dur = runRec?.durationMs;
    const total = frames.length;
    const passedCount = frames.filter(f => f.status === 'passed').length;
    const failedCount = frames.filter(f => f.status === 'failed').length;
    const cachedCount = [...runScreenshotsByRun.get(runId)?.values?.() ?? []].filter(m => m.cached === true).length;
    const isPass = status === 'passed';

    // Find a representative screenshot:
    //   pass → the LAST captured one (= final SAP state)
    //   fail → the failing step's screenshot (= the broken state)
    let shotFrame = null;
    if (isPass) {
      for (let i = frames.length - 1; i >= 0; i--) {
        if (frames[i].url) { shotFrame = frames[i]; break; }
      }
    } else {
      shotFrame = frames.find(f => f.status === 'failed' && f.url) || null;
      if (!shotFrame) for (let i = frames.length - 1; i >= 0; i--) {
        if (frames[i].url) { shotFrame = frames[i]; break; }
      }
    }

    // Pass overlay is split into 3 visual layers (see CSS .cr-headline /
    // .cr-evidence / .cr-summary):
    //   (1) headline   — the LAST step's natural-language intent. That's the
    //                    actual "pass criterion" the user wrote, e.g.
    //                    "查看excel是否下载成功". Rendered big & bold.
    //   (2) evidence[] — concrete proof (downloads, assertions, vars). The
    //                    一针见血 bit: tells the user WHAT was verified.
    //   (3) summary    — small footer with step totals.
    function cleanErr(s) {
      if (!s) return '';
      const t = String(s).trim();
      if (!t || t.toLowerCase() === 'null' || t === 'undefined') return '';
      return t;
    }
    function fmtBytes(n) {
      if (!Number.isFinite(n) || n <= 0) return '—';
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
      return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    let headline = '';
    const evidence = [];
    let summary = '';
    if (isPass) {
      const last = [...frames].reverse().find(f => f.status === 'passed') || frames[frames.length - 1];
      const headlineText = last?.instruction || last?.title || '';
      headline = headlineText ? '✓ ' + headlineText : (LANG === 'zh' ? '✓ 通过' : '✓ Passed');
      const downloads = runRec?.runSummary?.downloads || [];
      for (const d of downloads) {
        const when = d.modifiedAt ? new Date(d.modifiedAt).toLocaleTimeString(LANG === 'zh' ? 'zh-CN' : 'en-US', { hour12: false }) : '';
        evidence.push((LANG === 'zh' ? '📥 下载  ' : '📥 Download  ')
          + d.fileName + '  ·  ' + fmtBytes(d.sizeBytes) + (when ? '  ·  ' + when : ''));
      }
      const assertions = runRec?.runSummary?.assertions || [];
      for (const a of assertions) {
        const ok = a.passed ?? a.equal;
        const op = a.operator ?? (ok ? '==' : '!=');
        evidence.push(`${ok ? '✓' : '✗'} ${a.left || 'left'} ${op} ${a.right || 'right'}`);
      }
      for (const [k, v] of Object.entries(runRec?.runSummary?.variables || {})) {
        evidence.push(`${k} = ${String(v).slice(0, 80)}`);
      }
      summary = LANG === 'zh'
        ? `共 ${passedCount} 步全部通过${cachedCount ? `，${cachedCount} 步命中缓存` : ''}`
        : `All ${passedCount} steps passed${cachedCount ? `, ${cachedCount} via cache replay` : ''}`;
    } else {
      const failedFrame = frames.find(f => f.status === 'failed');
      headline = failedFrame
        ? ((LANG === 'zh' ? `✗ 第 #${failedFrame.order} 步失败：` : `✗ Step #${failedFrame.order} failed: `)
            + (failedFrame.instruction || failedFrame.title || ''))
        : (LANG === 'zh' ? '✗ 运行未能完成' : '✗ Run did not complete');
      const errMsg = cleanErr(runRec?.errorMessage);
      if (errMsg) evidence.push(errMsg.split('\n')[0].slice(0, 260));
      for (const [k, v] of Object.entries(runRec?.runSummary?.variables || {})) {
        evidence.push(`${k} = ${String(v).slice(0, 80)}`);
      }
      summary = LANG === 'zh'
        ? `${passedCount} 通过 · ${failedCount} 失败 · 共 ${total}`
        : `${passedCount} passed · ${failedCount} failed · ${total} total`;
    }

    const back = h('div', { class: 'cinema-result-back' });
    const card = h('div', { class: 'cinema-result ' + (isPass ? 'is-pass' : 'is-fail') });
    card.append(
      h('div', { class: 'cr-glyph' }, isPass ? '✓' : '✕'),
      h('div', { class: 'cr-title' }, isPass
        ? (LANG === 'zh' ? '运行通过' : 'RUN PASSED')
        : (LANG === 'zh' ? '运行失败' : 'RUN FAILED')),
      /* WHY block: big headline = pass criterion ("查看excel是否下载成功"),
       * evidence list = concrete proof, small footer = step totals. */
      h('div', { class: 'cr-headline' }, headline),
      evidence.length ? h('div', { class: 'cr-evidence' },
        ...evidence.map((e) => h('div', { class: 'cr-evidence-row' }, e)),
      ) : null,
      summary ? h('div', { class: 'cr-summary' }, summary) : null,
      // Inline screenshot of the final / failing step. Click to open full size
      // in a new tab; the caption shows which step it was.
      shotFrame?.url ? h('div', { class: 'cr-shot' },
        h('img', {
          src: shotFrame.url,
          alt: 'step ' + shotFrame.order,
          title: LANG === 'zh' ? '点击查看大图' : 'Click to view full size',
          onClick: () => window.open(shotFrame.url, '_blank'),
        }),
        h('div', { class: 'cr-shot-cap' },
          h('span', { class: 'cr-shot-num' }, '#' + shotFrame.order),
          h('span', {}, shotFrame.title || ''),
          h('a', { class: 'cr-shot-link', href: shotFrame.url, target: '_blank' },
            LANG === 'zh' ? '原图 ↗' : 'Full size ↗'),
        ),
      ) : null,
      h('div', { class: 'cr-stats' },
        h('div', { class: 'cr-stat' }, h('strong', { class: 'is-pass-num' }, String(passedCount)), h('span', {}, LANG === 'zh' ? '通过' : 'passed')),
        failedCount > 0 ? h('div', { class: 'cr-stat' }, h('strong', { class: 'is-fail-num' }, String(failedCount)), h('span', {}, LANG === 'zh' ? '失败' : 'failed')) : null,
        h('div', { class: 'cr-stat' }, h('strong', {}, String(total)), h('span', {}, LANG === 'zh' ? '总数' : 'total')),
        h('div', { class: 'cr-stat' }, h('strong', {}, fmtMs(dur) || '—'), h('span', {}, LANG === 'zh' ? '耗时' : 'duration')),
        cachedCount > 0 ? h('div', { class: 'cr-stat' }, h('strong', {}, String(cachedCount)), h('span', {}, LANG === 'zh' ? '缓存命中' : 'cached')) : null,
      ),
      h('div', { class: 'cr-actions' },
        h('button', { class: 'primary', onClick: () => { back.remove(); currentIdx = 0; renderStrip(); paintFrame(); setPlaying(true); } },
          LANG === 'zh' ? '重看回放' : 'Watch replay'),
        h('button', { onClick: () => back.remove() }, LANG === 'zh' ? '关闭' : 'Close'),
        runRec?.report?.url ? h('button', {
          onClick: () => window.open(runRec.report.url, '_blank'),
        }, LANG === 'zh' ? '打开报告 ↗' : 'Open report ↗') : null,
      ),
    );
    back.appendChild(card);
    // Confetti canvas on pass — sits behind the card content.
    if (isPass) {
      const cv = h('canvas', { class: 'cinema-result-confetti' });
      back.insertBefore(cv, card);
      requestAnimationFrame(() => { runConfetti(cv); });
    }
    stage.appendChild(back);
  }

  // Tiny canvas confetti — 60 paper pieces fall with rotation and drift.
  function runConfetti(canvas) {
    const rect = stage.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    const colors = ['#0070F2', '#1F7A39', '#E0660D', '#B00020', '#9333ea', '#22d3ee', '#facc15'];
    const N = 70;
    const pieces = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.18,
      w: 8 + Math.random() * 6,
      h: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    let frameCount = 0;
    function tick() {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.vRot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (frameCount < 180) requestAnimationFrame(tick);
    }
    tick();
  }

  if (runId) {
    pollLive();   // initial paint
    livePollTimer = setInterval(pollLive, 1500);
  } else {
    frame.innerHTML = '';
    frame.appendChild(h('div', { class: 'cinema-empty-msg' }, LANG === 'zh' ? '这个用例还没有运行记录' : 'No run records for this case yet.'));
  }

  // Initial paint
  if (frames.length) { renderStrip(); paintFrame(); }

  // Teardown on hashchange — render() rebuilds the view so we need to cancel
  // our timers + keyboard listener.
  window.addEventListener('hashchange', function teardown() {
    window.removeEventListener('hashchange', teardown);
    document.removeEventListener('keydown', onKey);
    try { clearInterval(autoAdvanceTimer); } catch {}
    try { clearInterval(livePollTimer); } catch {}
  }, { once: true });

  return root;
};

// ───────── View: Dashboard (legacy — superseded by Workbench but kept for
// backwards compatibility / explicit /dashboard-legacy linking). ─────────
VIEWS.dashboardLegacy = async () => {
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

  // Sort: all saptestN in numeric order (saptest1, saptest2, …, saptest9,
  // saptest10, saptest11, …), everything else by id alpha after.
  const saptestRank = (id) => {
    const m = /^saptest(\d+)$/.exec(id);
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
  // Edit existing case → keep the raw-JSON modal (advanced edit path).
  if (id) {
    const c = await api.get('/api/cases/' + encodeURIComponent(id));
    return openRawJsonEditor(id, c.raw);
  }

  // New case: prompt only for the id (kebab-case filename), then auto-create
  // the case server-side with template content + auto-seeded cache, then
  // navigate to the case detail page where the structured editor (title /
  // sapUrl / NL / Parameters / generated JS preview / action buttons) takes
  // over. Matches the Desktop "新建测试用例" experience — no raw JSON modal.
  let templateBody = null;
  let templateId = null;
  try {
    const tpl = await api.get('/api/cases/_meta/template');
    if (tpl?.parsed) {
      templateBody = { ...tpl.parsed };
      templateBody.title = '';
      templateBody.description = '';
      templateBody.transactionCode = '';
      // first-5-only: cacheId is hashed off the first 5 apiGuide sub-steps
      // (the shared Menu/Settings sequence), ignoring TCode and steps 6+.
      // Lets the new case keep its cache when the user fills in real TC or
      // appends more NL lines. Old cases without this field keep full-hash.
      templateBody.cacheStrategy = 'first-5-only';
      templateBody.naturalLanguage =
        '1.进入 Menu， 点击setting，点击visualization  并启用show Ok code field, 并保存。\n' +
        '2.在 左上角矩形输入框 输入 xxxx ，点击右下角execute';
      // Slice apiGuide to the 7 sub-steps the 2 NL lines expand to. Keeps the
      // cache lineage from the template (saptest1) usable for the new case —
      // ensureTemplateCacheForCase will copy saptest1's YAML over, and the
      // first 7 locator entries replay. Step 6 is the TCode input — blank its
      // default value so the user fills in the real TC via the Parameters tab.
      if (templateBody.apiGuide?.steps) {
        const sliced = templateBody.apiGuide.steps.slice(0, 7).map((s) => ({ ...s }));
        const tcStep = sliced.find((s) => /矩形|TC\s*框|T[-\s]?Code|事务码/i.test(s.exampleCode || ''));
        if (tcStep) {
          tcStep.exampleCode = tcStep.exampleCode.replace(
            /(\{\s*value\s*:\s*)(['"`])[\s\S]*?\2/,
            '$1$2$2',
          );
        }
        templateBody.apiGuide = { ...templateBody.apiGuide, steps: sliced };
      }
      delete templateBody.jsSource;
      delete templateBody.params;
      delete templateBody.source;
      templateId = tpl.templateId;
      templateBody.$schema = `Cloned from template "${templateId}" — edit fields on the next screen.`;
    }
  } catch { /* template fetch is best-effort */ }

  const idInput = h('input', { placeholder: t('cases.idPlaceholder') });
  const err = h('div', { class: 'muted', style: { color: 'var(--err)', minHeight: '18px' } });
  const m = modal({
    title: t('cases.newTitle'),
    body: h('div', {},
      h('div', { class: 'field' }, h('span', {}, t('cases.idLabel')), idInput),
      err,
      templateId
        ? h('div', { class: 'muted', style: { fontSize: '12px', color: 'var(--accent)' } },
            `Will pre-fill from template "${templateId}" (sapUrl / NL / apiGuide) and auto-seed cache. Edit title / NL on the next screen.`)
        : h('div', { class: 'muted', style: { fontSize: '12px' } },
            'No template configured (SAPTEST_TEMPLATE_CASE_ID empty) — new case will start blank.'),
    ),
    footer: h('div', { class: 'row', style: { marginLeft: 'auto' } },
      h('button', { class: 'btn primary', onClick: async () => {
        err.textContent = '';
        const newId = idInput.value.trim();
        if (!/^[a-zA-Z0-9_\-]+$/.test(newId)) { err.textContent = t('cases.idBadChars'); return; }
        const body = templateBody ?? {
          $schema: 'Parameters for new-case.spec.ts',
          title: '', sapUrl: '', transactionCode: '',
        };
        try {
          const r = await api.put('/api/cases/' + encodeURIComponent(newId), body);
          const cacheNote = r?.templateCache?.copied
            ? ' · template cache seeded'
            : (r?.templateCache?.reason ? ` · cache seed skipped (${r.templateCache.reason})` : '');
          toast(t('cases.created') + cacheNote, 'ok', 4000);
          m.close();
          // Navigate to detail page — that page has the full structured editor
          // (title / URL / NL / Parameters / generated JS preview / action bar).
          go('cases/' + encodeURIComponent(newId));
        } catch (e) { err.textContent = e.message; }
      }}, 'Create & open editor')),
  });
  // Auto-focus the id input so the user just types and hits enter.
  setTimeout(() => idInput.focus(), 0);
  idInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') m.querySelector?.('.btn.primary')?.click();
  });
}

// Raw JSON editor — kept for editing existing cases. The new-case flow uses
// the structured editor on the case detail page instead.
function openRawJsonEditor(id, initialRaw) {
  const idInput = h('input', { value: id, disabled: true });
  const ta = h('textarea', { style: { minHeight: '380px' } }, initialRaw);
  const err = h('div', { class: 'muted', style: { color: 'var(--err)', minHeight: '18px' } });
  const m = modal({
    title: t('cases.editTitle') + id,
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
        let parsed;
        try { parsed = JSON.parse(ta.value); } catch (e) { err.textContent = t('cases.jsonParseFail') + e.message; return; }
        try {
          await api.put('/api/cases/' + encodeURIComponent(id), parsed);
          toast(t('cases.saved'), 'ok');
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
    // Inline status tag — module-level statusTag() lives inside the
    // workbench closure and isn't reachable here.
    const statusCell = (st) => {
      if (st === 'passed') return h('span', { class: 'tag pass' }, 'PASS');
      if (st === 'failed') return h('span', { class: 'tag fail' }, 'FAIL');
      if (st === 'running') return h('span', { class: 'tag run' }, 'RUN');
      return h('span', { class: 'muted' }, '—');
    };
    for (const it of filtered) {
      const run = it.run || {};
      const caseLabel = run.caseTitle || run.caseId || '—';
      tbody.appendChild(h('tr', {},
        h('td', {}, h('span', { class: kindTagClass(it.kind) }, t('results.kind.' + it.kind))),
        h('td', { style: { maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: run.caseId || '' }, caseLabel),
        h('td', {}, statusCell(run.status)),
        h('td', { class: 'mono' }, run.durationMs != null ? fmtMs(run.durationMs) : '—'),
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
        h('th', {}, t('results.col.case')),
        h('th', {}, t('results.col.status')),
        h('th', {}, t('results.col.duration')),
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
    body.appendChild(renderHistoryTab(caseId, runsList.runs || [], caseData?.parsed?.cacheSlotConfig));
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

// Find the full `locator` string in `nl`. Returns the position right after
// the match, or -1 if not found.
//
// We DO NOT truncate the locator and retry — that used to allow loose matches
// like "搜索输入框" → "搜索", which then mis-anchored to common occurrences of
// "搜索" elsewhere in NL (e.g. "在新页面点搜索图标" → captured value="图标").
// Strict full-match means some steps simply won't auto-sync. That's fine —
// the user can edit the param manually.
function findAnchorInNL(nl, locator) {
  if (!nl || !locator) return -1;
  const i = nl.indexOf(locator);
  return i >= 0 ? i + locator.length : -1;
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

  // Forward: param 改了 → NL 跟着改 (this direction is precise — we know the
  // old & new value strings exactly, just find/replace in NL).
  // Reverse (NL → params) is NOT done. NL is free-form text; trying to extract
  // structured values from it by parsing locator anchors is unreliable. The
  // canonical truth for param values lives in apiGuide.steps[].exampleCode
  // (defaults) and in the params object (overrides) — both edited explicitly
  // through the Parameters editor. Editing NL has no effect on params.
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

  if (nlChanged && !paramsChanged) console.log('[sync] NL changed only — NL is descriptive, no params auto-update (edit Parameters explicitly if needed)');
  else if (nlChanged && paramsChanged) console.log('[sync] both NL and params changed — leaving both as-is');
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
    // Cache Debug — opens the per-case slot-config modal (source pin +
    // per-step bypass + fail-slot tail-drop). Sits on the right side
    // just left of Save — it's a save-adjacent affordance (modifies
    // persisted per-case config, same as the Save button does).
    const topCacheDebugBtn = h('button', {
      class: 'btn primary',
      disabled: !canWrite || !stepCount,
      title: stepCount ? 'Configure pass / fail cache slots — source pin, per-step exclude, fail-slot tail-drop' : 'apiGuide is empty — generate it first',
      onClick: () => openCacheDebugModal(caseData.id),
    }, 'Cache Debug');
    wrap.appendChild(h('div', {
      class: 'row',
      style: { gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
    }, topRunJsBtn, topRunJsCacheBtn, topGenApiBtn, h('span', { class: 'spacer' }), topCacheDebugBtn, topSaveBtn, topDeleteBtn));

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
        ? 'NL is descriptive only — editing it does NOT change params (use the Parameters editor ' +
          'below for that) and does NOT invalidate the cache. apiGuide value defaults / titles / ' +
          'descriptions are also ignored by the hash; only locator / step structure changes ' +
          'invalidate. Sleep / wait steps are ignored too. Exception: T Code value IS in the hash.'
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

    // Read-only: API guide step list. Label shows the API the runner ACTUALLY
    // calls (parsed from exampleCode), not the midsceneApi classification —
    // which sometimes diverges for "拖到最X端" type scroll steps that get
    // rewritten to aiAct. A small "planned: aiScroll" tag is shown when they
    // differ so you can still see the LLM's original intent.
    if (parsed.apiGuide?.steps?.length) {
      const stepsList = h('ol', {
        class: 'mono',
        style: { fontSize: '12px', maxHeight: '300px', overflow: 'auto', paddingLeft: '44px', margin: '6px 0 0 0' },
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
      wrap.appendChild(h('details', { open: true, style: { marginBottom: '10px' } },
        h('summary', { class: 'muted' },
          'API guide steps · ' + parsed.apiGuide.steps.length +
          ' (read-only — labels show what runner actually calls; "planned" = LLM classification)'),
        stepsList,
      ));
    }

    // Read-only: JS assembled from apiGuide steps. This is the script the
    // runner actually evals per-step (or that Desktop used to display under
    // "生成的 JS" before each run). Collapsed by default — most users only
    // need to see the structured step list above; this block is for when
    // they want to copy/paste the actual executable JS.
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

      wrap.appendChild(h('details', { style: { marginBottom: '10px' } },
        h('summary', { class: 'muted' },
          '生成的 JS (from apiGuide · ' + parsed.apiGuide.steps.length + ' steps, ' +
          generatedJs.length + ' chars)'),
        h('pre', {
          class: 'code-block',
          style: { maxHeight: '320px', overflow: 'auto', fontSize: '12px', margin: '6px 0 0 0' },
        }, generatedJs),
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

  // Raw JSON — always collapsed by default, regardless of case shape. The
  // structured editor above covers almost all routine edits; users only
  // need raw JSON for unusual structural tweaks.
  const rawToggle = h('button', { class: 'btn ghost sm' }, t('params.showRaw'));
  const rawTa = h('textarea', { style: { minHeight: '320px' }, disabled: !hasPerm('cases:write') }, caseData.raw);
  rawTa.addEventListener('input', markDirty);
  const rawWrap = h('div', { class: 'raw-json', style: { display: 'none' } },
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
      style: { fontSize: '12px', maxHeight: '420px', overflow: 'auto', paddingLeft: '44px', margin: 0 },
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
          f.slot && h('span', {
            class: 'tag',
            style: { marginLeft: '6px', fontSize: '10px' },
          }, String(f.slot).toUpperCase()),
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
function renderHistoryTab(caseId, runs, cacheSlotConfig) {
  const wrap = h('div', { class: 'card' });
  // Track which run is currently pinned as each slot's source. 'auto'
  // (or unset) means no pin — the runner picks the latest matching
  // snapshot at run-start time. Used to highlight the pinned row and
  // toggle the pin button labels.
  const passSource = cacheSlotConfig?.pass?.source ?? 'auto';
  const failSource = cacheSlotConfig?.fail?.source ?? 'auto';
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

    // Which cache slot this run used (used by the pin buttons + for
    // legacy back-compat). Legacy runs derive slot from useCache.
    const slot = r.cacheSlot ?? (r.useCache === true ? 'pass' : r.useCache === false ? 'fail' : null);

    // Pin buttons — let the user nominate THIS run as the source for
    // either cache slot. When pinned, the runner reads from this run's
    // snapshot (run-history/cache-snapshots/<runId>.cache.yaml) for
    // subsequent cached / raw runs. Click again to unpin (revert to
    // auto = latest matching).
    const isPinnedPass = passSource === r.runId;
    const isPinnedFail = failSource === r.runId;
    const pinPassBtn = h('button', {
      class: 'cache-pin-btn slot-pass' + (isPinnedPass ? ' is-pinned' : ''),
      title: isPinnedPass
        ? 'Currently pinned as PASS cache source — click to revert to auto'
        : 'Pin this run as the PASS cache source (used by Run-with-cache)',
      type: 'button',
      onClick: async () => {
        try {
          await api.put('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/cache-debug', {
            pass: {
              source: isPinnedPass ? 'auto' : r.runId,
              excludeSteps: cacheSlotConfig?.pass?.excludeSteps || [],
            },
            fail: cacheSlotConfig?.fail || {},
          });
          toast(isPinnedPass ? 'Pass slot reset to auto' : 'Pinned as PASS cache source', 'ok');
          render();
        } catch (e) { toast(e.message, 'err'); }
      },
    }, isPinnedPass ? '★ pass' : '☆ pass');
    const pinFailBtn = h('button', {
      class: 'cache-pin-btn slot-fail' + (isPinnedFail ? ' is-pinned' : ''),
      title: isPinnedFail
        ? 'Currently pinned as FAIL cache source — click to revert to auto'
        : 'Pin this run as the FAIL cache source (used by Run raw)',
      type: 'button',
      onClick: async () => {
        try {
          await api.put('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/cache-debug', {
            pass: cacheSlotConfig?.pass || {},
            fail: {
              source: isPinnedFail ? 'auto' : r.runId,
              excludeSteps: cacheSlotConfig?.fail?.excludeSteps || [],
              dropTailCount: cacheSlotConfig?.fail?.dropTailCount ?? 2,
            },
          });
          toast(isPinnedFail ? 'Fail slot reset to auto' : 'Pinned as FAIL cache source', 'ok');
          render();
        } catch (e) { toast(e.message, 'err'); }
      },
    }, isPinnedFail ? '★ fail' : '☆ fail');

    const row = h('tr', {
      // Subtle row-level tint when this run is the active source for a slot.
      class: (isPinnedPass ? 'cache-pinned-pass ' : '') + (isPinnedFail ? 'cache-pinned-fail' : ''),
    },
      h('td', {}, fmtDate(r.startedAt)),
      h('td', {},
        h('span', { class: 'tag ' + (ok ? 'ok' : 'err') },
          ok ? t('history.status.passed') : t('history.status.failed')),
        // Only show the pin button that matches this row's outcome —
        // passed runs can be pinned as the PASS cache source, failed
        // runs as the FAIL cache source. Pinning a failed run as the
        // pass source (or vice-versa) is almost always a mistake, so
        // we hide that option entirely.
        ' ',
        ok ? pinPassBtn : pinFailBtn,
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

// ──────────────────────────────────────────────────────────────────────────
// Cache Debug modal — per-case configuration of the two cache slots
// (pass + fail). Lets the user:
//   · Source each slot from "auto" (latest snapshot of the matching kind)
//     or from a specific past run's snapshot.
//   · Exclude individual steps from cache (per-step "force re-plan" that
//     persists across runs, unlike the per-run bypass toggles in the
//     Run modal).
//   · For the fail slot: override the default "drop last N steps" count.
// Talks to GET/PUT /api/midscene-js/cases/:id/cache-debug.
// ──────────────────────────────────────────────────────────────────────────
async function openCacheDebugModal(caseId) {
  let data;
  try {
    data = await api.get('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/cache-debug');
  } catch (e) {
    return toast(e.message, 'err');
  }

  // Mutable working copies of the two slot configs (server-side normalized).
  const draft = {
    pass: { source: data.pass.source, excludeSteps: new Set(data.pass.excludeSteps || []) },
    fail: {
      source: data.fail.source,
      excludeSteps: new Set(data.fail.excludeSteps || []),
      dropTailCount: Number(data.fail.dropTailCount ?? 2),
    },
  };

  // ── Helper: snapshot picker dropdown for a slot ──────────────────
  // Filters the global snapshots list by status preference (passes for
  // pass slot, failures for fail slot) but always shows all snapshots
  // available — the preferred ones float to the top.
  const buildSnapshotOptions = (slot) => {
    const preferStatus = slot === 'pass' ? 'passed' : 'failed';
    const opts = [];
    opts.push(h('option', { value: 'auto' }, slot === 'pass'
      ? 'Auto (latest passed snapshot)'
      : 'Auto (latest failed snapshot)'));
    const preferred = data.snapshots.filter((s) => s.status === preferStatus && s.hasFile);
    const others   = data.snapshots.filter((s) => s.status !== preferStatus && s.hasFile);
    const fmtSnap = (s) => {
      const date = s.finishedAt ? new Date(s.finishedAt).toISOString().replace('T', ' ').slice(5, 16) : '?';
      const sz = s.sizeBytes != null ? `${Math.round(s.sizeBytes / 1024)}kB` : '?';
      return `${s.runId.slice(-12)} · ${date} · ${s.status} · ${sz}`;
    };
    if (preferred.length) {
      const og = h('optgroup', { label: `── ${preferStatus} runs ──` });
      preferred.forEach((s) => og.appendChild(h('option', { value: s.runId }, fmtSnap(s))));
      opts.push(og);
    }
    if (others.length) {
      const og = h('optgroup', { label: '── other runs ──' });
      others.forEach((s) => og.appendChild(h('option', { value: s.runId }, fmtSnap(s))));
      opts.push(og);
    }
    return opts;
  };

  // ── Per-slot column UI ─────────────────────────────────────────────
  const buildColumn = (slot) => {
    const cfg = draft[slot];
    const isPass = slot === 'pass';
    const currentFile = isPass ? data.currentPassFile : data.currentFailFile;
    const sourceSel = h('select', {
      style: { width: '100%' },
      onChange: (e) => { cfg.source = e.target.value; },
    }, ...buildSnapshotOptions(slot));
    sourceSel.value = cfg.source;

    let dropTailInp = null;
    if (!isPass) {
      dropTailInp = h('input', {
        type: 'number', min: '0', max: '20', step: '1',
        value: String(cfg.dropTailCount),
        style: { width: '64px' },
        onChange: (e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n >= 0) cfg.dropTailCount = n;
        },
      });
    }

    const stepChecks = data.apiGuideSteps.map((s) => {
      const isExcluded = cfg.excludeSteps.has(s.order);
      const chk = h('input', {
        type: 'checkbox',
        checked: isExcluded,
        onChange: (e) => {
          if (e.target.checked) cfg.excludeSteps.add(s.order);
          else cfg.excludeSteps.delete(s.order);
          countLabel.textContent = `${cfg.excludeSteps.size} of ${data.apiGuideSteps.length} excluded`;
        },
      });
      return h('label', {
        class: 'row',
        style: { gap: '8px', alignItems: 'center', padding: '3px 6px', borderRadius: '4px' },
        title: s.midsceneApi,
      },
        chk,
        h('span', { class: 'mono small', style: { width: '28px', color: 'var(--muted)' } }, String(s.order).padStart(2, '0')),
        h('span', { style: { flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, s.title || s.midsceneApi),
      );
    });

    const stepList = h('div', {
      style: { maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--input)', borderRadius: '6px', padding: '4px' },
    }, ...stepChecks);

    const selectAllBtn = h('button', {
      class: 'btn sm ghost', type: 'button',
      onClick: () => {
        data.apiGuideSteps.forEach((s) => cfg.excludeSteps.add(s.order));
        stepChecks.forEach((label) => { label.querySelector('input').checked = true; });
        countLabel.textContent = `${cfg.excludeSteps.size} of ${data.apiGuideSteps.length} excluded`;
      },
    }, 'Exclude all');
    const selectNoneBtn = h('button', {
      class: 'btn sm ghost', type: 'button',
      onClick: () => {
        cfg.excludeSteps.clear();
        stepChecks.forEach((label) => { label.querySelector('input').checked = false; });
        countLabel.textContent = `${cfg.excludeSteps.size} of ${data.apiGuideSteps.length} excluded`;
      },
    }, 'Include all');

    const countLabel = h('span', { class: 'muted small' },
      `${cfg.excludeSteps.size} of ${data.apiGuideSteps.length} excluded`);

    const headerColor = isPass ? 'hsl(var(--info))' : 'hsl(35 85% 50%)';
    const slotFileNote = currentFile.exists
      ? `${Math.round(currentFile.sizeBytes / 1024)} kB · updated ${currentFile.mtime ? new Date(currentFile.mtime).toISOString().slice(0, 16).replace('T', ' ') : '?'}`
      : '(not yet created — runs in this slot will start from empty)';

    return h('div', {
      style: {
        flex: '1', minWidth: '0',
        border: '1px solid var(--input)', borderRadius: '8px',
        padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
      },
    },
      h('div', { style: { borderLeft: `3px solid ${headerColor}`, paddingLeft: '10px' } },
        h('div', { class: 'mono', style: { fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: headerColor, fontWeight: 700 } },
          isPass ? 'PASS CACHE  ·  gold' : 'FAIL CACHE  ·  scratchpad'),
        h('div', { class: 'muted small', style: { marginTop: '3px' } },
          isPass
            ? '"Run with cache" reads this. Conservative — only updated by passing runs.'
            : '"Run raw" writes here when keepCacheOnFailure=on. Work-in-progress.'),
        h('div', { class: 'muted small mono', style: { marginTop: '3px' } }, slotFileNote),
      ),
      h('div', { class: 'field' },
        h('span', {}, 'Source snapshot'),
        sourceSel,
      ),
      !isPass && h('div', { class: 'field' },
        h('span', {}, 'Drop last N steps from snapshot'),
        h('div', { class: 'row', style: { gap: '8px', alignItems: 'center' } },
          dropTailInp,
          h('span', { class: 'muted small' }, '(default 2 · scrubs bad xpaths from steps adjacent to the failure point)'),
        ),
      ),
      h('div', { class: 'field' },
        h('div', { class: 'row', style: { gap: '8px', alignItems: 'center' } },
          h('span', {}, 'Exclude these steps from cache (force re-plan)'),
          h('span', { class: 'spacer' }),
          countLabel,
          selectAllBtn,
          selectNoneBtn,
        ),
        stepList,
      ),
    );
  };

  const passCol = buildColumn('pass');
  const failCol = buildColumn('fail');

  const saveBtn = h('button', { class: 'btn primary' }, 'Save');
  const resetBtn = h('button', { class: 'btn ghost' }, 'Reset to defaults');
  const m = modal({
    title: 'Cache Debug · ' + (data.caseId || caseId),
    wide: true,
    body: h('div', {
      style: { display: 'flex', gap: '14px', alignItems: 'stretch' },
    }, passCol, failCol),
    footer: h('div', { class: 'row', style: { marginLeft: 'auto', gap: '8px' } }, resetBtn, saveBtn),
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset both slots to defaults (Auto source · no excludes · fail dropTail=2)?')) return;
    draft.pass = { source: 'auto', excludeSteps: new Set() };
    draft.fail = { source: 'auto', excludeSteps: new Set(), dropTailCount: 2 };
    m.close();
    openCacheDebugModal(caseId); // re-render by re-opening; cheap
  });

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      await api.put('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/cache-debug', {
        pass: { source: draft.pass.source, excludeSteps: [...draft.pass.excludeSteps] },
        fail: {
          source: draft.fail.source,
          excludeSteps: [...draft.fail.excludeSteps],
          dropTailCount: draft.fail.dropTailCount,
        },
      });
      toast('Cache slot config saved', 'ok');
      m.close();
    } catch (e) {
      toast(e.message, 'err');
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
    }
  });
}

async function generateApiGuide(caseId) {
  toast('Generating API guide (本地规则拆分)…', 'info', 4000);
  try {
    const r = await api.post('/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/api-guide');
    const n = r?.apiGuide?.steps?.length ?? 0;
    const w = r?.apiGuide?.warnings?.length ?? 0;
    const cleared = Array.isArray(r?.clearedParamKeys) ? r.clearedParamKeys.length : 0;
    const clearedNote = cleared > 0 ? ` · cleared ${cleared} stale param override${cleared === 1 ? '' : 's'}` : '';
    toast(`apiGuide saved · ${n} steps · ${w} warning${w === 1 ? '' : 's'}${clearedNote}`, 'ok', 6000);
    render();
  } catch (e) {
    toast(e.message, 'err', 7000);
  }
}

// `opts.followRunId`: skip the Start flow and immediately attach to a run
// that is already in flight (re-opened from the bottom-right "active runs"
// badge). The modal becomes a watch-only view — Abort still works, Start
// is hidden, and polling drives the step/log/status updates until the run
// disappears from /api/midscene-js/runs/active (= finished).
async function openJsRunModal(caseId, cacheMode, opts = {}) {
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
  // "Keep cache even if the run fails" toggle.
  //   Run raw (write mode):  default ON  — raw runs are exploratory; you
  //     usually want each LLM-relocate attempt to accumulate into the fail
  //     cache slot so the NEXT raw run can replay them. The runner also
  //     auto-strips the failing tail (default last 2 steps) before the
  //     keep so bad xpaths from the dying step don't pollute the slot.
  //   Run with cache (read mode):  default OFF  — you're already replaying
  //     a validated pass cache; if it fails, the safe move is to roll back
  //     so the next run still has the gold copy. Flip ON only when you
  //     want to preserve mid-run LLM patches.
  const keepCacheChk = h('input', { type: 'checkbox', checked: cacheMode === 'write' });
  // Capped-height + internal scroll log viewer. Auto-scrolls to bottom on
  // every textContent update unless the user has scrolled up manually
  // (we detect "near bottom" before the write; if the user was looking at
  // earlier output, we leave their scroll position alone).
  const consoleEl = h('pre', {
    class: 'code-block',
    style: {
      minHeight: '120px',
      maxHeight: '60vh',          // ~60% of viewport — fits long logs without pushing footer off-screen
      overflowY: 'auto',          // scrollable
      overflowX: 'auto',
      margin: 0,
      fontSize: '12px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
  }, '(idle)');
  // Watch textContent assignments / appends and snap to bottom when the user
  // was already near the bottom. Uses MutationObserver so we don't have to
  // touch every site that writes to consoleEl.
  const autoScrollPre = () => {
    const distFromBottom = consoleEl.scrollHeight - consoleEl.clientHeight - consoleEl.scrollTop;
    consoleEl.dataset.stickBottom = distFromBottom < 40 ? '1' : '0';
  };
  consoleEl.addEventListener('scroll', autoScrollPre);
  consoleEl.dataset.stickBottom = '1';
  new MutationObserver(() => {
    if (consoleEl.dataset.stickBottom === '1') {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }).observe(consoleEl, { childList: true, characterData: true, subtree: true });
  const statusEl = h('div', { class: 'muted', style: { minHeight: '20px' } },
    cacheMode === 'read' ? 'Will replay using existing cache (read-write).' : 'Will record fresh cache (write-only).');
  const startBtn = h('button', { class: 'btn primary' },
    cacheMode === 'read' ? 'Start (cached)' : 'Start (no cache)');
  const abortBtn = h('button', { class: 'btn danger', disabled: true, title: 'Abort the in-flight run (closes browser handles)' }, 'Abort');
  const reportLinkBox = h('div', { class: 'muted', style: { minHeight: '20px' } });

  // Per-step "force re-plan" checkboxes — only useful in cache=read mode,
  // where the default is to replay every cached locator. Checking a step
  // tells the server to strip THAT step's cache entry before the run, so
  // Midscene cache-misses on it and re-LLMs that one locator. Other steps
  // still hit cache as normal.
  //
  // Drag/scroll steps (aiAct / aiScroll) default to BYPASS-ON. They're the
  // most cache-fragile class — exact-prompt match required for the Plan
  // entry, and SAP scrollbar element positions shift between sessions, so
  // cached locates often resolve to stale xpaths. User can uncheck per step
  // if they're confident the cache is fresh.
  function isDragLikeStep(step) {
    const api = String(step?.midsceneApi || '').toLowerCase();
    if (api.includes('aiact') || api.includes('aiscroll')) return true;
    const code = String(step?.exampleCode || '');
    return /\bagent\.(aiAct|aiScroll)\s*\(/.test(code);
  }
  const stepBypassChecks = new Map(); // step.order → checkbox element
  // `opts.initialBypass`: a plain object `{ [stepOrder]: boolean }` letting the
  // caller seed the per-step bypass checkboxes. The workbench passes its
  // step-list checkbox state through here so what the user ticked on the
  // workbench preview shows up pre-applied in this modal.
  const seededBypass = opts.initialBypass && typeof opts.initialBypass === 'object' ? opts.initialBypass : null;
  const stepsList = h('ol', { class: 'mono', style: { fontSize: '12px', maxHeight: '320px', overflow: 'auto', paddingLeft: '44px' } },
    ...apiGuide.steps.map((s) => {
      const actual = displayApiFromStep(s);
      const planned = plannedApiTagIfDifferent(s);
      const defaultBypass = isDragLikeStep(s);
      const seededVal = seededBypass && (s.order in seededBypass) ? !!seededBypass[s.order] : null;
      const initialChecked = seededVal !== null ? seededVal : defaultBypass;
      const bypassChk = cacheMode === 'read'
        ? h('input', {
            type: 'checkbox',
            checked: initialChecked,
            style: { marginLeft: '8px', verticalAlign: 'middle' },
            title: defaultBypass
              ? 'Drag/scroll step — defaulting to bypass cache (cache is fragile here). Uncheck to use cache anyway.'
              : 'Force re-plan: strip this step\'s cache entry before run, so it re-LLMs even though cache is enabled',
            // Live-sync back to the workbench's per-step state so toggles
            // made here immediately reflect in the list-mode step rows
            // (and any future bypassSnapshot reads from this case).
            onChange: (e) => {
              try { opts.onBypassChange?.(s.order, !!e.target.checked); } catch {}
            },
          })
        : null;
      if (bypassChk) stepBypassChecks.set(s.order, bypassChk);
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
        bypassChk && h('label', {
          class: 'muted small',
          style: { marginLeft: '6px', cursor: 'pointer', color: defaultBypass ? 'var(--warn, #b45309)' : undefined },
        }, bypassChk, defaultBypass ? ' bypass cache (drag default)' : ' bypass cache'),
      );
    }),
  );

  const followRunId = opts.followRunId ?? null;
  if (followRunId) {
    startBtn.style.display = 'none';
    statusEl.textContent = 'Re-attaching to live run…';
  }

  // Tracked at modal scope so onClose can clearInterval — fixes a leak where
  // closing the modal mid-run left the poller firing forever.
  let pollHandle = null;

  const m = modal({
    title: (followRunId ? 'Follow JS run · ' : 'JS run · ') + (parsed.title ?? caseId)
      + (followRunId ? '' : ' · cache=' + cacheMode),
    wide: true,
    body: h('div', {},
      h('div', { class: 'field' },
        h('span', {}, 'Run options'),
        h('label', { class: 'row', style: { gap: '6px' } }, headedChk, h('span', {}, 'headed (show browser window)')),
        h('label', {
          class: 'row switch-row',
          style: { gap: '10px', alignItems: 'center' },
          title: 'When ON, partial cache writes from a failed run are kept (next cached run will reuse them). When OFF, failed runs roll back to the pre-run cache snapshot (pass-only-keep policy, default).',
        },
          h('span', { class: 'switch' }, keepCacheChk, h('span', { class: 'switch-track' })),
          h('span', {}, 'keep cache even if run fails'),
        ),
      ),
      h('div', { class: 'field' }, h('span', {}, 'API guide steps (' + apiGuide.steps.length + ')'), stepsList),
      h('div', { class: 'field' }, h('span', {}, 'Status'), statusEl),
      h('div', { class: 'field' }, h('span', {}, 'Console (tail)'), consoleEl),
      reportLinkBox,
    ),
    footer: h('div', { class: 'row', style: { marginLeft: 'auto', gap: '8px' } }, abortBtn, startBtn),
    onClose: () => { if (pollHandle) { clearInterval(pollHandle); pollHandle = null; } },
  });

  let activeRunId = followRunId;
  if (followRunId) abortBtn.disabled = false;
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

  // Polling loop — used by both the Start path (new run) and the follow path
  // (re-attach to an in-flight run). Looks up the right active entry by
  // runId when known (follow), else by caseId (Start path before runId is
  // discovered). Calls onFinish() when the entry disappears from the active
  // list — caller decides whether to await the run POST or self-terminate.
  let lastLogIdx = 0;
  function startPolling(onFinish) {
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(async () => {
      try {
        const r = await api.get('/api/midscene-js/runs/active');
        const mine = activeRunId
          ? r.active.find((a) => a.runId === activeRunId)
          : r.active.find((a) => a.caseId === caseId);
        if (!mine) {
          if (activeRunId && onFinish) onFinish();
          return;
        }
        activeRunId = mine.runId;
        abortBtn.disabled = false;
        const step = mine.currentStep;
        statusEl.textContent =
          'Running — step ' + (step?.order ?? '?') + '/' + mine.totalSteps +
          (step ? ` (${step.api}: ${truncForStatus(step.title, 50)})` : '') +
          '  · ' + Math.round(mine.elapsedMs / 100) / 10 + 's elapsed';
        for (const li of stepsList.children) {
          li.style.background = li.dataset.stepOrder === String(step?.order ?? -1) ? 'rgba(80,140,255,0.18)' : '';
        }
        const fresh = mine.logTail.slice(lastLogIdx);
        if (fresh.length) {
          consoleEl.textContent += (consoleEl.textContent ? '\n' : '') + fresh.map((l) => l.line).join('\n');
          consoleEl.scrollTop = consoleEl.scrollHeight;
          lastLogIdx = mine.logTail.length;
        }
      } catch { /* ignore poll errors */ }
    }, 1500);
  }

  // Follow mode: run is already in flight, just start polling and stop when
  // the entry disappears from the active list (= run ended).
  if (followRunId) {
    startPolling(() => {
      clearInterval(pollHandle);
      pollHandle = null;
      statusEl.textContent = 'Run finished. Open the History tab on the case page for the report.';
      abortBtn.disabled = true;
    });
  }

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    abortBtn.disabled = true;
    abortBtn.textContent = 'Abort';
    statusEl.textContent = 'Launching browser…';
    consoleEl.textContent = '';
    activeRunId = null;
    lastLogIdx = 0;

    // Collect per-step bypass-cache choices before we close the modal.
    const noCacheSteps = [];
    for (const [order, chk] of stepBypassChecks.entries()) {
      if (chk.checked) noCacheSteps.push(order);
    }

    // Fire the run POST in the background and switch immediately to the
    // Cinema view. The server starts the run + writes to
    // /api/midscene-js/runs/active, where Cinema's own polling picks it up
    // and follows step-by-step. We don't await here so the user lands in
    // the cinema page as soon as they click Run, instead of staring at this
    // modal for the full run duration.
    const runPromise = api.post(
      '/api/midscene-js/cases/' + encodeURIComponent(caseId) + '/run?cache=' + encodeURIComponent(cacheMode),
      { headed: headedChk.checked, noCacheSteps, keepCacheOnFailure: keepCacheChk.checked },
    );

    // Tear down the modal and open cinema in a NAMED tab. If a cinema tab
    // is already open from a previous run, it will be focused + navigated
    // to this case (no new tab spawned). Original workbench tab stays put.
    m.close();
    openCinemaTab(caseId);
    toast(LANG === 'zh' ? '已开始运行 · 直播标签页已打开' : 'Run started · live tab opened/focused', 'info', 2800);

    // Still await the result in the background so a finish-toast pops once
    // the server returns the final record. No DOM updates needed — modal
    // is detached, cinema handles its own UI.
    runPromise
      .then((r) => {
        const run = r.run;
        toast(run.status === 'passed' ? 'Run passed' : 'Run failed', run.status === 'passed' ? 'ok' : 'err');
      })
      .catch((e) => toast(e.message, 'err'));
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
    // Hide the floating badge while cinema is open — it overlaps the
    // filmstrip and the cinema view already has its own LIVE indicator.
    const inCinema = location.hash.startsWith('#/cinema/');
    if (!r.active.length || inCinema) {
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
      const row = h('div', {
        style: { marginTop: '4px', borderTop: '1px solid #333', paddingTop: '4px', cursor: 'pointer' },
        title: 'Click to reopen the run progress window',
      },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('span', { style: { flex: 1 } }, (a.caseTitle || a.caseId) + ' · ' + elapsedS + 's'),
          abortBtn,
        ),
        h('div', { style: { opacity: 0.75 } },
          step ? `step ${step.order}/${a.totalSteps} · ${step.api}: ${truncForStatus(step.title, 38)}`
               : '(launching…)'),
      );
      row.addEventListener('click', (ev) => {
        // The Abort button already stopPropagation()'s, but guard anyway.
        if (ev.target === abortBtn || abortBtn.contains?.(ev.target)) return;
        openJsRunModal(a.caseId, 'read', { followRunId: a.runId });
      });
      badge.appendChild(row);
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


