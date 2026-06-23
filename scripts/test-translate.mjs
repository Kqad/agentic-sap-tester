import 'dotenv/config';
import { translateChineseToEnglish } from '../server/lib/translation.js';

const strings = [
  '点击visualization',
  '启用show Ok code field',
  '在 company code 字段 输入 8540',
  '勾选 List assets 复选框',
  '点击 Execute 按钮执行查询',
  '在查询到的Asset History Sheet页面中滑动到最右边',
  '从查询结果表格中读取 Curr.bk.val.列，保存为变量 A1',
  '返回 SAP 主页',
  '展开 Favorites 文件夹并选择 Asset Balances',
  '如果变量 A1 和 A2 相等，则测试用例执行成功，否则失败',
];

console.log(`Translating ${strings.length} strings…`);
const t0 = Date.now();
const out = await translateChineseToEnglish(strings);
const ms = Date.now() - t0;

console.log(`\nDone in ${ms}ms:\n`);
for (const s of strings) {
  const t = out[s];
  console.log(`  ${s}`);
  console.log(`    → ${t || '(unchanged)'}\n`);
}
