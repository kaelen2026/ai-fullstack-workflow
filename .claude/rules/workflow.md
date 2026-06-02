# Workflow rules

How changes land in this repo. `dev` is the default + protected branch — no direct pushes, PR required, CI must pass, linear history. `main` is production and allows **direct pushes** (promote `dev` → `main` to release; see [Production](#production)).

## Branch

- Always branch off an up-to-date `dev`. Never commit directly to `dev` — open a PR.
- Name branches `type/short-description` matching the commit type: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, …
- **Work in a git worktree, not in place.** Create the worktree in the **parent directory**, named `ai-fullstack-workflow-<branch-slug>` where `<branch-slug>` is the branch name with `/` → `-` (e.g. `feat/todo-filtering` → `ai-fullstack-workflow-feat-todo-filtering`). Base it off `origin/dev` so the tree starts clean.

```bash
git fetch origin
git worktree add -b feat/todo-filtering ../ai-fullstack-workflow-feat-todo-filtering origin/dev
cd ../ai-fullstack-workflow-feat-todo-filtering
```

- **Write a task doc** for the work at `docs/tasks/<branch-slug>-<yyyy-mmm-dd>.md` (lowercase 3-letter month, e.g. `feat-todo-filtering-2026-jun-02.md`) — capture the goal, scope, and plan there before implementing.
- After the PR merges, remove the worktree: `git worktree remove ../ai-fullstack-workflow-<branch-slug>`.

## Before committing

Run the same checks CI runs, from the repo root:

```bash
pnpm lint          # Biome (autofix with pnpm lint:fix)
pnpm check-types   # tsc --noEmit
pnpm build
```

## Commit

Conventional Commits, enforced by commitlint (commit-msg hook). Pre-commit hook also runs Biome on staged files.

```
<type>(<scope>): <summary>
```

- **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `style`, `revert`
- **Scopes** (required when applicable): `web`, `api`, `db`, `config`, `ci`, `deps`, `release`, `repo`

Add a changeset when the change should appear in a release/changelog:

```bash
pnpm changeset
```

## PR

```bash
git push -u origin feat/todo-filtering
gh pr create --fill
```

PRs target `dev`. CI must pass before merge: **Lint · Types · Build** and **commitlint** on every commit. The branch must be **up to date with `dev`** (strict checks) — rebase and push again if `dev` moved.

## Merge

- Squash merge only (`dev` requires linear history — merge commits are rejected).
- Resolve all review threads first; unresolved threads block merging.
- Delete the branch after merge.

```bash
gh pr merge <number> --squash --delete-branch
```

A merge to `dev` deploys the **dev** environment (`dev[-api].w3ctech.dev`).

## Production

`main` is production and takes **direct pushes** — no PR. Promote `dev` to `main`, then trigger the production deploy manually (`workflow_dispatch`):

```bash
git switch main && git pull
git merge --ff-only dev
git push          # then run the production deploy workflow (workflow_dispatch)
```

If a fast-forward isn't possible, reconcile on `dev` first — keep `main` a clean descendant of `dev`. See the `deploy` skill / `DEPLOYMENT.md` for the full environment model.

## Database changes

After editing a module's schema (`apps/api/src/modules/<name>/<name>.schema.ts`), run `pnpm db:generate` then `pnpm db:migrate`. Prefer the generate/migrate flow over `db:push` (interactive, needs a TTY, fails in scripts/CI).
