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
    'results.title': '测试结果 / 报告',
    'results.empty': '尚无报告。',
    'results.col.kind': '类型',
    'results.col.name': '文件名',
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
    'results.title': 'Results & reports',
    'results.empty': 'No reports yet.',
    'results.col.kind': 'Type',
    'results.col.name': 'Filename',
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
function parseHash() {
  const raw = (location.hash || '#/dashboard').slice(2);
  const [view, ...rest] = raw.split('/').filter(Boolean);
  return { view: view || 'dashboard', params: { rest } };
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
const NAV = [
  { id: 'dashboard',  labelKey: 'nav.dashboard', sectionKey: 'nav.section.workspace', perm: null },
  { id: 'cases',      labelKey: 'nav.cases',     sectionKey: 'nav.section.workspace', perm: 'cases:read' },
  { id: 'run',        labelKey: 'nav.run',       sectionKey: 'nav.section.workspace', perm: 'results:read' },
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
  // mark active nav
  $$('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === route.view));
  // crumbs
  const crumbs = $('[data-bind=crumbs]');
  if (crumbs) {
    crumbs.innerHTML = '';
    crumbs.append(h('span', {}, 'SAPTest · '), h('strong', {}, navLabel(route.view)));
  }
  // view
  const viewEl = $('[data-bind=view]');
  viewEl.innerHTML = '';
  viewEl.appendChild(h('div', { class: 'muted' }, t('shell.loading')));
  Promise.resolve()
    .then(() => (VIEWS[route.view] || VIEWS.dashboard)(route))
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

  let casesCount = 0, lastRun = null, latest = null, mergedRuns = 0;
  try {
    if (hasPerm('cases:read')) {
      const cs = await api.get('/api/cases'); casesCount = cs.cases.length;
    }
    if (hasPerm('results:read')) {
      const rs = await api.get('/api/results'); lastRun = rs.lastRun; latest = rs.stats.latest; mergedRuns = rs.stats.mergedRuns;
    }
  } catch (e) { /* ignore */ }

  stats.append(
    statCard(t('dashboard.stat.cases'), casesCount,
      hasPerm('cases:read') ? t('dashboard.stat.casesHint') : t('dashboard.stat.casesNoPerm'),
      hasPerm('cases:read') ? () => go('cases') : null),
    statCard(t('dashboard.stat.runs'), mergedRuns,
      hasPerm('results:read') ? t('dashboard.stat.runsHint') : t('dashboard.stat.runsNoPerm'),
      hasPerm('results:read') ? () => go('results') : null),
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
        hasPerm('runs:execute') && h('button', { class: 'btn primary', onClick: () => go('run') }, t('dashboard.quick.run')),
        hasPerm('agent:use') && h('button', { class: 'btn', onClick: () => go('generate') }, t('dashboard.quick.gen')),
        hasPerm('cases:write') && h('button', { class: 'btn ghost', onClick: () => go('cases') }, t('dashboard.quick.cases')),
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
      h('div', { class: 'card-head' }, h('h2', {}, t('dashboard.report.title'))),
      latest
        ? h('div', {},
            h('div', { class: 'kv' },
              h('div', { class: 'k' }, t('dashboard.report.file')),    h('div', { class: 'mono' }, latest.name),
              h('div', { class: 'k' }, t('dashboard.report.created')), h('div', {}, fmtDate(latest.modifiedAt)),
              h('div', { class: 'k' }, t('dashboard.report.size')),    h('div', {}, fmtBytes(latest.bytes)),
            ),
            h('div', { class: 'row', style: { marginTop: '12px' } },
              h('a', { class: 'btn primary sm', href: latest.url, target: '_blank' }, t('dashboard.report.open')),
              h('button', { class: 'btn sm', onClick: () => openReportModal(latest) }, t('dashboard.report.preview')),
            ),
          )
        : h('div', { class: 'muted' }, t('dashboard.report.empty')),
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

function openReportModal(report) {
  modal({
    title: report.name,
    wide: true,
    body: h('iframe', {
      src: report.url,
      style: { width: '100%', height: 'calc(80vh - 110px)', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' },
    }),
  });
}

// ───────── View: Test Cases ─────────
VIEWS.cases = async () => {
  const wrap = h('div', { class: 'grid' });
  const [casesRes, specsRes] = await Promise.all([
    api.get('/api/cases'),
    api.get('/api/cases/_specs/list').catch(() => ({ specs: [] })),
  ]);

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
      : h('table', { class: 'tbl' },
          h('thead', {}, h('tr', {},
            h('th', {}, t('cases.col.id')),
            h('th', {}, t('cases.col.summary')),
            h('th', {}, t('cases.col.spec')),
            h('th', {}, t('cases.col.modified')),
            h('th', {}, t('cases.col.size')),
            h('th', { class: 'actions' }, t('cases.col.actions')),
          )),
          h('tbody', {}, casesRes.cases.map(c => h('tr', {},
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
              h('button', { class: 'btn sm', onClick: () => viewCase(c.id) }, t('cases.view')),
              ' ',
              hasPerm('cases:write') && h('button', { class: 'btn sm', onClick: () => editCase(c.id) }, t('cases.edit')),
              ' ',
              hasPerm('runs:execute') && c.specPath && h('button', {
                class: 'btn primary sm',
                onClick: () => { sessionStorage.setItem('runSpec', c.specPath); go('run'); },
              }, t('cases.run')),
              ' ',
              hasPerm('cases:delete') && h('button', { class: 'btn danger sm', onClick: () => deleteCase(c.id) }, t('cases.delete')),
            ),
          ))),
        ),
  ));

  if (specsRes.specs.length > 0) {
    wrap.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', {}, t('specs.title'))),
      h('div', { class: 'muted', style: { marginBottom: '10px', fontSize: '12.5px' } }, t('specs.desc')),
      h('table', { class: 'tbl' },
        h('thead', {}, h('tr', {},
          h('th', {}, t('specs.col.file')),
          h('th', {}, t('cases.col.modified')),
          h('th', {}, t('cases.col.size')),
          h('th', { class: 'actions' }, t('cases.col.actions')),
        )),
        h('tbody', {}, specsRes.specs.map(s => h('tr', {},
          h('td', {}, h('span', { class: 'mono' }, s.path)),
          h('td', {}, fmtRel(s.modifiedAt)),
          h('td', {}, fmtBytes(s.bytes)),
          h('td', { class: 'actions' },
            h('button', { class: 'btn sm', onClick: () => viewSpec(s.name) }, t('specs.col.viewCode')),
            ' ',
            hasPerm('runs:execute') && h('button', {
              class: 'btn primary sm',
              onClick: () => { sessionStorage.setItem('runSpec', s.path); go('run'); },
            }, t('cases.run')),
          ),
        ))),
      ),
    ));
  }
  return wrap;
};

