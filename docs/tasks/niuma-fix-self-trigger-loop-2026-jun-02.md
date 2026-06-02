# niuma agent 自触发回环 — 排查与修复

- 触发来源：Issue #17（niuma 端到端验证）
- 日期：2026-jun-02
- 关联 PR：#19

## 现象

Issue #17 上，niuma 在回完一条「hi」后，workflow 又被拉起了一次，且这次的「触发载体」竟是 niuma 自己上一条 `<!-- niuma -->` 进度评论。时间线坐实自触发：

- niuma 评论 `4601330603` 创建于 `2026-06-02T10:08:36Z`
- 新 workflow run `26812974787` 创建于 `2026-06-02T10:08:39Z`（+3s）

## 根因（两个因素叠加）

1. **行为**：niuma 那条进度评论在描述链路时写了召唤字符串的字面量（``\`@niuma\` 触发 → eyes``）。`issue_comment` 触发条件是 `contains(comment.body, '<召唤字符串>')`，命中。
2. **配置/结构**：本仓 niuma 的 PAT（`NIUMA_GITHUB_TOKEN`）属于 `kaelen2026`，与召唤者是**同一 GitHub 账号**。于是 `github.event.sender.login != vars.NIUMA_BOT_LOGIN` 这道防回环闸恒为真（sender 永远是召唤者），**无法区分「人在召唤」与「niuma 在回复」**。

两者叠加 → 每条含召唤字符串的 niuma 评论都会再拉起一次 workflow，形成回环。

## 已落地修复（PR #19，行为层）

在 `.github/prompts/niuma.md` 加硬约束：niuma 自产的评论 / PR body / Issue body / review 禁止出现召唤字符串字面量，需提及时用反引号拆开或改写。同账号场景下这是可直接落地（不需特殊 token）的防线。

## 建议的补充修复（workflow 层，需 workflow-scope token）

更彻底、与账号/内容无关的防线：让触发条件排除带 `<!-- niuma -->` marker 的载体。niuma 所有评论恒以此 marker 开头，人类诉求不会。改 `.github/workflows/niuma.yml` 需要带 `workflow` scope 的 token（niuma 当前 PAT 无此 scope，push 被拒），故以现成 patch 形式交维护者应用：

```diff
@@ jobs.niuma.if @@
       (
         github.event.sender.login != vars.NIUMA_BOT_LOGIN &&
         (
-          (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@niuma')) ||
-          (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@niuma')) ||
-          (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@niuma')) ||
-          (github.event_name == 'issues' && (github.event.action == 'opened' || github.event.action == 'edited') && contains(github.event.issue.body, '@niuma')) ||
-          (github.event_name == 'pull_request' && (github.event.action == 'opened' || github.event.action == 'edited') && contains(github.event.pull_request.body, '@niuma'))
+          (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@niuma') && !contains(github.event.comment.body, '<!-- niuma -->')) ||
+          (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@niuma') && !contains(github.event.comment.body, '<!-- niuma -->')) ||
+          (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@niuma') && !contains(github.event.review.body, '<!-- niuma -->')) ||
+          (github.event_name == 'issues' && (github.event.action == 'opened' || github.event.action == 'edited') && contains(github.event.issue.body, '@niuma') && !contains(github.event.issue.body, '<!-- niuma -->')) ||
+          (github.event_name == 'pull_request' && (github.event.action == 'opened' || github.event.action == 'edited') && contains(github.event.pull_request.body, '@niuma') && !contains(github.event.pull_request.body, '<!-- niuma -->'))
         )
       )
```

## 另需维护者确认的配置

- `vars.NIUMA_BOT_LOGIN` 当前未对 `kaelen2026` 生效（同账号导致 sender 闸失效）。最干净的长期方案是给 niuma 配**独立 bot 账号**的 PAT 并把 `NIUMA_BOT_LOGIN` 设为该账号——届时 sender 闸恢复有效，人/机可区分。
- 该 PAT 还缺 `workflow` scope，niuma 因此无法自助修改 `.github/workflows/*`（本次即受此限制）。是否补 scope 由维护者权衡（补了 niuma 能自改 CI，风险面也随之扩大）。
