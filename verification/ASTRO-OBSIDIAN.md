# Astro 与 Obsidian 同步验证

日期：2026-09-21。分支：codex/rhine-blog。

## 实现

- Astro 7.3.3 接管开发服务、静态路由和构建，内容集合读取经过共享校验的档案数据。
- 保留现有 Three.js 入口、Markdown 清理/目录规则、TXT 导出和 PWA 更新流程。
- 同步参考 PersonelPage，同源读取本机 Blog；本次同步 1 篇实际文章，分配 X-008。
- 历史示例移入 reference/blog-samples，旧编号不复用。未修改源笔记或 PersonelPage 后台发布任务。
- 本地 reference HTML 继续交给 Vite 转换模块；手机校准服务通过 Astro API 启动。

## 验证结果

- `npm run build`：通过；Astro 生成首页、文章目录和独立阅读页；TypeScript 通过。
- `npm run check:sync`：4 项通过，覆盖双链/标题锚点/附件、草稿过滤、代码原文、重复同步、删除与稳定编号、非同步文件保留、无效内容和路径拒绝、显式与自动编号共存。
- `npm run check:content`：13 项通过；实际 Markdown、JSON、Astro 输出正文与 TXT 一致。
- `npm run check:viewport`：通过。
- 临时加入/删除 Markdown：档案 JSON 和 Astro 页面随之新增/删除，旧页返回 404；临时文件已清理。
- `/reference/mobile-review.html` 在 Astro 开发服务和 5189 校准服务均返回 200。此项不代表实际 iPhone 性能测试。
- 浏览器检查：目录显示真实标题、日期及编号；阅读页代码块/表格/目录正常；点击“在三维档案中打开”显示 X-008、实际标题、摘要与模型。
- 生产预览：三维入口加载编译后的脚本，无开发工具栏；模型与详情正常。
- PWA 构建清单包含所有生成页面、TXT、两个带哈希模型和脚本样式；清单列出的文件全部存在。本次未模拟断网和跨版本升级。
- 构建仍提示 Three.js 客户端大 chunk，构建成功；本次未调整模型、画质或三维交互。

## 使用边界

- `npm run sync:blog` 显式同步本机来源；云端仅构建已提交快照，不访问本机目录。
- 未新增定时自动推送。MDX 不执行，笔记嵌入转为链接，提示块按普通引用显示。
- 至少保留一篇发布文章；全空时同步报错并保留上次输出。
- 原笔记重命名需维护清单路径键，才能保留此前编号及 URL。