async function viewCase(id) {
  const c = await api.get('/api/cases/' + encodeURIComponent(id));
  modal({
    title: t('cases.viewTitle') + id,
    wide: true,
    body: h('pre', { class: 'code-block' }, c.raw),
  });
}

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

// ───────── View: Run ─────────
let runWs = null;
VIEWS.run = async () => {
  const specs = (await api.get('/api/cases/_specs/list')).specs;
  const cached = sessionStorage.getItem('runSpec') || specs[0]?.path || '';
  sessionStorage.removeItem('runSpec');
  const sel = h('select', {},
    h('option', { value: '' }, t('run.selectSpec')),
    ...specs.map(s => h('option', { value: s.path, selected: s.path === cached }, s.path)),
  );
  const headedChk = h('input', { type: 'checkbox' });
  const startBtn = h('button', { class: 'btn primary' }, t('run.start'));
  const stopBtn  = h('button', { class: 'btn danger', disabled: true }, t('run.stop'));
  const statusEl = h('div', { class: 'muted', html: statusHtml({ running: false }) });
  const consoleEl = h('div', { class: 'console' });
  const reportLink = h('div', { class: 'muted' });

  function appendLog(entry) {
    const ln = h('div', { class: 'ln ' + (entry.stream || '') });
    const ts = new Date(entry.ts || Date.now()).toLocaleTimeString();
    ln.append(h('span', { class: 'ts' }, ts), entry.line || '');
    consoleEl.appendChild(ln);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
  function setStatus(s, report) {
    statusEl.innerHTML = statusHtml(s);
    startBtn.disabled = s.running || !hasPerm('runs:execute');
    stopBtn.disabled = !s.running || !hasPerm('runs:stop');
    if (report) {
      reportLink.innerHTML = '';
      reportLink.append(
        t('run.report'),
        h('a', { class: 'mono', href: report.url, target: '_blank' }, report.name),
        ' ',
        h('button', { class: 'btn sm', onClick: () => openReportModal(report) }, t('dashboard.report.preview')),
      );
    }
  }

  startBtn.addEventListener('click', async () => {
    if (!sel.value) return toast(t('run.pleaseSelect'), 'warn');
    consoleEl.innerHTML = '';
    reportLink.innerHTML = '';
    try {
      await api.post('/api/run/start', { spec: sel.value, headed: headedChk.checked });
      toast(t('run.started'), 'ok');
    } catch (e) { toast(e.message, 'err'); }
  });
  stopBtn.addEventListener('click', async () => {
    if (!confirm(t('run.confirmStop'))) return;
    try { await api.post('/api/run/stop', {}); toast(t('run.stopSent'), 'warn'); }
    catch (e) { toast(e.message, 'err'); }
  });

  // open WS
  try { runWs?.close(); } catch {}
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  runWs = new WebSocket(`${proto}://${location.host}/ws/run`);
  runWs.onmessage = (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.type === 'hello') {
      setStatus(msg.status);
      (msg.backlog || []).forEach(appendLog);
    } else if (msg.type === 'log') {
      appendLog(msg);
    } else if (msg.type === 'status') {
      setStatus(msg.status, msg.report);
    }
  };
  // initial fetch in case WS isn't open yet
  try { const s = await api.get('/api/run/status'); setStatus(s); } catch {}

  return h('div', { class: 'grid' },
    h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', {}, t('run.title')),
        statusEl,
      ),
      h('div', { class: 'row', style: { marginBottom: '12px' } },
        h('div', { class: 'field', style: { flex: '1', minWidth: '280px' } },
          h('span', {}, t('run.specFile')), sel,
        ),
        h('label', { class: 'row', style: { gap: '6px' } },
          headedChk, h('span', { class: 'muted' }, t('run.headed')),
        ),
        startBtn, stopBtn,
      ),
      consoleEl,
      h('div', { style: { marginTop: '10px' } }, reportLink),
    ),
  );
};

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

