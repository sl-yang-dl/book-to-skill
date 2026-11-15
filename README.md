# book-to-skill

把书变成「你读得懂的读书笔记 skill」。

## 目标

一个 **Pi 原生元技能(reader)**:喂一本书 → 产出一份「读书笔记」,这份笔记本身是 Pi skill 格式
(`SKILL.md` + `references/`),以后任何 AI 会话可自动加载,当作**个人知识库**使用。

## 与 zhimaAi/BookToSkill 的差异(本项目定位)

| | zhimaAi/BookToSkill | 本项目 |
|---|---|---|
| 服务对象 | 机器(RAG 检索优先) | **你本人**读懂 + 日后 Pi 加载 |
| 产物 | JSONL 知识点索引(TITLE/SUMMARY/KEYWORD/QUESTION/EVIDENCE)+ 检索脚本 | 七块笔记骨架,尤其**个人综合块** |
| 模型能否写自己的理解 | 明令禁止("Do not write content") | **要求**写连接/应用/疑问 |
| 人读吗 | JSONL + 脚本,人不爱读 | 你自己也要看 → 必须人读友好 |

**本质**:它是"书的检索索引",你是"你读过的证据 + 个人知识沉淀"。它能产出"这本书讲了啥、问啥答啥",
但结构上产不出"它和我已有的 X 有什么关系 / 我能拿它做啥 / 我哪里不同意"。

## 已锁定决策(来自 grill-me 会话)

- **D1** 笔记 skill = 知识库型,**自己看 + Pi 自动加载**,双用。
- **D2** 结构 = 薄 `SKILL.md`(`description` 写满书主题)+ `references/` 放抽取知识(wiki 式)。
- **D3** 加载机制 v1 先手动,自动路由后续再议。
- **D4** MVP = reader 元技能 + 1 本样板笔记 skill。
- **D5** 笔记骨架七块:核心论点 / 心智模型 / 论证证据 / 反例边界 / 与我连接 / 可执行下一步 / 未解问题。
- **D6** 综合块(5/6/7)**自选**——v1 先 faithful 抽取,综合留用户填。
- **D7** 差异化定位:人读友好 + 强制综合的读书笔记 skill,非机器检索索引(待实测后最终敲定)。

## 进度日志

- **2026-11-15** 输入就绪:27 本写作类书已全部转成 markdown,存于 `/Users/sl_yang/Documents/book/写作的书/文本`(共 ~12.7 万行)。
- **2026-11-15** MVP 启动:
  - 选定第一本验证书 = 《写作这回事》(斯蒂芬·金;张坤译,2.8k 行,结构清晰、含标志性"工具箱"章)。
  - 设计 reader 元技能:`reader/SKILL.md` + `reader/references/note-template.md`(七块骨架模板)。
  - 跑通第一份笔记样例:`samples/写作这回事/`(薄 `SKILL.md` + `references/note.md`),块 1–4 faithful 抽取、块 5–7 留引导式空模板。
  - 初步验证 D5(七块骨架)成立:工具箱章天然对应"心智模型"块;D7(人读友好+强制综合)方向成立。

- **2026-11-15** 远端已建:`sl-yang-dl/book-to-skill`(私有),`main` 已 push。
- **2026-11-15** Spike 对照完成:见 `spike/comparison.md`。结论 **D7 成立**——BookToSkill 契约层只有 TITLE/SUMMARY/KEYWORD/QUESTION/EVIDENCE 且禁止模型写理解,块 5–7(与我连接/可执行/未解)是其根本无法覆盖的差异化壁垒。(注:受环境限制,BookToSkill 为契约级重建,未实时 run,覆盖度实测仍待补。)
- **2026-11-15** 《写作这回事》笔记块 5–7 已起草**待用户确认的草稿**(基于其"写作的书"收藏与 book-to-skill 项目上下文),用于检验综合块能否沉淀个人知识。

## 待办 / 下一步

- [x] 选定第一本验证书 → 《写作这回事》
- [x] 设计 reader 元技能的抽取模板(七块骨架 → references/note.md)
- [x] 设计笔记 skill 的 `description` 模板(人读 + Pi 可检索)
- [x] push 到远端(`sl-yang-dl/book-to-skill`,私有)
- [x] Spike:用 zhimaAi/BookToSkill 契约对照七块骨架,验证 D7(结论:成立)
- [ ] **用户确认/改写**《写作这回事》笔记块 5–7 草稿,真正沉淀个人综合
- [ ] (可选)实时 run BookToSkill 做覆盖度实测,补全 spike 缺口
- [ ] 挑第 2 本验证书(建议《一本小小的红色写作书》,需先解决其"标题结构丢失"的抽取问题)
- [ ] 打通 `sl-yang-dl/skills` 的 `install.sh` 激活流程
