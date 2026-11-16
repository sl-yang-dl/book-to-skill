---
name: book-to-skill-publisher
description: >-
  把一本已解析好的读书笔记发布到在线网站(book-to-skill 的 GitHub Pages)。
  当读者说"更新网站""发布笔记""把这本书上线""同步站点""部署一下"时使用。
  前置条件:reader 已产出 samples/<书名>/SKILL.md + references/note.md。
---

# book-to-skill publisher(发布技能)

把 reader 产出的笔记同步进 VitePress 网站,并推送到 `main`,触发 GitHub Pages 自动部署。
让"解析完一本书 → 网站自动更新"形成闭环。

## 何时使用

- reader 解析完一本书,需要让网站立即出现这本笔记。
- 手动改了某本笔记,想刷新线上站点。
- 周期性"把所有笔记重新上线"。

## 前置条件

- `samples/<书名>/references/note.md` 已存在(reader 产出)。
- 本地已 `cd site && npm install` 过一次(仅首次)。

## 步骤

1. **同步(生成站点内容)**:在 `site/` 目录运行 `npm run sync`。
   它会扫描 `samples/`,生成 `site/books/<书名>.md`、`site/books/index.md` 与
   `site/.vitepress/books.json`(首页"笔记书架"的数据源)。`site/books/` 是生成物,已被 gitignore,**勿手改/勿提交**。
2. **本地校验(可选)**:`npm run dev` 看 `http://localhost:5173`,或
   `npm run build && npm run preview` 预览生产构建。
3. **提交并推送**:
   ```bash
   git add -A samples site scripts .github README.md
   git commit -m "docs: 新增《<书名>》笔记并更新站点"
   git push
   ```
   也可用便捷脚本:`cd site && npm run publish`(一条命令完成同步+提交+推送)。
4. **等 CI**:push 到 `main` 后,GitHub Actions(`.github/workflows/deploy.yml`)会自动
   `build` 并部署到 GitHub Pages。进度见仓库 **Actions** 页;
   站点地址:`https://sl-yang-dl.github.io/book-to-skill/`。

## 注意

- 仅 push 到 `main` 会触发部署;草稿阶段用分支,成熟后再合入 `main`。
- 私有仓库需设为**公开**(GitHub Free 限制)或升级到 Pro/Team/Enterprise,否则 Pages 不发布。
- 站点基路径为 `/book-to-skill/`(由 CI 注入 `VP_BASE`);本地 `base` 为 `/`,不影响开发预览。

## 与 reader 的关系

reader 负责"书 → 笔记 skill";本技能负责"笔记 skill → 上线"。
reader 在产出笔记后可调用本技能完成发布,形成自动闭环。
