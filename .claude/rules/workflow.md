# Workflow rules

How changes land in this repo. `main` is protected — no direct pushes, PR required, CI must pass, linear history.

## Branch

- Always branch off an up-to-date `main`. Never commit directly to `main`.
- Name branches `type/short-description` matching the commit type: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, …

```bash
git switch main && git pull
git switch -c feat/todo-filtering
```

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

CI must pass before merge: **Lint · Types · Build** and **commitlint** on every commit. The branch must be **up to date with `main`** (strict checks) — rebase and push again if `main` moved.

## Merge

- Squash merge only (`main` requires linear history — merge commits are rejected).
- Resolve all review threads first; unresolved threads block merging.
- Delete the branch after merge.

```bash
gh pr merge <number> --squash --delete-branch
```

## Database changes

After editing `apps/api/src/db/schema.ts`, run `pnpm db:generate` then `pnpm db:migrate`. Prefer the generate/migrate flow over `db:push` (interactive, needs a TTY, fails in scripts/CI).
