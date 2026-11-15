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

## 待办 / 下一步

- [ ] 用 zhimaAi/BookToSkill 跑一本样书做 spike,对照 D5/D7 看差距
- [ ] 设计 reader 元技能的抽取模板(七块骨架 → references/note.md)
- [ ] 设计笔记 skill 的 `description` 模板(人读 + Pi 可检索)
- [ ] 选定第一本验证书
- [ ] 打通 `sl-yang-dl/skills` 的 `install.sh` 激活流程
