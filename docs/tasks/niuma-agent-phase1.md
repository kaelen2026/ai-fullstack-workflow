# 接入 niuma Agent — Phase 1（GitHub 原生层）

## 背景

参考 `DeepLangAI/grain` 的 niuma 实现，接入一个 `@mention` 触发的"数字员工"Agent：在本仓 Issue / PR / 评论里 `@niuma`，或给 Issue 打 `niuma` label，即可拉起 GitHub Actions 跑 Claude Code，按本仓规则答疑 / 改代码 / 提 PR / 派活。

grain 的实现分两层；本期只做**层 1（GitHub 原生）**，自包含、不碰运行时代码。层 2（飞书 IM 桥）因 Cloudflare Workers 无法承载长连接，留待后续走 HTTP webhook 方案。

## 本期改动

| 文件 | 说明 |
|---|---|
| `.github/actions/claude-code/` | 从 grain 移植的复合 Action：包装 `anthropics/claude-code-base-action`，加 OAuth token 池轮换 + 401 重试、合并多个 system-prompt 文件、物理屏蔽 `ScheduleWakeup`。`action.yml` / `pick-token.sh` / `check-attempt.sh` 通用，原样移植。 |
| `.github/workflows/niuma.yml` | 运行时入口。已裁剪 grain 专属步骤（飞书 lark-cli、Google Ads MCP、内部 OSS 截图上传）。改用 `NIUMA_GITHUB_TOKEN`、base 默认 `dev`、pnpm+Node 22 工具链（与 `ci.yml` 一致）、report 步骤改为直接 dump 原始 JSON（去掉 grain 的 bun `format-turns.ts` 依赖）。保留 thread session 复用脚手架供 Phase 2。 |
| `.github/prompts/base-rules.md` | 公共底座：身份（中文、不暴露 AI 特征）、git 规范（PR 进 `dev`、不碰 `main`、Conventional Commits、本仓 scope）、项目上下文（Workers / pnpm / `.claude/rules` / `DESIGN.md`）、行为约束。 |
| `.github/prompts/niuma.md` | 使命书：能做什么 + 牛马场景硬约束。分支模型按 `workflow.md` 重写（`--base dev`、新分支起点 = `dev` HEAD、合并 PR 的条件）。 |

## 需要在仓库设置里提供

- **Secret `CLAUDE_CODE_OAUTH_TOKEN`**（必填）— 由 `claude setup-token` 生成。可选用 `CLAUDE_CODE_OAUTH_TOKEN_POOL`（多行 `token|weight`）做轮换。
- **Secret `NIUMA_GITHUB_TOKEN`**（必填）— 一个有 `contents/pull-requests/issues: write` 的 PAT，对应 niuma 的提交身份账号。
- **Variable `NIUMA_BOT_LOGIN`**（建议）— 上面 PAT 账号的 GitHub login，用于防回环过滤。未设则不做 sender 过滤。
- **Label `niuma`**（可选）— 用于"打 label 派活"通道。
- 把 `base-rules.md` 里 `git config user.name/email` 的占位换成实际 bot 账号。

## 验证

- YAML / 脚本语法自查。
- 真实端到端验证需上述 secrets 落位后，在测试 Issue 上 `@niuma` 触发观察一次 run。

## 后续（Phase 2，未做）

飞书 IM 桥：用飞书事件 HTTP webhook（而非 grain 的 `Lark.WSClient` 长连接）接入 `apps/api` 的一条 Hono 路由 → 复用移植版 dispatcher（纯 `fetch`+`crypto`，Workers 友好）→ `workflow_dispatch` 触发 `niuma.yml`。需要飞书自建应用凭据。
