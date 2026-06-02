# Contributing

Thanks for contributing! This repo uses a protected `main` — all changes land
through pull requests that pass CI. The steps below mirror the rules enforced
by the `main` ruleset, so following them keeps your PR green.

## Prerequisites

- **Node 22** (pinned in `.nvmrc` — run `nvm use` / `fnm use`)
- **pnpm 10** (`corepack enable`)
- **Docker** (for the local Postgres database)

```bash
pnpm install
docker compose up -d db
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:migrate
pnpm dev
```

## Branch + PR workflow

`main` is protected: **no direct pushes**, a PR is required, and CI must pass.

1. **Branch off `main`.** Use a `type/short-description` name matching the
   commit type (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, …):

   ```bash
   git switch main && git pull
   git switch -c feat/todo-filtering
   ```

2. **Make your change**, then run the same checks CI runs:

   ```bash
   pnpm lint          # Biome (autofix with pnpm lint:fix)
   pnpm check-types   # tsc --noEmit
   pnpm build
   ```

3. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/)
   — enforced by commitlint via a git hook. The pre-commit hook also runs Biome
   on staged files.

   ```
   <type>(<scope>): <summary>
   ```

   - **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`,
     `build`, `ci`, `style`, `revert`
   - **Scopes** (required when applicable): `web`, `api`, `db`, `config`, `ci`,
     `deps`, `release`, `repo`

   ```bash
   git commit -m "feat(web): add todo filtering"
   ```

4. **Add a changeset** if your change should appear in a release / changelog:

   ```bash
   pnpm changeset
   ```

5. **Push and open a PR** against `main`:

   ```bash
   git push -u origin feat/todo-filtering
   gh pr create --fill
   ```

## What CI checks

Every PR must pass before it can merge:

- **Lint · Types · Build** — `pnpm lint`, `pnpm check-types`, `pnpm build`
- **Commit messages** — commitlint validates every commit in the PR

The branch must also be **up to date with `main`** (strict checks). If `main`
moved, rebase or update your branch and push again.

## Merging

- Merge via **squash** — `main` requires **linear history**, so merge commits
  are rejected.
- Unresolved review threads block merging; resolve them first.
- Delete the branch after merge.

```bash
gh pr merge <number> --squash --delete-branch
```

## Releasing

Versioning and changelogs are managed by [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset          # record intent during your PR
pnpm changeset:version  # bump versions + update CHANGELOGs
pnpm changeset:publish  # build + publish
```
