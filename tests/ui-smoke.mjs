import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const modulePath = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = require(modulePath);
const { expect } = require(modulePath + '/test');
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {}) });
const artifacts = resolve('tests/.artifacts'); await mkdir(artifacts, { recursive: true });
const report = [];
async function run(name, fn, mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
  const page = await context.newPage(); page.setDefaultTimeout(6000); const errors = []; page.on('pageerror', error => errors.push(error.message));
  try { await page.goto('http://127.0.0.1:5176'); await fn(page); if (errors.length) throw Error(errors.join('\n')); report.push({ name, pass: true }); console.log('PASS', name); }
  catch (error) { report.push({ name, pass: false, error: String(error) }); console.error('FAIL', name, String(error)); await page.screenshot({ path: resolve(artifacts, name + '-failure.png') }); }
  finally { await context.close(); }
}
const close = page => page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
const nav = async (page, name) => {
  const open = await page.locator('.app-shell.nav-open').count();
  if (name === '展开导航' && open) return;
  const inSidebar = page.locator('aside').getByRole('button', { name, exact: true });
  if (open && await inSidebar.count()) { await inSidebar.click(); return; }
  const buttons = page.getByRole('button', { name, exact: true });
  for (let i = 0; i < await buttons.count(); i++) { const candidate = buttons.nth(i); const box = await candidate.boundingBox(); if (box && box.x >= 0 && box.x < page.viewportSize().width) { await candidate.click(); return; } }
  await page.getByRole('button', { name: '展开导航', exact: true }).click(); await inSidebar.click();
};
const commerce = async page => { if (!await page.getByRole('textbox', { name: '主体与特征', exact: true }).count()) await nav(page, '创作方案'); };
const fillBrief = async page => { await commerce(page); for (const [name, value] of [['主体与特征', '透明方形香氛瓶，金色瓶盖'], ['表达重点/用途', '突出木质香调，用作商品主图']]) { const field = page.getByRole('textbox', { name, exact: true }); if (!await field.inputValue()) await field.fill(value); } };
const addSource = async page => { if (!await page.getByRole('img', { name: '参考图片 1', exact: true }).count()) { await nav(page, '添加图片'); await page.getByRole('dialog').getByRole('button', { name: '让光影，替产品说话', exact: true }).click(); } };
const plan = async page => { await fillBrief(page); await addSource(page); const button = page.getByRole('button', { name: /^(整理逐张提示词|查看逐张提示词)$/ }); await button.click(); };
const generate = page => nav(page, '确认方案并生成');
await run('01-plan-generation-export', async page => {
  await plan(page); await page.getByRole('textbox', { name: '第 1 张主题', exact: true }).fill('测试主视觉');
  const checkbox = page.getByRole('checkbox', { name: '生成第 6 张', exact: true }); await checkbox.focus(); await page.keyboard.press('Space'); await expect(checkbox).not.toBeChecked();
  await generate(page); await expect(page.getByRole('button', { name: '预览氛围展示' })).toBeVisible(); await expect(page.getByRole('button', { name: /^预览/ })).toHaveCount(5);
  await nav(page, '预览测试主视觉'); await expect(page.getByRole('dialog')).toBeVisible(); const downloaded = page.waitForEvent('download'); await nav(page, '下载示例原图'); const file = await downloaded; if (!file.suggestedFilename().endsWith('.webp')) throw Error('Wrong extension'); await close(page);
  await nav(page, '保存整套'); await nav(page, '我的资产'); await expect(page.getByRole('button', { name: /^预览/ })).toHaveCount(5);
});
await run('02-refresh-interruption', async page => {
  await plan(page); await generate(page); await page.reload(); await expect(page.getByText('上次创作已中断，完成的图片已保留。你可以逐张重试。')).toBeVisible(); await expect(page.getByText('正在创作这张图片')).toHaveCount(0);
  await page.getByRole('button', { name: '重试这张', exact: true }).first().click(); await expect(page.getByRole('button', { name: '预览首屏主视觉' })).toBeVisible();
});
await run('03-partial-failure-retry', async page => {
  await nav(page, '帮助与反馈'); await page.getByText('预览说明与状态演示', { exact: true }).click(); await page.getByRole('button', { name: /下次生成的演示状态/ }).click(); await page.getByRole('option', { name: '第 2 张失败，其他完成' }).click(); await close(page);
  await plan(page); await generate(page); await expect(page.getByRole('button', { name: '预览规格信息' })).toBeVisible(); await expect(page.getByText('这张图片生成失败')).toBeVisible(); await nav(page, '重试这张'); await expect(page.getByRole('button', { name: '预览核心卖点' })).toBeVisible();
});
await run('04-task-draft-preservation', async page => {
  await commerce(page); await page.getByRole('textbox', { name: '补充原始描述' }).fill('主图草稿A'); await page.getByRole('tab', { name: '商品详情', exact: true }).click(); await page.getByRole('textbox', { name: '补充原始描述' }).fill('详情草稿B'); await page.getByRole('tab', { name: '商品主图', exact: true }).click(); await expect(page.getByRole('textbox', { name: '补充原始描述' })).toHaveValue('主图草稿A'); await page.reload(); await expect(page.getByRole('textbox', { name: '补充原始描述' })).toHaveValue('主图草稿A');
});
await run('05-inspiration-requires-product', async page => {
  await nav(page, '灵感模板'); await page.getByRole('textbox', { name: '搜索灵感' }).fill('护肤'); await expect(page.getByRole('heading', { name: '干净柔和的护肤视觉' })).toBeVisible(); await nav(page, '使用'); await expect(page.getByRole('tab', { name: '图生图', exact: true })).toHaveAttribute('aria-selected', 'true'); await expect(page.getByRole('img', { name: '参考图片 1' })).toHaveCount(0); await expect(page.getByRole('button', { name: '开始生成', exact: true })).toBeDisabled(); await expect(page.getByText('请先添加参考图片。', { exact: true })).toBeVisible();
});
await run('06-prompt-variable-version-trash', async page => {
  await nav(page, '我的提示词'); await nav(page, '新建提示词'); await page.getByRole('textbox', { name: '提示词名称' }).fill('测试变量'); await page.getByRole('textbox', { name: '提示词内容' }).fill('{{商品}}在{{场景}}'); await nav(page, '保存提示词');
  await nav(page, '编辑测试变量'); await page.getByRole('textbox', { name: '提示词内容' }).fill('{{商品}}在{{场景}}，柔和侧光'); await nav(page, '保存提示词');
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: '测试变量', exact: true }) }); await card.getByRole('button', { name: '带入创作' }).click(); await page.getByRole('textbox', { name: '商品', exact: true }).fill('香氛'); await page.getByRole('textbox', { name: '场景', exact: true }).fill('庭院'); await page.getByRole('dialog').getByRole('button', { name: '带入创作' }).click(); await expect(page.getByRole('textbox', { name: '补充原始描述' })).toHaveValue('香氛在庭院，柔和侧光');
  await nav(page, '我的提示词'); await nav(page, '删除测试变量'); await nav(page, '回收站'); await nav(page, '恢复提示词'); await nav(page, '全部'); await expect(page.getByRole('heading', { name: '测试变量', exact: true })).toBeVisible();
});
await run('07-upload-and-edit-png', async page => {
  await nav(page, '我的资产'); await nav(page, '上传素材'); await page.getByLabel('上传图片文件', { exact: true }).setInputFiles(resolve('public/assets/skincare.webp')); await page.getByRole('tab', { name: '上传素材', exact: true }).click(); await nav(page, '预览skincare.webp'); await nav(page, '编辑与标记'); await nav(page, '标记中心区域'); const promise = page.waitForEvent('download'); await nav(page, '导出编辑图 PNG'); const file = await promise; if (!file.suggestedFilename().endsWith('.png')) throw Error('Edit export not PNG');
});
await run('08-markup-and-svg', async page => {
  await nav(page, '图片创作'); await page.getByRole('tab', { name: '局部重绘', exact: true }).click(); await addSource(page); await page.getByRole('textbox', { name: '画面描述', exact: true }).fill('调整中央光线'); await expect(page.getByRole('button', { name: '开始生成', exact: true })).toBeDisabled(); await expect(page.getByText('请先在图片上标记需要修改的位置。')).toBeVisible(); await nav(page, '标记中心区域'); await nav(page, '开始生成'); await expect(page.getByRole('button', { name: '预览局部重绘 01' })).toBeVisible();
  await page.getByRole('tab', { name: 'SVG 矢量', exact: true }).click(); await expect(page.getByRole('button', { name: '添加图片' })).toHaveCount(0); await page.getByRole('textbox', { name: '矢量图形描述', exact: true }).fill('简洁的植物叶片图标'); await nav(page, '开始生成'); await expect(page.getByRole('button', { name: '预览SVG 矢量 01' })).toBeVisible(); await nav(page, '预览SVG 矢量 01'); const promise = page.waitForEvent('download'); await nav(page, '下载 SVG'); const file = await promise; if (!file.suggestedFilename().endsWith('.svg')) throw Error('SVG download wrong');
});
await run('09-mobile-layout-navigation', async page => {
  const checkWidth = async () => { if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Horizontal overflow'); };
  await nav(page, '创作方案'); await checkWidth(); await expect(page.getByRole('button', { name: '整理逐张提示词' })).toBeVisible(); await fillBrief(page); await page.getByRole('tab', { name: '提示词方案', exact: true }).click(); await expect(page.getByText('组合提示词预览')).toBeVisible(); await checkWidth(); await nav(page, '整理逐张提示词'); await expect(page.getByRole('textbox', { name: '第 1 张提示词', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: '确认方案并生成', exact: true })).toBeDisabled(); await page.getByRole('tab', { name: '补充要素', exact: true }).click(); await addSource(page); await nav(page, '查看逐张提示词'); await expect(page.getByRole('textbox', { name: '第 1 张提示词' })).toBeVisible(); await checkWidth(); await generate(page); await expect(page.getByRole('button', { name: '预览规格信息' })).toBeVisible(); await checkWidth();
  await nav(page, '展开导航'); await nav(page, '我的提示词'); await expect(page.getByRole('heading', { name: '我的提示词', exact: true })).toBeVisible(); await nav(page, '新建提示词'); await expect(page.getByRole('dialog')).toBeVisible(); await checkWidth(); await close(page);
}, true);
await run('10-submission-feedback-announcement', async page => {
  await nav(page, '灵感模板'); await nav(page, '我的投稿'); await page.getByRole('textbox', { name: '投稿标题' }).fill('光影练习'); await page.getByRole('textbox', { name: '提示词内容' }).fill('柔和侧光'); await nav(page, '提交审核'); await nav(page, '撤回'); await expect(page.getByText('已撤回', { exact: true })).toBeVisible(); await nav(page, '修改后重提'); await nav(page, '提交审核'); await expect(page.getByText('待审核', { exact: true })).toBeVisible(); await close(page);
  await nav(page, '查看公告'); await nav(page, '标记已读'); await close(page); await nav(page, '查看公告'); await expect(page.getByRole('button', { name: '已读，可随时重看' })).toBeVisible(); await close(page);
  await nav(page, '帮助与反馈'); await page.getByRole('textbox', { name: '告诉我们哪里可以更好' }).fill('工作台布局反馈'); await nav(page, '提交反馈'); await page.getByText('我的反馈 · 1', { exact: true }).click(); await expect(page.getByText('工作台布局反馈', { exact: true })).toBeVisible();
});
await run('11-inspiration-retains-original-draft', async page => {
  await commerce(page); await page.getByRole('tab', { name: '商品详情', exact: true }).click(); await page.getByRole('textbox', { name: '补充原始描述' }).fill('详情草稿不能丢失'); await nav(page, '灵感模板'); await page.getByRole('textbox', { name: '搜索灵感' }).fill('护肤'); await nav(page, '使用'); await nav(page, '创作方案'); await page.getByRole('tab', { name: '商品详情', exact: true }).click(); await expect(page.getByRole('textbox', { name: '补充原始描述' })).toHaveValue('详情草稿不能丢失');
});
await run('12-retry-refresh-history', async page => {
  await plan(page); await generate(page); await page.reload(); await page.getByRole('button', { name: '重试这张', exact: true }).first().click(); await page.reload(); await expect(page.getByText('正在创作这张图片')).toHaveCount(0); await expect(page.getByText('上次创作已中断，完成的图片已保留。你可以逐张重试。')).toBeVisible(); await nav(page, '创作记录'); await expect(page.getByRole('dialog')).toContainText('已中断');
});
await run('13-asset-metadata-survives-tool-switch', async page => {
  await plan(page); await generate(page); await expect(page.getByRole('button', { name: '预览规格信息' })).toBeVisible(); await nav(page, '收藏首屏主视觉'); await nav(page, '保存整套'); await page.getByRole('tab', { name: '商品详情', exact: true }).click(); await nav(page, '我的资产'); await nav(page, '整理首屏主视觉'); await page.getByRole('dialog').getByRole('button', { name: '日常产品拍摄', exact: true }).click(); await nav(page, '取消收藏首屏主视觉'); await nav(page, '创作方案'); await page.getByRole('tab', { name: '商品主图', exact: true }).click(); await expect(page.getByRole('button', { name: '收藏首屏主视觉', exact: true })).toBeVisible(); await nav(page, '预览首屏主视觉'); await expect(page.getByRole('dialog')).toContainText('日常产品拍摄');
});

await run('14-direct-creation-and-empty-state', async page => {
  await nav(page, '图片创作'); await expect(page.getByRole('button', { name: '再生成', exact: true })).toHaveCount(0); await expect(page.getByLabel('创作方案阶段')).toHaveCount(0); await expect(page.getByRole('button', { name: '确认方案并生成' })).toHaveCount(0); await expect(page.getByRole('button', { name: '添加图片' })).toHaveCount(0); await page.getByRole('textbox', { name: '画面描述', exact: true }).fill('白色背景上的咖啡杯'); await nav(page, '开始生成'); await expect(page.getByRole('button', { name: '预览文生图 01' })).toBeVisible(); await expect(page.getByRole('button', { name: '再生成', exact: true })).toBeVisible(); await nav(page, '我的资产'); await expect(page.getByRole('button', { name: /^预览/ })).toHaveCount(0);
});
await run('15-six-fields-hand-edit-review-and-refresh', async page => {
  await fillBrief(page); for (const [name, value] of [['场景与背景', '浅色石材台面'], ['构图与视角', '正面近景'], ['光线与风格', '柔和侧光'], ['文字与限制', '不添加文字']]) await page.getByRole('textbox', { name, exact: true }).fill(value);
  await expect(page.getByText('已补充 6 / 6 项')).toBeVisible(); await expect(page.locator('.prompt-copy')).toContainText('场景与背景：浅色石材台面'); await addSource(page); await nav(page, '整理逐张提示词'); const manual = '只使用这个手写完整提示词，保留原瓶盖'; await page.getByRole('textbox', { name: '第 1 张提示词', exact: true }).fill(manual); await page.getByRole('textbox', { name: '第 1 张主题', exact: true }).fill('手写主图'); await nav(page, '补充要素'); await page.getByRole('textbox', { name: '场景与背景', exact: true }).fill('自然庭院'); await nav(page, '查看逐张提示词'); await expect(page.getByRole('textbox', { name: '第 1 张提示词', exact: true })).toHaveValue(manual); await expect(page.getByRole('button', { name: '确认方案并生成', exact: true })).toBeDisabled(); await page.reload(); await expect(page.getByRole('textbox', { name: '第 1 张提示词', exact: true })).toHaveValue(manual); await nav(page, '保留原方案'); await generate(page); await expect(page.getByRole('button', { name: '预览手写主图' })).toBeVisible(); await nav(page, '预览手写主图'); await expect(page.getByRole('dialog')).toContainText(manual); await close(page);
});
await run('16-explicit-assets-save-idempotency', async page => {
  await plan(page); await generate(page); await expect(page.getByRole('button', { name: '预览规格信息' })).toBeVisible(); await nav(page, '我的资产'); await expect(page.getByRole('button', { name: /^预览/ })).toHaveCount(0); await nav(page, '创作方案'); await nav(page, '保存整套'); await expect(page.getByRole('button', { name: '已保存整套', exact: true })).toBeDisabled(); await nav(page, '预览首屏主视觉'); await expect(page.getByRole('button', { name: '已保存到我的资产', exact: true })).toBeDisabled(); await nav(page, '收藏作品'); await close(page); await nav(page, '我的资产'); await expect(page.getByRole('button', { name: /^预览/ })).toHaveCount(6); await expect(page.getByRole('button', { name: '取消收藏首屏主视觉' })).toBeVisible(); await page.reload(); await expect(page.getByRole('button', { name: /^预览/ })).toHaveCount(6);
});
await run('17-generation-input-gates-and-explicit-update', async page => {
  await fillBrief(page); await nav(page, '整理逐张提示词'); await expect(page.getByRole('button', { name: '确认方案并生成', exact: true })).toBeDisabled(); await expect(page.getByText('生成前请先添加商品原图。', { exact: true })).toBeVisible(); await addSource(page); await expect(page.getByRole('button', { name: '确认方案并生成', exact: true })).toBeEnabled(); await page.getByRole('textbox', { name: '第 1 张提示词', exact: true }).fill('手工版本'); await page.getByRole('textbox', { name: '场景与背景', exact: true }).fill('新背景'); await nav(page, '更新方案（覆盖逐张编辑）'); const value = await page.getByRole('textbox', { name: '第 1 张提示词', exact: true }).inputValue(); if (!value.includes('新背景') || value.includes('手工版本')) throw Error('Explicit update did not replace plan'); await page.getByRole('tab', { name: '爆款复刻', exact: true }).click(); await fillBrief(page); await addSource(page); await nav(page, '整理逐张提示词'); await expect(page.getByRole('button', { name: '确认方案并生成', exact: true })).toBeDisabled(); await expect(page.getByText('爆款复刻生成前还需要一张独立的构图参考图。', { exact: true })).toBeVisible();
});

await browser.close(); await writeFile(resolve(artifacts, 'smoke-results.json'), JSON.stringify({ at: new Date().toISOString(), report }, null, 2)); console.log(`${report.filter(r => r.pass).length}/${report.length} scenarios passed`); if (report.some(r => !r.pass)) process.exitCode = 1;
