# iStudio V3 — v0 界面设计原型

2026-11-17。本仓库从 `KnightCodeSquareMatrix/i-studio` 的提交 `9c8a21d65562b8dcd45cf23464b22c2c984a7a91` 中提取 `docs/mock-studio-v3`，用于在 v0 中继续设计现有界面。保留原型完整代码、交互、测试、依赖锁文件和六份演示素材；不包含正式后端、完整灵感图库、临时文件或原仓库 Git 历史。

这是可交互 Mock，所有生成、账户和推广功能的模拟边界见下文；本次提取没有修改页面设计或业务交互。

## v0 / Vercel 导入

- 仓库：`KnightCodeSquareMatrix/i-studio-v0`，分支：`main`。
- **Root Directory：仓库根目录 `.`**，这里直接包含 `package.json` 和 `vite.config.ts`。
- 框架：Vite；安装命令：`npm ci`；构建命令：`npm run build`；构建输出：`dist`。
- 本机启动：`npm run dev`。当前配置仅监听回环地址；云预览的服务启动参数由平台配置。
- 图片均在 `public/assets/`，Mock 不依赖原仓库的服务端灵感图库。

本轮流程与职责调整见 [职责划分、参考调查与验收边界](flow-responsibilities.md)。普通图片创作直接生成；创作方案通过六类要素引导补充，再确认逐张提示词。

## 启动与验证

```powershell
cd i-studio-v0
npm ci
npm run dev
```

开发预览：`http://127.0.0.1:5176/`。仅监听本机；端口固定，已占用时明确报错。

- `npm run build`：TypeScript 类型检查和 Vite 构建。
- `npm test`：Node 内置测试运行器，状态转换与恢复回归。
- `node tests/ui-smoke.mjs`：Playwright 浏览器场景；使用正在运行的开发服务。`PLAYWRIGHT_MODULE` 可指定本机已有 Playwright 包的绝对目录，`PLAYWRIGHT_CHROMIUM` 可指定 Chromium 可执行文件；没有设置则使用本地标准 Playwright 安装。
- 浏览器脚本在 `tests/.artifacts/` 写入结果 JSON、窄屏截图和失败截图；目录已忽略，不提交运行产物。

完成条件是：代表页面可见、核心交互可点击、桌面和窄屏无文档横向溢出、输入与结果可恢复、模拟和真实能力边界明确。详细覆盖及验证结果见 `coverage.md`。

## 布局与页面

- 单层全局侧栏：首页、图片创作、创作方案、灵感模板、我的资产、我的提示词。账户、邀请与优惠、帮助在下方。
- 桌面采用约 204 px 导航、380 px 输入区、其余宽度为结果区。输入与结果独立滚动；主按钮固定；输入区可收起。
- 五类电商任务保留在创作方案横向页签。图片创作保留六模式并直接生成；灵感按输入要求带入文生图或图生图。创作方案先填写六项要素，再编辑、勾选逐张提示词；更新要素时可保留原方案或明确覆盖重整。
- 手机使用导航抽屉；图片创作切换输入与结果，方案创作切换补充要素、提示词方案与生成结果；预览页可直接进入下一步。工具页签横向滚动。
- 结果支持逐张完成、中断、失败与重试、预览、收藏、保存、继续创作、局部重绘／圈画入口。规划可修改标题、要求及是否生成。
- 我的资产仅展示显式保存的作品与上传素材；结果保留在草稿和创作记录，重复保存不会新增重复作品。素材与作品支持搜索、收藏、项目整理、两图对比和本地文件下载。编辑图可以叠加笔迹与调整亮度后导出 PNG。
- 提示词支持分类、标签、收藏、内容编辑、变量、版本恢复、编辑草稿、回收站和参数预设。

## 数据与模拟边界

状态保存在当前浏览器的 `localStorage`，键为 `istudio-layout-v3`，没有账户级隔离、服务端持久化或真实鉴权。不同项目、工具、模式保存自己的草稿和结果；切换工具、套用灵感前先保存来源草稿。刷新会将未完成任务标为中断，绝不自动重试。

本原型没有 AI 调用，没有费用、余额变动、返利、优惠发放或真实投稿。生成计时器只展示已有本地素材；图像卡片中的构图文案为浏览器排版，下载“示例原图”不含这层文字。原图下载保留真实图片扩展名，手动编辑导出为真正的 PNG。

- 局部重绘／圈画：保存真实用户笔迹，执行的生成仍为模拟；不声明图像模型已遵从修改。
- GIF：参数与播放／暂停仅为 CSS 动效预览，未生成 GIF 文件，不提供伪造 `.gif` 下载。
- SVG：预览与下载使用已有的真实 `botanical.svg` 示例，未接入矢量生成模型。
- 图片反推：明确显示示例文本，支持编辑、复制、保存、带入，未调用识图服务。
- 账户：仅演示登录状态、签到记录与入口；没有真实登录注册、积分流水。
- 返利／优惠：仅保留入口、记录空态、未配置说明；正式规则仍以规格 Q1/Q2 为准，不填入比例或金额。
- 管理后台本轮未改版；相关能力保留在现有应用／V2，不能计作 V3 已覆盖。

上传只接受 JPG、PNG、WebP，单张最多 2 MB；本地存储满时界面明确显示保存失败。原型不上传图片到任何服务器。

## 设计依据与代码来源

原始研究中实际查看过的竞品截图位于原工作区 `.artifacts/competitor-layout-2026-11-17/`。SeeAny 参考固定操作区与示例／结果分工；EzPic 参考输入—分析／规划—生成的阶段；HookShot 参考紧凑输入与整套结果预览。mlxh 仅查看首页，未获取登录后的任务界面，因此不把其内部流程当成依据。原型没有复制竞品代码或图片。

组件来自官方免费 React 源码：`https://github.com/untitleduico/react`，固定提交 `0e7b80a65e3db80c06951427870cb8ba5c6c476f`，MIT 许可原文保留在 `UNTITLED-LICENSE`；文件清单在 `untitled-source.json`。不包含 PRO 组件或付费模板。实际使用 Button、Input、Select、Badge、Checkbox、FileUploadDropZone，弹窗基于 React Aria。

本地修改通过 `patch-untitled.mjs` 记录，可重复应用：Button / ButtonUtility 参数类型、ComboBox 图标类型适配 TypeScript 6，文件上传文案与无障碍名称改为中文。其余官方源码保持原样。`vendor-untitled.mjs` 下载固定版本后自动应用这些修改。

图片复制自已有 V2 的六份本地演示素材；不新增对外使用许可判断，正式发布前仍需沿原素材来源核对授权。

产品范围沿用原仓库的[产品目标](https://github.com/KnightCodeSquareMatrix/i-studio/blob/9c8a21d65562b8dcd45cf23464b22c2c984a7a91/docs/product-vision.md)、[功能规格](https://github.com/KnightCodeSquareMatrix/i-studio/blob/9c8a21d65562b8dcd45cf23464b22c2c984a7a91/specs/001-ecommerce-workbench/spec.md)和[基座保留清单](https://github.com/KnightCodeSquareMatrix/i-studio/blob/9c8a21d65562b8dcd45cf23464b22c2c984a7a91/specs/001-ecommerce-workbench/preservation-baseline.md)。本仓库记录界面原型，不建立新的产品规则。
