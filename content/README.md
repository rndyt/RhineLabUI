# 博客内容

文章来源为 Obsidian `Blog` 目录，通过 `npm run sync:blog` 同步到 `posts/obsidian/`。
来源、属性、附件及发布步骤见 [同步说明](../docs/OBSIDIAN_SYNC.md)。

不要手工修改同步文章；`.obsidian-sync-manifest.json` 记录稳定编号和地址，必须保留并提交。
其他 `posts/**/*.md` 可手工维护，但要满足 [元数据格式](../README.md#写文章)。

`archives.json` 与 `public/archives/` 由构建脚本生成，Astro 内容集合读取同一份档案数据，
生成 `/blog/` 和 `/posts/<slug>/`。开发服务器会监听项目 Markdown 的增删改，构建也会自动生成。
历史样例已移至 `reference/blog-samples/`，不参与发布。
