# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

When you make a change that should be released, add a changeset:

```bash
pnpm changeset
```

Pick the affected packages and a bump type (patch / minor / major), and write a
short summary. The summary lands in each package's `CHANGELOG.md`.

To version packages (consume changesets, bump versions, update changelogs):

```bash
pnpm changeset:version
```

To publish:

```bash
pnpm changeset:publish
```
