import { test, expect } from './fixture';

test.beforeEach(async ({ page }) => {
  page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://www.bing.com');
  await page.waitForLoadState('networkidle');
});

test('Midscene 冒烟用例：在 Bing 搜索 Midscene', async ({
  ai,
  aiQuery,
  aiAssert,
}) => {
  // ai() —— 自然语言执行一连串动作
  await ai('在搜索框输入 "Midscene github"，按下回车');

  // aiQuery() —— 从页面提取结构化数据
  const firstResult = await aiQuery<{ title: string; url: string }>(
    '返回搜索结果中第一条的标题(title)和链接(url)',
  );
  console.log('first result =>', firstResult);

  // aiAssert() —— 自然语言断言
  await aiAssert('搜索结果中至少有一条提到了 midscene 或 github');
});