// ───────── View: Results ─────────
VIEWS.results = async () => {
  const r = await api.get('/api/results');
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, t('results.title'))),
    r.items.length === 0
      ? h('div', { class: 'muted' }, t('results.empty'))
      : h('table', { class: 'tbl' },
          h('thead', {}, h('tr', {},
            h('th', {}, t('results.col.kind')),
            h('th', {}, t('results.col.name')),
            h('th', {}, t('dashboard.report.created')),
            h('th', {}, t('cases.col.size')),
            h('th', { class: 'actions' }, t('cases.col.actions')),
          )),
          h('tbody', {}, r.items.map(it => h('tr', {},
            h('td', {}, h('span', { class: 'tag ' + (it.kind === 'merged' ? 'info' : '') }, it.kind)),
            h('td', {}, h('span', { class: 'mono', style: { fontSize: '11.5px' } }, it.name)),
            h('td', {}, fmtDate(it.timestamp)),
            h('td', {}, fmtBytes(it.bytes)),
            h('td', { class: 'actions' },
              h('a', { class: 'btn sm', href: it.url, target: '_blank' }, t('results.col.openTab')),
              ' ',
              h('button', { class: 'btn sm', onClick: () => openReportModal(it) }, t('dashboard.report.preview')),
            ),
          ))),
        ),
  );
};

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
