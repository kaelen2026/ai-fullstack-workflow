<!--
PRs target `dev` (the protected default). Title must follow Conventional Commits,
e.g. `feat(web): add todo filtering`. Keep the PR focused — one logical change.
-->

## What & why

<!-- What does this change do, and why is it needed? Link any issue: Closes #123 -->

## Type

<!-- Delete the lines that don't apply. Match your commit type. -->

- feat — new feature
- fix — bug fix
- docs — documentation only
- refactor / perf / style — no behavior change
- chore / build / ci — tooling, deps, pipeline
- test — tests only

**Affected scope(s):** <!-- web · api · db · config · ci · deps · release · repo -->

## How to verify

<!-- Steps a reviewer can follow to confirm the change. Commands, URLs, the
     preview deploy (preview-<N>[-api].w3ctech.dev), screenshots for `web`. -->

## Checklist

- [ ] Title follows **Conventional Commits** (`type(scope): summary`)
- [ ] Ran `pnpm lint`, `pnpm check-types`, `pnpm build` locally (the CI gates)
- [ ] Branched off `dev` and targeting `dev`; branch is up to date with `dev`
- [ ] **Schema change?** Ran `pnpm db:generate` + `pnpm db:migrate`; migration committed
- [ ] **User-facing / releasable?** Added a changeset (`pnpm changeset`)
- [ ] Verified the **preview deploy** (or N/A for docs/config-only changes)
- [ ] All review threads will be resolved before merge (squash + linear history)
